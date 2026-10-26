import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { JwtConfig } from '../../config/environment.js';
import { HttpError } from '../../shared/errors/http-error.js';
import {
  accessTokenClaimsSchema,
  mfaTokenClaimsSchema,
  type AccessTokenClaims,
  type AccessTokenInput,
  type MfaTokenClaims,
  type MfaTokenInput,
  type TokenType,
} from './token.types.js';

const ALGORITHM = 'HS256';
const tokenTypeSchema = z.object({ typ: z.string() });

export class TokenService {
  constructor(private readonly config: JwtConfig) {}

  signAccessToken({ userId, workspaceId, role, securityVersion }: AccessTokenInput): string {
    return jwt.sign({ typ: 'access', mfa: true, wid: workspaceId, role, sv: securityVersion }, this.config.secret, {
      algorithm: ALGORITHM,
      issuer: this.config.issuer,
      audience: this.config.audience,
      subject: userId,
      expiresIn: this.config.accessTokenTtlSeconds,
    });
  }

  signMfaToken({ userId, challengeId, purpose, rememberDevice, securityVersion, ttlSeconds }: MfaTokenInput): string {
    const claims = { typ: 'mfa', cid: challengeId, pur: purpose, rem: rememberDevice, sv: securityVersion };
    return jwt.sign(claims, this.config.secret, {
      algorithm: ALGORITHM,
      issuer: this.config.issuer,
      audience: this.config.audience,
      subject: userId,
      expiresIn: ttlSeconds,
    });
  }

  verifyAccessToken(token: string): AccessTokenClaims {
    return this.verify(token, 'access', accessTokenClaimsSchema);
  }

  verifyMfaToken(token: string): MfaTokenClaims {
    return this.verify(token, 'mfa', mfaTokenClaimsSchema);
  }

  private verify<T>(token: string, expectedType: TokenType, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T {
    let payload: unknown;
    try {
      payload = jwt.verify(token, this.config.secret, {
        algorithms: [ALGORITHM],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }
    const typed = tokenTypeSchema.safeParse(payload);
    if (!typed.success || typed.data.typ !== expectedType) throw new HttpError(401, 'Invalid token type');
    const claims = schema.safeParse(payload);
    if (!claims.success) throw new HttpError(401, 'Invalid or expired token');
    return claims.data;
  }
}
