const DOT_COUNT = 7;
const DOT_STAGGER_MS = 200;

interface AppLoaderProps {
  page?: string;
  label?: string;
}

export function AppLoader({ page, label }: AppLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-paper px-6"
    >
      <span className="sr-only">{label ?? `Loading Seventh Vote${page ? `: ${page}` : ''}`}</span>

      <div aria-hidden="true" className="flex h-8 items-center gap-3 sm:gap-3.5">
        {Array.from({ length: DOT_COUNT }, (_, index) => (
          <span
            key={index}
            className={`size-3.5 rounded-full bg-navy motion-safe:animate-loader-dot sm:size-4 ${
              index === DOT_COUNT - 1 ? 'motion-reduce:bg-gold' : ''
            }`}
            style={{ animationDelay: `${index * DOT_STAGGER_MS}ms` }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="mt-6 flex flex-col items-center gap-3 text-center">
        <p className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Seventh Vote
        </p>
        {page && (
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase sm:text-[13px]">
            <span className="h-px w-6 bg-gold sm:w-8" />
            {page}
            <span className="h-px w-6 bg-gold sm:w-8" />
          </p>
        )}
      </div>
    </div>
  );
}
