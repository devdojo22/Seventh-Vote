// Creates the first super-admin and the pilot workspace (idempotent).
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env');
  process.exit(1);
}
const email = SEED_ADMIN_EMAIL.toLowerCase();
const slug = process.env.SEED_WORKSPACE_SLUG ?? 'pilot-city';
const name = process.env.SEED_WORKSPACE_NAME ?? 'Pilot City';

const user = await prisma.user.upsert({
  where: { email },
  update: { isSuperAdmin: true },
  create: { email, passwordHash: await bcrypt.hash(SEED_ADMIN_PASSWORD, 12), isSuperAdmin: true },
});
const workspace = await prisma.workspace.upsert({ where: { slug }, update: {}, create: { name, slug } });
await prisma.membership.upsert({
  where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } },
  update: { role: 'CAO' },
  create: { userId: user.id, workspaceId: workspace.id, role: 'CAO' },
});
console.log(`Seeded ${email} as CAO of "${name}" (${workspace.id}). Sign in to enrol MFA.`);
await prisma.$disconnect();
