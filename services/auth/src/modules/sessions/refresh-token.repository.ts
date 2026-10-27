import type { PrismaClient } from '@prisma/client';

export interface NewRefreshToken {
  userId: string;
  workspaceId: string | null;
  sessionId: string;
  tokenHash: string;
  persistent: boolean;
  expiresAt: Date;
  securityVersion: number;
}

export type ConsumeResult =
  | {
      status: 'consumed';
      userId: string;
      workspaceId: string | null;
      sessionId: string;
      persistent: boolean;
      securityVersion: number;
    }
  | { status: 'reused'; userId: string; workspaceId: string | null }
  | { status: 'superseded'; userId: string }

  | { status: 'invalid' };

export interface ClaimedSession {
  sessionId: string;
  persistent: boolean;
  securityVersion: number;
}

export interface RevokedSession {
  userId: string;
  workspaceId: string | null;
}

export interface RefreshTokenRepository {
  create(token: NewRefreshToken): Promise<void>;

  consume(tokenHash: string, now: Date): Promise<ConsumeResult>;

  revokeForUser(tokenHash: string, userId: string, now: Date): Promise<ClaimedSession | null>;
  findPersistence(tokenHash: string, userId: string, now: Date): Promise<boolean | null>;
  revoke(tokenHash: string, now: Date): Promise<RevokedSession | null>;
  /** True while the sign-in session still has an unrevoked, unexpired token; access tokens depend on it. */
  isSessionLive(sessionId: string, userId: string, now: Date): Promise<boolean>;
}

export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(token: NewRefreshToken): Promise<void> {
    await this.prisma.refreshToken.create({ data: token });
  }

  async consume(tokenHash: string, now: Date): Promise<ConsumeResult> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.expiresAt < now) return { status: 'invalid' };

    if (stored.revokedAt === null && !(await this.isCurrentVersion(stored.userId, stored.securityVersion))) {
      await this.prisma.refreshToken.updateMany({ where: { id: stored.id, revokedAt: null }, data: { revokedAt: now } });
      return { status: 'invalid' };
    }

    const { count } =
      stored.revokedAt === null
        ? await this.prisma.refreshToken.updateMany({
            where: { id: stored.id, revokedAt: null },
            data: { revokedAt: now, rotated: true },
          })
        : { count: 0 };

    if (count === 1) {
      return {
        status: 'consumed',
        userId: stored.userId,
        workspaceId: stored.workspaceId,
        sessionId: stored.sessionId,
        persistent: stored.persistent,
        securityVersion: stored.securityVersion,
      };
    }

    const current = await this.prisma.refreshToken.findUnique({ where: { id: stored.id } });
    if (!current?.rotated) return { status: 'invalid' };

    if (stored.revokedAt === null) return { status: 'superseded', userId: stored.userId };

    // Suspected theft: end every session and move the security version, which also rejects any access
    // token or half-finished sign-in the holder of the stolen token may already have.
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { securityVersion: { increment: 1 } },
      }),
    ]);
    return { status: 'reused', userId: stored.userId, workspaceId: stored.workspaceId };
  }

  async revokeForUser(tokenHash: string, userId: string, now: Date): Promise<ClaimedSession | null> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored?.userId !== userId) return null;
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null, expiresAt: { gt: now } },
      data: { revokedAt: now },
    });
    if (count !== 1 || !(await this.isCurrentVersion(userId, stored.securityVersion))) return null;
    return { sessionId: stored.sessionId, persistent: stored.persistent, securityVersion: stored.securityVersion };
  }
  
  private async isCurrentVersion(userId: string, securityVersion: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { securityVersion: true } });
    return user?.securityVersion === securityVersion;
  }

  async findPersistence(tokenHash: string, userId: string, now: Date): Promise<boolean | null> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored?.userId !== userId || stored.revokedAt !== null || stored.expiresAt <= now) return null;
    return stored.persistent;
  }

  async revoke(tokenHash: string, now: Date): Promise<RevokedSession | null> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) return null;
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: now },
    });
    return count === 1 ? { userId: stored.userId, workspaceId: stored.workspaceId } : null;
  }

  async isSessionLive(sessionId: string, userId: string, now: Date): Promise<boolean> {
    const live = await this.prisma.refreshToken.findFirst({
      where: { sessionId, userId, revokedAt: null, expiresAt: { gt: now } },
      select: { id: true },
    });
    return live !== null;
  }
}
