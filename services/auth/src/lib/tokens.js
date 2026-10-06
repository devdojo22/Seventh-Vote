import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './errors.js';

const signOptions = { issuer: config.jwtIssuer, audience: config.jwtAudience, algorithm: 'HS256' };

// Access tokens are what the FastAPI service verifies: typ=access, mfa=true, wid, role.
export function signAccessToken({ userId, workspaceId = null, role = null }) {
  return jwt.sign({ typ: 'access', mfa: true, wid: workspaceId, role }, config.jwtSecret, {
    ...signOptions,
    subject: userId,
    expiresIn: config.accessTtl,
  });
}

// Short-lived token proving the password step passed; only accepted by /mfa/* routes.
export function signMfaToken(userId) {
  return jwt.sign({ typ: 'mfa' }, config.jwtSecret, { ...signOptions, subject: userId, expiresIn: '5m' });
}

export function verifyToken(token, typ) {
  const claims = jwt.verify(token, config.jwtSecret, {
    issuer: config.jwtIssuer,
    audience: config.jwtAudience,
    algorithms: ['HS256'],
  });
  if (claims.typ !== typ) throw new HttpError(401, 'Invalid token type');
  return claims;
}
