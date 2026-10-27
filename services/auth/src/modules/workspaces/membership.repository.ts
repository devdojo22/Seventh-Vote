import { Role, type Membership, type Prisma, type PrismaClient, type User, type Workspace } from '@prisma/client';

/** The part of a membership that scopes a session: which workspace, with which role. */
export type MembershipScope = Pick<Membership, 'workspaceId' | 'role'>;

export type MembershipWithUser = Membership & { user: User };
export type MembershipWithWorkspace = Membership & { workspace: Workspace };

export interface GrantedMembership {
  userId: string;
  workspaceId: string;
  role: Role;
  canEditDossiers: boolean;
  now: Date;
}

/** Outcome of making someone the Principal: who lost the role (at most one, by the unique index). */
export interface PrincipalChange {
  previousPrincipalId: string | null;
}

/** Revokes every live session of `userIds` that is scoped to `workspaceId`. */
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

/**
 * Applies a granted membership inside a transaction. An AFFILIATE grant adds the membership when absent;
 * for an existing Affiliate it only adds the dossier-edit right when granted, and it never changes a
 * Principal (so it can never demote one). A PRINCIPAL grant revokes other
 * pending Principal invitations, demotes the current Principal to AFFILIATE and ends their sessions in this
 * workspace, then promotes the user; the partial unique index rejects any concurrent second Principal.
 */
export async function grantMembership(tx: Prisma.TransactionClient, grant: GrantedMembership): Promise<PrincipalChange> {
  const { userId, workspaceId, role, canEditDossiers, now } = grant;
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
    return { previousPrincipalId: null };
  }

  // The role is now settled, so any other outstanding Principal invitation would only contradict it.
  await tx.invitation.updateMany({
    where: { workspaceId, role: Role.PRINCIPAL, acceptedAt: null, revokedAt: null },
    data: { revokedAt: now },
  });
  const previous = await tx.membership.findFirst({
    where: { workspaceId, role: Role.PRINCIPAL, userId: { not: userId } },
  });
  if (previous) {
    await tx.membership.update({
      where: { id: previous.id },
      data: { role: Role.AFFILIATE, canEditDossiers: false },
    });
    await revokeWorkspaceSessions(tx, [previous.userId], workspaceId, now);
  }
  await tx.membership.upsert({
    where: { userId_workspaceId: { userId, workspaceId } },
    update: { role: Role.PRINCIPAL },
    create: { userId, workspaceId, role: Role.PRINCIPAL },
  });
  return { previousPrincipalId: previous?.userId ?? null };
}

export interface MembershipRepository {
  find(userId: string, workspaceId: string): Promise<Membership | null>;
  findWithUser(userId: string, workspaceId: string): Promise<MembershipWithUser | null>;
  /** Memberships of one user, oldest first, each with its workspace. */
  listForUser(userId: string): Promise<MembershipWithWorkspace[]>;
  /** Members of one workspace, Principal first, then oldest first. */
  listForWorkspace(workspaceId: string): Promise<MembershipWithUser[]>;
  /** Makes an existing member the Principal (see grantMembership). */
  transferPrincipal(userId: string, workspaceId: string, now: Date): Promise<PrincipalChange>;
  /** Sets the dossier-edit right of an Affiliate. Returns null when no such Affiliate is in the workspace. */
  setAffiliateDossierEdit(userId: string, workspaceId: string, canEditDossiers: boolean): Promise<MembershipWithUser | null>;
  /**
   * Removes an Affiliate and, in the same transaction, ends their sessions scoped to the workspace.
   * Returns false when no such Affiliate is in the workspace (a Principal is never removed here).
   */
  removeAffiliate(userId: string, workspaceId: string, now: Date): Promise<boolean>;
}

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaClient) {}

  find(userId: string, workspaceId: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } });
  }

  findWithUser(userId: string, workspaceId: string): Promise<MembershipWithUser | null> {
    return this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { user: true },
    });
  }

  listForUser(userId: string): Promise<MembershipWithWorkspace[]> {
    return this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  listForWorkspace(workspaceId: string): Promise<MembershipWithUser[]> {
    // Enum order is PRINCIPAL, AFFILIATE, so ascending role puts the Principal first.
    return this.prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  transferPrincipal(userId: string, workspaceId: string, now: Date): Promise<PrincipalChange> {
    return this.prisma.$transaction((tx) =>
      grantMembership(tx, { userId, workspaceId, role: Role.PRINCIPAL, canEditDossiers: false, now }),
    );
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
