import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MailIcon } from '@/components/ui/icons';
import { StatusBadge, SuperAdminBadge } from '@/features/access/AccessBadges';
import { formatDate, ROLE_LABELS } from '@/features/access/access-labels';
import { userStatus, type AccessUser, type Role } from '@/types/access';

const ROLE_CLASSES: Record<Role, string> = {
  CAO: 'border border-gold/45 bg-amber-bg text-amber',
  STAFF: 'border border-line bg-paper text-muted',
};

/** The distinct roles a user holds, highest first, so the badge row reads "CAO · Staff". */
function distinctRoles(user: AccessUser): Role[] {
  return (['CAO', 'STAFF'] as const).filter((r) => user.memberships.some((m) => m.role === r));
}

interface ProfileOverviewProps {
  user: AccessUser;
  onEdit: () => void;
}

export function ProfileOverview({ user, onEdit }: ProfileOverviewProps) {
  return (
    <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar name={user.name} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-2xl leading-tight font-bold text-navy">
          {user.name}
        </h2>
        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted">
          <MailIcon className="size-4 shrink-0 text-muted/70" />
          <span className="truncate">{user.email}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {distinctRoles(user).map((role) => (
            <Badge key={role} className={ROLE_CLASSES[role]}>
              {role === 'CAO' && (
                <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
              )}
              {ROLE_LABELS[role]}
            </Badge>
          ))}
          {user.isSuperAdmin && <SuperAdminBadge />}
          <StatusBadge status={userStatus(user)} />
          <span className="text-xs text-muted">Member since {formatDate(user.createdAt)}</span>
        </div>
      </div>
      <Button variant="secondary" className="shrink-0 whitespace-nowrap" onClick={onEdit}>
        Edit profile
      </Button>
    </Card>
  );
}
