import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CONTROL_CLASS, Field, FieldError } from '@/components/ui/Field';
import { RadioPillGroup } from '@/components/ui/RadioPillGroup';
import { CATEGORY_LABELS } from '@/data/agenda';
import {
  ATTENDANCE_OPTIONS,
  FISCAL_OPTIONS,
  IMPACT_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/data/form-options';
import { findRule, thresholdFor, thresholdPreviewLine } from '@/lib/simulation/thresholds';
import { useCouncilStore } from '@/stores/council-store';
import { ASKS, CATEGORY_IDS, type SessionInput } from '@/types/simulation';
import { sessionSchema } from './session-schema';

function FormSection({
  step,
  title,
  aside,
  children,
}: {
  step: number;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 border-t border-line2 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-5 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2.5 font-display text-base font-bold text-navy">
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-full bg-navy text-[11px] text-gold2"
          >
            {step}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

interface SessionFormProps {
  defaultValues: SessionInput;
  onRun: (input: SessionInput) => void;
}

export function SessionForm({ defaultValues, onRun }: SessionFormProps) {
  const members = useCouncilStore((s) => s.members);
  const rules = useCouncilStore((s) => s.rules);
  const config = useCouncilStore((s) => s.config);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SessionInput>({ resolver: zodResolver(sessionSchema), defaultValues });

  const actionType = useWatch({ control, name: 'actionType' });
  const impact = useWatch({ control, name: 'impact' });
  const attendance = useWatch({ control, name: 'attendance' });

  const statuses = Object.values(attendance);
  const count = (status: string) => statuses.filter((s) => s === status).length;
  const preview = thresholdPreviewLine(
    thresholdFor(findRule(rules, actionType), count('present'), config.seatCount),
  );
  const attendanceMessage = errors.attendance?.root?.message ?? errors.attendance?.message;
  const attendanceError = typeof attendanceMessage === 'string' ? attendanceMessage : undefined;

  return (
    <Card padded={false}>
      <form noValidate onSubmit={(e) => void handleSubmit(onRun)(e)}>
        <div className="space-y-6 p-5 sm:p-7">
          <FormSection step={1} title="Agenda item">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="agenda-title"
                label="Agenda item"
                required
                error={errors.title?.message}
                className="sm:col-span-2"
              >
                <input
                  id="agenda-title"
                  required
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={errors.title ? 'agenda-title-error' : undefined}
                  className={CONTROL_CLASS}
                  {...register('title')}
                />
              </Field>

              <Field id="category" label="Category">
                <select id="category" className={CONTROL_CLASS} {...register('category')}>
                  {CATEGORY_IDS.map((id) => (
                    <option key={id} value={id}>
                      {CATEGORY_LABELS[id]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="agenda-desc"
                label="Description"
                required
                error={errors.desc?.message}
                className="sm:col-span-2 lg:col-span-3"
              >
                <textarea
                  id="agenda-desc"
                  required
                  rows={4}
                  aria-invalid={Boolean(errors.desc)}
                  aria-describedby={errors.desc ? 'agenda-desc-error' : undefined}
                  className={`${CONTROL_CLASS} min-h-[110px] resize-y leading-relaxed`}
                  {...register('desc')}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection step={2} title="Procedure and context">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                id="action-type"
                label="Item type / procedural action"
                className="sm:col-span-2 lg:col-span-1"
              >
                <select id="action-type" className={CONTROL_CLASS} {...register('actionType')}>
                  {rules.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="rounded-lg bg-steel-bg px-2.5 py-1.5 text-xs font-medium text-steel">
                  {preview}
                </p>
              </Field>

              <Field
                id="committee"
                label="Committee referral"
                hint={config.procedure.committeeReferralHint}
              >
                <input
                  id="committee"
                  placeholder="Enter the public committee referral"
                  aria-describedby="committee-hint"
                  className={CONTROL_CLASS}
                  {...register('committee')}
                />
              </Field>

              <Field
                id="committee-chair"
                label="Committee chair"
                hint={config.procedure.committeeChairHint}
              >
                <input
                  id="committee-chair"
                  placeholder="Enter the chair named on the item"
                  aria-describedby="committee-chair-hint"
                  className={CONTROL_CLASS}
                  {...register('committeeChair')}
                />
              </Field>

              <Field id="fiscal" label="Fiscal impact">
                <select id="fiscal" className={CONTROL_CLASS} {...register('fiscal')}>
                  {FISCAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="ask" label="The ask">
                <select id="ask" className={CONTROL_CLASS} {...register('ask')}>
                  {ASKS.map((ask) => (
                    <option key={ask} value={ask}>
                      {ask}
                    </option>
                  ))}
                </select>
              </Field>

              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <RadioPillGroup
                    legend="Mayor’s priority?"
                    name="priority"
                    options={PRIORITY_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
                <Controller
                  control={control}
                  name="impact"
                  render={({ field }) => (
                    <RadioPillGroup
                      legend="District impact"
                      name="impact"
                      options={IMPACT_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {impact === 'specific' && (
                  <Controller
                    control={control}
                    name="districts"
                    render={({ field }) => (
                      <fieldset className="grid animate-fade-in grid-cols-2 gap-2 rounded-xl border border-line bg-paper/60 p-3 sm:grid-cols-3 lg:grid-cols-5">
                        <legend className="sr-only">Affected districts</legend>
                        {members.map((m) => (
                          <label
                            key={m.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-navy transition-colors hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(m.district)}
                              onChange={() =>
                                field.onChange(
                                  field.value.includes(m.district)
                                    ? field.value.filter((d) => d !== m.district)
                                    : [...field.value, m.district],
                                )
                              }
                              className="size-4 shrink-0 cursor-pointer accent-navy"
                            />
                            <span className="truncate">
                              {m.district.replace('Super District', 'Super')}
                            </span>
                          </label>
                        ))}
                      </fieldset>
                    )}
                  />
                )}
              </div>
            </div>
          </FormSection>

          <FormSection
            step={3}
            title="Attendance and recusals"
            aside={
              <span className="flex flex-wrap gap-1.5 text-xs font-semibold">
                <span className="rounded-full bg-pine-bg px-2.5 py-1 text-pine">
                  {count('present')} present
                </span>
                <span className="rounded-full bg-paper px-2.5 py-1 text-muted">
                  {count('absent')} absent
                </span>
                <span className="rounded-full bg-amber-bg px-2.5 py-1 text-amber">
                  {count('recused')} recused
                </span>
              </span>
            }
          >
            <fieldset className="min-w-0">
              <legend className="mb-3 text-[13px] font-medium text-muted">
                Mark who can vote on this item
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white py-2 pr-2 pl-3.5 text-[13px] transition-colors hover:border-navy/20"
                  >
                    <span title={m.name} className="truncate font-semibold text-navy">
                      {m.name}
                    </span>
                    <select
                      aria-label={`Attendance status for ${m.name}`}
                      className="shrink-0 cursor-pointer rounded-lg border border-line bg-paper px-2 py-1 text-xs font-semibold text-navy focus:ring-2 focus:ring-navy/15 focus:outline-none"
                      {...register(`attendance.${m.id}`)}
                    >
                      {ATTENDANCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {attendanceError && (
                <div className="mt-3">
                  <FieldError id="attendance-error" message={attendanceError} />
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted">
                {config.procedure.attendanceNote}
              </p>
            </fieldset>
          </FormSection>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 rounded-b-2xl border-t border-line bg-paper/60 px-5 py-4 sm:flex-row sm:px-7">
          <span className="text-center text-xs text-muted sm:text-left">{config.snapshotNote}</span>
          <Button type="submit" className="shrink-0">
            Run session
          </Button>
        </div>
      </form>
    </Card>
  );
}
