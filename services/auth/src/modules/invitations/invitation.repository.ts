import { Role, type Invitation, type Prisma, type PrismaClient, type Workspace } from '@prisma/client';
import { grantMembership, type PrincipalChange } from '../workspaces/membership.repository.js';

export type InvitationWithWorkspace = Invitation & { workspace: Workspace };

export interface NewInvitation {
  workspaceId: string;
  email: string;
  role: Role;
  canEditDossiers: boolean;
  tokenHash: string;
  invitedById: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface NewAccount {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
}

export type AcceptResult =
  | { status: 'accepted'; userId: string; workspaceId: string; role: Role; change: PrincipalChange }
  | { status: 'invalid' }
  | { status: 'account-exists' };

export interface InvitationRepository {
  create(invitation: NewInvitation): Promise<Invitation>;
  markSent(invitation: Pick<Invitation, 'id' | 'workspaceId' | 'email' | 'role'>, now: Date): Promise<boolean>;
  findByHash(tokenHash: string): Promise<InvitationWithWorkspace | null>;
  listPending(workspaceId: string, now: Date, roles: readonly Role[]): Promise<Invitation[]>;
  revoke(id: string, workspaceId: string, now: Date, roles: readonly Role[]): Promise<boolean>;
  acceptWithNewAccount(id: string, account: NewAccount, now: Date): Promise<AcceptResult>;
  acceptForUser(id: string, userId: string, now: Date): Promise<AcceptResult>;
}

async function claim(tx: Prisma.TransactionClient, id: string, now: Date): Promise<Invitation | null> {
  const { count } = await tx.invitation.updateMany({
    where: { id, sentAt: { not: null }, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
    data: { acceptedAt: now },
  });
  return count === 1 ? tx.invitation.findUnique({ where: { id } }) : null;
}

async function grant(
  tx: Prisma.TransactionClient,
  invitation: Invitation,
  userId: string,
  now: Date,
): Promise<AcceptResult> {
  const change = await grantMembership(tx, {
    userId,
    workspaceId: invitation.workspaceId,
    role: invitation.role,
    canEditDossiers: invitation.canEditDossiers,
    now,
  });
  return { status: 'accepted', userId, workspaceId: invitation.workspaceId, role: invitation.role, change };
}

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  create(invitation: NewInvitation): Promise<Invitation> {
    return this.prisma.invitation.create({ data: { ...invitation, sentAt: null } });
  }

  markSent({ id, workspaceId, email, role }: Pick<Invitation, 'id' | 'workspaceId' | 'email' | 'role'>, now: Date): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invitation:${workspaceId}`}))`;
      const { count } = await tx.invitation.updateMany({
        where: { id, sentAt: null, acceptedAt: null, revokedAt: null },
        data: { sentAt: now },
      });
      if (count !== 1) return false;
      await tx.invitation.updateMany({
        where: {
          workspaceId,
          id: { not: id },
          sentAt: { not: null },
          acceptedAt: null,
          revokedAt: null,
          OR: [{ email, role }, ...(role === Role.PRINCIPAL ? [{ role: Role.PRINCIPAL }] : [])],
        },
        data: { revokedAt: now },
      });
      return true;
    });
  }

  findByHash(tokenHash: string): Promise<InvitationWithWorkspace | null> {
    return this.prisma.invitation.findUnique({ where: { tokenHash }, include: { workspace: true } });
  }

  listPending(workspaceId: string, now: Date, roles: readonly Role[]): Promise<Invitation[]> {
    return this.prisma.invitation.findMany({
      where: {
        workspaceId,
        role: { in: [...roles] },
        sentAt: { not: null },
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(id: string, workspaceId: string, now: Date, roles: readonly Role[]): Promise<boolean> {
    const { count } = await this.prisma.invitation.updateMany({
      where: { id, workspaceId, role: { in: [...roles] }, acceptedAt: null, revokedAt: null },
      data: { revokedAt: now },
    });
    return count === 1;
  }

  acceptWithNewAccount(id: string, account: NewAccount, now: Date): Promise<AcceptResult> {
    return this.prisma.$transaction(async (tx) => {
      if (await tx.user.findUnique({ where: { email: account.email } })) return { status: 'account-exists' };
      const invitation = await claim(tx, id, now);
      if (!invitation) return { status: 'invalid' };
      const user = await tx.user.create({ data: { ...account, emailVerifiedAt: now } });
      return grant(tx, invitation, user.id, now);
    });
  }

  acceptForUser(id: string, userId: string, now: Date): Promise<AcceptResult> {
    return this.prisma.$transaction(async (tx) => {
      const invitation = await claim(tx, id, now);
      if (!invitation) return { status: 'invalid' };
      return grant(tx, invitation, userId, now);
    });
  }
}
