import type { ComponentType, ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useCouncilStore } from '@/stores/council-store';

interface IconProps {
  className?: string;
}

function NavIcon({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const ChamberIcon = ({ className }: IconProps) => (
  <NavIcon className={className}>
    <path d="M3 21h18M5 18h14M6 9v9m4-9v9m4-9v9m4-9v9M4 9h16L12 3 4 9Z" />
  </NavIcon>
);
const SessionIcon = ({ className }: IconProps) => (
  <NavIcon className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87" />
  </NavIcon>
);
const PrepIcon = ({ className }: IconProps) => (
  <NavIcon className={className}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v8Z" />
    <path d="M7 9h10M7 13h7" />
  </NavIcon>
);
const MethodIcon = ({ className }: IconProps) => (
  <NavIcon className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6m0-10h.01" />
  </NavIcon>
);

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
    <aside className="sticky top-[53px] hidden h-[calc(100vh-53px)] w-[230px] shrink-0 flex-col border-r border-line bg-white p-7 px-4.5 lg:flex">
      <div className="mx-3 mt-0.5 mb-3 text-[11px] font-bold tracking-wider text-[#7b8a95] uppercase">
        Workspace
      </div>
      <nav className="grid gap-1.5" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg p-2.5 px-3 text-left text-[13.5px] font-semibold transition-colors ${
                isActive
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-[#405565] hover:bg-[#f0f4f6] hover:text-navy'
              }`
            }
          >
            <Icon className="size-4.5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3 border-t border-line pt-4">
        <div className="px-3">
          <strong className="block font-display text-[28px] leading-none text-navy">Rules</strong>
          <span className="mt-1 block text-[12px] text-muted">threshold set by item type</span>
        </div>
        <div className="px-3">
          <strong className="block font-display text-[30px] leading-none text-navy">
            {seatCount}
          </strong>
          <span className="mt-1 block text-[12px] text-muted">public-record dossiers</span>
        </div>
      </div>
    </aside>
  );
}

/** Bottom tab bar for viewports narrower than lg. */
export function MobileNav() {
  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-50 grid grid-cols-4 gap-1 border-t border-line bg-white px-1.5 py-1.5 shadow-[0_-6px_20px_rgba(13,36,56,0.08)] lg:hidden"
      aria-label="Mobile primary"
    >
      {NAV_ITEMS.map(({ to, short, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-[10px] font-semibold transition-colors sm:text-[11px] ${
              isActive ? 'bg-navy text-white shadow-xs' : 'text-[#405565] hover:bg-[#f0f4f6]'
            }`
          }
        >
          <Icon className="size-4.5 shrink-0" />
          <span>{short}</span>
        </NavLink>
      ))}
    </nav>
  );
}
