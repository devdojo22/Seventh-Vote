export type MeterTone = 'gold' | 'navy' | 'brick';

const TONE_CLASSES: Record<MeterTone, string> = {
  gold: 'bg-linear-to-r from-gold/80 to-gold',
  navy: 'bg-navy',
  brick: 'bg-brick',
};

interface MeterProps {
  percent: number;
  label?: string;
  tone?: MeterTone;
  className?: string;
}

export function Meter({ percent, label, tone = 'gold', className = '' }: MeterProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`block h-1.5 overflow-hidden rounded-full bg-line2 ${className}`}
    >
      <span
        className={`block h-full rounded-full transition-all duration-500 ${TONE_CLASSES[tone]}`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </span>
  );
}
