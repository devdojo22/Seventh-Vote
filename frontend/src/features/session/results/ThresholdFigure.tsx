import type { SessionAnalysis } from '@/types/simulation';

const BOX_CLASS =
  'min-w-[140px] shrink-0 rounded-xl border border-line bg-navy/5 p-3 text-center sm:p-4';

/** Headline threshold figure shown in the result header. */
export function ThresholdFigure({ analysis }: { analysis: SessionAnalysis }) {
  const { threshold, direction, target, goalCount } = analysis;

  if (threshold.basis === 'consent') {
    return (
      <div className={BOX_CLASS}>
        <strong className="block font-display text-2xl font-bold text-navy sm:text-3xl">
          Any 1
        </strong>
        <span className="text-xs font-semibold tracking-wider text-navy/70 uppercase">
          member may pull from consent
        </span>
      </div>
    );
  }
  return (
    <div className={BOX_CLASS}>
      <strong className="block font-display text-2xl font-bold text-navy sm:text-3xl">
        {goalCount} / {threshold.denominator}
      </strong>
      <span className="mt-0.5 block text-xs font-semibold tracking-wider text-navy/70 uppercase">
        {direction === 'oppose' ? 'leaning to oppose' : 'leaning yes'} · {target}{' '}
        {direction === 'oppose' ? 'to block' : 'needed'}
      </span>
    </div>
  );
}
