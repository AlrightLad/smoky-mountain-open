# Reference spec — Dave Jeffery's "ToDesktop — Architecture & Flows"

**Source:** Tweet by Dave Jeffery (@DaveJ), founder of ToDesktop & YC W20
**URL:** https://x.com/DaveJ/status/2053867258653339746
**Posted:** 2026-05-11
**Tweet body:** "Ask Claude to document and describe the main flows in your app
and output in a single page html + json data file. Incredibly useful for humans
and the JSON file is very useful for explaining the flow to the LLM when working
on new features/bugfixes."
**Reference frames acquired:** 7 frames extracted from the embedded 18.2s
video at 1768×1080 resolution, plus the video poster at the same resolution.
See `reference-frames/dave-frame-t*.png` and `dave-tweet-video-poster.jpg`.

> **Naming correction (locked in):** prior chat referred to "Janowiak" — the
> author is actually **Dave Jeffery**. All future references use the correct
> name. The visual artifact is "Dave Jeffery's ToDesktop architecture demo."

---

## 1. Page chrome + title

| Element | Spec |
|---------|------|
| Title text | "ToDesktop — Architecture & Flows" (PARBAUGHS equivalent: "PARBAUGHS — Architecture & Flows" or current "Architecture & Flows") |
| Title typography | Sans-serif, ~30-36px, **bold** (700), tight letter-spacing, white #FFFFFF |
| Subtitle copy | "Every package and external service that powers **ToDesktop Builder** and **ToDesktop for Electron**. Pick a flow on the right to highlight the path through the system and see what gets passed at each step." (TWO sentences. Specific words "Pick a flow on the right" + "highlight the path" + "what gets passed at each step.") |
| Subtitle typography | Sans-serif, ~14-15px, regular (400), color ~#999 (medium gray), generous line-height (~1.6). **Bold inline emphasis** on product names ("ToDesktop Builder", "ToDesktop for Electron"). |
| Top padding | Generous — title sits ~40-60px from page top |
| Caveats banner | **NOT PRESENT in reference.** PARBAUGHS currently shows a teal caveats banner. See divergence § below. |

## 2. Background + page surface

| Element | Spec |
|---------|------|
| Page background | **Pure black** or near-black `#000000` to `#0A0A0A`. No tint. No green. No gradient. |
| Card surfaces (rail card, grid wrap) | Very dark with a hairline `1px solid` border at ~#222 to ~#333 |
| No texture, no grain, no gradient. Solid flat fills throughout. |

This is the **biggest visual departure** from current PARBAUGHS (billiard-green
surfaces + brass accents). Replicating Dave's pure-black + yellow palette is the
single largest change.

## 3. Legend strip

Located **above** the main grid, **below** the subtitle. A row of 7 color-coded
dot + label pairs:

| Slot | Color (sampled) | Label |
|------|----------------|-------|
| 1 | Magenta/Pink ~#E91E63 | Actor |
| 2 | Light blue ~#4F8FF7 | Client surface |
| 3 | Purple ~#9C5BB8 | Firebase Function codebase |
| 4 | Green/Teal ~#3FB07F | Firebase data |
| 5 | Yellow ~#F5C518 | Build pipeline |
| 6 | Cyan ~#3DAEDB | Distribution / Workers |
| 7 | Red ~#D6483B | External service |

| Element | Spec |
|---------|------|
| Dot size | ~10×10px, no border, full saturation |
| Label typography | Sans-serif, ~12-13px, regular, color ~#AAAAAA (slightly muted vs body) |
| Spacing between items | Generous, ~20-24px gap |
| Container | No background, no border — just a row sitting on the page bg |

## 4. Column grid (architecture diagram)

**SEVEN columns** (not 6). Order, left to right:

| Col | Label | PARBAUGHS analog |
|-----|-------|-------------------|
| 1 | ACTORS | actor |
| 2 | CLIENT SURFACES | client |
| 3 | AUTH + FIREBASE FUNCTIONS | fn |
| 4 | STORAGE / DATA | data |
| 5 | BUILD PIPELINE | (no analog) |
| 6 | DISTRIBUTION | dist |
| 7 | EXTERNAL SERVICES | ext |

PARBAUGHS' current 6 columns map cleanly EXCEPT Dave has a "Build Pipeline"
column that PARBAUGHS doesn't (and arguably shouldn't — we don't have a build
pipeline like ToDesktop). The data has 6 columns for a reason; we don't need
to add a fake 7th. **Diverge — keep 6 columns.**

### Column header typography

| Element | Spec |
|---------|------|
| Font | Sans-serif (same family as body) |
| Size | ~11-12px |
| Weight | Regular (400) — NOT bold |
| Letter-spacing | Wide, ~0.1em |
| Transform | UPPERCASE |
| Color | Dim gray ~#777-#888 |
| No underline, no border-bottom on the header itself (the spec PARBAUGHS uses a colored border-bottom — divergent) |
| Margin below header | ~16-20px before first node |

PARBAUGHS currently puts a colored border-bottom UNDER the column header (the
column's color token). Dave's reference does NOT — header is just a label, no
decoration. **Cleaner.**

### Node (component box)

| Element | Spec |
|---------|------|
| Active (on-path) border | `1px solid` bright yellow `#F5C518` (or similar, sampled from the highlighted nodes) |
| Inactive (off-path) border | `1px solid` very dim gray, ~`rgba(255,255,255,0.10)` — barely visible against the black background |
| Background | None / fully transparent — both active and inactive |
| Border-radius | Slight, ~4px (subtle, not pill, not square) |
| Padding | Tight — ~10-12px horizontal, ~8-10px vertical |
| Active label text | White `#FFFFFF`, sans-serif, ~13-14px, weight 500-600 |
| Inactive label text | Same family/size but at ~`rgba(255,255,255,0.18)` — quite dim |
| Subtitle (below label, monospace) | Active: ~`rgba(255,255,255,0.55)` mono ~11px. Inactive: `rgba(255,255,255,0.10)` |
| Border-left accent | **NONE** in Dave's reference. PARBAUGHS currently uses a 3px colored left border per column — divergent. Dave's design uses pure yellow border for active, gray-on-black for inactive. |

### Off-path fade discipline

The visual hierarchy is extreme: off-path nodes are *barely visible*. They
suggest the structure exists but don't compete with the highlighted path for
attention. Current PARBAUGHS uses `opacity: 0.25` which is heavy already, but
the *border color* in the reference is even more aggressive — nearly invisible.

| Element | Reference | PARBAUGHS current |
|---------|-----------|-------------------|
| Off-path opacity / visibility | ~0.10-0.18 (severe dimming) | 0.25 |
| Active state mechanism | yellow border becomes bright + text becomes white | brass box-shadow + opacity 1 |

## 5. SVG arrows + step badges

| Element | Spec |
|---------|------|
| Arrow line | **Solid** (NOT dashed), bright yellow `#F5C518`, stroke-width ~1.5-2px |
| Arrow shape | Curved (smooth Bezier), not orthogonal/right-angle. Lines bend gracefully between nodes. |
| Arrowhead | Small triangle at destination, same yellow |
| Step badge | Filled circle, bright yellow `#F5C518`, ~16-18px diameter, positioned at the midpoint of each arrow segment |
| Step badge number | Black text `#000000` (or very dark) on the yellow fill, **monospace** font, weight 700, ~10-11px |
| Badge placement | Centered on the arrow path (mid-segment) |
| Z-order | Arrows + badges sit **above** the off-path nodes but **below** the active node borders, so the bright yellow color is consistent. |

**PARBAUGHS current SVG arrows** are dashed (5,4 dasharray) brass-color with
similar-but-different badge treatment. Divergent on: dasharray (should be
solid), color (should be #F5C518 yellow not brass `#C9A961`).

## 6. Flow rail (right side)

Vertical card column to the right of the grid. Each flow is a card with:

| Element | Spec |
|---------|------|
| Card layout | Vertical block with title + 2-line description visible |
| Active card border | `1px solid` bright yellow `#F5C518` |
| Inactive card border | Very dim hairline `rgba(255,255,255,0.10)` (nearly invisible) |
| Card background | Transparent (uses page bg) — NO billiard-green fill |
| Card padding | ~12-14px |
| Card margin between | ~8-12px (tight) |
| Title typography | Sans-serif, ~14px, weight 600, white when active / dim when inactive |
| Description typography | Sans-serif, ~12-13px, regular, ~rgba(255,255,255,0.50) |
| No "F1" / "F2" id chips visible in the reference. Just the flow name + description. |
| No status pills visible. |
| No filter chips above the rail. |
| No search input above the rail. |

**Counts visible in reference:** ~12 flow cards in the rail, no overflow scroll
shown in any frame. Dave has fewer flows than PARBAUGHS' 62.

### Rail header

"FLOWS" all-caps small sans, ~11-12px, very dim gray. Sits at top of rail with
~12-16px space before the first card.

### "Clear selection" link

Bottom of rail: text link "Clear selection" — bright yellow color, no
underline, small text ~12px. Visible only when a flow is selected.

## 7. Steps panel

Below the flow rail (NOT beside it). Same width as the rail.

| Element | Spec |
|---------|------|
| Header | "STEPS" all-caps small sans, same style as "FLOWS" |
| Step row | Numbered circle on left + step content on right |
| Step number circle | Same yellow `#F5C518` filled circle as the arrow badges — ~22-24px diameter (slightly larger than arrow badges) |
| Step number text | Black, monospace, weight 700, ~11-12px |
| Step title | Format: "package/path → package/other.path" — monospace-tinted teal/blue color for the package names, white "→" separator |
| Step subtitle (function/method name) | Monospace ~12px, slightly larger, white, weight 500. Example: "invoke CLI", "getIdToken()", "prepareNewBuild()" |
| Step description | Monospace, ~12px, regular, color ~rgba(255,255,255,0.55). Wraps across multiple lines naturally. |
| Step row padding | ~10-14px vertical, divider hairline between rows |

The steps are dense with code-like info. The font choice is **monospace
throughout the step body**, which gives it a technical-doc feel — matches the
tweet body ("explaining the flow to the LLM").

## 8. Typography stack

Identifying the exact fonts from a video frame is imperfect, but pattern
matching against common SaaS design systems:

| Use | Likely font | Why |
|-----|-------------|-----|
| Display / body sans | **Inter** (or close — geometric sans with similar character shapes) | The "g" with two-story design, the "a" two-story, the wide proportions all match Inter |
| Mono (subtitles, step body) | **JetBrains Mono** or **Geist Mono** or **IBM Plex Mono** | The slab-less terminal-style serif-free monospace with characteristic "0" slashed and "g" two-story |

PARBAUGHS uses Inter + Fraunces + JetBrains Mono. Inter + JetBrains Mono will
match Dave's reference well. **Fraunces (serif display) is NOT in the reference
— remove from main-flows.html.**

## 9. Color palette (precise samples needed; estimated from frames)

| Token | Value | Use |
|-------|-------|-----|
| `--ref-bg` | `#000000` to `#0A0A0A` | Page background |
| `--ref-text` | `#FFFFFF` | Active text |
| `--ref-text-mute` | `rgba(255,255,255,0.55)` | Subtitle / description |
| `--ref-text-dim` | `rgba(255,255,255,0.18)` | Off-path text |
| `--ref-border-dim` | `rgba(255,255,255,0.10)` | Off-path borders, hairlines |
| `--ref-accent` | `#F5C518` (bright yellow) | Active path, arrows, badges, "Clear selection" link |
| `--ref-accent-text` | `#000000` | Text *on* yellow (step badges) |
| `--ref-col-actor` | `#E91E63` (magenta) | Legend dot |
| `--ref-col-client` | `#4F8FF7` (blue) | Legend dot |
| `--ref-col-fn` | `#9C5BB8` (purple) | Legend dot |
| `--ref-col-data` | `#3FB07F` (teal) | Legend dot |
| `--ref-col-pipeline` | `#F5C518` (yellow) | Legend dot — same as accent, intentional |
| `--ref-col-dist` | `#3DAEDB` (cyan) | Legend dot |
| `--ref-col-ext` | `#D6483B` (red) | Legend dot |

The legend colors are used **only in the legend dots** — components inside
columns don't use these colors for border (the active border is always yellow).
The legend is a key/index, not a coding system applied across the diagram.

## 10. Spacing + layout discipline

| Element | Spec |
|---------|------|
| Page max-width | Looks like ~1400-1600px at the captured 1768×1080 viewport; could be 100% with side gutters |
| Column count | 7 |
| Per-column track width | ~140-160px (approximation from frame measurements) |
| Column gap | ~16-24px (generous) |
| Grid wrap → rail gap | ~32-40px (a clear visual gutter) |
| Rail width | ~280-320px |
| Outer padding | Generous — ~40-60px from page edges |
| Vertical rhythm | Title → subtitle: ~16px. Subtitle → legend: ~24-32px. Legend → grid: ~24-32px. |

## 11. Interaction states observed in video

Across 7 sampled frames (t = 0.5, 3, 6, 9, 12, 15, 17.5s):

- **Frame 0.5s** — Flow "todesktop build (Electron CLI)" selected (~15 step
  arrows visible across the grid)
- **Frame 3s** — Flow "todesktop release (publish as latest)" selected (~3 step
  arrows, simpler path)
- **Frame 6s** — Flow "Installed app auto-update check" selected
- **Frame 9s** — Flow "Invite a new user to an organization" selected
- **Frame 12s** — Back to "todesktop build (Electron CLI)"
- **Frame 15s** — Same with steps panel scrolled further down
- **Frame 17.5s** — Same as 12s

**No frame shows:**
- Search input being used
- Filter chips
- Hover state on a flow card or component box (cursor not lingering long enough
  to trigger affordances, OR hover state is identical to inactive state)

The interaction is purely "click a flow → see its path." Clean, minimal.

## 12. Divergences PARBAUGHS should NOT close

Some PARBAUGHS-specific choices diverge from Dave's reference intentionally,
either because Founder explicitly chose them or because PARBAUGHS data is
different from ToDesktop's. Locking these now so replication ships don't
accidentally roll them back:

1. **Founder Q2 (2026-05-14) — search input + actor/tier filter chips inside
   the rail.** Dave's rail has neither. PARBAUGHS rail keeps both because
   62 flows is too many to scan visually without filtering.
2. **62 flows in PARBAUGHS rail vs ~12 in Dave's rail.** PARBAUGHS' rail will
   need its own internal scroll (Dave's doesn't because there are fewer).
3. **62-flow filterable catalog section BELOW the diagram.** Founder Q1C said
   keep it. Dave doesn't have an equivalent. PARBAUGHS keeps it as a directory
   view; it's already densified per Ship 2.
4. **Flow id chips (F1, F2, etc).** Dave has no ids. PARBAUGHS keeps them
   because they're referenced throughout `.claude/state/main-flows-v2/` and
   in agent specs.
5. **Path-rich (F1-F8) vs metadata-only (F9-F62) distinction.** Dave only
   shows path-rich flows. PARBAUGHS' metadata-only treatment (dashed dot
   indicator + "metadata only" Steps panel) has no Dave analog. Keep as-is.
6. **Caveats banner** ("Read this artifact correctly"). Dave has none.
   PARBAUGHS' is load-bearing (db-2026-05-13-004 binding) — keep.
7. **6 columns vs Dave's 7.** Dave has a "Build Pipeline" column; PARBAUGHS
   doesn't have a build pipeline. Keep 6.
8. **PRIMARY/SECONDARY section labels** (added Ship-pre by Issue 1). With
   rebalance Ships 1-2 done, these are slightly redundant. Cleanup candidate
   but NOT a fidelity gap.

## 13. Divergences PARBAUGHS SHOULD close (the actual replication targets)

These are the actual fidelity gaps that drive Phase 3 replication ships:

1. **Background:** dark green billiard surface → pure black `#000000`
2. **Active path accent:** brass `#C9A961` → bright yellow `#F5C518`
3. **SVG arrows:** dashed (5,4) → **solid** curved
4. **Arrow + badge color:** brass → bright yellow with **black text on the
   badge** (currently brass with `--bg-page` text)
5. **Column header style:** uppercase with **colored bottom border** → plain
   uppercase, NO bottom border (or much subtler)
6. **Node component box:** brass left-border + card-elevated bg → no
   left-border, transparent bg, just a yellow (active) or dim-gray (inactive)
   1px border on all four sides
7. **Off-path dimming:** opacity 0.25 → ~0.10-0.18, more aggressive
8. **Card backgrounds throughout (rail cards, caveats banner, etc):** dark
   green-ish → no fill, just hairline border on transparent
9. **Title display font:** currently uses brand display font (Inter +
   possibly Fraunces tint) → plain Inter sans (no serif display)
10. **Subtitle copy alignment with reference style:** PARBAUGHS subtitle is
    longer; consider tightening to match Dave's two-sentence flow
11. **Step number circle treatment:** PARBAUGHS uses brass + `--bg-page` text
    → yellow + black text, monospace, weight 700
12. **Step content typography:** PARBAUGHS step description uses body font →
    Dave uses **monospace throughout** the step body (matches the LLM-friendly
    angle from the tweet body)
13. **"Clear selection" affordance:** PARBAUGHS doesn't have it (clicking the
    same flow twice or some other gesture) → add explicit "Clear selection"
    yellow link at bottom of rail

## 14. Phase 3 replication ships (predicted)

Based on divergence list #13 above. Each ship addresses ONE specific gap with
before/after evidence:

- **Ship R1** — Page background + surface tokens (billiard-green → black).
  Largest visual delta in one ship. ~50 lines of CSS.
- **Ship R2** — Node component box re-style (border-only, no fill, no
  left-border). ~30 lines.
- **Ship R3** — SVG arrows: dashed → solid, brass → yellow. ~5 lines CSS +
  marker fill update.
- **Ship R4** — Step badges + step number circles: yellow fill, black text,
  monospace. ~15 lines.
- **Ship R5** — Column header style: remove colored bottom border, mute color.
  ~10 lines.
- **Ship R6** — Off-path opacity 0.25 → ~0.15. Reset cosmetic differences in
  text + border opacity. ~10 lines.
- **Ship R7** — Steps panel typography: body → monospace for descriptions.
  ~10 lines.
- **Ship R8** — Rail card style: transparent bg, hairline border, yellow
  active border. ~20 lines.
- **Ship R9** — "Clear selection" affordance at bottom of rail. HTML + small JS.
- **Ship R10** — Typography pass: confirm Inter for sans, remove Fraunces
  display tint. Likely no-op or small.
- **Ship R11** — Caveats banner re-style (transparent bg, hairline yellow
  border, dim text) so it matches reference discipline while staying load-
  bearing per Founder direction.

R1 is by far the biggest perceptual change. R1-R8 are the core fidelity ships.
R9-R11 are polish.

## 15. Phase 4 verifier extensions (predicted)

Add to `scripts/visual-audit/verify-main-flows.mjs`:

- Sample background color at (100, 600) → assert in `#000` to `#0A0A0A` range
- Sample active-flow border color at the brass position → assert is `#F5C518`
- Assert SVG `.mf-arrow-line` `stroke-dasharray` is `none`
- Assert SVG `.mf-arrow-line` `stroke` is the yellow accent
- Assert step badge bg is yellow, fg is black
- Assert column header has no `border-bottom-color` (or transparent)
- Assert off-path node opacity is ≤ 0.20

These are static property assertions, fast to run, catch regression on every
commit to main-flows.html.
