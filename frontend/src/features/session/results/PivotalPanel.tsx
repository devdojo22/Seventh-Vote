import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Meter } from '@/components/ui/Meter';
import { NOTHING_IN_EVIDENCE } from '@/features/simulation/simulation-text';
import { pivotalCopy } from '@/lib/simulation/session-summary';
import type { SessionAnalysis } from '@/types/simulation';

export function PivotalPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { pivot } = analysis;
  const { title, desc, goal, action } = pivotalCopy(analysis);

  return (
    <Card padded={false} className="space-y-6 p-5 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <span className="block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
            Pivotal-voter view
          </span>
          <h3 className="mt-1.5 font-display text-xl font-bold text-navy sm:text-[22px]">
            {title}
          </h3>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-muted sm:text-sm">{desc}</p>
        </div>
        <div className="w-full shrink-0 rounded-2xl bg-paper px-6 py-4 text-center sm:w-auto sm:min-w-[240px]">
          <strong className="block font-display text-3xl leading-none font-bold text-navy">
            {pivot.candidates.length}
          </strong>
          <span className="mt-2 block text-xs leading-tight font-semibold text-navy/80">
            single-member flips change result
          </span>
        </div>
      </div>

      {pivot.candidates.length > 0 ? (
        <ol className="divide-y divide-line2 overflow-hidden rounded-xl border border-line">
          {pivot.candidates.map(({ row, priority }, i) => (
            <li
              key={row.member.id}
              className="grid grid-cols-1 items-center gap-3 p-4 transition-colors hover:bg-paper/60 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 shrink-0 text-right font-display text-sm font-bold text-muted/70">
                  {i + 1}
                </span>
                <Avatar name={row.member.name} size="sm" />
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-semibold text-navy">
                    {row.member.name}
                  </strong>
                  <span className="block truncate text-xs text-muted">
                    {row.member.district} · {row.stance}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
                  <span className="font-medium">Movability × pivotality</span>
                  <strong className="font-bold text-navy">{priority}</strong>
                </div>
                <Meter percent={priority} label={`Priority score ${priority} out of 100`} />
              </div>

              <div className="rounded-xl bg-paper px-3.5 py-2.5 text-xs">
                <strong className="block text-[11px] font-bold tracking-wide text-navy uppercase">
                  {action}
                </strong>
                <span className="mt-0.5 block leading-snug text-muted">
                  {row.answer.levers[0] ?? NOTHING_IN_EVIDENCE}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="There is no marginal one-member meeting in this projection.">
          Use the member reads below to build or defend a broader coalition.
        </EmptyState>
      )}

      <p className="border-t border-line2 pt-5 text-xs leading-relaxed text-muted">
        Pivotality is 1 only when changing this member’s projected side alone crosses the {goal}.
        Movability is higher for undecided or leaning stances, thinner or lower-confidence records,
        and a cooperative mayor relationship; it is a prioritization aid, not a probability.
      </p>
    </Card>
  );
}
