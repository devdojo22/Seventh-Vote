import { Outlet } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCurrentUser } from '@/stores/auth-session-store';
import { useHasWorkspaceAccess } from './use-workspace-access';

export function RequireWorkspace() {
  const user = useCurrentUser();
  if (useHasWorkspaceAccess()) return <Outlet />;
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Workspace access"
        title="You don’t have access to a workspace"
        description="Your account is still active. Council rehearsals, dossiers and vote rules belong to a workspace."
      />
      <EmptyState>
        {user.workspaces.length > 0
          ? 'Choose one of your workspaces from the workspace menu to continue.'
          : 'When a workspace invites you, accept the invitation from your email and it will appear here.'}
      </EmptyState>
    </div>
  );
}
