import type { ReactNode } from 'react';

interface CardProps {
  className?: string;
  padded?: boolean;
  children: ReactNode;
}

export function Card({ className = '', padded = true, children }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-card ${padded ? 'p-5 sm:p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
