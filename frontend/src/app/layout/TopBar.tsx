import { useCouncilStore } from '@/stores/council-store';

export function TopBar() {
  const snapshotLabel = useCouncilStore((s) => s.config.snapshotLabel);
  return (
    <header className="sticky top-0 z-30 border-b-4 border-gold bg-navy/98 text-white shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-3 px-3.5 py-2.5 sm:justify-start sm:gap-4.5 sm:px-7 sm:py-3.5">
        <span className="inline-flex shrink-0 items-center gap-2 rounded border border-white/35 bg-navy2 px-2 py-1 text-[11px] font-extrabold tracking-wider before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold before:content-[''] sm:px-2.5 sm:text-[12px]">
          SEVENTH VOTE · PROTOTYPE
        </span>
        <span className="hidden truncate text-[13px] text-[#d9e3e9] md:inline">
          Know your count before the count — public-record rehearsal, not prediction
        </span>
        <span className="ml-auto text-[10px] whitespace-nowrap text-[#aebfcb] sm:text-[12px]">
          {snapshotLabel}
        </span>
      </div>
    </header>
  );
}
