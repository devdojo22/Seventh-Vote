import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { OtpPurpose } from '@prisma/client';
import { describeDeliveryError, isDefinitelyUndelivered, type EmailSender } from '../../infrastructure/email/email-sender.js';
import { HttpError } from '../../shared/errors/http-error.js';
import type { RequestContext } from '../audit/audit.service.js';
import type { EmailOtpChallengeRepository } from './email-otp.repository.js';
import { verificationEmail } from './verification-email.js';

export const OTP_LENGTH = 8;
const OTP_TTL_MINUTES = 30;
export const OTP_TTL_SECONDS = OTP_TTL_MINUTES * 60;
const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_SENDS_PER_WINDOW = 5;
const OTP_SEND_WINDOW_MS = OTP_TTL_SECONDS * 1000;

export const SIGN_IN_ENDED = 'This sign-in attempt has ended. Sign in again.';

export type OtpRejection = 'invalid-code' | 'no-longer-valid' | 'too-many-attempts';
export type OtpVerification = { ok: true } | { ok: false; reason: OtpRejection };

export class OtpDeliveryError extends Error {
  override readonly name = 'OtpDeliveryError';
}

export class OtpSendCapError extends Error {
  override readonly name = 'OtpSendCapError';
}

export interface OtpRecipient {
  id: string;
  email: string;
}

export interface OtpCheck {
  userId: string;
  challengeId: string;
  purpose: OtpPurpose;
  code: string;
}

export interface EmailOtpServiceDependencies {
  challenges: EmailOtpChallengeRepository;
  email: EmailSender;
  hmacKey: string;
  privacyStatementUrl: string | null;
  now: () => Date;
}

export class EmailOtpService {
  constructor(private readonly deps: EmailOtpServiceDependencies) {}

  async issue(
    recipient: OtpRecipient,
    purpose: OtpPurpose,
    context: RequestContext,
    { enforceCooldown, replaces }: { enforceCooldown: boolean; replaces?: string },
  ): Promise<string> {
    const now = this.deps.now();
    const id = randomUUID();
    const code = randomInt(0, 10 ** OTP_LENGTH)
      .toString()
      .padStart(OTP_LENGTH, '0');
    const challenge = {
      id,
      userId: recipient.id,
      purpose,
      codeHash: this.hash(id, recipient.id, purpose, code),
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
      createdAt: now,
    };
    await this.deps.challenges.createWithinLimits(
      challenge,
      new Date(now.getTime() - OTP_SEND_WINDOW_MS),
      (recent) => {
        if (recent.replacedIsLive === false) throw new HttpError(401, SIGN_IN_ENDED);
        if (enforceCooldown && recent.latestCreatedAt !== null) {
          const waitMs = recent.latestCreatedAt.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000 - now.getTime();
          if (waitMs > 0) {
            throw new HttpError(429, 'Please wait before requesting another code', {
              code: 'resend_cooldown',
              details: { retryAfterSeconds: Math.ceil(waitMs / 1000) },
            });
          }
        }
        if (recent.count >= OTP_MAX_SENDS_PER_WINDOW) throw new OtpSendCapError('Send cap reached');
      },
      replaces,
    );

    try {
      await this.deps.email.send(
        verificationEmail({
          to: recipient.email,
          code,
          validForMinutes: OTP_TTL_MINUTES,
          privacyStatementUrl: this.deps.privacyStatementUrl,
        }),
      );
    } catch (error) {

      const undelivered = isDefinitelyUndelivered(error);
      try {
        if (undelivered) await this.deps.challenges.markUndelivered(id, now);
        else await this.deps.challenges.revoke(id, now);
      } catch (revokeError) {
        context.log.error({ err: revokeError, challengeId: id }, 'unsent code could not be revoked');
      }
      context.log.error(
        {
          userId: recipient.id,
          purpose,
          delivery: describeDeliveryError(error),
          quotaRefunded: undelivered,
        },
        'verification email could not be sent',
      );
      throw new OtpDeliveryError('Verification email was not accepted for delivery');
    }

    await this.deps.challenges.revokeOlder(challenge, now);
    return id;
  }

  async findLatestLive(userId: string, purpose: OtpPurpose): Promise<string | null> {
    const challenge = await this.deps.challenges.findLatestLive(userId, purpose, this.deps.now(), OTP_MAX_ATTEMPTS);
    return challenge?.id ?? null;
  }

  async verify({ userId, challengeId, purpose, code }: OtpCheck): Promise<OtpVerification> {
    const now = this.deps.now();
    const challenge = await this.deps.challenges.findById(challengeId);
    if (challenge?.userId !== userId || challenge.purpose !== purpose) {
      return { ok: false, reason: 'no-longer-valid' };
    }

    if (!(await this.deps.challenges.claimAttempt(challengeId, now, OTP_MAX_ATTEMPTS))) {
      const current = await this.deps.challenges.findById(challengeId);
      const exhausted =
        current !== null &&
        current.consumedAt === null &&
        current.revokedAt === null &&
        current.expiresAt > now &&
        current.attempts >= OTP_MAX_ATTEMPTS;
      return {
        ok: false,
        reason: exhausted ? 'too-many-attempts' : 'no-longer-valid',
      };
    }

    if (!this.matches(challenge.codeHash, this.hash(challengeId, userId, purpose, code))) {
      return { ok: false, reason: 'invalid-code' };
    }
    if (!(await this.deps.challenges.consume(challengeId, now))) return { ok: false, reason: 'no-longer-valid' };
    return { ok: true };
  }

  private hash(challengeId: string, userId: string, purpose: OtpPurpose, code: string): string {
    return createHmac('sha256', this.deps.hmacKey).update(`${challengeId}:${userId}:${purpose}:${code}`).digest('hex');
  }

  private matches(storedHex: string, candidateHex: string): boolean {
    const stored = Buffer.from(storedHex, 'hex');
    const candidate = Buffer.from(candidateHex, 'hex');
    return stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }
}
