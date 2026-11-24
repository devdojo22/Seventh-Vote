import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { useParams } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { CloseIcon, PlusIcon } from '@/components/ui/icons';
import { Loader } from '@/components/ui/Loader';
import { describedBy } from '@/lib/aria';
import { useAppStore } from '@/stores/app-store';
import { SMALL_BUTTON_CLASS } from '../dossiers/link-classes';
import {
  getWorkspaceSettings,
  RECUSAL_MODES,
  TIE_BREAKS,
  updateVoteRules,
  type WorkspaceSettings,
} from './access-api';
import { describeAccessError } from './access-errors';
import {
  describeThreshold,
  newActionRow,
  RECUSAL_LABELS,
  THRESHOLD_TYPE_LABELS,
  THRESHOLD_TYPES,
  TIE_BREAK_LABELS,
  toFormValues,
  toVoteRules,
  VOTE_ACTIONS_MAX,
  voteRulesFormSchema,
  type VoteRulesFormValues,
} from './vote-rules-form';

type Loaded =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; settings: WorkspaceSettings };

const SELECT_CLASS = `${CONTROL_CLASS} cursor-pointer`;
const REMOVE_BUTTON_CLASS =
  'grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-muted transition-colors hover:bg-brick-bg hover:text-brick focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

const fieldDescribedBy = (id: string, hint: boolean, error: string | undefined) =>
  describedBy(hint && `${id}-hint`, error && `${id}-error`);


function RulesSummary({ settings }: { settings: WorkspaceSettings }) {
  if (settings.voteRules === null) {
    return (
      <Callout title="Not configured yet">
        This workspace’s Principal hasn’t set its vote rules.
      </Callout>
    );
  }
  const { bodySize, majorityThreshold, quorum, actions, recusal, tieBreak } = settings.voteRules;
  const items = [
    { label: 'Body size', value: bodySize, hint: 'voting seats' },
    {
      label: 'Majority threshold',
      value: majorityThreshold,
      hint: `votes of ${String(bodySize)} to pass`,
    },
    { label: 'Quorum', value: quorum, hint: 'members present for business' },
  ];
  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-line bg-white px-5 py-4 shadow-card"
          >
            <dt className="text-xs font-semibold text-muted">{item.label}</dt>
            <dd className="mt-1 font-display text-[28px] leading-none font-bold text-navy">
              {item.value}
            </dd>
            <dd className="mt-1 text-xs text-muted">{item.hint}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <h2 className="font-display text-lg font-bold text-navy">Votes needed by action type</h2>
        <ul className="mt-3 divide-y divide-line">
          <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
            <span className="text-sm font-semibold text-navy">
              Ordinary ordinance or resolution
            </span>
            <span className="text-sm text-ink">
              {majorityThreshold} of {bodySize} seats
            </span>
          </li>
          {actions.map((rule) => (
            <li
              key={rule.id}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy">
                  {rule.label}
                  {!rule.verified && (
                    <Badge className="border border-gold/40 bg-amber-bg text-amber">
                      Unverified
                    </Badge>
                  )}
                </span>
                {rule.note && <span className="block text-xs text-muted">{rule.note}</span>}
              </span>
              <span className="shrink-0 text-sm text-ink">
                {describeThreshold(rule.threshold, bodySize)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-muted">Recused members</dt>
            <dd className="mt-0.5 text-ink">{RECUSAL_LABELS[recusal].label}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-muted">On a tied vote</dt>
            <dd className="mt-0.5 text-ink">{TIE_BREAK_LABELS[tieBreak].label}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

function ActionRowEditor({
  index,
  control,
  register,
  errors,
  onRemove,
}: {
  index: number;
  control: Control<VoteRulesFormValues>;
  register: UseFormRegister<VoteRulesFormValues>;
  errors: FieldErrors<VoteRulesFormValues>;
  onRemove: () => void;
}) {
  const type = useWatch({ control, name: `actions.${index}.type` });
  const label = useWatch({ control, name: `actions.${index}.label` });
  const rowErrors = errors.actions?.[index];
  const id = (field: string) => `action-${String(index)}-${field}`;
  const title = label.trim() || `Action type ${String(index + 1)}`;

  return (
    <li className="grid gap-3 rounded-xl border border-line bg-paper/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="truncate text-[11px] font-bold tracking-wide text-muted uppercase">
          {title}
        </strong>
        <button
          type="button"
          className={REMOVE_BUTTON_CLASS}
          aria-label={`Remove ${title}`}
          onClick={onRemove}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={id('label')} label="Name" error={rowErrors?.label?.message} required>
          <input
            id={id('label')}
            className={CONTROL_CLASS}
            placeholder="e.g. Veto override"
            aria-invalid={Boolean(rowErrors?.label)}
            aria-describedby={fieldDescribedBy(id('label'), false, rowErrors?.label?.message)}
            {...register(`actions.${index}.label`)}
          />
        </Field>
        <Field id={id('type')} label="Votes needed">
          <select id={id('type')} className={SELECT_CLASS} {...register(`actions.${index}.type`)}>
            {THRESHOLD_TYPES.map((t) => (
              <option key={t} value={t}>
                {THRESHOLD_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {type === 'count' && (
        <Field
          id={id('needed')}
          label="Number of votes"
          hint="Out of all seats, whoever is present."
          error={rowErrors?.needed?.message}
          className="sm:max-w-xs"
        >
          <input
            id={id('needed')}
            type="number"
            inputMode="numeric"
            min={1}
            className={CONTROL_CLASS}
            aria-invalid={Boolean(rowErrors?.needed)}
            aria-describedby={fieldDescribedBy(id('needed'), true, rowErrors?.needed?.message)}
            {...register(`actions.${index}.needed`, { valueAsNumber: true })}
          />
        </Field>
      )}

      {type === 'fraction' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id={id('numerator')} label="Top number" error={rowErrors?.numerator?.message}>
            <input
              id={id('numerator')}
              type="number"
              inputMode="numeric"
              min={1}
              className={CONTROL_CLASS}
              aria-invalid={Boolean(rowErrors?.numerator)}
              aria-describedby={fieldDescribedBy(
                id('numerator'),
                false,
                rowErrors?.numerator?.message,
              )}
              {...register(`actions.${index}.numerator`, { valueAsNumber: true })}
            />
          </Field>
          <Field
            id={id('denominator')}
            label="Bottom number"
            error={rowErrors?.denominator?.message}
          >
            <input
              id={id('denominator')}
              type="number"
              inputMode="numeric"
              min={1}
              className={CONTROL_CLASS}
              aria-invalid={Boolean(rowErrors?.denominator)}
              aria-describedby={fieldDescribedBy(
                id('denominator'),
                false,
                rowErrors?.denominator?.message,
              )}
              {...register(`actions.${index}.denominator`, { valueAsNumber: true })}
            />
          </Field>
          <Field id={id('of')} label="Of">
            <select id={id('of')} className={SELECT_CLASS} {...register(`actions.${index}.of`)}>
              <option value="seats">All seats</option>
              <option value="present">Members present</option>
            </select>
          </Field>
        </div>
      )}

      <Field
        id={id('note')}
        label="Source"
        hint="Where the rule comes from, e.g. “Rule 49”."
        error={rowErrors?.note?.message}
      >
        <input
          id={id('note')}
          className={CONTROL_CLASS}
          aria-invalid={Boolean(rowErrors?.note)}
          aria-describedby={fieldDescribedBy(id('note'), true, rowErrors?.note?.message)}
          {...register(`actions.${index}.note`)}
        />
      </Field>
      <Checkbox
        label="Confirmed in the Rules of Procedure"
        className="text-xs"
        {...register(`actions.${index}.verified`)}
      />
    </li>
  );
}

function VoteRulesForm({
  settings,
  onSaved,
}: {
  settings: WorkspaceSettings;
  onSaved: (settings: WorkspaceSettings) => void;
}) {
  const showToast = useAppStore((s) => s.showToast);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VoteRulesFormValues>({
    resolver: zodResolver(voteRulesFormSchema),
    defaultValues: toFormValues(settings.voteRules, settings.voteProcedure),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'actions' });
  const recusal = useWatch({ control, name: 'recusal' });
  const tieBreak = useWatch({ control, name: 'tieBreak' });

  const onValid = async (values: VoteRulesFormValues) => {
    setError(null);
    try {
      onSaved(await updateVoteRules(settings.workspaceId, toVoteRules(values)));
      showToast('Vote rules saved');
    } catch (caught) {
      setError(describeAccessError(caught));
    }
  };

  const numberFields = [
    { name: 'bodySize', label: 'Body size', hint: 'Number of voting seats.' },
    {
      name: 'majorityThreshold',
      label: 'Majority threshold',
      hint: 'Votes an ordinary item needs to pass.',
    },
    { name: 'quorum', label: 'Quorum', hint: 'Members present to do business.' },
  ] as const;
  const full = fields.length >= VOTE_ACTIONS_MAX;

  return (
    <Card>
      <form noValidate className="grid gap-6" onSubmit={(e) => void handleSubmit(onValid)(e)}>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Edit vote rules</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            These apply to this workspace only. Every member can see them; only you and platform
            administrators can change them.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {numberFields.map((field) => {
            const fieldError = errors[field.name]?.message;
            const id = `vote-${field.name}`;
            return (
              <Field
                key={field.name}
                id={id}
                label={field.label}
                hint={field.hint}
                error={fieldError}
              >
                <input
                  id={id}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className={CONTROL_CLASS}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldDescribedBy(id, true, fieldError)}
                  {...register(field.name, { valueAsNumber: true })}
                />
              </Field>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="vote-recusal" label="Recused members" hint={RECUSAL_LABELS[recusal].hint}>
            <select
              id="vote-recusal"
              className={SELECT_CLASS}
              aria-describedby="vote-recusal-hint"
              {...register('recusal')}
            >
              {RECUSAL_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {RECUSAL_LABELS[mode].label}
                </option>
              ))}
            </select>
          </Field>
          <Field id="vote-tieBreak" label="On a tied vote" hint={TIE_BREAK_LABELS[tieBreak].hint}>
            <select
              id="vote-tieBreak"
              className={SELECT_CLASS}
              aria-describedby="vote-tieBreak-hint"
              {...register('tieBreak')}
            >
              {TIE_BREAKS.map((option) => (
                <option key={option} value={option}>
                  {TIE_BREAK_LABELS[option].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-[13px] font-semibold text-navy">Other action types</legend>
          <p className="-mt-1 text-xs leading-relaxed text-muted">
            Items that need something other than the majority threshold, such as a censure, a veto
            override or a consent item.
          </p>
          {fields.length === 0 && (
            <p className="text-xs text-muted italic">
              None: every item uses the majority threshold.
            </p>
          )}
          <ul className="grid gap-3">
            {fields.map((field, index) => (
              <ActionRowEditor
                key={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors}
                onRemove={() => remove(index)}
              />
            ))}
          </ul>
          {errors.actions?.message && (
            <p role="alert" className="text-xs font-semibold text-brick">
              {errors.actions.message}
            </p>
          )}
          <button
            type="button"
            className={`${SMALL_BUTTON_CLASS} self-start`}
            onClick={() => append(newActionRow())}
            disabled={full}
            title={full ? `Up to ${String(VOTE_ACTIONS_MAX)} action types` : undefined}
          >
            <PlusIcon className="size-3.5" />
            Add action type
          </button>
        </fieldset>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save vote rules'}
          </Button>
          {error && (
            <p role="alert" className="text-xs font-semibold text-brick">
              {error}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

export function WorkspaceSettingsPage() {
  const { workspaceId = '' } = useParams();
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });

  useEffect(() => {
    let active = true;
    getWorkspaceSettings(workspaceId)
      .then((settings) => {
        if (active) setLoaded({ state: 'ready', settings });
      })
      .catch((error: unknown) => {
        if (active) setLoaded({ state: 'error', message: describeAccessError(error) });
      });
    return () => {
      active = false;
    };
  }, [workspaceId]);

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Workspace settings"
        title={loaded.state === 'ready' ? loaded.settings.name : 'Vote rules'}
        description="How this council votes: the size of the body, the quorum, and the votes each kind of item needs. Each workspace has its own rules."
      />

      {loaded.state === 'loading' && <Loader label="Loading settings…" />}
      {loaded.state === 'error' && (
        <Callout title="Settings couldn’t be loaded">{loaded.message}</Callout>
      )}
      {loaded.state === 'ready' && (
        <>
          <RulesSummary settings={loaded.settings} />
          {loaded.settings.canConfigure && (
            <VoteRulesForm
              key={loaded.settings.updatedAt}
              settings={loaded.settings}
              onSaved={(settings) => setLoaded({ state: 'ready', settings })}
            />
          )}
        </>
      )}
    </section>
  );
}
