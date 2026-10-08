import { SourceList } from '@/components/SourceList';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { DownloadIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
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
import { TallyPanel } from './TallyPanel';
import { ThresholdFigure } from './ThresholdFigure';

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
    <div className="space-y-8">
      <div className="space-y-4">
        <Card className="flex flex-col items-stretch justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 space-y-2">
            <small className="block text-xs font-bold tracking-[0.14em] text-gold uppercase">
              Simulation result
            </small>
            <h2 className="font-display text-xl leading-tight font-bold text-navy sm:text-2xl lg:text-[28px]">
              {input.title}
            </h2>
            <p className="text-[13px] text-muted">
              {CATEGORY_LABELS[input.category]} · {rule.label} · {input.ask}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge>Committee: {input.committee || 'Not entered'}</Badge>
              <Badge>Chair: {input.committeeChair || 'Chair not entered'}</Badge>
              <Badge>
                {voting.length} present · {notVoting} not voting
              </Badge>
            </div>
          </div>
          <ThresholdFigure analysis={analysis} />
        </Card>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <Callout title={threshold.note}>{thresholdExplanation(analysis)}</Callout>
          <Callout title={oneShot.title}>{oneShot.body}</Callout>
        </div>
      </div>

      {isConsent ? (
        <ConsentPanel objectors={analysis.consentObjectors} />
      ) : (
        <>
          <TallyPanel analysis={analysis} />
          <div className="space-y-4">
            <SectionHeading title="Who is pivotal?" note="One-member threshold test" />
            <PivotalPanel analysis={analysis} />
          </div>
        </>
      )}

      <div className="space-y-4">
        <SectionHeading
          title="Member-by-member read"
          note={
            isConsent
              ? 'Objector lens · select a row for evidence'
              : 'Select a row for reasoning and sources'
          }
        />
        <div className="space-y-2.5">
          {rows.map((row) => (
            <MemberReadCard key={row.member.id} row={row} input={input} />
          ))}
        </div>
      </div>

      <OutreachList analysis={analysis} />

      {blocRow && (
        <div className="rounded-2xl border border-line bg-white p-5 text-[13px] leading-relaxed text-ink/80 shadow-card">
          <strong className="font-semibold text-navy">Bloc dynamic to watch:</strong>{' '}
          {blocRow.member.voting_bloc} <SourceList citations={citations(blocRow)} />
        </div>
      )}

      <Button
        variant="secondary"
        onClick={() => downloadText('seventh-vote-brief.txt', textBrief(analysis, input))}
      >
        <DownloadIcon className="size-4" />
        Download text brief
      </Button>
    </div>
  );
}
