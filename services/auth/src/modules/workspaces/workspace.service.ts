import { Role, type Workspace } from '@prisma/client';
import { HttpError } from '../../shared/errors/http-error.js';
import { isUniqueConstraintViolation } from '../../shared/errors/prisma-errors.js';
import type {
  AdminWorkspaceResponse,
  DesignatePrincipalResponse,
  InvitationResponse,
  MemberResponse,
  WorkspaceResponse,
  WorkspaceSettingsResponse,
} from '../../shared/types/api.types.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import type { InvitationService } from '../invitations/invitation.service.js';
import type { UserRepository } from '../users/user.repository.js';
import { displayName } from '../users/user.service.js';
import type { MembershipRepository, MembershipWithUser } from './membership.repository.js';
import type { CreateWorkspaceInput, InviteAffiliateInput, VoteRulesInput } from './workspace.validation.js';
import type { WorkspaceRepository } from './workspace.repository.js';

export interface WorkspaceServiceDependencies {
  workspaces: WorkspaceRepository;
  memberships: MembershipRepository;
  users: UserRepository;
  invitations: InvitationService;
  audit: AuditService;
  now: () => Date;
}

function toMemberResponse(membership: MembershipWithUser): MemberResponse {
  return {
    userId: membership.userId,
    email: membership.user.email,
    name: displayName(membership.user),
    role: membership.role,
    canEditDossiers: membership.canEditDossiers,
    joinedAt: membership.createdAt.toISOString(),
  };
}

function toSettingsResponse(workspace: Workspace, canConfigure: boolean): WorkspaceSettingsResponse {
  const { voteBodySize, voteMajorityThreshold, voteQuorum } = workspace;
  return {
    workspaceId: workspace.id,
    name: workspace.name,
    voteRules:
      voteBodySize === null || voteMajorityThreshold === null || voteQuorum === null
        ? null
        : { bodySize: voteBodySize, majorityThreshold: voteMajorityThreshold, quorum: voteQuorum },
    canConfigure,
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

function toWorkspaceResponse(workspace: Workspace): WorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    createdAt: workspace.createdAt.toISOString(),
  };
}

/**
 * Workspace and member management. Callers are authorized by the route guards before any method runs
 * (super-admin, or `manageMembers` in the route's workspace); every method still scopes each read and
 * write by that workspace id, so an id from another workspace is simply not found.
 */
export class WorkspaceService {
  constructor(private readonly deps: WorkspaceServiceDependencies) {}

  /** Super-admin: creates a workspace with no members. Its Principal is designated separately. */
  async create(actorId: string, input: CreateWorkspaceInput, context: RequestContext): Promise<WorkspaceResponse> {
    const workspace = await this.deps.workspaces.create(input);
    if (!workspace) throw new HttpError(409, 'A workspace with this slug already exists');
    this.deps.audit.record(context, {
      action: 'workspace.created',
      userId: actorId,
      workspaceId: workspace.id,
      meta: { slug: workspace.slug },
    });
    return toWorkspaceResponse(workspace);
  }

  /** Super-admin: every workspace with its current Principal. */
  async listOverview(): Promise<AdminWorkspaceResponse[]> {
    return (await this.deps.workspaces.listOverview()).map((workspace) => ({
      ...toWorkspaceResponse(workspace),
      principal:
        workspace.principal === null
          ? null
          : {
              userId: workspace.principal.id,
              email: workspace.principal.email,
              name: displayName(workspace.principal),
            },
      memberCount: workspace.memberCount,
    }));
  }

  /**
   * Super-admin only: designates or transfers the Principal. A current member becomes Principal at once
   * (the previous Principal becomes an Affiliate and is signed out of the workspace); anyone else is sent
   * a Principal invitation, and the transfer happens when they accept it.
   */
  async designatePrincipal(
    actorId: string,
    workspaceId: string,
    email: string,
    context: RequestContext,
  ): Promise<DesignatePrincipalResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const user = await this.deps.users.findByEmail(email);
    const membership = user ? await this.deps.memberships.find(user.id, workspaceId) : null;

    if (user && membership) {
      if (membership.role === Role.PRINCIPAL) throw new HttpError(409, 'This user is already the Principal');
      let previousPrincipalId: string | null;
      try {
        ({ previousPrincipalId } = await this.deps.memberships.transferPrincipal(user.id, workspaceId, this.deps.now()));
      } catch (error) {
        // A concurrent transfer won the one-Principal index; this one rolled back entirely.
        if (isUniqueConstraintViolation(error)) throw new HttpError(409, 'The Principal changed meanwhile. Try again.');
        throw error;
      }
      this.deps.audit.record(context, {
        action: 'workspace.principal_transferred',
        userId: actorId,
        workspaceId,
        meta: { fromUserId: previousPrincipalId, toUserId: user.id },
      });
      const principal = await this.deps.memberships.findWithUser(user.id, workspaceId);
      if (!principal) throw new HttpError(409, 'The membership changed meanwhile. Try again.');
      return { status: 'transferred', principal: toMemberResponse(principal) };
    }

    const invitation = await this.deps.invitations.invite(
      { workspace, email, role: Role.PRINCIPAL, canEditDossiers: false, invitedById: actorId },
      context,
    );
    return { status: 'invited', invitation };
  }

  async listMembers(workspaceId: string): Promise<MemberResponse[]> {
    return (await this.deps.memberships.listForWorkspace(workspaceId)).map(toMemberResponse);
  }

  /** Principal (or super-admin): invites an Affiliate. The role is fixed here, never taken from the request. */
  async inviteAffiliate(
    actorId: string,
    workspaceId: string,
    input: InviteAffiliateInput,
    context: RequestContext,
  ): Promise<InvitationResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    const user = await this.deps.users.findByEmail(input.email);
    if (user && (await this.deps.memberships.find(user.id, workspaceId))) {
      throw new HttpError(409, 'This person is already a member of the workspace');
    }
    return this.deps.invitations.invite(
      { workspace, email: input.email, role: Role.AFFILIATE, canEditDossiers: input.canEditDossiers, invitedById: actorId },
      context,
    );
  }

  /** `roles`: the invitation roles the caller may manage (a Principal: Affiliate invitations only). */
  listInvitations(workspaceId: string, roles: readonly Role[]): Promise<InvitationResponse[]> {
    return this.deps.invitations.listPending(workspaceId, roles);
  }

  revokeInvitation(
    actorId: string,
    workspaceId: string,
    invitationId: string,
    roles: readonly Role[],
    context: RequestContext,
  ): Promise<void> {
    return this.deps.invitations.revoke(actorId, workspaceId, invitationId, roles, context);
  }

  /** Grants or withdraws an Affiliate's dossier-edit right. Takes effect on the Affiliate's next request. */
  async setDossierEdit(
    actorId: string,
    workspaceId: string,
    userId: string,
    canEditDossiers: boolean,
    context: RequestContext,
  ): Promise<MemberResponse> {
    await this.requireAffiliate(userId, workspaceId, 'The Principal always has every permission');
    const updated = await this.deps.memberships.setAffiliateDossierEdit(userId, workspaceId, canEditDossiers);
    if (!updated) throw new HttpError(404, 'Member not found');
    this.deps.audit.record(context, {
      action: 'membership.updated',
      userId: actorId,
      workspaceId,
      meta: { memberId: userId, canEditDossiers },
    });
    return toMemberResponse(updated);
  }

  /** Removes an Affiliate and ends their sessions in this workspace. The Principal must be transferred instead. */
  async removeMember(actorId: string, workspaceId: string, userId: string, context: RequestContext): Promise<void> {
    await this.requireAffiliate(
      userId,
      workspaceId,
      'The Principal cannot be removed. A platform administrator must transfer the Principal role first.',
    );
    if (!(await this.deps.memberships.removeAffiliate(userId, workspaceId, this.deps.now()))) {
      throw new HttpError(404, 'Member not found');
    }
    this.deps.audit.record(context, {
      action: 'membership.removed',
      userId: actorId,
      workspaceId,
      meta: { memberId: userId },
    });
  }

  /** Any member (or super-admin) reads the workspace's settings, including its vote rules. */
  async getSettings(workspaceId: string, canConfigure: boolean): Promise<WorkspaceSettingsResponse> {
    return toSettingsResponse(await this.requireWorkspace(workspaceId), canConfigure);
  }

  /** Principal (or super-admin): replaces the vote rules. The values are audited; they are not sensitive. */
  async updateVoteRules(
    actorId: string,
    workspaceId: string,
    rules: VoteRulesInput,
    context: RequestContext,
  ): Promise<WorkspaceSettingsResponse> {
    const workspace = await this.deps.workspaces.updateVoteRules(workspaceId, {
      voteBodySize: rules.bodySize,
      voteMajorityThreshold: rules.majorityThreshold,
      voteQuorum: rules.quorum,
    });
    if (!workspace) throw new HttpError(404, 'Workspace not found');
    this.deps.audit.record(context, {
      action: 'workspace.settings_updated',
      userId: actorId,
      workspaceId,
      meta: { bodySize: rules.bodySize, majorityThreshold: rules.majorityThreshold, quorum: rules.quorum },
    });
    return toSettingsResponse(workspace, true);
  }

  private async requireWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = await this.deps.workspaces.findById(workspaceId);
    if (!workspace) throw new HttpError(404, 'Workspace not found');
    return workspace;
  }

  private async requireAffiliate(userId: string, workspaceId: string, principalMessage: string): Promise<void> {
    const membership = await this.deps.memberships.find(userId, workspaceId);
    if (!membership) throw new HttpError(404, 'Member not found');
    if (membership.role === Role.PRINCIPAL) throw new HttpError(409, principalMessage);
  }
}
