import { z } from 'zod';
import { withAccessToken } from '@/features/auth/auth-session';
import { apiRequest } from '@/lib/api/http';
import { ROLES, type PreviousPrincipalOutcome } from '@/types/access';


const memberSchema = z.object({
  userId: z.guid(),
  email: z.string().min(1),
  name: z.string().nullable(),
  role: z.enum(ROLES),
  canEditDossiers: z.boolean(),
  joinedAt: z.iso.datetime({ offset: true }),
});
export type Member = z.infer<typeof memberSchema>;

const invitationSchema = z.object({
  id: z.guid(),
  email: z.string().min(1),
  role: z.enum(ROLES),
  canEditDossiers: z.boolean(),
  expiresAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
});
export type Invitation = z.infer<typeof invitationSchema>;

const adminWorkspaceSchema = z.object({
  id: z.guid(),
  name: z.string(),
  slug: z.string(),
  archivedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  principal: z
    .object({ userId: z.guid(), email: z.string().min(1), name: z.string().nullable() })
    .nullable(),
  memberCount: z.number().int().nonnegative(),
});
export type AdminWorkspace = z.infer<typeof adminWorkspaceSchema>;

const designatePrincipalSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('transferred'), principal: memberSchema }),
  z.object({ status: z.literal('invited'), invitation: invitationSchema }),
]);
export type DesignatePrincipalResult = z.infer<typeof designatePrincipalSchema>;

const voteRulesSchema = z.object({
  bodySize: z.number().int(),
  majorityThreshold: z.number().int(),
  quorum: z.number().int(),
});
export type VoteRules = z.infer<typeof voteRulesSchema>;

const workspaceSettingsSchema = z.object({
  workspaceId: z.guid(),
  name: z.string(),
  voteRules: voteRulesSchema.nullable(),
  canConfigure: z.boolean(),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;

const workspacePath = (workspaceId: string) =>
  `/auth/workspaces/${encodeURIComponent(workspaceId)}`;

export function getWorkspaceSettings(workspaceId: string): Promise<WorkspaceSettings> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/settings`, {
      method: 'GET',
      bearer,
      schema: workspaceSettingsSchema,
    }),
  );
}

export function updateVoteRules(
  workspaceId: string,
  voteRules: VoteRules,
): Promise<WorkspaceSettings> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/settings`, {
      method: 'PUT',
      bearer,
      body: { voteRules },
      schema: workspaceSettingsSchema,
    }),
  );
}

export function listMembers(workspaceId: string): Promise<Member[]> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/members`, {
      method: 'GET',
      bearer,
      schema: z.array(memberSchema),
    }),
  );
}

export function setMemberDossierEdit(
  workspaceId: string,
  userId: string,
  canEditDossiers: boolean,
): Promise<Member> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      bearer,
      body: { canEditDossiers },
      schema: memberSchema,
    }),
  );
}

export function removeMember(workspaceId: string, userId: string): Promise<void> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/members/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      bearer,
      schema: z.undefined(),
    }),
  );
}

export function listInvitations(workspaceId: string): Promise<Invitation[]> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/invitations`, {
      method: 'GET',
      bearer,
      schema: z.array(invitationSchema),
    }),
  );
}

export function inviteAffiliate(
  workspaceId: string,
  email: string,
  canEditDossiers: boolean,
): Promise<Invitation> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/invitations`, {
      method: 'POST',
      bearer,
      body: { email, canEditDossiers },
      schema: invitationSchema,
    }),
  );
}

export function revokeInvitation(workspaceId: string, invitationId: string): Promise<void> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/invitations/${encodeURIComponent(invitationId)}`, {
      method: 'DELETE',
      bearer,
      schema: z.undefined(),
    }),
  );
}

export function listAllWorkspaces(): Promise<AdminWorkspace[]> {
  return withAccessToken((bearer) =>
    apiRequest('/auth/admin/workspaces', {
      method: 'GET',
      bearer,
      schema: z.array(adminWorkspaceSchema),
    }),
  );
}

export function createWorkspace(name: string, slug: string): Promise<unknown> {
  return withAccessToken((bearer) =>
    apiRequest('/auth/admin/workspaces', {
      method: 'POST',
      bearer,
      body: { name, slug },
      schema: z.object({ id: z.guid() }).loose(),
    }),
  );
}

const adminWorkspacePath = (workspaceId: string) =>
  `/auth/admin/workspaces/${encodeURIComponent(workspaceId)}`;

export function designatePrincipal(
  workspaceId: string,
  email: string,
  previousPrincipal: PreviousPrincipalOutcome,
): Promise<DesignatePrincipalResult> {
  return withAccessToken((bearer) =>
    apiRequest(`${adminWorkspacePath(workspaceId)}/principal`, {
      method: 'POST',
      bearer,
      body: { email, previousPrincipal },
      schema: designatePrincipalSchema,
    }),
  );
}

export function archiveWorkspace(workspaceId: string): Promise<void> {
  return withAccessToken((bearer) =>
    apiRequest(`${adminWorkspacePath(workspaceId)}/archive`, {
      method: 'POST',
      bearer,
      schema: z.undefined(),
    }),
  );
}

export function restoreWorkspace(workspaceId: string): Promise<void> {
  return withAccessToken((bearer) =>
    apiRequest(`${adminWorkspacePath(workspaceId)}/restore`, {
      method: 'POST',
      bearer,
      schema: z.undefined(),
    }),
  );
}

/** Irreversible. The server deletes only an archived workspace whose slug matches `confirmSlug`. */
export function deleteWorkspace(workspaceId: string, confirmSlug: string): Promise<void> {
  return withAccessToken((bearer) =>
    apiRequest(adminWorkspacePath(workspaceId), {
      method: 'DELETE',
      bearer,
      body: { confirmSlug },
      schema: z.undefined(),
    }),
  );
}
