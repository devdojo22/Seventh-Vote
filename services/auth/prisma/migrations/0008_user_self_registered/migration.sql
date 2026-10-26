-- 0008_user_self_registered
-- Marks accounts created by public self-registration, so the cleanup job can delete the ones that never
-- verify their email. A durable marker is needed: email_verified_at is also NULL for the seeded admin and
-- for every account created before email verification existed (0004), and those must never be deleted.
-- Existing rows default to false, so no existing account becomes eligible for automatic deletion.
ALTER TABLE "users" ADD COLUMN "self_registered" BOOLEAN NOT NULL DEFAULT false;
