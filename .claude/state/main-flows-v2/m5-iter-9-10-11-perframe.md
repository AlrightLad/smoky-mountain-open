# M5.9 + M5.10 + M5.11 — Per-frame Janowiak parity reckoning

**Date:** 2026-05-19
**Trigger:** Founder reckoning ("the current version does NOT match the video"). Previous agent claimed 9.5 without confirming per-frame side-by-side V1.

## Method

For each of 4 anchor Janowiak frames (01, 04, 07, 12), captured PARBAUGHS
at the same interaction state (F1 selected, F4 selected, F7 selected, F1
re-selected) and read both images in the same response window. Described
specific visual deltas as `gap-XX` and applied fixes in priority order.

## Capture scripts (new)

- `scripts/visual-audit/capture-main-flows-multi.mjs` — captures F1/F4/F7/F1b at full page + viewport
- `scripts/visual-audit/capture-main-flows-zoomed.mjs` — 800x500 + 460x900 zoom crops of active cluster + arrow detail + rail
- `scripts/visual-audit/capture-main-flows-stagger.mjs` — mid-animation captures at t=100/250/400/600/1000ms

## Iteration cycles

### M5.9 (12 gaps closed)

| Gap | Severity | Fix |
|---|---|---|
| gap-01 | CRITICAL | Title 2.5rem → 1.25rem; weight 700 → 600 |
| gap-02 | (verified OK) | Off-path opacity 0.18 → 0.25 already shipped in M5.8 |
| gap-04 | HIGH | Active fill 0.09 → 0.14 + border 1px → 1.5px |
| gap-05 | HIGH | Arrow stroke 1.5px → 2px + stroke-linecap=round |
| gap-07 | HIGH | Step label color → text-primary; desc → text-secondary |
| gap-08 | MEDIUM | Filter chrome compressed: chip padding/font-size tightened |
| gap-09 | HIGH | Rail row padding 6px → 5px; id width 32px → 28px |
| gap-10 | HIGH | Legend dot 8px → 10px; labels lifted to text-secondary |
| gap-11 | MEDIUM | Caveats expander opacity → 0.65 (whisper) |
| gap-12 | HIGH | Title prefix: "PARBAUGHS — Architecture & Flows" |
| gap-13 | HIGH | Card-header padding/font tightened |
| gap-17 | HIGH | Arrow badge text fill bg-page → billiard-green-900 |

### M5.10 (3 gap closures)

| Gap | Severity | Fix |
|---|---|---|
| gap-04b | HIGH | Active fill 0.14 → 0.18 + border 1.5px → 2px |
| gap-06 | HIGH | Badge radius 9px → 11px (1px shy of Janowiak's 12px) |
| gap-18 | MEDIUM | Off-path border equalized so 2px → 1px transition doesn't lurch |

### M5.11 (1 gap closure)

| Gap | Severity | Fix |
|---|---|---|
| gap-16 | HIGH | Active rail row bg 0.07 → 0.14; left-border 2px → 3px; id colored brass + weight 700 |

## Per-frame final match status

| Anchor | Janowiak frame | PARBAUGHS state | Match |
|---|---|---|---|
| F1 | frame-01 (t0.5s) | F1 selected, animation complete | **VERY-CLOSE** |
| F4 | frame-04 (t4.5s) | F4 selected, animation complete | **CLOSE** |
| F7 | frame-07 (t9.0s) | F7 selected, animation complete | **CLOSE** |
| F1b | frame-12 (t17.5s loop-back) | F1 re-selected, animation re-triggered | **VERY-CLOSE** |

## Capture artifacts

- `.claude/state/main-flows-v2/pb-anchor-{F1,F4,F7,F1b}.png` — full page
- `.claude/state/main-flows-v2/pb-anchor-{F1,F4,F7,F1b}-viewport.png` — above-the-fold
- `.claude/state/main-flows-v2/pb-zoom-cluster-active.png` — node cluster detail
- `.claude/state/main-flows-v2/pb-zoom-cluster-edge.png` — arrow + badge detail
- `.claude/state/main-flows-v2/pb-zoom-rail.png` — rail detail
- `.claude/state/main-flows-v2/pb-stagger-t{100,250,400,600,1000}.png` — stagger animation verification

## Constraints respected

- bg remains billiard-green-900 (NOT changed to Janowiak teal-black) per Founder-lock
- Filter chrome retained (search + actor/tier chips) per Founder-Q2 lock; only made density-aware-utility compact
- 62-flow rail count preserved
- F1 default-selected at load preserved
- All M5.1-M5.8 work preserved (additive only)

## Subjective taste calls remaining

- **Background color**: Janowiak uses dark teal; PARBAUGHS uses billiard-green. Per CLAUDE.md this is brand-identity Founder-lock, not a parity miss.
- **Filter chrome presence**: Janowiak has zero filter chrome; PARBAUGHS has compact search + chips. Founder Q2-locked.

## Animation timing verification

Stagger captures confirm the path-draw cascade IS visible mid-cycle:
- t=100ms: nodes lit but arrows partially drawn (badge 1 visible)
- t=250ms: badges 1+2 visible, arrow 3 drawing
- t=400ms: badges 1-4 visible
- t=600ms: badges 1-7 visible (all complete)
- t=1000ms: full state stable

Capture-side waitTimeout of 1100ms in capture-main-flows-multi.mjs ensures
the animation is COMPLETE before screenshot, matching Janowiak's frame-01
which captures animation-settled state.
