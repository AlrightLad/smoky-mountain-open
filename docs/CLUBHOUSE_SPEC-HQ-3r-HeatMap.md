# CLUBHOUSE_SPEC-HQ — Part 2, View 3r: Heat Map + Drill-Down Filter UI

> **Status:** Tier 4 deliverable. All [GAP] questions pre-answered by Founder ratification (TIER2-4_DESIGN_BOT_BRIEF.md).
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. Heat map grid + filter pill row are net-new compositions; consume existing color tokens.
> **Ship:** W4.S2 — Stat heat maps + drill-downs.
> **Scope:** 18-hole heat map renderer for courses with 3+ plays + filter pill drill-down pattern applied across Round History + Stats surfaces.

---

## 0 — View scope

Country-club analytical aesthetic — heat map color is subtle (not garish), variance opacity adds depth, filter pills feel like reference scope rather than spreadsheet filters. Performance instrumented from day 1 — Performance Agent monitors cost at 10x scale per locked W4.S2 Vision.

States covered:
- **3r.1** — Default heat map (course with 3+ plays, populated history)
- **3r.2** — Filter pill drill-down (pills sticky on Round History list scroll)
- **3r.3** — Heat map cell detail (tap-to-detail modal)
- **3r.4** — Empty / locked heat map (course with <3 plays)
- **3r.5** — Empty filter result (no rounds match)

---

# § 3r.1 — Default heat map state

## 3r.1.1 Frame composition

Renders within larger surface — typically embedded in Round History (top of list) and Stats surfaces. NOT a dedicated route.

| Slot | Token / Spec | Notes |
|---|---|---|
| Filter pill row | Above heat map, sticky on scroll | See 3r.1.5 |
| Heat map header | `--space-3` y-pad above grid | Course name + plays count + heat-map controls |
| Heat map grid | 2-row × 9-col grid | See 3r.1.3 |
| Below grid | Inline summary stats | See 3r.1.4 |

## 3r.1.2 Heat map header

| Element | Spec |
|---|---|
| Course name | Fraunces italic 22px ink |
| Plays count | Mono 11px brass — `{N} ROUNDS` |
| Controls right | Toggle `Color tier only` / `Color + numbers` + Sort dropdown `Hole 1-18` / `Worst to best` |

## 3r.1.3 Heat map grid

| Element | Spec |
|---|---|
| Layout | 18 cells in 2 rows × 9 columns — Front 9 row + Back 9 row |
| Cell size | ~48×48 at standard band; scales responsively to 36×36 at compact |
| Front/back divider | 2px `--cb-line` between row 1 and row 2 |
| Hole number | Top-left of cell, mono 11px mute-soft 1.5px tracking |
| Center content | Score numeral (when toggle is `Color + numbers`) or empty (par holes, when toggle is `Color tier only`) |
| Variance opacity | Translucent fill if inconsistent across rounds (high variance = lower opacity to signal "less reliable signal") |

### Color tier system

ALL non-par scores get SAME saturation intensity regardless of magnitude (clean visual, per locked spec):

| Hole result | Color tier | Background fill |
|---|---|---|
| Under par (birdie, eagle, ace) | `--cb-moss` | Solid moss with 80% opacity adjusted by variance |
| Par | `--cb-ink-faint` | Solid ink-faint at 30% opacity |
| Over par (bogey, double, etc.) | `--cb-claret` | Solid claret with 80% opacity adjusted by variance |

### Magnitude indicator (when `Color + numbers` toggled)

Center of cell renders number badge for granular view:
- Fraunces 600 16px tabular
- `-1` (birdie / under), `+2` (double / over), `0` (par)
- Color: `--cb-moss` for under, `--cb-claret` for over, `--cb-ink-soft` for par

### Variance handling

Per-cell opacity scales with variance:
- 1 round at this hole: 100% opacity (single data point — no variance)
- 2-4 rounds: 90% opacity (moderate variance)
- 5+ rounds with consistent scoring: 100% opacity (high confidence)
- 5+ rounds with inconsistent scoring (std dev > 1): 70% opacity (visual signal of unreliability)

## 3r.1.4 Below-grid summary

Inline stats row, 4 columns:

| Stat | Format |
|---|---|
| Total rounds | `47 rounds` mono 11px |
| Avg score | `86.3` Fraunces 600 18px tabular |
| Best score | `74` brass `+ date footnote` |
| FIR / GIR / Penalty avg | Inline `66% FIR · 58% GIR · 1.3 penalties` mono 11px mute-soft |

## 3r.1.5 Filter pill row

Above heat map and Round History list. Sticky on scroll.

| Element | Spec |
|---|---|
| Container | Full-width, `--cb-chalk` background, `--space-3` y-pad, 1px `--cb-line` bottom border, sticky position |
| Pill row layout | Inline-flex, `--space-2` gap between pills |
| Per pill | Mono 11px 1.5px tracking uppercase ink, `--space-2` y-pad, `--space-3` x-pad, `--cb-chalk-deep` background, 1px `--cb-line` border, `--radius-pill` (full circle on ends) |
| Active pill | `--cb-brass-soft` background, `--cb-brass-deep` text, 1px `--cb-brass` border |
| Pill text | `Course: All ▼` / `Month: April 2024 ▼` / `Partner: Kayvan ▼` / `Tee: Blue ▼` |
| Clear filters | `Clear filters →` brass text-link rightmost when ≥1 filter applied |
| Result count | Right-aligned mono 11px mute-soft — `Showing 12 rounds of 47` |

## 3r.1.6 Pill dropdowns

Tap a pill → dropdown opens below it.

| Element | Spec |
|---|---|
| Container | 320px width, `--cb-chalk-deep` background, `--shadow-md`, `--radius-md`, 1px `--cb-line` border |
| Items | Per row: checkbox + label + count footnote (mono 10.5px mute-soft `12 rounds`) |
| Search input | Top of dropdown for long lists (courses, partners) |
| Action footer | `Apply →` brass + `Cancel` mute text-link |

Multi-select within a single pill is allowed (e.g., `Course: Honors + Cross Creek` filters to both).

## 3r.1.7 Drill-down result rendering

Filter selection updates:
- Heat map re-renders with filtered data (200ms `cubic-bezier(0.4, 0.0, 0.2, 1)` cross-fade between renderings)
- Round History list filters to matching rounds (instant re-render with `aria-live` announce)
- Summary stats (handicap, FIR%, GIR% etc.) recalculate for filter scope

## 3r.1.8 Filter preference persistence

Per locked spec:
- Filter combinations save to member preferences via `Preferences` (1s debounced)
- One slot per drill-down context (e.g., one filter set for Round History at Honors, separate for Cross Creek)
- Persists across cold launch
- `Clear filters →` action also clears persisted preference

## 3r.1.9 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `rounds/{*}` filtered to member (already loaded for Round History) | `members/{id}.preferences.filter-state-{contextKey}` on filter change |
| `courses/{*}` for course filter dropdown | |
| `members/{*}` for partner filter dropdown | |

Per locked W4.S2 Vision: client-side aggregation from already-loaded round-history data — NO new Firestore reads triggered by heat map / filters. Performance Agent monitors render cost at 10x scale (active Wave 2 entry).

Fallback: server-side aggregation via Cloud Function documented but not built in W4.S2 ship.

---

# § 3r.2 — Filter pill drill-down state

When member taps a pill to expand:

- Sticky pill row stays in viewport
- Dropdown overlays below pill
- Other pills remain visible + tappable
- Scroll behind dropdown is locked

ESC or click-outside dismisses dropdown without applying changes.

`Apply →` writes filter state + dismisses dropdown + triggers heat map + list re-render.

---

# § 3r.3 — Heat map cell detail modal

Triggered from tap on any heat map cell.

| Element | Spec |
|---|---|
| Modal frame | Modal-overlay per Part 1 § 11, max-width 560px, 4px `--cb-brass` top border |
| Eyebrow | `HOLE {N} · PAR {P} · {Yards} YDS` mono 11px brass uppercase |
| H2 | `Your scores here.` Fraunces 30px italic |
| Body | List of all rounds played at this hole with: date + opposing scores (front 9 partners) + ball position + putts |
| Best score | `BEST: -1 BIRDIE · APR 14, 2024` brass eyebrow + Fraunces 600 24px tabular brass |
| Worst score | `WORST: +2 DOUBLE · MAR 02, 2024` claret eyebrow + Fraunces 600 24px tabular claret |
| Round drill-in per row | `View this round →` text-link routes to W2.S3 Scorecard for that round |
| Close button | `×` top-right, mono 18px mute-soft |

---

# § 3r.4 — Empty / locked heat map state

When course has <3 plays.

| Element | Content |
|---|---|
| Container | Same heat map grid frame as default state, but cells render as `--cb-chalk-deep` outlined (no fills) |
| Centered editorial | `Play this course 3+ times to unlock the heat map.` Fraunces italic 22px mute |
| Progress indicator | Mono 11px brass — `{N} of 3 rounds played` |
| Footer | Below grid: `Log a round →` brass link routes to W1.S4 |

---

# § 3r.5 — Empty filter result state

When filter combination returns 0 rounds.

| Element | Content |
|---|---|
| Heat map | Renders empty — all cells `--cb-chalk-deep` outlined |
| Round History list | Empty state below: `No rounds match these filters.` Fraunces italic 22px mute |
| CTA | `Adjust or clear filters →` brass text-link |

---

# § 3r.6 — Cross-surface integration

Heat map + filter pill pattern renders on:

- **M4 Stats tab (mobile)** — primary mobile placement, per existing `CLUBHOUSE_SPEC-3d-Stats.md` integration
- **HQ Stats surface (Wave 2 amendment if needed)** — heat map could surface here; Founder confirms scope at W4.S2 retrospective
- **Round History page** — primary HQ placement, filter pills + heat map at top, round list below
- **Profile page (3o)** — heat map embedded at compact density in Round history section if 3+ plays at a course visible

Heat map cell-detail modal renders same on all surfaces.

---

# § 3r.7 — Performance budget

Per locked W4.S2 Vision:

| Operation | Budget |
|---|---|
| Initial heat map render (3+ rounds at course) | <100ms |
| Filter change → heat map re-render | <200ms |
| Cell tap → modal open | <150ms |
| Filter dropdown open | <100ms |

Performance Agent (active Wave 2) instruments these. Budget violations trigger amber alerts in dev tooling; red alerts halt feature work for optimization.

---

# § 3r.8 — Accessibility

- Heat map grid: `<table role="grid">` with `<th scope="col">` for hole numbers row + visual hole headers above grid.
- Each cell: `<td role="gridcell">` with `aria-label` synthesizing hole + score + rounds played here.
- Color tier: NOT relied upon as sole signal — score numerals always available; in `Color tier only` mode, color is supplementary visual.
- Filter pills: `role="button" aria-haspopup="listbox" aria-expanded` reflecting state.
- Dropdown: `role="listbox"`, items `role="option"`, multi-select via Space/Enter.
- Cell detail modal: focus trap + ESC dismisses + focus restores to source cell.
- Empty states: editorial copy in semantic `<p>` with `aria-live="polite"`.

---

# § 3r.9 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`
- Text: `--cb-ink`, `--cb-ink-soft`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft`
- Status (heat map color tier): `--cb-moss` (under par), `--cb-claret` (over par), `--cb-ink-faint` (par)
- Lines: `--cb-line`
- Type: `--type-sec-hq`, `--type-body-hq`, `--type-stat` (cell numerals), `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3r.10 — Ratification block

Accepted:
- 18-hole heat map (2-row × 9-col grid) renders when course has 3+ plays.
- ALL non-par scores get SAME color saturation (tier-only) per locked spec — moss for under, claret for over, ink-faint for par.
- Magnitude indicator as number badge when `Color + numbers` toggle active.
- Variance opacity adjusts cell fill — 70-100% based on round count + std deviation.
- Filter pill row sticky on scroll; multi-select per pill; Apply/Cancel inside dropdown.
- Filter combinations save to `members/{id}.preferences` per drill-down context.
- Heat map cell tap → modal with best/worst at that hole + round drill-ins.
- Client-side aggregation only — no new Firestore reads per locked W4.S2.
- Performance Agent monitors render cost at 10x scale.
- All [GAP] questions pre-answered.
