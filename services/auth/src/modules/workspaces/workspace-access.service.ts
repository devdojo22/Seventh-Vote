import type { User } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';
import type { MembershipRepository } from './membership.repository.js';
import { permissionsFor, type WorkspaceGrant } from './workspace-permissions.js';
import type { WorkspaceRepository } from './workspace.repository.js';

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
