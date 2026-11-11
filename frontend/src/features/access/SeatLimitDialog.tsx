import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { CONTROL_CLASS, FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { CloseIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';
import { MODAL_CLOSE_BUTTON_CLASS, Modal } from '@/components/ui/Modal';
import { updateSeatLimit, type AdminWorkspace } from './access-api';
import { describeAccessError } from './access-errors';
import { SeatStatusBadge } from './AccessBadges';
import {
  AFFILIATE_SEAT_LIMIT_MAX,
  describeSeats,
  lowerLimitWarning,
  seatBreakdown,
  seatStateCaption,
  seatTotal,
} from './affiliate-seats';

const INPUT_ID = 'seat-limit-input';

const STEP_BUTTON_CLASS =
  'grid size-12 shrink-0 cursor-pointer place-items-center rounded-xl border border-line bg-white text-navy shadow-card transition-colors hover:border-navy/25 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';

type ParsedLimit = { ok: true; limit: number | null } | { ok: false; message: string };

function parseLimit(draft: string): ParsedLimit {
  const text = draft.trim();
  if (text === '') return { ok: true, limit: null };
  if (!/^\d+$/.test(text))
    return { ok: false, message: 'Use a whole number, or leave it empty for Unlimited.' };
  const limit = Number(text);
  if (limit > AFFILIATE_SEAT_LIMIT_MAX) {
    return { ok: false, message: `Use at most ${String(AFFILIATE_SEAT_LIMIT_MAX)} seats.` };
  }
  return { ok: true, limit };
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-navy">{children}</dd>
    </div>
  );
}

export function SeatLimitDialog({
  workspace,
  onClose,
  onDone,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { seatLimit, seatsUsed, activeAffiliates, pendingInvitations } = workspace.affiliateSeats;
  const [draft, setDraft] = useState(seatLimit === null ? '' : String(seatLimit));
  // The number to come back to when "Unlimited" is unticked.
  const [lastNumber, setLastNumber] = useState(String(seatLimit ?? seatsUsed));
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = parseLimit(draft);
  const unlimited = draft.trim() === '';
  const changed = parsed.ok && parsed.limit !== seatLimit;
  const current = parsed.ok && parsed.limit !== null ? parsed.limit : null;

  const edit = (next: string) => {
    setError(null);
    setDraft(next);
    if (next.trim() !== '') setLastNumber(next);
  };

  const step = (delta: number) => {
    const base = current ?? seatsUsed;
    edit(
      String(
        Math.min(AFFILIATE_SEAT_LIMIT_MAX, Math.max(0, base + (current === null ? 0 : delta))),
      ),
    );
  };

  const save = async (limit: number | null) => {
    setBusy(true);
    setError(null);
    try {
      await updateSeatLimit(workspace.id, limit);
      onDone(limit === null ? 'Seat limit removed' : 'Seat limit updated');
    } catch (caught) {
      setError(describeAccessError(caught));
      setConfirming(false);
      setBusy(false);
    }
  };

  const submit = () => {
    if (!parsed.ok || !changed || busy) return;
    if (parsed.limit !== null && parsed.limit < seatsUsed) {
      setConfirming(true);
      return;
    }
    void save(parsed.limit);
  };

  const closeButton = (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className={`${MODAL_CLOSE_BUTTON_CLASS} border border-line text-navy hover:bg-paper`}
    >
      <CloseIcon />
    </button>
  );

  if (confirming && parsed.ok && parsed.limit !== null) {
    const limit = parsed.limit;
    return (
      <Modal labelledBy="seat-limit-title" onClose={onClose}>
        <div className="grid gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-amber uppercase">
                Affiliate seats
              </p>
              <h2 id="seat-limit-title" className="mt-1 font-display text-xl font-bold text-navy">
                Lower the limit below current usage?
              </h2>
            </div>
            {closeButton}
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {lowerLimitWarning(seatsUsed, limit)}
          </p>
          {error && (
            <p role="alert" className="text-xs font-semibold text-brick">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={() => setConfirming(false)}
              disabled={busy}
              data-autofocus
            >
              Back
            </Button>
            <Button onClick={() => void save(limit)} disabled={busy} aria-busy={busy}>
              {busy ? 'Saving…' : `Lower limit to ${String(limit)}`}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const preview = parsed.ok ? describeSeats(parsed.limit, seatsUsed) : null;
  const invalid = !parsed.ok;

  return (
    <Modal labelledBy="seat-limit-title" onClose={onClose}>
      <form
        noValidate
        className="grid max-h-[100dvh] gap-4 overflow-y-auto p-5 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-amber uppercase">
              Affiliate seats
            </p>
            <h2 id="seat-limit-title" className="mt-1 font-display text-xl font-bold text-navy">
              Manage Affiliate Seat Limit
            </h2>
          </div>
          {closeButton}
        </div>

        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper/50">
          <SummaryRow label="Workspace">{workspace.name}</SummaryRow>
          <SummaryRow label="Current usage">
            {seatLimit === null
              ? `${String(seatsUsed)} seat${seatsUsed === 1 ? '' : 's'} used`
              : `${String(seatsUsed)} of ${String(seatLimit)} seats used`}
            <span className="mt-0.5 block text-[11px] font-normal text-muted">
              {seatBreakdown(activeAffiliates, pendingInvitations)}
            </span>
          </SummaryRow>
          <SummaryRow label="Current limit">
            {seatLimit === null ? 'Unlimited' : seatLimit}
          </SummaryRow>
        </dl>

        <div className="grid gap-1.5">
          <label htmlFor={INPUT_ID} className={LABEL_CLASS}>
            New seat limit
          </label>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              aria-label="Decrease seat limit"
              className={STEP_BUTTON_CLASS}
              disabled={busy || current === 0}
              onClick={() => step(-1)}
            >
              <MinusIcon />
            </button>
            <input
              id={INPUT_ID}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              data-autofocus
              placeholder="Unlimited"
              className={`${CONTROL_CLASS} text-center font-display text-lg font-bold text-navy`}
              value={draft}
              disabled={busy}
              aria-invalid={invalid}
              aria-describedby={invalid ? `${INPUT_ID}-error` : undefined}
              onChange={(e) => edit(e.target.value)}
            />
            <button
              type="button"
              aria-label="Increase seat limit"
              className={STEP_BUTTON_CLASS}
              disabled={busy || current === AFFILIATE_SEAT_LIMIT_MAX}
              onClick={() => step(1)}
            >
              <PlusIcon />
            </button>
          </div>
          {!parsed.ok && <FieldError id={`${INPUT_ID}-error`} message={parsed.message} />}
        </div>

        <div className="grid gap-1">
          <Checkbox
            label={<span className="font-semibold text-navy">Unlimited</span>}
            checked={unlimited}
            disabled={busy}
            onChange={(e) => edit(e.target.checked ? '' : lastNumber)}
          />
          <p className="pl-6.5 text-xs leading-relaxed text-muted">
            No restriction on Affiliate invitations. Clearing the field also sets Unlimited.
          </p>
        </div>

        {preview && parsed.ok && (
          <div
            className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3"
            aria-live="polite"
          >
            <div>
              <div className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
                After saving
              </div>
              <div className="mt-0.5 font-display text-base font-bold text-navy">
                {seatTotal(parsed.limit, seatsUsed)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
              <span className="font-semibold text-navy">{seatStateCaption(preview)}</span>
              <SeatStatusBadge kind={preview.kind} />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-xs font-semibold text-brick">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={!changed || busy} aria-busy={busy}>
            {busy ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
