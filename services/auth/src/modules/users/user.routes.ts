import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { UserController } from './user.controller.js';

export function createUserRouter(controller: UserController, guards: AuthenticationGuards): Router {
  const router = Router();
  router.get('/me', guards.requireAccess, controller.me);
  router.get('/me/access', guards.requireAccess, controller.access);
  return router;
}
