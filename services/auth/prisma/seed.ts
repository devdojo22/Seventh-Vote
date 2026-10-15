// Creates the first super-admin and the pilot workspace (idempotent). Run with `npm run seed`.
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';
import { PasswordHasher } from '../src/modules/authentication/password-hasher.js';
import { newPasswordSchema } from '../src/modules/authentication/authentication.validation.js';

const seedEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  SEED_ADMIN_EMAIL: z
    .string()
    .email()
    .transform((value) => value.toLowerCase()),
  SEED_ADMIN_PASSWORD: newPasswordSchema,
  SEED_WORKSPACE_SLUG: z.string().min(1).default('pilot-city'),
  SEED_WORKSPACE_NAME: z.string().min(1).default('Pilot City'),
});

const parsed = seedEnvironmentSchema.safeParse(process.env);
if (!parsed.success) {
  const problems = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  process.stderr.write(`Seed configuration is invalid (set these in .env):\n${problems}\n`);
  process.exit(1);
}
const env = parsed.data;

const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
try {
  const passwordHash = await new PasswordHasher().hash(env.SEED_ADMIN_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: { isSuperAdmin: true },
    create: { email: env.SEED_ADMIN_EMAIL, passwordHash, isSuperAdmin: true },
  });
  const workspace = await prisma.workspace.upsert({
    where: { slug: env.SEED_WORKSPACE_SLUG },
    update: {},
    create: { name: env.SEED_WORKSPACE_NAME, slug: env.SEED_WORKSPACE_SLUG },
  });
  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
    update: { role: Role.CAO },
    create: { userId: user.id, workspaceId: workspace.id, role: Role.CAO },
  });
  process.stdout.write(
    `Seeded ${env.SEED_ADMIN_EMAIL} as CAO of "${env.SEED_WORKSPACE_NAME}" (${workspace.id}). Sign in to enrol MFA.\n`,
  );
} finally {
  await prisma.$disconnect();
}
