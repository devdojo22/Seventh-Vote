import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { RateLimiters } from '../../shared/middleware/rate-limit.js';
import type { InvitationController } from './invitation.controller.js';

export function createInvitationRouter(
  controller: InvitationController,
  guards: AuthenticationGuards,
  limiters: RateLimiters,
): Router {
  const router = Router();
  router.post('/invitations/inspect', limiters.invitationByIp, controller.preview);
  router.post('/invitations/accept', limiters.invitationByIp, controller.accept);
  router.post('/invitations/join', limiters.invitationByIp, guards.requireAccess, controller.join);
  return router;
}
