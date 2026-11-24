import { StancePill } from '@/components/StancePill';
import { BulletList } from '@/components/ui/BulletList';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { NOTHING_IN_EVIDENCE } from '@/features/simulation/simulation-text';
import { movability } from '@/lib/simulation/pivotal';
import { outreachNote } from '@/lib/simulation/session-summary';
import type { SessionAnalysis } from '@/types/simulation';
import { EvidenceTrace } from './EvidenceTrace';

const SUBHEADING_CLASS = 'mb-2.5 text-[11px] font-bold tracking-[0.12em] text-navy/80 uppercase';

export function OutreachList({ analysis }: { analysis: SessionAnalysis }) {
  const { lobby, direction } = analysis;

  return (
    <div className="space-y-4">
      <SectionHeading title="First three conversations" note={outreachNote(analysis)} />
      {lobby.length > 0 ? (
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {lobby.map((row, i) => (
            <li
              className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6"
              key={row.member.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold tracking-[0.12em] text-gold uppercase">
                    Approach {i + 1} · Priority {movability(row, direction)}
                  </span>
                  <h3 className="mt-1.5 font-display text-xl leading-tight font-bold text-navy">
                    {row.member.name}
                  </h3>
                </div>
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-navy font-display text-sm font-bold text-white"
                >
                  {i + 1}
                </span>
              </div>
              <div>
                <StancePill stance={row.stance} />
              </div>

              <div className="text-[13px] leading-relaxed text-ink/85">
                <h4 className={SUBHEADING_CLASS}>Lead with</h4>
                <BulletList
                  items={row.answer.levers}
                  empty={NOTHING_IN_EVIDENCE}
                  className="space-y-2.5"
                />
              </div>

              <div>
                <h4 className={SUBHEADING_CLASS}>Avoid</h4>
                <p className="rounded-xl bg-brick-bg px-4 py-3 text-[13px] leading-relaxed text-brick">
                  {row.answer.concerns[0] ?? NOTHING_IN_EVIDENCE}
                </p>
              </div>

              <div className="mt-auto pt-2">
                <EvidenceTrace citations={row.answer.citations} />
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
