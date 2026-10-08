import type { ReactNode } from 'react';

const NEUTRAL_BADGE_CLASS = 'border border-line bg-paper text-muted';

interface BadgeProps {
  className?: string;
  children: ReactNode;
}

export function Badge({ className = NEUTRAL_BADGE_CLASS, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}
