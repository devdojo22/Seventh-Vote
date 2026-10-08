import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Meter } from '@/components/ui/Meter';
import type { SessionAnalysis } from '@/types/simulation';

function pivotalCopy(analysis: SessionAnalysis) {
  const { pivot, direction, threshold } = analysis;
  const side = direction === 'oppose' ? 'opposition' : 'support';
  const goal =
    direction === 'oppose' ? `blocking target of ${pivot.target}` : `${threshold.label} threshold`;

  if (pivot.mode === 'reach') {
    return {
      title: `One member can become vote ${pivot.target}`,
      desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. Any member below can reach the ${goal} by moving to the requested side; priority ranks the most movable first.`,
      goal,
    };
  }
  if (pivot.mode === 'hold') {
    return {
      title: `The coalition is exactly at ${pivot.target}`,
      desc: `Every projected ${side} vote is pivotal: losing any one changes the outcome. Protect the most movable members first.`,
      goal,
    };
  }
  if (pivot.goalCount < pivot.target - 1) {
    return {
      title: 'No single member changes the outcome yet',
      desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. It takes ${pivot.target - pivot.goalCount} additional shifts to reach ${pivot.target}, so pivotality is currently zero for every member.`,
      goal,
    };
  }
  const cushion = pivot.goalCount - pivot.target;
  const margin = cushion
    ? `; the margin is ${cushion} vote${cushion === 1 ? '' : 's'} above ${pivot.target}`
    : '';
  return {
    title: 'The projected coalition has a cushion',
    desc: `The projection has ${pivot.goalCount} votes leaning to ${side}. One member flipping would not reverse the outcome${margin}.`,
    goal,
  };
}

export function PivotalPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { pivot } = analysis;
  const { title, desc, goal } = pivotalCopy(analysis);
  const action =
    pivot.mode === 'reach'
      ? `Persuade for vote ${pivot.target}`
      : 'Protect the projected coalition';

  return (
    <Card className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <span className="block text-xs font-bold tracking-[0.14em] text-gold uppercase">
            Pivotal-voter view
          </span>
          <h3 className="mt-1 font-display text-xl font-bold text-navy">{title}</h3>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-muted">{desc}</p>
        </div>
        <div className="shrink-0 rounded-2xl bg-paper px-5 py-3 text-center sm:min-w-[150px]">
          <strong className="block font-display text-3xl leading-none font-bold text-navy">
            {pivot.candidates.length}
          </strong>
          <span className="mt-1.5 block text-[11px] leading-tight font-semibold text-muted">
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
                  {row.levers[0] || 'Lead with a measurable public benefit.'}
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

      <p className="border-t border-line2 pt-4 text-xs leading-relaxed text-muted">
        Pivotality is 1 only when changing this member’s projected side alone crosses the {goal}.
        Movability is higher for undecided or leaning stances, thinner or lower-confidence records,
        and a cooperative mayor relationship; it is a prioritization aid, not a probability.
      </p>
    </Card>
  );
}
