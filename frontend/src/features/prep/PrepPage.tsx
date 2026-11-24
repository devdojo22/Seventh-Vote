import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { Loader } from '@/components/ui/Loader';
import { Select } from '@/components/ui/Select';
import { ASK_OPTIONS, CATEGORY_OPTIONS } from '@/data/form-options';
import { LoadError } from '@/features/dossiers/DossierStates';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import { usePrepStore } from '@/stores/prep-store';
import { useSessionStore } from '@/stores/session-store';
import { PrepBriefCard } from './PrepBriefCard';
import type { PrepValues } from './prep-brief';
import { prepSchema } from './prep-schema';

const ERROR_TITLE = 'Couldn’t build the rehearsal brief';

export function PrepPage() {
  const members = useCouncilStore((s) => s.members);
  const values = usePrepStore((s) => s.values);
  const brief = usePrepStore((s) => s.brief);
  const status = usePrepStore((s) => s.status);
  const build = usePrepStore((s) => s.build);
  const retry = usePrepStore((s) => s.retry);
  const cancel = usePrepStore((s) => s.cancel);
  const loadFromSession = usePrepStore((s) => s.loadFromSession);
  const showToast = useAppStore((s) => s.showToast);
  const loading = status.state === 'loading';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<PrepValues>({ resolver: zodResolver(prepSchema), defaultValues: values });

  const briefRef = useRef<HTMLDivElement>(null);
  const shownBrief = useRef(brief);
  useEffect(() => {
    if (brief === shownBrief.current) return;
    shownBrief.current = brief;
    briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [brief]);

  const loadSessionItem = () => {
    const session = useSessionStore.getState().input;
    if (!session) {
      showToast('Run a council session first');
      return;
    }
    loadFromSession(session);
    reset(usePrepStore.getState().values);
    showToast('Current session item loaded');
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="1-on-1 Prep"
        title="Prepare for one conversation"
        description="Turn the public record into a focused rehearsal brief — framing, objections, likely questions, and a path to the requested action."
      />

      <Card padded={false}>
        <form noValidate onSubmit={(e) => void handleSubmit(build)(e)}>
          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3 sm:p-7">
            <Field id="prep-member" label="Council member" error={errors.memberId?.message}>
              <Controller
                control={control}
                name="memberId"
                render={({ field }) => (
                  <Select
                    id="prep-member"
                    options={members.map((m) => ({
                      value: m.id,
                      label: `${m.name} — ${m.district}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    buttonRef={field.ref}
                    aria-invalid={Boolean(errors.memberId)}
                    aria-describedby={errors.memberId ? 'prep-member-error' : undefined}
                  />
                )}
              />
            </Field>

            <Field id="prep-category" label="Category">
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    id="prep-category"
                    options={CATEGORY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    buttonRef={field.ref}
                  />
                )}
              />
            </Field>

            <Field id="prep-ask" label="The ask">
              <Controller
                control={control}
                name="ask"
                render={({ field }) => (
                  <Select
                    id="prep-ask"
                    options={ASK_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    buttonRef={field.ref}
                  />
                )}
              />
            </Field>

            <Field
              id="prep-item"
              label="Your pitch"
              required
              error={errors.pitch?.message}
              className="sm:col-span-3"
            >
              <textarea
                id="prep-item"
                required
                rows={4}
                aria-invalid={Boolean(errors.pitch)}
                aria-describedby={errors.pitch ? 'prep-item-error' : undefined}
                className={`${CONTROL_CLASS} min-h-[110px] resize-y leading-relaxed`}
                {...register('pitch')}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-b-2xl border-t border-line bg-paper/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
            <Button variant="secondary" onClick={loadSessionItem}>
              Use current session item
            </Button>
            <Button type="submit" disabled={loading} aria-busy={loading}>
              {loading ? 'Building brief…' : 'Build rehearsal brief'}
            </Button>
          </div>
        </form>
      </Card>

      {status.state === 'loading' && (
        <div className="space-y-3">
          <Loader label={`Simulating ${status.memberName}…`} rows={2} />
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

      {brief && !loading && (
        <div ref={briefRef} className="animate-fade-in scroll-mt-20">
          <PrepBriefCard brief={brief} />
        </div>
      )}
    </section>
  );
}
