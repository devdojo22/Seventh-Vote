import { Role, type PrismaClient, type User, type Workspace } from '@prisma/client';
import { isUniqueConstraintViolation } from '../../shared/errors/prisma-errors.js';

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

export interface WorkspaceRepository {
  findById(id: string): Promise<Workspace | null>;
  updateVoteRules(id: string, rules: VoteRulesUpdate): Promise<Workspace | null>;
  create(workspace: NewWorkspace): Promise<Workspace | null>;
  listOverview(): Promise<WorkspaceOverview[]>;
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
}
