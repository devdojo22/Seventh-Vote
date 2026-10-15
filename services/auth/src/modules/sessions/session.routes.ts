import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { SessionController } from './session.controller.js';

/** Mounted under /auth. Refresh and logout are authenticated by the httpOnly refresh cookie. */
export function createSessionRouter(controller: SessionController, guards: AuthenticationGuards): Router {
  const router = Router();
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/session/workspace', guards.requireAccess, controller.switchWorkspace);
  return router;
}
