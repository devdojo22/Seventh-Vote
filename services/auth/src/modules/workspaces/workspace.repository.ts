import { Role, type Prisma, type PrismaClient, type User, type Workspace } from '@prisma/client';
import { isUniqueConstraintViolation } from '../../shared/errors/prisma-errors.js';
import { insertAuditEntry } from '../audit/audit.repository.js';

const DELETE_TRANSACTION_TIMEOUT_MS = 60_000;

export interface NewWorkspace {
  name: string;
  slug: string;
}

export type WorkspaceOverview = Workspace & {
  principal: User | null;
  memberCount: number;
};

export interface VoteRulesUpdate {
  voteBodySize: number;
  voteMajorityThreshold: number;
  voteQuorum: number;
}

export type LifecycleResult = 'done' | 'not-found' | 'already-in-state';

export type DeletionResult = 'deleted' | 'not-found' | 'not-archived' | 'confirmation-mismatch';

export interface DeletionActor {
  userId: string;
  ip: string | null;
}


export async function lockWorkspace(tx: Prisma.TransactionClient, workspaceId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`workspace:${workspaceId}`}))`;
}

export interface WorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  updateVoteRules(id: string, rules: VoteRulesUpdate): Promise<Workspace | null>;
  create(workspace: NewWorkspace): Promise<Workspace | null>;
  listOverview(): Promise<WorkspaceOverview[]>;
  archive(id: string, now: Date): Promise<LifecycleResult>;
  restore(id: string): Promise<LifecycleResult>;
  deletePermanently(id: string, confirmSlug: string, actor: DeletionActor, now: Date): Promise<DeletionResult>;
}

export class PrismaWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string): Promise<Workspace | null> {
    return this.prisma.workspace.findUnique({ where: { id } });
  }

  async updateVoteRules(id: string, rules: VoteRulesUpdate): Promise<Workspace | null> {
    const { count } = await this.prisma.workspace.updateMany({ where: { id }, data: rules });
    return count === 1 ? this.findById(id) : null;
  }

  async create(workspace: NewWorkspace): Promise<Workspace | null> {
    try {
      return await this.prisma.workspace.create({ data: workspace });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) return null;
      throw error;
    }
  }

  async listOverview(): Promise<WorkspaceOverview[]> {
    const workspaces = await this.prisma.workspace.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        memberships: { where: { role: Role.PRINCIPAL }, include: { user: true } },
        _count: { select: { memberships: true } },
      },
    });
    return workspaces.map(({ memberships, _count, ...workspace }) => ({
      ...workspace,
      principal: memberships[0]?.user ?? null,
      memberCount: _count.memberships,
    }));
  }

  archive(id: string, now: Date): Promise<LifecycleResult> {
    return this.setArchivedAt(id, now);
  }

  restore(id: string): Promise<LifecycleResult> {
    return this.setArchivedAt(id, null);
  }

 
  deletePermanently(id: string, confirmSlug: string, actor: DeletionActor, now: Date): Promise<DeletionResult> {
    return this.prisma.$transaction(
      async (tx): Promise<DeletionResult> => {
        await lockWorkspace(tx, id);
        const workspace = await tx.workspace.findUnique({ where: { id } });
        if (!workspace) return 'not-found';
        if (workspace.archivedAt === null) return 'not-archived';
        if (workspace.slug !== confirmSlug) return 'confirmation-mismatch';

        await tx.refreshToken.updateMany({ where: { workspaceId: id, revokedAt: null }, data: { revokedAt: now } });
        await tx.auditLog.deleteMany({ where: { workspaceId: id } });
        await tx.invitation.deleteMany({ where: { workspaceId: id } });
        await tx.membership.deleteMany({ where: { workspaceId: id } });
        await tx.workspace.delete({ where: { id } });
        await insertAuditEntry(tx, {
          action: 'workspace.deleted',
          userId: actor.userId,
          workspaceId: null,
          ip: actor.ip,
          meta: { workspaceName: workspace.name },
        });
        return 'deleted';
      },
      { timeout: DELETE_TRANSACTION_TIMEOUT_MS },
    );
  }

  private setArchivedAt(id: string, archivedAt: Date | null): Promise<LifecycleResult> {
    return this.prisma.$transaction(async (tx): Promise<LifecycleResult> => {
      await lockWorkspace(tx, id);
      const workspace = await tx.workspace.findUnique({ where: { id } });
      if (!workspace) return 'not-found';
      if ((workspace.archivedAt === null) === (archivedAt === null)) return 'already-in-state';
      await tx.workspace.update({ where: { id }, data: { archivedAt } });
      return 'done';
    });
  }
}
