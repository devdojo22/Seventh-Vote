import type { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sha256 } from '../../shared/utils/hashing.js';

/**
 * One counter per address and client IP. Keyed on the address alone, anyone who knows it could shut its
 * owner out of sign-in from anywhere; per IP, only the owner's own failures throttle them, while
 * loginFailuresByIp still bounds what one client may try across addresses.
 */
export function loginAttemptKey(email: string, ip: string | null): string {
  return sha256(`${email}\n${ip ?? ''}`);
}

export interface LoginAttemptRepository {
  /**
   * Counts one password check for `keyHash` and returns how many its current window now holds, this one
   * included. A window lasts `windowMs` from its first attempt; the first attempt after that starts a new one.
   * One atomic statement, so concurrent attempts on any instance are each counted exactly once.
   */
  count(keyHash: string, now: Date, windowMs: number): Promise<number>;
  /** Forgets the attempts counted for `keyHash` (its password was just entered correctly). */
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
