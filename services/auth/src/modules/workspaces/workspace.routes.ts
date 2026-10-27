import { Router } from 'express';
import type { AuthenticationGuards } from '../../shared/middleware/authenticate.js';
import type { AuthorizationGuards } from '../../shared/middleware/authorize.js';
import type { RateLimiters } from '../../shared/middleware/rate-limit.js';
import type { WorkspaceController } from './workspace.controller.js';

/**
 * Mounted under /auth. Every route needs a full session, then authorization from the database:
 * /admin/* for super-admins only; /workspaces/:workspaceId/* for whoever holds `manageMembers` in that
 * workspace (its Principal, or a super-admin). Affiliates may only read the workspace settings.
 */
export function createWorkspaceRouter(
  controller: WorkspaceController,
  authentication: AuthenticationGuards,
  authorization: AuthorizationGuards,
  limiters: RateLimiters,
): Router {
  const router = Router();
  const superAdmin = [authentication.requireAccess, authorization.requireSuperAdmin];
  const manager = [authentication.requireAccess, authorization.requireWorkspacePermission('manageMembers')];
  // Every member may read the rules a rehearsal runs under; only the Principal (or a super-admin) changes them.
  const member = [authentication.requireAccess, authorization.requireWorkspaceMember];
  const configurer = [authentication.requireAccess, authorization.requireWorkspacePermission('configureWorkspace')];

  router.get('/admin/workspaces', ...superAdmin, controller.listAll);
  router.post('/admin/workspaces', ...superAdmin, controller.create);
  router.post(
    '/admin/workspaces/:workspaceId/principal',
    ...superAdmin,
    limiters.invitationSendByAccount,
    controller.designatePrincipal,
  );

  router.get('/workspaces/:workspaceId/members', ...manager, controller.listMembers);
  router.patch('/workspaces/:workspaceId/members/:userId', ...manager, controller.updateMember);
  router.delete('/workspaces/:workspaceId/members/:userId', ...manager, controller.removeMember);
  router.get('/workspaces/:workspaceId/invitations', ...manager, controller.listInvitations);
  router.post(
    '/workspaces/:workspaceId/invitations',
    ...manager,
    limiters.invitationSendByAccount,
    controller.inviteAffiliate,
  );
  router.delete('/workspaces/:workspaceId/invitations/:invitationId', ...manager, controller.revokeInvitation);
  router.get('/workspaces/:workspaceId/settings', ...member, controller.getSettings);
  router.put('/workspaces/:workspaceId/settings', ...configurer, controller.updateSettings);
  return router;
}
