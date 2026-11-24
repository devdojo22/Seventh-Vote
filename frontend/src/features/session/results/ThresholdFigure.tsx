import { thresholdFigure } from '@/lib/simulation/session-summary';
import type { SessionAnalysis } from '@/types/simulation';

const BOX_CLASS =
  'relative shrink-0 overflow-hidden rounded-2xl bg-linear-to-br from-navy to-navy2 px-8 py-5 text-center text-white shadow-elevated sm:min-w-[220px]';

export function ThresholdFigure({ analysis }: { analysis: SessionAnalysis }) {
  const { figure, caption } = thresholdFigure(analysis);

  return (
    <div className={BOX_CLASS}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgb(200_155_60/0.16),transparent_65%)]"
      />
      <strong className="relative block font-display text-4xl leading-none font-bold text-[#f2c46b] sm:text-[44px]">
        {figure}
      </strong>
      <span className="relative mt-2.5 block text-[11px] leading-snug font-bold tracking-[0.06em] text-white uppercase">
        {caption}
      </span>
    </div>
  );
}
