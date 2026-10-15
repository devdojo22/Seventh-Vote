import type { VerifiedTokenClaims } from '../modules/tokens/token.types.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware once a bearer token has been verified. */
      auth?: VerifiedTokenClaims;
    }
  }
}

export {};
