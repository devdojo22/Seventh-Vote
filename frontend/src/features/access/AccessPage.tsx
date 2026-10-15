import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTROL_CLASS } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { PlusIcon, SearchIcon } from '@/components/ui/icons';
import { useAccessStore } from '@/stores/access-store';
import { ROLES, USER_STATUSES, userStatus, type Role, type UserStatus } from '@/types/access';
import { ROLE_LABELS, STATUS_LABELS } from './access-labels';
import { UserDrawer } from './UserDrawer';
import { UserEditorDialog } from './UserEditorDialog';
import { UserList } from './UserList';

type RoleFilter = 'all' | Role;
type StatusFilter = 'all' | UserStatus;

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-4 py-3.5 shadow-card sm:px-5">
      <strong className="block font-display text-[26px] leading-none font-bold text-navy">
        {value}
      </strong>
      <span className="mt-1.5 block text-xs font-medium text-muted">{label}</span>
    </div>
  );
}

export function AccessPage() {
  const users = useAccessStore((s) => s.users);
  const workspaces = useAccessStore((s) => s.workspaces);
  const openUserId = useAccessStore((s) => s.openUserId);
  const editor = useAccessStore((s) => s.editor);
  const openUser = useAccessStore((s) => s.openUser);
  const openEditor = useAccessStore((s) => s.openEditor);

  const [query, setQuery] = useState('');
  const [role, setRole] = useState<RoleFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const workspaceNames = Object.fromEntries(workspaces.map((w) => [w.id, w.name]));
  const search = query.trim().toLowerCase();
  const visible = users.filter(
    (u) =>
      (!search || u.name.toLowerCase().includes(search) || u.email.includes(search)) &&
      (role === 'all' || u.memberships.some((m) => m.role === role)) &&
      (status === 'all' || userStatus(u) === status),
  );
  const filtered = search !== '' || role !== 'all' || status !== 'all';
  const clearFilters = () => {
    setQuery('');
    setRole('all');
    setStatus('all');
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Access Control"
        title="Users and workspace access"
        description="Decide who can sign in, which council workspaces they can open, and who holds the CAO role in each."
        aside={
          <Button className="whitespace-nowrap" onClick={() => openEditor({ mode: 'add' })}>
            <PlusIcon className="size-4" />
            Add user
          </Button>
        }
      />

      <Callout title="Sample data, not connected">
        These users are examples held in this browser tab. Adding or editing them changes nothing on
        a server, and reloading restores the originals. Real accounts arrive with Milestone 2.
      </Callout>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat value={users.length} label="users" />
        <Stat
          value={users.filter((u) => u.memberships.some((m) => m.role === 'CAO')).length}
          label="hold a CAO role"
        />
        <Stat
          value={users.filter((u) => userStatus(u) === 'mfa-pending').length}
          label="MFA setup pending"
        />
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div>
            <label htmlFor="access-search" className="sr-only">
              Search users
            </label>
            <IconInput
              id="access-search"
              icon={SearchIcon}
              type="search"
              placeholder="Search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="access-role" className="sr-only">
              Filter by role
            </label>
            <select
              id="access-role"
              className={CONTROL_CLASS}
              value={role}
              onChange={(e) => setRole(e.target.value as RoleFilter)}
            >
              <option value="all">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="access-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="access-status"
              className={CONTROL_CLASS}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
            >
              <option value="all">All statuses</option>
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="text-xs font-medium text-muted">
          {filtered
            ? `Showing ${visible.length} of ${users.length} users`
            : `${users.length} users`}
        </p>

        {visible.length > 0 ? (
          <UserList
            users={visible}
            workspaceNames={workspaceNames}
            onOpen={openUser}
            onEdit={(id) => openEditor({ mode: 'edit', userId: id })}
          />
        ) : (
          <EmptyState title="No users match these filters">
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 cursor-pointer rounded font-semibold text-navy underline decoration-gold/50 decoration-2 underline-offset-4 hover:decoration-gold focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
            >
              Clear filters
            </button>
          </EmptyState>
        )}
      </div>

      {openUserId && <UserDrawer />}
      {editor && (
        <UserEditorDialog key={editor.mode === 'edit' ? editor.userId : 'add'} editor={editor} />
      )}
    </section>
  );
}
