import { PrismaClient } from '@prisma/client';

/** The URL comes from validated config rather than Prisma reading process.env on its own. */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: databaseUrl });
}

export async function checkDatabaseConnection(prisma: PrismaClient): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
