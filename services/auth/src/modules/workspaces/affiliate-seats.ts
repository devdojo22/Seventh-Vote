import { Role, type Prisma, type PrismaClient } from '@prisma/client';
import type { AffiliateSeatsResponse } from '../../shared/types/api.types.js';

export const AFFILIATE_SEAT_LIMIT_MAX = 500;

type Client = PrismaClient | Prisma.TransactionClient;

export interface AffiliateSeatUsage {
  seatLimit: number | null;
  activeAffiliates: number;
  pendingInvitations: number;
}

/** Thrown inside a transaction so the whole change rolls back; repositories turn it into a result status. */
export class AffiliateSeatLimitReached extends Error {}

export const AFFILIATE_MEMBERSHIP = { role: Role.AFFILIATE } satisfies Prisma.MembershipWhereInput;


export function pendingAffiliateInvitation(now: Date): Prisma.InvitationWhereInput {
  return { role: Role.AFFILIATE, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } };
}

export function toAffiliateSeats({ seatLimit, activeAffiliates, pendingInvitations }: AffiliateSeatUsage): AffiliateSeatsResponse {
  const seatsUsed = activeAffiliates + pendingInvitations;
  return {
    seatLimit,
    seatsUsed,
    seatsAvailable: seatLimit === null ? null : Math.max(0, seatLimit - seatsUsed),
    isOverLimit: seatLimit !== null && seatsUsed > seatLimit,
    activeAffiliates,
    pendingInvitations,
  };
}


export async function readAffiliateSeatUsage(
  client: Client,
  workspaceId: string,
  now: Date,
  options: { replacingEmail?: string } = {},
): Promise<AffiliateSeatUsage | null> {
  const workspace = await client.workspace.findUnique({ where: { id: workspaceId }, select: { seatLimit: true } });
  if (!workspace) return null;
  const activeAffiliates = await client.membership.count({ where: { workspaceId, ...AFFILIATE_MEMBERSHIP } });
  const pendingInvitations = await client.invitation.count({
    where: {
      workspaceId,
      ...pendingAffiliateInvitation(now),
      ...(options.replacingEmail === undefined ? {} : { NOT: { email: options.replacingEmail } }),
    },
  });
  return { seatLimit: workspace.seatLimit, activeAffiliates, pendingInvitations };
}

export async function assertSeatCanBeReserved(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  now: Date,
  options: { replacingEmail?: string } = {},
): Promise<void> {
  const usage = await readAffiliateSeatUsage(tx, workspaceId, now, options);
  if (usage === null) return;
  const { seatLimit, activeAffiliates, pendingInvitations } = usage;
  if (seatLimit !== null && activeAffiliates + pendingInvitations >= seatLimit) throw new AffiliateSeatLimitReached();
}

export async function assertSeatCanBeOccupied(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  added: number,
): Promise<void> {
  if (added <= 0) return;
  const workspace = await tx.workspace.findUnique({ where: { id: workspaceId }, select: { seatLimit: true } });
  const seatLimit = workspace?.seatLimit ?? null;
  if (seatLimit === null) return;
  const activeAffiliates = await tx.membership.count({ where: { workspaceId, ...AFFILIATE_MEMBERSHIP } });
  if (activeAffiliates + added > seatLimit) throw new AffiliateSeatLimitReached();
}
