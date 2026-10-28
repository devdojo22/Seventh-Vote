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
import type { MembershipRepository, MembershipWithUser, TransferResult } from './membership.repository.js';
import { WORKSPACE_ARCHIVED } from './workspace-access.service.js';
import type {
  CreateWorkspaceInput,
  DesignatePrincipalInput,
  InviteAffiliateInput,
  VoteRulesInput,
} from './workspace.validation.js';
import type { LifecycleResult, WorkspaceRepository } from './workspace.repository.js';

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
    archivedAt: workspace.archivedAt?.toISOString() ?? null,
    createdAt: workspace.createdAt.toISOString(),
  };
}


export class WorkspaceService {
  constructor(private readonly deps: WorkspaceServiceDependencies) {}

  /** Super-admin: creates a workspace with no members. Its Principal is designated separately. */
  async create(actorId: string, input: CreateWorkspaceInput, context: RequestContext): Promise<WorkspaceResponse> {
    const workspace = await this.deps.workspaces.create(input);
    if (!workspace) throw new HttpError(409, 'A workspace with this slug already exists');
    await this.deps.audit.record(context, {
      action: 'workspace.created',
      userId: actorId,
      workspaceId: workspace.id,
      meta: { slug: workspace.slug },
    });
    return toWorkspaceResponse(workspace);
  }

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



  async designatePrincipal(
    actorId: string,
    workspaceId: string,
    { email, previousPrincipal }: DesignatePrincipalInput,
    context: RequestContext,
  ): Promise<DesignatePrincipalResponse> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.archivedAt !== null) throw new HttpError(409, WORKSPACE_ARCHIVED);
    const user = await this.deps.users.findByEmail(email);
    const membership = user ? await this.deps.memberships.find(user.id, workspaceId) : null;

    if (user && membership) {
      let result: TransferResult;
      try {
        result = await this.deps.memberships.transferPrincipal(user.id, workspaceId, previousPrincipal, this.deps.now());
      } catch (error) {
        if (isUniqueConstraintViolation(error)) throw new HttpError(409, 'The Principal changed meanwhile. Try again.');
        throw error;
      }
      switch (result.status) {
        case 'workspace-unavailable':
          throw new HttpError(409, 'The workspace was archived or deleted meanwhile.');
        case 'not-member':
          throw new HttpError(409, 'This person left the workspace meanwhile. Try again.');
        case 'already-principal':
          throw new HttpError(409, 'This user is already the Principal');
        case 'transferred':
          break;
      }
      await this.deps.audit.record(context, {
        action: 'workspace.principal_transferred',
        userId: actorId,
        workspaceId,
        meta: {
          fromUserId: result.previousPrincipalId,
          toUserId: user.id,
          previousPrincipalOutcome: result.previousPrincipalOutcome,
        },
      });
      const principal = await this.deps.memberships.findWithUser(user.id, workspaceId);
      if (!principal) throw new HttpError(409, 'The membership changed meanwhile. Try again.');
      return { status: 'transferred', principal: toMemberResponse(principal) };
    }

    const invitation = await this.deps.invitations.invite(
      {
        workspace,
        email,
        role: Role.PRINCIPAL,
        canEditDossiers: false,
        previousPrincipalOutcome: previousPrincipal,
        invitedById: actorId,
      },
      context,
    );
    return { status: 'invited', invitation };
  }

  async archive(actorId: string, workspaceId: string, context: RequestContext): Promise<void> {
    const result = await this.deps.workspaces.archive(workspaceId, this.deps.now());
    this.assertLifecycleChanged(result, 'This workspace is already archived');
    await this.deps.audit.record(context, { action: 'workspace.archived', userId: actorId, workspaceId });
  }

  async restore(actorId: string, workspaceId: string, context: RequestContext): Promise<void> {
    const result = await this.deps.workspaces.restore(workspaceId);
    this.assertLifecycleChanged(result, 'This workspace is not archived');
    await this.deps.audit.record(context, { action: 'workspace.restored', userId: actorId, workspaceId });
  }

  async deletePermanently(
    actorId: string,
    workspaceId: string,
    confirmSlug: string,
    context: RequestContext,
  ): Promise<void> {
    const result = await this.deps.workspaces.deletePermanently(
      workspaceId,
      confirmSlug,
      { userId: actorId, ip: context.ip },
      this.deps.now(),
    );
    switch (result) {
      case 'not-found':
        throw new HttpError(404, 'Workspace not found');
      case 'not-archived':
        throw new HttpError(409, 'Archive the workspace before deleting it permanently');
      case 'confirmation-mismatch':
        throw new HttpError(400, 'The confirmation does not match the workspace slug');
      case 'deleted':
        return;
    }
  }

  async listMembers(workspaceId: string): Promise<MemberResponse[]> {
    return (await this.deps.memberships.listForWorkspace(workspaceId)).map(toMemberResponse);
  }

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
      {
        workspace,
        email: input.email,
        role: Role.AFFILIATE,
        canEditDossiers: input.canEditDossiers,
        previousPrincipalOutcome: null,
        invitedById: actorId,
      },
      context,
    );
  }

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
    await this.deps.audit.record(context, {
      action: 'membership.updated',
      userId: actorId,
      workspaceId,
      meta: { memberId: userId, canEditDossiers },
    });
    return toMemberResponse(updated);
  }

  async removeMember(actorId: string, workspaceId: string, userId: string, context: RequestContext): Promise<void> {
    await this.requireAffiliate(
      userId,
      workspaceId,
      'The Principal cannot be removed. A platform administrator must transfer the Principal role first.',
    );
    if (!(await this.deps.memberships.removeAffiliate(userId, workspaceId, this.deps.now()))) {
      throw new HttpError(404, 'Member not found');
    }
    await this.deps.audit.record(context, {
      action: 'membership.removed',
      userId: actorId,
      workspaceId,
      meta: { memberId: userId },
    });
  }

  async getSettings(workspaceId: string, canConfigure: boolean): Promise<WorkspaceSettingsResponse> {
    return toSettingsResponse(await this.requireWorkspace(workspaceId), canConfigure);
  }

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
    await this.deps.audit.record(context, {
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

  private assertLifecycleChanged(result: LifecycleResult, alreadyMessage: string): void {
    if (result === 'not-found') throw new HttpError(404, 'Workspace not found');
    if (result === 'already-in-state') throw new HttpError(409, alreadyMessage);
  }

  private async requireAffiliate(userId: string, workspaceId: string, principalMessage: string): Promise<void> {
    const membership = await this.deps.memberships.find(userId, workspaceId);
    if (!membership) throw new HttpError(404, 'Member not found');
    if (membership.role === Role.PRINCIPAL) throw new HttpError(409, principalMessage);
  }
}
