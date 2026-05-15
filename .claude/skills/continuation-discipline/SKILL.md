---
name: continuation-discipline
description: |
  Determine whether the current work resolution is a real stop or a false stop signal.
  Consult before producing a consolidated report that ends a turn, or at any natural
  stopping point. Discriminates 7 real stop conditions from the false signals that
  have historically caused the team to pause mid-roadmap.
trigger: |
  - Before writing "Tree clean. Round-trip green." or similar turn-end phrases
  - Before producing a consolidated report meant to end a turn
  - At ship-complete + post-commit moments
  - When tempted to end with "Founder reviews when ready"
  - When the immediate work resolves and next action is unclear
authoritative_source: AMD-017 (continuation discipline)
governs: agent-3 (Claude Code) turn-end behavior
---

# Continuation Discipline

The team continues immediately after every ship-complete + consolidated
report. Reports are async checkpoints; Founder reads at their pace; team
continues at their pace. **Stop is the exception, not the default.**

## When to consult this skill

- Before producing a consolidated report that ends a turn
- When tempted to write "Founder reviews when ready" or similar
- At natural stopping points (ship complete, phase complete, task complete)
- When the immediate work resolves and the next action is unclear
- When the session has been long and "pacing caution" tempts you

## Real stop conditions (continue → stop is correct)

These are the **only** conditions under which the team pauses:

1. **All assigned work in current directive complete** — verified against
   ROADMAP_v2 + open proposals + open escalations. Queue genuinely empty.
2. **Escalation criterion fires** per AUTONOMOUS_FAILURE_RECOVERY v8.3
   — real architectural decision required, blocked on Founder info, or
   3+ plan attempts failed with documented evidence.
3. **HALT criterion fires** — system fault requiring human attention
   (e.g., working tree corruption, filesystem refusal, broken auth).
4. **Working tree corruption** — git refuses operations, filesystem-
   level issues. The team cannot proceed safely.
5. **Account session limit hit organically** — Claude Code surfaces
   this directly. Not a pre-emptive pause.
6. **AUTONOMOUS_FAILURE_RECOVERY abandon criteria met** after documented
   A → B → C → D plan attempts.
7. **Founder explicitly directs the team to stop** — explicit text,
   not inference.

## False stop signals (continue → DO NOT stop)

These have historically caused the team to pause incorrectly. **None of
them are real stop conditions.**

- "I produced a consolidated report" — reports are async checkpoints,
  not turn ends
- "I reached a logical handoff point" — logical handoff is not a stop
- "I should let Founder review this" — Founder reviews async; team
  continues sync
- "I completed the immediate task" — check what's next; immediate is
  not assigned
- "I've been working a while" — time is not a stop condition
- "Maybe Founder wants to pause" — Founder direct or substrate
  pre-authorization required, not team inference
- "Token cost concern" — quota observability dashboard exists; team
  doesn't pre-emptively pause for cost
- "This is a good place to stop" — no stop is "good"; only the 7 real
  conditions trigger stops

## Continuation determination procedure

When current work resolves, run this checklist in order:

### Step 1 — Real stop condition check

Does any of the 7 real stop conditions apply?

- YES: produce final report + end turn (this is a real stop)
- NO: continue to Step 2

### Step 2 — Work queue check

Read in priority order:

1. Open escalations at `.claude/state/escalations/pending/`
2. Approved proposals ready per readiness scanner output
3. ROADMAP_v2 current wave + ship sequence (`docs/agents/ROADMAP.md`)
4. Phase-level directives from Founder with incomplete criteria
5. Background tracks (e.g., main-flows v2 visual replication if open)

Is there eligible next work?

- YES: continue to Step 3
- NO: produce final report explaining why queue is empty + end turn
  (this IS real stop condition #1)

### Step 3 — Feature-breaking risk check

For the next work item, ask:

- Is this feature-breaking risk if implemented incomplete?
- Does AMD-009 P3 (ship complete or don't ship) apply?
- Is current confidence in the spec/scope HIGH?

If feature-breaking risk + low confidence:

- Author an escalation (per AMD-015 propose-first) describing the
  concern with proposed answer
- Move to next non-feature-breaking item in queue
- DO NOT stop entirely — only halt this specific item

If clear scope + high confidence: proceed to Step 4.

### Step 4 — Ship-plan author + execute

Per AMD-009 + AMD-011:

- Author ship plan with fallback chain (A / B / C / abandon)
- Critic gates readiness per 8 criteria
- Execute primary approach
- Ship complete or defer with documented gap

**After ship-close: GO BACK TO STEP 1.** The loop continues until a
real stop condition fires.

### Step 5 — Closure durability check (R5, 2026-05-15)

Before declaring any ship/closure PASS, run **Q5 — Reproducibility**:

> *What in this work depends on on-disk state that isn't reproducible
> from a fresh checkout?*

Walk through every artifact the closure claims as PASS evidence:

- **Files claimed present**: are they tracked, OR producible from
  tracked sources by a tracked script?
- **Validator runs claimed PASS**: would the same run pass against a
  fresh `git clone` (no on-disk state from prior runs)?
- **Health JSONs / aggregates claimed green**: are they committed, OR
  derivable from tracked inputs by tracked scripts?

If ANY answer is "no":

- The closure is **snapshot-PASS**, not **durable-PASS**.
- Declare it explicitly in the report:
  > "Objective X: PASS at snapshot 2026-05-15T03:00Z. Durability
  > untested — depends on on-disk Y which is not reproducible from
  > a fresh checkout."
- Author a follow-up ship to either (a) commit/template the state,
  (b) make the consuming script self-heal, or (c) add an explicit
  reproducibility test to the validator.

Why this exists: a prior /goal closure (2026-05-15T02:25Z) declared 8/8
PASS based on artifacts that vanished within hours because they depended
on uncommitted on-disk state. The validator's claim-time PASS was true;
the closure's "durable PASS" implication was not. See
audit-report-2026-05-15.md "Root-cause finding" + engineering-mindset.md
"snapshot-PASS vs durable-PASS" addendum.

**Snapshot-PASS is acceptable, but it must be NAMED. Hiding a
snapshot-PASS behind unqualified "PASS" language is an overclaim per
AMD-009 P5 (honest delta).**

## Confidence framework

Per Founder principle: "if anything is feature breaking to hold off
on implementing until full feature is tested and ensured working and
has high confidence from orchestration team."

For each candidate next-work item, evaluate confidence:

| Level | Criteria | Action |
|---|---|---|
| HIGH | Spec clear, scope bounded, fallback chain feasible, tests in place, no architectural ambiguity | Proceed |
| MEDIUM | Spec mostly clear, scope bounded, but novel territory or minor ambiguity | Proceed with extra Critic gates |
| LOW | Spec ambiguous, scope unbounded, architectural decision required, OR feature-breaking risk | Escalate per AMD-015 + continue to next eligible item |

LOW confidence items DO NOT terminate the team's session — they get
queued as escalations (per AMD-015 propose-first), and the team
continues to next eligible work.

## Habit-correction reminder

The team has habitually stopped at false signals. This skill exists to
break that habit. When in doubt about whether to continue: continue.
Stop is the exception, not the default.

The 7 real stop conditions are exhaustive. If a stop reason doesn't fit
one of those 7, it's a false signal.

## Pre-turn-end Critic gate

Before approving a consolidated report as a turn-end:

```
[ ] Q1 — Critic verifies this skill was consulted
[ ] Q2 — Critic verifies at least one real stop condition is documented
         in the report
[ ] Q3 — If no real stop condition: Critic BLOCKS the report end-of-turn
         and instructs team to continue per Step 2 of this skill
[ ] Q4 — Critic gates this BEFORE the report is final
[ ] Q5 — Reproducibility (per Step 5 above): does any PASS claim depend
         on on-disk state not reproducible from a fresh checkout? If
         yes: closure is snapshot-PASS, not durable-PASS — Critic
         requires explicit naming in the report and a follow-up ship
         to make the state durable.
```

Critic is empowered to refuse to let the team stop without justification.
This is structural, not advisory.

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD — P5 (honest language) + P7
  (acknowledge what breaks) underpin this skill
- AMD-011 AUTO_EXECUTE_PROTOCOL — the readiness pipeline that drives
  continuation
- AMD-015 TEAM_PROPOSES_AGENT_2_RATIFIES — escalation discipline that
  pairs with continuation (LOW confidence → escalate, not stop)
- AMD-017 CONTINUATION_DISCIPLINE — codifies the principle this skill
  operationalizes
- AUTONOMOUS_FAILURE_RECOVERY v8.3 — defines the real stop conditions
  this skill enumerates
- PROP-005-continuation-discipline-skill.md — the proposal codifying
  this skill for Founder ratification

## Example walkthroughs

### Walkthrough 1: ship complete, queue has Wave 1 ship next

1. Ship X-Y-Z complete. Consolidated report drafted.
2. Step 1: any of 7 real stop conditions? No.
3. Step 2: queue has W1.S2 ready per ROADMAP_v2. Eligible work present.
4. Step 3: W1.S2 has clear spec + bounded scope + high confidence. Proceed.
5. Step 4: author W1.S2 ship plan, execute.
6. After ship-close: back to Step 1.

Result: no stop. Team continues.

### Walkthrough 2: ship complete, all queue empty

1. Ship X-Y-Z complete. Consolidated report drafted.
2. Step 1: any of 7 real stop conditions? Checking queue first.
3. Step 2: open escalations none. Approved proposals none. ROADMAP_v2
   current wave: all ships shipped. Wave 2: pending Wave 1 transition.
   Background tracks: all done.
4. Queue empty → real stop condition #1.
5. Final report explains: "All assigned work complete. Stop condition
   #1 triggered." End turn.

Result: legitimate stop after queue exhaustion.

### Walkthrough 3: feature-breaking risk on next item

1. Ship X-Y-Z complete. Next item is W1.S5 spectator HUD.
2. Step 1: no real stop condition.
3. Step 2: W1.S5 is in queue.
4. Step 3: W1.S5 spec has architectural ambiguity around live-state
   sync. Feature-breaking risk if shipped wrong.
5. Author escalation ESC-NNN with proposed answer per AMD-015. Move to
   next item (W1.I3 Caddy Notes restructure — independent).
6. Step 4: ship W1.I3.
7. Back to Step 1 after ship-close.

Result: no stop on feature-breaking risk; escalate the item, continue
to next.

### Walkthrough 4: Founder explicitly directs stop

1. Ship X-Y-Z mid-execution.
2. Founder message: "Stop now, I want to review."
3. Step 1: real stop condition #7 (Founder explicit direction) fires
   immediately.
4. Pause execution at safe point. Document state. End turn.

Result: legitimate stop on explicit direction.
