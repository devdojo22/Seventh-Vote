import { Badge } from '@/components/ui/Badge';
import { AlertIcon, CheckCircleIcon, ShieldIcon } from '@/components/ui/icons';
import type { Role, UserStatus } from '@/types/access';
import { ROLE_LABELS, STATUS_LABELS } from './access-labels';

const ROLE_CLASSES: Record<Role, string> = {
  CAO: 'border border-gold/45 bg-amber-bg text-amber',
  STAFF: 'border border-line bg-paper text-muted',
};

export function MembershipBadge({ role, workspace }: { role: Role; workspace: string }) {
  return (
    <Badge className={ROLE_CLASSES[role]}>
      {role === 'CAO' && <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />}
      <strong className="font-bold">{ROLE_LABELS[role]}</strong>
      <span className="font-medium opacity-80">{workspace}</span>
    </Badge>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return status === 'active' ? (
    <Badge className="bg-pine-bg text-pine">
      <CheckCircleIcon className="size-3.5" />
      {STATUS_LABELS[status]}
    </Badge>
  ) : (
    <Badge className="border border-gold/35 bg-amber-bg text-amber">
      <AlertIcon className="size-3.5 text-gold" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function SuperAdminBadge() {
  return (
    <Badge className="bg-navy text-gold2">
      <ShieldIcon className="size-3.5 text-gold" />
      Super admin
    </Badge>
  );
}
