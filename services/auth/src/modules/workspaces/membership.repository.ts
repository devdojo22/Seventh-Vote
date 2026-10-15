import type { Membership, PrismaClient } from '@prisma/client';

/** The part of a membership that scopes a session: which workspace, with which role. */
export type MembershipScope = Pick<Membership, 'workspaceId' | 'role'>;

export interface MembershipRepository {
  find(userId: string, workspaceId: string): Promise<Membership | null>;
}

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  find(userId: string, workspaceId: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } });
  }
}
