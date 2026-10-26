-- 0004_email_otp_mfa
-- Replaces authenticator-app (TOTP) MFA with codes emailed to the account address, and collects
-- first and last names separately at registration.
--
-- Deployment: the service runs `prisma migrate deploy` before it starts, so the new code never runs
-- against the old columns. Do not run this while an older build of the auth service is still serving:
-- that build reads the TOTP columns dropped below. Existing accounts keep their password, memberships
-- and roles; they confirm their email with a code at their next sign-in.

-- 1. Separate name fields for new registrations. The existing combined "name" is kept for older accounts.
ALTER TABLE "users"
  ADD COLUMN "first_name" TEXT,
  ADD COLUMN "last_name" TEXT;

-- 2. Email ownership. Null for every existing account: none has proven control of its address yet.
ALTER TABLE "users" ADD COLUMN "email_verified_at" TIMESTAMPTZ(6);

-- 3. Retire TOTP. The encrypted secrets are unusable without the authenticator flow, so they are not kept.
ALTER TABLE "users"
  DROP COLUMN "mfa_enabled",
  DROP COLUMN "mfa_last_step",
  DROP COLUMN "mfa_pending_secret",
  DROP COLUMN "mfa_secret";

-- 4. Emailed one-time codes, stored as keyed hashes only.
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'LOGIN');

CREATE TABLE "email_otp_challenges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_otp_challenges_user_id_purpose_created_at_idx" ON "email_otp_challenges"("user_id", "purpose", "created_at");
CREATE INDEX "email_otp_challenges_expires_at_idx" ON "email_otp_challenges"("expires_at");

ALTER TABLE "email_otp_challenges" ADD CONSTRAINT "email_otp_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
