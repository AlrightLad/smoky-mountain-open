# main-flows.html replication — checkpoint after R1-R4

**Captured:** 2026-05-14T06:35Z
**Track status:** PAUSED — R1-R4 (core fidelity) complete; R5-R11 (polish) remain.
**Pause reason:** Founder directive in same session redirected next workload to
PROP-003.b. Visual track paused at a stable checkpoint with derived-metric
verifier still PASS and lint clean.

## What landed (Phase 1-2 + Ships R1-R4, all uncommitted)

| Phase | Output |
|-------|--------|
| Plan B-F research log | `reference-research-2026-05-14.md` |
| 8 reference frames + poster | `reference-frames/dave-tweet-video-poster.jpg` + `dave-frame-t*.png` (7 frames at 1768×1080) |
| Reference spec (14 sections, 28 elements) | `reference-spec.md` |
| Gap analysis (18 gaps, 10 Founder-locks) | `reference-gap-2026-05-14.md` |
| Before snapshot | `before-R1.png`, `before-R1-arch.png` |
| **Ship R1** — page bg pure black + transparent cards | `after-R1.png`, `after-R1-arch.png` |
| **Ship R2** — SVG arrows dashed brass → solid yellow | `after-R2-arch.png` |
| **Ship R3** — step badges yellow + black mono (closed by R1+R2 cascade) | (no separate capture; verified via DOM probe) |
| **Ship R4** — node box re-style (no left-accent, no fill, crisp yellow border on path) | `after-R4.png`, `after-R4-arch.png` |

## Tools shipped (uncommitted, scripts under scripts/visual-audit/)

- `capture-main-flows.mjs` — full-page + meta capture at 1920×1080
- `capture-main-flows-arch.mjs` — arch-only crop with F1 auto-selected
- `inspect-catalog-rows.mjs` — row dimension inspector
- `test-rail-filters.mjs` — rail search + chip functional test
- `test-click-f9.mjs` — F9 metadata-only state verifier
- `probe-x-reference.mjs` — Playwright probe of X.com (Plan F)
- `probe-x-media.mjs` — Playwright media-URL extractor (Plan F-2)
- `extract-video-frames.mjs` — HLS playback frame extractor (Plan F-3)
- `verify-main-flows.mjs` — derived-metric visual verifier (Ship 4)

## Visual evidence summary

Before R1 (current Wave-1 baseline post-Ship-4):
- Dark green billiard surface
- Brass accents everywhere (brass left-borders, brass arrows, brass badges)
- Dashed (5,4) brass arrows
- Brass-tinted active flow card

After R4:
- Pure black canvas
- Transparent cards with hairline borders
- Yellow (`#F5C518`) accent for active path
- Solid curved yellow arrows with yellow filled badges containing black mono numbers
- Yellow border on active nodes, no glow shadow
- Off-path nodes at 0.18 opacity (was 0.25)

Side-by-side: the page now visually matches Dave Jeffery's reference at ~80%
fidelity. Remaining ~20% is polish (R5-R11):
- R5 — opacity tweaks closer to spec § 4 (already partially done in R4)
- R6 — column header styling (drop colored bottom-border)
- R7 — steps panel typography (body → monospace for descriptions)
- R8 — flow rail card style (Founder-locked id+badges+chips remain; just bg+border)
- R9 — "Clear selection" affordance at bottom of rail
- R10 — typography audit (confirm Inter, no Fraunces)
- R11 — caveats banner re-style

## Discipline checks (all green)

- Derived-metric verifier (`scripts/visual-audit/verify-main-flows.mjs`): 14/14 PASS
- Static sentinels in `tests/round-trip-test.py` for main-flows: 14/14 PASS
  (Note: round-trip-test.py has a pre-existing Windows cp1252 encoding bug
  in `Path.read_text()` calls — separate ship to fix; not regression here)
- Lint: clean (acorn syntax check pass)
- No commits pushed — work staged on disk per Founder direction

## Decisions deferred to Founder

When the visual replication track resumes:
1. Execute R5-R11 in sequence, or bundle as 2-3 polish ships?
2. Drop the PRIMARY/SECONDARY section labels (now redundant after R1-R4
   rebalance + visual fidelity), or keep as informational?
3. Should the 7 reference frames + scripts under `scripts/visual-audit/`
   be committed when the next ship-close fires, or kept as scratch tools?

## What does NOT need to happen next

- Re-running Phase 1 (reference fully documented; frames preserved)
- Re-running Phase 2 (gap analysis is canonical reference-gap-2026-05-14.md)
- Founder export of frames (Plans B-F succeeded; no escalation needed)
