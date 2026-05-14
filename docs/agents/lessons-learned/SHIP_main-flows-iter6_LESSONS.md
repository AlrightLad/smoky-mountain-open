# SHIP main-flows-iter6 — Lessons (5x failure pattern)

**Authored:** 2026-05-14, after Founder eyes-test caught two specific failures
on iter 5 of main-flows.html ("theme divorced", "redundant bottom catalog").
Captures honest delta on why this surface shipped not-matching-reference
five times in a row.

## Observation

`docs/reports/main-flows.html` shipped 5 times with structural sentinels
passing while Founder eyes-test failed:

| Iter | Date | Theme | Composition | Founder verdict |
|---|---|---|---|---|
| 1 (R1) | 2026-05-14 | Black canvas + white borders (R1) | Arch + catalog | "wrong theme — needs yellow accents" |
| 2 (R2/R3) | 2026-05-14 | + yellow accent flip | Arch + catalog | "rail too short — needs all 62 flows" |
| 3 (Ship 3) | 2026-05-14 | Black + yellow + densified rail | Arch + catalog with 62 in rail | "page composition broken — proportions" |
| 4 (Ship 4) | 2026-05-14 | + content-count sentinels added | Arch (~30%) + catalog (~70%, densified) | "theme is wrong — catalog reverted to PARBAUGHS green mid-scroll" |
| 5 (R5) | 2026-05-14 | + --pb-* remaps so catalog inherits black/yellow | Arch + catalog (now fully Janowiak-themed) | "page is theme-divorced from rest of dashboard + redundant catalog" |
| **6 (iter6)** | 2026-05-14 | **Reverted to dashboard theme** (billiard-green + brass) | **Catalog DELETED** — arch + integrated right rail only | (pending Founder eyes-test) |

Each iteration had real engineering work. None had verification against
the actual test.

## Root cause

**Verification scope was wrong from iter 1.**

Iterations 1-5 verified:
- Structural sentinels (arch grid renders, 62 flows in rail, SVG arrows work)
- Cross-browser smoke (chromium + firefox render the page)
- Round-trip data integrity (data block valid, refs resolve)
- Token theme guard (no raw hex outside documented allowances)

None of those answered the actual operational questions:

1. **Does the page match the Janowiak reference visually?**
   The reference exists. The team can't access it directly (X.com paywall).
   Iterations worked from prose descriptions of the reference rather than
   the reference itself, which drifted further from the actual aesthetic
   each cycle.

2. **Does the page match the rest of the dashboard's theme?**
   No sentinel ever compared main-flows.html and dashboard.html
   side-by-side. The theme guard caught raw hex but did not catch
   page-local token overrides that broke theme convergence intentionally.
   The R1+R2+R3+R5 overrides shipped through every sentinel.

3. **Is the composition what Founder asked for?**
   No sentinel compared the page's section count / structure against
   Founder's most recent direction. The bottom catalog became redundant
   the moment the right rail expanded to 62 flows in Ship 3, but the
   sentinel said "62 rail entries" (which the bottom catalog had) and
   never asked whether having two 62-flow surfaces was Founder's intent.

**The team was operating against derived requirements ("rebalance to
30/70", "add search + filter chips") rather than against the actual
operational question ("does this match what Founder asked for?").**

Per AMD-016 (operational question test): every ship must answer the
operational question it was built to answer. Iters 1-5 answered
implementation-complete questions, not value-complete questions.

## Concrete changes

### Change 1 — New Critic gate at main-flows.html ship-close

Before declaring main-flows.html ship-close complete, Critic must:

**Step 1 (Theme convergence visual gate):**
1. Render `main-flows.html` in browser tab A
2. Render `dashboard.html` in browser tab B (same session, same viewport)
3. Switch between the two tabs
4. Verify: do they feel like the same product? Same theme? Same visual
   language? Same surface color, same accent color, same text color?
5. If NO: ship blocks. Theme drift caught BEFORE Founder review.

**Step 2 (Composition-vs-direction gate):**
1. Read Founder's most recent direction on main-flows.html composition
   (in conversation transcript or in ship spec)
2. Enumerate the sections currently present in the page (top-level
   `<section>` + `<h2>` headings)
3. Enumerate the sections Founder asked for / asked to remove
4. Verify each-for-each match: present matches asked-for, absent matches
   asked-to-remove
5. If composition drift: ship blocks.

**Step 3 (Side-by-side screenshot evidence):**
1. Run `node scripts/visual-audit/capture-dashboards.mjs <ship-dated-dir>`
2. Inspect `main-flows-desktop-wide.png` AND `dashboard-desktop-wide.png`
3. Embed both into ship report or commit description (or reference the
   exact files in the visual-audit output dir)
4. Founder reviews the side-by-side BEFORE ship is declared complete

These gates apply specifically to main-flows.html. Generalization to
other dashboard pages (when they're subject to the same recurring-iter
risk) is a future follow-on.

### Change 2 — Round-trip negative-presence assertions

Round-trip `[protected-layouts]` extended with iter 6 negative
assertions (`mf_iter6_negatives` list in `tests/round-trip-test.py`):
- No `id="flow-rail-section"` (bottom catalog deleted)
- No `id="rail-search"` / `class="rail-chip"` / `id="rail-groups"` / `id="rail-total-count"`
- No `function renderRail(` (catalog JS deleted)
- No `--bg-page: #000000` (page-local theme override deleted)
- No `--accent-brass: #F5C518` (page-local theme override deleted)
- No `--pb-billiard-green-900: var(--bg-page)` (page-local --pb-* remap deleted)

These prevent re-introduction of either failure mode in iter 7+ by
purely textual presence checks.

### Change 3 — Operational-question recognition in Critic protocol

The general lesson, beyond main-flows specifically: structural sentinels
prove implementation-complete, not value-complete. When a surface ships
repeatedly without matching what Founder asked for, the gap is NOT in
"more sentinels" — it's in **what question the existing sentinels are
answering**.

Critic must explicitly ask: "What operational question does this
sentinel set answer?" If the answer is "the page renders" but the
operational question is "the page matches the reference", the gap is
named, not papered over with more renders-correctly checks.

This is AMD-016 applied at sentinel design time, not just at
ship-complete time.

## Cross-references

- CLAUDE.md "Three-Agent Workflow" (Agent 3 doesn't author specs, but
  IS responsible for honest delta when verification scope drifts)
- AMD-009 P5 (honest language — surface "—" when unknown, name the
  gap honestly when it exists)
- AMD-009 P7 (honest delta — surface scope changes + half-shipping
  patterns explicitly)
- AMD-016 (operational question test — value-complete > implementation-
  complete)
- `tests/round-trip-test.py` `mf_iter6_negatives` list
- `scripts/visual-audit/main-flows-iter6-2026-05-14/` — this ship's
  side-by-side capture evidence
