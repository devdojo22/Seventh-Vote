interface MeterProps {
  percent: number;
  label?: string;
  className?: string;
}

export function Meter({ percent, label, className = '' }: MeterProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`block h-1.5 overflow-hidden rounded-full bg-line2 ${className}`}
    >
      <span
        className="block h-full rounded-full bg-linear-to-r from-gold/80 to-gold transition-all duration-500"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}
