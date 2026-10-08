import type { SessionAnalysis } from '@/types/simulation';

const BOX_CLASS =
  'relative shrink-0 overflow-hidden rounded-2xl bg-navy px-6 py-4 text-center text-white shadow-elevated sm:min-w-[170px]';

export function ThresholdFigure({ analysis }: { analysis: SessionAnalysis }) {
  const { threshold, direction, target, goalCount } = analysis;

  const [figure, caption] =
    threshold.basis === 'consent'
      ? ['Any 1', 'member may pull from consent']
      : [
          `${goalCount} / ${threshold.denominator}`,
          `${direction === 'oppose' ? 'leaning to oppose' : 'leaning yes'} · ${target} ${direction === 'oppose' ? 'to block' : 'needed'}`,
        ];

  return (
    <div className={BOX_CLASS}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(200_155_60/0.25),transparent_65%)]"
      />
      <strong className="relative block font-display text-3xl leading-none font-bold text-gold2 sm:text-4xl">
        {figure}
      </strong>
      <span className="relative mt-2 block text-[11px] leading-snug font-semibold tracking-wide text-white/75 uppercase">
        {caption}
      </span>
    </div>
  );
}
