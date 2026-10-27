import { Role } from '@prisma/client';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';


export type WorkspaceGrant =
  | { kind: 'member'; role: Role; canEditDossiers: boolean }
  | { kind: 'platform-operator' };

const ALL: WorkspacePermissions = {
  manageMembers: true,
  configureWorkspace: true,
  viewDossiers: true,
  editDossiers: true,
  runRehearsals: true,
  viewResults: true,
};


export function manageableInvitationRoles(grant: WorkspaceGrant): readonly Role[] {
  return grant.kind === 'platform-operator' ? [Role.PRINCIPAL, Role.AFFILIATE] : [Role.AFFILIATE];
}


export function permissionsFor(grant: WorkspaceGrant): WorkspacePermissions {
  if (grant.kind === 'platform-operator' || grant.role === Role.PRINCIPAL) return ALL;
  return {
    manageMembers: false,
    configureWorkspace: false,
    viewDossiers: true,
    editDossiers: grant.canEditDossiers,
    runRehearsals: true,
    viewResults: true,
  };
}
