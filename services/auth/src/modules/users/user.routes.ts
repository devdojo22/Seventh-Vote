import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { UserController } from './user.controller.js';

/** Mounted under /auth. */
export function createUserRouter(controller: UserController, guards: AuthenticationGuards): Router {
  const router = Router();
  router.get('/me', guards.requireAccess, controller.me);
  return router;
}
