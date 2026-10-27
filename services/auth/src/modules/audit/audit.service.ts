import type { Logger } from 'pino';
import { hmacSha256 } from '../../shared/utils/hashing.js';
import type { AuditRepository } from './audit.repository.js';
import type { AuditEntry } from './audit.types.js';

/** Where a request came from, passed from controllers into services that audit. */
export interface RequestContext {
  ip: string | null;
  log: Logger;
}

/** Raised when a security event could not be recorded; carries no request data. */
export class AuditWriteError extends Error {
  constructor(readonly action: AuditEntry['action']) {
    super('audit write failed');
    this.name = 'AuditWriteError';
  }
}

export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly fingerprintKey: string,
  ) {}

  /**
   * Fails closed: the request does not succeed unless its security event is stored. Only the
   * action and the error class are logged, never the entry, so no personal data reaches the logs.
   */
  async record(context: RequestContext, entry: Omit<AuditEntry, 'ip'>): Promise<void> {
    try {
      await this.repository.insert({ ...entry, ip: context.ip });
    } catch (error: unknown) {
      context.log.error(
        { action: entry.action, errorType: error instanceof Error ? error.name : typeof error },
        'audit write failed',
      );
      throw new AuditWriteError(entry.action);
    }
  }

  /**
   * Stable keyed digest of a sign-in address, so repeated attempts on one address can be correlated
   * without the audit log (append-only, kept indefinitely) storing the address itself.
   */
  emailFingerprint(email: string): string {
    return hmacSha256(this.fingerprintKey, `audit-email\n${email}`);
  }
}
