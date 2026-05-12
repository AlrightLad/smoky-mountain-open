# Phase 1 — Codebase Audit (per P1 Audit-first protocol, Step 0a gate)

**Audit run:** 2026-05-12 (Phase 1 setup, pre-3-corrections-application)
**Auditor:** Claude Code (Engineer role)
**Production state:** v8.22.0 (Ship 5+7, deployed 2026-05-07)
**Repository:** AlrightLad/smoky-mountain-open
**Audit scope:** 12 areas per Founder Step 0a directive

This audit fires before any Phase 1 main work proceeds. It establishes what the codebase actually contains vs what the governance documents (authored 2026-05-12) assume.

---

## Section 1 — Confirmed (documentation matches codebase)

### Version triple bump (CLAUDE.md "Version Numbering")
- `src/core/utils.js:7` → `var APP_VERSION = "8.22.0"`
- `package.json:3` → `"version": "8.22.0"`
- `public/sw.js:16` → `var CACHE_NAME = 'parbaughs-v8.22.0'`
All three aligned. ✓

### Page Shell (CLAUDE.md "Page Shell architecture")
- `src/core/page-shell.js` exists at v8.11.4, slot-based composition confirmed
- BREAKPOINTS object matches CLAUDE.md (mobile <720, A 720–959, B 960–1279, C 1280–1439, D 1440+)
- Public API surface (PB.pageShell.render, .currentBand, .BREAKPOINTS) matches CLAUDE.md
- Stamp pattern (`data-render-path="hq-shell"`, `data-render-band`, `data-render-width`) preserved per CLAUDE.md

### Firestore wrapper enforcement (CLAUDE.md "Multi-League Architecture")
- `leagueQuery()` defined `src/core/utils.js:18`
- `leagueDoc()` defined `src/core/utils.js:34`
- LEAGUE_SCOPED array at `utils.js:13` matches CLAUDE.md league-scoping table (rounds, chat, trips, teetimes, wagers, bounties, challenges, scrambleTeams, calendar_events, scheduling_chat, social_actions, invites, syncrounds, liverounds, league_battles, tripscores, rangeSessions, partygames)
- 27 wrapper-usage call sites across `src/core/` (router.js, sync.js, firebase.js, utils.js itself)

### Firebase config (CLAUDE.md "Firebase Configuration")
- `firebase.json` runtime = `nodejs22` ✓
- Project ID still `parbaughs` per CLAUDE.md (verified via `firebase projects:list` permission existing)

### Member visibility model (CLAUDE.md "Privacy Defaults")
- `PB.isMemberVisibleToViewer` lives at `src/core/data.js:117` and `:2110` (export)
- Implementation is a thin `isTestAccount` filter (NOT a full privacy gate — privacy enforcement is at firestore.rules layer)
- 5 documented callsites: `members.js:31`, `dms.js:26`, `records.js:207/236/254/266`, `richlist.js:42`

### Smoke infrastructure (CLAUDE.md "E2E Testing" + Three-tier model)
- Playwright Tier 2 suite at `tests/e2e/flows/` — 6 spec files (01-baseline through 06-notifications)
- Smoke runner at `tests/smoke/run.js` covers 4 browsers (see drift section for browser-name discrepancy)
- 27 smoke scenarios (`s1-auth.js` through `s26-rounds-ship-5-7-e2e.js`, plus `_demo.js` + `index.js`)
- Capture helper `tests/smoke/helpers/capture.js` already takes per-scenario screenshots into `tests/smoke/output/<timestamp>/<browser>/screenshots/` — **visual verification infrastructure ALREADY EXISTS**
- `report.js` renders pass/fail matrix across browsers
- Real Firebase via `.env.local`-loaded `SMOKE_EMAIL` / `SMOKE_PASSWORD` against smoke@parbaughs.test (docs/SMOKE_TEST_ACCOUNT.md)

### Hooks infrastructure (CLAUDE.md "Claude Code Hooks")
5 hook scripts present in `.claude/hooks/`:
- `gate-assertions.sh` — Hook 3 per CLAUDE.md
- `gate-protected.sh` — Hook 4 per CLAUDE.md
- `post-edit-syntax.sh` — Hook 2
- `pre-commit-lint.sh` — Hook 1
- `pre-commit-version-sync.sh` — Hook 5
+ helper `lib/parse-payload.sh` for jq-free input parsing
All wired in `.claude/settings.json` across PreToolUse (Bash + Edit/Write/MultiEdit) and PostToolUse (Edit/Write/MultiEdit).

### Husky pre-commit (CLAUDE.md "Git Hooks (Husky)")
- `.husky/pre-commit` exists (referenced via package.json `prepare: husky`)
- `lint-staged` config in package.json scopes `src/**/*.js`, `tests/**/*.js`, `scripts/**/*.js` to `npm run lint`

### .gitignore (CLAUDE.md "Security Notes")
- `.env*` patterns blocked
- `serviceAccountKey.json`, `firebase-adminsdk-*.json`, `scripts/.service-account.json` blocked
- `*.pem`, `*.key` blocked
- `/tests/smoke/output/` blocked — **important for visual verification: smoke screenshots ARE NOT committed** (see drift section)

### Backlog files (governance backlog INDEX.md)
All 11 BL files (BL-001 through BL-011) exist on disk. `closed/` directory exists but is empty.

---

## Section 2 — Drift detected (documentation vs reality)

### DRIFT-1 — Wrapper name: `leagueCollection` does NOT exist (P2)

Governance files reference `leagueCollection / leagueDoc` as the Firestore wrapper pair. The actual code has `leagueQuery / leagueDoc`. `leagueCollection` does not exist anywhere in the codebase (verified by grep returning zero matches across `src/`).

Sites affected:
- `docs/agents/ENGINEER.md:55` — "All Firestore reads through `leagueCollection()` / `leagueDoc()` wrappers"
- `docs/agents/CRITIC.md` Criterion 5 — same naming
- `docs/agents/SANITY_HALT.md:125` — "Direct Firestore queries bypassing `leagueCollection`/`leagueDoc` wrappers"
- `docs/agents/SHIP_PLAN_TEMPLATE.md:52` — "via leagueCollection/leagueDoc wrapper"

**Action:** Fix all 4 governance references to use `leagueQuery / leagueDoc`. Phase 1 governance edits should sweep this.

### DRIFT-2 — Smoke browser name: `msedge` not in stack; actual is `webkit-mobile` (P3)

Governance assumes 4 browsers as `chromium, firefox, webkit, msedge`. Actual smoke runner (per `package.json:22` and `tests/smoke/run.js:5`) uses `chromium, firefox, webkit, webkit-mobile`.

Sites affected:
- `docs/agents/PROTOCOLS.md:166` — P8 step 4 "Smoke covers all 4 browsers (chromium, firefox, webkit, msedge)"

**Why webkit-mobile not msedge:** memory entry `project_b43_webkit_mobile_smoke_timing` documents real B.43 flakes specifically against webkit-mobile (iOS Safari emulation). `msedge` was never wired and isn't relevant to the iPhone/Android mixed user base per CLAUDE.md.

**Action:** Fix PROTOCOLS.md P8 step 4. Visual verification protocol skill should target chromium + firefox + webkit + webkit-mobile.

### DRIFT-3 — Hook 4 (gate-protected.sh) protects fewer paths than governance claims (P2)

`docs/agents/ENGINEER.md:25` says protected paths are `.env*, payments/, auth/, scripts/create-smoke-account.js`.

Actual `.claude/hooks/gate-protected.sh` protects: `.env / .env.*`, `scripts/.service-account.json`, `firestore.rules`.

Missing from hook: `payments/`, `auth/`, `scripts/create-smoke-account.js`.

**Action:** Phase 1 STEP 3's "Critical path blocker" hook is meant to extend protection. Implementation should ADD these patterns to the existing gate-protected.sh OR ship a new hook that catches them. Either way, don't lose the existing 3 protections.

### DRIFT-4 — 6 hooks claimed in LAUNCH_GOVERNANCE.md not yet active (P1)

`docs/agents/LAUNCH_GOVERNANCE.md:64-71` lists 6 hooks as if active:
- Critical path blocker
- Secrets scanner
- Schema mutation alarm
- Governance protection
- Approval-gated paths
- Push protection

None of these are wired in `.claude/settings.json`. Current wiring is the 5 pre-existing hooks (lint, version-sync, gate-assertions, gate-protected, syntax-check). The 6 new hooks ARE Phase 1 STEP 3's job to install. Governance was written in advance.

**Action:** STEP 3 of Phase 1 wires the 6 new hooks. Preserve existing 5; ADD the 6 new. Total = 11 hooks after Phase 1.

### DRIFT-5 — `~/.claude/teams/parbaughs/config.json` does NOT exist (P2)

Phase 1 STEP 6 directive says verify this file exists or create it. Glob/Bash check returns no such file. `CLAUDE_EXPERIMENTAL_AGENT_TEAMS` env var also not set in current shell session.

**Action:** STEP 6 creates the config. Flag for Founder: agent-teams flag needs to be set system-wide (PowerShell `$env:CLAUDE_EXPERIMENTAL_AGENT_TEAMS = "1"` or persistent via `[Environment]::SetEnvironmentVariable(...)` for it to survive shell restart).

### DRIFT-6 — `tests/smoke/output/` is gitignored — visual screenshots not committed (P2)

`.gitignore:43` blocks `/tests/smoke/output/`. The smoke runner DOES capture screenshots there, but they never reach the remote.

This conflicts with Correction 2: "Engineer and Critic take screenshots of the running app and verify functionality visually." If screenshots aren't committed, Critic on a fresh session can't review them; Founder retrospective can't audit them.

**Action:** Phase 1 introduces `tests/visual-verify/<ship-id>/` (NOT gitignored) as the committed-screenshot path. Engineer copies relevant screenshots from `tests/smoke/output/` to `tests/visual-verify/<ship-id>/` at ship close. Visual-verification-protocol skill should encode this.

### DRIFT-7 — CLAUDE.md project state stale: still says v8.1.3 (P3)

CLAUDE.md "Project State" line: `**Version:** v8.1.3 (as of 2026-04-22) — Clubhouse Part A foundation complete`. Actual production is v8.22.0 (21 ships later: 8.2.x through 8.22.0). CLAUDE.md missed Ships 5+1 (v8.17.0) through 5+7 (v8.22.0) plus interim 8.13.x–8.16.x Ship 4a/5 work.

**Action:** Not a Phase 1 blocker. Stale CLAUDE.md is a known maintenance gap; flag for Wave 1 retrospective. Memory + git log are the live source.

### DRIFT-8 — Page Shell variant `hqHome` (v8.15.1) undocumented in CLAUDE.md (P3)

CLAUDE.md "Page Shell architecture" lists 2 masthead variants: `default`, `bandA`. Actual `src/core/page-shell.js:34` documents a 3rd variant: `hqHome` (added v8.15.1 Gate 2 with editorial eyebrow + Fraunces italic headline + subhead).

**Action:** Not a Phase 1 blocker; CLAUDE.md update at next maintenance pass.

### DRIFT-9 — fbMemberCache 30-file fanout claim: actually 13 files reading directly (P3)

Governance documents repeatedly cite "30-file member-data fanout pattern" (Engineer audit-first protocol, Criterion 12, etc.). Grep shows `fbMemberCache` directly referenced in **13 files**:
`rounds.js, data.js, home.js, chat.js, records.js, members.js, firebase.js, playnow.js, scorecard.js, sync.js, trips.js, scramble.js, parcoins.js`

The "30-file" figure includes `PB.getPlayer*` consumers (the higher-level API) on top of direct `fbMemberCache` access. That broader count is plausible but not 30 in current state — actual broader count needs verification per ship.

**Action:** Governance language is directionally correct (member data has wide fanout); the specific "30" is imprecise. Engineer/Critic audit per-ship via concrete grep, not memorized figure. Not a Phase 1 blocker.

### DRIFT-10 — Tier 0 vs Tier 1 starting state contradiction in governance (P1)

Per Correction 3 in Founder prompt: "Graduated autonomy starts at Tier 1 (not Tier 0) at Phase 1 commit."

But pre-correction governance:
- `GRADUATED_AUTONOMY.md:141` — "At Phase 1 commit (this commit), all categories are at **Tier 0**"
- `INFERRED_DECISIONS.md:76` — "At Phase 1 commit: all categories at **Tier 0**"
- `ROADMAP.md:184` — pre-correction text references Tiers 1–3 only

**Action:** Phase 1 STEP 0 (3 corrections application) updates GRADUATED_AUTONOMY.md + INFERRED_DECISIONS.md to Tier 1 starting state. Already on Task list (#7, #9).

---

## Section 3 — Undocumented patterns (codebase vs documentation)

### UD-1 — `scripts/verify/` and `scripts/ship-gate.js` data-integrity tooling

Not documented in `docs/agents/`. Comprehensive check suite at `scripts/verify/checks/`:
- 01-data-integrity, 02-league-isolation, 03-global-vs-scoped, 04-economy, 05-display-drift, 06-query-health, 07-code-pattern-scan

`scripts/ship-gate.js` runs full pipeline: lint + emulator-check + e2e + verify. Documented in CLAUDE.md "E2E Testing" section but not in governance docs.

**Recommendation:** Reference ship-gate in PROTOCOLS.md P8 (smoke coverage) and Engineer audit checklist. Skill `parbaughs-smoke-failure-triage` should know about it.

### UD-2 — `scripts/migrate-to-v8.js`, `scripts/backfill-handicaps.js`, `scripts/restore-nick-achievements.js`

Maintenance scripts. Not in governance. Engineer may encounter when audit cross-references migrations. Not a Phase 1 blocker but worth a footnote in CTO_INTERFACE.md (scripts/ directory is Founder territory; Engineer reads, doesn't author migration scripts without escalation).

### UD-3 — `firestore.rules.maintenance` (11 lines, freeze artifact)

Per CLAUDE.md "Cutover Playbook" Pattern 2, a reusable freeze artifact at repo root. Used during v8.0.0 cutover. Not referenced in governance docs. Critic should know about it (it shouldn't be touched outside cutover ships).

**Recommendation:** Mention in SANITY_HALT.md category 4 (data exposure) and CRITICAL_FEATURE_REGISTRY.md category 4 (security) as the cutover protection artifact.

### UD-4 — `parbaughs-namespace-collision-check` already encoded as memory (P9 feedback)

User memory `feedback_p9_namespace_collisions.md` documents the pattern. Phase 1 STEP 2 proposes a skill of the same name. Skill content should reference + extend the memory, not duplicate.

### UD-5 — `scripts/v7-mtd-diagnostic.js` untracked in working tree

Per git status, this is an untracked file in `scripts/`. Not in any prior commit. Unknown purpose. Phase 1 should ignore (don't include in commits, don't author against it).

**Flag:** ask Founder at retrospective whether to commit, gitignore, or delete.

---

## Section 4 — Backlog reconciliation

All 11 backlog item files verified present. Per-item cross-checks:

| ID | File path cited | Path verified | Notes |
|---|---|---|---|
| BL-001 | `src/pages/playnow.js`, `src/pages/scorecard.js`, `src/core/handicap.js` | ✓ all exist | Captured v8.3.2; deferred to Wave 2 |
| BL-002 | `.skeleton/.spinner CSS + helpers` | path implicit (src/styles) | P3, deferred to Wave 2 |
| BL-003 | `src/pages/home.js` → `src/core/page-helpers.js` (doesn't exist) | home.js ✓, page-helpers.js intentionally absent (refactor target) | P3 |
| BL-004 | live round card LEAD column (likely home.js or spectator.js) | implicit | P3 |
| BL-005 | HQ live round card group leaderboard | implicit | P3 |
| BL-006 | Play Now from desktop sidebar nav | implicit (router.js) | P3 |
| BL-007 | League edit page + masthead | implicit (leagues.js + page-shell) | P3 |
| BL-008 | a11y drawer at Band A | implicit (page-shell or home) | P3 |
| BL-009 | --el-0, --el-4, --ease-standard, --duration-* / --dur-* drift | base.css / components.css | P3 |
| BL-010 | Handicap trend chart 1000+ rounds perf | members.js buildHandicapGraph | P3, post-Wave-4 |
| BL-011 | `src/styles/components.css` lines ~858 + ~928 duplicate `.rr-sidebar__footer` | file exists, line numbers approximate per BL note | P3 |

Backlog rationality: all items track real concerns. None are obsolete. No P0/P1 hidden in P3 grouping (all genuinely deferrable). No retags needed at Phase 1.

**Open question for retrospective:** Several P3 items target Wave 2; should they consolidate into a single "Wave 2 cleanup" ship or stay individual? Not blocking; flag for backlog grooming.

---

## Section 5 — Open questions for Founder (saved to PHASE_1_FOUNDER_REVIEW.md)

1. **`CLAUDE_EXPERIMENTAL_AGENT_TEAMS` env var not set.** Should Phase 1 STEP 6 set it system-wide via PowerShell `[Environment]::SetEnvironmentVariable(...)` (persistent), or just document the need? System-wide env var changes affect all Claude Code sessions on this machine.

2. **`tests/smoke/output/` is gitignored.** Visual verification per Correction 2 needs screenshots to reach remote for Critic / Founder retrospective review. Options:
   - (A) Introduce `tests/visual-verify/<ship-id>/` (NOT gitignored) as the committed-screenshot path; Engineer copies subset from smoke output at ship close. **Recommended (least disruptive).**
   - (B) Remove `/tests/smoke/output/` from .gitignore. Inflates repo (~10MB per ship), survives history forever, exposes potentially-sensitive UI state.
   - (C) Push screenshots to a Firebase Storage bucket. Cost-incurring per Q44 Lock 3; CFR trigger.

3. **`scripts/v7-mtd-diagnostic.js` untracked.** Commit, gitignore, or delete? Unknown purpose from filename alone.

4. **6-hook installation: extend or replace?** STEP 3 hook 1 (Critical path blocker) overlaps with existing `gate-protected.sh`. Plan is to EXTEND the existing hook (add `payments/`, `auth/`, `scripts/create-smoke-account.js` patterns). Confirm direction.

5. **CLAUDE.md update**: CLAUDE.md is 21 ships out of date on "Project State" (says v8.1.3, actually v8.22.0). Update during Phase 1 or defer to Wave 1 retrospective? **Recommendation:** Defer — CLAUDE.md update touches identity copy + roadmap framing that benefits from Founder authorship.

---

## Section 6 — Phase 1 plan adjustments (based on audit)

### Adj-1 — Add `leagueCollection → leagueQuery` sweep to STEP 0 governance updates

Per DRIFT-1, the 4 sites referencing `leagueCollection` need correction. Already implicitly covered in the 10-file Step 0 list (CRITIC.md, ENGINEER.md, SANITY_HALT.md updates). SHIP_PLAN_TEMPLATE.md is NOT in the Step 0 list — needs adding (1 site to fix).

### Adj-2 — Add `msedge → webkit-mobile` sweep to STEP 0

Per DRIFT-2. PROTOCOLS.md P8 step 4. Already in Step 0 list (Task #8).

### Adj-3 — STEP 3 Hook 1 (Critical path blocker) EXTENDS existing gate-protected.sh

Don't ship a separate "critical-path-blocker.sh" that duplicates gate-protected.sh patterns — add `payments/`, `auth/`, `scripts/create-smoke-account.js` to the existing hook. Naming preserved; expansion documented in comment header.

### Adj-4 — STEP 3 Hook 6 (Push protection) verification target

Per Correction 1, push blocks when smoke OR lint OR visual verification FAILS. State source: `.claude/state/last-verify.json` (need to create directory). Hook reads file, checks `smoke.pass + lint.pass + visual.pass`. Visual verification field is new. Engineer writes this file at smoke completion; visual verification field writes after Playwright screenshot validation completes.

**Bootstrap problem:** at Phase 1 commit, no smoke has run under the new governance — `last-verify.json` doesn't exist. Hook 6 default behavior for missing-state: allow push (governance-only commits don't gate on smoke). Phase 1 commit itself is governance-only; Hook 6 must NOT block it.

### Adj-5 — STEP 2 skills directory creation

`.claude/skills/` doesn't exist. Phase 1 creates it fresh. No collision with existing skills to worry about.

### Adj-6 — Visual verification protocol uses existing infrastructure

Per UD-3+UD-4 (smoke runner already captures): the `parbaughs-visual-verification-protocol` skill doesn't need to invent new tooling. It documents:
- Existing capture API at `tests/smoke/helpers/capture.js`
- Per-ship copy from `tests/smoke/output/<ts>/<browser>/screenshots/` to `tests/visual-verify/<ship-id>/`
- 4 browsers: chromium, firefox, webkit, webkit-mobile (per Adj-2)
- State coverage matrix (empty / loading / populated / error / per permission tier)

### Adj-7 — `closed/` backlog dir is empty — first closure at next ship retrospective

When Ship 5+8 closes, BL items resolved (likely none in 5+8) move to `closed/`. Phase 1 leaves it empty. Mention to Orchestrator: at first ship close under new orchestration, exercise the move-to-closed flow.

---

## Audit verdict

**Phase 1 can proceed after this commit lands.** No P0/P1 blockers. P1 drifts (DRIFT-3, DRIFT-4, DRIFT-10) all resolve through Phase 1 work itself (3 corrections + STEP 3 hooks + governance updates).

**Open questions for Founder (5 items)** captured to `PHASE_1_FOUNDER_REVIEW.md`. None block Phase 1 setup; all decidable at morning retrospective.

**Recommended audit commit message:** `chore(governance): Phase 1 codebase audit + governance critique`

After audit commit, Phase 1 proceeds:
1. Resume STEP 0 (governance updates — 6 already in flight, 5 remaining per Tasks #7–#11)
2. STEP 2 (10 skills drafted + committed with auto-tokens)
3. STEP 3 (6 hooks wired, extending existing 5)
4. STEPS 4–7 (memory migration, W1.I4 ship plan, environment validation, Apple reminder)
5. Phase 1 commit + autonomous push (governance-only changes — smoke/lint/visual N/A for docs-only commit per Adj-4 bootstrap)
