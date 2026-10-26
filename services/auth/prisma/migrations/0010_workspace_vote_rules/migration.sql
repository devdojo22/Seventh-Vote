-- 0010_workspace_vote_rules
-- Per-workspace voting configuration, set by the workspace's Principal (or a super-admin): the size of the
-- voting body, the votes needed to pass, and the quorum. Nothing is hardcoded: every workspace starts
-- unconfigured (all three NULL) and the rules are entered through PUT /auth/workspaces/:id/settings.
-- Additive only: existing rows are untouched.
ALTER TABLE "workspaces"
  ADD COLUMN "vote_body_size" INTEGER,
  ADD COLUMN "vote_majority_threshold" INTEGER,
  ADD COLUMN "vote_quorum" INTEGER;

-- Either unconfigured, or all three set and consistent with the body size.
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_vote_rules_check" CHECK (
  ("vote_body_size" IS NULL AND "vote_majority_threshold" IS NULL AND "vote_quorum" IS NULL)
  OR (
    "vote_body_size" BETWEEN 1 AND 1000
    AND "vote_majority_threshold" BETWEEN 1 AND "vote_body_size"
    AND "vote_quorum" BETWEEN 1 AND "vote_body_size"
  )
);
