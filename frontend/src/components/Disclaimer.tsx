export function Disclaimer() {
  return (
    <footer className="mt-14 flex flex-col items-start gap-1.5 border-t border-line pt-5 text-xs leading-relaxed text-muted sm:flex-row sm:gap-3">
      <strong className="font-semibold whitespace-nowrap text-navy">
        Rehearsal, not prediction.
      </strong>
      <span>
        Digital-twin outputs are public-record hypotheses for preparation. Verify citations, account
        for missing context, and speak with council members directly before making decisions.
      </span>
    </footer>
  );
}
