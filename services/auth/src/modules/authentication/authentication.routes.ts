import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { RateLimiters } from '../../shared/middleware/rate-limit.js';
import type { AuthenticationController } from './authentication.controller.js';

/** Mounted under /auth. Middleware order is rate limit, then token check, then body validation. */
export function createAuthenticationRouter(
  controller: AuthenticationController,
  guards: AuthenticationGuards,
  limiters: RateLimiters,
): Router {
  const router = Router();
  router.post('/register', limiters.credentialsByIp, controller.register);
  router.post('/login', limiters.credentialsByIp, controller.login);
  router.post('/mfa/setup', guards.requireMfaToken, controller.startMfaSetup);
  router.post(
    '/mfa/verify',
    limiters.credentialsByIp,
    guards.requireMfaToken,
    limiters.mfaFailuresByAccount,
    controller.verifyMfa,
  );
  return router;
}
