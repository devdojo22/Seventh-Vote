import type { User } from '@prisma/client';
import type { Request, RequestHandler } from 'express';
import type { TokenService } from '../../modules/tokens/token.service.js';
import type { UserService } from '../../modules/users/user.service.js';
import type { AccessTokenClaims, MfaTokenClaims } from '../../modules/tokens/token.types.js';
import { HttpError } from '../errors/http-error.js';

const BEARER_PATTERN = /^Bearer (\S+)$/;

function readBearerToken(req: Request): string {
  const token = BEARER_PATTERN.exec(req.get('authorization') ?? '')?.[1];
  if (token === undefined) throw new HttpError(401, 'Missing bearer token');
  return token;
}

export interface AuthenticationGuards {
  requireAccess: RequestHandler;
  requireMfaToken: RequestHandler;
}

export function createAuthenticationGuards(tokens: TokenService, users: UserService): AuthenticationGuards {
  return {
    requireAccess: async (req, _res, next) => {
      const claims = tokens.verifyAccessToken(readBearerToken(req));
      req.authUser = await users.assertTokenCurrent(claims);
      req.auth = claims;
      next();
    },
    requireMfaToken: (req, _res, next) => {
      req.auth = tokens.verifyMfaToken(readBearerToken(req));
      next();
    },
  };
}

export function authenticatedUser(req: Request): User {
  const user = req.authUser;
  if (!user) throw new HttpError(401, 'Missing bearer token');
  return user;
}

export function accessClaims(req: Request): AccessTokenClaims {
  const auth = req.auth;
  if (auth?.typ !== 'access') throw new HttpError(401, 'Missing bearer token');
  return auth;
}

export function mfaClaims(req: Request): MfaTokenClaims {
  const auth = req.auth;
  if (auth?.typ !== 'mfa') throw new HttpError(401, 'Missing bearer token');
  return auth;
}
