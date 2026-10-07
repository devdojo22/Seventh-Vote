import type { SessionAnalysis } from '@/types/simulation';

const COPY = {
  support: {
    leaning: 'leaning yes',
    met: 'Projected path to passage',
    short: 'Below the passage threshold',
    solid: 'solid yes',
    counter: 'solid no',
  },
  oppose: {
    leaning: 'leaning to oppose',
    met: 'Projected path to opposition',
    short: 'Below the opposition threshold',
    solid: 'solid opposition',
    counter: 'solid support',
  },
} as const;

function plural(n: number): string {
  return n === 1 ? '' : 's';
}

function outcomeText(analysis: SessionAnalysis): string {
  const { outcome, goalCount, target, direction, breakdown } = analysis;
  const copy = COPY[direction];
  const margin = Math.abs(goalCount - target);
  const gap =
    outcome === 'met'
      ? `${margin} vote${plural(margin)} above threshold`
      : `${margin} more ${copy.leaning} vote${plural(margin)} needed`;
  return `${gap} · ${breakdown.solid} ${copy.solid} · ${breakdown.persuadable} persuadable · ${breakdown.counter} ${copy.counter}`;
}

/** Stance tally bar, legend and the pass/fail outcome line. */
export function TallyPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { tally, outcome, direction } = analysis;
  const copy = COPY[direction];
  const summary = tally.map((s) => `${s.count} ${s.label}`).join(', ');

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6">
      <div
        role="img"
        aria-label={`Stance tally: ${summary}`}
        className="flex h-6 w-full gap-0.5 overflow-hidden rounded-xl border border-line bg-paper/60 p-0.5"
      >
        {tally.map((s) => (
          <span
            key={s.key}
            className={`${s.barClass} h-full rounded-xs transition-all duration-300`}
            style={{ width: `${s.widthPct}%` }}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 font-sans text-xs sm:grid-cols-3 md:grid-cols-6">
        {tally.map((s) => (
          <li
            key={s.key}
            className="flex items-center gap-2 rounded-lg border border-line/60 bg-paper/30 p-2"
          >
            <b className="font-display text-sm font-bold text-navy">{s.count}</b>
            <span className="leading-tight text-navy/70">{s.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-3 font-sans text-xs sm:flex-row sm:items-center sm:text-sm">
        {outcome === 'unreachable' ? (
          <strong className="font-display text-base font-bold text-brick sm:text-lg">
            No members present: nothing can be voted on
          </strong>
        ) : (
          <>
            <strong
              className={`font-display text-base font-bold sm:text-lg ${outcome === 'met' ? 'text-pine' : 'text-brick'}`}
            >
              {outcome === 'met' ? copy.met : copy.short}
            </strong>
            <span className="font-medium text-navy/70">{outcomeText(analysis)}</span>
          </>
        )}
      </div>
    </div>
  );
}
