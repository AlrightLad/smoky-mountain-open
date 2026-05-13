# Protocol P10 — Loop-and-Verify Discipline

> **This file represents the P10 addition to PROTOCOLS.md.** Apply by appending the content below to the existing PROTOCOLS.md after the P9 section. The full PROTOCOLS.md remains otherwise unchanged.

---

## P10 — Loop-and-Verify Discipline

The combination of `/loop` workflow pattern + `parbaughs-goal-completion-verify` skill ensures Engineer completes work to acceptance criteria before declaring done.

### Why this protocol exists

Per Anthropic's published research on long-running agents: the most common agent failure mode is declaring features complete based on partial evidence. The fix requires two layers:

1. **Workflow-level discipline**: `/loop` pattern paces Engineer through iteration until acceptance criteria are demonstrably met
2. **Declaration-level enforcement**: `parbaughs-goal-completion-verify` skill forces explicit evidence for every criterion before completion is accepted

This protocol governs how both layers work together.

### When P10 applies

Every ship under orchestration team execution. Specifically:

- Engineer enters implementation phase → `/loop` pattern begins
- Engineer attempts feature → tests against acceptance criteria → either advances or loops
- Engineer reaches declaration moment → `parbaughs-goal-completion-verify` skill fires
- Skill output verified by Critic → ship advances OR continues per loop

### The /loop pattern (workflow level)

Engineer uses `/loop` discipline during implementation phases:

```
LOOP START
  Goal: <explicit goal statement, references Ship Plan acceptance criteria>
  
  Iteration N:
    1. Attempt implementation step
    2. Self-verify against immediate acceptance criterion
    3. If criterion met: advance to next step
    4. If criterion not met: identify what's missing; loop back to step 1 with revised approach
    5. If criterion appears unverifiable: flag as genuine blocker; pause loop; escalate per HALT_CRITERIA self-check
  
  Iteration N+1 (only when iteration N criterion is met):
    1. Goal for this iteration: next acceptance criterion
    2. Repeat 1-5 above
  
LOOP END (only when all acceptance criteria met)
  Invoke parbaughs-goal-completion-verify skill
  Declaration moment reached
```

The loop terminates when **every** acceptance criterion has been individually verified. Not "most criteria met"; not "criteria appear met"; not "should be done." Every criterion, individually, with evidence.

### The parbaughs-goal-completion-verify skill (declaration level)

When loop terminates and Engineer prepares to declare completion, the skill activates and forces structured output per its full specification at `.claude/skills/parbaughs-goal-completion-verify.md`.

Required output (per skill spec):
- Acceptance criteria walkthrough table (one row per criterion with specific evidence)
- Edge cases tested with evidence
- Cross-surface verification
- Performance / cost / security / data-integrity checks per ship scope
- Open items (must be empty for valid declaration)
- Engineer declaration statement

### Critic verification

Critic uses the skill output as primary review artifact:
1. Every criterion has a row (no omissions tolerated)
2. Every row has specific evidence (no vague language tolerated)
3. Every ✓ matches an actual artifact (smoke test, screenshot, log, manual test record)
4. Open items list is genuinely empty
5. Edge case coverage reasonable for ship scope

If verification fails, Critic rejects → Engineer re-enters loop with deficiency identified → /loop continues until clean skill output.

### Interaction with other protocols

- **P1 (Audit-first)**: pre-implementation audit captures Ship Plan acceptance criteria; those criteria become loop terminator conditions
- **P5 (Severity tiers)**: P0/P1 issues block loop completion; P2/P3 can be deferred to backlog with evidence
- **P9 (Push protection)**: push hook reads `.claude/state/last-verify.json`; loop cannot terminate cleanly until state file shows all-green
- **HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE**: loop pauses for halt criteria; pre-halt self-check applies
- **POST_PUSH_RETROSPECTIVE**: retrospective Component 1 consumes skill output; cannot generate without it
- **DECISION_BUBBLE_AGENTS**: if Engineer-Critic disagree on whether criterion is met, decision bubble fires per AGENT_NETWORK.md dispute protocol

### Activation

P10 activates at Phase 1 commit. First application during Wave Zero Dry-Run — the dry-run itself exercises P10 end-to-end on the trivial Caddy Notes update before any real ship depends on the protocol.

### Audit cadence

- **Per ship**: P10 applied; skill output committed; Critic verifies
- **Per retrospective**: skill performance reviewed (false positives? missed declarations? evidence quality holding?)
- **Per wave-close**: protocol effectiveness reviewed; refinements proposed if patterns suggest

### What this protocol does NOT do

- Does NOT eliminate need for smoke automation, Playwright visual verification, or Critic review
- Does NOT replace human Founder judgment at retrospective
- Does NOT allow Engineer to bypass criteria via "looks good enough"
- Does NOT permit completion declaration outside the skill-enforced structure

### Hard rule

**No completion declaration is valid without parbaughs-goal-completion-verify skill output.** Ships, features, phases, criteria — anything Engineer would mark complete must pass the skill gate first. This is permanent governance; no graduation, no exceptions.
