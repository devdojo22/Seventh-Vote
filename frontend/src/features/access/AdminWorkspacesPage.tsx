import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTROL_CLASS, Field } from '@/components/ui/Field';
import { ArchiveIcon, ChevronDownIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/Modal';
import { RadioPillGroup } from '@/components/ui/RadioPillGroup';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { useAppStore } from '@/stores/app-store';
import { emailAddress } from '@/features/auth/auth-schema';
import { useCurrentUser } from '@/stores/auth-session-store';
import { PREVIOUS_PRINCIPAL_OUTCOMES, type PreviousPrincipalOutcome } from '@/types/access';
import {
  archiveWorkspace,
  createWorkspace,
  deleteWorkspace,
  designatePrincipal,
  listAllWorkspaces,
  restoreWorkspace,
  type AdminWorkspace,
} from './access-api';
import { describeAccessError } from './access-errors';
import {
  formatDate,
  PREVIOUS_PRINCIPAL_OUTCOME_DESCRIPTIONS,
  PREVIOUS_PRINCIPAL_OUTCOME_LABELS,
} from './access-labels';

const LINK_BUTTON_CLASS =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-card transition-colors hover:border-navy/25 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

const DANGER_LINK_BUTTON_CLASS =
  'inline-flex cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brick shadow-card transition-colors hover:border-brick/40 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none';

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

  const [previousPrincipal, setPreviousPrincipal] = useState<PreviousPrincipalOutcome>('REMOVE');

  const onValid = async ({ email }: PrincipalValues) => {
    setError(null);
    try {
      const result = await designatePrincipal(workspace.id, email.toLowerCase(), previousPrincipal);
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
          <strong className="text-navy">{workspace.name}</strong>, they become Principal now.
          Otherwise they’re emailed an invitation, and the change happens when they accept it
          {workspace.principal ? '; until then the current Principal stays in place' : ''}.
        </p>
        {workspace.principal && (
          <div className="grid gap-1.5">
            <RadioPillGroup
              legend={`Current Principal (${workspace.principal.name ?? workspace.principal.email})`}
              name="previous-principal"
              options={PREVIOUS_PRINCIPAL_OUTCOMES.map((value) => ({
                value,
                label: PREVIOUS_PRINCIPAL_OUTCOME_LABELS[value],
              }))}
              value={previousPrincipal}
              onChange={setPreviousPrincipal}
            />
            <p className="text-xs leading-relaxed text-muted">
              {PREVIOUS_PRINCIPAL_OUTCOME_DESCRIPTIONS[previousPrincipal]}
            </p>
          </div>
        )}
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

function ArchiveWorkspaceDialog({
  workspace,
  onClose,
  onDone,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await archiveWorkspace(workspace.id);
      onDone('Workspace moved to the archive box');
    } catch (caught) {
      setError(describeAccessError(caught));
      setBusy(false);
    }
  };

  return (
    <Modal labelledBy="archive-workspace-title" onClose={onClose}>
      <div className="grid gap-4 p-5 sm:p-6">
        <h2 id="archive-workspace-title" className="font-display text-xl font-bold text-navy">
          Archive {workspace.name}?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          It moves to the archive box. Members lose access immediately and nothing in the workspace
          can be changed. Its members, invitations and history are kept, and you can restore it at
          any time.
        </p>
        {error && (
          <p role="alert" className="text-xs font-semibold text-brick">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} data-autofocus>
            Cancel
          </Button>
          <Button onClick={() => void confirm()} disabled={busy} aria-busy={busy}>
            {busy ? 'Archiving…' : 'Archive workspace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteWorkspaceDialog({
  workspace,
  onClose,
  onDone,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [confirmSlug, setConfirmSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirmSlug.trim() === workspace.slug;

  const confirm = async () => {
    if (!matches) return;
    setBusy(true);
    setError(null);
    try {
      await deleteWorkspace(workspace.id, confirmSlug.trim());
      onDone('Workspace deleted');
    } catch (caught) {
      setError(describeAccessError(caught));
      setBusy(false);
    }
  };

  return (
    <Modal labelledBy="delete-workspace-title" onClose={onClose}>
      <form
        noValidate
        className="grid gap-4 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          void confirm();
        }}
      >
        <h2 id="delete-workspace-title" className="font-display text-xl font-bold text-navy">
          Permanently delete {workspace.name}?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          This cannot be undone. Its memberships, pending invitations, workspace data and audit
          history are deleted. Members’ accounts and their other workspaces are not affected. Only
          the workspace name, who deleted it and when are kept.
        </p>
        <Field id="delete-confirm-slug" label={`Type ${workspace.slug} to confirm`}>
          <input
            id="delete-confirm-slug"
            className={CONTROL_CLASS}
            autoComplete="off"
            spellCheck={false}
            data-autofocus
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
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
          <Button type="submit" disabled={!matches || busy} aria-busy={busy}>
            {busy ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type PendingAction = { kind: 'designate' | 'archive' | 'delete'; workspace: AdminWorkspace };

function countNote(count: number): string {
  return `${count} workspace${count === 1 ? '' : 's'}`;
}

function WorkspaceSummary({ workspace }: { workspace: AdminWorkspace }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-navy">{workspace.name}</span>
        {workspace.archivedAt && (
          <Badge>Archived {formatDate(workspace.archivedAt.slice(0, 10))}</Badge>
        )}
      </div>
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
  );
}

export function AdminWorkspacesPage() {
  const user = useCurrentUser();
  const showToast = useAppStore((s) => s.showToast);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Archived workspaces stay out of sight until the admin opens the archive box.
  const [archiveOpen, setArchiveOpen] = useState(false);
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

  const closeDialog = useCallback(() => setPending(null), []);

  const activeWorkspaces = workspaces?.filter((workspace) => workspace.archivedAt === null) ?? null;
  const archivedWorkspaces =
    workspaces?.filter((workspace) => workspace.archivedAt !== null) ?? null;

  const finishAction = (message: string) => {
    closeDialog();
    showToast(message);
    load();
  };

  const restore = async (workspace: AdminWorkspace) => {
    setRestoringId(workspace.id);
    setActionError(null);
    try {
      await restoreWorkspace(workspace.id);
      showToast('Workspace restored');
      load();
    } catch (caught) {
      setActionError(describeAccessError(caught));
    } finally {
      setRestoringId(null);
    }
  };

  const [dragged, setDragged] = useState<AdminWorkspace | null>(null);
  const [dropZone, setDropZone] = useState<'active' | 'archive' | null>(null);

  const draggable = (workspace: AdminWorkspace) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData('text/plain', workspace.id);
      event.dataTransfer.effectAllowed = 'move';
      setDragged(workspace);
    },
    onDragEnd: () => {
      setDragged(null);
      setDropZone(null);
    },
    className: `min-w-0 cursor-grab active:cursor-grabbing ${dragged?.id === workspace.id ? 'opacity-50' : ''}`,
  });

  const dropTarget = (zone: 'active' | 'archive', onDrop: (workspace: AdminWorkspace) => void) => {
    const accepts = dragged !== null && (dragged.archivedAt === null) === (zone === 'archive');
    return {
      onDragOver: (event: DragEvent) => {
        if (!accepts) return;
        event.preventDefault();
        setDropZone(zone);
      },
      onDragLeave: (event: DragEvent) => {
        if (!(
          event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)
        )) {
          setDropZone(null);
        }
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        if (dragged && accepts) onDrop(dragged);
        setDragged(null);
        setDropZone(null);
      },
    };
  };
  const dropHighlight = (zone: 'active' | 'archive') =>
    dropZone === zone ? 'ring-2 ring-gold ring-offset-2' : '';

  const header = (
    <PageHeader
      eyebrow="Platform administration"
      title="Workspaces"
      description="Create workspaces, designate each one’s Principal, and archive, restore or delete them. Your access to workspaces is recorded in the audit log."
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

      {actionError && <Callout title="That didn’t work">{actionError}</Callout>}

      {activeWorkspaces && (
        <div
          {...dropTarget('active', (workspace) => void restore(workspace))}
          className={`space-y-3 rounded-2xl transition-shadow ${dropHighlight('active')}`}
        >
          <SectionHeading title="Workspaces" note={countNote(activeWorkspaces.length)} />
          {activeWorkspaces.length === 0 ? (
            <EmptyState>No active workspaces.</EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {activeWorkspaces.map((workspace) => (
                <li key={workspace.id} {...draggable(workspace)}>
                  <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <WorkspaceSummary workspace={workspace} />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className={LINK_BUTTON_CLASS}
                        onClick={() => setPending({ kind: 'designate', workspace })}
                      >
                        {workspace.principal ? 'Transfer Principal' : 'Designate Principal'}
                      </button>
                      <Link
                        to={`/workspaces/${workspace.id}/members`}
                        className={LINK_BUTTON_CLASS}
                      >
                        Members
                      </Link>
                      <button
                        type="button"
                        className={LINK_BUTTON_CLASS}
                        onClick={() => setPending({ kind: 'archive', workspace })}
                      >
                        Archive
                      </button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {archivedWorkspaces && (
        <div
          {...dropTarget('archive', (workspace) => setPending({ kind: 'archive', workspace }))}
          className={`rounded-2xl transition-shadow ${dropHighlight('archive')}`}
        >
          <Card padded={false} className="overflow-hidden">
            <button
              type="button"
              aria-expanded={archiveOpen}
              aria-controls="archive-box-panel"
              onClick={() => setArchiveOpen((open) => !open)}
              className="flex w-full cursor-pointer items-center gap-4 p-5 text-left transition-colors hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none focus-visible:ring-inset sm:p-6"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-paper text-navy">
                <ArchiveIcon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-bold text-navy">Archive box</span>
                  <Badge>{countNote(archivedWorkspaces.length)}</Badge>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {dropZone === 'archive'
                    ? 'Release to archive this workspace.'
                    : `${archiveOpen ? 'Hide' : 'Show'} archived workspaces, or drag a workspace here to archive it.`}
                </span>
              </span>
              <ChevronDownIcon
                className={`size-5 shrink-0 text-muted transition-transform duration-200 ${archiveOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {archiveOpen && (
              <div
                id="archive-box-panel"
                className="animate-fade-in border-t border-line bg-paper/60 p-4 sm:p-5"
              >
                {archivedWorkspaces.length === 0 ? (
                  <EmptyState>The archive box is empty.</EmptyState>
                ) : (
                  <ul className="grid grid-cols-1 gap-3">
                    {archivedWorkspaces.map((workspace) => (
                      <li key={workspace.id} {...draggable(workspace)}>
                        <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <WorkspaceSummary workspace={workspace} />
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                              type="button"
                              className={LINK_BUTTON_CLASS}
                              disabled={restoringId === workspace.id}
                              aria-busy={restoringId === workspace.id}
                              onClick={() => void restore(workspace)}
                            >
                              {restoringId === workspace.id ? 'Restoring…' : 'Restore'}
                            </button>
                            <button
                              type="button"
                              className={DANGER_LINK_BUTTON_CLASS}
                              onClick={() => setPending({ kind: 'delete', workspace })}
                            >
                              Delete permanently
                            </button>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {pending?.kind === 'designate' && (
        <DesignatePrincipalDialog
          workspace={pending.workspace}
          onClose={closeDialog}
          onDone={finishAction}
        />
      )}
      {pending?.kind === 'archive' && (
        <ArchiveWorkspaceDialog
          workspace={pending.workspace}
          onClose={closeDialog}
          onDone={finishAction}
        />
      )}
      {pending?.kind === 'delete' && (
        <DeleteWorkspaceDialog
          workspace={pending.workspace}
          onClose={closeDialog}
          onDone={finishAction}
        />
      )}
    </section>
  );
}
