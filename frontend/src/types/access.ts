/** Workspace roles of the client-confirmed model. Super Admin is a separate, platform-level flag. */
export const ROLES = ['PRINCIPAL', 'AFFILIATE'] as const;
export type Role = (typeof ROLES)[number];

export const PREVIOUS_PRINCIPAL_OUTCOMES = ['REMOVE', 'KEEP_AS_AFFILIATE'] as const;
export type PreviousPrincipalOutcome = (typeof PREVIOUS_PRINCIPAL_OUTCOMES)[number];


export interface WorkspacePermissions {
  manageMembers: boolean;
  configureWorkspace: boolean;
  viewDossiers: boolean;
  editDossiers: boolean;
  runRehearsals: boolean;
  viewResults: boolean;
}
