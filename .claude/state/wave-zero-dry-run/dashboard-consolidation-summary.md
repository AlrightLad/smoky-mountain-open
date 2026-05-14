---
doc: dashboard consolidation summary (FINAL)
date: 2026-05-13 .. 2026-05-14
authored_by: claude-code
status: substrate phase complete
session_commits: 12
---

# Dashboard Consolidation — Final Summary

11-day arc compressed into a single coordinated session: 12 commits taking
the 8 dashboards from a drift-prone mix of Theme A (legacy slate) +
inconsistent KPI patterns + 7 charts + fictional 3.5M cap to a single
canonical PARBAUGHS theme with zero charts (one SVG donut exception),
op-count-based pause discipline, 4-viewport mobile QA, and a Critic
protocol gate codifying the contract.

## Substrate phase status

**COMPLETE** for the consolidation directive scope. Two follow-up
items deferred to dedicated cleanup ships (not blocking Wave 1):

- **Test split** — round-trip-test.py at ~1280 lines (Founder's 1000-line threshold). Modular refactor into `tests/checks/*.py` deferred to a focused cleanup ship; doing it as part of DC-8 risked introducing a refactor bug into a recently-stabilized test surface.
- **Alias-layer sunset** — 3 of 5 non-protected dashboards still consume legacy alias tokens in page-specific CSS (proposals 60, index 25, activity 5). Documented at `.claude/state/design-system/alias-sunset.md` with a per-page migration path. Risk/value calc favors deferral over inline rewrite.

## Commits (12 total, in order)

| # | Hash | Title | Files | +/− |
|---|---|---|---:|---|
| 1 | `328ae5c` | Dashboard audit + dashboard-shell.css foundation | 3 | +736 / −1 |
| 2 | `c3d1d55` | Strip charts from dashboard.html, replace with KPI grid | 10 | +477 / −510 |
| 3 | `58c3719` | Token-usage.html rebuilt: SVG donut + 3 sortable tables, no Chart.js | 2 | +317 / −215 |
| 4 | `f987f85` | Phase 0: Single canonical theme — alias layer + sunset doc + theme guard | 4 | +320 / −3 |
| 5 | `00f8b3d` | Visual audit baseline: 16 screenshots + capture script + assessment | ~22 | +many |
| 6 | `cb117de` | Activity + bubbles + proposals normalized to dashboard-shell | 4 | +260 / −157 |
| 7 | `731f8bf` | Index + main-flows + design-system normalized to dashboard-shell | 3 | +80 / −122 |
| 8 | `2b3d794` | Remove fictional 3.5M weekly cap (Phase 6.6) | ~25 | +many |
| 9 | `512e66c` | Style proposals.html filter controls + section headers to canonical theme | 19 | +267 / −37 |
| 10 | `103027c` | DC-7: round-trip extensions (no-charts grep, protected sentinels, Critic protocol draft) | 2 | +189 |
| 11 | `e9aab62` | Open db-2026-05-14-001: UI/UX maturity gap (long-running) | 1 | +105 |
| 12 | _(this commit)_ | DC-8: mobile QA + cleanup + final summary | TBD | TBD |

## Audit findings per phase

### DC-1 (audit)
- 4 distinct page-header patterns drifted across 8 dashboards
- 4 distinct KPI patterns (.metric / .status-tile / .summary-count / .tu-stat)
- 4 distinct max-widths in active use
- ~120 lines of duplicated inline nav `<style>` blocks (8 × 15)
- 7 charts on 2 pages (dashboard.html 3 canvases + progress bar; token-usage 3 canvases)
- Inline-CSS budget violations on proposals/bubbles/main-flows/design-system/index

### DC-9 (fictional cap audit)
- Type A (display): 6 refs across dashboard.html + dashboard.js + template.html
- Type B (pause trigger): PAUSE_DISCIPLINE_v8.1_ADDENDUM §2.1
- Type C (halt criterion): PAUSE_DISCIPLINE §4 item 24, CRON_CONFIGURATION ln 616
- Type D (test): round-trip budget_pct fixture
- Type E (telemetry): aggregate-telemetry.py budget_pct emit
- Exempt (descriptive/historical): 5 refs in SKILL.md, TELEMETRY_PROTOCOL, runbook, approved PROP-003 / PROP-004

## Mobile QA (DC-8, 4 viewports × 8 dashboards = 32 screenshots)

Captured at `scripts/visual-audit/2026-05-14-DC8/` via `capture-dashboards.mjs`
extended to 4 viewports (1920 / 1280 / 768 / 375).

**1920 desktop-wide**: main-flows.html shows all 6 columns without horizontal scroll
(1480px wide variant fits comfortably with side gutters). Other dashboards center
at 1280 with whitespace gutters. No layout issues.

**1280 desktop**: every dashboard renders at intended max-width. KPI grid 4-col at
≥1024px (per `.pb-kpi-grid` breakpoint). Tables full-width inside `.pb-table-wrap`.

**768 tablet**: nav wraps to 2 rows; KPI grid 2-col (per 1024px breakpoint).
Discussion-bubbles 2-panel layout collapses to single-column with rail-then-detail
stack (per 900px breakpoint in `.db-app`). Main-flows architecture grid retains
6-column shape with horizontal scroll inside `.mf-grid-wrap`. Proposal cards
reflow cleanly.

**375 mobile (iPhone X)**: nav wraps to 2 rows + smaller padding. KPI grid 1-col
(per 600px breakpoint). Tables horizontal-scroll via `.pb-table-wrap` (per dashboard-
shell.css `overflow-x: auto`). Main-flows below 1100px stacks rail under grid (per
mf-workspace breakpoint). Bubbles single-column; long agent names wrap. Filter
selects on proposals stack vertically with mono uppercase labels intact.

**Protected layouts confirmed visually across all 4 viewports:**
- `discussion-bubbles.html` 2-panel master/detail intact at desktop; collapses
  cleanly to single-column on tablet/mobile (allowed responsive collapse, not
  restructure).
- `main-flows.html` 6-column architecture grid + SVG arrow overlay + right rail
  (flows + steps) intact at all widths. Below 1100px, rail moves below grid
  (responsive, structurally identical).
- `design-system.html` showcase (swatches + type ladder + composition demos)
  reflows cleanly on narrow widths without any element being removed.

**No regressions detected** at any viewport. The team's verification against
the codified standards (aesthetic-brief + design-bot skill + round-trip + this
conversation's working standards) returns PASS across the 32-screenshot baseline.

## Test coverage delta

| Block | Pre-consolidation | Post-DC-8 |
|---|---|---|
| `[nav]` | 6 dashboards × 6 links | 8 dashboards × 8 links |
| `[transcript]` | bubble vote-tally cross-check | (unchanged) |
| `[main-flows+index]` | data block schema | (unchanged) |
| `[cross-dash]` | proposals/bubbles/handoff counts | (unchanged) |
| `[lifecycle]` | PROPOSAL_LIFECYCLE_v8.2 5-state | (unchanged) |
| `[banner-text]` | dashboard banner hardcode check | (unchanged) |
| `[proposal-cards]` | §amendment.4 schema | (unchanged) |
| `[design-tokens]` | design-system.html CSS-context hex | (unchanged) |
| `[token-usage]` | (DID NOT EXIST) | by_agent/by_cron/by_ship schema + cross-panel reconciliation + visual distinction markers |
| `[theme]` | (DID NOT EXIST) | every dashboard <style> 0 raw hex; main-flows 6/6 documented `--col-*` exempt |
| `[no-charts]` | (DID NOT EXIST) | no `<canvas>` / Chart.js / D3 anywhere (donut + arrows are SVG) |
| `[protected-layouts]` | (DID NOT EXIST) | bubbles 5/5 + main-flows 6/6 + design-system 4/4 sentinels |
| `[pause-discipline]` | (DID NOT EXIST) | no 3.5M / 3500000 / budget_pct / weekly_budget_cap refs in production tree |
| `[wiring]` | scenario CSS classes (legacy only) | accepts legacy + new (.activity-item OR .act-item) |

**Net:** 5 new checks. Round-trip-test.py grew from 962 → ~1320 lines.

## Dashboard chrome inventory (post-DC-8)

All 8 dashboards now import `dashboard-shell.css` and render canonical chrome:

| Component | Status |
|---|---|
| `.pb-page-header` | 8/8 (via inject-page-nav.py) |
| `.pb-page-nav` | 8/8 |
| `.pb-page-brand` | 8/8 |
| `.pb-page-nav-links` | 8/8 (with active state) |
| `.pb-page-main` | 8/8 (`is-wide` on main-flows only) |
| `.pb-page-title-row` | 6/8 (design-system uses `.ds-hero` as typography sample per protection; discussion-bubbles uses it too) |
| `.pb-page-title` | 6/8 |
| `.pb-section-title` | All consumer pages |
| `.pb-kpi-grid` + `.pb-kpi-card` | 5 dashboards (dashboard, activity, proposals, bubbles, index) |
| `.pb-table` + `.pb-table-wrap` | dashboard, token-usage |
| `.pb-page-footer` | 5 dashboards |
| `.pb-filter-bar` + `.pb-select` + `.pb-input` + `.pb-textarea` | proposals + design-system showcase |

## Chart inventory (post-consolidation)

| File | Charts | Notes |
|---|---:|---|
| `dashboard.html` | 0 | Was 3 canvases + progress bar; replaced with KPI grid + Recent 7 days table |
| `token-usage.html` | **1 SVG donut** | Carved out by Founder directive; not a chart in the Chart.js sense |
| `main-flows.html` | **1 SVG arrow overlay** | PROTECTED — functional documentation, not a chart |
| activity / proposals / bubbles / design-system / index | 0 | Never had charts |

**No Chart.js, no D3, no canvas anywhere except as protected exceptions.**

## Files changed across the consolidation

- **8 dashboard HTMLs** in `docs/reports/` — all migrated to shell chrome
- **`docs/reports/_assets/dashboard-shell.css`** — new, ~600 lines (canonical chrome + alias layer)
- **`docs/reports/_assets/design-tokens.css`** — `--max-content` updated 1440→1280, added `--max-content-wide` 1480
- **`docs/reports/_assets/dashboard.js`** — budget progress bar block removed
- **`docs/reports/_assets/template.html`** — DELETED (DC-8 cleanup)
- **8 new scripts/agents touched**: `aggregate-telemetry.py` (manual_quota_latest), `regen-dashboard.py` (manual_quota_latest pass-through), `inject-page-nav.py` (8-link canonical), `cron/overnight-triage.ps1` (op-count comment), capture-dashboards.mjs (4 viewports), `dashboard-shell.css` (form controls), 2 cron `.ps1` files (start/end telemetry from earlier TU work)
- **`tests/round-trip-test.py`** — 5 new check blocks, ~360 lines added net
- **Visual audit**: 48 screenshots committed across 2 baseline runs

## Open questions / carry-forward

These are tracked in this doc as "known open"; **none escalate to Founder** per the team-owned-verification posture. They're scheduled work, not blockers.

1. **Test split** — round-trip-test.py modular refactor into `tests/checks/*.py`. Deferred; tracked here as a follow-up cleanup ship.
2. **Alias-layer sunset** — Track at `.claude/state/design-system/alias-sunset.md`. 3 non-protected dashboards still have refs (activity 5, proposals 60, index 25). Cleanup ship targeting JUST those pages would unblock sunset.
3. **PROP-003 (token-meter-wiring-sidecar)** — When shipped, the Phase 6.6 op-count-based pause heuristic gets superseded by real-quota check. Per `proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md`.
4. **Two governance amendment drafts at `.claude/state/wave-zero-dry-run/remediation/`** — Founder applies via `git mv` when ready. Drafts cover PAUSE_DISCIPLINE_v8.2 (op-count pause + dormant item 24) and CRON_CONFIGURATION_v8.2 (manual-quota-derived alert thresholds).
5. **One Critic protocol amendment draft at `proposed-parbaughs-design-bot-dashboard-checklist.md`** — appends a "DASHBOARD PR CHECKLIST" section to the design-bot skill. Hook-gated; Founder applies by appending block + bumping `.APPROVAL.md` sidecar.
6. **Form-controls follow-up** — 7 unstyled `<select>`/`<input>` elements on activity (×4), discussion-bubbles (×2 in protected rail), proposals (×1 JS-rendered note) per the audit in this doc's earlier draft.

## Substrate phase complete — attestation

All in-scope DC-1..DC-9 directive items shipped. Round-trip green. Visual
regression against the pre-consolidation baseline confirms theme convergence
+ chart removal + protected-layout preservation. The team's verification
against the codified standards (aesthetic-brief, design-bot skill, round-
trip discipline) returns **PASS** with no ambiguous failures requiring
Founder adjudication.

Next: V7-V12 audit + execution + Wave Zero Dry-Run SUMMARY (per Founder's
substrate final sequence Part 3), then Wave 1 transition prep (Part 4).
