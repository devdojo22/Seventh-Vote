import { Role, type Invitation, type User, type Workspace } from '@prisma/client';
import { describeDeliveryError, type EmailSender } from '../../infrastructure/email/email-sender.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { isUniqueConstraintViolation } from '../../shared/errors/prisma-errors.js';
import type {
  InvitationAcceptedResponse,
  InvitationPreviewResponse,
  InvitationResponse,
} from '../../shared/types/api.types.js';
import { randomToken, sha256 } from '../../shared/utils/hashing.js';
import type { AuditService, RequestContext } from '../audit/audit.service.js';
import type { PasswordHasher } from '../authentication/password-hasher.js';
import type { UserRepository } from '../users/user.repository.js';
import { invitationEmail } from './invitation-emails.js';
import type { AcceptResult, InvitationRepository, InvitationWithWorkspace } from './invitation.repository.js';
import type { AcceptInvitationInput } from './invitation.validation.js';

const INVALID_INVITATION = 'This invitation link is invalid or has expired. Ask for a new invitation.';
const ACCOUNT_EXISTS = 'An account already exists for this email address. Sign in to accept the invitation.';
const EMAIL_MISMATCH = 'This invitation was sent to a different email address.';
const MS_PER_HOUR = 60 * 60 * 1000;

export interface InvitationServiceDependencies {
  invitations: InvitationRepository;
  users: UserRepository;
  passwords: PasswordHasher;
  email: EmailSender;
  audit: AuditService;
  appBaseUrl: string;
  privacyStatementUrl: string | null;
  ttlMs: number;
  now: () => Date;
}

export interface NewInvitationRequest {
  workspace: Workspace;
  email: string;
  role: Role;
  canEditDossiers: boolean;
  invitedById: string;
}

function accountExists(): HttpError {
  return new HttpError(409, ACCOUNT_EXISTS, { code: 'account_exists' });
}

export function toInvitationResponse(invitation: Invitation): InvitationResponse {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    canEditDossiers: invitation.canEditDossiers,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}


export class InvitationService {
  constructor(private readonly deps: InvitationServiceDependencies) {}
  async invite(request: NewInvitationRequest, context: RequestContext): Promise<InvitationResponse> {
    const { workspace, email, role, canEditDossiers, invitedById } = request;
    const token = randomToken();
    const now = this.deps.now();
    const invitation = await this.deps.invitations.create({
      workspaceId: workspace.id,
      email,
      role,
      canEditDossiers,
      tokenHash: sha256(token),
      invitedById,
      expiresAt: new Date(now.getTime() + this.deps.ttlMs),
      createdAt: now,
    });

    try {
      await this.deps.email.send(
        invitationEmail({
          to: email,
          workspaceName: workspace.name,
          role,
          acceptUrl: `${this.deps.appBaseUrl}/invite#token=${token}`,
          validForHours: Math.round(this.deps.ttlMs / MS_PER_HOUR),
          privacyStatementUrl: this.deps.privacyStatementUrl,
        }),
      );
    } catch (error) {
      context.log.error(
        { invitationId: invitation.id, delivery: describeDeliveryError(error) },
        'invitation email could not be sent',
      );
      await this.deps.invitations.revoke(invitation.id, workspace.id, now, [role]);
      this.deps.audit.record(context, {
        action: 'invitation.email_failed',
        userId: invitedById,
        workspaceId: workspace.id,
        meta: { invitationId: invitation.id, role },
      });
      throw new HttpError(502, 'The invitation email could not be sent. Try again.');
    }

    if (!(await this.deps.invitations.markSent(invitation, this.deps.now()))) {
      // Revoked while its email was in flight (e.g. a Principal transfer completed); the emailed link is dead
      // and nothing was superseded. Recorded, since the recipient holds an email no other entry explains.
      this.deps.audit.record(context, {
        action: 'invitation.cancelled_while_sending',
        userId: invitedById,
        workspaceId: workspace.id,
        meta: { invitationId: invitation.id, role },
      });
      throw new HttpError(
        409,
        'The invitation was withdrawn while its email was being sent, so the emailed link will not work. Invite again.',
      );
    }
    this.deps.audit.record(context, {
      action: 'invitation.created',
      userId: invitedById,
      workspaceId: workspace.id,
      meta: { invitationId: invitation.id, role, canEditDossiers },
    });
    return toInvitationResponse(invitation);
  }

  /** Pending invitations of the given roles only (see manageableInvitationRoles). */
  async listPending(workspaceId: string, roles: readonly Role[]): Promise<InvitationResponse[]> {
    return (await this.deps.invitations.listPending(workspaceId, this.deps.now(), roles)).map(toInvitationResponse);
  }

  /** Withdraws an invitation whose role is one of `roles`; any other invitation is reported as not found. */
  async revoke(
    actorId: string,
    workspaceId: string,
    invitationId: string,
    roles: readonly Role[],
    context: RequestContext,
  ): Promise<void> {
    if (!(await this.deps.invitations.revoke(invitationId, workspaceId, this.deps.now(), roles))) {
      throw new HttpError(404, 'Invitation not found');
    }
    this.deps.audit.record(context, {
      action: 'invitation.revoked',
      userId: actorId,
      workspaceId,
      meta: { invitationId },
    });
  }

  /** What the link holder needs to choose between creating an account and signing in to join. */
  async preview(token: string): Promise<InvitationPreviewResponse> {
    const invitation = await this.usable(token);
    if (!invitation) throw new HttpError(400, INVALID_INVITATION);
    return {
      workspaceName: invitation.workspace.name,
      email: invitation.email,
      role: invitation.role,
      accountExists: (await this.deps.users.findByEmail(invitation.email)) !== null,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  /** Creates the invited account (its email counts as verified: the link reached it) and its membership. */
  async acceptWithNewAccount(input: AcceptInvitationInput, context: RequestContext): Promise<InvitationAcceptedResponse> {
    const invitation = await this.usable(input.token);
    if (!invitation) return this.reject(context, null, 'invalid');
    // Checked again inside the transaction; this read only spares the password hash on a request bound to fail.
    if (await this.deps.users.findByEmail(invitation.email)) throw accountExists();
    const passwordHash = await this.deps.passwords.hash(input.password);
    let result: AcceptResult;
    try {
      result = await this.deps.invitations.acceptWithNewAccount(
        invitation.id,
        { email: invitation.email, firstName: input.firstName, lastName: input.lastName, passwordHash },
        this.deps.now(),
      );
    } catch (error) {
      // A concurrent sign-up with this email, or a concurrent Principal change: nothing was saved.
      if (isUniqueConstraintViolation(error)) throw new HttpError(409, 'The invitation could not be accepted. Try again.');
      throw error;
    }
    return this.finish(result, invitation, context, true);
  }

  /** Adds the membership to the signed-in account, which must have the invited email. */
  /** `user` is the signed-in account, as loaded and checked by `requireAccess` for this request. */
  async join(user: User, token: string, context: RequestContext): Promise<InvitationAcceptedResponse> {
    const invitation = await this.usable(token);
    if (!invitation) return this.reject(context, user.id, 'invalid');
    if (user.email !== invitation.email) {
      this.deps.audit.record(context, {
        action: 'invitation.accept_failed',
        userId: user.id,
        workspaceId: invitation.workspaceId,
        meta: { invitationId: invitation.id, reason: 'email-mismatch' },
      });
      throw new HttpError(403, EMAIL_MISMATCH);
    }
    let result: AcceptResult;
    try {
      result = await this.deps.invitations.acceptForUser(invitation.id, user.id, this.deps.now());
    } catch (error) {
      if (isUniqueConstraintViolation(error)) throw new HttpError(409, 'The invitation could not be accepted. Try again.');
      throw error;
    }
    return this.finish(result, invitation, context, false);
  }

  private async usable(token: string): Promise<InvitationWithWorkspace | null> {
    const invitation = await this.deps.invitations.findByHash(sha256(token));
    if (invitation?.acceptedAt !== null || invitation.revokedAt !== null || invitation.sentAt === null) return null;
    return invitation.expiresAt > this.deps.now() ? invitation : null;
  }

  private reject(context: RequestContext, userId: string | null, reason: string): never {
    this.deps.audit.record(context, { action: 'invitation.accept_failed', userId, meta: { reason } });
    throw new HttpError(400, INVALID_INVITATION);
  }

  private finish(
    result: AcceptResult,
    invitation: Invitation,
    context: RequestContext,
    newAccount: boolean,
  ): InvitationAcceptedResponse {
    if (result.status === 'account-exists') throw accountExists();
    if (result.status === 'invalid') return this.reject(context, null, 'invalid');
    this.deps.audit.record(context, {
      action: 'invitation.accepted',
      userId: result.userId,
      workspaceId: result.workspaceId,
      meta: { invitationId: invitation.id, role: result.role, newAccount },
    });
    if (result.role === Role.PRINCIPAL) {
      this.deps.audit.record(context, {
        action: 'workspace.principal_transferred',
        userId: invitation.invitedById,
        workspaceId: result.workspaceId,
        meta: { fromUserId: result.change.previousPrincipalId, toUserId: result.userId },
      });
    }
    return { accepted: true, workspaceId: result.workspaceId };
  }
}
