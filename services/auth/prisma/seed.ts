import { PrismaClient, type Prisma } from '@prisma/client';
import { z } from 'zod';
import { PasswordHasher } from '../src/modules/authentication/password-hasher.js';
import { newPasswordSchema } from '../src/modules/authentication/authentication.validation.js';
import { actionVoteRuleSchema } from '../src/modules/workspaces/workspace.validation.js';
import { emailSchema } from '../src/shared/validation/email.js';

/**
 * The Memphis City Council's Rules of Procedure for action types other than ordinary passage. Migration 0019 sets
 * these on an existing workspace, but on a fresh database it runs before this seed creates the workspace, so the
 * seed sets them too. Keep the two in sync.
 */
const MEMPHIS_WORKSPACE_SLUG = 'memphis-city-council';
const MEMPHIS_VOTE_ACTIONS = [
  { id: 'censure', label: 'Censure of a member', threshold: { type: 'count', needed: 9 },
    note: 'Rule 49 · confirmed', verified: true },
  { id: 'rules_amendment', label: 'Amend Rules of Procedure', threshold: { type: 'count', needed: 7 },
    note: 'Rule 53 · confirmed; seven days’ written notice also required', verified: true },
  { id: 'appeal_chair', label: 'Appeal Chair ruling', threshold: { type: 'present_majority' },
    note: 'Rule 27 · majority of members present', verified: true },
  { id: 'defer_drop', label: 'Defer or drop item', threshold: { type: 'present_majority' },
    note: 'Rule 41 · majority of members present', verified: true },
  { id: 'order_business', label: 'Change order of business', threshold: { type: 'present_majority' },
    note: 'Rule 29 · majority present, or Chair discretion', verified: true },
  { id: 'consent', label: 'Consent-routed item', threshold: { type: 'consent' },
    note: 'Rule 45 · one objection removes the item from consent', verified: true },
] satisfies Prisma.InputJsonObject[];
// The same check a save through the API makes, so the seed can't store a rule the service would reject.
z.array(actionVoteRuleSchema).parse(MEMPHIS_VOTE_ACTIONS);

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
  // Only while no action types are saved, so a re-run keeps any the Principal has saved.
  const noActionsSaved = Array.isArray(workspace.voteActions) && workspace.voteActions.length === 0;
  if (workspace.slug === MEMPHIS_WORKSPACE_SLUG && noActionsSaved) {
    await prisma.workspace.update({ where: { id: workspace.id }, data: { voteActions: MEMPHIS_VOTE_ACTIONS } });
  }
  process.stdout.write(
    `Seeded super-admin ${env.SEED_ADMIN_EMAIL} and workspace "${workspace.name}" (${workspace.slug}, ${workspace.id}).\n` +
      'Sign in with this email and password (a verification code is emailed), then designate the Principal.\n',
  );
} finally {
  await prisma.$disconnect();
}
