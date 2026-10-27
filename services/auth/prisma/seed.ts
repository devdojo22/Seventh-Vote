import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { PasswordHasher } from '../src/modules/authentication/password-hasher.js';
import { newPasswordSchema } from '../src/modules/authentication/authentication.validation.js';
import { emailSchema } from '../src/shared/validation/email.js';

const seedEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  SEED_ADMIN_EMAIL: emailSchema,
  SEED_ADMIN_PASSWORD: newPasswordSchema,
  SEED_WORKSPACE_SLUG: z.string().min(1).default('memphis-city-council'),
  SEED_WORKSPACE_NAME: z.string().min(1).default('Memphis City Council'),
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
  await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_EMAIL },
    update: { isSuperAdmin: true },
    create: { email: env.SEED_ADMIN_EMAIL, passwordHash, isSuperAdmin: true },
  });
  const workspace = await prisma.workspace.upsert({
    where: { slug: env.SEED_WORKSPACE_SLUG },
    update: {},
    create: { name: env.SEED_WORKSPACE_NAME, slug: env.SEED_WORKSPACE_SLUG },
  });
  process.stdout.write(
    `Seeded super-admin ${env.SEED_ADMIN_EMAIL} and workspace "${workspace.name}" (${workspace.slug}, ${workspace.id}).\n` +
      'Sign in with this email and password (a verification code is emailed), then designate the Principal.\n',
  );
} finally {
  await prisma.$disconnect();
}
