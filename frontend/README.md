# Seventh Vote — Frontend

A council-rehearsal app: explore public-record dossiers for each council member, run an agenda item through a deterministic scoring engine, and prepare for one-on-one conversations.

This is a **frontend-only** app. There is no backend, API, database, or authentication. All data is a typed static snapshot bundled into the app, and all computation runs in the browser.

## Stack

- React 19, TypeScript (strict), Vite 6
- Tailwind CSS v4
- React Router (browser routes)
- Zustand for application state
- React Hook Form + Zod for forms and data validation
- ESLint (type-aware) and Prettier

## Scripts

```bash
npm install
npm run dev          # dev server
npm run build        # type-check + production build → dist/
npm run preview      # serve the production build
npm run typecheck    # tsc -b
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
```

## Routes

| Path       | Page                                             |
| ---------- | ------------------------------------------------ |
| `/`        | Council Chamber: member cards and dossier drawer |
| `/session` | Council Session: run an agenda item, see results |
| `/prep`    | 1-on-1 Prep: rehearsal brief for one member      |
| `/method`  | Methodology, sources, roadmap                    |

Unknown paths redirect to `/`. A static host needs an SPA fallback that serves `index.html` for these paths (Vite's dev and preview servers already do).

## Architecture

```
src/
  app/         router, layout (top bar, nav), global CSS
  components/  shared UI: form fields, radio pills, stance pill, source links
  data/        typed static data and rules: members, council config, voting rules, ...
  features/    chamber, session, prep, methodology (pages, forms, form schemas)
  lib/         pure TypeScript: member helpers and the simulation services
  stores/      Zustand stores
  types/       domain types (member types are inferred from the Zod schema)
```

Data flows one way: `data/` → `stores/council-store` → pure services in `lib/simulation` → feature pages. Components never contain business data or rules.

### Data (`src/data`)

- `members.ts`: the 13 dossiers. Every member, key vote, and quote has a stable string `id` (for example `rhonda-logan`, `rhonda-logan-vote-1`). The list is validated at load by `memberListSchema` in `types/member.ts`.
- `voting-rules.ts`: one entry per procedural action, with its basis (`full` membership, `present` majority, or `consent`), the votes needed, whether the rule is verified, and the rule citation.
- `council.ts`: seat count, term, officers fallback, snapshot labels, and procedural copy.
- `rehearsal-rules.ts`: snapshot-specific scoring exceptions (the Ordinance 5982 sponsors and Logan's statement, members with no direct voice, thin-record members, bloc watch), keyed by member id.
- `agenda.ts`, `stances.ts`, `form-options.ts`, `session-defaults.ts`, `methodology.ts`: categories and keyword hints, the five stance levels, form options, defaults, and page copy.

### Simulation services (`src/lib/simulation`)

Pure functions with no React or store access:

- `scoring.ts`: scores one member from −2 to +2 against an agenda item, with reasoning and citations.
- `thresholds.ts`: derives the passage threshold from a rule and attendance.
- `pivotal.ts`: goal counts, movability, pivotal members, outreach ranking, tally segments.
- `analyze-session.ts`: one `SessionAnalysis` result that the results UI and the text brief both use.
- `prep-brief.ts`, `text-brief.ts`: the 1-on-1 brief and the downloadable brief.

### Voting rules

| Action                           | Passes with                |
| -------------------------------- | -------------------------- |
| Ordinary ordinance or resolution | 7 of 13 (unverified)       |
| Censure                          | 9 of 13 (Rule 49)          |
| Amend Rules of Procedure         | 7 of 13 (Rule 53)          |
| Appeal Chair / Defer / Order     | Majority of those present  |
| Consent-routed item              | Any one member can pull it |

When the ask is **Oppose**, the target is the number of votes that makes passage impossible: `denominator − needed + 1` (for example 5 to block a censure). On full-membership rules, absent and recused members cannot vote yes, so they count toward a block. On present-majority rules only members present count. If no one is present, the result is reported as unreachable and the form refuses to run.

### Stores (`src/stores`)

| Store       | Holds                                                                |
| ----------- | -------------------------------------------------------------------- |
| `app`       | toast, open dossier drawer                                           |
| `council`   | read-only members, config, and rules (the seam for a future backend) |
| `session`   | the last session input; results are derived from it                  |
| `prep`      | prep form values, the loaded session context, the built brief        |
| `workspace` | "Your call" private stance reads                                     |

Prep uses the same session settings as the loaded session, so a member's prep read matches their session read for the same item.

### "Your call" privacy constraint

"Your call" is a user's private read of an elected official's stance. It lives only in the in-memory `workspace` store: never persisted, logged, sent, or exported, and gone on reload. Do not add storage middleware to it.

## Connecting a backend later

- Replace the initializer of `stores/council-store.ts` with a fetch and keep the same state shape.
- Validate API responses with `memberListSchema` from `types/member.ts`.
- The simulation services take plain data and have no dependency on React or the stores.

## Current limitations

- Data is a static snapshot (Sep 16, 2026); nothing is fetched or saved. Session inputs, results, and prep briefs are lost on reload.
- The Ordinance 5982 scoring exceptions are snapshot-specific and live in `data/rehearsal-rules.ts`.
- The ordinary-passage threshold (7 of 13) is an unverified working inference; the Charter governs it.
- Scoring is keyword-based over dossier text and is a rehearsal aid, not a prediction.
- Fonts load from Google Fonts, which is an external request.
- There are no automated tests.
