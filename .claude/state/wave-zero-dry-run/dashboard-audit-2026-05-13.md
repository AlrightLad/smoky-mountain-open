---
audit: dashboard chrome + content state
date: 2026-05-13
authored_by: claude-code
scope: docs/reports/*.html (8 dashboards)
purpose: input for dashboard consolidation Phase 2-7
---

# Dashboard Audit — 2026-05-13

Read-only structural survey of all 8 dashboards. Output is the input for
Phase 2 chart-strip, Phase 3 `dashboard-shell.css` foundation, and Phase 4
responsive normalization.

## Summary findings

| Drift pattern | Severity | Pages affected |
|---|---|---|
| Two distinct page-header patterns (`.report-header` eyebrow+h1 vs. `.page-header-row` title) | Major | All 8 |
| Four distinct max-width values (1280 default / 1480 main-flows / `var(--max-content)` token-usage / unset proposals) | Major | All 8 |
| Two distinct KPI cell patterns (`.metric` vs. `.status-tile`) | Major | dashboard + index |
| Nav `<style>` block duplicated inline ~15 lines × 8 = ~120 wasted lines | Major | All 8 |
| Legacy `--bg-*` / `--accent-brass` tokens vs. canonical `--pb-*` layer | Major | 7 of 8 (design-system is sole exception) |
| Theme-toggle button on some, not others | Minor | dashboard, activity have it; rest don't |
| Inline-CSS bloat beyond 30-line budget | Major | proposals, discussion-bubbles, main-flows, design-system, index |
| Charts to remove | Spec mandate | dashboard (4), token-usage (3) |

## Chart inventory (Phase 2 strip list)

| File | Element | Line | Disposition |
|---|---|---|---|
| dashboard.html | `<canvas id="chart-tokens-by-role">` | 128 | **STRIP** |
| dashboard.html | `<canvas id="chart-token-trend">` | 137 | **STRIP** |
| dashboard.html | `<canvas id="chart-cycle-outcomes">` | 146 | **STRIP** |
| dashboard.html | `.progress` weekly budget bar | 111-113 | **STRIP** (spec: "still a chart") |
| dashboard.html | Chart.js CDN `<script>` | 346-347 | **STRIP** |
| token-usage.html | `<canvas id="tu-chart-by-agent">` | 127 | **REPLACE** with SVG donut (one donut total) |
| token-usage.html | `<canvas id="tu-chart-by-cron">` | 145 | **STRIP** (donut covers source breakdown) |
| token-usage.html | `<canvas id="tu-chart-by-ship">` | 158 | **STRIP** |
| token-usage.html | Chart.js CDN `<script>` | 170 | **STRIP** |
| main-flows.html | `<svg class="mf-arrows">` | 166 | **KEEP** (Protected Layout 2; functional arrow overlay) |
| design-system.html | swatch chips | 139-167 | **KEEP** (visual reference, not chart) |
| _assets/template.html | Chart.js boilerplate | 103-104, 120 | (template file, not published; will go stale — flag for cleanup in DC-8) |

Total charts to remove: **7 canvases + 2 Chart.js CDN imports + 1 progress bar**.
One SVG donut introduced (token-usage replacement; max-width 400px,
`--pb-billiard-green-*` / `--pb-brass-*` / `--pb-chalk-300` token-driven, no
library dependency).

## Per-dashboard audit

### 1. dashboard.html (413 lines)

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` (canonical nav, post-inject-page-nav.py) | legacy `--bg-elevated` etc. | 20-34 |
| Page title | `.report-header` → `.container` → `.report-meta` eyebrow + `.report-title` h1 + `.report-subtitle` | legacy | 37-46 |
| Theme toggle | `.theme-toggle` button absolutely positioned | n/a | 35 |
| Container | `.container` (likely 1280px from dashboard.css) | legacy | 48 |
| KPI cells | `.metrics-grid` with `.metric` / `.metric-label` / `.metric-value` / `.metric-trend` | legacy | 49-83 |
| Banner | `.section[data-banner="proposals"]` — inline-styled card with `border: 1px solid var(--accent-amber); background: linear-gradient(...)` | legacy + inline style | 85-93 |
| Quick links | `.charts-grid` with three `.card` elements (misnamed; not actually charts) | legacy | 95-102 |
| Weekly budget | `.progress` bar (literal chart per spec) | legacy | 104-116 |
| Trends section | 3 `.chart-container` `<canvas>` elements + Chart.js render | legacy | 118-149 |
| Tables | `.tables-grid` with `.data-table` (handoffs, ships) | legacy | 151-189 |
| Footer | `.report-footer` `.container` with `.text-faint` | legacy | 201-217 |
| Inline `<style>` | Nav block only (~17 lines) | within budget | 8-17 |
| Inline-style attributes | Banner gradient + progress bar width | violations | 86, 112, 195 |
| Charts | 3 canvases + Chart.js + 1 progress bar | — | 128/137/146/111/346 |
| Width handling | Inherits from dashboard.css | unverified responsive | — |

### 2. activity.html (175 lines)

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` | legacy | 44-58 |
| Page title | `.report-header` `.container` `.report-meta` + `.report-title` "Agent Activity" + `.report-subtitle` | legacy | 60-66 |
| Theme toggle | Present | n/a | 59 |
| Container | `.container` | legacy | 67 |
| KPI cells | **None** — page is feed-style, missing the spec's required KPI strip | — | — |
| Filters | `.filters` with 4 `.filter-group` (select inputs) | legacy | 69-82 |
| Stream | `.activity-stream` master feed + `.activity-card` items + `.day-divider` | legacy | 83 |
| Footer | `.report-footer` | legacy | 89-95 |
| Inline `<style>` | ~33 lines (scenario dots + nav block) | over 30-line budget | 8-41 |
| Charts | None | — | — |
| Width handling | Inherits from dashboard.css | unverified | — |

### 3. proposals.html (823 lines)

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` | legacy | (post-inject region) |
| Page title | Has summary-bar pattern (counts + actions); no `.report-header` | legacy | — |
| Summary bar | `.summary-bar` sticky with `.summary-counts` × 5 cells (pending/approved/etc.) | legacy | 77-103 |
| KPI cells | `.summary-count` with `.label` + `.value` (variant: approve/reject/defer/pending) | legacy — **third distinct KPI pattern** | 92-103 |
| Proposal cards | `.proposal-card` with state variants (`.decided-approved`, etc.); heavy inline CSS | legacy | 9-21+ |
| Decision bar | `.decision-bar` with `.btn.btn-approve/reject/defer` + `.decision-note-row` | legacy | 35-75 |
| Inline `<style>` | ~200 lines (well over 30-line budget) | violation | 8-200+ |
| Charts | None | — | — |
| Width handling | Inherits from dashboard.css | unverified | — |

### 4. discussion-bubbles.html (1029 lines) — **PROTECTED LAYOUT 1**

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` | legacy | (post-inject region) |
| **Protected 2-panel layout** | `.db-app` CSS Grid: `360px 1fr` columns, `calc(100vh - 140px)` height, collapses to single-col at `max-width: 900px` | legacy | 14-28 |
| Rail (master) | `.db-rail` with header (filters + count) + `.db-thread-list` `<ul>` + `.db-day-divider` sticky headers | legacy | 31-91 |
| Detail (pane) | (not yet inspected — assumed `.db-detail` or equivalent) | legacy | 90+ |
| KPI cells | **None** — spec requires KPI strip above 2-panel area | — | — |
| Inline `<style>` | Hundreds of lines (well over budget) | violation; tolerated as protected layout has its own brief | 8+ |
| Charts | None | — | — |
| Width handling | `@media (max-width: 900px)` re-stacks to single column | partial | 25-28 |

### 5. main-flows.html (1242 lines) — **PROTECTED LAYOUT 2**

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` (custom 1480px max-width — wider than other pages) | legacy | 22-28 |
| Page title | `.page-header-row` + `.page-title` "Architecture & Flows" + `.page-subtitle` | legacy | 31-33, 148-153 |
| Container | `.page-main` (1480px, wider than other pages) | legacy | 30, 147 |
| Caveats banner | `.mf-caveats` (informational only) | legacy | 126-127, 155-159 |
| Legend | `.mf-legend` with column color swatches | legacy | 36-38, 161 |
| **Protected: 6-col grid** | `.mf-workspace` 2-col grid (`1fr 360px`, collapses at 1100px); `.mf-grid` 6-col `repeat(6, minmax(140px, 1fr))` with min-width 900px | legacy + custom `--col-*` palette | 41-71, 163-167 |
| **Protected: SVG arrows** | `<svg class="mf-arrows">` overlay positioned absolute inset:0, pointer-events: none | brass token | 86-91, 166 |
| **Protected: flow + steps rails** | `.mf-rail` sticky right column with `.mf-card` (Flows list + Steps panel) | legacy | 93-123, 169-186 |
| KPI cells | **None** — spec says no KPI strip (this page is reference, not status) | per spec | — |
| Inline `<style>` | ~120 lines (over budget; protected by Phase 6.5) | tolerated | 8-128 |
| Charts | None (SVG arrows are functional documentation, not chart) | — | — |
| Width handling | 1480 max, breakpoint at 1100px stacks rail under grid | partial | 42-45, 50-52, 94-95 |

### 6. design-system.html (422 lines) — **PROTECTED LAYOUT 3**

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` (post-inject) | legacy nav, `--pb-*` body | 106-120 |
| Hero | `.ds-hero` with `.ds-hero-eyebrow` + h1 + `.lede` | **canonical `--pb-*`** | 125-129 |
| **Protected: swatches** | `.ds-swatches` (5+ per palette section) with `.ds-swatch` cells: chip + name + hex + note | `--pb-*` | 132-168 |
| **Protected: typography ladder** | `.ds-type-row` lines exhibiting `--text-display/2xl/xl/lg/base/sm/xs/2xs` | `--pb-*` | 178+ |
| **Protected: component primitives** | scorecard rows + leaderboard rows + button variants + cards | `--pb-*` | 80-101+ |
| KPI cells | **None** (page is reference, not status) | per spec | — |
| Inline `<style>` | ~80 lines (over budget; protected) | tolerated | 8-102 |
| Charts | None | — | — |
| Width handling | Unknown (no obvious breakpoint) | needs Phase 4 audit | — |

### 7. index.html (416 lines)

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` | legacy | 205-219 |
| Page title | `.page-header-row` + `.page-title` "PARBAUGHS Orchestration" + `.page-subtitle` | legacy | 222-227 |
| Container | `.page-main` (1280px) | legacy | 221 |
| KPI cells | `.status-panel` grid with `.status-tile` / `.status-tile-label` / `.status-tile-value` / `.status-tile-sub` (variants: is-positive/is-warning/is-danger) | legacy — **second distinct KPI pattern** | 64-101 |
| Dashboards grid | `.dashboards-grid` with `.dashboard-card` cells (name + purpose + meta + badge) | legacy | 103-159 |
| Quick links | `.quick-links` with `.quick-link` cells | legacy | 161-184 |
| Footer | `.index-footer` (custom; not `.report-footer`) | legacy | 186-201 |
| Inline `<style>` | ~200 lines (well over budget) | violation | 8-202 |
| Charts | None | — | — |
| Width handling | `repeat(auto-fit, minmax(260px, 1fr))` for cards; `minmax(160px, 1fr)` for tiles | partial | 71, 114, 164 |

### 8. token-usage.html (370 lines)

| Element | Pattern | Token layer | Lines |
|---|---|---|---|
| Page header | `.page-header` + `.page-nav` (custom — uses `--bg-surface` not `--bg-elevated`) | mix `--bg-*` + `--pb-*` | 13-19, 72-86 |
| Page title | `.tu-hero` with h1 "Token usage" + p lede | mixed | 23-25, 89-92 |
| Container | `main` with `max-width: var(--max-content, 1280px)` | mix | 21, 88 |
| All-time panel | `.tu-all-time` sticky flex with `.tu-stat` cells (`.is-real / .is-estimated / .is-manual`) + refresh button | mix | 28-40, 94-119 |
| KPI cells | `.tu-stat` (fourth distinct KPI pattern: column-flex label-over-value) | mix | 29-37 |
| Panels | `.tu-panel` × 3 with `.tu-panel-header` + `.tu-panel-title` + `.tu-panel-sub` + `<canvas>` + `.tu-table` | mix | 42-67, 121-163 |
| Tables | `.tu-table` (column-aligned, mono-numeric, tabular-nums) | mix | 56-63, 133-136 |
| Footnotes | `.tu-footnote` with `border-left: 2px solid var(--pb-warning)` | mix | 65-67, 165-167 |
| Inline `<style>` | ~67 lines (over 30-line budget) | violation | 9-68 |
| Charts | 3 Chart.js canvases (lines 127, 145, 158) + Chart.js CDN (line 170) | — | **TO REBUILD** |
| Width handling | Inherits from `--max-content` token | unverified | — |

## Token-layer migration scope

Only **design-system.html** uses the canonical `--pb-*` palette as primary
consumer. **token-usage.html** uses a mix. **6 of 8 dashboards** still
consume legacy `--bg-elevated`, `--accent-brass`, `--space-N`, `--text-secondary`,
etc. from `_assets/dashboard.css`.

Phase 3 `dashboard-shell.css` writes against `--pb-*` directly per Founder
visual standard (`--pb-billiard-green-900` page bg / `--pb-brass-500` active /
`--pb-chalk-50` h1 / `--pb-chalk-400` brand line / etc.). The 7 legacy
consumers pick up the new tokens via the shared shell automatically when
they swap `.metric`/`.status-tile`/`.summary-count` → `.pb-kpi-card`.

## Two distinct page-header patterns (must collapse to one)

**Pattern A — `.report-header` (legacy):**
- Used by: dashboard.html, activity.html (probably proposals.html — its summary-bar replaces it)
- Structure: `<header class="report-header"><div class="container">` → eyebrow span ("DASHBOARD" / "ACTIVITY FEED") + h1 (`.report-title`) + subtitle (`.report-subtitle`)
- Eyebrow + timestamp on one row, h1 below, subtitle below that

**Pattern B — `.page-header-row` (newer):**
- Used by: index.html, main-flows.html, design-system.html (different again), token-usage.html (`.tu-hero` variant)
- Structure: `<div class="page-header-row"><div>` → h1 (`.page-title`) + p subtitle (`.page-subtitle`)
- Optional right-side meta cluster (last-updated, git sha)

Phase 3 spec is closer to Pattern B + a brand-line eyebrow above. Resolution:
canonical `.pb-page-header` carries
- brand line (mono, uppercase, `--pb-chalk-400`, all caps)
- nav links pill row underneath
- divider hairline
- h1 (`.pb-page-title`, `--text-2xl`, weight 600, `--pb-chalk-50`)
- optional p.pb-page-subtitle (`--pb-chalk-200`)

## Four distinct max-widths

| Width | Used by |
|---|---|
| `.container` (default 1280px from dashboard.css) | dashboard, activity, proposals |
| `.page-main` 1280px | index |
| `.page-main` 1480px | main-flows (wider for arch grid) |
| `main` `var(--max-content, 1280px)` | token-usage |

Phase 3 standard: declare `--pb-max-content: 1280px` in design-tokens.css (or
shell), with `--pb-max-content-wide: 1480px` exposed for main-flows opt-in.
Every shell consumer uses `--pb-max-content` unless it explicitly opts in.

## Four distinct KPI patterns (must collapse to one)

| Pattern | Used by | Visual |
|---|---|---|
| `.metric` + `.metric-label` + `.metric-value` + `.metric-trend` | dashboard | label-above, value-large, trend-below |
| `.status-tile` + `.status-tile-label` + `.status-tile-value` + `.status-tile-sub` (with `is-positive/is-warning/is-danger` border-left variants) | index | label-above, value-mono, sub-below, color-coded left border |
| `.summary-count` + `.label` + `.value` (with `.approve/.reject/.defer/.pending` color variants) | proposals | label-above, value-large + color-coded |
| `.tu-stat` + `.tu-stat-label` + `.tu-stat-value` (`.is-real/.is-estimated/.is-manual`) | token-usage | label-above, value-large + color-coded |

Phase 3 standard: `.pb-kpi-card` with `.pb-kpi-label` (mono uppercase tracked
`--text-xs` `--pb-chalk-400`) + `.pb-kpi-value` (mono tabular-nums
`--text-3xl` weight 700 `--pb-chalk-50`) + `.pb-kpi-sub` (`--text-xs`
`--pb-chalk-300`). Variants: `.is-positive` (`--pb-success`), `.is-warning`
(`--pb-warning`), `.is-danger` (`--pb-error`), `.is-accent` (`--pb-brass-500`).
Border-left bar 3px wide for variant indication, matching index's pattern.

## Nav block duplication (~120 wasted lines)

The same 9-rule nav `<style>` block is inlined in every dashboard via
`scripts/inject-page-nav.py`. **Phase 3 work:** move nav styles into
`dashboard-shell.css`; the inject-page-nav script writes only the `<header>` /
`<nav>` markup, not the CSS. Saves ~120 lines of inline duplication.

## Theme toggle inconsistency

`button.theme-toggle` present on dashboard, activity. Missing on proposals,
discussion-bubbles, main-flows, design-system, index, token-usage. Decision
needed for Phase 3:
- **Option A** — promote to shared shell (every dashboard gets it)
- **Option B** — drop entirely (the design system is dark-only by brief, light
  fallback is leftover from old multi-theme system)

Recommend Option B (drop) — `data-theme="dark"` is already hardcoded on every
dashboard's `<html>` element, the system is dark-only by intent, and removing
the toggle is one less inconsistency to maintain. Founder confirm.

## Width-handling status

| Page | 1920 | 1280 | 768 | 375 | Notes |
|---|---|---|---|---|---|
| dashboard | inherits | unverified | unverified | unverified | depends on dashboard.css |
| activity | inherits | unverified | unverified | unverified | depends on dashboard.css |
| proposals | inherits | unverified | unverified | unverified | depends on dashboard.css |
| discussion-bubbles | inherits | unverified | inherits | unverified | has `max-width: 900` collapse to single column |
| main-flows | 1480 cap | inherits | inherits | unverified | has `max-width: 1100` rail-under-grid breakpoint |
| design-system | unverified | unverified | unverified | unverified | no obvious breakpoints |
| index | inherits | inherits | inherits | inherits | uses `auto-fit minmax` (responsive by default) |
| token-usage | inherits | inherits | inherits | inherits | uses `flex-wrap` (responsive by default) |

Phase 4 work: explicit test at all four widths + horizontal-scroll on tables
+ sticky-first-column on tables.

## Inline-CSS bloat (>30 line budget per Phase 3)

| Page | Lines of inline CSS | Status |
|---|---|---|
| dashboard | 17 | OK |
| activity | 33 | over (scenario dots can move to dashboard.css or page-specific extract) |
| proposals | ~200 | well over — extract `proposals-page.css` |
| discussion-bubbles | ~500+ | well over — extract `bubbles-page.css` (protected layout has its own brief) |
| main-flows | ~120 | well over — extract `main-flows-page.css` (protected layout) |
| design-system | ~80 | over — extract `design-system-page.css` (protected layout) |
| index | ~200 | over — extract `index-page.css` |
| token-usage | 67 | over — much shrinks after shell adoption; donut + tables in a `token-usage-page.css` |

## Open questions for Founder before Phase 2

1. **Theme toggle:** drop entirely (Option B) or promote to shared shell (A)? Recommendation: drop.
2. **Main-flows 1480px max-width:** keep wider than other pages (architecture grid needs it) or compress to 1280px and rely on horizontal scroll inside the grid? Recommendation: keep 1480 via opt-in `--pb-max-content-wide`.
3. **dashboard.html "Quick links" section:** strip entirely (redundant with footer link list and nav) or keep as one of the post-strip KPIs? Recommendation: strip.
4. **dashboard.html "Cycle outcomes" chart:** strip per directive — but cycle outcomes IS useful at-a-glance state. Replace with a 3-row KPI strip (complete / paused / halted counts last 7 days)? Spec implies yes via the KPI grid expansion.
5. **token-usage.html "by_cron" warning row:** preserves under new table-only layout (it's already a table). No action needed; flagging for Phase 2 verification.
6. **`_assets/template.html`:** stale Chart.js boilerplate; safe to delete (no producers reference it) — flag for Phase 7 cleanup.

## Phase 2 ready signal

Audit complete. Cha rt strip list is concrete (7 canvases + 2 Chart.js CDN +
1 progress bar). Drift patterns are named with file:line references.
Protected layouts (bubbles 2-panel, main-flows grid+arrows, design-system
showcase) are explicitly listed. Token-layer migration is one-way (legacy
→ `--pb-*`).

Phase 3 foundation (`_assets/dashboard-shell.css`) can be authored against this
audit without further reads.
