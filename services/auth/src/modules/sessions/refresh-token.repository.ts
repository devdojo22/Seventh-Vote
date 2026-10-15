import type { PrismaClient } from '@prisma/client';

export interface NewRefreshToken {
  userId: string;
  workspaceId: string | null;
  tokenHash: string;
  expiresAt: Date;
}

/** Outcome of presenting a refresh token for rotation. */
export type ConsumeResult =
  /** The token was live and is now revoked; the caller issues its replacement. */
  | { status: 'consumed'; userId: string; workspaceId: string | null }
  /** The token had already been used. Every session of the user has been revoked. */
  | { status: 'reused'; userId: string }
  /** Unknown or expired. */
  | { status: 'invalid' };

export interface RefreshTokenRepository {
  create(token: NewRefreshToken): Promise<void>;
  /** Atomically marks a live token as used. A second presentation of the same token is reported as reuse. */
  consume(tokenHash: string, now: Date): Promise<ConsumeResult>;
  /** Revokes one token, but only if it belongs to `userId`. */
  revokeForUser(tokenHash: string, userId: string, now: Date): Promise<void>;
  revoke(tokenHash: string, now: Date): Promise<void>;
}

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: NewRefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({ data: token });
  }

  async consume(tokenHash: string, now: Date): Promise<ConsumeResult> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.expiresAt < now) return { status: 'invalid' };

    // Conditional UPDATE: of two concurrent requests with the same token, exactly one sees count === 1.
    const { count } =
      stored.revokedAt === null
        ? await this.prisma.refreshToken.updateMany({
            where: { id: stored.id, revokedAt: null },
            data: { revokedAt: now },
          })
        : { count: 0 };

    if (count === 1) return { status: 'consumed', userId: stored.userId, workspaceId: stored.workspaceId };

    await this.prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: now },
    });
    return { status: 'reused', userId: stored.userId };
  }

  async revokeForUser(tokenHash: string, userId: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }

  async revoke(tokenHash: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({ where: { tokenHash, revokedAt: null }, data: { revokedAt: now } });
  }
}
