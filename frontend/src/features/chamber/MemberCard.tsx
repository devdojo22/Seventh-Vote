import {
  alignment,
  initials,
  POSTURE_CLASSES,
  postureLabel,
  primaryRole,
  recordDepth,
  sinceYear,
} from '@/lib/members';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Member, MemberId } from '@/types/member';

interface MemberCardProps {
  member: Member;
  onOpen: (id: MemberId) => void;
}

/** One member card in the chamber grid. Opens the dossier drawer. */
export function MemberCard({ member, onOpen }: MemberCardProps) {
  const depth = recordDepth(member);
  const posture = alignment(member);
  const yourCall = useWorkspaceStore((s) => s.calls[member.id]);

  return (
    <button
      type="button"
      className="group relative flex min-w-0 cursor-pointer flex-col justify-between rounded-xl border border-line bg-white p-4.5 text-left transition-all hover:border-[#9fb0bd] hover:shadow-[0_7px_20px_rgba(13,36,56,0.08)]"
      onClick={() => onOpen(member.id)}
    >
      <span
        className="absolute top-4 right-4 text-sm font-bold text-[#8a9aa6] transition-colors group-hover:text-navy"
        aria-hidden="true"
      >
        ↗
      </span>
      <span className="block">
        <span className="flex items-center gap-3 pr-5">
          <span className="grid size-10.5 shrink-0 place-items-center rounded-full border-2 border-gold2 bg-navy2 font-display text-[17px] text-white">
            {initials(member.name)}
          </span>
          <span className="min-w-0">
            <span className="mb-0.5 block truncate font-display text-[19px] leading-tight font-semibold text-navy sm:text-[20px]">
              {member.name}
            </span>
            <span className="block truncate text-[12px] text-muted">
              {member.district} · Since {sinceYear(member.took_office)}
            </span>
          </span>
        </span>
        <span className="my-3.5 line-clamp-2 block min-h-[42px] text-[13px] leading-relaxed text-[#405565]">
          {primaryRole(member)}
        </span>
      </span>
      <span className="block">
        <span className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${POSTURE_CLASSES[posture]}`}
          >
            {postureLabel(posture)} posture
          </span>
          {yourCall && (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#d9b96a] bg-amber-bg px-2.5 py-1 text-[11px] font-bold text-[#775218]">
              Your call: {yourCall}
            </span>
          )}
        </span>
        <span className="mt-3.5 flex items-center gap-2 text-[11px] text-muted">
          <span className="shrink-0">{depth.label} record</span>
          <span className="block h-1 flex-1 overflow-hidden rounded-full bg-[#e4e9ec]">
            <span
              className="block h-full bg-gold transition-all duration-300"
              style={{ width: `${depth.percent}%` }}
            />
          </span>
        </span>
      </span>
    </button>
  );
}
