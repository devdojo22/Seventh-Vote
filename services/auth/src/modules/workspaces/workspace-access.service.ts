import type { User } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';
import type { MembershipRepository } from './membership.repository.js';
import { permissionsFor, type WorkspaceGrant } from './workspace-permissions.js';
import type { WorkspaceRepository } from './workspace.repository.js';

/** The caller's verified standing in one workspace, attached to the request by the authorization guards. */
export interface WorkspaceAccess {
  workspaceId: string;
  grant: WorkspaceGrant;
  permissions: WorkspacePermissions;
  /** True when a super-admin reaches a workspace they are not a member of (audited). */
  crossWorkspace: boolean;
}

export interface WorkspaceAccessServiceDependencies {
  memberships: MembershipRepository;
  workspaces: WorkspaceRepository;
}

/**
 * Answers "may this user act in this workspace, and how?" from the database on every request. Nothing the
 * client sends (token role or workspace claims, body, headers) is consulted, so a removed member or a
 * demoted Principal loses access on their very next request.
 */
export class WorkspaceAccessService {
  constructor(private readonly deps: WorkspaceAccessServiceDependencies) {}

  /**
   * The caller's access to `workspaceId`, or null when they have none. `user` is the account row this
   * request's `requireAccess` already loaded and checked (super-admin flag included), so only the membership
   * is read here. Unknown and foreign workspaces look the same to ordinary users; only a super-admin is told
   * that a workspace does not exist (404).
   */
  async resolve(user: User, workspaceId: string): Promise<WorkspaceAccess | null> {
    const membership = await this.deps.memberships.find(user.id, workspaceId);

    if (user.isSuperAdmin) {
      if (!membership && !(await this.deps.workspaces.findById(workspaceId))) {
        throw new HttpError(404, 'Workspace not found');
      }
      const grant: WorkspaceGrant = { kind: 'platform-operator' };
      return { workspaceId, grant, permissions: permissionsFor(grant), crossWorkspace: membership === null };
    }

    if (!membership) return null;
    const grant: WorkspaceGrant = {
      kind: 'member',
      role: membership.role,
      canEditDossiers: membership.canEditDossiers,
    };
    return { workspaceId, grant, permissions: permissionsFor(grant), crossWorkspace: false };
  }
}
