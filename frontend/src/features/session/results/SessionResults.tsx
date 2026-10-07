import { SourceList } from '@/components/SourceList';
import { CATEGORY_LABELS } from '@/data/agenda';
import { downloadText } from '@/lib/download';
import { citations } from '@/lib/simulation/scoring';
import { textBrief } from '@/lib/simulation/text-brief';
import { useCouncilStore } from '@/stores/council-store';
import type { SessionAnalysis, SessionInput } from '@/types/simulation';
import { ConsentPanel } from './ConsentPanel';
import { MemberReadCard } from './MemberReadCard';
import { OutreachList } from './OutreachList';
import { PivotalPanel } from './PivotalPanel';
import { SectionHeading } from './SectionHeading';
import { TallyPanel } from './TallyPanel';
import { ThresholdFigure } from './ThresholdFigure';

const CALLOUT_CLASS =
  'rounded-xl border border-gold/30 bg-amber-bg/60 p-3.5 font-sans text-xs leading-relaxed text-navy shadow-2xs sm:p-4 sm:text-sm';
const CHIP_CLASS =
  'rounded-md border border-line bg-paper/60 px-2.5 py-1 text-xs font-semibold text-navy/70';

function thresholdExplanation(analysis: SessionAnalysis): string {
  const { threshold, direction, target } = analysis;
  const parts = [
    threshold.verified
      ? 'The threshold is recomputed from the selected action type and attendance.'
      : `The ${threshold.needed}-vote ordinary-passage default is shown as an unverified working inference, not a confirmed Rules threshold.`,
  ];
  if (direction === 'oppose' && threshold.basis !== 'consent') {
    const absent =
      threshold.basis === 'full'
        ? '; absent and recused members cannot vote yes, so they count toward the block'
        : '';
    parts.push(`To block, ${target} members must not vote yes${absent}.`);
  }
  return parts.join(' ');
}

/** Full simulation result for one session run. */
export function SessionResults({
  analysis,
  input,
}: {
  analysis: SessionAnalysis;
  input: SessionInput;
}) {
  const oneShot = useCouncilStore((s) => s.config.procedure.oneShotStakes);
  const { rows, rule, voting, notVoting, threshold, outcome, blocRow } = analysis;
  const isConsent = outcome === 'consent';

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="min-w-0 space-y-1.5">
          <small className="block text-xs font-semibold tracking-wider text-navy/60 uppercase">
            Simulation result
          </small>
          <h2 className="truncate font-display text-xl font-bold text-navy sm:text-2xl lg:text-3xl">
            {input.title}
          </h2>
          <p className="font-sans text-xs text-navy/70 sm:text-sm">
            {CATEGORY_LABELS[input.category]} · {rule.label} · {input.ask}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className={CHIP_CLASS}>Committee: {input.committee || 'Not entered'}</span>
            <span className={CHIP_CLASS}>Chair: {input.committeeChair || 'Chair not entered'}</span>
            <span className={CHIP_CLASS}>
              {voting.length} present · {notVoting} not voting
            </span>
          </div>
        </div>
        <ThresholdFigure analysis={analysis} />
      </div>

      <div className="space-y-3">
        <div className={CALLOUT_CLASS}>
          <strong className="mr-1.5 block font-semibold text-navy sm:inline">
            {threshold.note}
          </strong>
          {thresholdExplanation(analysis)}
        </div>
        <div className={CALLOUT_CLASS}>
          <strong className="mr-1.5 block font-semibold text-navy sm:inline">
            {oneShot.title}
          </strong>
          {oneShot.body}
        </div>
      </div>

      {isConsent ? (
        <>
          <ConsentPanel objectors={analysis.consentObjectors} />
          <SectionHeading
            title="Member-by-member read"
            note="Objector lens · select a row for evidence"
          />
        </>
      ) : (
        <>
          <TallyPanel analysis={analysis} />
          <SectionHeading title="Who is pivotal?" note="One-member threshold test" />
          <PivotalPanel analysis={analysis} />
          <SectionHeading
            title="Member-by-member read"
            note="Select a row for reasoning and sources"
          />
        </>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <MemberReadCard key={row.member.id} row={row} input={input} />
        ))}
      </div>

      <OutreachList analysis={analysis} />

      {blocRow && (
        <div className="rounded-xl border border-line bg-paper/50 p-3.5 font-sans text-xs leading-relaxed text-navy sm:p-4">
          <strong className="font-semibold text-navy">Bloc dynamic to watch:</strong>{' '}
          {blocRow.member.voting_bloc} <SourceList citations={citations(blocRow)} />
        </div>
      )}

      <div className="flex justify-start pt-4">
        <button
          type="button"
          onClick={() => downloadText('seventh-vote-brief.txt', textBrief(analysis, input))}
          className="cursor-pointer rounded-xl border border-line bg-white px-6 py-2.5 font-display text-xs font-bold tracking-wider text-navy uppercase shadow-2xs transition-colors hover:bg-paper/60 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:text-sm"
        >
          Download text brief
        </button>
      </div>
    </div>
  );
}
