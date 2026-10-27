import { Badge } from '@/components/ui/Badge';
import { AlertIcon, CheckCircleIcon, ShieldIcon } from '@/components/ui/icons';
import type { Role } from '@/types/access';
import { ROLE_LABELS } from './access-labels';

const ROLE_CLASSES: Record<Role, string> = {
  PRINCIPAL: 'border border-gold/45 bg-amber-bg text-amber',
  AFFILIATE: 'border border-line bg-paper text-muted',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge className={ROLE_CLASSES[role]}>
      {role === 'PRINCIPAL' && (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
      )}
      {ROLE_LABELS[role]}
    </Badge>
  );
}

export function MembershipBadge({ role, workspace }: { role: Role; workspace: string }) {
  return (
    <Badge className={`max-w-full ${ROLE_CLASSES[role]}`}>
      {role === 'PRINCIPAL' && (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
      )}
      <strong className="shrink-0 font-bold">{ROLE_LABELS[role]}</strong>
      <span title={workspace} className="min-w-0 truncate font-medium opacity-80">
        {workspace}
      </span>
    </Badge>
  );
}

export function EmailStatusBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge className="bg-pine-bg text-pine">
      <CheckCircleIcon className="size-3.5" />
      Email verified
    </Badge>
  ) : (
    <Badge className="border border-gold/35 bg-amber-bg text-amber">
      <AlertIcon className="size-3.5 text-gold" />
      Email not verified yet
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
