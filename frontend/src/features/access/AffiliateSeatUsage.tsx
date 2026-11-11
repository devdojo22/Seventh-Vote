import type { ReactNode } from 'react';
import { AlertIcon } from '@/components/ui/icons';
import { Meter, type MeterTone } from '@/components/ui/Meter';
import type { AffiliateSeats } from './access-api';
import { SeatStatusBadge } from './AccessBadges';
import {
  describeSeats,
  overLimitExplanation,
  seatBreakdown,
  seatStateCaption,
  seatTotal,
  type SeatStateKind,
} from './affiliate-seats';

const METER_TONES: Record<Exclude<SeatStateKind, 'unlimited'>, MeterTone> = {
  available: 'navy',
  full: 'gold',
  over: 'brick',
};

export function AffiliateSeatUsage({
  seats,
  action,
}: {
  seats: AffiliateSeats;
  action?: ReactNode;
}) {
  const { seatLimit, seatsUsed, activeAffiliates, pendingInvitations } = seats;
  const state = describeSeats(seatLimit, seatsUsed);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="shrink-0 sm:w-36">
          <div className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
            Affiliate seats
          </div>
          <div className="mt-0.5 font-display text-base font-bold text-navy">
            {seatTotal(seatLimit, seatsUsed)}
          </div>
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <SeatStatusBadge kind={state.kind} />
            <span className="font-semibold text-navy">{seatStateCaption(state)}</span>
            <span className="text-muted">
              {seatBreakdown(activeAffiliates, pendingInvitations)}
            </span>
          </div>
          {state.kind !== 'unlimited' && seatLimit !== null && (
            <Meter
              className="max-w-sm"
              tone={METER_TONES[state.kind]}
              percent={seatLimit === 0 ? (seatsUsed > 0 ? 100 : 0) : (seatsUsed / seatLimit) * 100}
              label={`${String(seatsUsed)} of ${String(seatLimit)} Affiliate seats used`}
            />
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {state.kind === 'over' && seatLimit !== null && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-brick">
          <AlertIcon className="mt-px size-3.5 shrink-0" />
          {overLimitExplanation(seatsUsed, seatLimit)}
        </p>
      )}
    </div>
  );
}
