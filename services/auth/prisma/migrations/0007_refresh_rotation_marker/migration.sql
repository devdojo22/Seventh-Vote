-- 0007_refresh_rotation_marker
-- Distinguishes a refresh token that was exchanged at /refresh (presenting it again is theft, so the
-- whole session family is revoked) from one revoked by logout, password change or workspace switch
-- (presenting it again is just an expired session). Without this, any old device refreshing after a
-- password change revoked the user's new sessions too.
-- Existing revoked rows default to false: they are treated as expired rather than as theft signals.
ALTER TABLE "refresh_tokens" ADD COLUMN "rotated" BOOLEAN NOT NULL DEFAULT false;
