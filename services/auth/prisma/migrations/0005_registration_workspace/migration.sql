-- 0005_registration_workspace
-- Provisions the canonical Memphis City Council workspace that self-registration joins
-- (REGISTRATION_WORKSPACE_SLUG, default "memphis-city-council"). It is identified by its unique slug;
-- the id is generated here, so no environment-specific identifier is hard-coded anywhere.
--
-- Idempotent: an existing workspace with this slug (e.g. created by the seed) is reused unchanged.
-- Data only: no schema change, and no user, membership or role is touched.
INSERT INTO "workspaces" ("id", "name", "slug", "updated_at")
VALUES (gen_random_uuid(), 'Memphis City Council', 'memphis-city-council', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
