# Dashboard Taste-Scoring Rubric (PARBAUGHS P7)

**Authored:** 2026-05-15
**Spec source:** `dashboard-completion-spec-2026-05-15.md` P7 (per goal-text
addition; spec file itself lacked P7 — surfaced as gap in stop-hook
feedback; rubric authored to address).
**Method:** 7-dimension assessment, each 1-10, average = final score.
**Pass threshold:** ≥ 7.5/10 per surface.
**Role identities adopted for scoring:**
- **Linear designer** — judges hierarchy, typography, white space, restraint
- **Vercel engineer** — judges brand boldness, info-at-a-glance, deployment-card pattern
- **Stripe engineer** — judges data density vs polish, chart treatment, premium feel
- **Datadog engineer** — judges ultra-dense info presentation, color discipline for severity
- **Sentry engineer** — judges error-state design, severity color, code-context surfacing

For each PARBAUGHS surface, scorer adopts all 5 lenses + synthesizes.

---

## The 7 dimensions

### 1. Visual hierarchy (1-10)
How clearly the eye flows from most-important to least-important info.
- 10: instant scan, primary action obvious, secondary info recessed
- 7-8: clear hierarchy with minor polish gaps
- 5-6: hierarchy present but fights with itself
- 1-4: flat or chaotic; eye doesn't know where to go

### 2. Typography (1-10)
Choice of typeface, weight discipline, line-height, type-scale.
- 10: distinctive (not Inter-default), 2-3 weights, consistent scale, perfect line-height
- 7-8: solid choice + consistent application
- 5-6: works but generic
- 1-4: clashing/sloppy/illegible

### 3. Color discipline (1-10)
Restraint + meaning. Brand accents used sparingly. Status colors legible.
- 10: ≤4 colors, every one carries meaning, never decorative
- 7-8: clean palette with 1 inconsistency
- 5-6: too many colors OR same color overused
- 1-4: rainbow / poor contrast / accessibility-fail

### 4. Layout + spacing (1-10)
Grid discipline, white space, alignment, density.
- 10: confident spacing, generous white space, perfect alignment
- 7-8: clean grid, occasional rhythm break
- 5-6: cramped OR sparse OR ad-hoc spacing
- 1-4: misaligned, no rhythm, broken at common viewports

### 5. Interactive feedback (1-10)
Hover states, focus states, loading states, click feedback.
- 10: every interactive has hover/focus/active treatment, loading present, errors handled
- 7-8: hover/focus present, loading basic
- 5-6: hover ok, focus inconsistent, no loading
- 1-4: no feedback / accessibility blocker

### 6. Information density vs clarity (1-10)
How much can the user understand in 3 seconds?
- 10: dense + immediately scannable (Datadog at its best)
- 7-8: dense, takes 5-10 seconds
- 5-6: under-dense (wastes space) OR over-dense (confuses)
- 1-4: incoherent

### 7. Brand cohesion (1-10)
Does the surface feel like part of a deliberate product family?
- 10: every surface in the product feels by the same hand
- 7-8: family resemblance, minor variations
- 5-6: same components but feels stitched
- 1-4: mishmash

---

## Scoring procedure per surface

1. Open surface in Playwright at 1440×900.
2. Take full-page screenshot.
3. Read the PNG with agent vision (V1).
4. For each of 7 dimensions, write 1-2 sentence assessment + score 1-10.
5. Adopt each of 5 peer role identities in turn — note where they'd
   praise/critique.
6. Compute average score.
7. If ≥7.5: PASS. If <7.5: list 3 specific actionable fixes + iterate.

---

## Peer baseline anchors (calibrate scoring)

These are the reference points that anchor "what 8.0 looks like":
- **Linear dashboard**: Visual hierarchy 9, Typography 9, Color 9,
  Layout 9, Interactive 9, Info density 8, Brand 10 → ~8.9
- **Vercel deployments**: Hierarchy 8, Typography 8, Color 9, Layout 9,
  Interactive 8, Info density 7, Brand 10 → ~8.4
- **Stripe dashboard**: Hierarchy 9, Typography 9, Color 8, Layout 9,
  Interactive 9, Info density 9, Brand 9 → ~8.9
- **Datadog APM**: Hierarchy 7, Typography 7, Color 8, Layout 7,
  Interactive 8, Info density 10, Brand 8 → ~7.9
- **Sentry issues list**: Hierarchy 8, Typography 8, Color 9 (severity!),
  Layout 8, Interactive 8, Info density 9, Brand 8 → ~8.3

**Peer-anchor average: ~8.5/10.** Our threshold of 7.5 represents
"competitive but not yet best-in-class" — appropriate for a 2-person
operations dashboard, not a flagship SaaS UI.
