---
name: parbaughs-goal-completion-verify
description: Fires when Engineer declares a feature, ship phase, or acceptance criterion complete. Forces explicit acceptance-criteria walkthrough with evidence per criterion before completion declaration is accepted. Prevents premature "done" declarations and ensures Critic verification has concrete artifacts to stamp.
trigger: Activates on completion-declaration phrases ("feature is complete", "ship ready for review", "acceptance criteria met", "ready to push", "implementation done", "all tests pass", "ready for Critic") or when Engineer transitions ship phase forward (implementation → review, review → push, push → close).
owner: Engineer (primary), Critic (verifying consumer)
tier: T1 (active at Phase 1 commit; never graduates — skill is permanent quality gate)
created: 2026-05-12
last_amended: 2026-05-12
trigger_count: 0
useful_count: 0
spurious_count: 0
---

# Goal Completion Verification Skill

When Engineer declares any goal (feature, ship phase, acceptance criterion) complete, this skill forces a structured walkthrough proving completion. No more "I think it works" — only "here is the evidence for each criterion."

## Why this exists

Per Anthropic's published research on long-running agents: the most common failure mode is "Claude tends to mark a feature as complete without proper testing." Even with explicit prompting to test, agents drift into declaring completion based on partial evidence — unit tests pass, code looks right, no obvious error.

The fix is structural: before completion is accepted, Engineer must walk every acceptance criterion and cite specific evidence for each. Premature declarations get caught at this gate, not at Critic review or worse, in production.

This pairs with the `/loop` pattern at workflow level. Loop = iterate until criteria met. This skill = verify criteria actually met before declaring done.

## Activation triggers

The skill fires when Engineer (or any agent acting in Engineer role) uses completion-declaration language:

**Direct triggers:**
- "feature is complete"
- "ship ready for review"
- "acceptance criteria met"
- "ready to push"
- "implementation done"
- "all tests pass"
- "ready for Critic"
- "ready for retrospective"
- "ready to close"

**Phase-transition triggers:**
- Ship phase advancement: implementation → review
- Ship phase advancement: review → push
- Ship phase advancement: push → close
- Wave gate criteria proposed met

**Indirect triggers (skill may proactively fire):**
- Engineer requests Critic review without recent verification output
- Engineer prepares to invoke push protection hook
- Engineer drafts post-push retrospective Component 1 without acceptance-criteria walkthrough

## What the skill enforces

When triggered, the skill demands the following output before completion declaration is accepted:

### Required structure

```markdown
## Goal Completion Verification — <ship-id or feature-id>

### Acceptance criteria walkthrough

| # | Criterion | Evidence | Status |
|---|---|---|---|
| 1 | <Criterion text from Ship Plan> | <Specific evidence: smoke test name, Playwright screenshot path, log output, manual test description> | ✓ Verified / ✗ Not verified |
| 2 | ... | ... | ... |

### Edge cases tested

- <Edge case 1>: <evidence>
- <Edge case 2>: <evidence>
- <Edge case 3>: <evidence>

### Cross-surface verification

- <Surface 1>: <evidence ship doesn't break surface>
- <Surface 2>: <evidence>

### Performance / cost / security checks (per ship scope)

- Performance budget: <met/violated; metric>
- Cost projection: <within threshold; calculation>
- Security check: <auth/authorization verified; how>
- Data integrity: <invariants verified; how>

### Open items (if any)

- <Any criterion or edge case NOT yet verified>: <why; plan to verify>

### Declaration

I, Engineer, declare <feature/ship/phase> complete based on the evidence above. If any criterion is marked ✗ or Open items list is non-empty, this declaration is invalid and work continues per /loop pattern until criteria are met.
```

### Quality bar

The skill rejects vague evidence. Specific examples of what counts:

**Insufficient evidence (rejected):**
- "Smoke tests pass" (which smoke tests? which scenarios?)
- "Tested manually" (what did you test? what was the outcome?)
- "Looks right" (subjective; not verifiable)
- "Should work" (not the same as "does work")
- "Implementation matches spec" (which spec section? what specifically was matched?)

**Sufficient evidence (accepted):**
- "Smoke test `cross-browser-friend-request-flow` passes on chromium, firefox, webkit, msedge"
- "Playwright screenshot at `tests/visual-verify/W1.S3/friend-request-state.png` matches baseline at 99.8% similarity"
- "Manual test: signed in as smoke@parbaughs.test, sent friend request to smoke-sibling@parbaughs.test, verified notification arrived, accepted, verified bidirectional relationship in Firestore via Admin SDK"
- "Cost projection: 5 Firestore reads per request × 1 request per friend-add × estimated 50 friend-adds/month = 250 reads/month, well within free tier"

## Walkthrough discipline

Engineer walks criteria **one-by-one**, not in summary. The skill output is a structured table with one row per criterion. Skipping criteria or grouping them is rejected.

If a ship has 12 acceptance criteria, the walkthrough has 12 rows. If a criterion has sub-conditions, the row addresses each sub-condition explicitly.

## Critic verification

Critic uses this skill's output as the primary artifact for ship-level review per CRITIC.md. Without this output, Critic rejects the ship and Engineer regenerates.

Critic specifically verifies:
1. **Every criterion has a row** — no omissions
2. **Every row's evidence is specific** — no vague language
3. **Every ✓ matches an actual artifact** (smoke test exists, screenshot exists, log captured)
4. **Open items list is genuinely empty** before declaring complete
5. **Edge cases reasonable for ship scope** — Critic flags if edge case coverage is thin

## /loop integration

Engineer uses `/loop` pattern during implementation:
1. Goal stated explicitly at loop start
2. Attempt implementation
3. Self-verify (this skill output)
4. If any ✗ or Open item: revise approach, re-attempt (loop)
5. When all ✓ and Open empty: declare complete, hand to Critic

The skill is the loop's terminator. Without clean skill output, loop continues.

## What this skill does NOT do

- Does NOT replace Critic review (Critic still verifies)
- Does NOT replace smoke automation (smoke still required as evidence)
- Does NOT replace Playwright visual verification (screenshots still required)
- Does NOT eliminate need for `/loop` workflow discipline (the skill enforces; `/loop` paces)
- Does NOT permit Engineer to declare ship complete without all evidence

## Integration with retrospective output

Post-push retrospective Component 1 ("What was changed") consumes this skill's output as a required artifact reference. Retrospectives without this skill's output for the ship cannot generate.

## Disputes

If Engineer disagrees with Critic's verification rejection, dispute resolution per AGENT_NETWORK.md:
1. Engineer states position with evidence
2. Critic states position with criterion gap identified
3. If unresolved, decision bubble fires (Engineer + Critic vote; Performance/Security/Data Integrity contribute if relevant)
4. Bubble resolves; either Engineer adds evidence or criterion is amended (with Founder ratification if amendment material)

## Activation

This skill activates at Phase 1 commit and fires on every Engineer completion declaration thereafter. No graduation — permanent quality gate.

First trigger: first completion declaration during Wave Zero Dry-Run (which itself must satisfy this skill before passing).
