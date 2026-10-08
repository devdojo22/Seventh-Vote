import { STANCES } from '@/data/stances';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Member } from '@/types/member';

const STANCE_LABELS = STANCES.map((s) => s.label).reverse();

const OPTION_CLASS =
  'cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

export const YOUR_CALL_BADGE_CLASS = 'border border-dashed border-gold/60 bg-amber-bg text-amber';

export function YourCallControl({ member }: { member: Member }) {
  const current = useWorkspaceStore((s) => s.calls[member.id]);
  const setCall = useWorkspaceStore((s) => s.setCall);

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted">
        Your own read on {member.name.split(' ')[0]}&rsquo;s stance — kept only in this tab&rsquo;s
        memory. Never saved, never sent anywhere.
      </p>
      <div className="flex flex-wrap gap-2">
        {STANCE_LABELS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setCall(member.id, current === label ? null : label)}
            aria-pressed={current === label}
            className={`${OPTION_CLASS} ${
              current === label
                ? 'border-navy bg-navy text-white shadow-card'
                : 'border-line bg-white text-ink hover:border-navy/30 hover:bg-paper'
            }`}
          >
            {label}
          </button>
        ))}
        {current && (
          <button
            type="button"
            onClick={() => setCall(member.id, null)}
            className={`${OPTION_CLASS} border-transparent text-muted hover:text-ink`}
          >
            Clear
          </button>
        )}
      </div>
    </>
  );
}
