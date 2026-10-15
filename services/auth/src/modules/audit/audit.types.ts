/** Dotted event names written to auth.audit_log. */
export type AuditAction =
  | 'auth.register'
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.mfa_enrolled'
  | 'auth.mfa_failed'
  | 'auth.refresh_reuse';

/** Flat, non-secret context. Never put passwords, tokens, hashes or MFA secrets here. */
export type AuditMeta = Readonly<Record<string, string | number | boolean | null>>;

export interface AuditEntry {
  action: AuditAction;
  userId: string | null;
  ip: string | null;
  meta?: AuditMeta;
}
