import type { Role } from '@prisma/client';

export type ErrorCode =
  | 'validation_failed'
  | 'invalid_code'
  | 'too_many_attempts'
  | 'resend_cooldown'
  | 'account_exists';

export interface ErrorResponse {
  error: string;
  code?: ErrorCode | undefined;
  details?: unknown;
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
  resendAfterSeconds: number;
}

export interface PasswordResetRequestedResponse {
  message: string;
}

export interface PasswordResetResponse {
  passwordReset: true;
}

export interface SessionResponse {
  accessToken: string;
  workspaceId: string | null;
  role: Role | null;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  role: Role;
}

export interface WorkspacePermissions {
  manageMembers: boolean;
  configureWorkspace: boolean;
  viewDossiers: boolean;
  editDossiers: boolean;
  runRehearsals: boolean;
  viewResults: boolean;
}

export interface MemberResponse {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
  canEditDossiers: boolean;
  joinedAt: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  role: Role;
  canEditDossiers: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  archivedAt: string | null;
  createdAt: string;
}

export interface VoteRules {
  bodySize: number;
  majorityThreshold: number;
  quorum: number;
}

export interface WorkspaceSettingsResponse {
  workspaceId: string;
  name: string;
  voteRules: VoteRules | null;
  canConfigure: boolean;
  updatedAt: string;
}

export interface AdminWorkspaceResponse extends WorkspaceResponse {
  principal: { userId: string; email: string; name: string | null } | null;
  memberCount: number;
}

export type DesignatePrincipalResponse =
  | { status: 'transferred'; principal: MemberResponse }
  | { status: 'invited'; invitation: InvitationResponse };

export interface InvitationPreviewResponse {
  workspaceName: string;
  email: string;
  role: Role;
  accountExists: boolean;
  expiresAt: string;
}

export interface InvitationAcceptedResponse {
  accepted: true;
  workspaceId: string;
}


export interface AccessResponse {
  id: string;
  isSuperAdmin: boolean;
  activeWorkspaceId: string | null;
  role: Role | null;
  permissions: WorkspacePermissions | null;
}

export interface MeResponse extends AccessResponse {
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  canEditDossiers: boolean;
  workspaces: WorkspaceSummary[];
}
