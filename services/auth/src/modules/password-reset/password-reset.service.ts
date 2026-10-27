import type { User } from '@prisma/client';
import { describeDeliveryError, type EmailSender } from '../../infrastructure/email/email-sender.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { randomToken, sha256 } from '../../shared/utils/hashing.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import { loginAttemptKey, type LoginAttemptRepository } from '../authentication/login-attempt.repository.js';
import type { PasswordHasher } from '../authentication/password-hasher.js';
import type { IssuedSession, SessionService } from '../sessions/session.service.js';
import type { AccessTokenClaims } from '../tokens/token.types.js';
import type { UserRepository } from '../users/user.repository.js';
import { passwordChangedEmail, passwordResetEmail } from './password-reset-emails.js';
import type { PasswordResetRepository } from './password-reset.repository.js';

const TOKEN_TTL_MINUTES = 15;
const TOKEN_TTL_MS = TOKEN_TTL_MINUTES * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_EMAILS_PER_WINDOW = 3;

const INVALID_RESET_LINK ='This password reset link is invalid or has expired. Request a new one.';

const CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect';
const SESSION_REQUIRED = 'Your session has ended. Sign in again to change your password.';

export interface PasswordResetServiceDependencies {
  users: UserRepository;
  resets: PasswordResetRepository;
  loginAttempts: LoginAttemptRepository;
  passwords: PasswordHasher;
  sessions: SessionService;
  email: EmailSender;
  audit: AuditService;
  appBaseUrl: string;
  privacyStatementUrl: string | null;
  now: () => Date;
}


export class PasswordResetService {
  constructor(private readonly deps: PasswordResetServiceDependencies) {}

  async requestReset(email: string, context: RequestContext): Promise<void> {
    const user = await this.deps.users.findByEmail(email);
    if (!user) {
      await this.deps.audit.record(context, {
        action: 'auth.password_reset_requested',
        userId: null,
        meta: { emailFingerprint: this.deps.audit.emailFingerprint(email) },
      });
      return;
    }

    const now = this.deps.now();
    const token = randomToken();
    const created = await this.deps.resets.createWithinLimits(
      { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + TOKEN_TTL_MS), createdAt: now },
      new Date(now.getTime() - TOKEN_TTL_MS),
      (recent) => {
        const coolingDown =
          recent.latestCreatedAt !== null && now.getTime() - recent.latestCreatedAt.getTime() < RESEND_COOLDOWN_MS;
        return !coolingDown && recent.count < MAX_EMAILS_PER_WINDOW;
      },
    );
    if (!created) {
      await this.deps.audit.record(context, {
        action: 'auth.password_reset_requested',
        userId: user.id,
        meta: { throttled: true },
      });
      return;
    }
    await this.deps.audit.record(context, {
      action: 'auth.password_reset_requested',
      userId: user.id,
    });

    try {
      await this.deps.email.send(
        passwordResetEmail({
          to: user.email,
          resetUrl: `${this.deps.appBaseUrl}/reset-password#token=${token}`,
          validForMinutes: TOKEN_TTL_MINUTES,
          privacyStatementUrl: this.deps.privacyStatementUrl,
        }),
      );
    } catch (error) {
      // The token never left the server, so the stored hash is unusable; it simply expires.
      context.log.error(
        { userId: user.id, delivery: describeDeliveryError(error) },
        'password reset email could not be sent',
      );
      await this.deps.audit.record(context, {
        action: 'auth.password_reset_email_failed',
        userId: user.id,
      });
    }
  }

  async resetPassword(token: string, newPassword: string, context: RequestContext): Promise<void> {
    const record = await this.deps.resets.findByHash(sha256(token));
    const now = this.deps.now();
    if (record?.usedAt !== null || record.expiresAt <= now) {
      await this.deps.audit.record(context, {
        action: 'auth.password_reset_failed',
        userId: record?.userId ?? null,
      });
      throw new HttpError(400, INVALID_RESET_LINK);
    }

    const passwordHash = await this.deps.passwords.hash(newPassword);
    const completed = await this.deps.resets.completeReset({
      tokenId: record.id,
      userId: record.userId,
      passwordHash,
      now,
    });
    if (!completed) {
      await this.deps.audit.record(context, {
        action: 'auth.password_reset_failed',
        userId: record.userId,
      });
      throw new HttpError(400, INVALID_RESET_LINK);
    }
    await this.deps.audit.record(context, {
      action: 'auth.password_reset',
      userId: record.userId,
    });

    const user = await this.deps.users.findById(record.userId);
    if (!user) return;
    await this.deps.loginAttempts.clear(loginAttemptKey(user.email));
    void this.notifyPasswordChanged(user.id, user.email, now, context);
  }

  async changePassword(
    claims: AccessTokenClaims,
    user: User,
    currentPassword: string,
    newPassword: string,
    refreshToken: string | undefined,
    context: RequestContext,
  ): Promise<IssuedSession> {
    if (refreshToken === undefined || !(await this.deps.sessions.isLive(refreshToken, user.id))) {
      throw new HttpError(401, SESSION_REQUIRED);
    }

    if (!(await this.deps.passwords.verify(currentPassword, user.passwordHash))) {
      await this.deps.audit.record(context, {
        action: 'auth.password_change_failed',
        userId: user.id,
        workspaceId: claims.wid,
      });
      throw new HttpError(400, CURRENT_PASSWORD_INCORRECT, {
        details: { fieldErrors: { currentPassword: [CURRENT_PASSWORD_INCORRECT] } },
      });
    }

    const now = this.deps.now();
    const result = await this.deps.resets.changePassword({
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      expectedPasswordHash: user.passwordHash,
      passwordHash: await this.deps.passwords.hash(newPassword),
      now,
    });
    if (result.status === 'no-session') throw new HttpError(401, SESSION_REQUIRED);
    if (result.status === 'conflict') {
      throw new HttpError(409, 'Your password was changed by another request. Sign in again.');
    }
    await this.deps.audit.record(context, { action: 'auth.password_changed', userId: user.id, workspaceId: claims.wid });

    const session = await this.deps.sessions.issueInWorkspace(
      user.id,
      claims.wid,
      result.persistent,
      result.securityVersion,
    );
    void this.notifyPasswordChanged(user.id, user.email, now, context);
    return session;
  }

  private async notifyPasswordChanged(
    userId: string,
    email: string,
    changedAt: Date,
    context: RequestContext,
  ): Promise<void> {
    try {
      await this.deps.email.send(
        passwordChangedEmail({ to: email, changedAt, privacyStatementUrl: this.deps.privacyStatementUrl }),
      );
    } catch (error) {
      context.log.error(
        { userId, delivery: describeDeliveryError(error) },
        'password changed notice could not be sent',
      );
    }
  }
}
