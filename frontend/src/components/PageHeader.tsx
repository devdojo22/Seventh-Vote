import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <header className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-bold tracking-[0.14em] text-gold uppercase">{eyebrow}</p>
        <h1 className="max-w-3xl font-display text-[28px] leading-[1.1] font-bold tracking-tight text-navy sm:text-4xl lg:text-[44px]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-[15px]">
          {description}
        </p>
      </div>
      {aside}
    </header>
  );
}

export function HeaderStat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="shrink-0 rounded-2xl border border-line bg-white px-5 py-3.5 shadow-card sm:text-right">
      <strong className="block font-display text-[28px] leading-none font-bold text-navy">
        {value}
      </strong>
      <span className="mt-1.5 block text-xs font-medium text-muted">{label}</span>
    </div>
  );
}
