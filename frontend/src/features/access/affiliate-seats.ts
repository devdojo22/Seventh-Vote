

export const AFFILIATE_SEAT_LIMIT_MAX = 500;

export type SeatState =
  | { kind: 'unlimited' }
  | { kind: 'available'; available: number }
  | { kind: 'full' }
  | { kind: 'over'; over: number };

export type SeatStateKind = SeatState['kind'];

/** `limit` null means unlimited. */
export function describeSeats(limit: number | null, used: number): SeatState {
  if (limit === null) return { kind: 'unlimited' };
  if (used > limit) return { kind: 'over', over: used - limit };
  if (used === limit) return { kind: 'full' };
  return { kind: 'available', available: limit - used };
}

export const SEAT_STATE_LABELS: Record<SeatStateKind, string> = {
  unlimited: 'Unlimited',
  available: 'Available',
  full: 'Full',
  over: 'Over limit',
};

export function seatStateCaption(state: SeatState): string {
  switch (state.kind) {
    case 'unlimited':
      return 'No seat restriction';
    case 'available':
      return `${String(state.available)} available`;
    case 'full':
      return 'No seats remaining';
    case 'over':
      return `${String(state.over)} over limit`;
  }
}

export function seatTotal(limit: number | null, used: number): string {
  return limit === null ? 'Unlimited' : `${String(used)} / ${String(limit)} seats`;
}

export function seatBreakdown(activeAffiliates: number, pendingInvitations: number): string {
  return `${String(activeAffiliates)} active · ${String(pendingInvitations)} pending`;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${String(count)} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Seats to free before a new Affiliate can be added: adding needs usage below the limit, so usage must drop to
 * limit − 1.
 */
export function seatsToFree(used: number, limit: number): number {
  return Math.max(0, used - limit + 1);
}

/** Why new Affiliates are blocked while usage exceeds the limit. */
export function overLimitExplanation(used: number, limit: number): string {
  const toFree = seatsToFree(used, limit);
  return `Existing Affiliates and pending invitations are unchanged. New Affiliates cannot be added until ${plural(toFree, 'seat is', 'seats are')} freed.`;
}

/** Shown before saving a limit below current usage. */
export function lowerLimitWarning(used: number, limit: number): string {
  const toFree = seatsToFree(used, limit);
  return `This workspace currently uses ${plural(used, 'Affiliate seat', 'Affiliate seats')}. Lowering the limit to ${String(limit)} will not remove existing Affiliates or pending invitations. No new Affiliates can be added until at least ${plural(toFree, 'seat is', 'seats are')} freed.`;
}
