import { OtpPurpose, type PasswordResetToken, type Prisma, type PrismaClient } from '@prisma/client';

export interface NewPasswordResetToken {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface RecentResetTokens {
  count: number;
  latestCreatedAt: Date | null;
}

export interface CompletedReset {
  tokenId: string;
  userId: string;
  passwordHash: string;
  now: Date;
}

export interface ChangedPassword {
  userId: string;
  refreshTokenHash: string;
  expectedPasswordHash: string;
  passwordHash: string;
  now: Date;
}

export type PasswordChangeResult =

  | { status: 'changed'; persistent: boolean; securityVersion: number }
  | { status: 'no-session' }
  | { status: 'conflict' };

class PasswordChangeConflict extends Error {}

export interface PasswordResetRepository {
  createWithinLimits(
    token: NewPasswordResetToken,
    since: Date,
    allow: (recent: RecentResetTokens) => boolean,
  ): Promise<boolean>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;

  completeReset(reset: CompletedReset): Promise<boolean>;
  changePassword(change: ChangedPassword): Promise<PasswordChangeResult>;
}

async function revokeAccessAfterPasswordChange(tx: Prisma.TransactionClient, userId: string, now: Date): Promise<void> {
  await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } });
  await tx.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: now } });
  await tx.emailOtpChallenge.updateMany({
    where: { userId, purpose: OtpPurpose.LOGIN, consumedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
}

export class PrismaPasswordResetRepository implements PasswordResetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  createWithinLimits(
    token: NewPasswordResetToken,
    since: Date,
    allow: (recent: RecentResetTokens) => boolean,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`password-reset:${token.userId}`}))`;
      const result = await tx.passwordResetToken.aggregate({
        where: { userId: token.userId, createdAt: { gte: since } },
        _count: { _all: true },
        _max: { createdAt: true },
      });
      if (!allow({ count: result._count._all, latestCreatedAt: result._max.createdAt })) return false;
      await tx.passwordResetToken.create({ data: token });
      return true;
    });
  }

  findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  }

  completeReset({ tokenId, userId, passwordHash, now }: CompletedReset): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: tokenId, userId, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (count !== 1) return false;

      await tx.user.update({
        where: { id: userId },
        data: { passwordHash, passwordChangedAt: now, securityVersion: { increment: 1 } },
      });
      await revokeAccessAfterPasswordChange(tx, userId, now);
      return true;
    });
  }

  async changePassword(change: ChangedPassword): Promise<PasswordChangeResult> {
    const { userId, refreshTokenHash, expectedPasswordHash, passwordHash, now } = change;
    try {
      return await this.prisma.$transaction(async (tx): Promise<PasswordChangeResult> => {
        const session = await tx.refreshToken.findUnique({ where: { tokenHash: refreshTokenHash } });
        const { count: claimed } = await tx.refreshToken.updateMany({
          where: { tokenHash: refreshTokenHash, userId, revokedAt: null, expiresAt: { gt: now } },
          data: { revokedAt: now },
        });
        if (claimed !== 1 || !session) return { status: 'no-session' };

        const { count } = await tx.user.updateMany({
          where: { id: userId, passwordHash: expectedPasswordHash },
          data: { passwordHash, passwordChangedAt: now, securityVersion: { increment: 1 } },
        });
        if (count !== 1) throw new PasswordChangeConflict();
        await revokeAccessAfterPasswordChange(tx, userId, now);
        const { securityVersion } = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: { securityVersion: true },
        });
        return { status: 'changed', persistent: session.persistent, securityVersion };
      });
    } catch (error) {
      if (error instanceof PasswordChangeConflict) return { status: 'conflict' };
      throw error;
    }
  }
}
