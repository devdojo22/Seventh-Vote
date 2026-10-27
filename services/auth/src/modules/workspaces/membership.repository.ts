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

export interface PrincipalChange {
  previousPrincipalId: string | null;
}

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
  listForUser(userId: string): Promise<MembershipWithWorkspace[]>;
  listForWorkspace(workspaceId: string): Promise<MembershipWithUser[]>;
  transferPrincipal(userId: string, workspaceId: string, now: Date): Promise<PrincipalChange>;
  setAffiliateDossierEdit(userId: string, workspaceId: string, canEditDossiers: boolean): Promise<MembershipWithUser | null>;
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
