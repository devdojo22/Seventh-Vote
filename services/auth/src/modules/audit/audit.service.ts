import type { Logger } from 'pino';
import type { AuditRepository } from './audit.repository.js';
import type { AuditEntry } from './audit.types.js';

/** Where a request came from, passed from controllers into services that audit. */
export interface RequestContext {
  ip: string | null;
  log: Logger;
}

export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  /** Fire-and-forget: a failed audit write is logged but never fails the request. */
  record(context: RequestContext, entry: Omit<AuditEntry, 'ip'>): void {
    this.repository.insert({ ...entry, ip: context.ip }).catch((error: unknown) => {
      context.log.error({ err: error, action: entry.action }, 'audit write failed');
    });
  }
}
