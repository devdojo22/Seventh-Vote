import { z } from 'zod';
import { apiRequest } from '@/lib/api/http';
import { ROLES, type Role, type WorkspacePermissions } from '@/types/access';


export interface CodeChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
  resendAfterSeconds: number;
}

const codeChallengeResponseSchema = z.object({
  mfaRequired: z.literal(true),
  mfaToken: z.string().min(1),
  resendAfterSeconds: z.number().int().nonnegative(),
});

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  MFA_VERIFY: '/auth/mfa/verify',
  MFA_RESEND: '/auth/mfa/resend',
  PASSWORD_FORGOT: '/auth/password/forgot',
  PASSWORD_RESET: '/auth/password/reset',
  PASSWORD_CHANGE: '/auth/password/change',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  SWITCH_WORKSPACE: '/auth/session/workspace',
  INVITATION_INSPECT: '/auth/invitations/inspect',
  INVITATION_ACCEPT: '/auth/invitations/accept',
  INVITATION_JOIN: '/auth/invitations/join',
} as const;

export function resendVerificationCode(mfaToken: string): Promise<CodeChallengeResponse> {
  return apiRequest(AUTH_ENDPOINTS.MFA_RESEND, {
    method: 'POST',
    bearer: mfaToken,
    schema: codeChallengeResponseSchema,
  });
}

const passwordResetRequestedSchema = z.object({ message: z.string() });

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest(AUTH_ENDPOINTS.PASSWORD_FORGOT, {
    method: 'POST',
    body: { email },
    schema: passwordResetRequestedSchema,
  });
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export function resetPassword(request: ResetPasswordRequest): Promise<{ passwordReset: true }> {
  return apiRequest(AUTH_ENDPOINTS.PASSWORD_RESET, {
    method: 'POST',
    body: request,
    schema: z.object({ passwordReset: z.literal(true) }),
  });
}

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface SessionResponse {
  accessToken: string;
  workspaceId: string | null;
  role: Role | null;
}

const sessionResponseSchema = z.object({
  accessToken: z.string().min(1),
  workspaceId: z.guid().nullable(),
  role: z.enum(ROLES).nullable(),
});

export function loginAccount(request: LoginRequest): Promise<CodeChallengeResponse> {
  return apiRequest(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: request,
    schema: codeChallengeResponseSchema,
  });
}

export function verifyLoginMfa(mfaToken: string, code: string): Promise<SessionResponse> {
  return apiRequest(AUTH_ENDPOINTS.MFA_VERIFY, {
    method: 'POST',
    bearer: mfaToken,
    body: { code },
    schema: sessionResponseSchema,
  });
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}


export function changePassword(
  accessToken: string,
  request: ChangePasswordRequest,
): Promise<SessionResponse> {
  return apiRequest(AUTH_ENDPOINTS.PASSWORD_CHANGE, {
    method: 'POST',
    bearer: accessToken,
    body: request,
    schema: sessionResponseSchema,
  });
}

export function refreshSession(signal?: AbortSignal): Promise<SessionResponse> {
  return apiRequest(AUTH_ENDPOINTS.REFRESH, {
    method: 'POST',
    schema: sessionResponseSchema,
    signal,
  });
}

export function logoutSession(): Promise<void> {
  return apiRequest(AUTH_ENDPOINTS.LOGOUT, { method: 'POST', schema: z.undefined() });
}

export interface WorkspaceAccess {
  id: string;
  name: string;
  role: Role;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  emailVerifiedAt: string | null;
  isSuperAdmin: boolean;
  createdAt: string;
  activeWorkspaceId: string | null;
  role: Role | null;
  canEditDossiers: boolean;
  permissions: WorkspacePermissions | null;
  workspaces: WorkspaceAccess[];
}

const permissionsSchema = z.object({
  manageMembers: z.boolean(),
  configureWorkspace: z.boolean(),
  viewDossiers: z.boolean(),
  editDossiers: z.boolean(),
  runRehearsals: z.boolean(),
  viewResults: z.boolean(),
});

const currentUserSchema = z.object({
  id: z.guid(),
  email: z.string().min(1),
  name: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  emailVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
  isSuperAdmin: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  activeWorkspaceId: z.guid().nullable(),
  role: z.enum(ROLES).nullable(),
  canEditDossiers: z.boolean(),
  permissions: permissionsSchema.nullable(),
  workspaces: z.array(z.object({ id: z.guid(), name: z.string(), role: z.enum(ROLES) })),
});

export function fetchCurrentUser(accessToken: string, signal?: AbortSignal): Promise<CurrentUser> {
  return apiRequest(AUTH_ENDPOINTS.ME, {
    method: 'GET',
    bearer: accessToken,
    schema: currentUserSchema,
    signal,
  });
}

export function switchWorkspace(
  accessToken: string,
  workspaceId: string,
): Promise<SessionResponse> {
  return apiRequest(AUTH_ENDPOINTS.SWITCH_WORKSPACE, {
    method: 'POST',
    bearer: accessToken,
    body: { workspaceId },
    schema: sessionResponseSchema,
  });
}

export interface InvitationPreview {
  workspaceName: string;
  email: string;
  role: Role;
  accountExists: boolean;
  expiresAt: string;
}

const invitationPreviewSchema = z.object({
  workspaceName: z.string(),
  email: z.string().min(1),
  role: z.enum(ROLES),
  accountExists: z.boolean(),
  expiresAt: z.iso.datetime({ offset: true }),
});

const invitationAcceptedSchema = z.object({ accepted: z.literal(true), workspaceId: z.guid() });

export function inspectInvitation(token: string): Promise<InvitationPreview> {
  return apiRequest(AUTH_ENDPOINTS.INVITATION_INSPECT, {
    method: 'POST',
    body: { token },
    schema: invitationPreviewSchema,
  });
}

export interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export function acceptInvitation(
  request: AcceptInvitationRequest,
): Promise<{ accepted: true; workspaceId: string }> {
  return apiRequest(AUTH_ENDPOINTS.INVITATION_ACCEPT, {
    method: 'POST',
    body: request,
    schema: invitationAcceptedSchema,
  });
}

export function joinInvitation(
  accessToken: string,
  token: string,
): Promise<{ accepted: true; workspaceId: string }> {
  return apiRequest(AUTH_ENDPOINTS.INVITATION_JOIN, {
    method: 'POST',
    bearer: accessToken,
    body: { token },
    schema: invitationAcceptedSchema,
  });
}

export function displayName(user: Pick<CurrentUser, 'name' | 'email'>): string {
  return user.name?.trim() || user.email;
}
