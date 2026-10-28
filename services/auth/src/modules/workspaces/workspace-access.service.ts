import type { User } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';
import type { MembershipRepository } from './membership.repository.js';
import { permissionsFor, type WorkspaceGrant } from './workspace-permissions.js';
import type { WorkspaceRepository } from './workspace.repository.js';

export const WORKSPACE_ARCHIVED = 'This workspace is archived.';

export interface WorkspaceAccess {
  workspaceId: string;
  grant: WorkspaceGrant;
  permissions: WorkspacePermissions;
  crossWorkspace: boolean;
}

export interface WorkspaceAccessServiceDependencies {
  memberships: MembershipRepository;
  workspaces: WorkspaceRepository;
}


export class WorkspaceAccessService {
  constructor(private readonly deps: WorkspaceAccessServiceDependencies) {}

  /**
   * An archived workspace is frozen for everyone on workspace routes, super-admins included: its lifecycle is
   * managed only through the /admin routes. Non-members are refused before they can learn its state.
   */
  async resolve(user: User, workspaceId: string): Promise<WorkspaceAccess | null> {
    if (user.isSuperAdmin) {
      const workspace = await this.deps.workspaces.findById(workspaceId);
      if (!workspace) throw new HttpError(404, 'Workspace not found');
      if (workspace.archivedAt !== null) throw new HttpError(409, WORKSPACE_ARCHIVED);
      // A super-admin holds no membership (migration 0015), so every workspace access is cross-workspace.
      const grant: WorkspaceGrant = { kind: 'platform-operator' };
      return { workspaceId, grant, permissions: permissionsFor(grant), crossWorkspace: true };
    }

    const membership = await this.deps.memberships.findActive(user.id, workspaceId);
    if (!membership) {
      if (await this.deps.memberships.find(user.id, workspaceId)) throw new HttpError(409, WORKSPACE_ARCHIVED);
      return null;
    }
    const grant: WorkspaceGrant = {
      kind: 'member',
      role: membership.role,
      canEditDossiers: membership.canEditDossiers,
    };
    return { workspaceId, grant, permissions: permissionsFor(grant), crossWorkspace: false };
  }
}
