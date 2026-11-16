import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';

export const REVIEW_NOTE_MAX = 500;

function DialogError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-semibold text-brick">
      {message}
    </p>
  );
}


export function SendBackDialog({
  name,
  versionNo,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  versionNo: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string | undefined>(undefined);

  const validate = (value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed === '') return 'Add a note explaining what needs to change.';
    if (trimmed.length > REVIEW_NOTE_MAX) {
      return `Keep the note to ${String(REVIEW_NOTE_MAX)} characters or fewer.`;
    }
    return undefined;
  };

  return (
    <Modal labelledBy="send-back-title" onClose={onCancel}>
      <form
        className="grid gap-5 overflow-y-auto p-5 sm:p-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const problem = validate(note);
          setNoteError(problem);
          if (problem === undefined) onConfirm(note.trim());
        }}
      >
        <div>
          <h2 id="send-back-title" className="font-display text-xl font-bold text-navy">
            Send back to draft
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Version {versionNo} of {name}’s dossier goes back to draft. Your note is kept in the
            review history.
          </p>
        </div>

        <Field id="send-back-note" label="Note" required error={noteError}>
          <textarea
            id="send-back-note"
            rows={4}
            value={note}
            maxLength={REVIEW_NOTE_MAX}
            data-autofocus
            aria-invalid={noteError !== undefined}
            aria-describedby={noteError ? 'send-back-note-error' : undefined}
            onChange={(e) => {
              setNote(e.target.value);
              if (noteError !== undefined) setNoteError(validate(e.target.value));
            }}
            className={CONTROL_CLASS}
          />
        </Field>

        <DialogError message={error} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy} aria-busy={busy}>
            {busy ? 'Sending back…' : 'Send back'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ApproveDialog({
  name,
  versionNo,
  fromDraft,
  ownVersion,
  replacesVersionNo,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  versionNo: number;
  fromDraft: boolean;
  ownVersion: boolean;
  replacesVersionNo: number | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal labelledBy="approve-title" onClose={onCancel}>
      <div className="grid gap-4 p-5 sm:p-6">
        <h2 id="approve-title" className="font-display text-xl font-bold text-navy">
          Approve version {versionNo} of {name}’s dossier?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          {replacesVersionNo === null
            ? 'The simulator starts using this version.'
            : `The simulator stops using version ${String(replacesVersionNo)} and starts using this one.`}{' '}
          <strong className="font-semibold text-ink">Approval can’t be undone</strong>: this version
          is locked, and later changes need a new draft.
        </p>
        {(fromDraft || ownVersion) && (
          <ul className="grid list-disc gap-1 pl-5 text-sm leading-relaxed text-amber">
            {fromDraft && (
              <li>This version is still a draft and hasn’t been submitted for review.</li>
            )}
            {ownVersion && (
              <li>You saved this version, so the review history will show it as self-approved.</li>
            )}
          </ul>
        )}
        <DialogError message={error} />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy} aria-busy={busy}>
            {busy ? 'Approving…' : 'Approve version'}
          </Button>
        </div>
      </div>
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
