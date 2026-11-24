import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { DownloadIcon } from '@/components/ui/icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CATEGORY_LABELS } from '@/data/agenda';
import { Spinner } from '@/features/auth/AuthControls';
import { UNREVIEWED_EXPLANATION, unreviewedSummary } from '@/lib/members'; // M4/01
import { evidenceGapNote, thresholdExplanation } from '@/lib/simulation/session-summary';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import type { SessionAnalysis, SessionInput } from '@/types/simulation';
import { buildSessionReport } from '../report/session-report';
import { ConsentPanel } from './ConsentPanel';
import { MemberReadCard } from './MemberReadCard';
import { OutreachList } from './OutreachList';
import { PivotalPanel } from './PivotalPanel';
import { TallyPanel } from './TallyPanel';
import { ThresholdFigure } from './ThresholdFigure';

const NOTICE_GRID: Record<number, string> = {
  1: '',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
};

function useReportDownload(analysis: SessionAnalysis, input: SessionInput) {
  const config = useCouncilStore((s) => s.config);
  const showToast = useAppStore((s) => s.showToast);
  const [preparing, setPreparing] = useState(false);

  const download = async () => {
    setPreparing(true);
    try {
      const report = buildSessionReport(analysis, input, config, new Date());
      const { downloadSessionReport } = await import('../report/download-session-report');
      await downloadSessionReport(report);
    } catch {
      showToast('The PDF couldn’t be created. Try again.');
    } finally {
      setPreparing(false);
    }
  };
  return { preparing, download };
}

export function SessionResults({
  analysis,
  input,
}: {
  analysis: SessionAnalysis;
  input: SessionInput;
}) {
  const oneShot = useCouncilStore((s) => s.config.procedure.oneShotStakes);
  const report = useReportDownload(analysis, input);
  const { rows, rule, voting, notVoting, threshold, outcome } = analysis;
  const isConsent = outcome === 'consent';
  const unreviewed = unreviewedSummary(rows.map((r) => r.member)); // M4/01
  const notices = [
    { title: threshold.note, body: thresholdExplanation(analysis) },
    ...(oneShot ? [oneShot] : []),
    ...(unreviewed ? [{ title: unreviewed, body: UNREVIEWED_EXPLANATION }] : []),
  ];
  const gapNote = evidenceGapNote(analysis);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Card
          padded={false}
          className="flex flex-col items-stretch justify-between gap-6 p-5 sm:flex-row sm:items-center sm:p-8"
        >
          <div className="min-w-0 space-y-2.5">
            <small className="block text-[11px] font-bold tracking-[0.16em] text-gold uppercase">
              Simulation result
            </small>
            <h2 className="font-display text-xl leading-tight font-bold text-navy sm:text-2xl lg:text-[30px]">
              {input.title}
            </h2>
            <p className="text-[13px] text-muted">
              {CATEGORY_LABELS[input.category]} · {rule.label} · {input.ask}
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <Badge>Committee: {input.committee || 'Not entered'}</Badge>
              <Badge>Chair: {input.committeeChair || 'Chair not entered'}</Badge>
              <Badge>
                {voting.length} present · {notVoting} not voting
              </Badge>
            </div>
          </div>
          <ThresholdFigure analysis={analysis} />
        </Card>

        <div className={`grid grid-cols-1 gap-4 ${NOTICE_GRID[notices.length]}`}>
          {notices.map((notice) => (
            <Callout key={notice.title} title={notice.title}>
              {notice.body}
            </Callout>
          ))}
        </div>
      </div>

      {gapNote && <Callout title={gapNote.title}>{gapNote.body}</Callout>}

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
            <MemberReadCard key={row.member.id} row={row} />
          ))}
        </div>
      </div>

      <OutreachList analysis={analysis} />

      <Button
        variant="secondary"
        onClick={() => void report.download()}
        disabled={report.preparing}
        aria-busy={report.preparing}
      >
        {report.preparing ? <Spinner /> : <DownloadIcon className="size-4" />}
        {report.preparing ? 'Preparing PDF…' : 'Download PDF brief'}
      </Button>
    </div>
  );
}
