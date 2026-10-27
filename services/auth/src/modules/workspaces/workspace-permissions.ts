import { Role } from '@prisma/client';
import type { WorkspacePermissions } from '../../shared/types/api.types.js';

/**
 * How a user reaches a workspace. Derived on the server from the database on every request, never from
 * a token claim or anything the client sends.
 */
export type WorkspaceGrant =
  /** A membership row in this workspace. */
  | { kind: 'member'; role: Role; canEditDossiers: boolean }
  /** users.is_super_admin: platform operator, reaches every workspace for provisioning and support. */
  | { kind: 'platform-operator' };

const ALL: WorkspacePermissions = {
  manageMembers: true,
  configureWorkspace: true,
  viewDossiers: true,
  editDossiers: true,
  runRehearsals: true,
  viewResults: true,
};

/**
 * Invitation roles the caller may see and withdraw in a workspace. Principal invitations belong to the
 * super-admin's designate/transfer workflow, so only a super-admin can see or withdraw them; anyone else
 * with `manageMembers` (the Principal) handles Affiliate invitations only.
 */
export function manageableInvitationRoles(grant: WorkspaceGrant): readonly Role[] {
  return grant.kind === 'platform-operator' ? [Role.PRINCIPAL, Role.AFFILIATE] : [Role.AFFILIATE];
}

/**
 * The single permission matrix of the client-confirmed role model:
 * - Super Admin and Principal: everything inside the workspace. Only a super-admin designates or
 *   transfers the Principal (not a workspace permission; see WorkspaceService.designatePrincipal).
 * - Affiliate: view dossiers, run rehearsals, view results; edit dossiers only when the Principal granted
 *   it. Never manages users or changes workspace settings and voting rules.
 */
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
