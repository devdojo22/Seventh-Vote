import { EmptyState } from '@/components/ui/EmptyState';
import { MembershipBadge } from '@/features/access/AccessBadges';
import { ROLE_DESCRIPTIONS } from '@/features/access/access-labels';
import { useAccessStore } from '@/stores/access-store';
import { useProfileStore } from '@/stores/profile-store';
import { ProfileSection } from './ProfileSection';

export function WorkspaceAccessCard() {
  const user = useProfileStore((s) => s.user);
  const workspaces = useAccessStore((s) => s.workspaces);

  return (
    <ProfileSection
      id="profile-workspaces"
      title="Workspace access"
      description="The council workspaces you can open and your role in each."
    >
      {user.memberships.length > 0 ? (
        <ul className="grid gap-2">
          {user.memberships.map((m) => {
            const workspace = workspaces.find((w) => w.id === m.workspaceId);
            return (
              <li key={m.workspaceId} className="space-y-1.5 rounded-xl bg-paper px-3.5 py-3">
                <MembershipBadge role={m.role} workspace={workspace?.name ?? 'Unknown workspace'} />
                <p className="text-xs leading-relaxed text-muted">{ROLE_DESCRIPTIONS[m.role]}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title="No workspace access yet">
          An administrator will assign your council workspace and role.
        </EmptyState>
      )}
      {user.isSuperAdmin && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          As a super admin, you can also manage every workspace from Access Control.
        </p>
      )}
      <p className="mt-4 border-t border-line2 pt-4 text-xs leading-relaxed text-muted">
        Workspace membership and roles are read-only here. Ask a CAO or administrator to change your
        access.
      </p>
    </ProfileSection>
  );
}
