/** The "Rehearsal, not prediction." footer shown under every view. */
export function Disclaimer() {
  return (
    <footer className="mt-10 pt-4.5 pb-8 border-t border-line text-[#657785] text-[11px] flex flex-col sm:flex-row gap-1.5 sm:gap-3 items-start">
      <strong className="text-navy font-bold whitespace-nowrap">Rehearsal, not prediction.</strong>
      <span className="leading-normal">
        Digital-twin outputs are public-record hypotheses for preparation. Verify citations, account
        for missing context, and speak with council members directly before making decisions.
      </span>
    </footer>
  );
}
