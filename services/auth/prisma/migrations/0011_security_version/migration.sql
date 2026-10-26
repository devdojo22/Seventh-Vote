-- 0011_security_version
-- Exact invalidation of sessions after a password change or reset, replacing the whole-second comparison of
-- JWT iat with password_changed_at (a token issued earlier in the same second used to survive the change).
--
-- users.security_version is incremented in the same transaction as every password change or reset.
-- Access tokens and sign-in code tokens carry the version they were issued under ("sv" claim), and each
-- refresh session records it; any of them stops working once the account's version has moved on.
--
-- Additive only. Existing users and refresh sessions both start at 0, so every live session stays valid.
-- Access tokens and sign-in code tokens issued before this release have no "sv" claim and are rejected:
-- the browser silently refreshes its access token once; a sign-in left half-way must be started again.
ALTER TABLE "users" ADD COLUMN "security_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "refresh_tokens" ADD COLUMN "security_version" INTEGER NOT NULL DEFAULT 0;
