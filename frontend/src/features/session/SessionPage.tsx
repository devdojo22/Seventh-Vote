import { useEffect, useMemo, useRef } from 'react';
import { Disclaimer } from '@/components/Disclaimer';
import { PageHeader } from '@/components/PageHeader';
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
    <section className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <PageHeader
        title="Run a council session"
        description="Describe an agenda item. The engine scores each member against their sourced positions, triggers, and persuasion levers."
        aside={
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-line bg-navy/5 px-4 py-2.5 sm:self-center">
            <strong className="font-display text-2xl font-bold text-navy">{STANCES.length}</strong>
            <span className="text-xs font-semibold tracking-wider text-navy/70 uppercase">
              stance levels
            </span>
          </div>
        }
      />

      <SessionForm defaultValues={input ?? defaultSessionValues(members)} onRun={run} />

      {input && analysis && (
        <>
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl border border-pine/30 bg-pine-bg p-4 font-sans text-sm font-semibold text-pine shadow-2xs"
          >
            Session complete — {analysis.rows.length} member reads generated below.
          </div>
          <div ref={resultsRef} key={runId} className="space-y-6">
            <SessionResults analysis={analysis} input={input} />
          </div>
        </>
      )}

      <Disclaimer />
    </section>
  );
}
