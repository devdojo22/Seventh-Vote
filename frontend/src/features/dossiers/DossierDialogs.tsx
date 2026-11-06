import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  REVIEW_STATUS_DESCRIPTIONS,
  REVIEW_STATUS_DOTS,
  REVIEW_STATUS_LABELS,
} from '@/data/dossier-options';
import { REVIEW_STATUSES, type ReviewStatus } from '@/types/dossier';

function DialogError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-semibold text-brick">
      {message}
    </p>
  );
}

export function ReviewStatusDialog({
  name,
  current,
  versionNo,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  current: ReviewStatus;
  versionNo: number;
  busy: boolean;
  error: string | null;
  /** Must be stable across renders. */
  onCancel: () => void;
  onConfirm: (status: ReviewStatus) => void;
}) {
  const [status, setStatus] = useState<ReviewStatus>(current);
  const unchanged = status === current;

  return (
    <Modal labelledBy="review-status-title" onClose={onCancel}>
      <form
        className="grid gap-5 overflow-y-auto p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!unchanged) onConfirm(status);
        }}
      >
        <div>
          <h2 id="review-status-title" className="font-display text-xl font-bold text-navy">
            Review status
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            For version {versionNo} of {name}’s dossier. Every change is kept in the review history.
          </p>
        </div>

        <fieldset className="grid gap-2">
          <legend className="sr-only">Status</legend>
          {REVIEW_STATUSES.map((s) => {
            const checked = status === s;
            return (
              <label
                key={s}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold ${
                  checked ? 'border-navy bg-paper' : 'border-line hover:border-navy/25'
                }`}
              >
                <input
                  type="radio"
                  name="review-status"
                  value={s}
                  checked={checked}
                  onChange={() => setStatus(s)}
                  className="mt-1 size-4 shrink-0 cursor-pointer accent-navy"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-navy">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${REVIEW_STATUS_DOTS[s]}`}
                    />
                    {REVIEW_STATUS_LABELS[s]}
                    {s === current && (
                      <span className="text-[11px] font-medium text-muted">· current</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {REVIEW_STATUS_DESCRIPTIONS[s]}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <DialogError message={error} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={unchanged || busy} aria-busy={busy}>
            {busy ? 'Saving…' : 'Set status'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UnsavedChangesDialog({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal labelledBy="unsaved-changes-title" onClose={onStay}>
      <div className="grid gap-4 p-5 sm:p-6">
        <h2 id="unsaved-changes-title" className="font-display text-xl font-bold text-navy">
          Unsaved changes
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          You have unsaved changes. Are you sure you want to leave this page?
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onStay} data-autofocus>
            Stay on page
          </Button>
          <Button onClick={onLeave}>Leave page</Button>
        </div>
      </div>
    </Modal>
  );
}

export function ArchiveDossierDialog({
  name,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  error: string | null;
  /** Must be stable across renders. */
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal labelledBy="archive-dossier-title" onClose={onCancel}>
      <div className="grid gap-4 p-5 sm:p-6">
        <h2 id="archive-dossier-title" className="font-display text-xl font-bold text-navy">
          Archive {name}’s dossier?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          It leaves this workspace’s dossier list and council and can’t be edited. Every version and
          its review history are kept, and it can still be opened read-only from the Archived list,
          where it can be restored.
        </p>
        <DialogError message={error} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy} aria-busy={busy}>
            {busy ? 'Archiving…' : 'Archive dossier'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
