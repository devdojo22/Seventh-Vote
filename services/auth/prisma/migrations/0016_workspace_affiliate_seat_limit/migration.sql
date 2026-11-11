-- 0016_workspace_affiliate_seat_limit
-- Per-workspace Affiliate seat limit, set by a super-admin.
-- Seats used = Affiliate memberships + pending (unaccepted, unrevoked, unexpired) Affiliate invitations; the
-- Principal never takes a seat. NULL means unlimited. Lowering the limit below current usage removes nothing:
-- it only blocks new invitations and acceptances until usage drops (enforced by the auth service under the
-- workspace advisory lock).
--
-- Additive only: the column is nullable with no default, so every existing and new workspace stays unlimited.
-- To roll back: `ALTER TABLE "workspaces" DROP COLUMN "seat_limit";` (drops the CHECK with it), then
-- `npx prisma migrate resolve --rolled-back 0016_workspace_affiliate_seat_limit`.

ALTER TABLE "workspaces" ADD COLUMN "seat_limit" INTEGER;
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_seat_limit_check"
  CHECK ("seat_limit" IS NULL OR "seat_limit" BETWEEN 0 AND 500);
