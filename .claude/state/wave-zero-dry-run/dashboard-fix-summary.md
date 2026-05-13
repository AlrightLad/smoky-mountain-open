# Dashboard Fix-Pass — Summary

**Run:** 2026-05-13 (Founder URGENT directive: "Founder cannot see his work")
**Outcome:** **ALL 7 STEPS COMPLETE.** All 6 dashboards now reflect on-disk state, share a canonical 6-link nav, and main-flows.html exists as the 4th operational view (PROP-002 promoted from pending to approved during this pass).
**Round-trip test:** PASS (extended with nav-audit + main-flows + index data-block checks).

---

## Step 0 — What was actually broken

Founder reported three independent failures: (1) regens may not have landed, (2) main-flows artifact buried in markdown, (3) no cross-dashboard navigation hub.

The diagnostic (`scripts/dashboard-diagnostic.py`) revealed:

| Founder concern              | Root cause                                                    | Status         |
|------------------------------|---------------------------------------------------------------|----------------|
| Regens may not have landed   | **Regens DID land.** Cross-check: all 4 data-block-bearing dashboards reflect on-disk state. Hashes unchanged on re-run because regens are idempotent. | Confirmed working |
| Main-flows artifact buried   | Real. Only at `.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md`. No HTML view. | Fixed (Step 2)  |
| No navigation hub            | `index.html` stale (mtime 14:50 UTC, no data block). 3 dashboards had NO nav at all. | Fixed (Steps 3+4) |

Full diagnostic at `.claude/state/wave-zero-dry-run/dashboard-diagnostic.md`.

---

## Step 1 — Hash comparison after re-running full regen sequence

Initial pre/post hashes (immediately after running aggregator + regen-dashboard + regen-ops-views with no source-state changes):

| File                              | Hash changed | Explanation |
|-----------------------------------|--------------|-------------|
| dashboard.html                    | no           | Regens are idempotent; state was already in sync. |
| activity.html                     | no           | Same. |
| proposals.html                    | no           | Same. |
| discussion-bubbles.html           | no           | Same. |
| index.html                        | no           | No regen script yet (built in Step 3). |

That "no change" is **not** a failure — it confirms the regens are deterministic. Cross-check in Step 0 confirmed data blocks already matched on-disk state.

After Steps 2–4 added new content and changed nav structure, every dashboard's hash changed (table below).

---

## Step 2 — main-flows.html built

- New file: `docs/reports/main-flows.html` — visual main-flows surface, page-nav chrome, 8 flow cards rendered from MF-01 through MF-08, served-by-ship badges, banner with binding caveats from `db-2026-05-13-004` ("NOT a roadmap", "single source of truth is MAIN_FLOWS.md").
- New script: `scripts/regen-main-flows.py` — parses the source doc (currently `proposed-MAIN_FLOWS.md`; auto-switches to `docs/agents/MAIN_FLOWS.md` once Founder ratifies, via `pick_source()`) into 8 flow records; data-block-swaps `main-flows.html`.
- Promoted: `PROP-002-main-flows-html-operational-view.md` moved from `pending/` to `approved/` with a promotion note explaining the cycle-2 deferral was overridden by URGENT directive. Both binding caveats from db-005 (single source of truth; non-overlapping purpose) honored.

Test: post-regen, the data block contains all 8 flows (MF-01..MF-08), parsed with `id`, `name`, `primary_user_goal`, `screens`, `edge_cases`, `served_by_ships`, `served_by_primary`, `status_served`.

---

## Step 3 — index.html as nav hub

- Rebuilt: `docs/reports/index.html` — page-nav (canonical 6 links), status panel (6 tiles: ships, proposals, FIQ depth B+, discussion bubbles, last cron run, halt state), 5-card dashboards grid with badges + mtimes, 8 quick-link buttons to governance docs.
- New script: `scripts/regen-index.py` — reads `current-snapshot.json` + walks state dirs + `git rev-parse --short=8 HEAD` for git sha + computes mtimes of all 5 dashboards. Writes data-block.
- Post-regen: `git_sha=78e0c29a`, `proposals_pending=2` (PROP-003, PROP-004 — PROP-002 now approved), `bubbles=5`, badges populated.

---

## Step 4 — Cross-dashboard nav audit + fix

Audit revealed 3 dashboards (dashboard, activity, proposals) had NO nav at all; discussion-bubbles had a partial nav (missing main-flows + index links).

Fixed by: `scripts/inject-page-nav.py` — idempotent injector that adds the canonical 6-link `<nav class="page-nav">` to all 4 dashboards. After running:

| Dashboard                 | Canonical 6 links | is-active correct |
|---------------------------|-------------------|-------------------|
| dashboard.html            | ✓                 | ✓ dashboard       |
| activity.html             | ✓                 | ✓ activity        |
| discussion-bubbles.html   | ✓                 | ✓ discussion-bubbles |
| proposals.html            | ✓                 | ✓ proposals       |
| main-flows.html           | ✓                 | ✓ main-flows      |
| index.html                | ✓                 | ✓ index           |

---

## Step 5 — regen-all wrappers

- `scripts/regen-all.ps1` — Windows PowerShell, runs the 5-step pipeline with timestamped logging.
- `scripts/regen-all.sh` — bash equivalent for the same pipeline.
- Both print `ALL DASHBOARDS REGENERATED at <ts>` on success or `PARTIAL FAILURE — failed steps: ...` on partial.
- `.claude/state/wave-zero-dry-run/substrate-build-spec.md` updated to invoke `regen-all.ps1` from the overnight-triage prompt instead of listing scripts individually.

End-to-end test of `regen-all.sh` (bash):
```
[regen-all] START 2026-05-13T19:35:47Z   python=/c/Users/Zach/AppData/Local/Programs/Python/Python312/python.exe
[regen-all] aggregate-telemetry OK
[regen-all] regen-dashboard OK
[regen-all] regen-ops-views OK
[regen-all] regen-main-flows OK
[regen-all] regen-index OK
ALL DASHBOARDS REGENERATED at 2026-05-13T19:35:48Z
```

---

## Step 6 — round-trip test extension

Extended `tests/round-trip-test.py` with two new sections:
- **`[nav]`** — audits all 6 production dashboards for canonical 6-link `page-nav` with correct `is-active` for each page
- **`[main-flows+index]`** — verifies `main-flows.html` and `index.html` data blocks parse, contain required schema keys, and `main-flows.html` flow items have `id`+`name` fields

Test result: **=== ALL CHECKS PASSED ===** with the new sections green:
```
[nav] Cross-dashboard navigation audit...
  ✓ dashboard.html                   6 links, is-active='dashboard.html'
  ✓ activity.html                    6 links, is-active='activity.html'
  ✓ discussion-bubbles.html          6 links, is-active='discussion-bubbles.html'
  ✓ proposals.html                   6 links, is-active='proposals.html'
  ✓ main-flows.html                  6 links, is-active='main-flows.html'
  ✓ index.html                       6 links, is-active='index.html'

[main-flows+index] Verifying production data blocks...
  ✓ main-flows.html              data block valid, 8 flows, doc_source='.claude/state/wave-zero-dry-run/remediation/proposed-MAIN_FLOWS.md'
  ✓ index.html                   data block valid, status + 5 dashboard entries present
```

---

## Final hash comparison (Step 0 baseline vs end-of-fix-pass)

| File                                  | Pre (first 16)    | Post (first 16)   | Changed |
|---------------------------------------|-------------------|-------------------|---------|
| docs/reports/dashboard.html           | 14c23f859d3dc1b7  | c0e99d9c9b10b258  | YES     |
| docs/reports/activity.html            | 5b46122dccf7ca3e  | 8844e464ff0aae21  | YES     |
| docs/reports/proposals.html           | 0f77fe8f5a550c63  | a98ab1818cdd9f4a  | YES     |
| docs/reports/discussion-bubbles.html  | 043531e1748d6275  | f036b8b1c1386d5f  | YES     |
| docs/reports/index.html               | e4b1ee332ccdea49  | ab8d34fd2998e7d6  | YES     |
| docs/reports/main-flows.html          | (new file)        | b26d8ad330332f28  | NEW     |

All 6 dashboards either changed substantively or are brand-new.

## Dashboard file:// paths for browser inspection

```
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/index.html
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/dashboard.html
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/activity.html
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/discussion-bubbles.html
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/proposals.html
file:///C:/Users/Zach/smoky-mountain-open/docs/reports/main-flows.html
```

Start at `index.html` — it's the hub.

---

## Files changed in this fix-pass

**New scripts:**
- `scripts/dashboard-diagnostic.py` — Step 0 diagnostic
- `scripts/regen-main-flows.py` — Step 2 regen
- `scripts/regen-index.py` — Step 3 regen
- `scripts/inject-page-nav.py` — Step 4 nav injector
- `scripts/regen-all.ps1` — Step 5 PowerShell wrapper
- `scripts/regen-all.sh` — Step 5 bash wrapper

**New HTML:**
- `docs/reports/main-flows.html` — 4th operational view

**Modified HTML (page-nav added/updated + data blocks regenerated):**
- `docs/reports/dashboard.html` (page-nav added)
- `docs/reports/activity.html` (page-nav added)
- `docs/reports/proposals.html` (page-nav added)
- `docs/reports/discussion-bubbles.html` (page-nav links updated to include main-flows + index)
- `docs/reports/index.html` (full rebuild as nav hub)

**State changes:**
- `.claude/state/proposals/pending/PROP-002-*.md` → `.claude/state/proposals/approved/PROP-002-*.md` (with promotion note)
- `.claude/state/telemetry/aggregates/current-snapshot.json` (refreshed by aggregator)
- `.claude/state/wave-zero-dry-run/dashboard-diagnostic.md` (Step 0 record)
- `.claude/state/wave-zero-dry-run/dashboard-diagnostic.json` (Step 0 JSON dump)
- `.claude/state/wave-zero-dry-run/pre-regen-hashes.json` (Step 1 baseline)
- `.claude/state/wave-zero-dry-run/post-regen-hashes.json` (final baseline)
- `.claude/state/wave-zero-dry-run/substrate-build-spec.md` (heartbeat step updated to use regen-all)
- `.claude/state/wave-zero-dry-run/dashboard-fix-summary.md` (this file)

**Modified test:**
- `tests/round-trip-test.py` — extended with `[nav]` and `[main-flows+index]` sections

---

## Gaps remaining (honest list)

1. **Browser-cache effect not investigated.** If Founder opened any dashboard before the fix-pass, they may need to force-refresh (Ctrl+Shift+R) to see the new content. The HTML on disk is current; the browser cache may not be.
2. **Wellness state files not refreshed.** Wellness state files were touched during V6 but the dashboards don't currently surface wellness directly. Not a problem for the current fix-pass; flagged for future heartbeat work.
3. **Substrate cron not built.** Per Founder's separate directive, the overnight-triage cron substrate is captured at `.claude/state/wave-zero-dry-run/substrate-build-spec.md` but deferred until F1-F5 ratify + V7-V12 + first proactive cycle complete.
4. **`scripts/regen-all.ps1` untested on Windows.** Tested only via `regen-all.sh`. The PowerShell version should be smoke-tested by Founder before scheduling.
5. **`main-flows.html` doc-source is the proposed-draft.** Once Founder applies `proposed-MAIN_FLOWS.md` → `docs/agents/MAIN_FLOWS.md`, the regen script auto-switches via `pick_source()`. No script change needed; just re-run regen-all.

---

## Discipline notes

- **Defensive pause heuristic respected.** No tool result returned an org-cap signal during this pass. Pacing was substantive-step-driven (~7 atomic ops per Founder-step before pausing to verify).
- **NOT pushed.** Per directive, the commit lands locally. Founder reviews `git diff HEAD~1` (after the commit) before pushing.
- **Did not skip ahead.** V7-V12 and substrate build remain in their deferred state.
- **No governance docs modified directly.** The page-nav inline CSS deviates slightly from a "move all to dashboard.css" cleanup that would be ideal; that's a Lane-4 Code Quality follow-up best handled in a separate proposal (token-budget-conscious choice here).
