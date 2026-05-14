# Reference frames — required input for Phase 1

**Source:** Dave Janowiak ToDesktop architecture diagram demo
**URL:** https://x.com/DaveJ/status/2053867258653339746
**Status (2026-05-14):** Awaiting Founder export — `WebFetch` returns HTTP 402 (X.com paywall for unauthenticated requests). `WebSearch` did not surface the specific video.

This directory is the drop zone for video frames. Once frames land,
Agent 3 can author `../reference-spec.md` and run the gap analysis.

## What to capture

At minimum, screenshots from the video at these specific moments:

1. **initial-state.png** — page just loaded, no flow selected, no
   filters applied. Whatever the "rest state" of the reference is.
2. **flow-selected-path.png** — a flow clicked in the rail, full
   path highlighted on the diagram, arrows drawn, step badges
   visible. Best frame is mid-animation or just after it settles.
3. **hover-component.png** — cursor hovering over a component
   box in the grid (not a flow row). Shows hover affordance.
4. **hover-flow-row.png** — cursor hovering over a flow row in
   the rail (not yet clicked). Shows hover affordance.
5. **filter-applied.png** — a filter chip selected (e.g. status,
   actor, tier — whichever the reference shows). Shows how filter
   affects rail.
6. **search-applied.png** — search input has a value, rail filtered
   to matching rows. Shows search input style + filtered state.
7. **arrow-detail-crop.png** *(if possible)* — a close-up of one
   SVG arrow + step badge so stroke / dasharray / arrowhead / badge
   typography can be measured precisely.

If 7 frames is too much, prioritize **1, 2, and 5** — those carry
the most spec information per frame.

## Naming + format

- PNG, ideally at the video's native resolution (don't downscale)
- File names exactly as above so Agent 3 can find them
- Drop them directly into this directory:
  `.claude/state/main-flows-v2/reference-frames/`

## Optional fallback — written description

If exporting frames is too much friction right now, Founder can
instead write `../reference-description.md` with answers to:

- Column widths (px or % of page)
- Background color (hex or "dark, warm" / "near-black, cool" etc.)
- Body text color
- Typography — display font (serif? sans? specific identifier?),
  body font, mono font (used anywhere?)
- Component box style: background color, border (yes/no, color),
  border-radius, padding (tight/medium/loose), shadow (yes/no)
- Flow rail row style: single-line or multi-line? what info
  visible per row? hover affordance (color shift, border, both)?
- Active state styling — how is the selected flow distinguished?
  background tint? border? brighter text? all of those?
- SVG arrow style: stroke color, stroke width, dashed vs solid,
  animated vs static, arrowhead shape
- Step badge: shape (circle / pill / square), size, background
  color, text color, font
- Filter chips: shape, active vs inactive distinction, color
- Overall feel: restrained vs colorful, dense vs spacious,
  technical vs friendly

Either path works — frames give precision, written description
gives intent. Frames preferred for Phase 2 fidelity verification.

## Why we need this

Prior diagnosis used derived metrics (page proportions, sentinel
counts) as proxies for visual match. Founder feedback (2026-05-14):
those proxies aren't the test — visual fidelity to the reference IS.
Without precise reference data, Agent 3 will keep optimizing the
wrong target.
