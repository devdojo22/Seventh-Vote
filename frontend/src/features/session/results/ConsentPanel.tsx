import { StancePill } from '@/components/StancePill';
import { useCouncilStore } from '@/stores/council-store';
import type { MemberRow } from '@/types/simulation';

/** Consent lens: objection risk instead of a passage count. */
export function ConsentPanel({ objectors }: { objectors: MemberRow[] }) {
  const consentNote = useCouncilStore((s) => s.config.procedure.consentNote);

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
      <h3 className="font-display text-lg font-bold text-navy">Who might object?</h3>
      <p className="font-sans text-xs leading-relaxed text-navy/70 sm:text-sm">{consentNote}</p>
      {objectors.length ? (
        <ul className="space-y-2">
          {objectors.map((r) => (
            <li
              key={r.member.id}
              className="flex flex-col justify-between gap-1 rounded-xl border border-line bg-paper/40 p-3 font-sans text-xs sm:flex-row sm:items-center sm:text-sm"
            >
              <strong className="font-semibold text-navy">{r.member.name}</strong>
              <span className="flex items-center gap-2 text-navy/70">
                <StancePill stance={r.stance} />
                {r.concerns[0] || 'No specific objection trigger documented'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-paper/30 p-4 text-center font-sans text-xs text-navy/60 italic">
          No likely objector appears in this projection, but one objection is still enough to remove
          the item.
        </div>
      )}
    </div>
  );
}
