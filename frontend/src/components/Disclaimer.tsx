import { ShieldIcon } from './ui/icons';

const TEXT =
  'Digital-twin outputs are public-record hypotheses for preparation. Verify citations, account for missing context, and speak with council members directly before making decisions.';

/** `card`: the navy panel the dossier list uses; `line` (default): the plain footer every other page uses. */
export function Disclaimer({ variant = 'line' }: { variant?: 'line' | 'card' }) {
  if (variant === 'card') {
    return (
      <footer className="mt-10 flex gap-4 rounded-2xl bg-navy p-5 text-white shadow-card sm:p-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
          <ShieldIcon className="size-5 text-gold" />
        </span>
        <div className="min-w-0 space-y-1 text-[13px] leading-relaxed">
          <strong className="block font-bold">Rehearsal, not prediction.</strong>
          <p className="max-w-3xl text-white/75">{TEXT}</p>
        </div>
      </footer>
    );
  }
  return (
    <footer className="mt-14 flex flex-col items-start gap-1.5 border-t border-line pt-5 text-xs leading-relaxed text-muted sm:flex-row sm:gap-3">
      <strong className="font-semibold whitespace-nowrap text-navy">
        Rehearsal, not prediction.
      </strong>
      <span>{TEXT}</span>
    </footer>
  );
}
