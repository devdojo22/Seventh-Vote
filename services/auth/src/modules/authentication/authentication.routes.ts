import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { RateLimiters } from '../../shared/middleware/rate-limit.js';
import type { AuthenticationController } from './authentication.controller.js';

export function createAuthenticationRouter(
  controller: AuthenticationController,
  guards: AuthenticationGuards,
  limiters: RateLimiters,
): Router {
  const router = Router();
  router.post('/login', limiters.loginFailuresByIp, controller.login);
  router.post(
    '/mfa/verify',
    limiters.mfaVerifyFailuresByIp,
    guards.requireMfaToken,
    limiters.credentialFailuresByAccount,
    controller.verifyMfa,
  );
  router.post('/mfa/resend', limiters.mfaResendByIp, guards.requireMfaToken, controller.resendMfaCode);
  router.post('/password/forgot', limiters.forgotPasswordByIp, controller.forgotPassword);
  router.post('/password/reset', limiters.resetPasswordByIp, controller.resetPassword);
  router.post(
    '/password/change',
    limiters.changePasswordFailuresByIp,
    guards.requireAccess,
    limiters.credentialFailuresByAccount,
    controller.changePassword,
  );
  return router;
}
