import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/stores/app-store';
import { emailAddress } from '@/features/auth/auth-schema';
import { useCurrentUser } from '@/stores/auth-session-store';
import {
  createWorkspace,
  designatePrincipal,
  listAllWorkspaces,
  type AdminWorkspace,
} from './access-api';
import { describeAccessError } from './access-errors';

const LINK_BUTTON_CLASS =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-card transition-colors hover:border-navy/25 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Enter a workspace name.').max(120, 'Use a shorter name.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(60, 'Use at most 60 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and single hyphens.'),
});
type CreateValues = z.infer<typeof createSchema>;

const principalSchema = z.object({
  email: emailAddress('Enter an email address.'),
});
type PrincipalValues = z.infer<typeof principalSchema>;

function CreateWorkspaceForm({ onCreated }: { onCreated: () => void }) {
  const showToast = useAppStore((s) => s.showToast);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', slug: '' },
  });

  const onValid = async (values: CreateValues) => {
    setError(null);
    try {
      await createWorkspace(values.name, values.slug);
      reset();
      showToast('Workspace created');
      onCreated();
    } catch (caught) {
      setError(describeAccessError(caught));
    }
  };

  return (
    <Card>
      <form noValidate className="grid gap-4" onSubmit={(e) => void handleSubmit(onValid)(e)}>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Create a workspace</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            A new workspace starts with no members. Designate its Principal next.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="workspace-name" label="Name" error={errors.name?.message}>
            <input
              id="workspace-name"
              className={CONTROL_CLASS}
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'workspace-name-error' : undefined}
              {...register('name')}
            />
          </Field>
          <Field id="workspace-slug" label="Short identifier" error={errors.slug?.message}>
            <input
              id="workspace-slug"
              className={CONTROL_CLASS}
              autoComplete="off"
              placeholder="city-council"
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? 'workspace-slug-error' : undefined}
              {...register('slug')}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create workspace'}
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

function DesignatePrincipalDialog({
  workspace,
  onClose,
  onDone,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrincipalValues>({
    resolver: zodResolver(principalSchema),
    defaultValues: { email: '' },
  });

  const onValid = async ({ email }: PrincipalValues) => {
    setError(null);
    try {
      const result = await designatePrincipal(workspace.id, email.toLowerCase());
      onDone(result.status === 'transferred' ? 'Principal changed' : 'Principal invitation sent');
    } catch (caught) {
      setError(describeAccessError(caught));
    }
  };

  return (
    <Modal labelledBy="designate-principal-title" onClose={onClose}>
      <form
        noValidate
        className="grid gap-4 p-5 sm:p-6"
        onSubmit={(e) => void handleSubmit(onValid)(e)}
      >
        <h2 id="designate-principal-title" className="font-display text-xl font-bold text-navy">
          {workspace.principal ? 'Transfer the Principal role' : 'Designate the Principal'}
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          A workspace has exactly one Principal. If this person is already a member of{' '}
          <strong className="text-navy">{workspace.name}</strong>, they become Principal now
          {workspace.principal ? ' and the current Principal becomes an Affiliate' : ''}. Otherwise
          they’re emailed an invitation, and the change happens when they accept it.
        </p>
        <Field id="principal-email" label="Email address" error={errors.email?.message}>
          <input
            id="principal-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            data-autofocus
            className={CONTROL_CLASS}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'principal-email-error' : undefined}
            {...register('email')}
          />
        </Field>
        {error && (
          <p role="alert" className="text-xs font-semibold text-brick">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Confirm'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Platform administration: create workspaces and designate or transfer each one's Principal. */
export function AdminWorkspacesPage() {
  const user = useCurrentUser();
  const showToast = useAppStore((s) => s.showToast);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [designating, setDesignating] = useState<AdminWorkspace | null>(null);
  const [version, setVersion] = useState(0);
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!user.isSuperAdmin) return;
    let active = true;
    listAllWorkspaces()
      .then((list) => {
        if (!active) return;
        setWorkspaces(list);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(describeAccessError(error));
      });
    return () => {
      active = false;
    };
  }, [user.isSuperAdmin, version]);

  const closeDialog = useCallback(() => setDesignating(null), []);

  const header = (
    <PageHeader
      eyebrow="Platform administration"
      title="Workspaces"
      description="Create workspaces and designate each one’s Principal. Your access to workspaces you aren’t a member of is recorded in the audit log."
    />
  );

  if (!user.isSuperAdmin) {
    return (
      <section className="space-y-8">
        {header}
        <Callout title="Not available">This page is for platform administrators.</Callout>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {header}
      <CreateWorkspaceForm onCreated={load} />

      {loadError && (
        <Callout title="Workspaces couldn’t be loaded">
          {loadError}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Try again
          </button>
        </Callout>
      )}

      {workspaces === null && !loadError && (
        <p className="text-sm text-muted" aria-live="polite">
          Loading workspaces…
        </p>
      )}

      {workspaces?.length === 0 && <EmptyState>No workspaces yet.</EmptyState>}

      {workspaces && workspaces.length > 0 && (
        <ul className="grid grid-cols-1 gap-3">
          {workspaces.map((workspace) => (
            <li key={workspace.id} className="min-w-0">
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-navy">{workspace.name}</div>
                  <div className="text-xs text-muted">
                    {workspace.slug} · {workspace.memberCount} member
                    {workspace.memberCount === 1 ? '' : 's'}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Principal:{' '}
                    {workspace.principal ? (
                      <strong className="text-navy">
                        {workspace.principal.name ?? workspace.principal.email}
                      </strong>
                    ) : (
                      <span className="font-semibold text-amber">not designated yet</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    className={LINK_BUTTON_CLASS}
                    onClick={() => setDesignating(workspace)}
                  >
                    {workspace.principal ? 'Transfer Principal' : 'Designate Principal'}
                  </button>
                  <Link to={`/workspaces/${workspace.id}/members`} className={LINK_BUTTON_CLASS}>
                    Members
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {designating && (
        <DesignatePrincipalDialog
          workspace={designating}
          onClose={closeDialog}
          onDone={(message) => {
            closeDialog();
            showToast(message);
            load();
          }}
        />
      )}
    </section>
  );
}
