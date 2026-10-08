import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
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
            <Button type="submit">Build rehearsal brief</Button>
          </div>
        </form>
      </Card>

      {brief && (
        <div ref={briefRef} className="animate-fade-in scroll-mt-20">
          <PrepBriefCard brief={brief} />
        </div>
      )}
    </section>
  );
}
