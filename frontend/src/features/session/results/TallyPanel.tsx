import { Card } from '@/components/ui/Card';
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

export function TallyPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { tally, outcome, direction } = analysis;
  const copy = COPY[direction];
  const summary = tally.map((s) => `${s.count} ${s.label}`).join(', ');

  return (
    <Card className="space-y-5">
      <div className="flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-baseline">
        {outcome === 'unreachable' ? (
          <strong className="font-display text-lg font-bold text-brick sm:text-xl">
            No members present: nothing can be voted on
          </strong>
        ) : (
          <>
            <strong
              className={`font-display text-lg font-bold sm:text-xl ${outcome === 'met' ? 'text-pine' : 'text-brick'}`}
            >
              {outcome === 'met' ? copy.met : copy.short}
            </strong>
            <span className="text-[13px] font-medium text-muted">{outcomeText(analysis)}</span>
          </>
        )}
      </div>

      <div
        role="img"
        aria-label={`Stance tally: ${summary}`}
        className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-line2"
      >
        {tally.map((s) => (
          <span
            key={s.key}
            className={`${s.barClass} h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${s.widthPct}%` }}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tally.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2.5">
            <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${s.barClass}`} />
            <b className="font-display text-base leading-none font-bold text-navy">{s.count}</b>
            <span className="text-xs leading-tight text-muted">{s.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
