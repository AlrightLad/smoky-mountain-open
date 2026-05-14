---
doc: dashboard consolidation summary (in-progress)
date: 2026-05-13 .. ongoing
authored_by: claude-code
status: partial — final summary written in DC-8
---

# Dashboard Consolidation — Summary (in-progress)

Final summary will be assembled in DC-8 once mobile QA + cleanup are
complete. This file is currently an open-items + audit-findings
holding area to keep state visible to Founder between commits.

## Open: form controls audit (DC-FIX1)

DC-FIX1 styled the proposals.html filter row (Lane / Status / Sort
dropdowns) to the canonical `.pb-filter-bar` + `.pb-select` pattern.
The same unstyled controls exist on two other dashboards but were
NOT fixed in DC-FIX1 (out of scope; per Founder discipline rule).

### Other dashboards with the same issue

| File | Line | Element | Notes |
|---|---:|---|---|
| `activity.html` | 101 | `<select id="filter-scenario">` | 4-row Stream filter (Scenario / Agent / Ship / Range) — currently uses `.act-filter-label` / native `<select>` inside `.act-filters` flex row. Visual rendering is acceptable but inconsistent with proposals.html now that proposals adopted `.pb-select`. |
| `activity.html` | 107 | `<select id="filter-agent">` | same Stream row |
| `activity.html` | 111 | `<select id="filter-ship">` | same Stream row |
| `activity.html` | 115 | `<select id="filter-range">` | same Stream row |
| `discussion-bubbles.html` | 424 | `<select id="filter-status">` | Left-rail thread-filter dropdown — protected 2-panel layout has its own page-specific styling; migration would need care to preserve the rail's existing visual rhythm |
| `discussion-bubbles.html` | 432 | `<select id="filter-ship">` | same rail |
| `proposals.html` | 726 (JS-rendered) | `<input type="text">` for decision-note row | JS template string emits raw `<input>`; should adopt `.pb-input`. Will be a small Edit once decided. |

### Recommended action (post-consolidation cleanup ship)

Migrate activity.html + discussion-bubbles.html selects to `.pb-select`
in a follow-up surgical commit (parallel to DC-FIX1 in scope and size).
The proposals.html decision-note input is JS-rendered so requires
changing the template string in the inline `<script>`, not a static
HTML edit — about 15 minutes of surgical work.

Bubbles' rail selects need a width override for the cramped 360px rail
(`.pb-select { min-width: 140px; }` is wider than the rail comfortably
allows — likely needs `min-width: 0; width: 100%;` inside the rail
context).

## What's already committed in DC-FIX1

- `_assets/dashboard-shell.css`: added `.pb-filter-bar`, `.pb-filter-group`,
  `.pb-filter-label`, `.pb-select`, `.pb-input`, `.pb-textarea` form-
  control primitives with default + hover + focus + disabled states and
  a custom SVG chevron for selects (brass-tinted).
- `docs/reports/proposals.html`: filter row migrated; 5 `.section-header`
  → `.pb-section-title`; selects gain `.pb-select` class; labels become
  `<label for="...">` (a11y improvement) wearing `.pb-filter-label`.
- `docs/reports/design-system.html`: new "Form controls" showcase section
  added before the Composition Examples section. Demos `.pb-select`,
  `.pb-input` (with placeholder), `.pb-textarea`, and a disabled-state
  example. Critic + future agents use this as the canonical reference.

## Commits to date (consolidation sequence)

| # | Hash | Title |
|---|---|---|
| 1 | `328ae5c` | Dashboard audit + dashboard-shell.css foundation |
| 2 | `c3d1d55` | Strip charts from dashboard.html, replace with KPI grid |
| 3 | `58c3719` | Token-usage.html rebuilt: SVG donut + 3 sortable tables, no Chart.js |
| 4 | `f987f85` | Phase 0: Single canonical theme — alias layer + sunset doc + theme guard |
| 5 | `00f8b3d` | Visual audit baseline: 16 screenshots + capture script + assessment |
| 6 | `cb117de` | Activity + bubbles + proposals normalized to dashboard-shell |
| 7 | `731f8bf` | Index + main-flows + design-system normalized to dashboard-shell |
| 8 | `2b3d794` | Remove fictional 3.5M weekly cap (Phase 6.6) |
| 9 | _(this commit)_ | Style proposals.html filter controls + section headers to canonical theme |

## Remaining

- **DC-7** — Round-trip test extension: no-charts grep across `docs/reports/`
  (allow exceptions for `main-flows.html` SVG + `token-usage.html` donut),
  shell-import assertion, protected-layout sentinels for
  `discussion-bubbles.html` 2-panel + `main-flows.html` grid+arrows +
  `design-system.html` showcase, Critic protocol update, pause-discipline
  assertions (already partially shipped in DC-9).
- **DC-8** — Mobile/responsive QA at 375/768/1280/1920. Alias sunset
  (delete the alias `:root` block from dashboard-shell.css if all
  dashboards reach 0 alias refs). Delete `_assets/template.html` (stale
  Chart.js boilerplate). Clean dead `.page-main` / `.page-header-row` /
  `.page-title` / `.page-subtitle` CSS rules in main-flows.html (no
  longer matches any markup). Final summary written here.

## Open dependency

PROP-003 (token-meter-wiring-sidecar) — when shipped, the Phase 6.6
op-count-based pause heuristic gets superseded by a real-quota check.
Tracked in proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md.
