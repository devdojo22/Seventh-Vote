import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Disclaimer } from '@/components/Disclaimer';
import { CONTROL_CLASS, Field, PRIMARY_BUTTON_CLASS } from '@/components/form';
import { PageHeader } from '@/components/PageHeader';
import { CATEGORY_LABELS } from '@/data/agenda';
import type { PrepValues } from '@/lib/simulation/prep-brief';
import { useAppStore } from '@/stores/app-store';
import { useCouncilStore } from '@/stores/council-store';
import { usePrepStore } from '@/stores/prep-store';
import { useSessionStore } from '@/stores/session-store';
import { ASKS, CATEGORY_IDS } from '@/types/simulation';
import { PrepBriefCard } from './PrepBriefCard';
import { prepSchema } from './prep-schema';

export function PrepPage() {
  const members = useCouncilStore((s) => s.members);
  const values = usePrepStore((s) => s.values);
  const brief = usePrepStore((s) => s.brief);
  const build = usePrepStore((s) => s.build);
  const loadFromSession = usePrepStore((s) => s.loadFromSession);
  const showToast = useAppStore((s) => s.showToast);

  const {
    register,
    handleSubmit,
    reset,
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
    <section className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
      <PageHeader
        title="Prepare for one conversation"
        description="Turn the public record into a focused rehearsal brief — framing, objections, likely questions, and a path to the requested action."
      />

      <form
        className="space-y-6 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 lg:p-8"
        noValidate
        onSubmit={(e) => void handleSubmit(build)(e)}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          <Field id="prep-member" label="Council member" error={errors.memberId?.message}>
            <select id="prep-member" className={CONTROL_CLASS} {...register('memberId')}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.district}
                </option>
              ))}
            </select>
          </Field>

          <Field id="prep-category" label="Category">
            <select id="prep-category" className={CONTROL_CLASS} {...register('category')}>
              {CATEGORY_IDS.map((id) => (
                <option key={id} value={id}>
                  {CATEGORY_LABELS[id]}
                </option>
              ))}
            </select>
          </Field>

          <Field id="prep-ask" label="The ask">
            <select id="prep-ask" className={CONTROL_CLASS} {...register('ask')}>
              {ASKS.map((ask) => (
                <option key={ask} value={ask}>
                  {ask}
                </option>
              ))}
            </select>
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
              rows={3}
              aria-invalid={Boolean(errors.pitch)}
              aria-describedby={errors.pitch ? 'prep-item-error' : undefined}
              className={`${CONTROL_CLASS} min-h-[90px] resize-y`}
              {...register('pitch')}
            />
          </Field>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-line pt-4 sm:flex-row">
          <button type="submit" className={PRIMARY_BUTTON_CLASS}>
            Build rehearsal brief
          </button>
          <button
            type="button"
            onClick={loadSessionItem}
            className="w-full cursor-pointer rounded-xl border border-line bg-paper px-6 py-3 font-display text-sm font-semibold tracking-wider text-navy uppercase shadow-2xs transition-colors hover:bg-paper/80 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:w-auto"
          >
            Use current session item
          </button>
        </div>
      </form>

      {brief && (
        <div ref={briefRef}>
          <PrepBriefCard brief={brief} />
        </div>
      )}

      <Disclaimer />
    </section>
  );
}
