import type { ComponentType } from 'react';
import { NavLink } from 'react-router';
import {
  ChamberIcon,
  MethodIcon,
  PrepIcon,
  SessionIcon,
  type IconProps,
} from '@/components/ui/icons';
import { useCouncilStore } from '@/stores/council-store';

interface NavItem {
  to: string;
  label: string;
  short: string;
  Icon: ComponentType<IconProps>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Council Chamber', short: 'Chamber', Icon: ChamberIcon },
  { to: '/session', label: 'Council Session', short: 'Session', Icon: SessionIcon },
  { to: '/prep', label: '1-on-1 Prep', short: '1-on-1', Icon: PrepIcon },
  { to: '/method', label: 'Methodology', short: 'Method', Icon: MethodIcon },
];

export function Sidebar() {
  const seatCount = useCouncilStore((s) => s.config.seatCount);
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col border-r border-line bg-white/70 px-4 py-6 backdrop-blur-sm lg:flex">
      <div className="mb-3 px-3 text-[11px] font-bold tracking-[0.14em] text-muted/80 uppercase">
        Workspace
      </div>
      <nav className="grid gap-1" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors ${
                isActive
                  ? 'bg-navy text-white shadow-card'
                  : 'text-muted hover:bg-paper hover:text-navy'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`size-[18px] shrink-0 ${isActive ? 'text-gold' : 'text-muted/80 group-hover:text-navy'}`}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto grid gap-2.5">
        <div className="rounded-xl border border-line bg-paper/70 px-3.5 py-3">
          <strong className="block font-display text-xl leading-none font-bold text-navy">
            Rules
          </strong>
          <span className="mt-1 block text-xs text-muted">threshold set by item type</span>
        </div>
        <div className="rounded-xl border border-line bg-paper/70 px-3.5 py-3">
          <strong className="block font-display text-xl leading-none font-bold text-navy">
            {seatCount}
          </strong>
          <span className="mt-1 block text-xs text-muted">public-record dossiers</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 border-t border-line bg-white/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(13_36_56/0.08)] backdrop-blur-md lg:hidden"
      aria-label="Mobile primary"
    >
      {NAV_ITEMS.map(({ to, short, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition-colors ${
              isActive ? 'bg-navy/[0.06] text-navy' : 'text-muted hover:text-navy'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`size-5 shrink-0 ${isActive ? 'text-gold' : ''}`} />
              <span>{short}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
