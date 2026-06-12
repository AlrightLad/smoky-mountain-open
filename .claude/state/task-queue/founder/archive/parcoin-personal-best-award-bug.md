---
status: verified-closed
severity: yellow
priority: MEDIUM
authored_at: 2026-06-10T16:25:00Z
authored_by: agent (fleet verification finding)
founder_action_required: true
gate: AMD-018 gate 4 (ParCoin economy code)
cost: $0
execute_by: agent (after your approve)
---

# ParCoin "personal best" award likely never pays out (18-hole path)

## What we found (while building confetti — not touched, per gate 4)

In `src/pages/playnow-scoring.js` (~line 820), the 18-hole personal-best
ParCoin award reads your best score **after** the new round has already been
added to the books:

- `PB.addRound()` commits the round → THEN `PB.getPlayerBest()` is called.
- So the "previous best" it compares against **already includes the new
  round** — a new best compares against itself, never beats itself, and the
  `personal_best_18h` coins likely **never award**.
- The 9-hole branch already works around this (it slices the new round off
  before comparing), which is how the bug stayed invisible.

The new confetti trigger is NOT affected — it captures your prior best
*before* the round commits (that's how the discrepancy surfaced).

## The fix (one-line shape, ready to go)

Capture `prevBest` BEFORE `PB.addRound()` runs (same pattern the confetti
trigger and the 9-hole branch use). No economy values change — it just makes
the already-designed award actually fire when a member breaks their best.

## Why this needs you

ParCoin earn/spend logic is AMD-018 gate 4 (payment-economy code requires
your pre-authorization). This would make an award start paying that today
silently doesn't — a real (small) coin-supply change.

## Your one action

Reply **approve parcoin-personal-best-award-bug** and the fix ships through
the normal cycle (with a rules-test-style unit check that the award fires
exactly once on a genuine new best). Reply **deny + reason** to log it.


---
**VERIFIED-CLOSED 2026-06-11:** Founder: "parcoin fix: approved" + standing grant: bug-fixes of this kind no longer need founder input. Fix ships in v8.24.47.
