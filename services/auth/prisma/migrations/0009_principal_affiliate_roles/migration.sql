-- 0009_principal_affiliate_roles
-- Adopts the client-confirmed role model: Super Admin (users.is_super_admin), Principal and Affiliate.
-- CAO maps to PRINCIPAL and STAFF to AFFILIATE; the enum values are renamed in place, so every existing
-- membership keeps its row and meaning. Adds the Principal-granted dossier-edit right and invitations,
-- the only way an account now joins a workspace (public self-registration is removed).
--
-- Data change: before 0009, public self-registration made every new account CAO of the registration
-- workspace. Those roles were never designated by a super-admin, so memberships held by self-registered
-- accounts are demoted to AFFILIATE (not deleted). A Principal or super-admin should review them and
-- remove any that are not wanted. If a workspace still has more than one Principal afterwards, the
-- migration stops and changes nothing (it runs as one transaction): a super-admin must decide who the
-- Principal is; nothing is picked automatically. After demoting the others to STAFF, run
-- `npx prisma migrate resolve --rolled-back 0009_principal_affiliate_roles`, then `npx prisma migrate deploy`.

-- 1. Rename the roles (no row changes).
ALTER TYPE "Role" RENAME VALUE 'CAO' TO 'PRINCIPAL';
ALTER TYPE "Role" RENAME VALUE 'STAFF' TO 'AFFILIATE';
ALTER TABLE "memberships" ALTER COLUMN "role" SET DEFAULT 'AFFILIATE';

-- 2. Dossier-edit right, granted per Affiliate by the Principal. Off for everyone existing.
ALTER TABLE "memberships" ADD COLUMN "can_edit_dossiers" BOOLEAN NOT NULL DEFAULT false;

-- 3. Undo Principal roles granted by self-registration.
UPDATE "memberships" AS m
SET "role" = 'AFFILIATE', "updated_at" = CURRENT_TIMESTAMP
FROM "users" AS u
WHERE u."id" = m."user_id" AND u."self_registered" AND m."role" = 'PRINCIPAL';

-- 4. Exactly one Principal per workspace at a time. Stop rather than guess when data disagrees.
DO $$
DECLARE
  conflicting INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflicting
  FROM (SELECT "workspace_id" FROM "memberships" WHERE "role" = 'PRINCIPAL' GROUP BY "workspace_id" HAVING COUNT(*) > 1) AS w;
  IF conflicting > 0 THEN
    RAISE EXCEPTION '0009: % workspace(s) have more than one CAO (Principal) membership. Nothing was changed. Set all but one to STAFF, run prisma migrate resolve --rolled-back 0009_principal_affiliate_roles, then migrate again.', conflicting;
  END IF;
END $$;

CREATE UNIQUE INDEX "memberships_one_principal_per_workspace" ON "memberships"("workspace_id") WHERE "role" = 'PRINCIPAL';

-- 5. Invitations. Only a SHA-256 of the emailed token is stored.
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "can_edit_dossiers" BOOLEAN NOT NULL DEFAULT false,
    "token_hash" TEXT NOT NULL,
    "invited_by_id" UUID,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");
CREATE INDEX "invitations_workspace_id_created_at_idx" ON "invitations"("workspace_id", "created_at");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");

ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
