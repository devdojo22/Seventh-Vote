import type { Prisma, PrismaClient } from '@prisma/client';
import type { AuditEntry } from './audit.types.js';

export interface AuditRepository {
  insert(entry: AuditEntry): Promise<void>;
}


export async function insertAuditEntry(
  client: PrismaClient | Prisma.TransactionClient,
  { action, userId, workspaceId = null, ip, meta }: AuditEntry,
): Promise<void> {
  await client.auditLog.create({
    data: { action, userId, workspaceId, ip, ...(meta === undefined ? {} : { meta }) },
  });
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  insert(entry: AuditEntry): Promise<void> {
    return insertAuditEntry(this.prisma, entry);
  }
}
