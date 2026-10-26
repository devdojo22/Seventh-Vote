import type { EmailOtpChallenge, OtpPurpose, PrismaClient } from '@prisma/client';

export interface NewEmailOtpChallenge {
  id: string;
  userId: string;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export type ChallengeOrder = Pick<NewEmailOtpChallenge, 'id' | 'userId' | 'purpose' | 'createdAt'>;

export interface RecentChallenges {
  count: number;
  latestCreatedAt: Date | null;
  replacedIsLive: boolean | null;
}

export interface EmailOtpChallengeRepository {
  createWithinLimits(
    challenge: NewEmailOtpChallenge,
    since: Date,
    guard: (recent: RecentChallenges) => void,
    replacesId?: string,
  ): Promise<void>;
  findById(id: string): Promise<EmailOtpChallenge | null>;
  findLatestLive(userId: string, purpose: OtpPurpose, now: Date, maxAttempts: number): Promise<EmailOtpChallenge | null>;

  claimAttempt(id: string, now: Date, maxAttempts: number): Promise<boolean>;
  consume(id: string, now: Date): Promise<boolean>;
  revoke(id: string, now: Date): Promise<void>;

  markUndelivered(id: string, now: Date): Promise<void>;

  revokeOlder(challenge: ChallengeOrder, now: Date): Promise<void>;
}

export class PrismaEmailOtpChallengeRepository implements EmailOtpChallengeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createWithinLimits(
    challenge: NewEmailOtpChallenge,
    since: Date,
    guard: (recent: RecentChallenges) => void,
    replacesId?: string,
  ): Promise<void> {
    const { userId, purpose, createdAt: now } = challenge;
    await this.prisma.$transaction(async (tx) => {

      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`email-otp:${userId}:${purpose}`}))`;
      const result = await tx.emailOtpChallenge.aggregate({
        where: { userId, purpose, createdAt: { gte: since }, deliveryFailedAt: null },
        _count: { _all: true },
        _max: { createdAt: true },
      });
      const replaced =
        replacesId === undefined
          ? null
          : await tx.emailOtpChallenge.findFirst({
              where: { id: replacesId, userId, purpose, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
              select: { id: true },
            });
      guard({
        count: result._count._all,
        latestCreatedAt: result._max.createdAt,
        replacedIsLive: replacesId === undefined ? null : replaced !== null,
      });
      await tx.emailOtpChallenge.create({ data: challenge });
    });
  }

  findById(id: string): Promise<EmailOtpChallenge | null> {
    return this.prisma.emailOtpChallenge.findUnique({ where: { id } });
  }

  findLatestLive(userId: string, purpose: OtpPurpose, now: Date, maxAttempts: number): Promise<EmailOtpChallenge | null> {
    return this.prisma.emailOtpChallenge.findFirst({
      where: {
        userId,
        purpose,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: maxAttempts },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async claimAttempt(id: string, now: Date, maxAttempts: number): Promise<boolean> {
    const { count } = await this.prisma.emailOtpChallenge.updateMany({
      where: {
        id,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: maxAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    return count === 1;
  }

  async consume(id: string, now: Date): Promise<boolean> {
    const { count } = await this.prisma.emailOtpChallenge.updateMany({
      where: { id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { consumedAt: now },
    });
    return count === 1;
  }

  async revoke(id: string, now: Date): Promise<void> {
    await this.prisma.emailOtpChallenge.updateMany({
      where: { id, consumedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async markUndelivered(id: string, now: Date): Promise<void> {
    await this.prisma.emailOtpChallenge.updateMany({
      where: { id, consumedAt: null },
      data: { revokedAt: now, deliveryFailedAt: now },
    });
  }

  async revokeOlder({ id, userId, purpose, createdAt }: ChallengeOrder, now: Date): Promise<void> {
    await this.prisma.emailOtpChallenge.updateMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
        revokedAt: null,
        OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }],
      },
      data: { revokedAt: now },
    });
  }
}
