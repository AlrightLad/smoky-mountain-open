# Dashboard Troubleshooting & Standing Checks

**Authored:** 2026-05-21 by Founder directive — "this is all stuff that the orchestration team should be looking for already so please add that to their troubleshooting".

**Purpose:** Standing automated checks the orchestration team runs continuously, NOT items the Founder should have to manually flag. P10 (Actionable Surfacing) compliance — every issue must be detected + surfaced with WHAT/WHERE/WHAT-ACTION, not waited-on.

## What's continuously verified

### 1. Visual integrity of every dashboard page

**Trigger:** On every post-commit dashboard regeneration (`.husky/post-commit`).

**Script:** `scripts/visual-audit/capture-dashboards-all.mjs` — Playwright captures every `docs/reports/*.html` at 1920×1080 + 1366×768, runs an in-page DOM-overlap heuristic that flags any text element whose bounding rect overlaps another text element by ≥15% of the smaller's area.

**Output:** `.claude/state/visual-audit-2026-05-21/visual-audit-findings.json` + per-page PNG screenshots.

**Filters applied (NOT real overlaps):**
- Same-tree ancestry (nested text inside parent is normal)
- Any element under a `position: fixed` or `position: sticky` ancestor (deliberate overlay — live-indicator, sticky headers, toasts)
- Both elements `position: absolute` (deliberate stacking)
- Overlap area < 4px² (border alignment)
- Overlap percentage < 15% (mere adjacency)

**Action on findings:**
- Surface as `dashboard_visual_findings` count on the main dashboard
- Block ship-close if any RED dimension has visual overlap (P10 violation)
- File a one-line entry in the team's pending-review queue per finding

**Last clean baseline:** 2026-05-21 — 0 overlaps across all dashboards (after live-indicator z-stack fix + app-health audit-schedule restructure).

### 2. Cron task health

**Trigger:** On every post-commit run AND every dashboard regeneration.

**Script:** `scripts/cron/check-cron-health.ps1` — emits `.claude/state/aggregates/cron-health.json` with state of all PARBAUGHS-* tasks.

**Expected state for ALL PARBAUGHS-* tasks:**
| Field | Expected | Reason |
|---|---|---|
| State | `Ready` | Enabled + waiting for next trigger |
| Hidden | `True` | Per silence-cron-rebuild (no PowerShell window flash) |
| RunLevel | `Limited` | No admin needed for future edits |
| LastResult | `0` (success) | Last cron run exited 0 |
| LastRun | within last (2 × interval) min | Not stalled |

**Action on failure:**
- Any task with `State != Ready` → surface to dashboard `cron_health` card as RED
- Any task with `LastResult != 0` → surface as RED with exit code + log path
- Any task with `LastRun` > 2× expected interval → surface as YELLOW (stalled)
- Any task with `Hidden = False` → surface as YELLOW (regression from silence rebuild — re-run `silence-cron-LAUNCH.cmd`)
- Any task with `RunLevel != Limited` → surface as YELLOW (needs rebuild)

### 3. RED dimension monitoring (App Health)

**Trigger:** On every `scripts/aggregate-app-health.py` run.

**Check:** Any A1-A12 dimension with `status == 'red'` (score < 60) is automatically promoted to the dashboard's `red_dimensions` block + a corresponding `pending-review` entry is queued for the team.

**Action:**
- Surface RED dimensions in dashboard.html main card with explicit WHAT/WHERE/WHAT-ACTION
- File a corresponding entry in `.claude/state/pending-review/red-dim-<dimension>-<date>.md`
- Block ship-close if any RED dimension has been red for > 24h without an active mitigation ship

### 4. Dirty tree / dirty cron state

**Trigger:** Watcher cron (every 5 min) + on every commit.

**Check:** `git diff --name-only HEAD` + `git status --porcelain`.

**Action:**
- AMD-019 / AMD-020 auto-clean Class A files (dashboards, aggregates, telemetry) via cron commit
- Anything else → surface to dashboard dirty-files card as YELLOW
- Stale dirty (> 30 min) → escalate to RED

### 5. Smoke test health

**Trigger:** On every commit affecting `src/`, `functions/`, or `public/`.

**Check:** `npm run smoke` (chromium pre-commit) + scheduled `npm run smoke:full` (multi-browser nightly).

**Action:**
- < 95% pass rate → RED (block ship-close)
- 95-99% pass rate → YELLOW
- 100% pass rate → GREEN
- Known fragile scenarios (B.43 webkit-mobile timing) tracked in project memory + counted as expected-fail

### 6. Bundle size + Lighthouse

**Trigger:** On every commit affecting `src/`.

**Check:** `npm run build` + `npm run lighthouse` (5-page sample).

**Action:**
- Bundle > 2.5MB → RED
- Lighthouse Performance < 75 → RED (A8 dimension)
- Lighthouse Accessibility < 90 → RED (A9 dimension)
- All metrics surface on dashboard.html performance card

## Where this lives in the substrate

| File | Purpose |
|---|---|
| `scripts/visual-audit/capture-dashboards-all.mjs` | Standing visual overlap checker |
| `scripts/aggregate-app-health.py` | Dimension scoring |
| `scripts/cron/check-cron-health.ps1` | Standing cron task verifier |
| `scripts/scan-bundle.js` | Bundle-secret scanner |
| `.husky/post-commit` | Wires above into every commit |
| `.claude/state/visual-audit-*/` | Visual audit history |
| `docs/reports/dashboard.html` | Surfaces all standing-check results |

## How to add a new standing check

1. Author the detection script under `scripts/` or `scripts/visual-audit/`
2. Add its invocation to `.husky/post-commit` (or `scripts/cron/downloads-watcher.ps1` for 5-min cadence)
3. Have it emit a JSON or markdown report to `.claude/state/aggregates/` or `.claude/state/pending-review/`
4. Patch `scripts/aggregate-app-health.py` (or `scripts/regen-dashboard.py`) to surface findings on the dashboard
5. Update this doc with the new check + expected state + actions on failure

## Anti-patterns this protocol rules out

- **Founder manually noticing visual overlap.** The agent should detect first.
- **Founder manually checking cron task state.** The agent verifies + surfaces.
- **Founder seeing a RED dimension and asking what's blocking.** The agent surfaces WHAT/WHERE/WHAT-ACTION.
- **Founder asking "is cron working?".** The dashboard's cron_health card answers that always.
- **Founder asking "is the smoke test passing?".** The dashboard's smoke card answers that always.

## Cross-references

- P10 — Actionable Surfacing (every visible state answers WHAT/WHERE/WHAT-ACTION)
- AMD-026 — P10 codification
- AMD-019 / AMD-020 — dashboard freshness + auto-clean
- `task-queue/founder/silence-cron-tasks.md` — cron silencer setup (one-time Founder action)
