import { StancePill } from '@/components/StancePill';
import { BulletList } from '@/components/ui/BulletList';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { movability } from '@/lib/simulation/pivotal';
import type { SessionAnalysis } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';

const SUBHEADING_CLASS = 'mb-2 text-[11px] font-bold tracking-[0.12em] text-muted uppercase';

function outreachNote(analysis: SessionAnalysis): string {
  if (analysis.outcome === 'consent') return 'Highest objection risk';
  return analysis.pivot.candidates.length
    ? 'Movability × pivotality'
    : 'Movability; no single-member pivot';
}

export function OutreachList({ analysis }: { analysis: SessionAnalysis }) {
  const { lobby, direction } = analysis;

  return (
    <div className="space-y-4">
      <SectionHeading title="First three conversations" note={outreachNote(analysis)} />
      {lobby.length > 0 ? (
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {lobby.map((row, i) => (
            <li
              className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card"
              key={row.member.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
                    Approach {i + 1} · Priority {movability(row, direction)}
                  </span>
                  <h3 className="mt-1 font-display text-lg leading-tight font-bold text-navy">
                    {row.member.name}
                  </h3>
                </div>
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-gold2"
                >
                  {i + 1}
                </span>
              </div>
              <div>
                <StancePill stance={row.stance} />
              </div>

              <div className="text-xs text-ink/80">
                <h4 className={SUBHEADING_CLASS}>Lead with</h4>
                <BulletList items={row.levers} />
              </div>

              <div>
                <h4 className={SUBHEADING_CLASS}>Avoid</h4>
                <p className="rounded-xl bg-brick-bg px-3.5 py-2.5 text-xs leading-relaxed text-brick">
                  {row.concerns[0] || 'Overstating what the public record can support'}
                </p>
              </div>

              <div className="mt-auto">
                <EvidenceTrace row={row} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState>No voting member is currently ranked for outreach.</EmptyState>
      )}
    </div>
  );
}
