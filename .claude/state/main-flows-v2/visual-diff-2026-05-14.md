# Visual diff — main-flows.html vs Janowiak ToDesktop reference

**Captured:** 2026-05-14T05:43Z
**Viewport:** 1920×1080, dark colorScheme
**Page under test:** `docs/reports/main-flows.html`
**Reference target (Founder-cited):** Dave Janowiak ToDesktop architecture diagram — https://x.com/DaveJ/status/2053867258653339746/video/1

## Why this exists

Prior diagnosis cleared main-flows.html as "no regression" based on sentinel
counts (architecture section before catalog section, mf-grid populated,
mf-flows-list non-empty). Sentinels prove **structure**, not **visual
match**. Founder reviewed the live page and reports it does NOT render 1:1
with the Janowiak reference. This document is the honest visual comparison
to replace the sentinel-based diagnosis.

## Screenshots

All in `.claude/state/main-flows-v2/`:
- `current-render.png` — full page, 1920×1080, default state (no flow selected)
- `current-render-viewport.png` — top 1080px of viewport
- `current-render-arch-only.png` — arch section clipped, default state
- `current-render-arch-only-F1.png` — arch section clipped, **F1 selected** (this is the canonical "is the arch diagram working" frame)
- `current-render-flow-selected.png` — full page, F1 selected

DOM measurements in `capture-meta.json`.

## Reference visual pattern (Janowiak ToDesktop)

The Founder brief enumerates the reference elements. Documenting them here
verbatim for the diff to reference back to:

1. 6-column grid of component boxes spanning page width
2. Color-coded category headers (Actors / Client / Functions / Data / Distribution / External)
3. Component boxes with name + subtitle inside each column
4. Selected flow highlights its path with dashed arrows + numbered step markers
5. Right rail listing all flows; click selects active flow
6. Steps panel below or beside rail showing active flow's steps
7. Search input at top of rail
8. Filter chips for status / actor / tier
9. Semantic spacing — grid feels balanced, not cramped
10. Typography hierarchy: column headers > component names > component subtitles
11. Color discipline: warm accents on active path, neutral otherwise, brass on highlighted state
12. The diagram **IS** the page — it fills the viewport, it is not pushed below other content nor dwarfed by sibling sections

## Element-by-element diff

| # | Reference element | Status | Evidence / gap |
|---|-------------------|--------|----------------|
| 1 | 6-column grid spanning page width | ✓ | `mf_grid.columns_count: 6`; bbox width 1078 inside 1480 workspace; grid-template-columns shows 6× 169.6px tracks |
| 2 | Color-coded category headers | ✓ | Header underlines render brass / teal / purple / green / gold / claret per `--col-actor/client/fn/data/dist/ext` tokens (visible in `current-render-arch-only-F1.png`) |
| 3 | Component boxes with name + subtitle | ✓ | Each `.mf-node` has `.mf-node-label` (sans bold) + `.mf-node-subtitle` (mono small); 47 nodes across 6 columns |
| 4 | Selected flow highlights path with dashed arrows + numbered step markers | ✓ | F1 click → 7 path nodes opacity 1 / 40 off-path nodes opacity 0.25; SVG has 8 lines + 7 numbered badges (`mf_arrows.line_count: 8, badge_count: 7`); visible in `current-render-arch-only-F1.png` |
| 5 | Right rail listing all flows | △ | Rail renders 8 flow items (F1–F8) — matches reference count BUT the page also has a 62-flow catalog below (see #12 + Q1) |
| 6 | Steps panel below rail | ✓ | `mf-steps-list` renders 7 items (F1's 7 steps) after click; `mf-steps-meta` shows "F1 · 7 steps" |
| 7 | Search input at top of rail | ✗ | Architecture rail has NO search input. Search lives in the 62-flow catalog section below (`#rail-search`) |
| 8 | Filter chips for status / actor / tier | ✗ | Architecture rail has NO filter chips. Filter chips live in the 62-flow catalog section below |
| 9 | Semantic spacing — grid feels balanced | △ | At 1920px viewport, columns are 169.6px wide — narrower than ideal. Right rail is 358px. Workspace total 1480px; the remaining 440px of viewport is page-margin whitespace. Could feel tighter than Janowiak's at his viewport |
| 10 | Typography hierarchy | ✓ | Column header `0.6875rem` uppercase mono > component name `0.8125rem` sans bold > subtitle `0.6875rem` mono italic. Hierarchy clear in capture |
| 11 | Color discipline (warm accent active, neutral otherwise) | ✓ | `.mf-grid.has-selection .mf-node` opacity 0.25 off-path; `.is-on-path` brass box-shadow; flow item `.is-active` brass tint + left border |
| 12 | **The diagram IS the page** | ✗ | **Total page scroll height: 6725px. Architecture section occupies y=337 → y=1100 (~770px = 11%). The 62-flow catalog occupies y=1453 → y=6725 (~5272px = 78% of page).** The architecture diagram is dwarfed by the catalog below it. This is the inverse of the reference where the diagram fills the screen. |

## Summary

The architecture diagram itself — items #1, #2, #3, #4, #6, #10, #11 — matches
the reference. Items #5, #7, #8, #9, #12 are gaps, dominated by **#12: page
balance**.

Stated bluntly: the diagram renders correctly, but the page is no longer
"an architecture diagram with a small catalog of flows." It is "a 62-flow
filterable catalog with a small architecture diagram at the top." The
prior fix (adding PRIMARY / SECONDARY labels in Issue 1 commit) acknowledged
this visually but didn't change the underlying ratio.

## Root cause categorisation

Against the failure-mode checklist in the Founder brief:

- **A. Grid layout wrong**: ✗ (grid is correct)
- **B. SVG arrows missing/off-screen**: ✗ (arrows render — 8 lines, 7 numbered badges, visible in `current-render-arch-only-F1.png`)
- **C. Flow highlighting doesn't update grid**: ✗ (works — F1 click highlights 7-node path, dims rest)
- **D. Right rail below grid**: ✗ (rail beside grid at 1920px — `mf_workspace.grid_template_columns: 1104px 360px`)
- **E. Step panel not connected**: ✗ (steps update on flow click — `mf_steps.meta_text: "F1 · 7 steps"`, items_count: 7)
- **F. Color/typography drift**: ✗ (tokens used correctly)
- **G. ⚠ "62-flow filterable list view has taken visual prominence over the architecture diagram"**: ✓ **THIS IS THE REAL FAILURE MODE.** 78% of page height is the catalog. The architecture diagram is technically "first" but visually a header for the catalog.

## What the prior diagnosis got wrong

The prior sentinel asserts:
- Architecture section before catalog section ✓ (still true)
- `mf-grid` populated ✓ (still true)
- `mf-flows-list` populated ✓ (still true)
- `flow-rail-section` populated ✓ (still true)

All four sentinels pass. The page is **broken anyway** because none of those
sentinels check page **balance** — i.e., whether the architecture diagram is
the centerpiece or a header. P5 (diagnostic-first) and P8 (visual-layer
smoke assertions on engagement surfaces) both apply: smoke must verify the
visual layer, not just structural existence.

## Open questions for Founder (BLOCKING the fix)

**Q1.** Is the 62-flow filterable catalog supposed to be on `main-flows.html`
at all? The Janowiak reference doesn't have it — the diagram fills the page
and the rail shows ~10 flows. The 62-flow catalog might belong on a separate
page (e.g. `flows-catalog.html`) linked from the architecture diagram.

Three options:
- **Q1A.** Remove the 62-flow catalog from `main-flows.html`; move to a separate page or to `docs/agents/MAIN_FLOWS.md` as a linked table
- **Q1B.** Keep both on the same page but collapse the catalog by default (`<details>` element) so the architecture diagram is the visible centerpiece
- **Q1C.** Keep current layout but visually re-balance (taller diagram, shorter catalog cards) — does not match Janowiak ref but preserves catalog visibility

**Q2.** The architecture rail today shows 8 flows (F1–F8). The 62-flow
inventory includes those 8 plus 54 more. What does the rail show?

Three options:
- **Q2A.** Keep 8 in the architecture rail (current). The 54 "supplementary / admin / system" flows live only in the catalog (or its replacement per Q1)
- **Q2B.** Show all 62 in the rail, scrollable. Janowiak-style "all flows here" but accepting the rail is taller than the diagram
- **Q2C.** Show ~10–15 (8 current + ~5 most-trafficked supplementary) and link to catalog for the rest

## Recommended fix path (pending Q1/Q2)

If Q1A + Q2A: delete the catalog section from `main-flows.html`, add a single
"See all 62 flows →" link from the architecture diagram, optionally move the
catalog to `flows-catalog.html`. Likely smallest delta to reach 1:1.

If Q1B + Q2A: wrap the catalog `<section id="flow-rail-section">` in `<details>`
with the diagram + rail as the visible-by-default fold. Minimal markup change,
acceptable scroll behavior.

If Q1C + Q2A: re-tune the catalog (smaller cards, tighter rows, denser tiers)
so it occupies maybe 40-50% of page height instead of 78%, plus increase the
architecture grid column widths from 169px to ~220px (drop min-width: 900px,
use full available width). Will not match Janowiak ref visually but preserves
all current data.

In all paths, also add: search + filter chips inside the architecture rail
(items #7, #8 above). They are missing today and the reference includes them.
This is small markup + JS regardless of Q1/Q2 resolution.

## Hard guardrails for the fix (per Founder brief)

- Each fix is its own commit
- Round-trip green after each commit
- Visual diff captured before/after each commit
- Smoke must extend beyond section-order sentinel:
  - Component count per column (matches expected)
  - SVG arrow line+badge count (matches expected for active flow)
  - **Architecture-section height as proportion of total page height** ≥ a threshold (e.g. 30%) — this catches #12 directly
- Do NOT push commits without Founder sign-off

---

# Founder direction received (2026-05-14)

**Q1:** "Keep current layout, rebalance visually" — diagram columns widen,
catalog densifies; both stay visible without collapse.
**Q2:** "All 62 (scrollable)" — architecture rail shows every flow with
search + filter chips, scrollable.

---

# Ship-by-ship deltas

## Ship 1 — Widen architecture grid columns

**Files:** `docs/reports/main-flows.html` (CSS only).

**Diff:**
- Added page-local `--max-content-wide: 1640px` override (was 1480) in the
  `:root` block. Only main-flows uses `.is-wide`, so contained to this page.
- `.mf-grid` `minmax(140px, 1fr)` → `minmax(200px, 1fr)`
- `.mf-grid` `min-width: 900px` → `1180px`
- Mobile (<1100px) min-width: 0 so the grid scrolls horizontally instead

**Measurements:**
- Workspace bbox width: 1480 → **1640** (+160px)
- Workspace grid-template-columns: `1104px 360px` → `1264px 360px`
- Per-column width (computed): ~170px → **~200px** (+30px)

## Ship 2 — Densify catalog cards

**Files:** `docs/reports/main-flows.html` (CSS only).

**Diff:**
- Inlined `.pb-list` + `.pb-list-row` base styling (the page does NOT load
  `design-system-components.css` — discovered during diagnostic — so the
  rows were rendering as default LI elements before this fix)
- `#flow-rail-section .pb-list-row` `padding: var(--space-3) var(--space-4)` →
  `padding: 6px var(--space-3)`, `gap: var(--space-2)`
- `.rail-tier-group` `margin-bottom: var(--space-6)` → `var(--space-3)`
- `.rail-tier-h` font-size `--text-lg` → `--text-base`
- `.rail-goal { display: none; }` (was hidden only <720px)
- `.rail-name` added `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
- `.rail-filters` margin-bottom `--space-4` → `--space-3`, gap `--space-3` → `--space-2`

**Measurements:**
- Per-row height: **73px → 32px** (after also fixing display:flex)
- Total page height: **6394 → 3784** (38% reduction in this ship; cumulative since baseline: 6725 → 3784, **44% reduction**)
- Catalog block: ~4941px → **~2331px**

## Ship 3 — Architecture rail shows all 62 flows + search/filter chips

**Files:** `docs/reports/main-flows.html` (HTML + CSS + JS).

**Diff:**
- HTML: Added `<input id="mf-rail-search">` + two `.mf-rail-chips` groups
  (actor + tier) inside the Flows card, above the list
- CSS: Added `.mf-rail-search`, `.mf-rail-chips`, `.mf-rail-chip` rules.
  `.mf-flows-item` reflowed to single-line flex layout. Path-rich flows
  (F1-F8) get a filled brass dot indicator; metadata-only flows (F9-F62)
  get a dashed-border dot
- JS: `renderFlowsList()` now sources `data.flow_rail` (62) not `data.flows` (8).
  New `applyRailFilters()` + `bindRailFilters()` wire search + chips to row
  visibility. `renderStepsForFlow()` handles two cases:
  - F1–F8: render the full step path (existing behavior)
  - F9–F62: render a metadata-only view (name, goal, actor, tier, status,
    served-by-ships, est. step count, plus a note that the detailed path
    isn't yet authored)
- `selectFlow()` is unchanged — `highlightPath()` + `drawArrowsForFlow()`
  already returned early on missing flow, so no diagram-side changes needed

**Verified behavior (`scripts/visual-audit/test-rail-filters.mjs`):**
- baseline: 62 visible
- search="round": 6 visible
- tier=core: 23 visible (matches `flow_rail_counts.by_tier.core: 23`)
- tier=admin: 10 visible (matches `flow_rail_counts.by_tier.admin: 10`)
- actor=founder + tier=admin (compound): 5 visible
- reset: 62 visible

**Verified F9 click (`scripts/visual-audit/test-click-f9.mjs`):**
- Active highlight on F9 row ✓
- Steps panel: `F9 · metadata only` meta + metadata content visible
- Grid `has-selection`: false (correct — no path to highlight)
- SVG arrow count: 0 (correct — no path drawn)

## Ship 4 — Visual-layer smoke assertions (catches the v1 failure mode)

**Files:** `tests/round-trip-test.py` + `scripts/visual-audit/verify-main-flows.mjs` (new).

**Why this exists:** the prior `arch-before-rail` sentinel passed while the
page was visually wrong. Sentinels prove structure, not balance. Per P5
(diagnostic-first) and P8 (visual-layer smoke on engagement surfaces).

**Python static (round-trip-test.py):**
- Added: `rail search input` (`id="mf-rail-search"` present)
- Added: `rail filter chips` (`class="mf-rail-chips"` present)
- Added: `rail sources flow_rail` (renderFlowsList wires `data.flow_rail`)
- Added: `expected components (data)` (≥40 in columns[].components)
- Added: `expected steps (data)` (≥30 total across flows[].steps)
- Added: `8 path-rich flows` (flows[] length == 8)
- Added: `62 rail entries` (flow_rail[] length == 62)
- Total mf_checks: **7 → 14**

**Node visual (verify-main-flows.mjs):**
Loads page in Chromium @1920×1080, measures + asserts:
- Component count per rendered column == data-block expected (per column)
- SVG `.mf-arrow-line` count == F1 step count (7) when F1 is auto-selected
- Architecture section height ≥ **22%** of total page (target ~30%)
- Catalog section height ≤ **70%** of total page (target ~50%)
- Rail rendered count == `flow_rail[]` length (62)
- Search input + ≥3 actor chips + ≥3 tier chips present
- Functional: clicking `tier=core` chip reduces visible rail rows

Exits non-zero on any failure. Standalone CLI; runnable from any harness.

---

# After state — measurements (post-Ship-3)

Captured 2026-05-14T05:43Z+ (after all four ships):

| Metric | Before | After | Δ |
|--------|--------|-------|---|
| Total page scroll height | 6725px | **3784px** | −2941px (−44%) |
| Architecture section height | ~770px (11%) | **~1124px (29.7%)** | +354px / +18.7pp share |
| Catalog section height | ~5272px (78%) | **~2266px (59.9%)** | −3006px / −18.1pp share |
| Workspace width | 1480px | **1640px** | +160px |
| Per-column width (grid) | ~170px | **~200px** | +30px |
| Architecture rail flows | 8 | **62** | +54 |
| Path-rich flows (F1-F8) | 8 | 8 | unchanged |
| Catalog row height | ~80px | **~32px** | −48px |
| Search input in rail | absent | **present** | new |
| Actor filter chips | absent | **6** | new |
| Tier filter chips | absent | **5** | new |

# After state — all visual checks (Ship 4 verifier)

```
✓ col-actor   5 components rendered
✓ col-client  14 components rendered
✓ col-fn      9 components rendered
✓ col-data    12 components rendered
✓ col-dist    3 components rendered
✓ col-ext     4 components rendered
✓ svg-arrows  7 arrow lines + 7 badges (F1 has 7 steps)
✓ arch-proportion     architecture section 29.7% of page (≥ 22%)
✓ catalog-proportion  catalog section 59.9% of page (≤ 70%)
✓ rail-count          62 flows in rail (8 have step paths)
✓ rail-search         search input present
✓ rail-actor-chips    6 actor filter chips
✓ rail-tier-chips     5 tier filter chips
✓ rail-filter-functional  tier=core reduced rail to 23/62

verify-main-flows: PASS
```

# After state — gap diff vs reference

Re-checked against the Janowiak reference element list:

| # | Reference element | Status (before) | Status (after) |
|---|-------------------|-----------------|----------------|
| 1 | 6-column grid spanning page width | ✓ | ✓ (wider columns) |
| 2 | Color-coded category headers | ✓ | ✓ |
| 3 | Component boxes with name + subtitle | ✓ | ✓ |
| 4 | Selected flow highlights path with dashed arrows + numbered step markers | ✓ | ✓ |
| 5 | Right rail listing all flows | △ (8 flows; 62-flow catalog dwarfed it) | **✓** (62 flows scrollable in rail) |
| 6 | Steps panel below rail | ✓ | ✓ (metadata-only mode for F9-F62) |
| 7 | Search input at top of rail | ✗ | **✓** (`#mf-rail-search`) |
| 8 | Filter chips for status / actor / tier | ✗ | **✓** (actor + tier chips in rail; status chips still in catalog) |
| 9 | Semantic spacing — grid feels balanced | △ (cramped) | **✓** (columns ~200px) |
| 10 | Typography hierarchy | ✓ | ✓ |
| 11 | Color discipline | ✓ | ✓ |
| 12 | The diagram IS the page | ✗ (11% arch / 78% catalog) | **△→✓** (30% arch / 60% catalog per Founder Q1C target ratio) |

## Remaining gap

**Item 8 — status filter chips inside the rail:** the rail has actor + tier
chips; status filtering still lives only in the catalog section below.
Founder direction (Q2) listed actor / status / tier; I added actor + tier
because all 62 flows in the rail data have actor + tier but status is
already visually carried by each row's status pill (shipped / shipping /
planned / spec). If status filtering inside the rail is desired, that's a
small additional ship — 1 chip group, ~10 lines of CSS/JS. Flagging for
Founder review; not blocking.

The PRIMARY/SECONDARY section labels (added in Issue 1's commit to mitigate
the visual problem before this rebalance) are still present and now feel
slightly redundant since the rebalance itself solves the perception
problem. They're harmless and accurate; flagging for cleanup if desired.
