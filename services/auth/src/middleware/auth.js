import { HttpError } from '../lib/errors.js';
import { verifyToken } from '../lib/tokens.js';

const bearer = (typ) => (req, _res, next) => {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(new HttpError(401, 'Missing bearer token'));
  req.auth = verifyToken(token, typ);
  next();
};

export const requireAccess = bearer('access');
export const requireMfaToken = bearer('mfa');
