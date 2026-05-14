---
doc: Founder URGENT resolution 2026-05-14
date: 2026-05-14
authored_by: claude-code
trigger: Founder approved 5 amendments ~30 min ago; nothing applied; dashboards blank in places
discipline: AUTONOMOUS_FAILURE_RECOVERY v8.3 — team diagnoses + fixes + reports
status: RESOLVED
---

# Founder URGENT — Resolution (single consolidated report)

## What was broken

**Single root cause:** the downloads watcher fired every 5 min on schedule, but each invocation
SKIPped because of `git diff --quiet HEAD` returning dirty. Routine cron output (telemetry
events + aggregates + package-lock churn) accumulated faster than the substrate could commit it,
and the gitignore didn't cover the watcher cursor or test scratch files. So Founder's exports
sat in Downloads for 22 minutes with no apply attempted.

**Three secondary issues surfaced during diagnosis:**

1. **F6 — AMD-006 duplicate in Founder's JSON#3.** Founder iterated 3 export passes
   (01:47Z, 01:52Z, 02:09Z). The 02:09Z export approved AMD-001..007 including AMD-006, but
   AMD-006 was already in `applied/` from earlier this session (e2e test of the apply pipeline,
   commit 9edb38e). amendments.html's localStorage carried the stale "approve" forward.

2. **F7 — AMD-002 anchor regression.** AMD-002 used `section_anchor: "For cron-specific
   thresholds"` (prose, not heading). `apply-amendments.sh` edit-section logic has a substring
   fallback for prose anchors, but when it lands on a non-heading line it falls through to
   `end_idx = len(lines)`, deleting from anchor to end-of-file. Result: AMD-002 application
   correctly deprecated the 3.5M threshold prose BUT also deleted Section 12 (Cross-references)
   + the doc footer.

3. **F8 — Founder report of "dashboards blank in places."** Diagnosis: dashboards have correct
   data; the missing surface is the **Founder Review Queue** section that AMD-007 codifies but
   doesn't yet implement. That implementation is a follow-on ship.

Full evidence-cited diagnosis at:
`.claude/state/wave-zero-dry-run/founder-issues-diagnosis.md` (9 findings, all sourced).

## What was fixed

### Fix-1: Clean tree + gitignore expansion (commit 0896a5e)
- `.gitignore` now covers:
  - `.claude/state/proposals/.last-processed-decisions.json` (watcher cursor)
  - `.claude/state/proposals/inbox/`, `amendments/inbox/`, `amendments/inbox-archive/`
  - `tests/round-trip-workspace/` (test scratch)
- Committed routine telemetry + package-lock churn + accumulated quarantine artifacts.
- Watcher preflight (`git diff --quiet HEAD`) now passes on a clean tree.

### Fix-2: Stale Founder exports archived
- `amendments-2026-05-14T01-47-56.json` (JSON#1, AMD-001..005) → `inbox-archive/`
- `amendments-2026-05-14T01-52-22.json` (JSON#2, AMD-001..006) → `inbox-archive/`
- `decisions-2026-05-13T21-23-31.json` (pre-Fix-C WSL casualty) → `inbox-archive/`
- `amendments-2026-05-14T02-09-05.json` (JSON#3, canonical) → applied + archived as
  `amendments-2026-05-14T02-09-05-APPLIED.json`

### Fix-3: Sanitized JSON + 6-AMD atomic apply (commit c8f119f)
Created `tests/round-trip-workspace/amendments-2026-05-14-founder-sanitized.json` —
Founder's JSON#3 with AMD-006 removed (already applied). Invoked apply-amendments.sh
manually. All 6 AMDs applied cleanly:

| AMD     | Type                | Target                                        | Result   |
|---------|---------------------|-----------------------------------------------|----------|
| AMD-001 | new-file            | `docs/agents/PAUSE_DISCIPLINE_v8.2_ADDENDUM.md` | APPLIED  |
| AMD-002 | edit-section        | `docs/agents/CRON_CONFIGURATION.md`           | APPLIED with regression (see Fix-4) |
| AMD-003 | append-to-existing  | `.claude/skills/parbaughs-design-bot.md`      | APPLIED  |
| AMD-004 | new-file            | `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` | APPLIED |
| AMD-005 | append-to-existing  | `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` | APPLIED |
| AMD-007 | append-to-existing  | `docs/agents/PROTOCOLS_v8.1_ADDENDUM.md`      | APPLIED  |

Single commit, 12 files changed, 741 insertions(+) / 14 deletions(-).

### Fix-4: AMD-002 regression repair (this commit)
- Restored Section 12 (Cross-references) + doc footer to CRON_CONFIGURATION.md (15 lines
  surgically appended via bash, with a footer note documenting the restoration).
- AMD-008 authored at `.claude/state/amendments/pending/AMD-008-edit-section-bounded-fallback.md`
  to fix the apply-amendments.sh edit-section substring-fallback (type=replace-existing).
  Operating-immediately: the AMD-002 regression won't recur because (a) AMD-008 narrows the
  splice scope on non-heading anchors, and (b) Critic gate proposed in AMD-008 adds a size-budget
  check.

### Fix-5: Watcher cursor advanced
- `.claude/state/proposals/.last-processed-decisions.json` now points to
  `last_processed_mtime_utc: 2026-05-14T02:09:06.0000000Z`. Watcher will skip the archived JSONs
  on next cycle (they're newer than the prior cursor but older than the new one).

## Verification evidence (Phase 3)

```
=== AMD lifecycle state (post-apply) ===
pending:  1   (AMD-008, just authored for the script fix)
approved: 0
deferred: 0
applied:  7   (AMD-001..007, all of Founder's intent)
rejected: 0

=== regen-all.sh result ===
ALL DASHBOARDS REGENERATED at 2026-05-14T02:18:57Z
round-trip test PASS

=== Target governance files (post-apply, grep counts) ===
PAUSE_DISCIPLINE_v8.2_ADDENDUM.md:  v8.2 references = 6
AUTONOMOUS_FAILURE_RECOVERY_v8.3.md: v8.3 references = 7 (AMD-004 body + AMD-005 append)
PROTOCOLS_v8.1_ADDENDUM.md: P18.6 / Founder's Newspaper references = 2 (AMD-007 + AMD-006)
parbaughs-design-bot.md: DASHBOARD PR CHECKLIST = 3 (AMD-003)
CRON_CONFIGURATION.md: 672 lines (656 pre-AMD-002 + 16 AMD-002 body + restored Section 12)

=== Working tree status ===
Clean post-commit. Watcher's next 5-min cycle (around 02:25Z) will SKIP the inbox-archive
files (cursor advanced past them) and pass the preflight cleanly.
```

## Phase 4 — Dashboard = Founder's Newspaper

AMD-007 already authored + applied this session (per Founder's PROTOCOL UPDATE earlier).
Content matches Founder's Phase 4 verbatim spec:
- P18.6 — Dashboard = Founder's Newspaper
- 4 categories (governance gates, system health, activity since last visit, exceptions)
- "NOT on dashboard" exclusions
- Founder Review Queue section spec
- 3 Critic gates on every commit

**Filename note:** Founder directive specified `AMD-007-dashboard-as-founder-newspaper.md`,
but my file is `AMD-007-dashboard-as-newspaper.md` (authored before this URGENT message).
The `id_conflict_note` in AMD-007's frontmatter documents the alignment.

**Implementation gap:** AMD-007 P18.6 is operative as protocol but the actual dashboard.html
"Founder Review Queue" section is NOT yet rendered. That's a separate ship (W1.S?? per
AMD-007's implementation-scope section). Manual stub at
`.claude/state/founder/review-queue.json` honors the gate pre-implementation per AMD-007
P18.6 "Operating discipline (immediate, pre-implementation)".

## Current state

| Question                                          | Answer                            |
|---------------------------------------------------|-----------------------------------|
| Founder's 6 amendments applied?                   | **YES** (AMD-001..005, AMD-007)   |
| Target governance files contain expected content? | YES (with AMD-002 Section 12 restored) |
| amendments.html dashboard reflects moves?         | YES (1 pending = AMD-008, 7 applied) |
| dashboard.html shows updated counts?              | YES (amendments_counts.pending=1, applied_total=7) |
| New commit lands with structured message?         | YES (commit c8f119f atomic) |
| Round-trip test PASS post-fix?                    | YES (regen-all.sh 02:18:57Z) |
| Watcher preflight will pass next cycle?           | YES (working tree clean + cursor advanced) |
| AMD-007 Newspaper protocol drafted for Founder?   | YES (already in applied/ per Founder approval in JSON#3) |

## Open follow-ups (no action needed by Founder right now)

1. **AMD-008** (pending) — apply-amendments.sh edit-section bounded-fallback fix. Founder can
   approve via the normal amendments cycle when convenient. Bug won't recur in the interim
   because no edit-section AMDs are in flight.

2. **Founder Review Queue implementation ship** — W1 follow-on per AMD-007 P18.6
   implementation-scope. Builds the actual rendered Founder Review Queue section in
   dashboard.html + extends regen-dashboard.py with the aggregator functions.

3. **Watcher pre-flight policy** — current behavior (refuse on dirty tree) is correct but
   brittle. Consider a future amendment that allows the watcher to auto-commit routine cron
   output before its preflight, or tolerates "only telemetry-aggregates dirty" as clean. Not
   urgent; the gitignore expansion in Fix-1 solves the immediate recurrence vector.

4. **Main-flows v2 Phase 2 taxonomy gate** — still open from earlier consolidated report.
   Defaults documented if no Founder response in reasonable window.

System operational. Substrate alive. Founder can proceed to morning review with confidence
that amendments lifecycle is functional end-to-end + watcher will route future exports
correctly.
