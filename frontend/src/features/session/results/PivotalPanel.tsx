import { initials } from '@/lib/members';
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

/** One-member threshold test: who could change the projected result. */
export function PivotalPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { pivot } = analysis;
  const { title, desc, goal } = pivotalCopy(analysis);
  const action =
    pivot.mode === 'reach'
      ? `Persuade for vote ${pivot.target}`
      : 'Protect the projected coalition';

  return (
    <div className="space-y-6 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-paper/40 p-4 sm:flex-row sm:items-center">
        <div>
          <span className="block text-xs font-semibold tracking-wider text-navy/60 uppercase">
            Pivotal-voter view
          </span>
          <h3 className="mt-0.5 font-display text-lg font-bold text-navy sm:text-xl">{title}</h3>
          <p className="mt-1 font-sans text-xs leading-relaxed text-navy/70 sm:text-sm">{desc}</p>
        </div>
        <div className="min-w-[130px] shrink-0 self-start rounded-xl border border-line bg-white px-4 py-2.5 text-center shadow-2xs sm:self-center">
          <strong className="block font-display text-2xl font-bold text-navy">
            {pivot.candidates.length}
          </strong>
          <span className="block text-[11px] leading-tight font-semibold tracking-wider text-navy/70 uppercase">
            single-member flips change result
          </span>
        </div>
      </div>

      {pivot.candidates.length > 0 ? (
        <ul className="space-y-3">
          {pivot.candidates.map(({ row, priority }, i) => (
            <li
              key={row.member.id}
              className="grid grid-cols-1 items-start gap-3 rounded-xl border border-line bg-paper/30 p-3.5 transition-all hover:bg-white sm:gap-4 sm:p-4 md:grid-cols-3 md:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-xs font-bold text-gold shadow-xs">
                  {initials(row.member.name)}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate font-sans text-sm font-semibold text-navy">
                    {i + 1}. {row.member.name}
                  </strong>
                  <span className="block font-sans text-xs text-navy/60">
                    {row.member.district} · {row.stance}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between font-sans text-xs text-navy/70">
                  <span className="font-medium">Movability × pivotality</span>
                  <strong className="font-bold text-navy">{priority}</strong>
                </div>
                <div
                  role="img"
                  aria-label={`Priority score ${priority} out of 100`}
                  className="h-2.5 w-full overflow-hidden rounded-full border border-line/60 bg-paper/80"
                >
                  <div
                    className="h-full rounded-full bg-gold transition-all duration-300"
                    style={{ width: `${priority}%` }}
                  />
                </div>
              </div>

              <div className="space-y-0.5 rounded-lg border border-line/60 bg-white p-3 font-sans text-xs text-navy/80">
                <strong className="block text-[11px] font-semibold tracking-wider text-navy uppercase">
                  {action}
                </strong>
                <span className="block leading-tight text-navy/70">
                  {row.levers[0] || 'Lead with a measurable public benefit.'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-line bg-paper/30 p-5 text-center font-sans text-xs leading-relaxed text-navy/70 sm:text-sm">
          <strong className="mb-0.5 block font-semibold text-navy">
            There is no marginal one-member meeting in this projection.
          </strong>
          Use the member reads below to build or defend a broader coalition.
        </div>
      )}

      <div className="border-t border-line pt-3 font-sans text-xs leading-relaxed text-navy/60 italic">
        Pivotality is 1 only when changing this member’s projected side alone crosses the {goal}.
        Movability is higher for undecided or leaning stances, thinner or lower-confidence records,
        and a cooperative mayor relationship; it is a prioritization aid, not a probability.
      </div>
    </div>
  );
}
