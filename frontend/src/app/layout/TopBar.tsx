import { Link } from 'react-router';
import { useCouncilStore } from '@/stores/council-store';

export function TopBar() {
  const snapshotLabel = useCouncilStore((s) => s.config.snapshotLabel);
  return (
    <header className="sticky top-0 z-30 h-14 bg-navy text-white shadow-[0_1px_0_rgb(200_155_60/0.55)]">
      <div className="mx-auto flex h-full max-w-[1380px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-gold to-[#a77d27] font-display text-[17px] font-bold text-navy shadow-sm"
          >
            7
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight">Seventh Vote</span>
        </Link>
        <span aria-hidden="true" className="hidden h-5 w-px bg-white/15 md:block" />
        <span className="hidden truncate text-[13px] text-white/65 md:inline">
          Know your count before the count — public-record rehearsal, not prediction
        </span>
        <span className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium whitespace-nowrap text-white/80 sm:text-xs">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
          {snapshotLabel}
        </span>
      </div>
    </header>
  );
}
