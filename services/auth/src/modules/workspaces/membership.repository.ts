import {
  PreviousPrincipalOutcome,
  Role,
  type Membership,
  type Prisma,
  type PrismaClient,
  type User,
  type Workspace,
} from '@prisma/client';
import { lockWorkspace } from './workspace.repository.js';

/** The part of a membership that scopes a session: which workspace, with which role. */
export type MembershipScope = Pick<Membership, 'workspaceId' | 'role'>;

export type MembershipWithUser = Membership & { user: User };
export type MembershipWithWorkspace = Membership & { workspace: Workspace };

const IN_ACTIVE_WORKSPACE = { workspace: { archivedAt: null } } satisfies Prisma.MembershipWhereInput;

export interface GrantedMembership {
  userId: string;
  workspaceId: string;
  role: Role;
  canEditDossiers: boolean;
  previousPrincipal: PreviousPrincipalOutcome;
  now: Date;
}

export interface PrincipalChange {
  previousPrincipalId: string | null;
  previousPrincipalOutcome: PreviousPrincipalOutcome | null;
}

export type TransferResult =
  | ({ status: 'transferred' } & PrincipalChange)
  | { status: 'workspace-unavailable' }
  | { status: 'not-member' }
  | { status: 'already-principal' };

async function revokeWorkspaceSessions(
  tx: Prisma.TransactionClient,
  userIds: readonly string[],
  workspaceId: string,
  now: Date,
): Promise<void> {
  if (userIds.length === 0) return;
  await tx.refreshToken.updateMany({
    where: { userId: { in: [...userIds] }, workspaceId, revokedAt: null },
    data: { revokedAt: now },
  });
}


export async function grantMembership(tx: Prisma.TransactionClient, grant: GrantedMembership): Promise<PrincipalChange> {
  const { userId, workspaceId, role, canEditDossiers, previousPrincipal, now } = grant;
  if (role === Role.AFFILIATE) {
    await tx.membership.upsert({
      where: { userId_workspaceId: { userId, workspaceId } },
      update: {},
      create: { userId, workspaceId, role, canEditDossiers },
    });
    if (canEditDossiers) {
      await tx.membership.updateMany({
        where: { userId, workspaceId, role: Role.AFFILIATE },
        data: { canEditDossiers: true },
      });
    }
    return { previousPrincipalId: null, previousPrincipalOutcome: null };
  }

  await tx.invitation.updateMany({
    where: { workspaceId, role: Role.PRINCIPAL, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  const previous = await tx.membership.findFirst({
    where: { workspaceId, role: Role.PRINCIPAL, userId: { not: userId } },
  });
  if (previous) {
    if (previousPrincipal === PreviousPrincipalOutcome.KEEP_AS_AFFILIATE) {
      await tx.membership.update({
        where: { id: previous.id },
        data: { role: Role.AFFILIATE, canEditDossiers: false },
      });
    } else {
      await tx.membership.delete({ where: { id: previous.id } });
    }
    await revokeWorkspaceSessions(tx, [previous.userId], workspaceId, now);
  }
  await tx.membership.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    update: { role: Role.PRINCIPAL },
    create: { userId, workspaceId, role: Role.PRINCIPAL },
  });
  return previous
    ? { previousPrincipalId: previous.userId, previousPrincipalOutcome: previousPrincipal }
    : { previousPrincipalId: null, previousPrincipalOutcome: null };
}

export interface MembershipRepository {
  find(userId: string, workspaceId: string): Promise<Membership | null>;
  /** The membership only while its workspace is not archived: the lookup every access decision uses. */
  findActive(userId: string, workspaceId: string): Promise<Membership | null>;
  findWithUser(userId: string, workspaceId: string): Promise<MembershipWithUser | null>;
  /** The user's memberships in workspaces that are not archived. */
  listActiveForUser(userId: string): Promise<MembershipWithWorkspace[]>;
  listForWorkspace(workspaceId: string): Promise<MembershipWithUser[]>;
  transferPrincipal(
    userId: string,
    workspaceId: string,
    previousPrincipal: PreviousPrincipalOutcome,
    now: Date,
  ): Promise<TransferResult>;
  setAffiliateDossierEdit(userId: string, workspaceId: string, canEditDossiers: boolean): Promise<MembershipWithUser | null>;
  removeAffiliate(userId: string, workspaceId: string, now: Date): Promise<boolean>;
}

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  find(userId: string, workspaceId: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } });
  }

  findActive(userId: string, workspaceId: string): Promise<Membership | null> {
    return this.prisma.membership.findFirst({ where: { userId, workspaceId, ...IN_ACTIVE_WORKSPACE } });
  }

  findWithUser(userId: string, workspaceId: string): Promise<MembershipWithUser | null> {
    return this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { user: true },
    });
  }

  listActiveForUser(userId: string): Promise<MembershipWithWorkspace[]> {
    return this.prisma.membership.findMany({
      where: { userId, ...IN_ACTIVE_WORKSPACE },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listForWorkspace(workspaceId: string): Promise<MembershipWithUser[]> {
    return this.prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Promotes an existing member. State is re-read under the workspace lock, so concurrent transfers serialize. */
  transferPrincipal(
    userId: string,
    workspaceId: string,
    previousPrincipal: PreviousPrincipalOutcome,
    now: Date,
  ): Promise<TransferResult> {
    return this.prisma.$transaction(async (tx): Promise<TransferResult> => {
      await lockWorkspace(tx, workspaceId);
      const workspace = await tx.workspace.findUnique({ where: { id: workspaceId } });
      // Missing (undefined) or archived (a date): only an active workspace has archivedAt === null.
      if (workspace?.archivedAt !== null) return { status: 'workspace-unavailable' };
      const membership = await tx.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } });
      if (!membership) return { status: 'not-member' };
      if (membership.role === Role.PRINCIPAL) return { status: 'already-principal' };
      const change = await grantMembership(tx, {
        userId,
        workspaceId,
        role: Role.PRINCIPAL,
        canEditDossiers: false,
        previousPrincipal,
        now,
      });
      return { status: 'transferred', ...change };
    });
  }

  async setAffiliateDossierEdit(
    userId: string,
    workspaceId: string,
    canEditDossiers: boolean,
  ): Promise<MembershipWithUser | null> {
    const { count } = await this.prisma.membership.updateMany({
      where: { userId, workspaceId, role: Role.AFFILIATE },
      data: { canEditDossiers },
    });
    return count === 1 ? this.findWithUser(userId, workspaceId) : null;
  }

  removeAffiliate(userId: string, workspaceId: string, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.membership.deleteMany({ where: { userId, workspaceId, role: Role.AFFILIATE } });
      if (count !== 1) return false;
      await revokeWorkspaceSessions(tx, [userId], workspaceId, now);
      return true;
    });
  }
}
