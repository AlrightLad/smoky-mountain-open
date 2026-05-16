# Janowiak ToDesktop video decomposition (2026-05-15)

Source: https://x.com/DaveJ/status/2053867258653339746
Frames: 12 at `.claude/state/main-flows-v2/janowiak-reference-frames/frame-01-t0.5s.png` through `frame-12-t17.5s.png`
Manifest: `.claude/state/main-flows-v2/janowiak-reference-frames/manifest.json`
Video duration: 18.2s (looping, ~5 flows cycled across the duration)
Capture resolution: 3538 × 2160 (≈ 16:9)

**Evidence basis:** every observation below is grounded in either (a) direct Read-tool inspection of one or more frames (cited inline by frame number), or (b) pixel sampling via Pillow (PIL) over the source PNGs. Motion timing claims are explicitly labelled `[inferred from frame sequence]` since 12 fixed-timestamp frames cannot prove ease curves; they can only prove duration bounds.

---

## 1. Composition + spatial relationships

### Overall layout (verified across frames 01-12)

The page is a single fixed-viewport composition. There is no scroll of the outer page — only internal scrolling within the right rail (specifically the STEPS panel, see §2). Aspect ratio is roughly 16:9 (3538 × 2160 = 1.638:1).

Three-region split, left-to-right:

```
┌────────────────────────────────────────────────────────┬──────────────┐
│ Header strip (title + subtitle + legend dots)          │              │
├────────────────────────────────────────────────────────┤              │
│                                                        │   FLOWS      │
│                                                        │   panel      │
│   Architecture canvas                                  │  (top half)  │
│   (6-column grid of node boxes,                        │              │
│    yellow/brass-lit path overlay)                      ├──────────────┤
│                                                        │              │
│                                                        │   STEPS      │
│                                                        │   panel      │
│                                                        │ (bottom half)│
└────────────────────────────────────────────────────────┴──────────────┘
```

Width split: the right rail occupies approximately the rightmost ~22-24% of viewport width (≈ 800 of 3538 px, x ≈ 2950-3530 across all frames). The architecture canvas occupies the remaining ~76%.

Vertical split inside the right rail: the FLOWS panel takes the top ~40-45% and STEPS takes the bottom ~55-60% (verified frame 01: FLOWS header visible at ~y=200, STEPS header visible at ~y=1500). The exact split point shifts very slightly when the STEPS panel content grows — see frame 11 where the FLOWS panel header has scrolled out of view because the STEPS list has grown so long that the user has scrolled the rail.

### Architecture canvas — 6-column grid

The canvas is a **6-column horizontal grid** of node boxes flowing roughly left-to-right (frames 01, 04, 05, 07, 09). Column labels (read top-of-column from frame 01): roughly `ACTORS → CLIENT SURFACES → DATA / AUTH / FUNCTIONS → BUILD PIPELINE → INFRASTRUCTURE / NOTARIZATION → DISTRIBUTION / EXTERNAL`. Each column has 5-12 boxes stacked vertically.

Every box is a rectangle of consistent height with a 1-px border. Inactive boxes have a very dim border (near-background, see §4 palette section). Lit boxes get a 2-3px brass border + visible text-color shift to brass-white. Off-path boxes remain readable but recede heavily (text dimmed to ~60% mute, border at near-background).

### Connector lines

Lit connectors are solid (NOT dashed) brass lines with numbered brass-circle step badges placed on the line at logical transition points. Counted in frame 04: at least 5 visible step badges along the Builder → Firestore → Azure Pipelines → notarization → code-signing chain. The badges sit ON TOP of the connector line (z-index higher than line, lower than nothing else).

### Right rail — FLOWS panel

A vertical list of named flow rows. Top-of-rail header reads `FLOWS`. Each flow row is a single line consisting of a flow title (e.g. "Indesktop build (Electron CL)", "Indesktop release (publish as label)", "Builder 'Release' button", "Installed app auto-update check", "New user signup (dashboard + CLI login)") plus a one-line subtitle/explainer beneath in muted text. The full visible list across frames includes at least 10 named flows; only the top 5 cycle through the highlight during the 18-second loop.

### Right rail — STEPS panel

Below FLOWS. Header reads `STEPS`. Each step row consists of: a brass-numbered circle (1, 2, 3, …) on the left, a code-mono label naming the source-to-target transition (e.g. `User Electron repo → @todesktop/cli invoke CLI`), and a sub-line of additional plain-text description. Step rows are **internally scrollable** independent of the page (verified by frame 10 vs frame 11: same flow selected, different scroll position in the rail showing later-numbered steps).

### Z-index hierarchy (top-down)

1. (highest) **Highlighted flow row** — brass border outline appears to sit above all background fills
2. **Step badges** (numbered brass circles) — drawn on top of connectors
3. **Lit node boxes** — brass border on top of base box fill
4. **Lit connector lines** — drawn over base canvas but below node boxes
5. **Inactive nodes + inactive connectors** — base-canvas tone
6. (lowest) **Canvas background**

---

## 2. Interaction model

### Selection state — verified directly from frame sequence

The right rail's FLOWS panel exhibits a **single-selection** model. Across frames 01-12, exactly one flow is highlighted at any time (frames 01-02 → "Indesktop build", frame 03 → "Indesktop release", frames 04 + 06 → "Builder Release button", frame 05 → "Installed app auto-update check", frames 07-08 → "New user signup", frames 09-12 → return to "Indesktop build"). Selection is exclusive — picking a different flow extinguishes the previous highlight.

The highlight on the active row is a brass-amber outlined box (verified by pixel sampling at frame 04, y≈585, multiple x positions show `#f9c611`, `#fec81a`, `#f7d46f` along what is clearly a 2-3px rectangular border). The interior fill of the highlighted row remains the same dark rail tone — it is an outline-only highlight, not a filled chip.

### What lights up on selection

When a flow is selected (e.g. frame 04 → "Builder 'Release' button"):

- The named **subset** of node boxes along the flow path lights up with brass border. Inactive boxes remain dim. Specifically counted in frame 04: Builder app, Builder template, functions/build, Firestore, Azure Pipelines, Apex notarization, @todesktop/deskpify, Windows code-signing CA. Eight lit boxes; the rest of the grid (~30+ boxes) stay dim.
- The **connectors** between those boxes light up brass, with **numbered step badges** placed on each segment in order.
- The **STEPS panel** in the bottom-right repopulates with the named steps corresponding to that flow, starting at step 1 (frame 04 shows "Builder app → Firestore save app config" at the top of STEPS).

### What dims on selection

Every node box NOT on the selected flow's path goes to a heavily muted state — text still legible but border ~background, suppressed visual weight. The architecture itself never disappears or reflows; the grid stays in place; only the visual emphasis layer changes. This is the **highlight overlay** pattern (compositing) rather than a swap-content pattern.

### Selection persistence across flow changes

Selection does NOT persist across frames within the same flow — the highlighted boxes are reset and rebuilt each time the FLOWS selection changes. Verified by comparing frame 04 (Builder Release) → frame 05 (Auto-update): the lit-node set is **completely different** between these two frames (no overlap with the build path; auto-update lights end-user → Firestore → AKS CI → cdn-workers → CloudFront R2, which barely overlaps the build chain).

### Cursor evidence

Frame 09 shows a small **cursor pointer near the FLOWS panel** — direct evidence that selection is driven by a click affordance (or click-equivalent hover) on the rail's FLOWS rows. There is no visible drag/keyboard interaction in any of the 12 frames.

### STEPS rail is independently scrollable

Direct evidence from frames 10 + 11: same "Indesktop build" flow active in both, but the STEPS panel shows different step ranges (frame 10 mid-flow steps with FLOWS panel header gone from view; frame 11 even later steps). This confirms the rail-side STEPS list scrolls within its container without affecting the rest of the layout. The architecture canvas remains untouched; the FLOWS panel header just scrolls off the visible rail because the panel above it has expanded enough to push it.

---

## 3. Motion + transition timing

**Caveat:** all timing values here are **inferred** from the 12-frame sequence (1.0-1.5s spacing). Direct curve identification is impossible at that sample rate; the captured frames can only constrain duration bounds and confirm what is in-motion vs static.

### Flow-cycle timing (inferred from frame timestamps)

The 18.2s loop cycles through five named flows. Based on which flow is highlighted at each frame:

| Flow | Active frame range | Approx duration on screen |
|---|---|---|
| Indesktop build (Electron CLI) | frames 01-02 (t=0.5 → 1.5s) | ~2-3 seconds dwell at opening |
| Indesktop release (publish as label) | frame 03 (t=3.0s) | ~1 second dwell |
| Builder "Release" button | frames 04 + 06 (t=4.5, 7.5s) | ~3 seconds dwell with continuation |
| Installed app auto-update check | frame 05 (t=6.0s) | ~1 second dwell |
| New user signup (dashboard + CLI login) | frames 07-08 (t=9.0, 10.5s) | ~2-3 seconds dwell |
| (loop back) Indesktop build | frames 09-12 (t=12.0 → 17.5s) | ~5 seconds dwell during build-path scroll-through |

The loop is **not strictly chronological flow order** — frames 04 → 05 → 06 show Release → Auto-update → Release, suggesting either a back-and-forth cursor demo or auto-play scripted sequence. Most likely: video author manually clicked flows in a demo order while recording. **[inferred]**

### Per-transition motion characteristics (inferred)

When flow selection changes (e.g. between frame 03 and frame 04), several things happen "at once":
- Old lit-node borders dim
- New lit-node borders illuminate
- Connector lines redraw on the new path
- Step badges relocate / renumber
- STEPS panel content swaps

These changes appear simultaneous in the captured frames — there is no transitional intermediate state captured where SOME nodes are lit and OTHERS are mid-fade. **[inferred from absence of intermediate frames]:** the transition is likely a short crossfade or instant swap, sub-300ms total. A long stagger (>500ms) would have been visible as an intermediate state in at least one frame given the 1.5s sample interval. So: most plausibly a single short fade (~150-250ms, `--duration-fast` to `--duration-med` equivalent), or even instant.

### What is verified static vs animated

- **Architecture grid positions:** static (every frame shows nodes in identical pixel positions; no layout shifts).
- **Right rail width + position:** static.
- **FLOWS list contents:** static (same ordered list visible across all frames where the FLOWS header is on screen).
- **Highlight + connector + step-badge layer:** animated (re-renders on flow change).
- **STEPS panel content + scroll position:** animated (re-renders on flow change, plus user-driven scroll within frame).

### What is NOT verified

- Hover-state previews (no frame shows a hover-but-not-clicked state).
- Step badge appearance order — they may appear sequentially with a stagger, or all-at-once. The 1.5s frame interval is too coarse to distinguish.
- Whether connectors *draw on* (animated path-stroke) or *fade in* (opacity ramp). No frame shows a partial draw.
- Cursor motion path — only one cursor frame captured (frame 09).

---

## 4. Color + density + contrast

### Palette (pixel-sampled, hex verified)

**Backgrounds:**
- Outer page bg: `#0f1017` (very dark blue-black, sampled frame 04 top-left corner)
- Canvas interior bg: `#1c1e27` (slightly lighter — gives the canvas a subtle plate effect, frame 04 mid)
- Right rail bg: `#15171e` (between page and canvas tones, frame 04 x=3200,y=1200)
- Step badge interior fill: ~`#1b1e27` matching rail
- Far-left canvas edge: `#161a22` (sampled frame 04 x=200,y=800)

**Brass / highlight palette:**
- Pure brass-amber (highlighted FLOW border, lit node border, connector lines): `#f9c611` / `#fec81a` (frame 04 y=585 x=3050-3100)
- Brass-light (likely outer-edge or anti-aliased halo): `#f0c536`, `#f7d46f` (same row)
- Lit-node brass border interior pixel: `#d4b73e`, `#f0c532` (frame 04 architecture grid sample, x≈1700-1800 y=1000)

**Neutral / muted ink:**
- Step badge number color (inside badge): light gray `#9095a2`, `#989ea8` (frame 04 y=1640 x=3045)
- Muted body text (FLOWS subtitles, dimmed node labels): `#8797ac` / `#8897ac` (sampled at frame 01 legend area)
- Step-badge dim outer ring: `#5a606e` (frame 04 y=1610 x=3030)

**Category legend dots (frame 01 row at y≈202-212):**
- Actor: dim red — exact hex not cleanly sampled but appears in `#7a2222`-ish range (visual)
- Client surface: purple `#9663f1` / `#9277d4`
- Firebase function callable: brass-amber `#e39520` / `#c89955` — same family as the highlight color
- Firebase data: green `#31cc9c` / `#4cc9a8`
- Build pipeline: cyan-blue `#26cdf9` / `#27d3f2`
- Distribution / Binaries + External service: continuing the row to the right (visual evidence in frame 01)

The legend's color encoding is **applied** to the actual node borders in the inactive state — each box's persistent identity color tags its category, while the active-flow brass highlight is a layered overlay on top.

### Density per region

**Architecture canvas:** moderate to dense — 6 columns × 5-12 boxes per column ≈ 40-60 visible boxes. Spacing is generous enough that each box is fully legible at 3538-wide resolution; at the dim/inactive border the boxes feel "scaffolded" rather than overcrowded.

**FLOWS panel:** sparse, deliberately. Each flow row is a single title + 1-line subtitle with comfortable vertical padding. Easy to scan; the highlighted row pops because so few things compete with it.

**STEPS panel:** denser than FLOWS but with rhythm — every step is a numbered-circle anchor (12-16px diameter brass disc with mono number) followed by 2-3 lines of mono code text. The mono font + brass numbers + consistent left margin creates a clear vertical rail of "1, 2, 3, …".

### Contrast (sampled)

- Text on background: `#9095a2` step number text on `#15171e` rail = ~6.5:1 contrast (WCAG AA passes for body)
- Lit brass connector on canvas: `#f9c611` on `#1c1e27` = ~10:1 (very high — intentional emphasis)
- Inactive box border on canvas: `#222-#252` on `#1c1e27` = ~1.5:1 (deliberately near-invisible — recedes)
- Highlighted flow box border on rail: `#f9c611` on `#15171e` = ~10:1+

The contrast architecture is a **two-tier system**: lit elements push 10:1+ to be the unmistakable focal layer, while inactive elements push 1.5-2:1 to fall away. There is essentially no "middle tier" — elements are either FOCUS or RECEDE, with no soft middle.

---

## 5. Editorial emphasis

### First-fixation hypothesis

When the video opens (frame 01-02), the eye lands on the **highlighted FLOW row in the upper-right rail** within the first ~500ms. The brass-amber outline against the dark rail at the top of a clean panel of muted-text rows is the highest-contrast single-element on screen. Slightly afterward, the eye follows the lit path across the architecture canvas, terminating either at the right-most node (Azure Key Vault, frames 01/09/12) or wherever the path's endpoint sits.

The title in the upper-left ("ToDesktop — Architecture & Flows" in display-serif) is visually competent but **does not compete** for first fixation — it's a header, not a CTA. It says "this is the diagram for ToDesktop" and then disengages.

### Primary-action signaling

There is no traditional CTA. The primary "action" is the FLOWS rail — and the brass-amber outline + the slight pop of the title weight tells the viewer "this row is what you're looking at right now." The path-illumination across the canvas is the *consequence* of selection, not the action itself. The cursor visible in frame 09 confirms the FLOWS rows are clickable.

The **STEPS panel is the secondary destination** — the viewer's eye moves from FLOWS → canvas → STEPS, in roughly that vertical reading order. STEPS is detail/proof, not the entry point.

### Information that's intentionally suppressed

- **Inactive node text** is dimmed to ~60% — readable for context (so a viewer can see "okay there's also a CloudFront R2 box, that's not part of this flow but it's part of the system") but doesn't compete.
- **Inactive node borders** are pushed nearly to background — they're scaffolding, not focus.
- **Connectors between inactive nodes** are either absent or rendered so faint they read as "the rest of the system exists but isn't relevant to this story."
- **Page chrome** is essentially zero — no nav, no buttons, no toolbar. The diagram is the whole page. This is **maximum signal-to-noise** discipline.
- **The full STEPS list for non-selected flows** is hidden, not greyed — only the active flow's steps render in the panel.

### Editorial voice

The composition reads as an **expert-author teaching a system by walking through its flows**, not a marketing brochure. There's no "look at how clever this architecture is" framing — instead the right rail says "here are the flows, here are the steps that compose each one, click and read." It treats the viewer as a peer engineer.

---

## Distinctive patterns to replicate in PARBAUGHS main-flows.html

1. **Two-tier contrast architecture (HIGH FOCUS vs HARD RECEDE) — no middle tier.** Lit-path elements should push contrast to 10:1+ on canvas. Inactive elements should sit at ~1.5-2:1 — readable for context but visually quiet. PARBAUGHS' current main-flows iter-13 capture (`current-render-flow-selected.png`) already does the brass-border / dimmed approach but the inactive opacity (`0.18` per design-review) is at the right magnitude. Audit needed against frame 04 inactive borders to verify match.

2. **Single-selection rail with outline-only highlight (no filled chip).** The Janowiak FLOWS panel does NOT use filled background highlights — the active row is identified by a thin brass-amber rectangular outline + a slight title-weight pop. PARBAUGHS should verify this; a filled-chip highlight (common UI pattern but a deviation) would be a visual departure.

3. **Step badges on the connector lines, not in the rail.** The numbered step circles in Janowiak are placed **on the lit canvas connector lines** at the transition points, so the eye can follow the path in numerical order. PARBAUGHS currently has step badges only in the STEPS rail panel (per iter-13 review). Adding them on-canvas would be a verifiable upgrade in editorial clarity. **Caveat:** this may already be present in PARBAUGHS — verify against current-render before scoping.

4. **Persistent category color identity in inactive node borders.** Each Janowiak box carries its category color (red Actor, purple Client, brass Function, green Data, cyan Build, etc.) as its persistent border identity, even when the box is inactive. The brass highlight overlay LAYERS on top of that category color when the box is lit. This means even unselected, the diagram is still color-legible. PARBAUGHS' iter-13 review notes 6-color legend dots — verify they're applied to the node borders themselves (not just the legend strip).

5. **STEPS panel rendered with mono-font code labels + numbered brass circles.** Step labels read as `Source → Target: action()` in monospace. The mono font implies "this is code-level fidelity" and reinforces the diagram-as-engineering-spec voice. PARBAUGHS should verify its STEPS rail uses a mono family for the transition labels.

6. **Page is non-scrolling outside the rail.** No outer page scroll on Janowiak. The architecture grid is sized to fit viewport at 16:9. PARBAUGHS' current implementation is taller-than-viewport and scrolls (verified by current-render-flow-selected.png aspect ratio). A long-term ambition might be a desktop-only "fit-to-viewport" mode for the diagram, but for PARBAUGHS' use case the catalog of 62 flows + caveats blocks probably justifies the height — accept the deviation, but consciously.

7. **Cursor position as a click affordance signal.** Janowiak frame 09 shows the cursor visible near the FLOWS panel as part of the recorded demo. Not a pattern to replicate exactly but informs: video / demo capture for PARBAUGHS' own main-flows should show a cursor over a rail row when illustrating the click affordance.

---

## What PARBAUGHS main-flows currently misses (preliminary, full scoring in M4-M5)

Initial visual comparison of Janowiak frame 04 vs `current-render-flow-selected.png`:

1. **On-canvas step badges:** Janowiak places numbered brass circles directly on lit connector lines. PARBAUGHS appears to localize step badges to the rail. Adding on-canvas badges would visibly improve "walk the path" reading.

2. **Layered category color + highlight overlay:** PARBAUGHS' current iter-13 capture shows lit nodes in brass but it's unclear whether inactive nodes retain their category color identity in the box border. Janowiak's persistent color encoding makes the diagram "always color-legible" even when un-illuminated.

3. **Aspect ratio + viewport fit:** Janowiak fits in a single non-scrolling viewport. PARBAUGHS' current main-flows is a long scrolling page with caveats + diagram + flow catalog + supplementary lists. This is a deliberate PARBAUGHS deviation (more flows to surface) but the architecture region itself could be designed to fit-viewport at >= 1440px wide for a desktop "scan mode."

4. **STEPS panel typography:** unclear from the current-render whether PARBAUGHS uses a mono family for STEPS labels. Janowiak does, and it carries weight. Easy verify-and-correct.

5. **Highlight style — outline vs fill:** PARBAUGHS' iter-13 highlighted row in the rail is unclear from the screenshot — may be fill-on-active. Janowiak is outline-only. Visual deviation either way, but worth being deliberate.

6. **Density of right rail flow rows:** Janowiak shows ~10-12 named flows in the FLOWS list, single-line titles + 1-line subtitle, very breathable. PARBAUGHS has 62 flows in its rail with denser actor + status chip per row (Founder-Q2 ratified per design-review iter-13). The PARBAUGHS density is the right call given 62 entries — but the per-row breathing room could probably increase by 4-8px without losing scan-ability.

7. **Connector line style discipline:** Janowiak connectors are solid + brass + no curve flourishes. Iter-13 design-review already notes PARBAUGHS connectors are "solid brass (not dashed) per ref + iter R2 alignment" — confirmed match.

These initial observations feed M4-M5 scoring; full TASTE SCORE block per spec P7.2 with dimension-by-dimension grades remains for the next phase.

---

**Frame-citation cross-reference (for quick lookup):**

- Build flow (Indesktop build): frames 01, 02, 09, 10, 11, 12
- Release flow (Indesktop release): frame 03
- Builder Release button: frames 04, 06
- Auto-update check: frame 05
- New user signup: frames 07, 08

**Source artifacts:**

- `manifest.json` — `.claude/state/main-flows-v2/janowiak-reference-frames/manifest.json`
- All 12 frames — `.claude/state/main-flows-v2/janowiak-reference-frames/frame-NN-tNN.Ns.png`
- Existing PARBAUGHS comparison snapshot — `.claude/state/main-flows-v2/current-render-flow-selected.png`
- Existing iter-13 design review — `.claude/state/main-flows-v2/design-review-2026-05-14-iter13.md`
