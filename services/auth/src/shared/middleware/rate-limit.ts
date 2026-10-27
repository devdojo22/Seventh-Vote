import type { RequestHandler } from 'express';
import { rateLimit, type IncrementResponse, type Options, type Store } from 'express-rate-limit';
import type { LoginAttemptRepository } from '../../modules/authentication/login-attempt.repository.js';
import type { ErrorResponse } from '../types/api.types.js';
import { sha256 } from '../utils/hashing.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
export const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests, please try again later.';
const TOO_MANY_REQUESTS: ErrorResponse = { error: TOO_MANY_REQUESTS_MESSAGE };

export const ACCOUNT_CREDENTIAL_FAILURE_LIMIT = 10;
export const ACCOUNT_CREDENTIAL_WINDOW_MS = THIRTY_MINUTES_MS;

/** The cleanup job sweeps counters older than this, so no limiter may use a longer window. */
const LONGEST_WINDOW_MS = ACCOUNT_CREDENTIAL_WINDOW_MS;

export interface RateLimiters {
  loginFailuresByIp: RequestHandler;
  mfaVerifyFailuresByIp: RequestHandler;
  mfaResendByIp: RequestHandler;
  forgotPasswordByIp: RequestHandler;
  resetPasswordByIp: RequestHandler;
  changePasswordFailuresByIp: RequestHandler;
  invitationByIp: RequestHandler;
  invitationSendByAccount: RequestHandler;

  credentialFailuresByAccount: RequestHandler;
}

/**
 * express-rate-limit store backed by the shared `login_attempts` counters, so limits hold across
 * restarts and every auth instance. Keys are namespaced per limiter and hashed (no raw IP or user id stored).
 */
class DatabaseRateLimitStore implements Store {
  private windowMs = FIFTEEN_MINUTES_MS;

  constructor(
    private readonly counters: LoginAttemptRepository,
    private readonly namespace: string,
  ) {}

  init(options: Options): void {
    if (options.windowMs > LONGEST_WINDOW_MS) {
      throw new Error(`rate limiter "${this.namespace}" window exceeds the cleanup window`);
    }
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const { attempts, windowStartedAt } = await this.counters.hit(this.hash(key), new Date(), this.windowMs);
    return { totalHits: attempts, resetTime: new Date(windowStartedAt.getTime() + this.windowMs) };
  }

  async decrement(key: string): Promise<void> {
    await this.counters.undo(this.hash(key));
  }

  async resetKey(key: string): Promise<void> {
    await this.counters.clear(this.hash(key));
  }

  private hash(key: string): string {
    return sha256(`rate-limit\n${this.namespace}\n${key}`);
  }
}

export function createRateLimiters(counters: LoginAttemptRepository): RateLimiters {
  const perIp = (namespace: string, limit: number, { failuresOnly }: { failuresOnly: boolean }): RequestHandler =>
    rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: failuresOnly,
      message: TOO_MANY_REQUESTS,
      store: new DatabaseRateLimitStore(counters, namespace),
    });

  return {
    loginFailuresByIp: perIp('login', 10, { failuresOnly: true }),
    mfaVerifyFailuresByIp: perIp('mfa-verify', 10, { failuresOnly: true }),
    mfaResendByIp: perIp('mfa-resend', 10, { failuresOnly: false }),
    forgotPasswordByIp: perIp('forgot-password', 5, { failuresOnly: false }),
    resetPasswordByIp: perIp('reset-password', 10, { failuresOnly: false }),
    changePasswordFailuresByIp: perIp('change-password', 10, { failuresOnly: true }),
    invitationByIp: perIp('invitation', 20, { failuresOnly: false }),
    invitationSendByAccount: rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit: 30,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: TOO_MANY_REQUESTS,
      keyGenerator: (req) => `invite:${req.auth?.sub ?? 'anonymous'}`,
      store: new DatabaseRateLimitStore(counters, 'invitation-send'),
    }),
    credentialFailuresByAccount: rateLimit({
      windowMs: ACCOUNT_CREDENTIAL_WINDOW_MS,
      limit: ACCOUNT_CREDENTIAL_FAILURE_LIMIT,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: TOO_MANY_REQUESTS,
      keyGenerator: (req) => `account:${req.auth?.sub ?? 'anonymous'}`,
      store: new DatabaseRateLimitStore(counters, 'credential-failures'),
    }),
  };
}
