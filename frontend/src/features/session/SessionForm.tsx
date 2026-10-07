import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  CONTROL_CLASS,
  Field,
  FieldError,
  LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
} from '@/components/form';
import { RadioPillGroup } from '@/components/RadioPillGroup';
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
    <form
      className="space-y-6 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6 lg:p-8"
      noValidate
      onSubmit={(e) => void handleSubmit(onRun)(e)}
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
          <p className="mt-0.5 font-sans text-xs text-navy/60 italic">{preview}</p>
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
            rows={3}
            aria-invalid={Boolean(errors.desc)}
            aria-describedby={errors.desc ? 'agenda-desc-error' : undefined}
            className={`${CONTROL_CLASS} min-h-[90px] resize-y`}
            {...register('desc')}
          />
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

        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
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
                <fieldset className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-line bg-paper/40 p-3 font-sans text-xs sm:grid-cols-3">
                  <legend className="sr-only">Affected districts</legend>
                  {members.map((m) => (
                    <label
                      key={m.id}
                      className="flex cursor-pointer items-center gap-2 text-navy hover:text-navy/80"
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
                        className="rounded border-line text-navy focus:ring-navy"
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

        <fieldset className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <legend className={`${LABEL_CLASS} mb-1.5`}>Attendance and recusals</legend>
          <div className="space-y-4 rounded-xl border border-line bg-paper/40 p-4 sm:p-5">
            <div className="flex flex-col items-start justify-between gap-2 border-b border-line pb-3 sm:flex-row sm:items-center">
              <strong className="text-xs font-semibold text-navy sm:text-sm">
                Mark who can vote on this item
              </strong>
              <span className="rounded-md border border-line bg-white px-3 py-1 text-xs font-semibold text-navy/70 shadow-2xs">
                {count('present')} present · {count('absent')} absent · {count('recused')} recused
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white p-2.5 font-sans text-xs font-medium text-navy"
                >
                  <span title={m.name} className="truncate font-semibold text-navy">
                    {m.name}
                  </span>
                  <select
                    aria-label={`Attendance status for ${m.name}`}
                    className="shrink-0 rounded border border-line bg-paper/50 px-2 py-1 text-xs font-semibold text-navy focus:ring-1 focus:ring-navy focus:outline-none"
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
            {attendanceError && <FieldError id="attendance-error" message={attendanceError} />}
            <p className="pt-1 font-sans text-xs leading-relaxed text-navy/60 italic">
              {config.procedure.attendanceNote}
            </p>
          </div>
        </fieldset>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-line pt-5 sm:flex-row">
        <button type="submit" className={PRIMARY_BUTTON_CLASS}>
          Run session
        </button>
        <span className="text-center font-sans text-xs text-navy/60 italic sm:text-right">
          {config.snapshotNote}
        </span>
      </div>
    </form>
  );
}
