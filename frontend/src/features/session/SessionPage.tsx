import { useEffect, useMemo, useRef } from 'react';
import { HeaderStat, PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { CheckCircleIcon } from '@/components/ui/icons';
import { Loader } from '@/components/ui/Loader';
import { STANCES } from '@/data/stances';
import { LoadError } from '@/features/dossiers/DossierStates';
import { analyzeSession } from '@/lib/simulation/analyze-session';
import { buildRows } from '@/lib/simulation/member-rows';
import { ruleOrOrdinary } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';
import { useSessionStore } from '@/stores/session-store';
import { SessionResults } from './results/SessionResults';
import { SessionForm } from './SessionForm';
import { defaultSessionValues } from './session-schema';

const ERROR_TITLE = 'Couldn’t run the council session';

export function SessionPage() {
  const members = useCouncilStore((s) => s.members);
  const rules = useCouncilStore((s) => s.rules);
  const sessionDefaults = useCouncilStore((s) => s.sessionDefaults);
  const input = useSessionStore((s) => s.input);
  const result = useSessionStore((s) => s.result);
  const completedRuns = useSessionStore((s) => s.completedRuns);
  const status = useSessionStore((s) => s.status);
  const run = useSessionStore((s) => s.run);
  const retry = useSessionStore((s) => s.retry);
  const cancel = useSessionStore((s) => s.cancel);
  const loading = status.state === 'loading';

  const formValues = useMemo(
    () => input && { ...input, actionType: ruleOrOrdinary(rules, input.actionType).id },
    [input, rules],
  );
  const session = useMemo(() => {
    if (!result) return null;
    const { rule, seatCount, procedure } = result;
    const resultInput = { ...result.input, actionType: rule.id };
    const analysis = analyzeSession({
      rows: buildRows(result.members, resultInput.attendance, result.answers),
      input: resultInput,
      rule,
      seatCount,
      procedure,
    });
    return { input: resultInput, analysis };
  }, [result]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const shownRuns = useRef(completedRuns);
  useEffect(() => {
    if (completedRuns === shownRuns.current) return;
    shownRuns.current = completedRuns;
    resultsRef.current?.scrollIntoView();
  }, [completedRuns]);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Council Session"
        title="Run a council session"
        description="Describe an agenda item. Each present member’s read is simulated by AI from the evidence in their dossier, then counted against the voting threshold."
        aside={<HeaderStat value={STANCES.length} label="stance levels" />}
      />

      <SessionForm
        defaultValues={formValues ?? defaultSessionValues(members, sessionDefaults)}
        onRun={(values) => void run(values)}
        busy={loading}
      />

      {status.state === 'loading' && (
        <div className="space-y-3">
          <Loader
            label={`Simulating ${String(status.memberCount)} ${status.memberCount === 1 ? 'member' : 'members'}…`}
            rows={3}
          />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {status.state === 'error' &&
        (status.retryable ? (
          <LoadError title={ERROR_TITLE} message={status.message} onRetry={() => void retry()} />
        ) : (
          <Callout title={ERROR_TITLE}>
            <span role="alert">{status.message}</span>
          </Callout>
        ))}

      {session && !loading && (
        <>
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border border-pine/25 bg-pine-bg px-4 py-3 text-sm font-semibold text-pine"
          >
            <CheckCircleIcon className="size-5 shrink-0" />
            Session complete — {session.analysis.voting.length} member reads generated below.
          </div>
          <div ref={resultsRef} key={completedRuns} className="animate-fade-in scroll-mt-20">
            <SessionResults analysis={session.analysis} input={session.input} />
          </div>
        </>
      )}
    </section>
  );
}
