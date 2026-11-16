-- 0018_invitation_approve_dossiers
-- Lets a Principal grant "approve dossiers" when inviting an Affiliate, as already possible for "edit dossiers".
-- Copied to memberships.can_approve_dossiers (migration 0017) when the invitation is accepted.
--
-- Additive only: NOT NULL with DEFAULT false, so every existing pending invitation keeps today's behaviour.
-- To roll back: `ALTER TABLE "invitations" DROP COLUMN "can_approve_dossiers";`, then
-- `npx prisma migrate resolve --rolled-back 0018_invitation_approve_dossiers`.

ALTER TABLE "invitations" ADD COLUMN "can_approve_dossiers" BOOLEAN NOT NULL DEFAULT false;
