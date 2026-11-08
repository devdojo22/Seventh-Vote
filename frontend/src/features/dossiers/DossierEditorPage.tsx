import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  type UseFormRegisterReturn,
} from 'react-hook-form';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { CloseIcon, LockIcon, PlusIcon } from '@/components/ui/icons';
import { CATEGORY_LABELS } from '@/data/agenda';
import {
  DATE_PRECISION_LABELS,
  RECORD_OUTCOME_LABELS,
  RECORD_TYPE_LABELS,
  STANCE_LABEL_LABELS,
} from '@/data/dossier-options';
import { useAppStore } from '@/stores/app-store';
import {
  DATE_PRECISIONS,
  DOSSIER_LIMITS,
  RECORD_OUTCOMES,
  RECORD_TYPES,
  STANCE_LABELS,
} from '@/types/dossier';
import {
  createDossier,
  dossierHref,
  getDossier,
  saveDossier,
  type DossierDetail,
} from './dossier-api';
import { UnsavedChangesDialog } from './DossierDialogs';
import {
  currentVersionFromConflict,
  describeDossierError,
  serverValidationIssues,
} from './dossier-errors';
import { issueLabel } from './dossier-format';
import {
  CHANGE_NOTE_MAX,
  dossierFormSchema,
  fromFormValues,
  sameContent,
  toFormField,
  toFormValues,
  type DossierFormValues,
} from './dossier-form';
import { BackLink, DossierNotAvailable, LoadError, LoadingText } from './DossierStates';
import { SECONDARY_LINK_CLASS, SMALL_BUTTON_CLASS } from './link-classes';
import { useDossierAccess } from './use-dossier-access';
import { useLoad } from './use-load';

type Errors = FieldErrors<DossierFormValues>;

interface FormError {
  message: ReactNode;
  field: FieldPath<DossierFormValues> | null;
}

const REMOVE_BUTTON_CLASS =
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-brick-bg hover:text-brick focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

function FormSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  return (
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  );
}

function TextField({
  id,
  label,
  registration,
  error,
  hint,
  required,
  rows,
  type = 'text',
  placeholder,
  className,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  hint?: string;
  required?: boolean;
  rows?: number;
  type?: 'text' | 'date';
  placeholder?: string;
  className?: string;
}) {
  const props = {
    id,
    className: CONTROL_CLASS,
    placeholder,
    'aria-invalid': Boolean(error),
    'aria-describedby': describedBy(id, hint, error),
    ...registration,
  };
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {rows ? <textarea rows={rows} {...props} /> : <input type={type} {...props} />}
    </Field>
  );
}

function SelectField({
  id,
  label,
  registration,
  options,
  error,
  required,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <Field id={id} label={label} error={error} required={required}>
      <select
        id={id}
        className={`${CONTROL_CLASS} cursor-pointer`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, undefined, error)}
        {...registration}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

const options = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

function AddButton({
  label,
  onClick,
  count,
  max,
}: {
  label: string;
  onClick: () => void;
  count: number;
  max: number;
}) {
  const full = count >= max;
  return (
    <button
      type="button"
      className={`${SMALL_BUTTON_CLASS} self-start`}
      onClick={onClick}
      disabled={full}
      title={full ? `Up to ${String(max)} entries` : undefined}
    >
      <PlusIcon className="size-3.5" />
      {label}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={REMOVE_BUTTON_CLASS} aria-label={label} onClick={onClick}>
      <CloseIcon className="size-4" />
    </button>
  );
}

function Row({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <li className="grid gap-3 rounded-xl border border-line bg-paper/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-[11px] font-bold tracking-wide text-muted uppercase">
          {title}
        </strong>
        <RemoveButton label={`Remove ${title.toLowerCase()}`} onClick={onRemove} />
      </div>
      {children}
    </li>
  );
}

function SourceFields({
  id,
  name,
  url,
  errors,
}: {
  id: string;
  name: UseFormRegisterReturn;
  url: UseFormRegisterReturn;
  errors: { name?: string; url?: string };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField
        id={`${id}-source-name`}
        label="Source name"
        registration={name}
        error={errors.name}
        placeholder="e.g. The Commercial Appeal"
      />
      <TextField
        id={`${id}-source-url`}
        label="Source link"
        registration={url}
        error={errors.url}
        placeholder="https://"
      />
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="text-xs text-muted">{children}</p>;
}

type BulletListName = 'oppositionTriggers' | 'persuasionLevers';

function BulletEditor({
  name,
  label,
  itemLabel,
  control,
  register,
  errors,
}: {
  name: BulletListName;
  label: string;
  itemLabel: string;
  control: Control<DossierFormValues>;
  register: UseFormRegister<DossierFormValues>;
  errors: Errors;
}) {
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-navy">{label}</legend>
      {fields.length === 0 && <Empty>None recorded.</Empty>}
      <ul className="grid gap-3">
        {fields.map((field, index) => {
          const id = `${name}-${String(index)}`;
          const error = errors[name]?.[index]?.text?.message;
          return (
            <li key={field.id} className="grid gap-1.5">
              <div className="flex items-start gap-2">
                <label htmlFor={id} className="sr-only">
                  {`${itemLabel} ${String(index + 1)}`}
                </label>
                <input
                  id={id}
                  className={CONTROL_CLASS}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                  {...register(`${name}.${index}.text`)}
                />
                <RemoveButton
                  label={`Remove ${itemLabel.toLowerCase()} ${String(index + 1)}`}
                  onClick={() => remove(index)}
                />
              </div>
              {error && (
                <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-brick">
                  {error}
                </p>
              )}
              <Checkbox
                label="Inferred, not stated in a source"
                className="text-xs"
                {...register(`${name}.${index}.inferred`)}
              />
            </li>
          );
        })}
      </ul>
      <AddButton
        label={`Add ${itemLabel.toLowerCase()}`}
        onClick={() => append({ text: '', inferred: false })}
        count={fields.length}
        max={DOSSIER_LIMITS.list}
      />
    </fieldset>
  );
}

function DossierForm({ dossier }: { dossier: DossierDetail | null }) {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [defaults] = useState(() => toFormValues(dossier?.currentVersion ?? null));
  const errorBanner = useRef<HTMLDivElement>(null);
  const saved = useRef(false);
  // The version this edit started from; the server refuses the save if someone saved after it.
  const baseVersionNo = dossier?.currentVersion.versionNo ?? 0;

  const {
    control,
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<DossierFormValues>({
    resolver: zodResolver(dossierFormSchema),
    defaultValues: defaults,
  });
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !saved.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (formError?.field) setFocus(formError.field);
    else if (formError) errorBanner.current?.scrollIntoView({ block: 'center' });
  }, [formError, setFocus]);

  const committees = useFieldArray({ control, name: 'committees' });
  const positions = useFieldArray({ control, name: 'issuePositions' });
  const records = useFieldArray({ control, name: 'keyRecords' });
  const quotes = useFieldArray({ control, name: 'quotes' });
  const gaps = useFieldArray({ control, name: 'dataGaps' });

  const topicOptions = [
    { value: '', label: 'Choose an issue' },
    ...[
      ...Object.keys(CATEGORY_LABELS),
      ...defaults.issuePositions.map((p) => p.topic).filter((t) => !(t in CATEGORY_LABELS)),
    ].map((topic) => ({ value: topic, label: issueLabel(topic) })),
  ];
  const stanceOptions = [
    { value: '', label: 'Not set' },
    ...options(STANCE_LABELS, STANCE_LABEL_LABELS),
  ];

  const onValid = async (values: DossierFormValues) => {
    setFormError(null);
    const content = fromFormValues(values);
    try {
      if (!dossier) {
        const created = await createDossier(content, values.changeNote);
        saved.current = true;
        showToast('Dossier created as version 1');
        await navigate(dossierHref(created));
        return;
      }
      if (sameContent(content, fromFormValues(toFormValues(dossier.currentVersion)))) {
        setFormError({
          message: 'Nothing has changed yet, so there is no new version to save.',
          field: null,
        });
        return;
      }
      const updated = await saveDossier(dossier.id, baseVersionNo, content, values.changeNote);
      saved.current = true;
      showToast(`Saved as version ${String(updated.currentVersion.versionNo)}`);
      await navigate(dossierHref(dossier));
    } catch (error) {
      const newer = currentVersionFromConflict(error);
      const fields = serverValidationIssues(error).flatMap(({ path, message }) => {
        const field = toFormField(path);
        return field ? [{ field, message }] : [];
      });
      fields.forEach(({ field, message }) => setError(field, { type: 'server', message }));
      setFormError({
        field: fields[0]?.field ?? null,
        message:
          newer !== null && dossier ? (
            <>
              Someone saved version {newer} while you were editing, so this edit wasn’t saved. Your
              changes are still in the form.{' '}
              <Link
                to={`${dossierHref(dossier)}?tab=versions`}
                target="_blank"
                className="font-semibold underline"
              >
                Open the latest version
              </Link>{' '}
              in a new tab, then reload this page and apply your changes again.
            </>
          ) : (
            describeDossierError(error)
          ),
      });
    }
  };

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(e) => void handleSubmit(onValid, () => setFormError(null))(e)}
    >
      {formError && (
        <div ref={errorBanner}>
          <Callout title="Not saved">
            <span role="alert">{formError.message}</span>
          </Callout>
        </div>
      )}
      <Callout title="Shared with everyone in this workspace">
        <span className="flex items-start gap-2">
          <LockIcon className="mt-0.5 size-3.5 shrink-0 text-gold" />
          <span>
            Dossiers hold the public record only. Keep your own calls and private notes out of them:
            those stay in your session and are never saved.
          </span>
        </span>
      </Callout>

      <FormSection
        title="Identity"
        description="Changes here are versioned with the rest of the dossier."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name"
            label="Name"
            required
            registration={register('name')}
            error={errors.name?.message}
          />
          <TextField
            id="initials"
            label="Initials"
            registration={register('initials')}
            error={errors.initials?.message}
            hint="Leave blank to use the name’s initials."
          />
          <TextField
            id="district"
            label="District or seat"
            registration={register('district')}
            error={errors.district?.message}
            placeholder="e.g. District 1"
          />
          <TextField
            id="tookOffice"
            label="Took office"
            registration={register('tookOffice')}
            error={errors.tookOffice?.message}
            placeholder="e.g. 2019"
          />
          <TextField
            id="leadershipRole"
            label="Leadership role"
            registration={register('leadershipRole')}
            error={errors.leadershipRole?.message}
            placeholder="e.g. Vice Chair, or None"
            className="sm:col-span-2"
          />
        </div>
      </FormSection>

      <FormSection title="Profile">
        <TextField
          id="profile"
          label="Biography"
          rows={5}
          registration={register('profile')}
          error={errors.profile?.message}
        />
        <TextField
          id="politicalArchetype"
          label="Political archetype"
          registration={register('politicalArchetype')}
          error={errors.politicalArchetype?.message}
          placeholder="e.g. Pragmatic dealmaker"
        />
        <TextField
          id="politicalStyle"
          label="Political style"
          rows={2}
          registration={register('politicalStyle')}
          error={errors.politicalStyle?.message}
        />
      </FormSection>

      <FormSection
        title="Committees & leadership"
        action={
          <AddButton
            label="Add committee"
            onClick={() => committees.append({ committee: '', role: '', year: '' })}
            count={committees.fields.length}
            max={DOSSIER_LIMITS.list}
          />
        }
      >
        {committees.fields.length === 0 && <Empty>No committee assignments recorded.</Empty>}
        <ul className="grid gap-3">
          {committees.fields.map((field, index) => (
            <Row
              key={field.id}
              title={`Committee ${String(index + 1)}`}
              onRemove={() => committees.remove(index)}
            >
              <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1fr)]">
                <TextField
                  id={`committee-${String(index)}`}
                  label="Committee"
                  required
                  registration={register(`committees.${index}.committee`)}
                  error={errors.committees?.[index]?.committee?.message}
                />
                <TextField
                  id={`committee-role-${String(index)}`}
                  label="Role"
                  registration={register(`committees.${index}.role`)}
                  error={errors.committees?.[index]?.role?.message}
                  placeholder="e.g. Chair"
                />
                <TextField
                  id={`committee-year-${String(index)}`}
                  label="Year"
                  registration={register(`committees.${index}.year`)}
                  error={errors.committees?.[index]?.year?.message}
                  placeholder="e.g. 2026"
                />
              </div>
            </Row>
          ))}
        </ul>
      </FormSection>

      <FormSection
        title="Issue positions"
        description="One stance per issue, with the evidence and the source it comes from."
        action={
          <AddButton
            label="Add issue position"
            count={positions.fields.length}
            max={DOSSIER_LIMITS.list}
            onClick={() =>
              positions.append({
                topic: '',
                stance: '',
                stanceLabel: '',
                evidence: '',
                sourceName: '',
                sourceUrl: '',
              })
            }
          />
        }
      >
        {positions.fields.length === 0 && <Empty>No issue positions recorded.</Empty>}
        <ul className="grid gap-3">
          {positions.fields.map((field, index) => {
            const id = `position-${String(index)}`;
            const e = errors.issuePositions?.[index];
            return (
              <Row
                key={field.id}
                title={`Issue position ${String(index + 1)}`}
                onRemove={() => positions.remove(index)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    id={`${id}-topic`}
                    label="Issue"
                    required
                    options={topicOptions}
                    registration={register(`issuePositions.${index}.topic`)}
                    error={e?.topic?.message}
                  />
                  <SelectField
                    id={`${id}-label`}
                    label="Stance label"
                    options={stanceOptions}
                    registration={register(`issuePositions.${index}.stanceLabel`)}
                  />
                </div>
                <TextField
                  id={`${id}-stance`}
                  label="Stance"
                  rows={2}
                  registration={register(`issuePositions.${index}.stance`)}
                  error={e?.stance?.message}
                />
                <TextField
                  id={`${id}-evidence`}
                  label="Evidence"
                  rows={2}
                  registration={register(`issuePositions.${index}.evidence`)}
                  error={e?.evidence?.message}
                  hint="What the source shows, in a sentence or two."
                />
                <SourceFields
                  id={id}
                  name={register(`issuePositions.${index}.sourceName`)}
                  url={register(`issuePositions.${index}.sourceUrl`)}
                  errors={{ name: e?.sourceName?.message, url: e?.sourceUrl?.message }}
                />
              </Row>
            );
          })}
        </ul>
      </FormSection>

      <FormSection
        title="Key record"
        description="Votes, statements, sponsorships and other public acts, each with its source."
        action={
          <AddButton
            label="Add record"
            count={records.fields.length}
            max={DOSSIER_LIMITS.keyRecords}
            onClick={() =>
              records.append({
                title: '',
                type: 'vote',
                outcome: 'none',
                description: '',
                date: '',
                datePrecision: 'unknown',
                dateText: '',
                sourceName: '',
                sourceUrl: '',
              })
            }
          />
        }
      >
        {records.fields.length === 0 && <Empty>No key record entries.</Empty>}
        <ul className="grid gap-3">
          {records.fields.map((field, index) => {
            const id = `record-${String(index)}`;
            const e = errors.keyRecords?.[index];
            return (
              <Row
                key={field.id}
                title={`Record ${String(index + 1)}`}
                onRemove={() => records.remove(index)}
              >
                <TextField
                  id={`${id}-title`}
                  label="Title"
                  required
                  rows={2}
                  registration={register(`keyRecords.${index}.title`)}
                  error={e?.title?.message}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    id={`${id}-type`}
                    label="Type"
                    options={options(RECORD_TYPES, RECORD_TYPE_LABELS)}
                    registration={register(`keyRecords.${index}.type`)}
                  />
                  <SelectField
                    id={`${id}-outcome`}
                    label="Outcome"
                    options={options(RECORD_OUTCOMES, RECORD_OUTCOME_LABELS)}
                    registration={register(`keyRecords.${index}.outcome`)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField
                    id={`${id}-date`}
                    label="Date"
                    type="date"
                    registration={register(`keyRecords.${index}.date`)}
                    error={e?.date?.message}
                  />
                  <SelectField
                    id={`${id}-precision`}
                    label="Date precision"
                    options={options(DATE_PRECISIONS, DATE_PRECISION_LABELS)}
                    registration={register(`keyRecords.${index}.datePrecision`)}
                  />
                  <TextField
                    id={`${id}-date-text`}
                    label="Date as written"
                    registration={register(`keyRecords.${index}.dateText`)}
                    error={e?.dateText?.message}
                    placeholder="e.g. Spring 2025"
                  />
                </div>
                <TextField
                  id={`${id}-description`}
                  label="Description"
                  rows={2}
                  registration={register(`keyRecords.${index}.description`)}
                  error={e?.description?.message}
                />
                <SourceFields
                  id={id}
                  name={register(`keyRecords.${index}.sourceName`)}
                  url={register(`keyRecords.${index}.sourceUrl`)}
                  errors={{ name: e?.sourceName?.message, url: e?.sourceUrl?.message }}
                />
              </Row>
            );
          })}
        </ul>
      </FormSection>

      <FormSection
        title="Voice evidence"
        description="How the member speaks, and direct quotes from the public record."
        action={
          <AddButton
            label="Add quote"
            count={quotes.fields.length}
            max={DOSSIER_LIMITS.quotes}
            onClick={() =>
              quotes.append({
                text: '',
                context: '',
                verbatim: true,
                sourceName: '',
                sourceUrl: '',
              })
            }
          />
        }
      >
        <TextField
          id="voiceDescription"
          label="Speaking style"
          rows={2}
          registration={register('voiceDescription')}
          error={errors.voiceDescription?.message}
        />
        <div className="grid gap-3 rounded-xl border border-line p-4">
          <strong className="text-[11px] font-bold tracking-wide text-muted uppercase">
            Example
          </strong>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              id="voice-example-quote"
              label="Example quote"
              rows={2}
              registration={register('voiceExample.quote')}
              error={errors.voiceExample?.quote?.message}
            />
            <TextField
              id="voice-example-context"
              label="Context"
              rows={2}
              registration={register('voiceExample.context')}
              error={errors.voiceExample?.context?.message}
            />
          </div>
          <SourceFields
            id="voice-example"
            name={register('voiceExample.sourceName')}
            url={register('voiceExample.sourceUrl')}
            errors={{
              name: errors.voiceExample?.sourceName?.message,
              url: errors.voiceExample?.sourceUrl?.message,
            }}
          />
        </div>
        <ul className="grid gap-3">
          {quotes.fields.map((field, index) => {
            const id = `quote-${String(index)}`;
            const e = errors.quotes?.[index];
            return (
              <Row
                key={field.id}
                title={`Quote ${String(index + 1)}`}
                onRemove={() => quotes.remove(index)}
              >
                <TextField
                  id={`${id}-text`}
                  label="Quote"
                  required
                  rows={2}
                  registration={register(`quotes.${index}.text`)}
                  error={e?.text?.message}
                />
                <TextField
                  id={`${id}-context`}
                  label="Context"
                  registration={register(`quotes.${index}.context`)}
                  error={e?.context?.message}
                  placeholder="e.g. Budget hearing, May 2026"
                />
                <Checkbox label="Verbatim quote" {...register(`quotes.${index}.verbatim`)} />
                <SourceFields
                  id={id}
                  name={register(`quotes.${index}.sourceName`)}
                  url={register(`quotes.${index}.sourceUrl`)}
                  errors={{ name: e?.sourceName?.message, url: e?.sourceUrl?.message }}
                />
              </Row>
            );
          })}
        </ul>
      </FormSection>

      <FormSection title="Decision pattern">
        <TextField
          id="votingBloc"
          label="Voting bloc"
          registration={register('votingBloc')}
          error={errors.votingBloc?.message}
        />
        <div className="grid gap-5 lg:grid-cols-2">
          <BulletEditor
            name="oppositionTriggers"
            label="Opposition triggers"
            itemLabel="Trigger"
            control={control}
            register={register}
            errors={errors}
          />
          <BulletEditor
            name="persuasionLevers"
            label="Persuasion levers"
            itemLabel="Lever"
            control={control}
            register={register}
            errors={errors}
          />
        </div>
      </FormSection>

      <FormSection title="Mayor alignment">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="mayor-relationship"
            label="Relationship"
            registration={register('mayorAlignment.relationship')}
            error={errors.mayorAlignment?.relationship?.message}
            placeholder="e.g. Cooperative, Independent, Skeptical"
          />
          <TextField
            id="mayor-example"
            label="Example"
            rows={2}
            registration={register('mayorAlignment.example')}
            error={errors.mayorAlignment?.example?.message}
          />
        </div>
        <SourceFields
          id="mayor"
          name={register('mayorAlignment.sourceName')}
          url={register('mayorAlignment.sourceUrl')}
          errors={{
            name: errors.mayorAlignment?.sourceName?.message,
            url: errors.mayorAlignment?.sourceUrl?.message,
          }}
        />
      </FormSection>

      <FormSection
        title="Data gaps"
        description="What the public record doesn’t show yet, so readers know how far to trust it."
        action={
          <AddButton
            label="Add gap"
            onClick={() => gaps.append({ value: '' })}
            count={gaps.fields.length}
            max={DOSSIER_LIMITS.list}
          />
        }
      >
        {gaps.fields.length === 0 && <Empty>No data gaps recorded.</Empty>}
        <ul className="grid gap-2">
          {gaps.fields.map((field, index) => {
            const id = `gap-${String(index)}`;
            const error = errors.dataGaps?.[index]?.value?.message;
            return (
              <li key={field.id} className="grid gap-1">
                <div className="flex items-start gap-2">
                  <label htmlFor={id} className="sr-only">{`Gap ${String(index + 1)}`}</label>
                  <input
                    id={id}
                    className={CONTROL_CLASS}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    {...register(`dataGaps.${index}.value`)}
                  />
                  <RemoveButton
                    label={`Remove gap ${String(index + 1)}`}
                    onClick={() => gaps.remove(index)}
                  />
                </div>
                {error && (
                  <p id={`${id}-error`} role="alert" className="text-xs font-semibold text-brick">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </FormSection>

      <Card className="grid gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">
            {dossier ? `Save as version ${String(baseVersionNo + 1)}` : 'Create dossier'}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {dossier
              ? 'Saving never overwrites. Earlier versions stay in the history, and the new version starts as a draft.'
              : 'The dossier starts at version 1, as a draft. Every later edit is kept as a new version.'}
          </p>
        </div>
        <TextField
          id="changeNote"
          label="Change note"
          required
          rows={2}
          registration={register('changeNote')}
          error={errors.changeNote?.message}
          hint={`Shown in the version history. Up to ${String(CHANGE_NOTE_MAX)} characters.`}
          placeholder={
            dossier
              ? 'e.g. Added the Sept. 2026 budget vote.'
              : 'e.g. First draft from news sources.'
          }
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to={dossier ? dossierHref(dossier) : '/dossiers'}
            className={SECONDARY_LINK_CLASS}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : dossier ? 'Save new version' : 'Create dossier'}
          </Button>
        </div>
      </Card>
      {blocker.state === 'blocked' && (
        <UnsavedChangesDialog onStay={blocker.reset} onLeave={blocker.proceed} />
      )}
    </form>
  );
}

function EditDossier({ dossierId }: { dossierId: string }) {
  const fetchDossier = useCallback(() => getDossier(dossierId), [dossierId]);
  const { loaded, reload } = useLoad(fetchDossier);

  if (loaded.state === 'loading') return <LoadingText>Loading dossier…</LoadingText>;
  if (loaded.state === 'error') {
    return (
      <section className="space-y-6">
        <BackLink />
        <LoadError title="Dossier couldn’t be loaded" message={loaded.message} onRetry={reload} />
      </section>
    );
  }
  const dossier = loaded.data;
  return (
    <section className="space-y-6">
      <BackLink to={dossierHref(dossier)} label={dossier.member.name} />
      <PageHeader
        eyebrow="Edit dossier"
        title={dossier.member.name}
        description={`Editing version ${String(dossier.currentVersion.versionNo)}. Saving keeps this edit as a new version, with your change note.`}
      />
      {dossier.member.archived ? (
        <Callout title="This dossier is archived">It can no longer be edited.</Callout>
      ) : (
        <DossierForm key={dossier.currentVersion.versionNo} dossier={dossier} />
      )}
    </section>
  );
}

export function DossierEditorPage() {
  const { dossierId } = useParams();
  const access = useDossierAccess();

  if (!access.canView) return <DossierNotAvailable reason="no-access" />;
  if (!access.canEdit) return <DossierNotAvailable reason="no-edit" />;
  if (dossierId !== undefined) return <EditDossier dossierId={dossierId} />;

  return (
    <section className="space-y-6">
      <BackLink />
      <PageHeader
        eyebrow="New dossier"
        title="Add a council member"
        description="Record a council member’s public profile, positions and sources for this workspace."
      />
      <DossierForm dossier={null} />
    </section>
  );
}
