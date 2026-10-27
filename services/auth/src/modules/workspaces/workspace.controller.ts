import type { Request, RequestHandler, Response } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { requestContext } from '../../shared/http/request-context.js';
import { accessClaims } from '../../shared/middleware/authenticate.js';
import { workspaceAccess } from '../../shared/middleware/authorize.js';
import { parseBody } from '../../shared/validation/parse-body.js';
import { manageableInvitationRoles } from './workspace-permissions.js';
import type { WorkspaceService } from './workspace.service.js';
import {
  createWorkspaceSchema,
  designatePrincipalSchema,
  idParamSchema,
  inviteAffiliateSchema,
  updateMemberSchema,
  updateSettingsSchema,
} from './workspace.validation.js';

export interface WorkspaceController {
  create: RequestHandler;
  listAll: RequestHandler;
  designatePrincipal: RequestHandler;
  listMembers: RequestHandler;
  inviteAffiliate: RequestHandler;
  listInvitations: RequestHandler;
  revokeInvitation: RequestHandler;
  updateMember: RequestHandler;
  removeMember: RequestHandler;
  getSettings: RequestHandler;
  updateSettings: RequestHandler;
}

function idParam(req: Request, name: string): string {
  const parsed = idParamSchema.safeParse(req.params[name]);
  if (!parsed.success) throw new HttpError(400, `Invalid ${name}`);
  return parsed.data;
}


export function createWorkspaceController(workspaces: WorkspaceService): WorkspaceController {
  return {
    create: async (req: Request, res: Response) => {
      const input = parseBody(createWorkspaceSchema, req.body);
      res.status(201).json(await workspaces.create(accessClaims(req).sub, input, requestContext(req)));
    },

    listAll: async (_req: Request, res: Response) => {
      res.json(await workspaces.listOverview());
    },

    designatePrincipal: async (req: Request, res: Response) => {
      const { email } = parseBody(designatePrincipalSchema, req.body);
      const result = await workspaces.designatePrincipal(
        accessClaims(req).sub,
        idParam(req, 'workspaceId'),
        email,
        requestContext(req),
      );
      res.status(result.status === 'invited' ? 202 : 200).json(result);
    },

    listMembers: async (req: Request, res: Response) => {
      res.json(await workspaces.listMembers(workspaceAccess(req).workspaceId));
    },

    inviteAffiliate: async (req: Request, res: Response) => {
      const input = parseBody(inviteAffiliateSchema, req.body);
      const invitation = await workspaces.inviteAffiliate(
        accessClaims(req).sub,
        workspaceAccess(req).workspaceId,
        input,
        requestContext(req),
      );
      res.status(201).json(invitation);
    },

    listInvitations: async (req: Request, res: Response) => {
      const access = workspaceAccess(req);
      res.json(await workspaces.listInvitations(access.workspaceId, manageableInvitationRoles(access.grant)));
    },

    revokeInvitation: async (req: Request, res: Response) => {
      const access = workspaceAccess(req);
      await workspaces.revokeInvitation(
        accessClaims(req).sub,
        access.workspaceId,
        idParam(req, 'invitationId'),
        manageableInvitationRoles(access.grant),
        requestContext(req),
      );
      res.status(204).end();
    },

    updateMember: async (req: Request, res: Response) => {
      const { canEditDossiers } = parseBody(updateMemberSchema, req.body);
      res.json(
        await workspaces.setDossierEdit(
          accessClaims(req).sub,
          workspaceAccess(req).workspaceId,
          idParam(req, 'userId'),
          canEditDossiers,
          requestContext(req),
        ),
      );
    },

    removeMember: async (req: Request, res: Response) => {
      await workspaces.removeMember(
        accessClaims(req).sub,
        workspaceAccess(req).workspaceId,
        idParam(req, 'userId'),
        requestContext(req),
      );
      res.status(204).end();
    },

    getSettings: async (req: Request, res: Response) => {
      const access = workspaceAccess(req);
      res.json(await workspaces.getSettings(access.workspaceId, access.permissions.configureWorkspace));
    },

    updateSettings: async (req: Request, res: Response) => {
      const { voteRules } = parseBody(updateSettingsSchema, req.body);
      res.json(
        await workspaces.updateVoteRules(
          accessClaims(req).sub,
          workspaceAccess(req).workspaceId,
          voteRules,
          requestContext(req),
        ),
      );
    },
  };
}
