import { Link, Outlet } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadError, LoadingText } from '@/features/dossiers/DossierStates';
import { PRIMARY_LINK_CLASS } from '@/features/dossiers/link-classes';
import { useCurrentUser } from '@/stores/auth-session-store';
import { useCouncilStore } from '@/stores/council-store';

function Unavailable({ title, body }: { title: string; body: string }) {
  return <PageHeader eyebrow="Council" title={title} description={body} />;
}

export function CouncilBoundary() {
  const user = useCurrentUser();
  const status = useCouncilStore((s) => s.status);
  const error = useCouncilStore((s) => s.error);
  const memberCount = useCouncilStore((s) => s.members.length);
  const markStale = useCouncilStore((s) => s.markStale);

  if (user.activeWorkspaceId === null) {
    return (
      <Unavailable
        title="Choose a workspace"
        body="The council comes from a workspace’s dossiers. Choose one from the workspace menu."
      />
    );
  }
  if (!user.permissions?.viewDossiers) {
    return (
      <Unavailable
        title="The council isn’t available"
        body="The council is built from this workspace’s dossiers, which your access doesn’t include."
      />
    );
  }
  if (status === 'error') {
    return (
      <LoadError
        title="The council couldn’t be loaded"
        message={error ?? 'Something went wrong.'}
        onRetry={markStale}
      />
    );
  }
  if (status !== 'ready') return <LoadingText>Loading the council…</LoadingText>;

  const refreshError = error && (
    <div className="mb-6">
      <LoadError
        title="The council couldn’t be refreshed"
        message={`${error} What you see may be out of date.`}
        onRetry={markStale}
      />
    </div>
  );

  if (memberCount === 0) {
    const canEdit = user.permissions.editDossiers;
    return (
      <section className="space-y-8">
        {refreshError}
        <Unavailable
          title="No council members yet"
          body="The council is built from this workspace’s dossiers. It appears here once the first dossier is added."
        />
        <EmptyState title="No dossiers in this workspace">
          {canEdit ? (
            <Link to="/dossiers/new" className={PRIMARY_LINK_CLASS}>
              Create the first dossier
            </Link>
          ) : (
            'Dossiers will appear here once they are added.'
          )}
        </EmptyState>
      </section>
    );
  }
  return (
    <>
      {refreshError}
      <Outlet />
    </>
  );
}
