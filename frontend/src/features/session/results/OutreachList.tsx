import { StancePill } from '@/components/StancePill';
import { movability } from '@/lib/simulation/pivotal';
import type { SessionAnalysis } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';
import { SectionHeading } from './SectionHeading';

function outreachNote(analysis: SessionAnalysis): string {
  if (analysis.outcome === 'consent') return 'Highest objection risk';
  return analysis.pivot.candidates.length
    ? 'Movability × pivotality'
    : 'Movability; no single-member pivot';
}

/** "First three conversations": the top outreach targets. */
export function OutreachList({ analysis }: { analysis: SessionAnalysis }) {
  const { lobby, direction } = analysis;

  return (
    <>
      <SectionHeading title="First three conversations" note={outreachNote(analysis)} />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
        {lobby.length > 0 ? (
          lobby.map((row, i) => (
            <div
              className="flex flex-col justify-between space-y-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5"
              key={row.member.id}
            >
              <div>
                <span className="mb-1 block text-[11px] font-bold tracking-wider text-gold uppercase">
                  APPROACH {i + 1} · PRIORITY {movability(row, direction)}
                </span>
                <h3 className="mb-2 font-display text-lg font-bold text-navy">{row.member.name}</h3>
                <StancePill stance={row.stance} />

                <h4 className="mt-4 mb-2 border-b border-line/50 pb-1 text-xs font-semibold tracking-wider text-navy/70 uppercase">
                  Lead with
                </h4>
                <ul className="list-inside list-disc space-y-1 font-sans text-xs text-navy/80">
                  {row.levers.map((lever) => (
                    <li key={lever} className="leading-snug">
                      {lever}
                    </li>
                  ))}
                </ul>

                <h4 className="mt-4 mb-2 border-b border-line/50 pb-1 text-xs font-semibold tracking-wider text-navy/70 uppercase">
                  Avoid
                </h4>
                <p className="rounded-lg border border-brick/20 bg-brick-bg p-2.5 font-sans text-xs leading-relaxed text-brick">
                  {row.concerns[0] || 'Overstating what the public record can support'}
                </p>
              </div>

              <EvidenceTrace row={row} />
            </div>
          ))
        ) : (
          <div className="col-span-3 rounded-xl border border-line bg-paper/30 p-5 text-center font-sans text-xs text-navy/60 italic sm:text-sm">
            No voting member is currently ranked for outreach.
          </div>
        )}
      </div>
    </>
  );
}
