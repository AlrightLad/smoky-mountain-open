# External AI design critique — Gemini 2.5 Flash (free multimodal), 2026-06-13

Founder directive: "use online tools to grade and rate existing pages + see what
they'd alter." Tool: `scripts/_gemini-critique.mjs <png>` (brand-aware prompt —
knows the Fraunces/brass identity is intentional). Run on this session's staging
captures. Drives the 9.5 convergence pass with OUTSIDE expert input.

## Scores
| Page | Gemini /10 | Headline gap |
|---|---|---|
| Home | 6.0 | density/clutter — "Your First Week" + Nemesis + footer compete; streamline hierarchy |
| Rounds | 8.0 | commentary-italic contrast (light brass → darker); handicap "1/3" contrast; header icon spacing |
| Feed | 8.5 | feed-list type hierarchy (username vs course weight); comment-box padding/line-height; mono action-label weight/darkness |
| Shop | 8.7 | "NEW" tag placement/restyle (muted-brass pill, inside card); avatar ring; (nav already brass) |

## Cross-page recurring themes (act on these in the convergence pass)
1. **Mono/label contrast + weight** (feed + rounds): action labels (KUDOS/SCORECARD/
   nav) + italic commentary read too light → darken ~20% + bump weight to 600.
   NOTE per [[feedback_contrast_verify_each_change]]: verify each against its ACTUAL
   bg before ship (the prior contrast marathon already darkened many; confirm which
   remain light).
2. **Whitespace + hierarchy on dense screens** (home 6.0): the home stacks too many
   competing blocks. Consolidate "Your First Week" + consider relocating secondary
   blocks. (Founder-taste call — home density is partly intentional FTUE.)
3. **Card "NEW"/state tags** (shop): smaller muted-brass pill, consistent top-right
   inside-card placement.
4. Bottom nav: critique flagged it but it's ALREADY brass-active (`.a{--gold}`) —
   the critique misread gold as green; only the inactive-label contrast is a minor
   open nit.

## How to use
Per page: `node scripts/verify-as-member.mjs <uid> <route> <label>` → capture →
`node scripts/_gemini-critique.mjs .claude/state/verify-<label>/*.png` → implement
the concrete changes → re-capture → re-critique (loop until ≥9 from Gemini, then
Founder signs off ≥9.5 per AMD-028). This is the convergence-pass engine.
