import type { ReactNode } from 'react';

interface BulletListProps {
  items: string[];
  render?: (item: string) => ReactNode;
  className?: string;
}

export function BulletList({ items, render, className = '' }: BulletListProps) {
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 leading-snug">
          <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-gold" />
          <span className="min-w-0">{render ? render(item) : item}</span>
        </li>
      ))}
    </ul>
  );
}
