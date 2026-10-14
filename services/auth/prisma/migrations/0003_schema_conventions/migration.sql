-- 0003_schema_conventions
-- Brings the auth schema to the conventions documented at the top of schema.prisma:
--   timestamptz(6) everywhere, updated_at on mutable tables, every FK indexed,
--   audit_log linked to users/workspaces with ON DELETE SET NULL, sweep indexes on expires_at.

-- 1. Timestamps -> timestamptz(6). Existing values are interpreted as UTC (the server runs in UTC).
ALTER TABLE "users"
  ALTER COLUMN "created_at"          TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "password_changed_at" TYPE TIMESTAMPTZ(6) USING "password_changed_at" AT TIME ZONE 'UTC';

ALTER TABLE "workspaces"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "memberships"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ(6) USING "expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "revoked_at" TYPE TIMESTAMPTZ(6) USING "revoked_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "password_reset_tokens"
  ALTER COLUMN "expires_at" TYPE TIMESTAMPTZ(6) USING "expires_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "used_at"    TYPE TIMESTAMPTZ(6) USING "used_at" AT TIME ZONE 'UTC',
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

ALTER TABLE "audit_log"
  ALTER COLUMN "created_at" TYPE TIMESTAMPTZ(6) USING "created_at" AT TIME ZONE 'UTC';

-- 2. updated_at on mutable tables. Backfill from created_at, then drop the default:
--    Prisma's @updatedAt sets the value client-side on every write.
ALTER TABLE "users"       ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "workspaces"  ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "memberships" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "users"       SET "updated_at" = "created_at";
UPDATE "workspaces"  SET "updated_at" = "created_at";
UPDATE "memberships" SET "updated_at" = "created_at";
ALTER TABLE "users"       ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "workspaces"  ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "memberships" ALTER COLUMN "updated_at" DROP DEFAULT;

-- 3. audit_log gains a workspace scope and real relations that survive deletes.
ALTER TABLE "audit_log" ADD COLUMN "workspace_id" UUID;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. refresh_tokens.workspace_id becomes a real FK (null when the workspace goes away).
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_workspace_id_fkey"
  FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Indexes: every FK, plus sweep and query paths.
CREATE INDEX "memberships_workspace_id_idx"             ON "memberships"("workspace_id");
CREATE INDEX "refresh_tokens_workspace_id_idx"          ON "refresh_tokens"("workspace_id");
CREATE INDEX "refresh_tokens_expires_at_idx"            ON "refresh_tokens"("expires_at");
CREATE INDEX "password_reset_tokens_expires_at_idx"     ON "password_reset_tokens"("expires_at");
CREATE INDEX "audit_log_user_id_idx"                    ON "audit_log"("user_id");
CREATE INDEX "audit_log_action_idx"                     ON "audit_log"("action");
CREATE INDEX "audit_log_workspace_id_created_at_idx"    ON "audit_log"("workspace_id", "created_at");
