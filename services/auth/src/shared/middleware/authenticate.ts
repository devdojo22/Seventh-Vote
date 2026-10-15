import type { Request, RequestHandler } from 'express';
import type { TokenService } from '../../modules/tokens/token.service.js';
import type { AccessTokenClaims, MfaTokenClaims } from '../../modules/tokens/token.types.js';
import { HttpError } from '../errors/http-error.js';

const BEARER_PATTERN = /^Bearer (\S+)$/;

function readBearerToken(req: Request): string {
  const token = BEARER_PATTERN.exec(req.get('authorization') ?? '')?.[1];
  if (token === undefined) throw new HttpError(401, 'Missing bearer token');
  return token;
}

export interface AuthenticationGuards {
  /** Requires a full-session access token (password + MFA completed). */
  requireAccess: RequestHandler;
  /** Requires the short-lived token issued after the password step. */
  requireMfaToken: RequestHandler;
}

export function createAuthenticationGuards(tokens: TokenService): AuthenticationGuards {
  return {
    requireAccess: (req, _res, next) => {
      req.auth = tokens.verifyAccessToken(readBearerToken(req));
      next();
    },
    requireMfaToken: (req, _res, next) => {
      req.auth = tokens.verifyMfaToken(readBearerToken(req));
      next();
    },
  };
}

/** Narrows `req.auth` in a handler mounted behind `requireAccess`. */
export function accessClaims(req: Request): AccessTokenClaims {
  const auth = req.auth;
  if (auth?.typ !== 'access') throw new HttpError(401, 'Missing bearer token');
  return auth;
}

/** Narrows `req.auth` in a handler mounted behind `requireMfaToken`. */
export function mfaClaims(req: Request): MfaTokenClaims {
  const auth = req.auth;
  if (auth?.typ !== 'mfa') throw new HttpError(401, 'Missing bearer token');
  return auth;
}
