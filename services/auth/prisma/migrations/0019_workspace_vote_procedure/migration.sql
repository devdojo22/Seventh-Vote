-- 0019_workspace_vote_procedure
-- M5 step 1: each workspace's full Rules of Procedure for votes, on top of the existing three numbers
-- (vote_body_size, vote_majority_threshold = ordinary passage, vote_quorum), which are unchanged.
--   vote_actions    JSON array of rules for the other action types; shape validated by the auth service.
--   vote_recusal    'excluded' | 'present': how a recused member counts.
--   vote_tie_break  'fails' | 'chair' | 'passes': a tie on a majority-of-present vote.
--
-- Additive: the defaults ('[]', 'excluded', 'fails') mean "ordinary passage only", which is every workspace's
-- behaviour so far. The Memphis City Council workspace then gets its Rules of Procedure, moved here from the
-- frontend's data/voting-rules.ts.
-- To roll back: `ALTER TABLE "workspaces" DROP COLUMN "vote_actions", DROP COLUMN "vote_recusal",
-- DROP COLUMN "vote_tie_break";` (drops the CHECKs with them), then
-- `npx prisma migrate resolve --rolled-back 0019_workspace_vote_procedure`.

ALTER TABLE "workspaces"
  ADD COLUMN "vote_actions" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "vote_recusal" TEXT NOT NULL DEFAULT 'excluded',
  ADD COLUMN "vote_tie_break" TEXT NOT NULL DEFAULT 'fails';

ALTER TABLE "workspaces"
  ADD CONSTRAINT "workspaces_vote_actions_check" CHECK (jsonb_typeof("vote_actions") = 'array'),
  ADD CONSTRAINT "workspaces_vote_recusal_check" CHECK ("vote_recusal" IN ('excluded', 'present')),
  ADD CONSTRAINT "workspaces_vote_tie_break_check" CHECK ("vote_tie_break" IN ('fails', 'chair', 'passes'));

UPDATE "workspaces"
SET "vote_actions" = '[
  {"id": "censure", "label": "Censure of a member", "threshold": {"type": "count", "needed": 9},
   "note": "Rule 49 · confirmed", "verified": true},
  {"id": "rules_amendment", "label": "Amend Rules of Procedure", "threshold": {"type": "count", "needed": 7},
   "note": "Rule 53 · confirmed; seven days’ written notice also required", "verified": true},
  {"id": "appeal_chair", "label": "Appeal Chair ruling", "threshold": {"type": "present_majority"},
   "note": "Rule 27 · majority of members present", "verified": true},
  {"id": "defer_drop", "label": "Defer or drop item", "threshold": {"type": "present_majority"},
   "note": "Rule 41 · majority of members present", "verified": true},
  {"id": "order_business", "label": "Change order of business", "threshold": {"type": "present_majority"},
   "note": "Rule 29 · majority present, or Chair discretion", "verified": true},
  {"id": "consent", "label": "Consent-routed item", "threshold": {"type": "consent"},
   "note": "Rule 45 · one objection removes the item from consent", "verified": true}
]'::jsonb
WHERE "slug" = 'memphis-city-council';
