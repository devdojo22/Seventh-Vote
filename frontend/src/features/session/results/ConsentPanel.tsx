import { StancePill } from '@/components/StancePill';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCouncilStore } from '@/stores/council-store';
import type { MemberRow } from '@/types/simulation';

/** Consent lens: objection risk instead of a passage count. */
export function ConsentPanel({ objectors }: { objectors: MemberRow[] }) {
  const consentNote = useCouncilStore((s) => s.config.procedure.consentNote);

  return (
    <Card className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="font-display text-xl font-bold text-navy">Who might object?</h3>
        <p className="text-[13px] leading-relaxed text-muted">{consentNote}</p>
      </div>
      {objectors.length ? (
        <ul className="divide-y divide-line2 rounded-xl border border-line">
          {objectors.map((r) => (
            <li
              key={r.member.id}
              className="flex flex-col justify-between gap-2 px-4 py-3 text-[13px] sm:flex-row sm:items-center"
            >
              <strong className="font-semibold text-navy">{r.member.name}</strong>
              <span className="flex flex-wrap items-center gap-2 text-muted">
                <StancePill stance={r.stance} />
                {r.concerns[0] || 'No specific objection trigger documented'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>
          No likely objector appears in this projection, but one objection is still enough to remove
          the item.
        </EmptyState>
      )}
    </Card>
  );
}
