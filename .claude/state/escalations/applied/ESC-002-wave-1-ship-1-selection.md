---
id: ESC-002
title: Wave 1 ship 1 selection — design tooling approach (native vs framework vs generative)
type: vision-decision
origin_commit: design-spike-2026-05-13
origin_ship: design-spike
question: |
  Wave 1 ship 1 is the design system codification ship (W1.S1). Three approaches were piloted in the Design Tooling Spike — which one is Wave 1 ship 1 authored against?
    (a) Approach A — PARBAUGHS native primitives (.pb-* CSS classes, hand-authored)
    (b) Approach B — shadcn/ui adapted to PARBAUGHS tokens (React + framework migration)
    (c) Approach C — v0-style generative (Claude stand-in, PARBAUGHS-tokenized)
context_summary: |
  Design Tooling Spike (commits in .claude/state/design-spike/) evaluated three approaches with identical component spec across all three. Comparison matrix produced. Founder authorization needed before Wave 1 fires so the codification target is locked.
proposed_answer: Approach A — PARBAUGHS native primitives
rationale: |
  1. Polish ceiling isn't the constraint. A scored 7/10 raw; C scored 8/10 raw but 6/10 IN PARBAUGHS' aesthetic context. The gap between 'competent native' and 'ideal aesthetic' is not closed by switching tools — it's closed by reference library + iteration speed.
  2. Migration tax is real and load-bearing. Approach B would consume ~600k-1M tokens just to migrate the dashboard build pipeline before the first React component lands. Wave 1 ship 1 is design system codification; adding 'and also rewrite the build in React' doubles the ship's scope.
  3. Generative defaults read foreign. C's gradients + glow + trend deltas are the 'Vercel premium' aesthetic. PARBAUGHS' is the Augusta-leaderboard / country-club ledger aesthetic. They're different design languages. Using v0's defaults imports a tonal mismatch that would have to be back-edited out, which is wasted motion.
options:
  - id: a
    label: Approach A — PARBAUGHS native primitives [team recommendation]
    rationale: Native; no migration tax; matches PARBAUGHS aesthetic context directly
  - id: b
    label: Approach B — shadcn/ui adapted to PARBAUGHS tokens
    rationale: Higher polish ceiling at cost of ~600k-1M token migration; framework lock-in; cross-purpose with PARBAUGHS' Augusta-leaderboard aesthetic
  - id: c
    label: Approach C — v0-style generative (Claude stand-in)
    rationale: High raw polish; generative defaults read foreign; back-edit cost high
default_if_no_response: Approach A
default_window_hours: 48
authored_by: claude-code
authored_at: 2026-05-13T22:48:00Z
estimated_decision_complexity: deep
blocks_ship: true
source_artifact_paths:
  - .claude/state/design-spike/comparison.md
  - .claude/state/wave-1-kickoff/transition-summary.md
founder_decision: applied-via-direction
founder_decision_options:
  - a
founder_note: |
  Wave 1 was authorized by Founder on 2026-05-14 (substrate phase complete; Wave 1 fired). Implementation chose Approach A — native primitives. Evidence:

  - W1.S1.a shipped commit 2953d54 ('W1.S1 ship close (iteration 1): 3 spike-surfaced primitives + showcase + round-trip discipline'). Three native .pb-* CSS primitives shipped: .pb-avatar, .pb-list/-row, .pb-trend-delta.
  - W1.S1.b in flight (commits cdad7a2 + f729f97 + 710b01b) continues native-primitives approach with 5 W2.S0 reveal palette tokens declared and ship vision authored.
  - No React / shadcn substrate ever introduced.
  - No v0 generative tooling deployed.

  Approach A confirmed by execution. Approaches B + C not pursued.
applied_at: 2026-05-14T16:42:00Z
applied_commit: 2953d54
---

# ESC-002 — Wave 1 ship 1 selection

## Status: APPLIED 2026-05-14

This escalation was migrated from the manual review-queue.json stub
(per Founder directive 2026-05-14 'escalations lifecycle') to the
canonical `.claude/state/escalations/applied/` directory. Approach A
(PARBAUGHS native primitives) was implicitly confirmed by Founder
authorization of Wave 1 + the execution of W1.S1.a using native
primitives.

## Implementation evidence

- W1.S1.a shipped commit `2953d54`: 3 native primitives + showcase
  + round-trip discipline.
- W1.S1.b in flight (commits `cdad7a2`, `f729f97`, `710b01b`):
  continues native-primitives approach; 5 W2.S0 palette tokens
  declared; ship vision authored.
- No React / shadcn dependencies introduced.
- No v0 generative tooling deployed.

## Cross-references

- Source comparison: `.claude/state/design-spike/comparison.md`
- Transition summary: `.claude/state/wave-1-kickoff/transition-summary.md`
- Ship vision: `docs/agents/ships/W1.S1.md` (parent) + `docs/agents/ships/W1.S1.b.md` (post-split)
- AMD-009 senior engineering standard
- AMD-013 ROADMAP v2 (W1.S1.a/W1.S1.b split provenance)
