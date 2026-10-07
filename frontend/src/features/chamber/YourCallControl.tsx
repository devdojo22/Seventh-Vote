import { STANCES } from '@/data/stances';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Member } from '@/types/member';

const STANCE_LABELS = STANCES.map((s) => s.label).reverse();

export function YourCallControl({ member }: { member: Member }) {
  const current = useWorkspaceStore((s) => s.calls[member.id]);
  const setCall = useWorkspaceStore((s) => s.setCall);

  return (
    <>
      <p className="text-[13px] leading-relaxed text-muted">
        Your own read on {member.name.split(' ')[0]}&rsquo;s stance — kept only in this tab&rsquo;s
        memory. Never saved, never sent anywhere.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {STANCE_LABELS.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setCall(member.id, current === label ? null : label)}
            aria-pressed={current === label}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors ${
              current === label
                ? 'border-navy bg-navy text-white shadow-xs'
                : 'border-line bg-white text-ink hover:border-steel'
            }`}
          >
            {label}
          </button>
        ))}
        {current && (
          <button
            type="button"
            onClick={() => setCall(member.id, null)}
            className="cursor-pointer rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-muted hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>
    </>
  );
}
