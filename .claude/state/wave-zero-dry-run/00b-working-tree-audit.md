# Working-Tree Audit — Pre-Commit Cleanup (v8.1.2 drop + Founder authoring)

**Run:** 2026-05-13 (revised cleanup run, follow-on to 00-preflight.md)
**Outcome:** Categorization complete; no blockers in category (c). Proceeding to Commit A + B.

## Inputs

- `git status --short` and `git status -u` captured pre-cleanup
- File mtimes inspected to disambiguate v8.1.2 drop (May 13 10:50) from earlier governance drops (May 12 + May 13 00:07) and from Founder authoring (modified-file set)
- Diffstat of the 7 modified files vs HEAD captured for reconciliation check

## Category (a) — Founder Vision / governance authoring (Commit B)

7 modified files. Founder edits during Vision authoring pass; substantive content rewrites (683 lines deleted, 304 inserted on the 7-file set):

| Path | Status | Note |
|------|--------|------|
| `docs/agents/CTO_INTERFACE.md` | M | +135 / -90 ish; CTO interface contract revisions |
| `docs/agents/INTER_WAVE_PROTOCOL.md` | M | +33 / -? ; inter-wave handoff protocol |
| `docs/agents/ORCHESTRATOR.md` | M | orchestrator role doc revisions |
| `docs/agents/RETROSPECTIVE_REVIEW.md` | M | retrospective protocol additions |
| `docs/agents/ships/W1.I4.md` | M | Wave 1 incubator ship 4 plan compaction |
| `docs/agents/ships/W1.S1.md` | M | Wave 1 ship 1 vision authoring |
| `docs/agents/ships/W1.S3.md` | M | Wave 1 ship 3 vision authoring |

**Reconciliation check:** None of the 7 paths appear in the v8.1.2 drop's May 13 10:50 file group (cross-checked by mtime). No file spans both categories. Clean split — no manual reconciliation needed.

## Category (b) — Governance scaffolding (Commit A)

Combines v8.1.2 drop (May 13 10:50 mtimes) **and** earlier governance scaffolding from prior drops that never landed in commits (May 12 + May 13 00:07 mtimes). Bundled together because they all describe the same governance system and the v8.1.2 layer assumes the earlier scaffolding exists. The commit message names v8.1.2 explicitly but the staged set is broader by necessity.

**`docs/agents/*.md` (untracked governance docs — full set):**

```
AGENT_NETWORK.md
AGENT_WORKING_MODE_v7_ADDENDUM.md
AGENT_WORKING_MODE_v8_ADDENDUM.md
BUG_TRIAGE_LISTENER.md
CRITIC_P10_ADDENDUM.md
CRON_CONFIGURATION.md
CROSS_WAVE_DEPENDENCIES.md
DATA_INTEGRITY.md
DECISION_BUBBLE_AGENTS.md
DEVELOPMENT_GRADING.md
DOC_FRESHNESS_REVIEW.md
END_OF_WAVE_BUG_SCAN.md
END_USER_TESTING.md
FEATURE_FLAG_DISCIPLINE.md
FIRST_PROACTIVE_CYCLE_KICKOFF.md          ← v8.1.2
FLOW_DOCUMENTATION.md
HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md
HALT_CRITERIA_ITEM_13_ADDENDUM.md
HALT_CRITERIA_v7_ADDENDUM.md
HALT_CRITERIA_v8.1_ADDENDUM.md            ← v8.1.2
HALT_CRITERIA_v8_ADDENDUM.md              ← v8.1.2
HANDOFF_NOTE_TEMPLATES.md                 ← v8.1.2
HANDOFF_PROTOCOL.md                       ← v8.1.2
HEADLESS_OPERATION_PROTOCOL.md
MEMBER_FEEDBACK_SYNTHESIS.md
MIGRATION_PROTOCOL.md
PAUSE_DISCIPLINE_v8.1_ADDENDUM.md         ← v8.1.2
PERFORMANCE_TESTING.md
PLATFORM_ONBOARDING.md
POST_PUSH_RETROSPECTIVE.md
POST_PUSH_RETROSPECTIVE_P10_AMENDMENT.md
PROACTIVE_IMPROVEMENT_PROTOCOL.md
PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md
PROTOCOLS_P10_ADDITION.md
PROTOCOLS_v7_ADDENDUM.md
PROTOCOLS_v8.1_ADDENDUM.md                ← v8.1.2
PROTOCOLS_v8_ADDENDUM.md                  ← v8.1.2
RATE_LIMIT_DISCIPLINE.md
REPORT_HTML_SPEC.md                       ← v8.1.2
REPORT_HTML_SPEC_v8.1_AMENDMENT.md        ← v8.1.2
REPORT_TEMPLATES.md                       ← v8.1.2
REPORT_TEMPLATES_v8.1_AMENDMENT.md        ← v8.1.2
SECURITY_AUDITOR.md
SESSION_JOURNAL.md
SESSION_JOURNAL_v7_ADDENDUM.md
SESSION_JOURNAL_v8_ADDENDUM.md            ← v8.1.2
SKILL_CATALOG_OVERVIEW.md
SKILL_PERFORMANCE_REVIEW.md
TELEMETRY_PROTOCOL.md                     ← v8.1.2
VISION_AUTHORING_PROTOCOL.md
W1.S11_VISION_AMENDMENT.md
WAVE_ZERO_DRY_RUN.md
WAVE_ZERO_DRY_RUN_RUNBOOK.md              ← v8.1.2
WAVE_ZERO_DRY_RUN_v7_EXTENSION.md
WAVE_ZERO_DRY_RUN_v8_EXTENSION.md         ← v8.1.2
```

**`docs/agents/` subdirectory READMEs / artifacts:**

```
docs/agents/decision-bubbles/README.md
docs/agents/lessons-learned/DEVELOPMENT_GRADE_LOG.md
docs/agents/retrospectives/README.md
```

**`docs/agents/ships/` (full set of ship plan stubs):**

```
M1.md M2.md M3.md M4.md M5.md M6.md
W1.I1.md W1.I2.md W1.I3.md W1.I5.md W1.I6.md
W1.S2.md W1.S4.md W1.S5.md W1.S6.md W1.S7.md W1.S8.md W1.S9.md W1.S10.md W1.S11.md W1.S12.md W1.S13.md W1.S14.md
W2.S0.md W2.S1.md W2.S2.md W2.S3.md W2.S4.md W2.S5.md
W4.I1.md W4.I2.md W4.I3.md W4.I4.md W4.I5.md
W4.S1.md W4.S2.md W4.S3.md
```

(W1.I4.md, W1.S1.md, W1.S3.md are NOT in this list — they're modified and go in Commit B.)

**`docs/reports/` (operational views — v8.1.2 dashboard pack):**

```
docs/reports/activity.html
docs/reports/dashboard.html
docs/reports/discussion-bubbles.html
docs/reports/index.html
docs/reports/proposals.html
docs/reports/_assets/dashboard.css
docs/reports/_assets/dashboard.js
docs/reports/_assets/template.html
```

(`daily/`, `weekly/`, `ships/`, `waves/` subdirs are empty — git won't track empty dirs, will materialize on first content write.)

**`docs/skills/`:**

```
docs/skills/parbaughs-goal-completion-verify.md
docs/skills/parbaughs-rate-limit-aware-pause.md
```

**`docs/` root (governance + Clubhouse spec drops that landed at root level):**

```
docs/AGENT_WELLBEING_PROTOCOL.md
docs/AGENT_WORKING_MODE_ADDENDUM.md
docs/CLUBHOUSE_SPEC-HQ-3a-Home.md
docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md
docs/CLUBHOUSE_SPEC-HQ-3c-Scorecard.md
docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md
docs/CLUBHOUSE_SPEC-HQ.md
docs/EXTENDED_THINKING_DEEP_RESEARCH.md
docs/FOUNDER_INPUT_QUEUE.md
docs/HALT_CRITERIA_v6_ADDENDUM.md
docs/HANDOFF_README.md
docs/PROTOCOLS_v6_ADDENDUM.md
docs/SESSION_JOURNAL_v6_ADDENDUM.md
docs/SHIP_INDEX.md
docs/SHIP_PLAN_TEMPLATE.md
docs/SKILL_CATALOG_v6_ADDENDUM.md
```

(The `(1)` duplicates of CLUBHOUSE_SPEC-HQ-3b and 3d are NOT in this list — see category (c) below.)

**`.claude/scripts/` (cron + lock + apply-decisions shell scripts):**

```
.claude/scripts/acquire-lock.sh
.claude/scripts/apply-decisions.sh         ← v8.1.2
.claude/scripts/cron-heartbeat.sh
.claude/scripts/cron-proactive.sh
.claude/scripts/cron-ship.sh
.claude/scripts/release-lock.sh
```

**`.claude/skills/parbaughs-*/SKILL.md` (skill manifest dirs, v8.1.2 wave):**

```
.claude/skills/parbaughs-deep-research/SKILL.md
.claude/skills/parbaughs-founder-input-triage/SKILL.md
.claude/skills/parbaughs-handoff-note/SKILL.md          ← v8.1.2
.claude/skills/parbaughs-proactive-proposal/SKILL.md
.claude/skills/parbaughs-report-generate/SKILL.md       ← v8.1.2
.claude/skills/parbaughs-telemetry-emit/SKILL.md        ← v8.1.2
.claude/skills/parbaughs-wellness-checkpoint/SKILL.md
```

**`.github/workflows/` (new cron triggers):**

```
.github/workflows/heartbeat.yml
.github/workflows/proactive-cycle.yml
.github/workflows/ship-cycle.yml
```

**Repo-root governance entrypoint + Tier 2 baseline test:**

```
HANDOFF_README_v8.1.md                    ← v8.1.2
tests/round-trip-test.py                  ← v8.1.2
```

## Category (c) — Anything else (NOT committed)

| Path | Disposition | Reason |
|------|-------------|--------|
| `.claude/settings.local.json` | Leave (gitignored) | Per `.gitignore` line `/.claude/settings.local.json`. |
| `.claude/state/cron-paused.json` | Leave untracked | Per user instruction; runtime state, written by autonomous run. Not strictly gitignored — `.claude/state/` is NOT in `.gitignore`, but user explicitly said do not stage. **Recommendation for Founder:** add `/.claude/state/` to `.gitignore` in a follow-up to prevent accidental future commits. |
| `.claude/state/wave-zero-dry-run/00-preflight.md` | Leave untracked | Previous-session preflight log; runtime artifact. |
| `.claude/state/wave-zero-dry-run/00b-working-tree-audit.md` | Leave untracked | This file. |
| `docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD (1).md` | Leave untracked (junk) | Byte-identical to non-`(1)` version (verified `diff -q`); from a re-extract. **Recommendation:** Founder deletes the `(1)` copies in a follow-up. Not removing automatically — file deletion in an untracked-cleanup commit is reversible only via shell history. |
| `docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard (1).md` | Leave untracked (junk) | Byte-identical to non-`(1)` version. Same disposition. |
| `scripts/v7-mtd-diagnostic.js` | Leave untracked | Created May 5; older read-only Firestore diagnostic for a prior dry-run iteration ("V7.1"). Not part of v8.1.2. No active reference in tracked code. Founder can decide whether to commit, archive to `docs/agents/lessons-learned/`, or delete. Not blocking. |
| `node_modules/`, `dist/`, etc. | N/A | Gitignored. |

**No surprises:** No random script outputs, no node_modules drift, no secrets, no large binaries, no `.env*` leaks. Pre-flight self-check passes; proceeding to commits.

## Commit plan

- **Commit A** — staged set is the full union of category (b). Message names v8.1.2 explicitly; the staged scope is broader by necessity (earlier governance scaffolding never landed in commits and v8.1.2 layers on top of it). This single sweep brings the working tree to a state where every governance doc referenced by v8.1.2 actually exists in git history.
- **Commit B** — 7 modified files in category (a). Founder authoring pass.

## Post-commit residuals (expected)

After Commit A + B, `git status` will still show:

- `M .claude/settings.local.json` (gitignored — git status reports it pre-track-state; harmless)
- `?? .claude/state/cron-paused.json` (intentional)
- `?? .claude/state/wave-zero-dry-run/00-preflight.md` (intentional)
- `?? .claude/state/wave-zero-dry-run/00b-working-tree-audit.md` (intentional — this file)
- `?? docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD (1).md` (junk, Founder to delete)
- `?? docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard (1).md` (junk, Founder to delete)
- `?? scripts/v7-mtd-diagnostic.js` (Founder to triage)

Step 3 verification will treat the above as the expected residual; any other untracked or modified path post-commit is a regression.
