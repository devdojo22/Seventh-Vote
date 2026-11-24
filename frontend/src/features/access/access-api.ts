import { z } from 'zod';
import { withAccessToken } from '@/features/auth/auth-session';
import { apiRequest } from '@/lib/api/http';
import { useCouncilStore } from '@/stores/council-store';
import { ROLES, type PreviousPrincipalOutcome } from '@/types/access';

const memberSchema = z.object({
  userId: z.guid(),
  email: z.string().min(1),
  name: z.string().nullable(),
  role: z.enum(ROLES),
  canEditDossiers: z.boolean(),
  canApproveDossiers: z.boolean(),
  joinedAt: z.iso.datetime({ offset: true }),
});
export type Member = z.infer<typeof memberSchema>;

export type DossierGrants = Partial<Pick<Member, 'canEditDossiers' | 'canApproveDossiers'>>;

const invitationSchema = z.object({
  id: z.guid(),
  email: z.string().min(1),
  role: z.enum(ROLES),
  canEditDossiers: z.boolean(),
  canApproveDossiers: z.boolean(),
  expiresAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
});
export type Invitation = z.infer<typeof invitationSchema>;

const affiliateSeatsSchema = z.object({
  seatLimit: z.number().int().nonnegative().nullable(),
  seatsUsed: z.number().int().nonnegative(),
  seatsAvailable: z.number().int().nonnegative().nullable(),
  isOverLimit: z.boolean(),
  activeAffiliates: z.number().int().nonnegative(),
  pendingInvitations: z.number().int().nonnegative(),
});
export type AffiliateSeats = z.infer<typeof affiliateSeatsSchema>;

const membersSchema = z.object({
  members: z.array(memberSchema),
  affiliateSeats: affiliateSeatsSchema,
});
export type WorkspaceMembers = z.infer<typeof membersSchema>;

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
  affiliateSeats: affiliateSeatsSchema,
});
export type AdminWorkspace = z.infer<typeof adminWorkspaceSchema>;

const designatePrincipalSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('transferred'), principal: memberSchema }),
  z.object({ status: z.literal('invited'), invitation: invitationSchema }),
]);
export type DesignatePrincipalResult = z.infer<typeof designatePrincipalSchema>;

export const RECUSAL_MODES = ['excluded', 'present'] as const;
export type RecusalMode = (typeof RECUSAL_MODES)[number];
export const TIE_BREAKS = ['fails', 'chair', 'passes'] as const;
export type TieBreak = (typeof TIE_BREAKS)[number];

export const FRACTION_BASES = ['seats', 'present'] as const;

const voteThresholdSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('count'), needed: z.number().int() }),
  z.object({
    type: z.literal('fraction'),
    numerator: z.number().int(),
    denominator: z.number().int(),
    of: z.enum(FRACTION_BASES),
  }),
  z.object({ type: z.literal('present_majority') }),
  z.object({ type: z.literal('consent') }),
]);
export type VoteThreshold = z.infer<typeof voteThresholdSchema>;

const actionVoteRuleSchema = z.object({
  id: z.string(),
  label: z.string(),
  threshold: voteThresholdSchema,
  note: z.string(),
  verified: z.boolean(),
});
export type ActionVoteRule = z.infer<typeof actionVoteRuleSchema>;

const voteRulesSchema = z.object({
  bodySize: z.number().int(),
  majorityThreshold: z.number().int(),
  quorum: z.number().int(),
  actions: z.array(actionVoteRuleSchema),
  recusal: z.enum(RECUSAL_MODES),
  tieBreak: z.enum(TIE_BREAKS),
});
export type VoteRules = z.infer<typeof voteRulesSchema>;

const savedVoteProcedureSchema = voteRulesSchema.pick({
  actions: true,
  recusal: true,
  tieBreak: true,
});
export type SavedVoteProcedure = z.infer<typeof savedVoteProcedureSchema>;

const workspaceSettingsSchema = z.object({
  workspaceId: z.guid(),
  name: z.string(),
  voteRules: voteRulesSchema.nullable(),
  voteProcedure: savedVoteProcedureSchema,
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

export async function updateVoteRules(
  workspaceId: string,
  voteRules: VoteRules,
): Promise<WorkspaceSettings> {
  const settings = await withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/settings`, {
      method: 'PUT',
      bearer,
      body: { voteRules },
      schema: workspaceSettingsSchema,
    }),
  );
  useCouncilStore.getState().markStale();
  return settings;
}

export function listMembers(workspaceId: string): Promise<WorkspaceMembers> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/members`, {
      method: 'GET',
      bearer,
      schema: membersSchema,
    }),
  );
}

export function setMemberDossierGrants(
  workspaceId: string,
  userId: string,
  grants: DossierGrants,
): Promise<Member> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/members/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      bearer,
      body: grants,
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
  grants: Required<DossierGrants>,
): Promise<Invitation> {
  return withAccessToken((bearer) =>
    apiRequest(`${workspacePath(workspaceId)}/invitations`, {
      method: 'POST',
      bearer,
      body: { email, ...grants },
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

export function updateSeatLimit(
  workspaceId: string,
  seatLimit: number | null,
): Promise<AffiliateSeats> {
  return withAccessToken((bearer) =>
    apiRequest(`${adminWorkspacePath(workspaceId)}/seat-limit`, {
      method: 'PUT',
      bearer,
      body: { seatLimit },
      schema: affiliateSeatsSchema,
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
