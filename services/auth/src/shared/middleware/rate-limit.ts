import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { ErrorResponse } from '../types/api.types.js';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
export const TOO_MANY_REQUESTS_MESSAGE = 'Too many requests, please try again later.';
const TOO_MANY_REQUESTS: ErrorResponse = { error: TOO_MANY_REQUESTS_MESSAGE };

export const ACCOUNT_CREDENTIAL_FAILURE_LIMIT = 10;
export const ACCOUNT_CREDENTIAL_WINDOW_MS = THIRTY_MINUTES_MS;

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

function perIp(limit: number, { failuresOnly }: { failuresOnly: boolean }): RequestHandler {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES_MS,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: failuresOnly,
    message: TOO_MANY_REQUESTS,
  });
}

export function createRateLimiters(): RateLimiters {
  return {
    loginFailuresByIp: perIp(10, { failuresOnly: true }),
    mfaVerifyFailuresByIp: perIp(10, { failuresOnly: true }),
    mfaResendByIp: perIp(10, { failuresOnly: false }),
    forgotPasswordByIp: perIp(5, { failuresOnly: false }),
    resetPasswordByIp: perIp(10, { failuresOnly: false }),
    changePasswordFailuresByIp: perIp(10, { failuresOnly: true }),
    invitationByIp: perIp(20, { failuresOnly: false }),
    invitationSendByAccount: rateLimit({
      windowMs: FIFTEEN_MINUTES_MS,
      limit: 30,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: TOO_MANY_REQUESTS,
      keyGenerator: (req) => `invite:${req.auth?.sub ?? 'anonymous'}`,
    }),
    credentialFailuresByAccount: rateLimit({
      windowMs: ACCOUNT_CREDENTIAL_WINDOW_MS,
      limit: ACCOUNT_CREDENTIAL_FAILURE_LIMIT,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      message: TOO_MANY_REQUESTS,
      keyGenerator: (req) => `account:${req.auth?.sub ?? 'anonymous'}`,
    }),
  };
}
