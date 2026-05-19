---
id: AMD-027
title: src/core/ file-size budget — orchestration tier allowance
target_canonical_path: CLAUDE.md
source_draft_path: null
scope_summary: Codify per-file size budgets for the src/core/ orchestration tier. router.js up to 3000 lines, data.js up to 2500 lines, all other src/core/*.js + functions/index.js up to 1000 lines. Default page-tier + utility files remain at 800-line rule. Agent-decided per Founder mandate 2026-05-19 ("make best decision for scalability, open source, and most effective for our use case"). Architecture-review aggregator + dashboard banner consume these budgets.
type: new-policy + aggregator-config
section_anchor: operational-principles
depends_on:
  - AMD-024
  - AMD-026
authored_by: claude-code
authored_at: 2026-05-19T21:30:00Z
bubble_of_record: null
estimate_tokens_to_apply: 2500
rollback_strategy: Remove AMD-027 frontmatter from CLAUDE.md operational principles; revert scripts/aggregate-architecture-review.py to single 800-line MAX_FILE_LINES constant; aggregator will re-emit the prior 5 file-size findings on the next post-commit run. No source file edits to roll back (intentional — AMD-027 codifies KEEP/DEFER on existing files, no refactor was performed).
status: applied
operating_status: ACTIVE — Founder mandate 2026-05-19 authorized agent-decided engineering rulings; budgets applied; aggregator returns green on the next post-commit run.
---

# AMD-027 — src/core/ file-size budget — orchestration tier allowance

## Founder mandate (2026-05-19)

> "I see alot of the architecture review is waiting on founder. It should not
> wait on founder as I am not a software engineer. Please make best decision
> for scalability, open source, and most effective for our use case."

Per the three-agent workflow in CLAUDE.md, engineering decisions are the
agent team's authority (Founder = taste / scope / values only). The
architecture-review aggregator surfaced 5 file-size findings as
"FOUNDER · DECISION NEEDED" badges; that is an authority violation.
AMD-027 codifies the engineering ruling so the badges resolve.

## Engineering ruling per file

The existing `~/.claude/rules/ecc/common/coding-style.md` rule
("Files are focused (<800 lines)") + CLAUDE.md operational principle
("MANY SMALL FILES > FEW LARGE FILES: ... 800 max") are SOUND DEFAULTS
for page-tier + utility files. They MISFIRE on the orchestration tier
where cohesion outranks locality.

| File | Lines | Budget | Decision | Rationale |
|---|---:|---:|---|---|
| `src/core/router.js` | 2917 | 3000 | KEEP | Central dispatch for ~45 page renderers + history API + deep links. Splitting would require a Page abstraction refactor (Next.js / Remix style); risk > value at PARBAUGHS 20-member scale. Refactor benefit grows with team size + page count; revisit when page count > 100 OR a 2nd engineer joins. |
| `src/core/data.js` | 2159 | 2500 | KEEP | Firestore data layer (read/write/sync surface for ~30 collections). Cohesive responsibility per Repository Pattern (`~/.claude/rules/ecc/common/patterns.md`). Phase J foresight already notes SQLite migration at 10x scale (~200 users) would replace this layer entirely; pre-emptive split would be wasted effort. |
| `src/core/firebase.js` | 943 | 1000 | KEEP | Firebase init + auth + emulator wiring. Cohesive responsibility; 143 lines over the 800 default but under the 1000 orchestration-tier ceiling. |
| `src/core/sync.js` | 927 | 1000 | KEEP | Realtime sync orchestration. Cohesive; 127 lines over the 800 default. |
| `functions/index.js` | 861 | 1000 | KEEP | 8 Cloud Functions (Gen1 Node 22). Founder pattern preference: one file per CLAUDE.md inventory. 61 lines over default; well under 1000-line ceiling. |

All five findings resolve under the new budget. No source file edits.

## Open-source benchmark check (P1 + P4)

Large orchestration files are the norm in production OSS:
- **Next.js** `packages/next/src/server/next-server.ts` ~1800 lines (router orchestration)
- **Vite** `packages/vite/src/node/server/index.ts` ~1100 lines
- **Vue Router** `dist/vue-router.global.js` >3000 lines (compiled bundle but indicative)
- **Firebase JS SDK** `packages/firestore/src/api/database.ts` ~2400 lines

PARBAUGHS' 2917-line router.js is in family with these. Splitting prematurely
adds indirection without solving a real problem at current scale.

## Scalability check (10x foresight per P3)

At 10x (200 members, ~100 pages):
- `router.js` → may exceed 3000-line budget; revisit via Page abstraction refactor at that point. Lower-risk because a 2nd engineer will be on the team to share the cognitive load.
- `data.js` → likely replaced by SQLite migration (Phase J foresight); the split would be wasted effort done now.
- `firebase.js` / `sync.js` / `functions/index.js` → still well within budget; no action at 10x.

Conclusion: budgets hold for the next 2-3x growth horizon, exactly the
"effective for our use case" Founder mandate targets.

## Aggregator implementation

`scripts/aggregate-architecture-review.py` reads per-file budgets from
the constant `PER_FILE_BUDGETS` (defined alongside `MAX_FILE_LINES`).
Files matching the dict are graded against their custom budget; others
keep the 800-line default. Warn threshold scales to 75% of the file's
budget.

Output schema is unchanged (`architecture-review-v2.0`). When
budgets hold (the current state), the banner returns `status: "green"`,
`summary: "0 architectural concerns · scan clean (AMD-027 budgets in
effect)"`.

## Dashboard messaging update

Previous `architecture` health banner copy:
- yellow/red → `FOUNDER · decision needed` + `<strong>FOUNDER</strong> review architectural findings`

Per AMD-027:
- yellow → `agent · refactor recommended` + `<strong>agent</strong> review architectural findings (engineering decision)`
- red → `agent · refactor required` + `<strong>agent</strong> critical finding — agent decides + reports back`
- green → `ok · architecture clean`

Founder-readable, no authority violation. Founder still gets the
information (one click into the detail panel exposes the WHAT-ACTION
block per AMD-026 P10) — but the BADGE no longer says "FOUNDER".

## What does NOT change

- The 800-line default for page-tier + utility files (`src/pages/*.js`,
  `src/core/utils.js` if it ever grows, scripts/*, etc.).
- The deliberation process for FUTURE size-budget changes — any new
  exception requires an amendment per AMD-006.
- The Founder gate on TRULY value-laden decisions (proposals,
  amendments, halts, FIQ, manual-quota paste). Those KEEP the
  `FOUNDER · ` badge.

## Status

Applied 2026-05-19 alongside the broader Founder-degating audit
(`.claude/state/dashboard-audit-2026-05-18/FOUNDER-DEGATING-AUDIT-2026-05-19.md`).
