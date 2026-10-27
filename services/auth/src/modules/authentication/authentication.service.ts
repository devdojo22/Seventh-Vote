import { OtpPurpose, type User } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import {
  ACCOUNT_CREDENTIAL_FAILURE_LIMIT,
  ACCOUNT_CREDENTIAL_WINDOW_MS,
  TOO_MANY_REQUESTS_MESSAGE,
} from '../../shared/middleware/rate-limit.js';
import type { ErrorCode, MfaChallengeResponse } from '../../shared/types/api.types.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import {
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  OtpDeliveryError,
  OtpSendCapError,
  SIGN_IN_ENDED,
  type EmailOtpService,
  type OtpRejection,
} from '../mfa/email-otp.service.js';
import type { IssuedSession, SessionService } from '../sessions/session.service.js';
import type { TokenService } from '../tokens/token.service.js';
import type { MfaTokenClaims } from '../tokens/token.types.js';
import type { UserRepository } from '../users/user.repository.js';
import type { LoginInput } from './authentication.types.js';
import { loginAttemptKey, type LoginAttemptRepository } from './login-attempt.repository.js';
import type { PasswordHasher } from './password-hasher.js';

const DELIVERY_FAILED = 'We could not send the verification email. Please try again.';
const TOO_MANY_CODES = 'Too many codes requested. Try again later.';

const REJECTIONS: Record<OtpRejection, { status: number; message: string; code?: ErrorCode }> = {
  'invalid-code': { status: 401, message: 'Invalid code', code: 'invalid_code' },
  'no-longer-valid': {
    status: 410,
    message: 'This code has expired or was replaced. Request a new code.',
  },
  'too-many-attempts': {
    status: 429,
    message: 'Too many incorrect codes. Request a new code.',
    code: 'too_many_attempts',
  },
};

export interface AuthenticationServiceDependencies {
  users: UserRepository;
  passwords: PasswordHasher;
  tokens: TokenService;
  otp: EmailOtpService;
  sessions: SessionService;
  audit: AuditService;
  loginAttempts: LoginAttemptRepository;
  now: () => Date;
}


export class AuthenticationService {
  constructor(private readonly deps: AuthenticationServiceDependencies) {}


  async login({ email, password, remember }: LoginInput, context: RequestContext): Promise<MfaChallengeResponse> {
    const attemptKey = loginAttemptKey(email);
    const attempts = await this.deps.loginAttempts.count(attemptKey, this.deps.now(), ACCOUNT_CREDENTIAL_WINDOW_MS);
    if (attempts > ACCOUNT_CREDENTIAL_FAILURE_LIMIT) {
      await this.deps.audit.record(context, {
        action: 'auth.login_throttled',
        userId: null,
        meta: { emailFingerprint: this.deps.audit.emailFingerprint(email) },
      });
      throw new HttpError(429, TOO_MANY_REQUESTS_MESSAGE);
    }
    const user = await this.deps.users.findByEmail(email);
    const passwordMatches = await this.deps.passwords.verify(password, user?.passwordHash);
    if (!user || !passwordMatches) {
      await this.deps.audit.record(context, {
        action: 'auth.login_failed',
        userId: user?.id ?? null,
        ...(user ? {} : { meta: { emailFingerprint: this.deps.audit.emailFingerprint(email) } }),
      });
      throw new HttpError(401, 'Invalid email or password');
    }
    await this.deps.loginAttempts.clear(attemptKey);
    
    const challengeId =
      (await this.sendCode(user, OtpPurpose.LOGIN, context, { enforceCooldown: false })) ??
      (await this.deps.otp.findLatestLive(user.id, OtpPurpose.LOGIN));
    if (challengeId === null) throw new HttpError(429, TOO_MANY_CODES);
    return this.challengeResponse(user.id, challengeId, OtpPurpose.LOGIN, remember, user.securityVersion);
  }

  async resendCode(claims: MfaTokenClaims, context: RequestContext): Promise<MfaChallengeResponse> {
    const user = await this.deps.users.findById(claims.sub);
    if (!user) throw new HttpError(401, 'Account not found');
    await this.assertSignInCurrent(user, claims, context);
    const challengeId = await this.sendCode(user, claims.pur, context, {
      enforceCooldown: true,
      replaces: claims.cid,
    });
    if (challengeId === null) throw new HttpError(429, TOO_MANY_CODES);
    return this.challengeResponse(user.id, challengeId, claims.pur, claims.rem, claims.sv);
  }

  async verifyCode(claims: MfaTokenClaims, code: string, context: RequestContext): Promise<IssuedSession> {
    const user = await this.deps.users.findByIdWithMemberships(claims.sub);
    if (!user) throw new HttpError(401, 'Account not found');
    await this.assertSignInCurrent(user, claims, context);

    const result = await this.deps.otp.verify({
      userId: user.id,
      challengeId: claims.cid,
      purpose: claims.pur,
      code,
    });
    if (!result.ok) {
      await this.deps.audit.record(context, {
        action: 'auth.mfa_failed',
        userId: user.id,
        meta: { purpose: claims.pur, reason: result.reason },
      });
      const { status, message, code } = REJECTIONS[result.reason];
      throw new HttpError(status, message, { code });
    }

    if (user.emailVerifiedAt === null) {
      await this.deps.users.markEmailVerified(user.id, this.deps.now());
      await this.deps.audit.record(context, {
        action: 'auth.email_verified',
        userId: user.id,
      });
    }
    await this.deps.audit.record(context, {
      action: 'auth.login',
      userId: user.id,
      workspaceId: user.memberships[0]?.workspaceId ?? null,
    });
    return this.deps.sessions.issue(user.id, user.memberships[0] ?? null, claims.rem, claims.sv);
  }

  private async sendCode(
    user: User,
    purpose: OtpPurpose,
    context: RequestContext,
    options: { enforceCooldown: boolean; replaces?: string },
  ): Promise<string | null> {
    try {
      const challengeId = await this.deps.otp.issue(user, purpose, context, options);
      await this.deps.audit.record(context, {
        action: 'auth.otp_sent',
        userId: user.id,
        meta: { purpose },
      });
      return challengeId;
    } catch (error) {
      if (error instanceof OtpSendCapError) return null;
      if (!(error instanceof OtpDeliveryError)) throw error;
      await this.deps.audit.record(context, {
        action: 'auth.otp_send_failed',
        userId: user.id,
        meta: { purpose },
      });
      throw new HttpError(503, DELIVERY_FAILED);
    }
  }


  private async assertSignInCurrent(user: User, claims: MfaTokenClaims, context: RequestContext): Promise<void> {
    if (claims.sv === user.securityVersion) return;
    await this.deps.audit.record(context, {
      action: 'auth.mfa_failed',
      userId: user.id,
      meta: { purpose: claims.pur, reason: 'stale-token' },
    });
    throw new HttpError(401, SIGN_IN_ENDED);
  }

  private challengeResponse(
    userId: string,
    challengeId: string,
    purpose: OtpPurpose,
    rememberDevice: boolean,
    securityVersion: number,
  ): MfaChallengeResponse {
    return {
      mfaRequired: true,
      mfaToken: this.deps.tokens.signMfaToken({
        userId,
        challengeId,
        purpose,
        rememberDevice,
        securityVersion,
        ttlSeconds: OTP_TTL_SECONDS,
      }),
      resendAfterSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }
}
