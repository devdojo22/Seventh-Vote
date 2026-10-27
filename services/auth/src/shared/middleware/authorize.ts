import type { Request, RequestHandler } from 'express';
import { z } from 'zod';
import type { AuditService } from '../../modules/audit/audit.service.js';
import type { WorkspaceAccess, WorkspaceAccessService } from '../../modules/workspaces/workspace-access.service.js';
import type { WorkspacePermissions } from '../types/api.types.js';
import { HttpError } from '../errors/http-error.js';
import { requestContext } from '../http/request-context.js';
import { accessClaims, authenticatedUser } from './authenticate.js';

const workspaceIdParamSchema = z.string().uuid();

export interface AuthorizationGuards {
  requireSuperAdmin: RequestHandler;
  requireWorkspaceMember: RequestHandler;
  requireWorkspacePermission: (permission: keyof WorkspacePermissions) => RequestHandler;
}


export function createAuthorizationGuards(access: WorkspaceAccessService, audit: AuditService): AuthorizationGuards {
  const requireWorkspaceAccess =
    (permission?: keyof WorkspacePermissions): RequestHandler =>
    async (req, _res, next) => {
      const { sub } = accessClaims(req);
      const parsed = workspaceIdParamSchema.safeParse(req.params['workspaceId']);
      if (!parsed.success) throw new HttpError(400, 'Invalid workspace id');
      const granted = await access.resolve(authenticatedUser(req), parsed.data);
      if (!granted) throw new HttpError(403, 'You do not have access to this workspace');
      if (permission !== undefined && !granted.permissions[permission]) {
        throw new HttpError(403, 'You do not have permission to do this in this workspace');
      }
      if (granted.crossWorkspace) {
        await audit.record(requestContext(req), {
          action: 'admin.workspace_access',
          userId: sub,
          workspaceId: granted.workspaceId,
          meta: { method: req.method, permission: permission ?? null },
        });
      }
      req.workspaceAccess = granted;
      next();
    };

  return {
    requireSuperAdmin: (req, _res, next) => {
      if (!authenticatedUser(req).isSuperAdmin) {
        throw new HttpError(403, 'This action is reserved for platform administrators');
      }
      next();
    },
    requireWorkspaceMember: requireWorkspaceAccess(),
    requireWorkspacePermission: requireWorkspaceAccess,
  };
}

export function workspaceAccess(req: Request): WorkspaceAccess {
  const granted = req.workspaceAccess;
  if (!granted) throw new HttpError(403, 'You do not have access to this workspace');
  return granted;
}
