-- 0006_session_persistence
-- Records the "Keep me signed in on this device" choice on each refresh token so rotation keeps it.
-- Existing sessions were all issued as 7-day persistent cookies, so they default to true.
ALTER TABLE "refresh_tokens" ADD COLUMN "persistent" BOOLEAN NOT NULL DEFAULT true;
