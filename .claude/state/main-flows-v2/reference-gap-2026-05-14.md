# Reference gap — current main-flows.html vs reference-spec.md

**Captured:** 2026-05-14T06:30Z
**Reference spec:** `reference-spec.md` (authored from 8 frames of Dave
Jeffery's 2026-05-11 tweet video at 1768×1080)
**Current state of main-flows.html:** post-Ship-4 (proportions rebalanced,
rail expanded to 62, derived-metric verifier landed)

## Methodology

For each spec element in `reference-spec.md`, mark current main-flows.html:
- **[✓]** Matches reference precisely (no visible difference)
- **[△]** Approximation present but visibly different
- **[✗]** Missing entirely

Critic gate: no gap claimed "minor" — visual fidelity is the test.
Founder divergences (spec § 12) are locked as **[locked]** and not
counted as gaps.

## Element-by-element gap

| # | Reference element | Current main-flows.html | Status |
|---|-------------------|------------------------|--------|
| 1 | Page title "Architecture & Flows" — sans, ~32px bold | "Architecture & Flows" — currently uses page-title style from dashboard-shell.css | **[△]** — title size/weight close but currently inherits a brand display tint |
| 2 | Subtitle copy — "Pick a flow on the right to highlight the path… see what gets passed at each step" | Current: "Six columns from member action to external service…" longer subtitle | **[△]** — different copy; not a bug but tone is more verbose |
| 3 | Background pure black `#000` | Currently uses `var(--bg-page)` which is billiard-green deep | **[✗]** — biggest visual divergence |
| 4 | Card surfaces transparent, hairline border ~#222 | Currently `var(--bg-card)` (filled dark green) with 1px subtle border | **[✗]** — fill vs transparent |
| 5 | Caveats banner | Present in PARBAUGHS | **[locked]** — Founder-bound (`db-2026-05-13-004`) |
| 6 | Legend strip — 7 color-coded dots with labels | Present, currently 6 dots | **[△]** — count is fine (we have 6 cols); colors differ slightly per category, but acceptable |
| 7 | Column count: 7 (incl. Build Pipeline) | 6 | **[locked]** — PARBAUGHS doesn't have a build pipeline; spec § 12.7 |
| 8 | Column header: uppercase, weight 400, no border-bottom | Currently uppercase, weight 600, **with** colored 2px border-bottom | **[△]** — extra decoration vs reference |
| 9 | Node component box — yellow border (active), dim gray border (inactive), transparent bg, NO left-border accent | Currently brass left-border 3px, card-elevated bg, brass box-shadow when active | **[✗]** — entire treatment differs |
| 10 | Off-path opacity ~0.10-0.18 | Currently 0.25 | **[△]** — slightly too visible vs reference |
| 11 | SVG arrows — solid curved yellow `#F5C518`, stroke ~1.5-2px | Currently dashed 5,4 brass `--accent-brass` | **[✗]** — dasharray and color both wrong |
| 12 | Arrow step badge — yellow filled circle, black mono text weight 700, ~16-18px | Currently brass filled with `var(--bg-page)` text — but stroke pattern differs and color is brass not yellow | **[△]** — close pattern, wrong colors |
| 13 | Flow rail header "FLOWS" uppercase small dim | Currently "Flows" with count meta to the right | **[△]** — close; styling difference |
| 14 | Flow rail card — title + 2-line description, no id chip, transparent bg, hairline border, yellow border when active | Currently single-line with id chip, tier badge, status pill, brass left-border when active | **[△]** — different but justified by Founder Q2 (search/filter requires more info per row) |
| 15 | Flow id chips ("F1", "F2") | Present in PARBAUGHS | **[locked]** — referenced throughout agent specs; spec § 12.4 |
| 16 | Status pills on flow rows | Present in PARBAUGHS | **[locked]** — Founder Q2 chose them; spec § 12.1 |
| 17 | Search input above rail | Present in PARBAUGHS | **[locked]** — Founder Q2; spec § 12.1 |
| 18 | Filter chips above rail | Present in PARBAUGHS | **[locked]** — Founder Q2; spec § 12.1 |
| 19 | "Clear selection" link at bottom of rail | NOT present | **[✗]** — missing |
| 20 | Steps panel header "STEPS" uppercase small dim | Currently "Steps" with no-flow-selected meta | **[△]** — close, styling difference |
| 21 | Step number circle — yellow fill, black mono text weight 700, ~22-24px | Currently brass fill with `var(--bg-page)` text, weight 700 — close pattern, wrong colors | **[△]** |
| 22 | Step title — "from → to" in monospace with subtle color, then bold label | Currently mono "from → to" then sans-bold label | **[△]** — close |
| 23 | Step description — **monospace** | Currently sans regular | **[✗]** |
| 24 | Active path accent color — bright yellow `#F5C518` | Currently brass `#C9A961` | **[✗]** — driving color is wrong |
| 25 | Page max-width / margins — generous gutters | Currently 1640px max via `--max-content-wide` override | **[△]** — close enough; Dave's looks ~1500-1600 effective |
| 26 | Display font — Inter sans, no serif | PARBAUGHS uses Inter sans + Fraunces (display) | **[△]** — Fraunces tint may bleed in via PARBAUGHS tokens, need to audit |
| 27 | Catalog section (62-flow filter list below diagram) | Present | **[locked]** — Founder Q1C; spec § 12.3 |
| 28 | PRIMARY/SECONDARY section labels | Present in PARBAUGHS | **[locked]** — slight redundancy after rebalance; cleanup candidate; spec § 12.8 |

## Tally

| Status | Count |
|--------|-------|
| ✓ matches | 0 (no element matches the reference precisely after the prior derived-metric work) |
| △ approximation, visibly different | 11 |
| ✗ missing or completely wrong | 7 |
| **locked (Founder divergence)** | 10 |

**28 elements total.** 18 actual gaps to close, 10 explicit divergences to
preserve.

## Gap → Ship mapping (proposed Phase 3 sequence)

Ship sequence aligned with spec § 14 prediction. Each ship addresses 1-2
related gaps. Ships ordered by visual impact (biggest first) so each ship
is independently visible.

| Ship | Gaps closed | Estimated CSS LOC |
|------|-------------|-------------------|
| **R1** — Page bg + surface tokens | #3, #4 (also implicitly improves #1 contrast) | ~50 |
| **R2** — SVG arrows: dashed → solid, brass → yellow | #11, #24 (partial — accent everywhere) | ~10 |
| **R3** — Step badge + step number circle: yellow fill, black text | #12, #21 | ~15 |
| **R4** — Node box re-style: border-only, no left-accent, no fill | #9 | ~30 |
| **R5** — Off-path opacity 0.25 → 0.15 | #10 | ~5 |
| **R6** — Column header: drop colored bottom-border, reduce weight | #8 | ~10 |
| **R7** — Steps panel typography: body → mono for description | #22, #23 | ~10 |
| **R8** — Flow rail card style: transparent, hairline, yellow active (preserving Founder-locked id+badges+chips) | #14 (partial — bg+border only, keep info) | ~20 |
| **R9** — "Clear selection" affordance | #19 | ~15 |
| **R10** — Display font audit (confirm no Fraunces tint on this page) | #26 | ~5 |
| **R11** — Caveats banner re-style for reference discipline | #2 (cosmetic only — copy stays), #5-aesthetic | ~15 |

R1-R4 are the **core fidelity** — those four ships alone close most of
the perceptual gap. R5-R11 are polish.

## "Before" evidence

Current main-flows.html (post-Ship-4) captured as:
- `current-render.png` — full page (3784px)
- `current-render-arch-only-F1.png` — arch section, F1 selected
- `current-render-viewport.png` — top 1080px

These serve as "before" reference for each replication ship's
before/after evidence per Founder brief's discipline.

## What this gap analysis does NOT do

- Does not decide whether to execute R1-R11 (Founder call — this is
  not a Wave 1 blocker per their note)
- Does not start any CSS edits (Phase 3 begins after this checkpoint)
- Does not commit any of the Ships 1-4 work (still uncommitted per
  the prior brief's "DO NOT push commits")

## Suggested checkpoint to Founder before Phase 3 begins

Three checkpoint questions Founder may want to weigh in on:

1. **Scope confirmation:** R1-R4 (4 ships, core fidelity) vs R1-R11
   (full replication). R1-R4 alone closes most of the perceptual gap;
   R5-R11 is polish.
2. **Pacing:** continue this track now or interleave with other Wave 1
   work per the "this is not a Wave 1 blocker" note?
3. **Sequencing:** the proposed R1-first (bg + surface) is the biggest
   single ship in perceptual impact but also the riskiest (changes
   token semantics page-wide). Alternative: start with R2 (SVG arrows)
   which is small + isolated to validate the replication pattern.
