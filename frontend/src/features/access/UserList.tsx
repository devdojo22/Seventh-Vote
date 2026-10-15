import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { userStatus, type AccessUser } from '@/types/access';
import { MembershipBadge, StatusBadge, SuperAdminBadge } from './AccessBadges';
import { formatDate } from './access-labels';

const EDIT_BUTTON_CLASS =
  'cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-card transition-colors hover:border-navy/25 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

const NAME_BUTTON_CLASS =
  'max-w-full cursor-pointer truncate rounded text-left font-semibold text-navy decoration-gold/60 decoration-2 underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

interface UserListProps {
  users: AccessUser[];
  workspaceNames: Record<string, string>;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
}

function Memberships({
  user,
  workspaceNames,
}: {
  user: AccessUser;
  workspaceNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {user.memberships.map((m) => (
        <MembershipBadge
          key={m.workspaceId}
          role={m.role}
          workspace={workspaceNames[m.workspaceId] ?? 'Unknown workspace'}
        />
      ))}
    </div>
  );
}

export function UserList({ users, workspaceNames, onOpen, onEdit }: UserListProps) {
  return (
    <>
      <Card padded={false} className="hidden overflow-hidden xl:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Users and their workspace access</caption>
            <thead className="border-b border-line bg-paper/70 text-[11px] font-bold tracking-[0.12em] text-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-3">
                  User
                </th>
                <th scope="col" className="px-4 py-3">
                  Workspace access
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Added
                </th>
                <th scope="col" className="px-5 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line2">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-paper/50">
                  <td className="max-w-[280px] px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <button
                            type="button"
                            onClick={() => onOpen(user.id)}
                            className={NAME_BUTTON_CLASS}
                          >
                            {user.name}
                          </button>
                          {user.isSuperAdmin && <SuperAdminBadge />}
                        </div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Memberships user={user} workspaceNames={workspaceNames} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={userStatus(user)} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(user.id)}
                      aria-label={`Edit ${user.name}`}
                      className={EDIT_BUTTON_CLASS}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ul className="grid gap-3 sm:grid-cols-2 xl:hidden" aria-label="Users">
        {users.map((user) => (
          <li key={user.id}>
            <Card className="h-full space-y-3.5">
              <div className="flex items-start gap-3">
                <Avatar name={user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpen(user.id)}
                    className={`block text-sm ${NAME_BUTTON_CLASS}`}
                  >
                    {user.name}
                  </button>
                  <div className="truncate text-xs text-muted">{user.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(user.id)}
                  aria-label={`Edit ${user.name}`}
                  className={EDIT_BUTTON_CLASS}
                >
                  Edit
                </button>
              </div>
              <Memberships user={user} workspaceNames={workspaceNames} />
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge status={userStatus(user)} />
                {user.isSuperAdmin && <SuperAdminBadge />}
                <span className="ml-auto text-xs text-muted">
                  Added {formatDate(user.createdAt)}
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
