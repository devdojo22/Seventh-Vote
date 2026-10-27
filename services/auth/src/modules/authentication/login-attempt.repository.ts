import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sha256 } from '../../shared/utils/hashing.js';


export function loginAttemptKey(email: string, ip: string | null): string {
  return sha256(`${email}\n${ip ?? ''}`);
}

export interface LoginAttemptRepository {

  count(keyHash: string, now: Date, windowMs: number): Promise<number>;
  clear(keyHash: string): Promise<void>;
}

const countResultSchema = z.array(z.object({ attempts: z.number().int() }));

export class PrismaLoginAttemptRepository implements LoginAttemptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async count(keyHash: string, now: Date, windowMs: number): Promise<number> {
    const windowStartedBefore = new Date(now.getTime() - windowMs);
    const [row] = countResultSchema.parse(
      await this.prisma.$queryRaw`
        INSERT INTO "login_attempts" ("key_hash", "attempts", "window_started_at")
        VALUES (${keyHash}, 1, ${now}::timestamptz)
        ON CONFLICT ("key_hash") DO UPDATE SET
          "attempts" = CASE WHEN "login_attempts"."window_started_at" <= ${windowStartedBefore}::timestamptz
            THEN 1 ELSE "login_attempts"."attempts" + 1 END,
          "window_started_at" = CASE WHEN "login_attempts"."window_started_at" <= ${windowStartedBefore}::timestamptz
            THEN ${now}::timestamptz ELSE "login_attempts"."window_started_at" END
        RETURNING "attempts"`,
    );
    if (!row) throw new Error('login attempt count returned no row');
    return row.attempts;
  }

  async clear(keyHash: string): Promise<void> {
    await this.prisma.loginAttempt.deleteMany({ where: { keyHash } });
  }
}
