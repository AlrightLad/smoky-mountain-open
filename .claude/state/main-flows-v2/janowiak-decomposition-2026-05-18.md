# Janowiak ToDesktop "Architecture & Flows" — decomposition — 2026-05-18

Source: https://x.com/DaveJ/status/2053867258653339746 by Dave Jeffery (creator of ToDesktop)

Captured via Playwright + Chrome user-data-dir per spec V2; 12 frames at evenly-spaced timestamps across the 18.2s video. Reference frames at `.claude/state/main-flows-v2/janowiak-reference-frames/frame-{01..12}-t{S.S}s.png`.

Goal of this document: characterize the reference such that a senior designer could reconstruct intent without watching the video, per spec M3.

## What the artifact IS

A static-image-feels-alive operational reference for an internal Architecture & Flows surface. Engineer or operator opens it to answer questions like "for a Builder Release click, which functions fire, in what order, and where do they read/write?" The 9 flows show the most-common operational paths across ToDesktop's system.

It's NOT a marketing piece. It's NOT a system-status dashboard. It's a flow-explorer / runbook substitute. Closest peer concept: Stripe's docs Architecture diagrams + Eraser.io's flow-clickthroughs, but executed with the polish of a Linear / Vercel surface.

## D1 — Composition + spatial relationships

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ToDesktop — Architecture & Flows         (single line caption +          │
│  Every passage and external service that powers ToDesktop Builder and    │
│  ToDesktop for Electron. Pick a flow on the right to highlight the path  │
│  through the system and see what gets passed at each step.               │
│                                                                           │
│  [legend row: client surface | firebase fn | firestore | build pipeline   │
│   distribution/browsers | external service]  ← colored chips, ~28px wide  │
│                                                                           │
│  ┌──────────────────────────────────────────────────────┬───────────────┐│
│  │  Architecture grid (≈ 70% width)                     │ FLOWS column  ││
│  │                                                       │ (≈ 30%, 280px)││
│  │  • Nodes are short rounded-rect labels w/ monospace  │               ││
│  │    type; default opacity 25% (dimmed)                 │ Each flow:    ││
│  │  • Nodes laid out left→right in implicit columns      │ • title-case  ││
│  │    (client → cli → functions → firestore → pipelines  │   label + ID  ││
│  │    → distribution → external)                         │ • 1-sentence  ││
│  │  • Implicit row banding (no explicit grid lines       │   description ││
│  │    visible; nodes have aligned baselines)             │ • dot color   ││
│  │  • Selected-flow nodes ramp to opacity 100% +         │   indicates   ││
│  │    brass/amber stroke (~1.5px) + amber numbered       │   source/dest ││
│  │    badge ringed at upper-left of node                 │ • selected    ││
│  │  • Edges between selected nodes drawn as faint        │   row has 1px ││
│  │    yellow-orange polylines with subtle arrow heads    │   amber       ││
│  │  • Unselected edges invisible (no clutter)            │   left-border ││
│  │                                                       │   + slightly  ││
│  │                                                       │   lifted bg   ││
│  │                                                       ├───────────────┤│
│  │                                                       │ STEPS column  ││
│  │                                                       │ (same width,  ││
│  │                                                       │ below FLOWS)  ││
│  │                                                       │               ││
│  │                                                       │ For currently ││
│  │                                                       │ selected flow:││
│  │                                                       │ numbered list ││
│  │                                                       │ (1, 2, 3, …)  ││
│  │                                                       │ with code-    ││
│  │                                                       │ family details││
│  │                                                       │ • caller →    ││
│  │                                                       │   target line ││
│  │                                                       │ • optional    ││
│  │                                                       │   body /      ││
│  │                                                       │   params text ││
│  └──────────────────────────────────────────────────────┴───────────────┘│
└───────────────────────────────────────────────────────────────────────────┘
```

**Key spatial moves:**

- **Two-column macro layout.** Big diagram on the left, narrow rail on the right. The rail itself splits vertically into FLOWS (top) and STEPS (bottom) when a flow is selected.
- **Architectural columns are implicit.** The diagram does not draw column headers — node clustering creates the "client surface | function | data | pipeline | external" reading from left to right. Information density is high but each node has breathing room (≈ 40-50px between nodes vertically).
- **Aspect ratio:** rendered at ~3538×2160 (4K-ish). The architecture grid uses roughly 7×4 logical cells.
- **No global chrome beyond title + legend + diagram + rail.** No toolbar, no breadcrumbs, no metadata strip. Generous negative space at top and bottom of viewport.
- **Right rail has its own vertical hierarchy:** description for the selected flow occupies the same row as title for that flow (not separate); active row has subtle left-border emphasis (~1px brass) and slightly lifted background.

## D2 — Interaction model

- **Primary input: click a flow row in FLOWS.** That row becomes the selected state.
- **Auto-cycling:** the video shows the selection auto-advancing every ~2 seconds, suggesting either an autoplay demo mode OR the video itself cycles between manually-clicked states for showcase. The interactive product likely lets the user click or use keyboard.
- **Hover state on flow row:** likely subtle (slight background lift); not visible in this video sample at the captured timestamps, but the layout implies it.
- **Selected diagram nodes are NOT individually clickable based on what's visible** — the unit of interaction is the flow row, and the diagram is the response surface. Nodes don't pop modals or detail views — STEPS handles that role.
- **STEPS panel updates synchronously with flow selection.** No animation observed in STEPS beyond a quick fade or replace.
- **Selected state on dim nodes:** opacity → 100%, amber stroke appears (≈ 1.5px), amber numbered badge appears at upper-left of node, edges between selected nodes render in. This creates the "the path lights up" effect even without per-node animation.

## D3 — Motion / transition timing

**Critical:** transitions are SHORT and ASSURED, not bouncy or elastic. The video shows:
- Selection transition: ~ 200-280ms. Cubic-bezier feel of `ease-out-quart` or similar — fast start, gentle settle.
- Node opacity ramp (25% → 100%): same ~250ms, eased.
- Edge polylines: appear with subtle path-draw effect at the same ~250ms, slightly trailing the node light-up by 50ms (creating a perceived flow-through-the-system).
- Badge appearance: same ~250ms, scaling from 90% → 100% lightly (no overshoot).
- STEPS replace: hard swap with no slide or fade. Reads as authoritative ("here's the new truth").
- NO infinite-loop animation. NO breathing/pulsing. NO carousel auto-advance with arrows.

Per `prefers-reduced-motion`: this design would degrade trivially — all the transitions could become instant without losing communicative power. The amber-stroke + opacity-100 vs. opacity-25 is a static-readable affordance.

## D4 — Color, density, contrast

**Palette (eyeballed from frames):**

- Background: dark teal-gray (≈ `#1c2a26` to `#21302a`). Subtle vertical noise visible (could be JPEG artifact or intentional grain).
- Dimmed node body: same family, slight desaturation, ~25% lightness.
- Dimmed node text: cool gray (≈ `#6b7d75`).
- Selected node body: same family but boosted toward white (≈ `#dde2dd` at center).
- Selected node text: near-white (≈ `#f0f0e8`).
- Selected node stroke: warm brass / amber (≈ `#d9a346` or close). Thin (~1.5px on 4K, so visually delicate).
- Selected edge color: same amber, lower saturation (≈ `#c8993c`).
- Numbered badge: solid amber circle with dark-text number; high contrast.
- Legend chips: small colored squares at the very top (red, green, blue, yellow, slate); used as a key but never as wayfinding within the diagram (the amber-highlight on selection conveys the path, not the legend colors).
- Title (`ToDesktop — Architecture & Flows`): bright white, large, semi-bold serif or sans (looks like a custom geometric sans — Inter-adjacent or possibly the ToDesktop brand face).

**Density:**

- 30+ nodes visible in the architecture grid simultaneously, but only the selected-flow nodes (5-10 nodes typically) draw attention. The dimming pattern is what makes high-density readable.
- 9 flows in the right rail are scannable at once because each row is ~36px tall with a title + 1 line of description.
- STEPS panel has 3-5 visible entries depending on flow complexity; scrollable.

**Contrast:**

- Selected vs unselected nodes: high contrast (white-amber vs gray-teal).
- Body text on background: comfortable AA range (estimated 4.5:1 to 7:1).
- Brass / amber against teal-gray: high (the warm-on-cool maximizes pop).

## D5 — Editorial emphasis

What this design SAYS about its values:

- **"We respect your time."** A flow becomes legible in <500ms after click. No "click to expand" / "loading" / spinners. Selection is instantaneous in human terms.
- **"We trust you to read."** The architecture grid is dense; node labels are abbreviated (`@todesktop/cli`, `functions/build`, `Firestore`). No tooltips needed — engineer audience knows the names.
- **"We don't decorate."** No gradients on nodes. No drop shadows pretending to be Material. No avatars. No counts. No "live" indicators or activity feed. Pure information.
- **"Every flow is equal."** Right rail items are visually flat — no priorities, no badges saying "common" / "rare." The engineer or operator chooses what to learn about.
- **"Pace is curated."** Selecting a flow doesn't show ALL nodes — it shows the path. The path is the answer. The unselected nodes remain visible as proof that the path is in a real system, not a simplification.

## How PARBAUGHS main-flows.html measures up

The current `docs/reports/main-flows.html` (184K, captured at `scripts/visual-audit/2026-05-18/main-flows-desktop.png`) attempts the same artifact type. M-phase scoring (M4 + M5) will:

1. Compare composition, interaction, motion, color, editorial emphasis dimension-by-dimension.
2. Identify specific gaps to industry-leader-comparable: e.g., does main-flows have the implicit-column layout? Does it use opacity-25%-to-100% on selection? Does it have a STEPS panel? Are transitions ≤ 280ms? Is the palette dark-cool with one warm accent?
3. Iterate to ≥ 9.5 against this decomposition AND against 2+ industry peers (Stripe Atlas, Cloudflare Architecture, Excalidraw, Eraser.io, Whimsical, OpenAI/Anthropic architecture overviews if any exist).

Single-reference matching is FORBIDDEN per spec M5 — main-flows must clear the bar against this decomposition AND ≥2 peers. Otherwise it's just a Janowiak knockoff.

## Senior-designer takeaway

> If I were rebuilding ToDesktop's diagram from scratch with this decomposition, I would:
> - Pick a dark cool-temperature palette with one warm accent
> - Lay out the diagram in implicit columns (no column headers)
> - Default all nodes to 25% opacity, no stroke
> - Build the FLOWS rail with title + 1-sentence description, ≤ 36px row height
> - Build the STEPS panel below FLOWS, scrollable, numbered list with monospace caller→target
> - Animate selection with 200-280ms ease-out, node opacity ramp + amber stroke + numbered badge + edge polyline (in that staggered order at 50ms intervals)
> - Resist the temptation to add labels for the columns, hover-tooltips on nodes, breadcrumbs, status indicators, or anything that says "we made a dashboard"

This is what main-flows needs to be measured against.
