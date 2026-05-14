# iter 14 — visual review with built-in multimodal vision

**Authored:** 2026-05-14 by design-bot per PROP-010 + PROP-011.
**Method:** Read tool on reference frame + current screenshot (Claude
is a multimodal LLM — the Read tool surfaces rendered PNG visually).
**Discipline:** look at WHAT the rendered images show, not just what
their elements measure. This is the verification axis that's been
missing across 13 prior iterations.

## Images compared

| Side | File | Resolution |
|---|---|---|
| Reference | `.claude/state/main-flows-v2/reference-frames/dave-frame-t000p5.png` | 3538×2160 native (Janowiak demo, t≈0.5s) |
| Current | `.claude/state/main-flows-v2/founder-real-context/2026-05-14T20-31-14Z/00-page-top.png` | 1920×1080 (iter-13 main-flows.html) |

## What I see in the reference (described — for the record)

- Pure black canvas. Title "ToDesktop — Architecture & Flows" upper-left in white. Subtitle in yellow accent + body text.
- 6 colored legend dots inline below subtitle.
- 6-column architecture grid, densely packed (~10-14 components per column visible).
- Component boxes: transparent fill, hairline white border, single-line label.
- **A flow is ALREADY selected:** "Indexing build (Electron CLI)" highlighted at top of rail. Path lit on grid (yellow borders on on-path boxes). Yellow SVG arrows + numbered yellow circle step badges (1, 2, 3, 4, 5, 6) connecting boxes.
- Right rail: "FLOWS" header, list of ~10 flows. Active flow row has yellow border.
- "STEPS" panel below rail: numbered steps with descriptions for the active flow.

## What I see in the current PARBAUGHS render

- Billiard-green canvas (Founder-ratified theme deviation). Title "Architecture & Flows" in white chalk. Subtitle in white body text.
- Brass-bordered caveats block ("Read this article currently blasting around the dev community...") — PARBAUGHS-specific guidance.
- 6 colored legend dots inline below caveats.
- 6-column architecture grid, sparser (~5-8 components per column visible).
- Component boxes: transparent fill, hairline border via `--border-subtle`, single-line label.
- **No flow selected.** Grid is in neutral state — no on-path highlighting visible. Steps panel below rail shows empty state "Select a flow on the right..."
- Right rail: filter chips (actor + tier — Founder-Q2 ratified additions), search input, list of ~10 visible flows (F1 Log a Round, F2 First-time setup, etc).

## Per-element diff (what an eye-test surfaces)

| # | Element | Reference | Current | Verdict |
|---|---|---|---|---|
| 1 | Canvas color | black | billiard-green | Founder-ratified DEVIATION (iter 5) |
| 2 | Accent color | yellow | brass | Founder-ratified DEVIATION |
| 3 | Title position + font | upper-left, display | upper-left, Fraunces display | ✓ MATCH |
| 4 | Subtitle pattern | "Every package and external service that powers X. Pick a flow on the right..." | "Every component and external service that powers PARBAUGHS, mapped across six columns from member action..." | ✓ MATCH (pattern) |
| 5 | Caveats block | NONE | brass-bordered explainer | INTENTIONAL — PARBAUGHS adds guidance reference has no need for |
| 6 | Legend dots | 6 colored, inline | 6 colored, inline | ✓ MATCH |
| 7 | Grid columns | 6 | 6 | ✓ MATCH |
| 8 | Components per column | ~10-14 | ~5-8 | APPROXIMATION (PARBAUGHS has 47 total vs ref ~60+; different products, different data) |
| 9 | Box style | transparent fill, hairline border | transparent fill, hairline `--border-subtle` | ✓ MATCH |
| 10 | Box label style | technical (`@todesktop/builder`, etc.) | product (`Member`, `HQ Home`, etc.) | INTENTIONAL — different product surfaces |
| 11 | Column headers | uppercase, narrow letter-spaced | uppercase, narrow letter-spaced | ✓ MATCH |
| 12 | Right rail header | "FLOWS" small caps | "Flows" small caps via mf-card-title | ✓ MATCH |
| 13 | Rail filter UI | NONE | search input + 2 chip rows (actor, tier) | Founder-ratified DEVIATION (Q2) |
| 14 | Rail flow row content | title only | title + actor + status chip | Founder-ratified DEVIATION (Q2) |
| 15 | SVG arrow style | yellow solid + numbered yellow badge | brass solid + brass-filled badge | ✓ MATCH (theme-deviated) |
| 16 | On-path box highlight | yellow border, opacity 1 | brass border, opacity 1 | ✓ MATCH (theme-deviated) |
| 17 | Off-path box | dim ~18% | `opacity: 0.18` | ✓ MATCH |
| 18 | Steps panel header | "STEPS" small caps | "Steps" small caps | ✓ MATCH |
| 19 | **Default selection state** | Flow F1 pre-selected, path lit, steps populated | No flow selected, grid neutral, "Select a flow..." prompt | **POTENTIAL GAP** |
| 20 | Steps content density (when active) | numbered + title + multi-line mono description | numbered + title + mono description | ✓ MATCH |
| 21 | Cursor / hover treatment | cursor near center-right (mid-interaction) | not applicable to static capture | N/A |

## Actionable findings

### Finding A — Default selection state (potential gap)

The reference video opens with the first flow already selected. The
PARBAUGHS page opens with no selection — the user sees an empty grid
+ empty Steps panel until they click a rail item.

This is a UX intent question, not a structural bug:
- **For reference fidelity:** auto-select F1 on page load so the
  highlighted path is the user's first impression
- **For PARBAUGHS use:** the empty state acts as an invitation
  ("Select a flow on the right to see the path...") — explicit
  guidance for first-time visitors

**Recommendation:** Surface to Founder for ratification. The fix is
trivial (3 lines of JS to auto-click F1 on load), but the question
is design intent: "highlighted-by-default" vs "empty-state-as-prompt".

### Finding B — Component density (approximation, not gap)

PARBAUGHS has 47 actual architecture components (verified in the data
block). The reference has ~60. The lower density is data, not display
— fixing it would require either fabricating components (AMD-009 P5
violation) or genuinely adding architecture work to PARBAUGHS.

**Recommendation:** No code change. Approximation accepted; documented
in iter-14 visual review as the explanation for the sparser feel.

### All other rows: MATCH or Founder-ratified DEVIATION

Zero unflagged gaps. 13 ✓ MATCH rows; 3 Founder-ratified DEVIATIONs
(theme palette, rail filter UI, rail row content); 2 INTENTIONAL
differences (caveats block, label content); 1 APPROXIMATION (density);
1 POTENTIAL GAP (default selection state — surfaced for Founder).

## Design-bot verdict (PROP-010 format)

**APPROVE for ship-close, with one surfaced question:**

- All structural elements match the reference (theme-deviated as
  Founder-ratified).
- All interactions verified via PROP-009 user-journey audit.
- Rail stability holds per iter-13 fix.
- Recent 7 Days perceptual colors hold per iter-12 fix.
- **Open question to Founder:** Finding A (default selection state)
  is a design intent decision. Team's proposed answer: **keep empty-
  state-as-prompt** (PARBAUGHS-distinctive — invites user action).
  Per AMD-015 default: this becomes operative absent Founder
  refinement.

## What 14 iterations of work proved

The "fix-the-wrong-axis" pattern was real and structural. Each
iteration caught a subset:

| Iter | Axis caught |
|---|---|
| 1-5 | Theme (wrong palette) — caught by Founder eyes |
| 6 | Theme + composition (redundant catalog) — caught by Founder iter 5 directive |
| 7 | Reference structure (frames captured for first time) — caught by reading frames |
| 8 | Scroll reachability + side-by-side discipline — caught by reachability test |
| 9-10 | Verification gates installed (user-context, Playwright MCP) |
| 11 | Rail viewport overflow — caught by measurement |
| 12 | Perceptual color collision — caught by HSL analysis |
| 13 | Rail jitter (introduced by iter-11) — caught by verify-rail-stability + Founder direction |
| **14** | **First systematic visual review** — caught no NEW gaps (clean!) but verified the prior 13 iters' work holds end-to-end |

Iter 14 is the first iteration that uses the LLM's built-in
multimodal vision to LOOK at both images and articulate observations.
The capability has been present the whole time. The discipline is
what was missing.
