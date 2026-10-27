import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sha256 } from '../../shared/utils/hashing.js';


export function loginAttemptKey(email: string): string {
  return sha256(email);
}

export interface AttemptWindow {
  attempts: number;
  windowStartedAt: Date;
}


export interface LoginAttemptRepository {
  hit(keyHash: string, now: Date, windowMs: number): Promise<AttemptWindow>;
  count(keyHash: string, now: Date, windowMs: number): Promise<number>;
  undo(keyHash: string): Promise<void>;
  clear(keyHash: string): Promise<void>;
}

const hitResultSchema = z.array(z.object({ attempts: z.number().int(), window_started_at: z.date() }));

export class PrismaLoginAttemptRepository implements LoginAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async hit(keyHash: string, now: Date, windowMs: number): Promise<AttemptWindow> {
    const windowStartedBefore = new Date(now.getTime() - windowMs);
    const [row] = hitResultSchema.parse(
      await this.prisma.$queryRaw`
        INSERT INTO "login_attempts" ("key_hash", "attempts", "window_started_at")
        VALUES (${keyHash}, 1, ${now}::timestamptz)
        ON CONFLICT ("key_hash") DO UPDATE SET
          "attempts" = CASE WHEN "login_attempts"."window_started_at" <= ${windowStartedBefore}::timestamptz
            THEN 1 ELSE "login_attempts"."attempts" + 1 END,
          "window_started_at" = CASE WHEN "login_attempts"."window_started_at" <= ${windowStartedBefore}::timestamptz
            THEN ${now}::timestamptz ELSE "login_attempts"."window_started_at" END
        RETURNING "attempts", "window_started_at"`,
    );
    if (!row) throw new Error('login attempt count returned no row');
    return { attempts: row.attempts, windowStartedAt: row.window_started_at };
  }

  async count(keyHash: string, now: Date, windowMs: number): Promise<number> {
    return (await this.hit(keyHash, now, windowMs)).attempts;
  }

  async undo(keyHash: string): Promise<void> {
    await this.prisma.loginAttempt.updateMany({
      where: { keyHash, attempts: { gt: 0 } },
      data: { attempts: { decrement: 1 } },
    });
  }

  async clear(keyHash: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({ where: { keyHash } });
  }
}
