import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { MailIcon } from '@/components/ui/icons';
import { EmailStatusBadge, RoleBadge, SuperAdminBadge } from '@/features/access/AccessBadges';
import { formatDate } from '@/features/access/access-labels';
import { displayName, type CurrentUser } from '@/features/auth/auth-api';
import { ROLES, type Role } from '@/types/access';

function distinctRoles(user: CurrentUser): Role[] {
  return ROLES.filter((r) => user.workspaces.some((w) => w.role === r));
}

export function ProfileOverview({ user }: { user: CurrentUser }) {
  const name = displayName(user);
  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar name={name} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-2xl leading-tight font-bold text-navy">{name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
          <MailIcon className="size-4 shrink-0 text-muted/70" />
          <span className="truncate">{user.email}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {distinctRoles(user).map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
          {user.isSuperAdmin && <SuperAdminBadge />}
          <EmailStatusBadge verified={user.emailVerifiedAt !== null} />
          <span className="text-xs text-muted">
            Member since {formatDate(user.createdAt.slice(0, 10))}
          </span>
        </div>
      </div>
    </Card>
  );
}
