import { useEffect, useId, useRef, useState, type ComponentType } from 'react';
import { NavLink } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { CONTROL_CLASS } from '@/components/ui/Field';
import {
  ChamberIcon,
  ChevronDownIcon,
  MethodIcon,
  PrepIcon,
  SessionIcon,
  ShieldIcon,
  SignOutIcon,
  UserIcon,
  type IconProps,
} from '@/components/ui/icons';
import { describeAccessError } from '@/features/access/access-errors';
import { ROLE_LABELS } from '@/features/access/access-labels';
import { useHasWorkspaceAccess } from '@/features/access/use-workspace-access';
import { displayName, type WorkspaceAccess } from '@/features/auth/auth-api';
import { changeWorkspace } from '@/features/auth/auth-session';
import { useSignOut } from '@/features/auth/use-sign-out';
import { useCurrentUser } from '@/stores/auth-session-store';
import { useCouncilStore } from '@/stores/council-store';
import type { Role } from '@/types/access';
import { useRotatingWorkspace } from './use-rotating-workspace';

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

const ROLE_TONES: Record<Role, { dot: string; text: string }> = {
  PRINCIPAL: { dot: 'bg-gold', text: 'text-amber' },
  AFFILIATE: { dot: 'bg-steel', text: 'text-steel' },
};

function WorkspaceSwitcher({ inBar = false }: { inBar?: boolean }) {
  const user = useCurrentUser();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = user.workspaces.find((w) => w.id === user.activeWorkspaceId);
  const wrapperClass = `min-w-0 ${inBar ? 'w-full sm:w-72' : 'mb-3'}`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // A single workspace is shown as a label, unless the session has none active yet: then it can be chosen.
  if (user.workspaces.length === 0 || (user.workspaces.length === 1 && active)) {
    return (
      <p
        className={`truncate rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-[13px] font-semibold text-navy ${wrapperClass}`}
      >
        {active?.name ?? 'No workspace selected'}
      </p>
    );
  }

  const onChange = async (workspaceId: string) => {
    setOpen(false);
    if (workspaceId === user.activeWorkspaceId) return;
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
    <div ref={rootRef} className={`grid gap-1.5 ${wrapperClass}`}>
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          data-workspace-switcher
          aria-label={`Active workspace: ${active?.name ?? 'none'}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          disabled={switching}
          onClick={() => setOpen((o) => !o)}
          className={`${CONTROL_CLASS} flex cursor-pointer items-center gap-2.5 text-left text-[13px] font-semibold disabled:cursor-wait disabled:opacity-60 ${
            open ? 'border-navy ring-4 ring-navy/8' : ''
          }`}
        >
          <span className="min-w-0 flex-1 truncate text-navy">
            {active?.name ?? 'Choose a workspace'}
          </span>
          <ChevronDownIcon
            className={`size-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Workspaces"
            className="absolute inset-x-0 top-full z-40 mt-1.5 grid max-h-72 animate-fade-in gap-0.5 overflow-y-auto rounded-xl bg-white p-1.5 shadow-elevated ring-1 ring-line"
          >
            {user.workspaces.map((w) => {
              const selected = w.id === user.activeWorkspaceId;
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => void onChange(w.id)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 focus-visible:outline-none ${
                      selected ? 'bg-paper' : 'hover:bg-paper focus-visible:bg-paper'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-navy">
                        {w.name}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-[11px] font-semibold ${ROLE_TONES[w.role].text}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-1.5 rounded-full ${ROLE_TONES[w.role].dot}`}
                        />
                        {ROLE_LABELS[w.role]}
                      </span>
                    </span>{' '}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <p role="alert" className="px-2 text-xs font-semibold text-brick">
          {error}
        </p>
      )}
    </div>
  );
}

const SECTION_LABEL_CLASS =
  'px-3 text-[11px] font-bold tracking-[0.14em] whitespace-nowrap text-muted/80 uppercase';

const TOOLTIP_CLASS =
  'pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-x-1 -translate-y-1/2 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-navy opacity-0 shadow-elevated ring-1 ring-line transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100';

const FOCUS_RING_CLASS =
  'focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:outline-none';

function SidebarLinks({
  items,
  label,
  collapsed,
}: {
  items: NavItem[];
  label: string;
  collapsed: boolean;
}) {
  return (
    <nav className="grid gap-1" aria-label={label}>
      {items.map(({ to, label: text, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-xl p-1.5 text-[13.5px] font-semibold transition-all duration-200 ${FOCUS_RING_CLASS} ${
              collapsed ? 'justify-center' : 'pr-3'
            } ${
              isActive
                ? 'bg-linear-to-r from-navy to-navy2 text-white shadow-[0_10px_22px_-10px_rgb(13_36_56/0.6)]'
                : 'text-muted hover:bg-paper hover:text-navy'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-gold'
                    : 'bg-paper text-muted/80 group-hover:bg-white group-hover:text-navy group-hover:shadow-card'
                }`}
              >
                <Icon className="size-[17px]" />
              </span>
              <span className={collapsed ? 'sr-only' : 'truncate whitespace-nowrap'}>{text}</span>
              {isActive && !collapsed && (
                <span
                  aria-hidden="true"
                  className="ml-auto size-1.5 shrink-0 rounded-full bg-gold"
                />
              )}
              {collapsed && (
                <span aria-hidden="true" className={TOOLTIP_CLASS}>
                  {text}
                </span>
              )}
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
  const hasWorkspaceAccess = useHasWorkspaceAccess();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside
      className={`sticky top-14 z-30 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-line bg-white shadow-card transition-[width] duration-300 ease-out lg:flex ${
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      }`}
    >
      <div
        className={`flex w-full min-w-0 flex-col px-3 py-5 ${collapsed ? '' : 'overflow-y-auto'}`}
      >
        <div
          className={`mb-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}
        >
          {!collapsed && <span className={SECTION_LABEL_CLASS}>Workspace</span>}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className={`grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-navy ${FOCUS_RING_CLASS}`}
          >
            <ChevronDownIcon
              className={`size-4 transition-transform duration-300 ${collapsed ? '-rotate-90' : 'rotate-90'}`}
            />
          </button>
        </div>
        {!collapsed && <WorkspaceSwitcher />}
        {hasWorkspaceAccess && (
          <SidebarLinks items={NAV_ITEMS} label="Primary" collapsed={collapsed} />
        )}
        {managementItems.length > 0 && (
          <>
            {collapsed ? (
              <div className="mx-2 my-4 border-t border-line2" />
            ) : (
              <div className={`mt-6 mb-2 ${SECTION_LABEL_CLASS}`}>Settings</div>
            )}
            <SidebarLinks items={managementItems} label="Management" collapsed={collapsed} />
          </>
        )}
        <div className="mt-auto grid min-w-0 grid-cols-1 gap-3">
          {!collapsed && (
            <div className="grid grid-cols-2 divide-x divide-line2 rounded-2xl bg-paper/70 py-3 ring-1 ring-line2">
              <div className="px-3.5">
                <strong className="block font-display text-lg leading-none font-bold text-navy">
                  Rules
                </strong>
                <span className="mt-1 block text-[11px] leading-snug text-muted">
                  threshold set by item type
                </span>
              </div>
              <div className="px-3.5">
                <strong className="block font-display text-lg leading-none font-bold text-navy">
                  {seatCount}
                </strong>
                <span className="mt-1 block text-[11px] leading-snug text-muted">
                  public-record dossiers
                </span>
              </div>
            </div>
          )}
          <SidebarProfile collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}

function RotatingMembership({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceAccess[];
  activeWorkspaceId: string | null;
}) {
  const [paused, setPaused] = useState(false);
  const current = useRotatingWorkspace(workspaces, activeWorkspaceId, paused);
  if (!current) return null;
  const tone = ROLE_TONES[current.role];
  return (
    <span
      className="mt-0.5 block text-[11.5px] leading-snug"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="flex items-center gap-2">
        <span
          key={`role-${current.id}`}
          className={`flex min-w-0 items-center gap-1.5 font-semibold motion-safe:animate-fade-in ${tone.text}`}
        >
          <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} />
          <span className="truncate">{ROLE_LABELS[current.role]}</span>
        </span>
        {workspaces.length > 1 && (
          <span aria-hidden="true" className="flex min-w-0 items-center gap-1 overflow-hidden">
            {workspaces.map((w) => (
              <span
                key={w.id}
                className={`h-1 shrink-0 rounded-full transition-all duration-300 ${
                  w.id === current.id ? `w-3 ${tone.dot}` : 'w-1 bg-line'
                }`}
              />
            ))}
          </span>
        )}
      </span>
      <span
        key={`workspace-${current.id}`}
        title={current.name}
        className="block truncate text-muted motion-safe:animate-fade-in"
      >
        in {current.name}
      </span>
    </span>
  );
}

function SidebarProfile({ collapsed }: { collapsed: boolean }) {
  const user = useCurrentUser();
  const userName = displayName(user);
  const { signingOut, handleSignOut } = useSignOut();
  return (
    <div
      className={`flex min-w-0 items-center gap-1.5 rounded-2xl bg-linear-to-br from-paper to-white shadow-card ring-1 ring-line ${
        collapsed ? 'flex-col p-1' : 'p-1.5'
      }`}
    >
      <NavLink
        to="/profile"
        aria-label={`My profile: ${userName}`}
        className={({ isActive }) =>
          `group relative flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-colors duration-200 hover:bg-white ${FOCUS_RING_CLASS} ${
            isActive ? 'bg-white shadow-card' : ''
          }`
        }
      >
        <Avatar name={userName} size="sm" />
        {collapsed ? (
          <span aria-hidden="true" className={TOOLTIP_CLASS}>
            {userName}
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] leading-tight font-bold text-navy">
              {userName}
            </span>
            {user.workspaces.length > 0 ? (
              <RotatingMembership
                workspaces={user.workspaces}
                activeWorkspaceId={user.activeWorkspaceId}
              />
            ) : (
              <span className="mt-0.5 block truncate text-[11.5px] text-muted">{user.email}</span>
            )}
          </span>
        )}
      </NavLink>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={signingOut}
        aria-label="Sign out"
        title="Sign out"
        className={`grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-muted transition-all duration-200 hover:bg-brick-bg hover:text-brick active:scale-95 disabled:cursor-wait disabled:opacity-60 ${FOCUS_RING_CLASS}`}
      >
        <SignOutIcon className="size-[18px]" />
      </button>
    </div>
  );
}

export function WorkspaceBar() {
  const managementItems = useManagementNavItems();
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-white/70 p-3 sm:flex-row sm:flex-wrap sm:items-center lg:hidden">
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
                `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${FOCUS_RING_CLASS} ${
                  isActive
                    ? 'border-navy bg-navy text-white'
                    : 'border-line bg-paper text-muted hover:border-navy/25 hover:bg-white hover:text-navy'
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
      <div className="min-w-0 sm:basis-full">
        <SidebarProfile collapsed={false} />
      </div>
    </div>
  );
}

export function MobileNav() {
  if (!useHasWorkspaceAccess()) return null;
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
            `flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold transition-colors duration-200 ${FOCUS_RING_CLASS} ${
              isActive
                ? 'bg-navy text-white shadow-card'
                : 'text-muted hover:bg-paper hover:text-navy'
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
