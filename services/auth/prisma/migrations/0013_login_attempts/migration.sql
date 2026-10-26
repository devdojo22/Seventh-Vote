-- 0013_login_attempts
-- Per-account limit on password checks at sign-in, shared by every auth instance. Additive.
--
-- One row per sign-in address that recently had attempts, keyed by the SHA-256 of the normalized address, so
-- addresses with and without an account are counted alike and no address is stored in plain text. A fixed
-- window: the first attempt after `window_started_at` + the window starts a new one. A correct password
-- deletes the row; the cleanup job deletes rows whose window has passed.
CREATE TABLE "login_attempts" (
    "key_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL,
    "window_started_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("key_hash")
);

CREATE INDEX "login_attempts_window_started_at_idx" ON "login_attempts"("window_started_at");
