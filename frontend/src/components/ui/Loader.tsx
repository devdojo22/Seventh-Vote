import { useEffect, useState } from 'react';

const DOT_COUNT = 3;
const DOT_STAGGER_MS = 160;
const ROW_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3', 'w-2/3'] as const;

interface LoaderProps {
  label: string;
  rows?: number;
  delayMs?: number;
}

export function Loader({ label, rows = 3, delayMs = 0 }: LoaderProps) {
  const [visible, setVisible] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const timer = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  const widths = ROW_WIDTHS.slice(0, Math.min(Math.max(rows, 1), ROW_WIDTHS.length));

  return (
    <div role="status" aria-live="polite" className="grid min-h-48 content-start gap-3">
      <span className="sr-only">{label}</span>
      {visible && (
        <div aria-hidden="true" className="grid animate-fade-in gap-3">
          <div className="flex items-center gap-3 px-1 py-1">
            <span className="flex items-center gap-1.5">
              {Array.from({ length: DOT_COUNT }, (_, index) => (
                <span
                  key={index}
                  className="size-2 rounded-full bg-navy motion-safe:animate-loader-dot"
                  style={{ animationDelay: `${String(index * DOT_STAGGER_MS)}ms` }}
                />
              ))}
            </span>
            <span className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {label.replace(/…$/, '')}
            </span>
          </div>
          {widths.map((width, index) => (
            <div
              key={width}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5"
              style={{ opacity: 1 - index * 0.18 }}
            >
              <div className="grid flex-1 gap-2.5 motion-safe:animate-pulse">
                <div className="flex gap-2">
                  <span className="h-5 w-16 rounded-full bg-line2" />
                  <span className="h-5 w-20 rounded-full bg-line2" />
                </div>
                <span className={`h-3 rounded-full bg-line2 ${width}`} />
              </div>
              <span className="hidden h-8 w-24 rounded-lg bg-paper ring-1 ring-line2 motion-safe:animate-pulse sm:block" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
