# Competitive Dashboard Design Patterns — Observed

Captured 2026-05-15 as P7 baseline for PARBAUGHS dashboard taste-scoring (>=7.5/10 required to ship).

Source: 17 reference images from Linear, Vercel, Stripe, Datadog, Sentry — see `manifest.json` for URLs + capture metadata.

---

## Linear — "Disciplined Minimalism"

**One sentence:** Nearly all decoration removed; a single accent color does the heavy lifting against a near-black surface.

- **Theme default:** dark (#0a0a0a surface)
- **Palette discipline:** monochrome ink ramp (white → 60% → 40% → 20%) + one brand accent (purple ~#5E6AD2) + chart categorical (blue/orange/green)
- **Typography:** Inter Display variant, tight tracking, eyebrow labels often lowercase, generous line-height
- **Info density:** medium-high rows, **very generous whitespace within rows**, no chart-stuffing
- **Chart treatment:** single chart per card when zoomed. Scatter plots with translucent dots, time-series with single hairline. Charts BREATHE.
- **Hierarchy signals:** status pills, priority dots (1px), assignee avatars (16px), hairline dividers
- **Distinctive lesson for PARBAUGHS:** RESTRAINT WINS. Resist the temptation to add a second brand color in chrome.

---

## Vercel — "Brand-Bold via Absence of Brand"

**One sentence:** Pure black-and-white maximalism with no brand color in chrome — the brand IS the absence of color.

- **Theme default:** dark (#000 surface) — ships explicit light variant for marketing
- **Palette discipline:** pure black/white, **zero color in chrome**. Categorical chart palette of 1-3 accents (blue, red for alert), used only inside charts.
- **Typography:** Geist sans (Inter-derivative), tight cap-height, **big numerals for metric callouts** (3xl-5xl sizes)
- **Info density:** medium — focused single-primary-chart per card, paired with data-table breakdown below
- **Chart treatment:** single chart top, table-with-host+path rows beneath. AI-investigation banners as first-class UI ("Vercel Agent investigating...")
- **Hierarchy signals:** filter pills, group-by chips, time-range selectors
- **Distinctive lesson for PARBAUGHS:** AI-investigation as first-class UI is on the horizon. The big-numeral metric callout is a steal-able pattern.

---

## Stripe — "Premium Density"

**One sentence:** High info density without losing premium feel — single signature brand color tightly controlled, soft gradient washes inside charts.

- **Theme default:** light (off-white surface)
- **Palette discipline:** signature Stripe purple (#635BFF) accent. Categorical chart palette: soft purple/teal/pink/yellow GRADIENTS (not solid fills).
- **Typography:** Sohne (custom sans), generous letterspacing on labels, **big metric numerals with subdued unit suffixes**
- **Info density:** HIGH but readable — many small chart elements per screen with careful hierarchy
- **Chart treatment:** multi-series line charts with soft gradient fills, contextual annotations (deltas, % change callouts) on every chart
- **Hierarchy signals:** filter chips, segmented controls, range-pickers; cards have subtle hover-elevation
- **Layout:** **multi-column grid with mixed-height cards. Tile sizes vary semantically — important metrics get larger tiles.**
- **Distinctive lesson for PARBAUGHS:** Mixed-height tile grids are the killer move. Annotations + deltas on every metric are what makes density feel premium not cluttered.

---

## Datadog — "Maximum Info, Configurable Tiles"

**One sentence:** Ultra-dense widget toolbox model where every metric is a tile and the user composes their own dashboard.

- **Theme default:** light (current marketing) — older reputation for dark mode is outdated
- **Palette discipline:** **NONE.** 6-8 categorical colors (blue/purple/teal/yellow/orange) used liberally in multi-series area charts. Severity colors: red for alert, green for OK.
- **Typography:** Open Sans / system stack, **smaller body text than peers (~12px)**, tight rows in dense tables
- **Info density:** ULTRA HIGH. 6-10 widgets per screen. Time-series charts dominate. Multi-series stacked area common.
- **Chart treatment:** stacked area dominates. Bar+top-N + scatter + big-number-tile + event-stream-with-severity-icons all coexist on one screen.
- **Hierarchy signals:** widget toolbox at top (Free Text / Graph / Query Value / Toplist / Event Timeline / Event Stream / Image / Note / Alert Graph / Alert Value / IFrame). Drag-to-resize handles. Red-bordered alert overlays sit on top of charts. Yellow sticky-note tiles for free text.
- **Layout:** free-form grid with explicit edit/save mode (chrome shows Editor toolbar)
- **Distinctive lesson for PARBAUGHS:** OPPOSITE of Linear. If we want density we follow Datadog's lead. PARBAUGHS dashboard is for ONE PERSON (Founder/Zach) so density of a working operator's dashboard is appropriate IF we want it.

---

## Sentry — "Code as First-Class Content"

**One sentence:** Severity color coding + code context + breadcrumb timeline make the error-detail surface the canonical view.

- **Theme default:** dark (deep purple-black surface)
- **Palette discipline:** Sentry signature purple/pink brand accent. **Severity coding is the whole story:** red (fatal), orange (error), yellow (warning), blue (info).
- **Typography:** Rubik sans for chrome, **JetBrains-Mono-ish mono for code blocks**. Mixed sizes for inline contextual data.
- **Info density:** high in detail views (code + stack + breadcrumbs all visible at once), lower on overview cards
- **Chart treatment:** secondary. Sentry is text+code+stacktrace heavy, charts are accent elements. Inline file diffs render in dashboards.
- **Hierarchy signals:** severity badges, event count + user count side-by-side, related-files chips, **breadcrumb timeline with icons** showing user actions before the error
- **Layout:** side-rail nav + main detail pane + collapsible context panel
- **Distinctive lesson for PARBAUGHS:** if PARBAUGHS docs/reports dashboards surface CODE or DIAGNOSTIC DATA (audit logs, telemetry events, error states), Sentry's pattern of code-as-first-class-content + severity-color-coding is the canonical reference.

---

## Cross-Vendor Patterns (apply to PARBAUGHS)

### What every peer does

1. **Big numerals for metric callouts.** Headline number (3xl–5xl) with small unit suffix and a delta indicator (▲ +12% or ▼ -3%).
2. **Card-based composition with mixed tile sizes.** Important metrics get bigger tiles, contextual ones get smaller. NEVER a uniform 4x3 grid.
3. **Categorical color reserved for data, not chrome.** Brand color appears in CTAs and accents; data series colors live inside charts and don't bleed into nav/headers.
4. **One-line annotation on every chart.** "5XX rate spiked at 14:32" not just "5XX rate".
5. **Time range selector + group-by chips in a consistent toolbar location** (top-right or top-left of each chart card).

### Where they diverge (style spectrum)

| Spectrum | Linear ← →| Datadog |
|---|---|---|
| Whitespace | Generous | Tight |
| Color count in chrome | 1 accent | 0 (pure mono) |
| Color count in charts | 2-3 | 6-8 |
| Widgets per screen | 1-3 | 6-10 |
| Theme default | dark | light |

### Recommended PARBAUGHS positioning

PARBAUGHS dashboards (docs/reports/*) are FOUNDER-FACING (single-user local dev tooling per memory P-reports note). Suggested positioning on the spectrum:

- **Closer to Linear/Vercel** for discipline (single accent, generous whitespace)
- **Closer to Stripe** for mixed-tile-size hierarchy (Founder cares about some metrics more than others)
- **Borrow Datadog's** widget-edit-mode IF Founder wants to compose his own dashboard layouts
- **Borrow Sentry's** severity color coding if surfacing audit/telemetry/error data
- **Avoid Datadog's** 6-color categorical palette and tight body text — overwhelming for a single operator

### Taste-scoring rubric (>=7.5/10 to ship)

For each PARBAUGHS dashboard, score 1-10 across:

1. **Brand discipline** — single accent reserved for accents/CTAs, not chrome? (Linear/Vercel benchmark)
2. **Metric hierarchy** — headline number prominent, with delta+annotation? (Stripe benchmark)
3. **Whitespace breathing** — charts not crammed; rows have padding? (Linear benchmark)
4. **Categorical palette restraint** — chart colors <=3 unless data semantically demands more? (Vercel benchmark)
5. **Severity coding consistency** — if surfacing audit/error data, red=critical orange=warning is universal? (Sentry benchmark)
6. **Information density appropriateness** — Founder-facing operator dashboard so density OK but premium feel maintained? (Stripe benchmark)
7. **Typography hierarchy** — display font + UI font + mono font roles distinct, sizes intentional? (all-peer benchmark)
8. **Interactive affordances** — time-range, filter chips, group-by chips visible and consistent? (all-peer benchmark)

Average across 8 dimensions. >=7.5/10 ships.
