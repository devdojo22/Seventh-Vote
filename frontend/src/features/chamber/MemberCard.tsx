import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ArrowUpRightIcon } from '@/components/ui/icons';
import { Meter } from '@/components/ui/Meter';
import {
  alignment,
  POSTURE_CLASSES,
  postureLabel,
  primaryRole,
  recordDepth,
  sinceYear,
} from '@/lib/members';
import { useWorkspaceStore } from '@/stores/workspace-store';
import type { Member, MemberId } from '@/types/member';
import { YOUR_CALL_BADGE_CLASS } from './YourCallControl';

interface MemberCardProps {
  member: Member;
  onOpen: (id: MemberId) => void;
}

export function MemberCard({ member, onOpen }: MemberCardProps) {
  const depth = recordDepth(member);
  const posture = alignment(member);
  const yourCall = useWorkspaceStore((s) => s.calls[member.id]);

  return (
    <button
      type="button"
      className="group relative flex min-w-0 cursor-pointer flex-col rounded-2xl border border-line bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
      onClick={() => onOpen(member.id)}
    >
      <span
        aria-hidden="true"
        className="absolute top-4 right-4 grid size-7 place-items-center rounded-full text-muted/70 transition-colors group-hover:bg-navy group-hover:text-gold"
      >
        <ArrowUpRightIcon className="size-4" />
      </span>

      <span className="flex items-center gap-3 pr-8">
        <Avatar name={member.name} />
        <span className="min-w-0">
          <span className="block truncate font-display text-lg leading-tight font-bold text-navy">
            {member.name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {member.district} · Since {sinceYear(member.took_office)}
          </span>
        </span>
      </span>

      <span className="my-4 line-clamp-2 min-h-[2.75rem] text-[13px] leading-relaxed text-ink/75">
        {primaryRole(member)}
      </span>

      <span className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge className={POSTURE_CLASSES[posture]}>{postureLabel(posture)} posture</Badge>
        {yourCall && <Badge className={YOUR_CALL_BADGE_CLASS}>Your call: {yourCall}</Badge>}
      </span>

      <span className="mt-4 flex items-center gap-3 border-t border-line2 pt-3.5 text-[11px] font-medium text-muted">
        <span className="shrink-0">{depth.label} record</span>
        <Meter percent={depth.percent} className="flex-1" />
      </span>
    </button>
  );
}
