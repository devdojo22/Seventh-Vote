-- 0014_session_binding
-- Lets an access token be revoked together with the sign-in session it belongs to (logout, removal from the
-- session's workspace, refresh-token theft), instead of staying usable until it expires.
--
-- refresh_tokens.session_id identifies one sign-in: it is copied to every rotated token and kept across
-- workspace switches, and access tokens carry it as the "sid" claim. An access token is accepted only while
-- its session still has a live row. Existing rows each get their own session id. Access tokens issued before
-- this release have no "sid" claim and are rejected; the browser refreshes once and carries on.
ALTER TABLE "refresh_tokens" ADD COLUMN "session_id" UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "refresh_tokens" ALTER COLUMN "session_id" DROP DEFAULT;

CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");
