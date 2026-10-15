import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { CloseIcon } from '@/components/ui/icons';
import { Modal, MODAL_CLOSE_BUTTON_CLASS } from '@/components/ui/Modal';
import { useAccessStore } from '@/stores/access-store';
import { userStatus } from '@/types/access';
import { MembershipBadge, StatusBadge, SuperAdminBadge } from './AccessBadges';
import { formatDate, ROLE_DESCRIPTIONS } from './access-labels';

const SECTION_TITLE_CLASS = 'font-display text-lg font-bold text-navy';

export function UserDrawer() {
  const user = useAccessStore((s) => s.users.find((u) => u.id === s.openUserId));
  const workspaces = useAccessStore((s) => s.workspaces);
  const closeUser = useAccessStore((s) => s.closeUser);
  const openEditor = useAccessStore((s) => s.openEditor);

  if (!user) return null;
  const status = userStatus(user);

  return (
    <Modal variant="drawer" labelledBy="user-drawer-name" onClose={closeUser}>
      <div className="sticky top-0 z-10 shrink-0 bg-navy text-white shadow-[0_1px_0_rgb(200_155_60/0.55)]">
        <div className="flex items-center gap-4 p-5 sm:px-7 sm:py-6">
          <Avatar name={user.name} size="lg" inverted />
          <div className="min-w-0 flex-1">
            <h2
              id="user-drawer-name"
              className="truncate font-display text-2xl leading-tight font-bold"
            >
              {user.name}
            </h2>
            <p className="mt-0.5 truncate text-[13px] text-white/65">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={closeUser}
            aria-label="Close user details"
            className={`${MODAL_CLOSE_BUTTON_CLASS} border border-white/20 text-white/80 hover:bg-white/10 hover:text-white`}
          >
            <CloseIcon className="size-4.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-4 pb-10 text-[13px] leading-relaxed sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {user.isSuperAdmin && <SuperAdminBadge />}
        </div>

        <div className="divide-y divide-line2 rounded-2xl border border-line bg-white shadow-card *:p-5 sm:*:p-6">
          <section className="space-y-3">
            <h3 className={SECTION_TITLE_CLASS}>Workspace access</h3>
            <ul className="grid gap-2">
              {user.memberships.map((m) => {
                const workspace = workspaces.find((w) => w.id === m.workspaceId);
                return (
                  <li key={m.workspaceId} className="space-y-1.5 rounded-xl bg-paper px-3.5 py-3">
                    <MembershipBadge role={m.role} workspace={workspace?.name ?? 'Unknown'} />
                    <p className="text-xs text-muted">{ROLE_DESCRIPTIONS[m.role]}</p>
                  </li>
                );
              })}
            </ul>
            {user.isSuperAdmin && (
              <p className="text-xs text-muted">
                As a super admin, this user can also manage every workspace.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <h3 className={SECTION_TITLE_CLASS}>Account</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-paper px-3.5 py-3">
                <dt className="text-xs font-semibold text-navy">Multi-factor authentication</dt>
                <dd className="mt-0.5 text-xs text-muted">
                  {status === 'active'
                    ? 'Authenticator app confirmed.'
                    : 'Not set up. They’ll be asked to enrol an authenticator app at their next sign-in.'}
                </dd>
              </div>
              <div className="rounded-xl bg-paper px-3.5 py-3">
                <dt className="text-xs font-semibold text-navy">Added</dt>
                <dd className="mt-0.5 text-xs text-muted">{formatDate(user.createdAt)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={() => openEditor({ mode: 'edit', userId: user.id })}
        >
          Edit user and access
        </Button>
      </div>
    </Modal>
  );
}
