import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  className?: string;
  children: ReactNode;
}

export function EmptyState({ title, className = '', children }: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-line bg-paper/60 px-5 py-6 text-center text-[13px] leading-relaxed text-muted ${className}`}
    >
      {title && <strong className="mb-1 block font-semibold text-navy">{title}</strong>}
      {children}
    </div>
  );
}
