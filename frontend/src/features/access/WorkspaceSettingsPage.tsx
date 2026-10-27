import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { useAppStore } from '@/stores/app-store';
import { getWorkspaceSettings, updateVoteRules, type WorkspaceSettings } from './access-api';
import { describeAccessError } from './access-errors';

const count = (label: string) =>
  z
    .number({ error: `Enter the ${label}.` })
    .int('Use a whole number.')
    .min(1, 'Use at least 1.');

/** Mirrors the server's rules for display; the auth service validates again and decides. */
const voteRulesFormSchema = z
  .object({
    bodySize: count('body size').max(1000, 'Use at most 1000.'),
    majorityThreshold: count('majority threshold'),
    quorum: count('quorum'),
  })
  .refine((v) => v.majorityThreshold <= v.bodySize, {
    message: 'Can’t be more than the body size.',
    path: ['majorityThreshold'],
  })
  .refine((v) => v.quorum <= v.bodySize, {
    message: 'Can’t be more than the body size.',
    path: ['quorum'],
  });
type VoteRulesValues = z.infer<typeof voteRulesFormSchema>;

type Loaded =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; settings: WorkspaceSettings };

function RulesSummary({ settings }: { settings: WorkspaceSettings }) {
  if (settings.voteRules === null) {
    return (
      <Callout title="Not configured yet">
        This workspace’s Principal hasn’t set its vote rules.
      </Callout>
    );
  }
  const { bodySize, majorityThreshold, quorum } = settings.voteRules;
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
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VoteRulesValues>({
    resolver: zodResolver(voteRulesFormSchema),
    defaultValues: settings.voteRules ?? undefined,
  });

  const onValid = async (values: VoteRulesValues) => {
    setError(null);
    try {
      onSaved(await updateVoteRules(settings.workspaceId, values));
      showToast('Vote rules saved');
    } catch (caught) {
      setError(describeAccessError(caught));
    }
  };

  const fields = [
    { name: 'bodySize', label: 'Body size', hint: 'Number of voting seats.' },
    { name: 'majorityThreshold', label: 'Majority threshold', hint: 'Votes needed to pass.' },
    { name: 'quorum', label: 'Quorum', hint: 'Members present to do business.' },
  ] as const;

  return (
    <Card>
      <form noValidate className="grid gap-4" onSubmit={(e) => void handleSubmit(onValid)(e)}>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Edit vote rules</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            These apply to this workspace only. Every member can see them; only you and platform
            administrators can change them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {fields.map((field) => {
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
                  aria-describedby={`${id}-hint${fieldError ? ` ${id}-error` : ''}`}
                  {...register(field.name, { valueAsNumber: true })}
                />
              </Field>
            );
          })}
        </div>
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

/**
 * The workspace's vote rules: body size, majority threshold and quorum. Read-only for Affiliates; the
 * Principal (or a super-admin) edits them. The server enforces who may read and who may change them.
 */
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
        description="How this council votes: the size of the body, the votes needed to pass, and the quorum. Each workspace has its own rules."
      />

      {loaded.state === 'loading' && (
        <p className="text-sm text-muted" aria-live="polite">
          Loading settings…
        </p>
      )}
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
