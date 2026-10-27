import { Link } from 'react-router';
import { EmptyState } from '@/components/ui/EmptyState';
import { MembershipBadge } from '@/features/access/AccessBadges';
import { ROLE_DESCRIPTIONS } from '@/features/access/access-labels';
import { TEXT_LINK_CLASS } from '@/features/auth/AuthControls';
import { useCurrentUser } from '@/stores/auth-session-store';
import { ProfileSection } from './ProfileSection';

export function WorkspaceAccessCard() {
  const user = useCurrentUser();

  return (
    <ProfileSection
      id="profile-workspaces"
      title="Workspace access"
      description="The council workspaces you can open and your role in each."
    >
      {user.workspaces.length > 0 ? (
        <ul className="grid grid-cols-1 gap-2">
          {user.workspaces.map((w) => (
            <li key={w.id} className="min-w-0 space-y-1.5 rounded-xl bg-paper px-3.5 py-3">
              <MembershipBadge role={w.role} workspace={w.name} />
              <p className="text-xs leading-relaxed text-muted">{ROLE_DESCRIPTIONS[w.role]}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <Link to={`/workspaces/${w.id}/settings`} className={`text-xs ${TEXT_LINK_CLASS}`}>
                  Vote rules
                </Link>
                {(w.role === 'PRINCIPAL' || user.isSuperAdmin) && (
                  <Link to={`/workspaces/${w.id}/members`} className={`text-xs ${TEXT_LINK_CLASS}`}>
                    Manage members
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No workspace access yet">
          You join a workspace by accepting an invitation from its Principal.
        </EmptyState>
      )}
      {user.isSuperAdmin && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          As a platform administrator you can create workspaces and designate their Principals from{' '}
          <Link to="/admin/workspaces" className={TEXT_LINK_CLASS}>
            All workspaces
          </Link>
          .
        </p>
      )}
      <p className="mt-4 border-t border-line2 pt-4 text-xs leading-relaxed text-muted">
        Your role in a workspace is set by its Principal; only a platform administrator can change
        who the Principal is. Your job title does not decide your role.
      </p>
    </ProfileSection>
  );
}
