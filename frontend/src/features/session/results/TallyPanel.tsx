import { Card } from '@/components/ui/Card';
import { outcomeHeadline, outcomeText } from '@/lib/simulation/session-summary';
import type { SessionAnalysis } from '@/types/simulation';

export function TallyPanel({ analysis }: { analysis: SessionAnalysis }) {
  const { tally, outcome } = analysis;
  const summary = tally.map((s) => `${s.count} ${s.label}`).join(', ');

  return (
    <Card padded={false} className="space-y-5 p-5 sm:p-8">
      <div className="flex flex-col items-start justify-between gap-1.5 sm:flex-row sm:items-baseline">
        {outcome === 'unreachable' ? (
          <strong className="font-display text-lg font-bold text-brick sm:text-xl">
            {outcomeHeadline(analysis)}
          </strong>
        ) : (
          <>
            <strong
              className={`font-display text-lg font-bold sm:text-xl ${analysis.evidenceGap.decisive ? 'text-amber' : outcome === 'met' ? 'text-pine' : 'text-brick'}`}
            >
              {outcomeHeadline(analysis)}
            </strong>
            <span className="text-xs text-muted sm:text-[13px]">{outcomeText(analysis)}</span>
          </>
        )}
      </div>

      <div
        role="img"
        aria-label={`Stance tally: ${summary}`}
        className="flex h-3.5 w-full gap-1 overflow-hidden"
      >
        {tally
          .filter((s) => s.count > 0)
          .map((s) => (
            <span
              key={s.key}
              className={`${s.barClass} h-full min-w-1 rounded-full transition-all duration-500`}
              style={{ width: `${s.widthPct}%` }}
            />
          ))}
      </div>

      <ul className="flex flex-wrap gap-2">
        {tally.map((s) => (
          <li
            key={s.key}
            className="inline-flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5 text-[13px]"
          >
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${s.barClass}`} />
            <b className="font-display leading-none font-bold text-navy">{s.count}</b>
            <span className="leading-none text-muted">{s.label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
