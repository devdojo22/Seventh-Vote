import type { PrismaClient } from '@prisma/client';
import type { AuditEntry } from './audit.types.js';

export interface AuditRepository {
  insert(entry: AuditEntry): Promise<void>;
}

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async insert({ action, userId, ip, meta }: AuditEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: { action, userId, ip, ...(meta === undefined ? {} : { meta }) },
    });
  }
}
