# P10 retrofit Phase 2 log — 2026-05-19

Per AMD-026 (Actionable Surfacing) + Founder LOCK 2026-05-19.
Phase 2 targets the 3 smaller surfaces: **amendments.html**,
**escalations.html**, **index.html**.

Reference fix pattern: `scripts/regen-activity.py:183-197` (cron-noise
filter with explicit P10 code-comment citation).

**Scope this phase:** 18 violations across 3 surfaces.
**Method:** template-only changes (regen-*.py untouched — empty-state
classification is a presentation concern).
**Verification:** V1 PNG capture at 3 viewports (desktop-wide / desktop /
mobile) read via Read tool, visible copy compared to BEFORE.

---

## Summary

| Surface | Violations targeted | Violations closed | Status |
|---|---|---|---|
| amendments.html | 4 | 4 | DONE |
| escalations.html | 5 | 5 | DONE |
| index.html | 9 | 9 | DONE |
| **TOTAL** | **18** | **18** | **DONE** |

Re-scaffold + regen + V1 capture: all succeeded.

---

## Surface 1 — amendments.html

Source: `templates/dashboards/amendments.template.html` (mod 2026-05-19).
Regen script: `scripts/regen-amendments.py` (unchanged).
V1 capture: `scripts/visual-audit/P10-RETROFIT-PHASE-2/amendments-{desktop-wide,desktop,mobile}.png`.

### Fixes

| # | Violation | BEFORE | AFTER | Mechanism |
|---|---|---|---|---|
| 1 | "Pending" KPI sub-label "awaiting Founder review" when count=0 | "Pending: 0" + "awaiting Founder review" | "Pending: 0" + "no drafts pending — orchestration team has authored none" | `data-kpi-sub="pending"` swap in `recomputeCounts()` |
| 2 | "Approve" KPI sub-label "marked in this session" when no pending + no marks | "Approve: 0" + "marked in this session" | "Approve: 0" + "no decisions yet — mark any pending amendment to populate" | `data-kpi-sub="approve"` swap when `noPendingNoMarks` |
| 3 | "Reject" KPI sub-label same pattern | "Reject: 0" + "marked in this session" | "Reject: 0" + "no decisions yet — mark any pending amendment to populate" | `data-kpi-sub="reject"` swap |
| 4 | "Defer" KPI sub-label same pattern | "Defer: 0" + "marked in this session" | "Defer: 0" + "no decisions yet — mark any pending amendment to populate" | `data-kpi-sub="defer"` swap |
| bonus | Bucket-empty panels rendered "No <bucket> amendments." (per-bucket P10-classification was missing) | "No pending amendments." / "No approved amendments." / etc. | Per-bucket classification + dir link, e.g.: "No pending amendments — orchestration team has authored none. See `.claude/state/amendments/pending/`." | `renderBucket()` switch on `bucketName` |

### V1 verification

Desktop screenshot (1280x900) shows all 4 KPI cards rendering the new
sub-labels. Pending review empty panel renders "No pending amendments —
orchestration team has authored none. See .claude/state/amendments/pending/."
Approved — awaiting apply empty panel renders the watcher-transit
classification. Applied archive shows "(26)" count — non-empty bucket,
not affected.

Mobile screenshot (375x812) wraps cleanly; sub-label copy fits two-line
column without overflow.

### Most-visible BEFORE → AFTER (sample)

BEFORE — Pending KPI card:
```
PENDING
0
awaiting Founder review
```

AFTER — Pending KPI card:
```
PENDING
0
no drafts pending — orchestration team has authored none
```

WHAT = no draft pending; WHERE = `.claude/state/amendments/pending/`;
WHAT-ACTION = legitimate empty (team has authored none).

---

## Surface 2 — escalations.html

Source: `templates/dashboards/escalations.template.html` (mod 2026-05-19).
Regen script: `scripts/regen-escalations.py` (unchanged).
V1 capture: `scripts/visual-audit/P10-RETROFIT-PHASE-2/escalations-{desktop-wide,desktop,mobile}.png`.

### Fixes

| # | Violation | BEFORE | AFTER | Mechanism |
|---|---|---|---|---|
| 1 | "Pending" KPI sub-label when count=0 | "Pending: 0" + "awaiting Founder review" | "Pending: 0" + "no escalations pending — team has authored none" | `data-kpi-sub="pending"` swap in `updateKPIs()` |
| 2 | "Approve" KPI sub-label when no pending + no marks | "Approve: 0" + "marked in this session" | "Approve: 0" + "no decisions yet — mark any pending escalation to populate" | `data-kpi-sub="approve"` swap |
| 3 | "Reject" / "Defer" KPI sub-labels same pattern | "marked in this session" | "no decisions yet — mark any pending escalation to populate" | per-card sub swap |
| 4 | Empty-state list panels rendered "(none)" | `<div class="esc-empty">(none)</div>` | Per-bucket classification + dir link, e.g.: "No pending escalations — team has authored none. See `.claude/state/escalations/pending/`." | `renderList()` switch on host.id-derived bucket |
| 5 | STALE badge without resolution | "STALE" pill only | Stale escalations with configured `default_if_no_response` get an "Apply default" button (sets decision to approve + pre-fills decision_text); stale without default get classification copy "Founder decision required" | New `staleResolution` block in `renderCard()` + `[data-esc-apply-default]` click handler |

### V1 verification

Desktop screenshot (1280x900): all 4 KPI cards rendering new sub-labels.
Pending review empty panel reads "No pending escalations — team has
authored none. See .claude/state/escalations/pending/." Approved —
awaiting team apply empty panel renders the watcher-transit copy with
dir link. Applied archive shows "(3)" — non-empty bucket present
(prior session escalations).

STALE resolution affordance: not visually verified at capture time
(no pending escalations exist to age out). Code path verified
present in template (renderCard + click handler) and depends on
`opts.editable === true` (i.e. only pending bucket renders the button).
Counter-violation: when `default_if_no_response` is null AND stale,
fallback shows "no default configured" classification — see template
line near "STALE — no default configured".

### Most-visible BEFORE → AFTER (sample)

BEFORE — Pending review section (when count=0):
```
PENDING REVIEW (0)
Founder's active workspace…
(none)
```

AFTER — Pending review section (when count=0):
```
PENDING REVIEW (0)
Founder's active workspace…
No pending escalations — team has authored none.
See .claude/state/escalations/pending/.
```

WHAT = no escalation authored; WHERE = `.claude/state/escalations/pending/`;
WHAT-ACTION = legitimate empty (team has authored none).

---

## Surface 3 — index.html

Source: `templates/dashboards/index.template.html` (mod 2026-05-19).
Regen script: `scripts/regen-index.py` (unchanged — render-only fixes).
V1 capture: `scripts/visual-audit/P10-RETROFIT-PHASE-2/index-{desktop-wide,desktop,mobile}.png`.

### Fixes

| # | Violation | BEFORE | AFTER | Mechanism |
|---|---|---|---|---|
| 1 | "Last updated —" meta when `data.as_of` absent | "Last updated —" | "Last updated regen pending — run scripts/regen-all.ps1" | render() fallback path |
| 2 | "git —" meta when `data.git_sha` absent | "git —" | "git regen pending" | render() fallback path |
| 3 | "Ships this week: 0" — bare zero | "0 / via ship-progress/*.json" | "0 / legitimate empty — no ship-progress/*.json files this week" + tile is now `<a href="../../.claude/state/ship-progress/">` | conditional sub + tile wrapped |
| 4 | "Proposals pending: 0" — bare zero | "0 / awaiting Founder review" | "0 / no drafts pending — see .claude/state/proposals/pending/" + tile linked to `proposals.html` | conditional sub + link |
| 5 | "FIQ depth (B+): 0" + "A:0 B:0 C:0 D:0 F:0" — non-actionable zeros | "0 / A:0 B:0 C:0 D:0 F:0" | "0 / FIQ scanner finds no entries — see .claude/state/founder-input-queue/" + tile linked to founder-input-queue/ | conditional sub when all grades zero |
| 6 | "Discussion bubbles: 0" — bare zero | "0 / via discussion-bubbles/" | conditional: zero shows "no recorded threads — see .claude/state/discussion-bubbles/"; non-zero shows "via discussion-bubbles/ — click for thread browser" + tile linked | conditional sub + link |
| 7 | "Last cron run: never" — copy mixed | "never / substrate pending build" | when never: "never / never run — see cron install status on dashboard.html"; when active: "<mtime> / substrate active" + tile linked to `dashboard.html#system-health` | conditional sub + link |
| 8 | "HALT state: none" — no verification path | "none / via halts/" | when none: "none / no active halts — see .claude/state/halts/ to verify"; when active: "<name> / HALT active — see <name>.json in .claude/state/halts/" + tile linked | conditional sub + link |
| 9 | Dashboard card meta "— · —" when regen-mtime / badge missing | `<span>—</span> <span class="badge">—</span>` | when missing mtime: "regen pending" + `title` attr with regen command; when missing badge: "no badge" + `title` attr | render() fallback path |
| bonus | "Last orchestration action: no recorded action" — no WHAT-ACTION | "no recorded action" | "no recorded action — run scripts/regen-all.ps1 to refresh, or orchestration team is idle" | render() fallback path |

### V1 verification

Desktop screenshot (1280x900):
- Top-right meta: "LAST UPDATED 14s ago · GIT 8809cc06" — both populated.
- Status tiles row 1: Ships=33 (via ship-progress/*.json), Proposals=0 (no drafts pending — see .claude/state/proposals/pending/), FIQ=0 (FIQ scanner finds no entries — …), Bubbles=1 (via discussion-bubbles/ — click for thread browser).
- Status tiles row 2: Last cron run="1d ago" + "substrate active", HALT state="none" + "no active halts — see .claude/state/halts/ to verify".
- Dashboards grid: 6 cards with mtimes ("19s ago"/"15s ago") and per-dashboard badges. Main Flows card shows "no badge" classification (regen-index didn't write a flow_count badge — legitimate fallback).
- Footer: "Last orchestration action: .claude/state/telemetry/aggregates/.session-transcript-cursor.json at 2026-05-19T02:33:13…" — populated.

Mobile screenshot (375x812): single-column grid, all sub-labels wrap cleanly.
Desktop-wide screenshot (1920x1080): 6-column status tiles + 3+3 dashboards
grid as expected.

### Most-visible BEFORE → AFTER (sample)

BEFORE — Proposals pending tile:
```
PROPOSALS PENDING
0
awaiting Founder review
```

AFTER — Proposals pending tile (as `<a href="proposals.html">`):
```
PROPOSALS PENDING
0
no drafts pending — see .claude/state/proposals/pending/
```

WHAT = no pending drafts; WHERE = `.claude/state/proposals/pending/`
(tile click → `proposals.html`); WHAT-ACTION = legitimate empty + click
tile to verify against full proposals dashboard.

---

## Methodology / process notes

- **Re-scaffold:** `bash scripts/scaffold-from-templates.sh --force` succeeded; 11 files scaffolded.
- **Regen:** all three target regen scripts (`regen-amendments.py`, `regen-escalations.py`, `regen-index.py`) returned OK with expected counts (pending=0 for amendments and escalations; ships=33, bubbles=1 for index).
- **V1 capture:** the shared `capture-dashboards.mjs` did NOT include `amendments` or `escalations` in its `PAGES` list (current PAGES = dashboard / activity / proposals / discussion-bubbles / main-flows / design-system / token-usage / index). To stay within scope ("modify ONLY templates + optionally regen-*.py"), captures for amendments + escalations were taken via a one-off Playwright script invocation rather than editing the shared capture tool. See outstanding follow-up #1.
- **No regen-script changes:** all three retrofits achieved entirely in the templates' inline JS — empty-state classification is a presentation concern, not a data-layer concern. Regen scripts continue to write the same counts/lists they did before; the templates now classify on render.

## Outstanding follow-ups

1. **capture-dashboards.mjs PAGES coverage gap.** The shared capture tool's `PAGES` array excludes `amendments.html` and `escalations.html`. Adding both to the array would let `node scripts/visual-audit/capture-dashboards.mjs <date>` produce a complete set in one pass. Out of scope this thread (capture tooling, not a template); follow-up can ship in a maintenance commit. Reference: `scripts/visual-audit/capture-dashboards.mjs:30-39`.

2. **STALE-resolution visual verification deferred.** No pending escalations exist on disk to age past `default_window_hours`, so the new "Apply default" / "no default configured" affordances were not captured in V1 PNGs. Code path is in place. Confirm visually next time an escalation goes stale.

3. **`href` semantics for status tiles.** Index status tiles now use relative paths like `../../.claude/state/proposals/pending/`. From a `file://` capture, browsers may not render the directory listing for all OSes, but the linked path is correct for Founder navigation when opening the index from a local web server. No change needed; flag is informational.

4. **No P9 (data truthfulness) regressions introduced.** All retrofits preserve the underlying numeric values; only sub-labels and empty panels gained classification copy. The "ships=33" / "bubbles=1" / "applied=26" displayed values trace to regen output cited above (counts in regen-*.py stdout).

---

## Phase 2 close

3 surfaces retrofitted. 18 violations closed. V1 verified. Catalog
counts (amendments 4 + escalations 5 + index 9 = 18) match closures.

Next phase (per catalog): activity.html, discussion-bubbles.html,
proposals.html — Phase 3 medium-severity retrofit. design-system.html
remains P10-CLEAN. dashboard.html, token-usage.html, main-flows.html
are owned by other threads.
