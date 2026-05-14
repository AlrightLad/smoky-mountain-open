---
doc: Design Tooling Spike — leaderboard-row 3-way comparison
date: 2026-05-14
authored_by: claude-code (team)
trigger: TASK 2 per Founder ordering (post-V7-V12, pre-Wave-1-Ship-1)
scope: 1-2 hour spike; decision-grade evidence, not finished product
---

# Design Tooling Spike — A/B/C leaderboard-row comparison

Spike scope (per Founder spec): build the SAME leaderboard row component
in three approaches; compare against PARBAUGHS aesthetic + design
discipline; recommend a path for Wave 1 ship 1.

## Component spec (identical across all three)

- 5 leaderboard entries (5 of the 20 founding Parbaughs)
- Each row: rank · avatar · name · meta · score · handicap
- Billiard green surface + chalk text + brass accents
- Strava-inspired density (tight vertical rhythm, tabular numerals)

## Environmental honesty — Approach C substitution

v0.dev requires browser session + Vercel account. The team operates from
a headless agent and CANNOT programmatically call v0. Per Founder's
environmental-honesty directive option (b), Approach C uses Claude's own
generative UI capability with explicit Strava-density prompting as a
stand-in for v0. The DOM shape, decorative patterns, and "generative
defaults" mirror what v0 typically produces — full diff between raw
generative output and PARBAUGHS-refined version annotated inline in
the C/leaderboard-row.html top comment block.

This substitution is itself **evidence about tooling accessibility**:
v0 is part of the "polished defaults" toolkit, but it's not reachable
by the orchestration substrate. Any tooling that requires a browser
session per-component breaks the agent-loop economics.

## Screenshot deliverable — environmental honesty

The agent cannot capture browser screenshots from a CLI environment.
The three HTML files are STATIC and self-contained; Founder can open
each at desktop / tablet / mobile widths in a real browser. Each file
includes a 480px media query so the mobile width is exercised
without resize.

## Per-approach evidence

### Approach A — PARBAUGHS native (.pb-* primitives)

| Metric                  | Value                                                          |
|-------------------------|----------------------------------------------------------------|
| File                    | `A-parbaughs-native/leaderboard-row.html`                      |
| Lines of CSS            | ~95                                                            |
| Token cost (author)     | ~6k tokens (file authoring)                                    |
| Iteration count         | 1 (compiled clean first pass)                                  |
| Maintenance burden      | LOW — only `.pb-*` tokens + a few component-local rules        |
| PARBAUGHS identity      | HIGH — built from canonical primitives, looks like the rest    |
| Polish score            | **7/10**                                                       |

**What was easy:** tokens already exist; layout grammar (flex + tabular
nums + Strava density) is well-understood. Hover, leader-row gradient,
mobile breakpoint were 3 lines each.

**What was hard:** no existing avatar primitive in
`design-system-components.css` — had to author one locally. Same for
list-with-dividers pattern. These are "design system depth gaps" per
H2 from db-2026-05-14-001.

**Surprising:** the result looks more like a "good internal tool" than
a Strava leaderboard. Restraint reads as competent-but-AI rather than
purposeful-and-confident. Hypothesis H4 (reference-library gap) shows
here — the rule "Strava-inspired density" is internalized but the
specific tells (left-accent on leader, hover-state translateX,
gradient-text on top scores) come from looking at Strava daily, not
from spec.

---

### Approach B — shadcn/ui adapted to PARBAUGHS tokens

| Metric                  | Value                                                          |
|-------------------------|----------------------------------------------------------------|
| Files                   | `B-shadcn-adapted/leaderboard-row.html` + `LeaderboardRow.tsx` (React reference) |
| Lines of CSS            | ~110 (more verbose due to shadcn's utility-decomposed style)   |
| Token cost (author)     | ~9k tokens (HTML render + TSX reference)                       |
| Iteration count         | 1 — but conceptually 0 fresh authoring; shadcn primitives existed |
| Maintenance burden      | MEDIUM-HIGH — would require React + Tailwind in build pipeline; current PARBAUGHS is vanilla JS + custom CSS |
| PARBAUGHS identity      | MEDIUM — token-tinted but pattern is recognizably-shadcn       |
| Polish score            | **7/10**                                                       |

**What was easy:** shadcn's <Avatar>, <Badge>, <Card> primitives have a
well-known shape; translating them to static HTML/CSS with PARBAUGHS
tokens was mechanical. The TSX file reads cleanly.

**What was hard:** the migration cost is real. Adopting shadcn means
React + Tailwind + a config that maps `--pb-*` tokens into the Tailwind
palette. CLAUDE.md explicitly notes the stack is vanilla JS; the dev
loop assumes plain HTML rendering. Half a Wave 1 ship's tokens before
the first component lands.

**Surprising:** the visual output is BARELY different from Approach A.
The shadcn polish that makes Linear / Vercel feel premium comes from
the IDIOMS shadcn defaults to (cards over rows, badges over bare text,
hairline borders, contained shadows) — but A already uses those idioms
because PARBAUGHS' design-system-components.css was authored
shadcn-aware. The shadcn-specific value-add appears late in component
composition (forms, command palettes, data tables with sorting), NOT
in primitive layouts like a leaderboard row.

---

### Approach C — v0-style generative (Claude stand-in), PARBAUGHS-tokenized

| Metric                  | Value                                                          |
|-------------------------|----------------------------------------------------------------|
| File                    | `C-v0-style-generative/leaderboard-row.html`                   |
| Lines of CSS            | ~180                                                           |
| Token cost (author)     | ~11k tokens (more decorative patterns to author)               |
| Iteration count         | 1 generation + 0 token-refinement (palette mapping was clean)  |
| Maintenance burden      | MEDIUM — decorative patterns (gradient borders, glow, trend deltas) each become design-system-depth obligations |
| PARBAUGHS identity      | MEDIUM-LOW — patterns read more "tailwind landing page" than "country club ledger" |
| Polish score            | **8/10** (more visually striking) ... **6/10** (in PARBAUGHS aesthetic context) |

**What was easy:** the generative pass produced visual hierarchy
choices (gradient-text on top score, ranked pill rather than plain
number, trend-delta indicators) that A and B didn't reach for. These
ARE the "polished defaults" that make Vercel-gallery components feel
premium at-a-glance.

**What was hard:** every decorative pattern (radial gradient on
top1 row, brass-glow shadow on top1 avatar, gradient border on the
card) is a new design-system obligation. If a feature, the
PARBAUGHS design system suddenly has 6 new gradient definitions to
codify. Drift risk multiplies.

**Surprising:** the v0-style output is "shinier" but reads less like
PARBAUGHS' chosen aesthetic (Augusta-leaderboard, country-club ledger,
restraint over flash) and more like a generic premium SaaS dashboard.
The gradient-text + glow patterns work for a Stripe pricing page;
they're a tonal mismatch for "20 friends keeping score." This is
direct evidence on H1 from db-2026-05-14-001 — **tooling without
taste produces "different AI-generated," not "better."** v0's defaults
ARE someone's taste, just not Founder's.

## Comparison matrix

| Dimension                  | A — native      | B — shadcn       | C — v0-generative |
|----------------------------|-----------------|------------------|-------------------|
| Polish score (raw)         | 7/10            | 7/10             | 8/10              |
| Polish score (in-context)  | 7/10            | 6/10             | 6/10              |
| Token cost (this spike)    | ~6k             | ~9k              | ~11k              |
| Iteration count            | 1               | 1                | 1                 |
| Maintenance burden         | LOW             | HIGH (migration) | MEDIUM (drift)    |
| PARBAUGHS identity         | HIGH            | MEDIUM           | MEDIUM-LOW        |
| Time-to-second-component   | FAST            | SLOW (build setup) | FAST (after pattern internalized) |
| Hard-to-undo lock-in       | NONE            | HIGH (framework) | LOW               |
| Founder's eye, hypothetical| "this is us"    | "this is shadcn" | "this is fancy"   |

## Recommendation

**Wave 1 ship 1 should use Approach A — PARBAUGHS native primitives.**

Three reasons:

1. **Polish ceiling isn't the constraint.** A scored 7/10 raw; C scored
   8/10 raw but 6/10 IN PARBAUGHS' aesthetic context. The gap between
   "competent native" and "ideal aesthetic" is not closed by switching
   tools — it's closed by reference library (H4) + iteration
   speed (H3). Both are cheaper than a framework migration.

2. **Migration tax is real and load-bearing.** B would consume
   ~600k-1M tokens just to migrate the dashboard build pipeline before
   the first React component lands. Wave 1 ship 1 is design system
   codification; adding "and also rewrite the build in React" doubles
   the ship's scope.

3. **Generative defaults read foreign.** C's gradients + glow + trend
   deltas are the "Vercel premium" aesthetic. PARBAUGHS' is the
   Augusta-leaderboard / country-club ledger aesthetic. They're
   different design languages. Using v0's defaults imports a tonal
   mismatch we'd then have to back-edit out, which is wasted motion.

**However: the spike surfaced two things worth doing alongside Wave 1
ship 1.**

- **Add the 3 missing primitives to design-system-components.css:**
  `.pb-avatar` (with --leader-ring variant), `.pb-list` + `.pb-list-row`
  (with hover + leader-row gradient variants), `.pb-trend-delta` (up /
  down / flat with proper a11y). Authored fresh ~150 tokens; pays
  dividends every Wave 1 component that comes after.

- **Build a reference-library state file** at
  `.claude/state/design-system/reference-library/` with curated
  patterns annotated by source (e.g., "Strava: hover-state translateX
  on leaderboard rows," "Linear: hairline-border with 4-6% opacity,"
  "Augusta: gold-rule on leader, no badges"). 50 patterns over 6 weeks
  beats one v0 spike.

## Open questions for Founder

1. **Does the leaderboard-row spec want trend-deltas at all?** Approach C
   added rank-change indicators (up 2, down 1) because Strava has them.
   PARBAUGHS doesn't have rank-change data wired today — the
   substrate would need a snapshot-prev-week step. Worth it?

2. **Is "this looks shadcn" actually a bad outcome?** Approach B's
   identity score was MEDIUM because the pattern is recognizable. But
   shadcn-derived UIs are everywhere in 2026; "recognizable" might be
   "fits the era." Open question whether PARBAUGHS' chosen
   distinctiveness should fight that.

3. **Should the spike try other tools the team COULD reach?** Magic-UI
   and aceternity (cited in db-2026-05-14-001 H1) are reachable as
   copy-paste-from-docs, similar to shadcn. They produce more
   motion-heavy aesthetics. Worth a follow-on spike if Founder wants
   evidence on motion-rich variants.

## Evidence summary for db-2026-05-14-001

This spike is direct evidence on the bubble's H1 and H2:

- **H1 (tooling gap):** **partially falsified.** Tools (shadcn, v0)
  produce different aesthetics — not categorically better aesthetics
  for PARBAUGHS' chosen identity. The gap between "competent native"
  and "what Founder admires in Linear/Strava" is not closed by
  switching tools.

- **H2 (design system depth gap):** **confirmed.** Three primitives
  missing (avatar, list-row, trend-delta) were noticed within 10
  minutes of authoring Approach A. The depth gap is real and
  build-as-you-go addresses it economically without framework
  migration.

- **H3 (iteration speed gap):** **untouched by this spike.** Spike
  produced 1 iteration per approach by design. The real H3 evidence
  would be: build the same component, then take 10 iterations vs 50.
  Separate spike when bandwidth allows.

- **H4 (reference library gap):** **strengthened.** All three
  approaches produced "competent" output. The thing missing across
  all three was the SPECIFIC Strava-isms / Augusta-isms / Linear-isms
  that would push polish from 7 to 9. That's a reference-library
  problem, not a tooling problem.

- **H5 (taste gap):** **unresolved.** Spike author (me) chose the
  patterns. Whether Founder reads any of these as "ah yes, polished"
  is the only ground truth. PET will translate this for Founder per
  the bubble's translator role.

This evidence will be appended to db-2026-05-14-001 in a subsequent
message commit (per Founder's "one research file per commit" rule for
that bubble, this spike doc itself counts as one piece of evidence).
