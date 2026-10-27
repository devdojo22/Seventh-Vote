/** Workspace roles of the client-confirmed model. Super Admin is a separate, platform-level flag. */
export const ROLES = ['PRINCIPAL', 'AFFILIATE'] as const;
export type Role = (typeof ROLES)[number];


export interface WorkspacePermissions {
  manageMembers: boolean;
  configureWorkspace: boolean;
  viewDossiers: boolean;
  editDossiers: boolean;
  runRehearsals: boolean;
  viewResults: boolean;
}
