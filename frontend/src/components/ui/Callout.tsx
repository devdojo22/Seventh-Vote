import type { ReactNode } from 'react';
import { AlertIcon } from './icons';

interface CalloutProps {
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Callout({ title, className = '', children }: CalloutProps) {
  return (
    <div
      className={`flex gap-3 rounded-xl border border-gold/35 bg-amber-bg p-4 text-[13px] leading-relaxed text-amber ${className}`}
    >
      <AlertIcon className="mt-0.5 size-4 shrink-0 text-gold" />
      <div className="min-w-0 space-y-1">
        {title && <strong className="block font-semibold text-navy">{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
