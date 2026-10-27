import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { BrandLogo } from '@/components/BrandLogo';
import { Avatar } from '@/components/ui/Avatar';
import { SignOutIcon } from '@/components/ui/icons';
import { displayName } from '@/features/auth/auth-api';
import { signOut } from '@/features/auth/auth-session';
import { useCurrentUser } from '@/stores/auth-session-store';
import { useCouncilStore } from '@/stores/council-store';

export function TopBar() {
  const snapshotLabel = useCouncilStore((s) => s.config.snapshotLabel);
  const userName = displayName(useCurrentUser());
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
    }
    void navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-navy text-white shadow-[0_1px_0_rgb(200_155_60/0.55)]">
      <div className="mx-auto flex h-full max-w-[1380px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <BrandLogo />
        </Link>
        <span aria-hidden="true" className="hidden h-5 w-px bg-white/15 md:block" />
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
        <NavLink
          to="/profile"
          aria-label={`My profile: ${userName}`}
          className={({ isActive }) =>
            `ml-auto flex min-w-0 items-center gap-2.5 rounded-full p-0.5 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:ml-0 sm:pr-3 ${
              isActive ? 'bg-white/10' : ''
            }`
          }
        >
          <Avatar name={userName} size="sm" inverted />
          <span className="hidden max-w-36 truncate text-[13px] font-semibold sm:inline">
            {userName}
          </span>
        </NavLink>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
        >
          <SignOutIcon className="size-[18px]" />
        </button>
      </div>
    </header>
  );
}
