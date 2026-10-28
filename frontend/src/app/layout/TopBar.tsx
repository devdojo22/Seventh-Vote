import { Link, NavLink } from 'react-router';
import { BrandLogo } from '@/components/BrandLogo';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/features/access/access-labels';
import { displayName } from '@/features/auth/auth-api';
import { useCurrentUser } from '@/stores/auth-session-store';
import { useCouncilStore } from '@/stores/council-store';
import type { Role } from '@/types/access';
import { useRotatingWorkspace } from './use-rotating-workspace';

const ROLE_CHIP_CLASSES: Record<Role, string> = {
  PRINCIPAL: 'bg-gold/20 text-gold2 ring-1 ring-gold/40',
  AFFILIATE: 'bg-steel/30 text-steel-bg ring-1 ring-steel/50',
};

const DIVIDER_CLASS = 'hidden w-px shrink-0 bg-white/15';

export function TopBar() {
  const snapshotLabel = useCouncilStore((s) => s.config.snapshotLabel);
  const user = useCurrentUser();
  const userName = displayName(user);
  const membership = useRotatingWorkspace(user.workspaces, user.activeWorkspaceId);

  return (
    <header className="sticky top-0 z-30 h-14 bg-navy text-white shadow-[0_1px_0_rgb(200_155_60/0.55)]">
      <div className="flex h-full items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:pr-8 lg:pl-0">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none lg:w-sidebar lg:self-stretch lg:rounded-none lg:border-r lg:border-white/10 lg:pl-4.5"
        >
          <BrandLogo />
        </Link>
        <span aria-hidden="true" className={`${DIVIDER_CLASS} h-5 md:block lg:hidden`} />
        <span className="hidden min-w-0 truncate text-[13px] text-white/65 lg:inline">
          Know your count before the count — public-record rehearsal, not prediction
        </span>
        <span
          title={snapshotLabel}
          className="ml-auto hidden min-w-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/80 sm:inline-flex sm:text-xs"
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
          <span className="truncate">{snapshotLabel}</span>
        </span>
        <span aria-hidden="true" className={`${DIVIDER_CLASS} h-8 sm:block`} />
        <NavLink
          to="/profile"
          aria-label={`My profile: ${userName}`}
          className="ml-auto flex min-w-0 items-center gap-2.5 outline-none sm:ml-0"
        >
          <Avatar name={userName} size="sm" inverted />
          <span className="hidden w-44 min-w-0 leading-tight sm:block">
            <span className="block truncate text-[13px] font-semibold text-white">{userName}</span>
            {membership ? (
              <span
                key={membership.id}
                title={`${ROLE_LABELS[membership.role]} · ${membership.name}`}
                className="mt-1 flex items-center gap-1.5 motion-safe:animate-fade-in"
              >
                <span
                  className={`shrink-0 rounded-full px-1.5 py-px text-[9.5px] font-bold tracking-wider uppercase ${ROLE_CHIP_CLASSES[membership.role]}`}
                >
                  {ROLE_LABELS[membership.role]}
                </span>
                <span className="truncate text-[11px] text-white/60">{membership.name}</span>
              </span>
            ) : (
              <span className="mt-1 block truncate text-[11px] text-white/60">{user.email}</span>
            )}
          </span>
        </NavLink>
      </div>
    </header>
  );
}
