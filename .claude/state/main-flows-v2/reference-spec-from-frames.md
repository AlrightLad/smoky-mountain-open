# Janowiak reference visual spec — derived from frames

**Source:** Dave Jeffery's ToDesktop architecture diagram demo
**URL:** https://x.com/DaveJ/status/2053867258653339746
**Frames:** 7 PNGs at 3538x2160 native resolution in
`.claude/state/main-flows-v2/reference-frames/dave-frame-t*.png`
(captured via `scripts/visual-audit/capture-janowiak-reference.mjs`
on 2026-05-14)
**Authored:** 2026-05-14 by Agent 3, after Founder engineering-mindset
call-out for iterating 5 times against derived requirements instead
of the actual reference.

---

## Theme palette (reference)

Janowiak reference uses **bright** black + yellow + warm-white. The
PARBAUGHS implementation does NOT replicate the palette per Founder's
explicit iter 5 directive ("same tokens as the rest of the dashboard:
--bg-page billiard-green, --accent-brass warm brass, NOT black + pure
yellow"). The team replicates **structure, layout, density, and
interaction model** — palette stays PARBAUGHS dashboard.

| Aspect | Reference | PARBAUGHS replication |
|---|---|---|
| Page background | Pure black `#000000` | `var(--bg-page)` (`--pb-billiard-green-900` = `#0a2820`) |
| Active accent | Pure yellow `#F5C518` | `var(--accent-brass)` (`#c9a961`) |
| Body text | Warm white `#FFFFFF`@90% | `var(--text-primary)` (`--pb-chalk-50` = `#f7f4ed`) |
| Component box fill | Transparent | Transparent (matches) |
| Component box border | White @ 15% | `var(--border-subtle)` (matches) |

The structural replication is the goal; the palette divergence is
intentional per Founder direction.

## Page composition (reference)

1. **Top bar:** Tweet-app header (X.com profile + post timestamp +
   reply count). NOT replicated — PARBAUGHS uses dashboard nav header.
2. **Title:** "ToDesktop — Architecture & Flows" — display-font hero
   text. Single line. Top-left.
3. **Subtitle:** "Every package and external service that powers
   Following Builder and Following for Electron. Pick a flow on the
   right to highlight the path through the system and see what gets
   queued at each step." — ~2-sentence muted-text paragraph
   immediately under title.
4. **Legend:** 6 colored dots + category labels, inline, single line,
   under subtitle. Tight, ~12px dots.
5. **Architecture grid:** 6 columns, ~10-14 components per column,
   visible above-the-fold at 1080p.
6. **Right rail:** Flows list + Steps panel stacked vertically.

PARBAUGHS replication keeps the same 1-2-3-4-5-6 ordering. No bottom
catalog section (iter 6 removed per Founder direction).

## Component box style

| Property | Reference value | PARBAUGHS token |
|---|---|---|
| Background | Transparent | Transparent |
| Border | 1px solid white @ 15% | `1px solid var(--border-subtle)` |
| Border radius | Subtle (~4px) | `var(--radius-sm)` |
| Padding | Tight (~6-8px vertical, ~10px horizontal) | `var(--space-2) var(--space-2)` |
| Label font | Sans/mono mix — `@package` uses mono, "User: Electron app" mixes | `var(--text-primary)`, sans for labels |
| Label size | ~13px | `0.8125rem` (matches) |
| On-path | Yellow border 1px, full opacity | Brass border via `var(--accent-brass)` |
| Off-path | White @ 15% border, **opacity ~18%** | `opacity: 0.18` (already set per R4) |

## SVG arrow style

| Property | Reference value | PARBAUGHS token |
|---|---|---|
| Stroke | Pure yellow #F5C518 | `var(--accent-brass)` |
| Stroke width | ~1.5px | `1.5` (already set) |
| Stroke dasharray | None (solid) | `none` (already set) |
| Opacity | 1.0 (full) | `1` (already set) |
| Step badge | Yellow filled circle, black text, ~16px diameter | Brass filled with `--bg-page` text |
| Step badge font | Mono, bold, ~10px | `var(--font-mono)`, weight 700, 10px (matches) |
| Arrowhead | Sharp triangle, filled yellow | Filled brass (matches) |

## Right rail panel

### Flows list

| Property | Reference | PARBAUGHS |
|---|---|---|
| Header | "FLOWS" — small caps, dim | "Flows" (mf-card-title — small caps via CSS) |
| Active flow row | Yellow border around row, brighter text, no fill | Brass border, brighter text |
| Inactive rows | Dim title text, transparent fill, hairline divider | Same |
| Row content | Title only (single line) | Title + actor + status (denser per Founder Q2 ratification — accepted deviation) |
| Scrollable | ~10 flows visible, scrollable for full list | 62 flows scrollable + search + actor/tier chips (accepted deviation per Founder Q2) |

### Steps panel

| Property | Reference | PARBAUGHS |
|---|---|---|
| Header | "STEPS" — small caps, dim | "Steps" via mf-card-title (matches) |
| Empty state | "Select a flow…" message | Same |
| Step row | Numbered yellow badge + step title (one line) + description (mono, smaller) | Same with brass badge |
| Step font | Title sans, description mono | Matches |

## Density + viewport

The reference fits ALL components + ALL flow rows + ALL steps in a
**single above-the-fold view** at 1080p. No vertical scroll on the
main canvas; scroll only inside the rail panel for >10 flows.

PARBAUGHS current density:
- 47 components across 6 columns (~8 per column) → fits above-the-fold
  at 1080p ✓
- Right-rail max-height: 55vh (already set) — 62 flows scrollable ✓
- Bottom catalog: REMOVED iter 6 ✓

## What deviates from reference + why

| Deviation | Reason |
|---|---|
| Theme: billiard-green + brass (not black + yellow) | Founder iter 5 directive — must match rest of dashboard |
| Rail row content: title + actor + status (not just title) | Founder Q2 ratification — denser metadata for member-facing utility |
| Rail filter chips: actor + tier (not present in ref) | Founder Q2 ratification — 62-flow rail needs filterable surface |
| Rail search input | Founder Q2 ratification |

All other structural elements should match reference.

## How to use this spec

Before declaring main-flows.html ship-close:

1. Render `main-flows.html` in browser (via `node scripts/visual-audit/capture-dashboards.mjs <ship-name>`)
2. Compare `main-flows-desktop-wide.png` against `dave-frame-t000p5.png`
3. For each row in the tables above, verify the PARBAUGHS column value
   is what's currently shipped (or accepted deviation).
4. Any unaccounted-for deviation = ship blocks until either matched or
   accepted-with-rationale documented as a deviation row above.

This spec is now the canonical visual reference target. Future
"match the reference" tasks consult this doc + the actual frames,
NOT derived prose from earlier sessions.
