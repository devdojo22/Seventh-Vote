/** Dotted event names written to auth.audit_log. */
export type AuditAction =
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.login_throttled'
  | 'auth.otp_sent'
  | 'auth.otp_send_failed'
  | 'auth.email_verified'
  | 'auth.mfa_failed'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_email_failed'
  | 'auth.password_reset'
  | 'auth.password_reset_failed'
  | 'auth.password_changed'
  | 'auth.password_change_failed'
  | 'auth.refresh_reuse'
  | 'auth.logout'
  | 'auth.workspace_switched'
  | 'admin.workspace_access'
  | 'workspace.created'
  | 'workspace.settings_updated'
  | 'workspace.principal_transferred'
  | 'invitation.created'
  | 'invitation.email_failed'
  | 'invitation.cancelled_while_sending'
  | 'invitation.revoked'
  | 'invitation.accepted'
  | 'invitation.accept_failed'
  | 'membership.updated'
  | 'membership.removed';

/** Flat, non-secret context. Never put passwords, tokens, hashes or one-time codes here. */
export type AuditMeta = Readonly<Record<string, string | number | boolean | null>>;

export interface AuditEntry {
  action: AuditAction;
  userId: string | null;
  /** The workspace the event happened in, taken only from verified server-side state; null when none applies. */
  workspaceId?: string | null;
  ip: string | null;
  meta?: AuditMeta;
}
