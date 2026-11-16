-- 0017_membership_approve_dossiers
-- Per-membership "approve dossiers" grant, set by the Principal (or a super-admin) for selected Affiliates.
-- The Principal and super-admins always have the permission; for an Affiliate it is this flag
-- (see permissionsFor()). Django reads it as permissions.approveDossiers from GET /auth/me/access.
--
-- Additive only: NOT NULL with DEFAULT false, so every existing and new membership starts without it.
-- To roll back: `ALTER TABLE "memberships" DROP COLUMN "can_approve_dossiers";`, then
-- `npx prisma migrate resolve --rolled-back 0017_membership_approve_dossiers`.

ALTER TABLE "memberships" ADD COLUMN "can_approve_dossiers" BOOLEAN NOT NULL DEFAULT false;
