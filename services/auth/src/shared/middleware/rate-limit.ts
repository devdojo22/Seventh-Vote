import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { ErrorResponse } from '../types/api.types.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
/** Same `{ error }` shape as every other error response (express-rate-limit defaults to plain text). */
const TOO_MANY_REQUESTS: ErrorResponse = { error: 'Too many requests, please try again later.' };

export interface RateLimiters {
  /** Per client IP, shared by /register, /login and /mfa/verify (20 requests per 15 min in total). */
  credentialsByIp: RequestHandler;
  /** Per account: failed MFA codes. Stops code guessing spread across many IPs. */
  mfaFailuresByAccount: RequestHandler;
}

/**
 * Built per app instance so each instance has its own counters. The store is in-memory,
 * so limits are per process; a multi-instance deployment needs a shared store.
 */
export function createRateLimiters(): RateLimiters {
  return {
    credentialsByIp: rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit: 20,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: TOO_MANY_REQUESTS,
    }),
    mfaFailuresByAccount: rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: TOO_MANY_REQUESTS,
      // Mounted after requireMfaToken, so the verified subject is always present.
      keyGenerator: (req) => `account:${req.auth?.sub ?? 'anonymous'}`,
    }),
  };
}
