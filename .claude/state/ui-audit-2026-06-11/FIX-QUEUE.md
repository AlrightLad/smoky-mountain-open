# UI critique fix queue (from per-page agent critique, 2026-06-11)

Peer bar Linear/Vercel/Stripe/Notion, P7 target 9.5. Identity to protect:
cream/paper, felt-green, brass, Fraunces serif + mono eyebrows + sans body.
Batch-1 pages scored 6.0–8.5; identity strong, desktop weak.

## CROSS-CUTTING (fix once → helps everywhere), in ship order

1. **Right-rail clipping/overflow at 1440** (standings, members, home) — CRITICAL
   P9 bug: rail stat values + brass rules cut off at viewport right edge.
   Fix: desktop grid right-rail max-width + overflow at 1440. SHIP FIRST.
2. **Desktop = stretched phone** (all desktop pages) — HIGHEST LEVERAGE.
   ~860px column in 40–65% empty cream. No desktop layout language.
   Fix: per-archetype model — rail pages fill toward rail; form/list pages
   either constrain to a deliberate centered card or go 2-column.
3. **Dead-dash / zero empty states read as broken** (home HCP —, rounds
   handicap —, records 0s, members —, activity 0). P9/P10.
   Fix: apply the roundhistory "Heat map unlocks (0 of 3)" + records "Tap to
   start one" pattern everywhere — mute styling + path-forward microcopy.
4. **Brass overuse dilutes meaning** (records, leagues, courses, findplayers,
   home). Codify: brass = interactive/primary/elevated only; demote
   decorative brass to ink/mute.
5. **Single-row tables with full chrome** (standings, members) — <3 rows →
   "you're first in / invite the crew" hero instead of a table.
6. **Oversized empty/low-content cards** (rounds handicap panel, activity
   range-empty, playnow void) — min-height to content, not fixed-large.
7. **Cards left-clustered, dead right half** (courses, findplayers, members,
   rounds desktop) — pull a secondary value right, or constrain width.

## Per-page highlights (full critique in task transcript a28ea7b7)
- home 7.5 · playnow 8 · rounds 6.5 · roundhistory 7.5 · courses 8 ·
  records 6.5 · standings 7 · feed 8.5 (best) · activity 6 · members 7 ·
  findplayers 8 · leagues 6.5
- leagues desktop: "Smoke Test League" title wraps to 3 lines — card too
  narrow at desktop. Bug.
- findplayers: gold avatar ring on EVERY player dilutes Founding-Four
  signal; cards have no action affordance (dead end, P10).
- rounds: duplicate caddy line verbatim on both cards.

Batch-2 critique (chat..caddynotes, 21 pages) + golf-icon refresh +
store severe-upgrade pending.
