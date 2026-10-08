import { useEffect, useMemo, useRef } from 'react';
import { HeaderStat, PageHeader } from '@/components/PageHeader';
import { CheckCircleIcon } from '@/components/ui/icons';
import { STANCES } from '@/data/stances';
import { analyzeSession } from '@/lib/simulation/analyze-session';
import { findRule } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';
import { useSessionStore } from '@/stores/session-store';
import { SessionResults } from './results/SessionResults';
import { SessionForm } from './SessionForm';
import { defaultSessionValues } from './session-schema';

export function SessionPage() {
  const members = useCouncilStore((s) => s.members);
  const rules = useCouncilStore((s) => s.rules);
  const seatCount = useCouncilStore((s) => s.config.seatCount);
  const input = useSessionStore((s) => s.input);
  const runId = useSessionStore((s) => s.runId);
  const run = useSessionStore((s) => s.run);

  const analysis = useMemo(
    () =>
      input &&
      analyzeSession({ members, input, rule: findRule(rules, input.actionType), seatCount }),
    [members, rules, seatCount, input],
  );

  const resultsRef = useRef<HTMLDivElement>(null);
  const shownRunId = useRef(runId);
  useEffect(() => {
    if (runId === shownRunId.current) return;
    shownRunId.current = runId;
    resultsRef.current?.scrollIntoView();
  }, [runId]);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Council Session"
        title="Run a council session"
        description="Describe an agenda item. The engine scores each member against their sourced positions, triggers, and persuasion levers."
        aside={<HeaderStat value={STANCES.length} label="stance levels" />}
      />

      <SessionForm defaultValues={input ?? defaultSessionValues(members)} onRun={run} />

      {input && analysis && (
        <>
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border border-pine/25 bg-pine-bg px-4 py-3 text-sm font-semibold text-pine"
          >
            <CheckCircleIcon className="size-5 shrink-0" />
            Session complete — {analysis.rows.length} member reads generated below.
          </div>
          <div ref={resultsRef} key={runId} className="animate-fade-in scroll-mt-20">
            <SessionResults analysis={analysis} input={input} />
          </div>
        </>
      )}
    </section>
  );
}
