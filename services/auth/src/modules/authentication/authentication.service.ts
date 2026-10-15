import { HttpError } from '../../shared/errors/http-error.js';
import type { MfaChallengeResponse, MfaSetupResponse } from '../../shared/types/api.types.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import type { MfaSecretCipher } from '../mfa/mfa-secret.cipher.js';
import type { MfaService } from '../mfa/mfa.service.js';
import type { IssuedSession, SessionService } from '../sessions/session.service.js';
import type { TokenService } from '../tokens/token.service.js';
import type { UserRepository } from '../users/user.repository.js';
import type { LoginInput, RegisterInput } from './authentication.types.js';
import type { PasswordHasher } from './password-hasher.js';

export interface AuthenticationServiceDependencies {
  users: UserRepository;
  passwords: PasswordHasher;
  tokens: TokenService;
  mfa: MfaService;
  mfaCipher: MfaSecretCipher;
  sessions: SessionService;
  audit: AuditService;
  allowSelfRegister: boolean;
}

/**
 * Two-step sign-in. Step 1 (register/login) checks the password and returns only an MFA
 * challenge token. Step 2 (/mfa/verify) checks a TOTP code and issues the session.
 */
export class AuthenticationService {
  constructor(private readonly deps: AuthenticationServiceDependencies) {}

  async register({ email, password }: RegisterInput, context: RequestContext): Promise<MfaChallengeResponse> {
    if (!this.deps.allowSelfRegister) throw new HttpError(403, 'Self-registration is disabled');
    if (await this.deps.users.findByEmail(email)) throw new HttpError(409, 'Email already registered');
    const user = await this.deps.users.create({ email, passwordHash: await this.deps.passwords.hash(password) });
    // null: a concurrent request registered the same email between the check and the insert.
    if (!user) throw new HttpError(409, 'Email already registered');
    this.deps.audit.record(context, { action: 'auth.register', userId: user.id });
    return { mfaRequired: true, mfaSetupRequired: true, mfaToken: this.deps.tokens.signMfaToken(user.id) };
  }

  async login({ email, password }: LoginInput, context: RequestContext): Promise<MfaChallengeResponse> {
    const user = await this.deps.users.findByEmail(email);
    const passwordMatches = await this.deps.passwords.verify(password, user?.passwordHash);
    if (!user || !passwordMatches) {
      this.deps.audit.record(context, { action: 'auth.login_failed', userId: user?.id ?? null, meta: { email } });
      throw new HttpError(401, 'Invalid email or password');
    }
    return {
      mfaRequired: true,
      mfaSetupRequired: !user.mfaEnabled,
      mfaToken: this.deps.tokens.signMfaToken(user.id),
    };
  }

  /** First sign-in only: generates a TOTP secret and stores it encrypted until a code confirms it. */
  async startMfaSetup(userId: string): Promise<MfaSetupResponse> {
    const user = await this.deps.users.findById(userId);
    if (!user) throw new HttpError(401, 'Account not found');
    if (user.mfaEnabled) throw new HttpError(409, 'MFA is already enabled');
    const enrolment = await this.deps.mfa.createEnrolment(user.email);
    await this.deps.users.setMfaSecret(user.id, this.deps.mfaCipher.encrypt(enrolment.secret));
    return { otpauthUrl: enrolment.otpauthUrl, qrDataUrl: enrolment.qrDataUrl };
  }

  /** Checks the TOTP code, completes enrolment if needed, and issues a session in the oldest workspace. */
  async verifyMfa(userId: string, code: string, context: RequestContext): Promise<IssuedSession> {
    const user = await this.deps.users.findByIdWithMemberships(userId);
    if (!user) throw new HttpError(401, 'Account not found');
    if (!user.mfaSecret) throw new HttpError(400, 'MFA setup has not been started');

    const step = this.deps.mfa.verifyCode(code, this.deps.mfaCipher.decrypt(user.mfaSecret));
    if (step === null) {
      this.deps.audit.record(context, { action: 'auth.mfa_failed', userId: user.id });
      throw new HttpError(401, 'Invalid code');
    }
    if (!(await this.deps.users.claimTotpStep(user.id, step))) {
      this.deps.audit.record(context, { action: 'auth.mfa_failed', userId: user.id, meta: { reason: 'replay' } });
      throw new HttpError(401, 'Invalid code');
    }

    if (!user.mfaEnabled) {
      await this.deps.users.enableMfa(user.id);
      this.deps.audit.record(context, { action: 'auth.mfa_enrolled', userId: user.id });
    }
    this.deps.audit.record(context, { action: 'auth.login', userId: user.id });
    return this.deps.sessions.issue(user.id, user.memberships[0] ?? null);
  }
}
