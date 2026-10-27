import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { MailIcon } from '@/components/ui/icons';
import { Modal } from '@/components/ui/Modal';
import { useAppStore } from '@/stores/app-store';
import { emailAddress } from '@/features/auth/auth-schema';
import { useCurrentUser } from '@/stores/auth-session-store';
import {
  inviteAffiliate,
  listInvitations,
  listMembers,
  removeMember,
  revokeInvitation,
  setMemberDossierEdit,
  type Invitation,
  type Member,
} from './access-api';
import { describeAccessError } from './access-errors';
import { formatDate, ROLE_LABELS } from './access-labels';
import { RoleBadge } from './AccessBadges';

const SMALL_BUTTON_CLASS =
  'cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-card transition-colors hover:border-navy/25 hover:bg-paper focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50';

const inviteSchema = z.object({
  email: emailAddress('Enter an email address.'),
  canEditDossiers: z.boolean(),
});
type InviteValues = z.infer<typeof inviteSchema>;

type Loaded =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; members: Member[]; invitations: Invitation[] };

function InviteForm({ workspaceId, onInvited }: { workspaceId: string; onInvited: () => void }) {
  const showToast = useAppStore((s) => s.showToast);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', canEditDossiers: false },
  });

  const onValid = async (values: InviteValues) => {
    setError(null);
    try {
      await inviteAffiliate(workspaceId, values.email.toLowerCase(), values.canEditDossiers);
      reset();
      showToast('Invitation sent');
      onInvited();
    } catch (caught) {
      setError(describeAccessError(caught));
    }
  };

  return (
    <Card>
      <form noValidate className="grid gap-4" onSubmit={(e) => void handleSubmit(onValid)(e)}>
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Invite an Affiliate</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Affiliates can view dossiers, run rehearsals and view results. They can’t manage users
            or change workspace settings. The invitation link works once and expires.
          </p>
        </div>
        <Field id="invite-email" label="Email address" error={errors.email?.message}>
          <IconInput
            id="invite-email"
            icon={MailIcon}
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="name@example.gov"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'invite-email-error' : undefined}
            {...register('email')}
          />
        </Field>
        <Checkbox label="Allow this Affiliate to edit dossiers" {...register('canEditDossiers')} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send invitation'}
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

function RemoveMemberDialog({
  member,
  onCancel,
  onConfirm,
  busy,
}: {
  member: Member;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Modal labelledBy="remove-member-title" onClose={onCancel}>
      <div className="grid gap-4 p-5 sm:p-6">
        <h2 id="remove-member-title" className="font-display text-xl font-bold text-navy">
          Remove {member.name ?? member.email}?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          They lose access to this workspace immediately and are signed out of it. Their account and
          any other workspaces are not affected. You can invite them again later.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy} aria-busy={busy}>
            {busy ? 'Removing…' : 'Remove from workspace'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Member management for one workspace: its Principal, or a super-admin. The server decides who may load
 * or change anything here; the checks below only avoid showing controls that would be refused.
 */
export function MembersPage() {
  const { workspaceId = '' } = useParams();
  const user = useCurrentUser();
  const showToast = useAppStore((s) => s.showToast);
  const [loaded, setLoaded] = useState<Loaded>({ state: 'loading' });
  const [version, setVersion] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  const workspace = user.workspaces.find((w) => w.id === workspaceId);
  const canManage = user.isSuperAdmin || workspace?.role === 'PRINCIPAL';
  const load = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!canManage) return;
    let active = true;
    Promise.all([listMembers(workspaceId), listInvitations(workspaceId)])
      .then(([members, invitations]) => {
        if (active) setLoaded({ state: 'ready', members, invitations });
      })
      .catch((error: unknown) => {
        if (active) setLoaded({ state: 'error', message: describeAccessError(error) });
      });
    return () => {
      active = false;
    };
  }, [canManage, workspaceId, version]);

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setPending(key);
    setActionError(null);
    try {
      await action();
      showToast(done);
      load();
    } catch (error) {
      setActionError(describeAccessError(error));
    } finally {
      setPending(null);
    }
  };

  const closeRemove = useCallback(() => setRemoving(null), []);

  const header = (
    <PageHeader
      eyebrow="Workspace members"
      title={workspace?.name ?? 'Workspace members'}
      description="Invite Affiliates, decide who may edit dossiers, and remove access. Only a platform administrator can change who the Principal is."
    />
  );

  if (!canManage) {
    return (
      <section className="space-y-8">
        {header}
        <Callout title="Not available">
          Only this workspace’s Principal can manage its members. Ask them if your access needs to
          change.
        </Callout>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {header}

      <InviteForm workspaceId={workspaceId} onInvited={load} />

      {actionError && (
        <Callout title="That didn’t work">
          <span role="alert">{actionError}</span>
        </Callout>
      )}

      {loaded.state === 'loading' && (
        <p className="text-sm text-muted" aria-live="polite">
          Loading members…
        </p>
      )}
      {loaded.state === 'error' && (
        <Callout title="Members couldn’t be loaded">
          {loaded.message}{' '}
          <button type="button" className="font-semibold underline" onClick={load}>
            Try again
          </button>
        </Callout>
      )}

      {loaded.state === 'ready' && (
        <>
          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-navy">
              Members <span className="text-muted">({loaded.members.length})</span>
            </h2>
            <ul className="grid grid-cols-1 gap-3">
              {loaded.members.map((member) => {
                const name = member.name ?? member.email;
                const isAffiliate = member.role === 'AFFILIATE';
                return (
                  <li key={member.userId} className="min-w-0">
                    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Avatar name={name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold text-navy">{name}</span>
                            <RoleBadge role={member.role} />
                          </div>
                          <div className="truncate text-xs text-muted">
                            {member.email} · joined {formatDate(member.joinedAt.slice(0, 10))}
                          </div>
                        </div>
                      </div>
                      {isAffiliate ? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          <Checkbox
                            label="Can edit dossiers"
                            checked={member.canEditDossiers}
                            disabled={pending !== null}
                            onChange={(e) =>
                              void run(
                                `edit:${member.userId}`,
                                () =>
                                  setMemberDossierEdit(
                                    workspaceId,
                                    member.userId,
                                    e.target.checked,
                                  ),
                                'Permission updated',
                              )
                            }
                          />
                          <button
                            type="button"
                            className={SMALL_BUTTON_CLASS}
                            disabled={pending !== null}
                            onClick={() => setRemoving(member)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">Has every permission</span>
                      )}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-xl font-bold text-navy">Pending invitations</h2>
            {loaded.invitations.length === 0 ? (
              <EmptyState>No invitations are waiting to be accepted.</EmptyState>
            ) : (
              <ul className="grid grid-cols-1 gap-3">
                {loaded.invitations.map((invitation) => (
                  <li key={invitation.id} className="min-w-0">
                    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-navy">{invitation.email}</div>
                        <div className="text-xs text-muted">
                          {ROLE_LABELS[invitation.role]}
                          {invitation.canEditDossiers ? ' · may edit dossiers' : ''} · expires{' '}
                          {formatDate(invitation.expiresAt.slice(0, 10))}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={SMALL_BUTTON_CLASS}
                        disabled={pending !== null}
                        onClick={() =>
                          void run(
                            `revoke:${invitation.id}`,
                            () => revokeInvitation(workspaceId, invitation.id),
                            'Invitation withdrawn',
                          )
                        }
                      >
                        Withdraw
                      </button>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {removing && (
        <RemoveMemberDialog
          member={removing}
          busy={pending !== null}
          onCancel={closeRemove}
          onConfirm={() =>
            void run(
              `remove:${removing.userId}`,
              () => removeMember(workspaceId, removing.userId),
              'Member removed',
            ).then(closeRemove)
          }
        />
      )}
    </section>
  );
}
