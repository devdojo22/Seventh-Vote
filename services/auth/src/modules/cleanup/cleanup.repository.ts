import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { ACCOUNT_CREDENTIAL_WINDOW_MS } from '../../shared/middleware/rate-limit.js';

export interface CleanupCounts {
  refreshTokens: number;
  passwordResetTokens: number;
  emailOtpChallenges: number;
  invitations: number;
  loginAttempts: number;
}

export interface CleanupRepository {

  run(now: Date): Promise<CleanupCounts | null>;
}

const lockResultSchema = z.array(z.object({ locked: z.boolean() }));
const TRANSACTION_TIMEOUT_MS = 120_000;

export class PrismaCleanupRepository implements CleanupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  run(now: Date): Promise<CleanupCounts | null> {
    return this.prisma.$transaction(
      async (tx) => {
        // Transaction-scoped advisory lock: released automatically on commit or rollback.
        const [lock] = lockResultSchema.parse(
          await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(hashtext('seventh-vote.auth.cleanup')) AS locked`,
        );
        if (!lock?.locked) return null;

        // Each is one filtered DELETE served by the expires_at indexes; nothing is loaded into memory.
        // Revoked but unexpired refresh tokens are kept on purpose: reuse detection needs them until they
        // expire, after which a missing token and an expired one get the same answer.
        const refreshTokens = await tx.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } });
        const passwordResetTokens = await tx.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } });
        const emailOtpChallenges = await tx.emailOtpChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
        // Acceptances and revocations are recorded in the audit log, so expired rows carry nothing further.
        const invitations = await tx.invitation.deleteMany({ where: { expiresAt: { lt: now } } });
        // A passed window counts nothing: the next sign-in attempt would start a new one anyway.
        const loginAttempts = await tx.loginAttempt.deleteMany({
          where: { windowStartedAt: { lte: new Date(now.getTime() - ACCOUNT_CREDENTIAL_WINDOW_MS) } },
        });

        return {
          refreshTokens: refreshTokens.count,
          passwordResetTokens: passwordResetTokens.count,
          emailOtpChallenges: emailOtpChallenges.count,
          invitations: invitations.count,
          loginAttempts: loginAttempts.count,
        };
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }
}
