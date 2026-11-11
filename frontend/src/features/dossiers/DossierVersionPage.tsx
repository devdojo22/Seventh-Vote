import { useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Callout } from '@/components/ui/Callout';
import { Loader } from '@/components/ui/Loader';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ApiError } from '@/lib/api/http';
import { getDossier, getVersion } from './dossier-api';
import { ReviewStatusBadge, VersionBadge } from './DossierBadges';
import { DossierContentView } from './DossierContentView';
import { VersionNotFoundError } from './dossier-errors';
import { formatDateTime } from './dossier-format';
import { BackLink, DossierNotAvailable, LoadError } from './DossierStates';
import { EvidenceTab } from './EvidenceList';
import { useAuthorName, useDossierAccess } from './use-dossier-access';
import { useLoad } from './use-load';

function parseVersionNo(raw: string): number | null {
  return /^[1-9][0-9]*$/.test(raw) ? Number(raw) : null;
}

export function DossierVersionPage() {
  const { dossierId = '', versionNumber = '' } = useParams();
  const versionNo = parseVersionNo(versionNumber);
  const access = useDossierAccess();
  const authorName = useAuthorName();
  const fetchVersion = useCallback(async () => {
    if (versionNo === null) throw new VersionNotFoundError(versionNumber);
    try {
      return await getVersion(dossierId, versionNo);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const dossierExists = await getDossier(dossierId).then(
          () => true,
          () => false,
        );
        if (dossierExists) throw new VersionNotFoundError(versionNumber);
      }
      throw error;
    }
  }, [dossierId, versionNo, versionNumber]);
  const { loaded, reload } = useLoad(fetchVersion);
  const historyLink = `/dossiers/${dossierId}?tab=versions`;

  if (!access.canView) return <DossierNotAvailable reason="no-access" />;
  if (loaded.state === 'loading') return <Loader label="Loading version…" />;
  if (loaded.state === 'error') {
    return (
      <section className="space-y-6">
        <BackLink to={historyLink} label="Version history" />
        <LoadError title="Version couldn’t be loaded" message={loaded.message} onRetry={reload} />
      </section>
    );
  }

  const version = loaded.data;
  return (
    <section className="space-y-6">
      <BackLink to={historyLink} label="Version history" />

      <PageHeader
        eyebrow={`Version ${String(version.versionNo)}`}
        title={version.name}
        description={`Saved ${formatDateTime(version.createdAt)} by ${authorName(version.createdBy)}.`}
        aside={
          <div className="flex flex-wrap gap-2">
            <VersionBadge number={version.versionNo} />
            <ReviewStatusBadge status={version.status} />
          </div>
        }
      />

      <Callout title="You’re viewing a saved version">
        History is read-only: later edits are kept as their own versions.{' '}
        <Link to={`/dossiers/${dossierId}`} className="font-semibold underline">
          See the current version
        </Link>
        .
      </Callout>

      <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-relaxed shadow-card sm:p-6">
        <strong className="text-[11px] font-bold tracking-wide text-muted uppercase">
          Change note
        </strong>
        <p className="mt-1 text-ink/80">{version.changeNote || 'No change note.'}</p>
      </div>

      <DossierContentView content={version} />

      <div className="space-y-4">
        <SectionHeading title="Evidence in this version" />
        <EvidenceTab dossierId={dossierId} versionNo={version.versionNo} />
      </div>
    </section>
  );
}
