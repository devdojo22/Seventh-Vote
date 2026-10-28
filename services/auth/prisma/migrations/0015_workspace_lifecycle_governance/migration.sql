-- 0015_workspace_lifecycle_governance
-- Client-confirmed workspace lifecycle and Principal governance:
-- 1. Archiving: a reversible freeze. archived_at is set by a super-admin; members lose access while it is set,
--    and nothing (memberships, invitations, audit history) is removed, so restoring clears it and nothing else.
-- 2. Principal transfer: what happens to the previous Principal is an explicit choice, REMOVE (the default) or
--    KEEP_AS_AFFILIATE. A Principal invitation records the choice and it is applied when the invitation is
--    accepted. NULL on a Principal invitation (including those created before this migration) means REMOVE.
-- 3. A super-admin is a platform operator, never a workspace member: enforced by triggers on both tables.
-- 4. A workspace that has a Principal can never be left without one: checked at commit, so a transfer that
--    removes or demotes the old Principal and promotes the new one in the same transaction passes, and so does
--    deleting the workspace itself.
--
-- Data check: if a super-admin already holds a membership, the migration stops and changes nothing (it runs as
-- one transaction): an operator decides whether the account stays a super-admin (remove its memberships) or a
-- member (clear is_super_admin). Then run
-- `npx prisma migrate resolve --rolled-back 0015_workspace_lifecycle_governance`, then `npx prisma migrate deploy`.

-- 1. Archive marker. Additive: every existing workspace stays active.
ALTER TABLE "workspaces" ADD COLUMN "archived_at" TIMESTAMPTZ(6);

-- 2. Previous-Principal outcome, only meaningful on Principal invitations.
CREATE TYPE "PreviousPrincipalOutcome" AS ENUM ('REMOVE', 'KEEP_AS_AFFILIATE');
ALTER TABLE "invitations" ADD COLUMN "previous_principal_outcome" "PreviousPrincipalOutcome";
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_previous_principal_outcome_check"
  CHECK ("role" = 'PRINCIPAL' OR "previous_principal_outcome" IS NULL);

-- 3. Super-admins hold no workspace role. Stop rather than guess when data disagrees.
DO $$
DECLARE
  conflicting INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflicting
  FROM "memberships" AS m JOIN "users" AS u ON u."id" = m."user_id"
  WHERE u."is_super_admin";
  IF conflicting > 0 THEN
    RAISE EXCEPTION '0015: % membership(s) belong to super-admin accounts. Nothing was changed. Remove those memberships or clear users.is_super_admin, run prisma migrate resolve --rolled-back 0015_workspace_lifecycle_governance, then migrate again.', conflicting;
  END IF;
END $$;

CREATE FUNCTION "memberships_reject_super_admin"() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "id" = NEW."user_id" AND "is_super_admin") THEN
    RAISE EXCEPTION 'A super-admin account cannot hold a workspace membership' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "memberships_reject_super_admin"
  BEFORE INSERT OR UPDATE OF "user_id" ON "memberships"
  FOR EACH ROW EXECUTE FUNCTION "memberships_reject_super_admin"();

CREATE FUNCTION "users_reject_super_admin_with_memberships"() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "memberships" WHERE "user_id" = NEW."id") THEN
    RAISE EXCEPTION 'An account with workspace memberships cannot become a super-admin' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "users_reject_super_admin_with_memberships"
  BEFORE UPDATE OF "is_super_admin" ON "users"
  FOR EACH ROW WHEN (NEW."is_super_admin" AND NOT OLD."is_super_admin")
  EXECUTE FUNCTION "users_reject_super_admin_with_memberships"();

-- 4. A workspace keeps its Principal. Deferred to commit so a transfer can remove or demote the old Principal
--    before promoting the new one (the partial unique index allows only one at a time).
CREATE FUNCTION "memberships_keep_principal"() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path FROM CURRENT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "workspaces" WHERE "id" = OLD."workspace_id")
     AND NOT EXISTS (
       SELECT 1 FROM "memberships" WHERE "workspace_id" = OLD."workspace_id" AND "role" = 'PRINCIPAL'
     ) THEN
    RAISE EXCEPTION 'A workspace cannot be left without a Principal' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER "memberships_keep_principal"
  AFTER DELETE OR UPDATE OF "role" ON "memberships"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (OLD."role" = 'PRINCIPAL')
  EXECUTE FUNCTION "memberships_keep_principal"();
