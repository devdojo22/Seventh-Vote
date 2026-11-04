import { useCallback } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/ui/EmptyState';
import { listReviewHistory, listVersions } from './dossier-api';
import { ReviewStatusBadge, VersionBadge } from './DossierBadges';
import { formatDateTime } from './dossier-format';
import { LoadError, LoadingText } from './DossierStates';
import { SMALL_BUTTON_CLASS } from './link-classes';
import { useAuthorName } from './use-dossier-access';
import { useLoad } from './use-load';

/** Every saved version, newest first. Versions are read-only. */
export function VersionHistory({ dossierId }: { dossierId: string }) {
  const authorName = useAuthorName();
  const fetchVersions = useCallback(() => listVersions(dossierId), [dossierId]);
  const { loaded, reload } = useLoad(fetchVersions);

  if (loaded.state === 'loading') return <LoadingText>Loading versions…</LoadingText>;
  if (loaded.state === 'error') {
    return (
      <LoadError title="Versions couldn’t be loaded" message={loaded.message} onRetry={reload} />
    );
  }
  return (
    <ol className="grid gap-3" aria-label="Versions">
      {loaded.data.map((v) => (
        <li
          key={v.versionNo}
          className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-5"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <VersionBadge number={v.versionNo} current={v.isCurrent} />
              <ReviewStatusBadge status={v.status} />
              <span className="text-xs text-muted">
                {formatDateTime(v.createdAt)} · {authorName(v.createdBy)}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-ink/80">
              {v.changeNote || <span className="text-muted">No change note.</span>}
            </p>
          </div>
          <Link
            to={
              v.isCurrent
                ? `/dossiers/${dossierId}`
                : `/dossiers/${dossierId}/versions/${String(v.versionNo)}`
            }
            className={`${SMALL_BUTTON_CLASS} self-start sm:self-center`}
          >
            {v.isCurrent ? 'View current' : 'View version'}
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Every review-status change across all versions, newest first. */
export function ReviewHistory({ dossierId }: { dossierId: string }) {
  const authorName = useAuthorName();
  const fetchHistory = useCallback(() => listReviewHistory(dossierId), [dossierId]);
  const { loaded, reload } = useLoad(fetchHistory);

  if (loaded.state === 'loading') return <LoadingText>Loading review history…</LoadingText>;
  if (loaded.state === 'error') {
    return (
      <LoadError
        title="Review history couldn’t be loaded"
        message={loaded.message}
        onRetry={reload}
      />
    );
  }
  if (loaded.data.length === 0) {
    return (
      <EmptyState title="No review changes yet">
        Status changes will be listed here, with who made them and on which version.
      </EmptyState>
    );
  }
  return (
    <ol className="relative space-y-4 border-l border-line pl-5" aria-label="Review history">
      {loaded.data.map((e) => (
        <li key={e.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-4 -left-[23.5px] size-2 rounded-full bg-gold ring-4 ring-paper"
          />
          <div className="space-y-2 rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <ReviewStatusBadge status={e.fromStatus} />
              <span aria-hidden="true">→</span>
              <span className="sr-only">changed to</span>
              <ReviewStatusBadge status={e.toStatus} />
              <span>on version {e.versionNo}</span>
            </div>
            <p className="text-[11px] font-medium text-muted">
              {formatDateTime(e.changedAt)} · {authorName(e.changedBy)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
