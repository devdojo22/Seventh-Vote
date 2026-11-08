import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { ArchiveIcon, PencilIcon } from '@/components/ui/icons';
import { useAppStore } from '@/stores/app-store';
import type { ReviewStatus } from '@/types/dossier';
import {
  archiveDossier,
  dossierHref,
  dossierRef,
  getDossier,
  restoreDossier,
  setReviewStatus,
  type DossierDetail,
} from './dossier-api';
import { ArchivedBadge, ReviewStatusBadge, VersionBadge } from './DossierBadges';
import { DossierContentView } from './DossierContentView';
import { ArchiveDossierDialog, ReviewStatusDialog } from './DossierDialogs';
import { currentVersionFromConflict, describeDossierError } from './dossier-errors';
import { formatDateTime } from './dossier-format';
import { ArchiveHistory, ReviewHistory, VersionHistory } from './DossierHistory';
import { BackLink, DossierNotAvailable, LoadError, LoadingText } from './DossierStates';
import { EvidenceTab } from './EvidenceList';
import { PRIMARY_LINK_CLASS } from './link-classes';
import { useAuthorName, useDossierAccess } from './use-dossier-access';
import { useLoad } from './use-load';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'versions', label: 'Version history' },
  { id: 'review', label: 'Review history' },
  { id: 'archive', label: 'Archive history' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function isTab(value: string | null): value is TabId {
  return TABS.some((t) => t.id === value);
}

function DossierView({ dossier, onChanged }: { dossier: DossierDetail; onChanged: () => void }) {
  const navigate = useNavigate();
  const access = useDossierAccess();
  const authorName = useAuthorName();
  const showToast = useAppStore((s) => s.showToast);
  const [params, setParams] = useSearchParams();
  const [dialog, setDialog] = useState<'review' | 'archive' | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const openDialog = (kind: 'review' | 'archive') => {
    setDialogError(null);
    setDialog(kind);
  };

  const closeDialog = useCallback(() => {
    setDialog(null);
    setDialogError(null);
  }, []);

  const { member, currentVersion: version } = dossier;
  const canEdit = access.canEdit && !member.archived;
  const tabParam = params.get('tab');
  const tab: TabId = isTab(tabParam) ? tabParam : 'profile';
  const selectTab = (id: TabId) =>
    setParams(id === 'profile' ? {} : { tab: id }, { replace: true });

  const run = async (
    action: () => Promise<unknown>,
    done: string,
    after: () => void,
    onError?: (error: unknown) => boolean,
  ) => {
    setBusy(true);
    setDialogError(null);
    try {
      await action();
      setDialog(null);
      showToast(done);
      after();
    } catch (error) {
      if (!onError?.(error)) setDialogError(describeDossierError(error));
    } finally {
      setBusy(false);
    }
  };

  const reloadAll = () => {
    setRevision((r) => r + 1);
    onChanged();
  };

  const onSetStatus = (status: ReviewStatus) =>
    void run(
      () => setReviewStatus(dossier.id, status, version.versionNo),
      'Review status updated',
      () => {
        setReviewNotice(null);
        reloadAll();
      },
      (error) => {
        if (currentVersionFromConflict(error) === null) return false;
        setDialog(null);
        setReviewNotice(describeDossierError(error));
        reloadAll();
        return true;
      },
    );

  const onArchive = () =>
    void run(
      () => archiveDossier(dossier.id),
      'Dossier archived',
      () => {
        void navigate('/dossiers', { replace: true });
      },
    );

  const onRestore = () => void run(() => restoreDossier(dossier.id), 'Dossier restored', reloadAll);

  return (
    <section className="space-y-6">
      <BackLink />

      <PageHeader
        eyebrow="Member dossier"
        title={member.name}
        description={
          [member.district, member.leadershipRole].filter(Boolean).join(' · ') ||
          'No district recorded'
        }
        aside={
          canEdit && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="secondary" onClick={() => openDialog('review')}>
                Set review status
              </Button>
              <Link to={`${dossierHref(dossier)}/edit`} className={PRIMARY_LINK_CLASS}>
                <PencilIcon className="size-4" />
                Edit dossier
              </Link>
            </div>
          )
        }
      />

      {reviewNotice && (
        <Callout title="Review status not changed">
          <span role="alert">{reviewNotice}</span>
        </Callout>
      )}

      {member.archived && (
        <Callout title="This dossier is archived">
          It is kept with its full history but can’t be edited, and it doesn’t appear in the dossier
          list or the council.
          {access.canEdit && ' Restore it to bring it back.'}
        </Callout>
      )}

      <Card padded={false} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={member.name} size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ReviewStatusBadge status={version.status} />
              <VersionBadge number={version.versionNo} current />
              {member.archived && <ArchivedBadge />}
            </div>
            <p className="mt-1 truncate text-xs text-muted">
              Last saved {formatDateTime(version.createdAt)} by {authorName(version.createdBy)}
              {version.changeNote ? ` · “${version.changeNote}”` : ''}
            </p>
          </div>
        </div>
      </Card>

      <div
        role="tablist"
        aria-label="Dossier sections"
        className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 shadow-card"
      >
        {TABS.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              onClick={() => selectTab(t.id)}
              className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
                selected ? 'bg-navy text-white' : 'text-muted hover:bg-paper hover:text-navy'
              }`}
            >
              {t.label}
              {t.id === 'versions' && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 text-[11px] ${selected ? 'bg-white/15 text-gold2' : 'bg-paper text-muted'}`}
                >
                  {version.versionNo}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'profile' && <DossierContentView content={version} />}
        {tab === 'evidence' && <EvidenceTab dossierId={dossier.id} />}
        {tab === 'versions' && <VersionHistory key={revision} dossierId={dossierRef(dossier)} />}
        {tab === 'review' && <ReviewHistory key={revision} dossierId={dossier.id} />}
        {tab === 'archive' && <ArchiveHistory key={revision} dossierId={dossier.id} />}
      </div>

      {canEdit && (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-navy">Archive dossier</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Removes it from the dossier list. Its versions and history are kept.
            </p>
          </div>
          <Button variant="secondary" onClick={() => openDialog('archive')}>
            <ArchiveIcon className="size-4 text-brick" />
            Archive
          </Button>
        </Card>
      )}

      {access.canEdit && member.archived && (
        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold text-navy">Restore dossier</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Puts it back in the dossier list and the council, and makes it editable again.
            </p>
            {dialog === null && dialogError && (
              <p role="alert" className="mt-2 text-xs font-semibold text-brick">
                {dialogError}
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={onRestore} disabled={busy}>
            <ArchiveIcon className="size-4 text-pine" />
            {busy ? 'Restoring…' : 'Restore'}
          </Button>
        </Card>
      )}

      {dialog === 'review' && (
        <ReviewStatusDialog
          name={member.name}
          current={version.status}
          versionNo={version.versionNo}
          busy={busy}
          error={dialogError}
          onCancel={closeDialog}
          onConfirm={onSetStatus}
        />
      )}
      {dialog === 'archive' && (
        <ArchiveDossierDialog
          name={member.name}
          busy={busy}
          error={dialogError}
          onCancel={closeDialog}
          onConfirm={onArchive}
        />
      )}
    </section>
  );
}

export function DossierPage() {
  const { dossierId = '' } = useParams();
  const access = useDossierAccess();
  const fetchDossier = useCallback(() => getDossier(dossierId), [dossierId]);
  const { loaded, reload } = useLoad(fetchDossier);

  if (!access.canView) return <DossierNotAvailable reason="no-access" />;
  if (loaded.state === 'loading') return <LoadingText>Loading dossier…</LoadingText>;
  if (loaded.state === 'error') {
    return (
      <section className="space-y-6">
        <BackLink />
        <LoadError title="Dossier couldn’t be loaded" message={loaded.message} onRetry={reload} />
      </section>
    );
  }
  return <DossierView dossier={loaded.data} onChanged={reload} />;
}
