import { useId, useState, type ComponentType } from 'react';
import { NavLink } from 'react-router';
import { CONTROL_CLASS } from '@/components/ui/Field';
import {
  ChamberIcon,
  MethodIcon,
  PrepIcon,
  SessionIcon,
  ShieldIcon,
  UserIcon,
  type IconProps,
} from '@/components/ui/icons';
import { describeAccessError } from '@/features/access/access-errors';
import { changeWorkspace } from '@/features/auth/auth-session';
import { useCurrentUser } from '@/stores/auth-session-store';
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

function useManagementNavItems(): NavItem[] {
  const user = useCurrentUser();
  const items: NavItem[] = [];
  if (user.activeWorkspaceId !== null) {
    items.push({
      to: `/workspaces/${user.activeWorkspaceId}/settings`,
      label: 'Vote rules',
      short: 'Rules',
      Icon: MethodIcon,
    });
  }
  if (user.activeWorkspaceId !== null && user.permissions?.manageMembers) {
    items.push({
      to: `/workspaces/${user.activeWorkspaceId}/members`,
      label: 'Members',
      short: 'Members',
      Icon: UserIcon,
    });
  }
  if (user.isSuperAdmin) {
    items.push({
      to: '/admin/workspaces',
      label: 'All workspaces',
      short: 'Admin',
      Icon: ShieldIcon,
    });
  }
  return items;
}


function WorkspaceSwitcher({ inBar = false }: { inBar?: boolean }) {
  const user = useCurrentUser();
  const selectId = useId();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = user.workspaces.find((w) => w.id === user.activeWorkspaceId);

  if (user.workspaces.length <= 1) {
    return (
      <p
        className={`truncate text-[13px] font-semibold text-navy ${inBar ? 'min-w-0 py-1' : 'mb-3 px-3'}`}
      >
        {active?.name ?? 'No workspace selected'}
      </p>
    );
  }

  const onChange = async (workspaceId: string) => {
    setSwitching(true);
    setError(null);
    try {
      await changeWorkspace(workspaceId);
    } catch (caught) {
      setError(describeAccessError(caught));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className={`grid min-w-0 gap-1.5 ${inBar ? 'w-full sm:w-72' : 'mb-3 px-1'}`}>
      <label htmlFor={selectId} className="sr-only">
        Active workspace
      </label>
      <select
        id={selectId}
        data-workspace-switcher
        className={`${CONTROL_CLASS} py-2 text-[13px]`}
        value={user.activeWorkspaceId ?? ''}
        disabled={switching}
        onChange={(e) => void onChange(e.target.value)}
      >
        {user.activeWorkspaceId === null && <option value="">Choose a workspace</option>}
        {user.workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="px-2 text-xs font-semibold text-brick">
          {error}
        </p>
      )}
    </div>
  );
}

function SidebarLinks({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav className="grid gap-1" aria-label={label}>
      {items.map(({ to, label: text, Icon }) => (
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
              <span>{text}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const seatCount = useCouncilStore((s) => s.config.seatCount);
  const managementItems = useManagementNavItems();
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col border-r border-line bg-white/70 px-4 py-6 backdrop-blur-sm lg:flex">
      <div className="mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-muted/80 uppercase">
        Workspace
      </div>
      <WorkspaceSwitcher />
      <SidebarLinks items={NAV_ITEMS} label="Primary" />
      {managementItems.length > 0 && (
        <>
          <div className="mt-6 mb-2 px-3 text-[11px] font-bold tracking-[0.14em] text-muted/80 uppercase">
            Settings
          </div>
          <SidebarLinks items={managementItems} label="Management" />
        </>
      )}
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

export function WorkspaceBar() {
  const managementItems = useManagementNavItems();
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white/70 p-3 sm:flex-row sm:items-center lg:hidden">
      <WorkspaceSwitcher inBar />
      {managementItems.length > 0 && (
        <nav
          aria-label="Management"
          className="flex min-w-0 flex-wrap gap-2 sm:ml-auto sm:justify-end"
        >
          {managementItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-paper text-muted hover:text-navy'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-gold' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
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
