-- 0012_delivery_state
-- Records what the email provider did, so failed deliveries stop costing users their limits and a failed
-- re-send never destroys a working invitation. Additive; existing rows keep working.

-- 1. Sign-in codes the provider definitively did not send. Such a challenge is also revoked (never usable)
--    but no longer counts toward the user's send quota or resend cooldown. Ambiguous outcomes (timeouts,
--    network errors after the request may have reached the provider) are not marked and keep counting.
ALTER TABLE "email_otp_challenges" ADD COLUMN "delivery_failed_at" TIMESTAMPTZ(6);

-- 2. When the invitation email was accepted by the provider. An invitation is created unsent, can only be
--    previewed, listed or accepted once sent, and supersedes older invitations only at that moment.
ALTER TABLE "invitations" ADD COLUMN "sent_at" TIMESTAMPTZ(6);
-- Invitations created before this release were only kept pending when their email had been sent.
UPDATE "invitations" SET "sent_at" = "created_at" WHERE "sent_at" IS NULL;
