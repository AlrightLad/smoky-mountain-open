---
audit: visual-audit baseline (post Phase 0, pre DC-5)
date: 2026-05-13
authored_by: claude-code
viewports: [1440x900 desktop, 375x812 mobile]
pages: 8
total_screenshots: 16
capture_script: scripts/visual-audit/capture-dashboards.mjs
manifest: scripts/visual-audit/2026-05-13/manifest.json
---

# Visual Audit — 2026-05-13 (Post Phase 0, Pre DC-5)

Baseline screenshots of all 8 dashboards at desktop (1440x900) and mobile
(375x812) viewports. Captured via Playwright after Phase 0 theme
convergence shipped (commit `f987f85`) and before DC-5 normalization
proceeds. Founder reviewed visually; the only outstanding concern is the
fictional **3.5M weekly cap** still showing on `dashboard.html` — that's
DC-9's work (already queued).

## Capture mechanism

- `scripts/visual-audit/capture-dashboards.mjs` — Playwright Chromium
  driver. Iterates over 8 pages × 2 viewports, full-page screenshot per
  combination, manifest with timestamps + file sizes.
- Run: `node scripts/visual-audit/capture-dashboards.mjs [date-dir]`
  (defaults to today UTC).
- Output: `scripts/visual-audit/2026-05-13/<page>-{desktop,mobile}.png`
  plus `manifest.json`.
- This same script will be re-run after DC-9 (to verify the 3.5M is
  gone) and after DC-8 (final state) — visual regression baseline.

## Per-dashboard assessment

### 1. dashboard.html

**`dashboard-desktop.png`** (79 KB)
- Chrome: brand line "PARBAUGHS ORCHESTRATION" mono uppercase, brass-on-green active "Dashboard" tab. Clean. Consistent with other pages.
- Theme: billiard green canvas confirmed (was legacy slate before Phase 0). Body text warm chalk. Brass scarcity respected — appears on brand + active nav + nowhere else as wallpaper.
- Layout: 4×3 KPI grid renders crisply. "Recent 7 days" table populates with stub data. Recent handoffs row present. Recent ships empty-state visible.
- **Outstanding concern (Founder-flagged):** "Weekly Remaining" card shows **3.50M** value with "of 3.5M cap" subtitle. Both are the fictional cap that DC-9 will remove. The "Budget" card shows "0.0% consumed this week" against the same fiction. Three KPI cards effectively communicate fiction. DC-9 work.

**`dashboard-mobile.png`** (86 KB)
- Nav wraps cleanly to 2 rows at 375px (Dashboard active highlighted).
- KPI grid stacks to 1 column — 12 cells in a vertical stream. Readable.
- "Recent 7 days" table visibly truncates at the HALTED column on screen; .pb-table-wrap is supposed to provide horizontal-scroll (which IS in place per dashboard-shell.css), so HANDOFFS / SHIPS / BUBBLES columns are scrollable rather than missing. Acceptable.
- "Recent handoffs" table cells wrap long text within column (discussion-bubble-orchestrator → wave-zero-dry-run-orchestrator). Functional, slightly cramped.
- **Same 3.5M fiction visible** — Weekly Remaining 3.50M card is centered prominently. DC-9.

### 2. activity.html

**`activity-desktop.png`** (75 KB)
- Chrome: brand + nav consistent. "Activity" tab brass-active. Theme converged.
- Page title pattern (legacy): `ACTIVITY FEED` eyebrow + "Agent Activity" h1 + subtitle. This is **Pattern A** from the audit (`.report-header`-based, not `.pb-page-title-row`). Reads fine on the new theme but is structurally different from dashboard.html — DC-5 migrates it.
- Filters bar: 4 select dropdowns + "1 SHOWN" count. Renders correctly.
- Activity stream: single handoff card with scenario badge, agent flow, scope sections. Brass border-left accent visible.
- **Theme toggle remnant**: top-right ☀ button visible. Founder Q1 approved dropping it; the legacy `.theme-toggle` HTML is still in the file. DC-5 removes it during the activity normalization.
- **Missing KPI strip** (per spec): activity.html should have KPIs at top (total handoffs this week, by agent, by ship). DC-5 work.

**`activity-mobile.png`** (72 KB)
- Filters bar stacks vertically at 375. Each select takes a full row. Functional.
- Activity card content wraps fine. Long agent names truncate gracefully.
- Theme toggle in top-right same issue (DC-5).

### 3. proposals.html

**`proposals-desktop.png`** (231 KB — largest non-design-system)
- Chrome converged. "Proposals" tab brass-active.
- Page title pattern: **`Proactive Proposal Review`** h1 (legacy summary-bar pattern, neither Pattern A nor B). DC-5 normalizes.
- Sticky `.summary-bar` at top with 5 colored count cells: Founder review workspace, Total | Approve | Reject | Defer | Pending. Brass accents on action buttons. Functions correctly.
- 5-state proposal sections visible: PENDING (empty), APPROVED — IN FLIGHT (3 cards), DEFERRED — ARCHIVE, SHIPPED — ARCHIVE, REJECTED — ARCHIVE. Each section header in brass mono uppercase.
- Proposal cards: well-styled with state-tinted borders + lane tags + meta rows + action bar. Lane badges color-coded.
- Theme: billiard green converged. Brass scarcity intact.
- **DC-5 target**: replace summary-bar with `.pb-kpi-grid`; preserve proposal-card body styling under page-specific `proposals-page.css` per inline-budget rule.

**`proposals-mobile.png`** (166 KB)
- Summary-bar wraps acceptably; sticky behavior preserves usability.
- Proposal cards render full-width. Lane badges + meta wrap to multiple rows.
- Decision bar buttons stack 1-column. Functional.

### 4. discussion-bubbles.html — **PROTECTED LAYOUT**

**`discussion-bubbles-desktop.png`** (189 KB)
- Chrome converged.
- **Protected 2-panel layout intact**: 360px left rail (thread list grouped by day) + 1fr right pane (selected thread transcript). Both panels styled on billiard-green surface.
- Left rail: filter dropdowns + thread items with status badges (db-2026-05-13-001 / 002 / 003). Day-divider "2026-05-13" sticky header visible.
- Right pane: full transcript of selected thread with author headers + message bodies + vote tally. Brass on important messages.
- This is the working interface for reading agent deliberations. Founder spec: do NOT flatten this. **Confirmed intact**.
- DC-5 work: add `.pb-kpi-grid` ABOVE the 2-panel area (open bubbles count, closed this week, by status). 2-panel itself untouched.

**`discussion-bubbles-mobile.png`** (334 KB — surprisingly large; full-page screenshot capturing both panel stacks)
- Below the 900px breakpoint declared in `.db-app`, the 2-panel collapses to single-column. Rail content at top (filters + thread list), detail content scrollable below.
- Long transcript text wraps reasonably.
- DC-5 must add KPI strip above the panel in mobile too. Layout to inherit `.pb-kpi-grid` 1-col stacking.

### 5. main-flows.html — **PROTECTED LAYOUT**

**`main-flows-desktop.png`** (204 KB)
- Chrome converged. **Main-flows is the only page using the 1480px wide variant** (`pb-page-header.is-wide` + `.pb-page-main.is-wide`). At 1440 viewport the page main maxes out near edge-to-edge — appropriate; arch grid genuinely needs the width.
- **Architecture grid + SVG arrows**: 6 columns × ~12 component nodes per column. SVG arrow overlay positioned absolute over the grid. Right rail with Flows list + Steps panel. **All protected content intact.**
- Caveats banner with teal accent above the grid.
- Theme converged on the legacy `--col-*` palette (Actors gold, Clients teal, Auth/FN violet→leather, Data moss, Distribution amber, External claret). These are page-specific data tokens NOT theme tokens — round-trip test allows them.
- DC-6 work: standardize page title row only; protected grid stays exactly as-is.

**`main-flows-mobile.png`** (108 KB)
- Below 1100px breakpoint, `.mf-rail` moves below the grid (responsive collapse, not restructure). Grid retains 6-column shape with min-width 900px → horizontal scrolls at 375. **Protected behavior**.
- Header text legible. Grid content scrolls left-right as designed.

### 6. design-system.html — **PROTECTED LAYOUT**

**`design-system-desktop.png`** (449 KB — largest screenshot, by far)
- Chrome converged. "Design System" tab brass-active.
- Page is the canonical PARBAUGHS visual reference. Hero copy "A country club after hours, run by people who know the game. Premium without precious. Brass scarcity is the brand." with brass-tinted "Brass scarcity".
- **Showcase elements all present**: 5+ swatches per palette section (billiard green / chalk / brass / semantic status), type ladder demonstrating `--text-display` through `--text-2xs`, button variants, card primitives, scorecard composition, leaderboard composition, motion demos, anti-patterns section.
- This is the reference page itself. Founder spec: do NOT flatten swatches/type ladder/component demos. **Confirmed intact**.
- DC-6 work: page header standardization only; showcase body untouched.

**`design-system-mobile.png`** (473 KB)
- Swatches reflow to fewer per row at 375. Type ladder samples wrap (large display text breaks across lines, expected).
- Component composition examples adapt reasonably.

### 7. token-usage.html

**`token-usage-desktop.png`** (84 KB)
- Chrome converged.
- DC-4 rewrite verified visually: 2-col `.tu-summary` grid with SVG donut left, Real/Estimated/Manual stat cells right + "Refresh now" button.
- Donut renders as empty ring (all-time total = 0 in current snapshot, so no arcs drawn — only the dim placeholder green-700 ring + "0 / ALL-TIME TOKENS" center text). When data populates, 3 colored arcs (billiard-green-500 / brass-500 / chalk-300) will fill clockwise from 12 o'clock.
- Three `.pb-table` panels (by Agent / by Cron Source / by Ship) with sortable column headers (sort indicator ⇅). Default sort: total desc. Currently sparse data: cron-runner agent / downloads-watcher cron / unattributed ship — all at 0 tokens. Tables populate when real telemetry accumulates.
- "How estimation works" warning-bordered footnote at bottom (amber accent).
- **No Chart.js** — verified via the screenshot showing tables-only data presentation.

**`token-usage-mobile.png`** (75 KB)
- `.tu-summary` grid collapses to 1-col (donut above stats). Refresh button stays accessible.
- Three tables wrap with horizontal-scroll inside `.pb-table-wrap`. First-column sticky should be honored — needs careful check in DC-8 mobile QA pass.

### 8. index.html

**`index-desktop.png`** (84 KB)
- Chrome converged. "Index" tab brass-active.
- Page title pattern (Pattern B variant): `.page-header-row` + h1 + subtitle with mono `git <sha>` reference. Reads clean.
- "Status" panel: 6 KPI cells (Ships this week / Proposals pending / FIQ depth / Discussion Bubbles / Last cron run / Halt state) — this is the **3rd distinct KPI pattern** (`.status-tile`). DC-6 migrates to `.pb-kpi-card`. Brass border-left variants on each.
- "Dashboards" grid: 5 cards (Dashboard / Activity / Discussion Bubbles / Proposals / Main Flows) + 1 lower row (Main Flows alone wraps). Brass tag on each card.
- "Governance & reference": 9 quick-link cells in a 5+4 grid. Clean. Brass arrow indicator.
- Footer with last-orchestration-action data freshness note.

**`index-mobile.png`** (96 KB)
- Status panel + dashboards grid + quick links all reflow correctly via `repeat(auto-fit, minmax(...))`. No layout breakage.
- KPI text shrinks readably; metadata lines wrap.

## Cross-cutting observations

### Theme convergence (Phase 0) — **CONFIRMED visually across all 8**

Every dashboard renders on billiard-green canvas (#0a2820, not legacy slate #0f1419). Body text reads warm chalk (#f7f4ed), not cool white (#e8ebf0). Brass accents (#c9a961) appear only on intentional highlights. Founder's "clean + legible + accurate" brief looks achieved at the chrome level. The alias `:root` block in `dashboard-shell.css` is doing its job without any HTML edit.

### Outstanding concerns BEFORE DC-5 proceeds

1. **dashboard.html — 3.5M fictional cap** (Founder-flagged). DC-9 will remove. **Blocks Founder close-out, not DC-5.** Continue.
2. **activity.html theme-toggle button** still in markup. DC-5 removes it during activity normalization.
3. **proposals.html summary-bar pattern** is the 3rd distinct KPI pattern. DC-5 migrates to `.pb-kpi-grid`.
4. **discussion-bubbles.html missing KPI strip** above the protected 2-panel. DC-5 adds.
5. **index.html `.status-tile` pattern** is the 4th distinct KPI pattern. DC-6 migrates.
6. **token-usage.html mobile sticky-first-col** unverified — needs DC-8 mobile QA pass at narrow widths.

### DC-5 / DC-6 / DC-9 / DC-7 / DC-8 prerequisites met

- Phase 0 theme alias layer is live and verified.
- Round-trip test green; nav audit accepts `.pb-page-nav`; theme guard accepts zero raw hex (and 6 documented `--col-*` tokens on main-flows).
- Capture script is reusable for post-DC-9 verification (confirm 3.5M gone) and DC-8 final mobile QA.
- All 16 baseline screenshots saved in this directory.

## Recommendation

**Proceed with DC-5 → DC-6 → DC-9.** Pause after DC-9 (Founder-mandated) to eye-check the dashboard.html "Weekly remaining" / "Budget" cards confirm 3.5M is gone. Then DC-7 + DC-8.

The screenshots are evidence; the assessment above is the team's read. Founder makes the final call.

## Screenshot index

| Page | Desktop | Mobile |
|---|---|---|
| dashboard.html | [dashboard-desktop.png](../../scripts/visual-audit/2026-05-13/dashboard-desktop.png) | [dashboard-mobile.png](../../scripts/visual-audit/2026-05-13/dashboard-mobile.png) |
| activity.html | [activity-desktop.png](../../scripts/visual-audit/2026-05-13/activity-desktop.png) | [activity-mobile.png](../../scripts/visual-audit/2026-05-13/activity-mobile.png) |
| proposals.html | [proposals-desktop.png](../../scripts/visual-audit/2026-05-13/proposals-desktop.png) | [proposals-mobile.png](../../scripts/visual-audit/2026-05-13/proposals-mobile.png) |
| discussion-bubbles.html | [discussion-bubbles-desktop.png](../../scripts/visual-audit/2026-05-13/discussion-bubbles-desktop.png) | [discussion-bubbles-mobile.png](../../scripts/visual-audit/2026-05-13/discussion-bubbles-mobile.png) |
| main-flows.html | [main-flows-desktop.png](../../scripts/visual-audit/2026-05-13/main-flows-desktop.png) | [main-flows-mobile.png](../../scripts/visual-audit/2026-05-13/main-flows-mobile.png) |
| design-system.html | [design-system-desktop.png](../../scripts/visual-audit/2026-05-13/design-system-desktop.png) | [design-system-mobile.png](../../scripts/visual-audit/2026-05-13/design-system-mobile.png) |
| token-usage.html | [token-usage-desktop.png](../../scripts/visual-audit/2026-05-13/token-usage-desktop.png) | [token-usage-mobile.png](../../scripts/visual-audit/2026-05-13/token-usage-mobile.png) |
| index.html | [index-desktop.png](../../scripts/visual-audit/2026-05-13/index-desktop.png) | [index-mobile.png](../../scripts/visual-audit/2026-05-13/index-mobile.png) |
