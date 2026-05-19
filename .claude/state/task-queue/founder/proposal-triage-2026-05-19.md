# 33-proposal triage — Founder batch-decision packet — 2026-05-19

Per Founder direction 2026-05-19: triage 33 deferred proposals.

## Methodology

Read all files under `.claude/state/proposals/ship-readiness-deferred/` (PROP-005 through PROP-013, 9 files). Verified actual count vs Founder's "33" by full-directory listing. The 9 stub files in `ship-readiness-deferred/` are **scanner metadata only** (criteria_failed: frontmatter_sparse / token_cost_methodology_absent / cross_cutting_dependency); the proposal CONTENT lives in `.claude/state/proposals/approved/PROP-{005-013}-*.md` where each was Founder-approved 2026-05-14 (decisions-log.ndjson). For each, cross-referenced what's already on disk: skills installed (~/.claude/skills/), scripts authored (scripts/visual-audit/), substrate docs (docs/agents/), round-trip blocks wired (tests/round-trip-test.py), AMDs that absorbed scope (AMD-018, AMD-026), and shipped dashboard work (CONSOLIDATION.md sessions 1+2). Classification reflects WHAT THE PROPOSAL WAS TRYING TO ACHIEVE vs WHAT IS NOW IMPLEMENTED — independent of whether the proposal file has been formally moved to `shipped/`.

## Counts

**ACTUAL deferred count: 9** (not 33 as Founder estimate). All 9 are Founder-APPROVED 2026-05-14 in `.claude/state/proposals/decisions-log.ndjson` — the "deferred" label refers to the apply-decisions auto-application pipeline rejecting them on frontmatter sparseness, NOT Founder declining them. **All deliverables are tracked as either SHIPPED or PARTIALLY-SHIPPED.**

- STILL-RELEVANT (small remaining gap): **2** (PROP-006, PROP-010 admin moves)
- OBSOLETED-BY (substrate already operative or absorbed): **7**

## Triage interpretation

These 9 proposals are NOT a backlog of un-done work. They are a backlog of un-CLOSED administrative moves. The substrate they propose IS operative (skills installed, scripts on disk, gates in round-trip-test.py, design-bot protocol active, dashboard work using all of it). What remains is the formal `approved/ → shipped/` move + minor wiring gaps.

The cleanest path is NOT to relitigate each — it's to **bulk-archive** seven of them (OBSOLETED-BY) and **finish two small admin tasks** (STILL-RELEVANT).

## Batch A — STILL-RELEVANT (2 proposals)

| PROP | Title | Scope still open | Recommendation | Founder action |
|---|---|---|---|---|
| PROP-006 | Author outcome-vs-task skill (engineering-mindset gate) | Skill content lives in `.claude/state/lessons-learned/engineering-mindset.md` (operative) but NO `~/.claude/skills/outcome-vs-task/SKILL.md` was ever authored. PROP-005's sister deliverable. ~600 tokens to author. | **APPROVE** (small finishing job) | [ ] approve [ ] defer [ ] decline |
| PROP-010 | Design-bot role formalization | `parbaughs-design-bot.md` skill exists (operative). Design-bot artifact format used in session 2 reviews. Spec D39 still gates on "PROP-010 + design-bot APPROVE on every dashboard surface" — currently in flight in Phase G. No docs/agents/DESIGN_BOT.md doc; addendum is in skill form only. | **APPROVE — close as part of Phase G design batch** | [ ] approve [ ] defer [ ] decline |

## Batch B — OBSOLETED-BY (7 proposals)

| PROP | Title | Obsoleted by | Founder action |
|---|---|---|---|
| PROP-005 | Continuation-discipline skill + Critic protocol update | **SHIPPED.** `.claude/skills/continuation-discipline/` exists (operative; skill auto-loads per system reminder list this session). `docs/agents/CONTINUATION_DISCIPLINE.md` exists. AMD-017 applied. Stop-decisions logged to `.claude/state/stop-decisions/`. The only thing left is the formal `approved/ → shipped/` file move. | [ ] archive [ ] reconsider |
| PROP-007 | User-context verification gate | **SHIPPED.** `scripts/visual-audit/founder-context-capture.mjs` on disk. Round-trip `[user-context-gate]` block at `tests/round-trip-test.py:1833` operative. CONSOLIDATION session 2 cites the gate. | [ ] archive [ ] reconsider |
| PROP-008 | Browser-control install (Playwright MCP) | **SHIPPED.** `@playwright/mcp` installed (verified: `playwright` MCP server in `~/.claude.json` + `mcp__playwright__*` tools available in this session's deferred-tool list). | [ ] archive [ ] reconsider |
| PROP-009 | Click-through user-journey gate | **SHIPPED.** `scripts/visual-audit/user-journey-audit.mjs` on disk. Used in session 2 design-bot reviews. Click-every catches everything PROP-013 covers + more. | [ ] archive [ ] reconsider |
| PROP-011 | Vision capability install | **SHIPPED.** Four Anthropic skills (`frontend-design`, `webapp-testing`, `canvas-design`, `theme-factory`) verified installed at `~/.claude/skills/` and all four available in this session's skill list. Z.AI MCP correctly deferred (paid). | [ ] archive [ ] reconsider |
| PROP-012 | Mandatory visual review protocol | **SHIPPED.** `parbaughs-visual-verification-protocol.md` skill exists at `.claude/skills/` — direct codification of the iter-14 Read-and-articulate discipline. Used in session 2 main-flows iteration. Spec line 450 cites "PROP-012 visual review per surface, V1" as a live convention. | [ ] archive [ ] reconsider |
| PROP-013 | Button coverage gate (click-every-interactive) | **SHIPPED.** `scripts/visual-audit/enumerate-interactives.mjs` + `scripts/visual-audit/click-every-interactive.mjs` on disk. AMD-018 11-gate stack incorporates the Gate 5 click-every coverage. Used in session 2 button audits. | [ ] archive [ ] reconsider |

## Discrepancy with Founder estimate of 33

The directory `.claude/state/proposals/ship-readiness-deferred/` contains 9 files (PROP-005.json through PROP-013.json). The full proposal universe across all subdirectories:

- `applied/` — 0 files (empty)
- `approved/` — 9 files (PROP-005 through PROP-013) — proposal CONTENT lives here, Founder-approved 2026-05-14
- `deferred/` — 0 files (just .gitkeep)
- `inbox/` — 16 decision-watcher artifacts (cron heartbeats, canaries)
- `pending/` — 0 files (just .gitkeep)
- `rejected/` — 0 files (just .gitkeep)
- `ship-readiness-deferred/` — 9 scanner stubs (this triage)
- `shipped/` — 4 (PROP-002, PROP-003.a, PROP-003.b, PROP-004)
- `split-archived/` — 1 (PROP-003 original)

Total proposals authored to date: 13 numbered (PROP-002 through PROP-013, with PROP-003 split into a + b). Founder's "33" appears to be a mis-recollection of either AMDs (26 applied) or all-files-across-all-subdirectories (~39). Founder may want to verify intent before approving this triage; the actual deferred-proposal count is **9**.

## Net recommendation summary

1. **Bulk-archive** 7 proposals (PROP-005, 007, 008, 009, 011, 012, 013) — substrate confirmed operative on disk; formal closure is administrative cleanup.
2. **Apply PROP-006** as a small follow-up — author `~/.claude/skills/outcome-vs-task/SKILL.md` (~600 tokens) to close the symmetric sister-skill of continuation-discipline.
3. **Close PROP-010** as part of Phase G design-batch closure when D39 is met (the proposal IS the spec for that work).

After bulk-archive: the `approved/` directory drops to PROP-006 + PROP-010 only, both of which represent in-flight work toward the active /goal — much cleaner pipeline state for future cron rounds + Founder review.

## Founder approval

Reviewing this triage delivers a single-sweep close on the deferred-proposal backlog. To approve:

1. Tick boxes above per row.
2. Append `FOUNDER-PROPOSAL-TRIAGE-APPROVED-{TS}` below with timestamp + any per-row overrides.
3. Agent moves OBSOLETED-BY rows from `approved/` → `archived/` (creates new subdir) under Founder authorization.
4. Agent ships PROP-006 + PROP-010 follow-up work per recommendation.

```
FOUNDER-PROPOSAL-TRIAGE-APPROVED-{TIMESTAMP}
overrides:
  - (none unless Founder specifies)
notes:
  - (Founder may add per-row notes here)
```
