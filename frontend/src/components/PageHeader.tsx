import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageHeader({ title, description, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white/70 p-4 shadow-2xs backdrop-blur-sm sm:flex-row sm:items-center sm:p-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-navy/70 sm:text-base">
          {description}
        </p>
      </div>
      {aside}
    </div>
  );
}
