---
name: parbaughs-rate-limit-aware-pause
description: Monitors rate limit metadata on every API call and tool invocation. Activates pause discipline at 90% usage threshold per RATE_LIMIT_DISCIPLINE.md. Writes state checkpoint + session journal entry before stopping. Prevents hard-rejection mid-task.
trigger: Fires on every API call, tool invocation, and at pre-operation self-check moments. Monitors `anthropic-ratelimit-requests-remaining`, `anthropic-ratelimit-tokens-remaining`, and reset timestamps. Activates pause when usage breaches 90% threshold.
owner: All agents (universal operational discipline)
tier: T1 (active at Phase 1 commit; never graduates — permanent operational floor)
created: 2026-05-12
last_amended: 2026-05-12
trigger_count: 0
useful_count: 0
spurious_count: 0
---

# Rate Limit Aware Pause Skill

Operational skill enforcing RATE_LIMIT_DISCIPLINE.md at the runtime layer. Fires continuously during agent operation, monitors rate limit metadata, triggers graceful pause when 90% threshold breached.

## Why this exists

Per Founder direction: agents should stop at 90% usage to prevent hard rejection mid-task. Per Anthropic's published guidance: graceful pause produces better outcomes than push-through-and-fail.

This skill is the operational enforcement layer. Without it, agents could push through limit-approach via judgment errors. With it, the threshold is mechanically enforced — no override path, no judgment call required.

## Activation triggers

The skill fires on:

**Pre-operation triggers:**
- Before initiating any multi-step operation (file write series, commit batch, tool call chain)
- Before starting any new phase of a ship
- Before generating a major output (skill output, retrospective, decision bubble file)

**Continuous triggers:**
- On every API response received (reads metadata)
- On every tool invocation (reads usage state)

**Resume triggers:**
- At session start (reads state checkpoint to determine if resuming from pause)
- At rate limit reset notification (if available via API metadata)

## What the skill enforces

### Pre-operation self-check

Before starting any operation, skill runs the 5-question check from RATE_LIMIT_DISCIPLINE.md pre-operation self-check:

1. What is current rate limit usage (token + request)?
2. What is projected usage after this operation (worst case)?
3. Will projection exceed 90% threshold?
4. If yes: pause now rather than start operation that would breach mid-execution
5. If no: proceed

Output: clear go/pause decision with rationale logged.

### Continuous monitoring

On every API response received, skill reads:
- `anthropic-ratelimit-requests-remaining` / `anthropic-ratelimit-requests-limit`
- `anthropic-ratelimit-tokens-remaining` / `anthropic-ratelimit-tokens-limit`
- `anthropic-ratelimit-requests-reset` / `anthropic-ratelimit-tokens-reset`

Computes current usage percentage for both metrics. Triggers pause if either reaches 90%.

### Pause protocol

When pause triggered:

```markdown
## Pause Protocol Execution

**Triggered at:** <timestamp>
**Trigger reason:** <token threshold reached / request threshold reached>
**Current usage:**
- Tokens: X / Y (Z%)
- Requests: X / Y (Z%)

**In-flight operation:** <description>
**Status:** Completing in-flight operation before pause...

[operation completes]

**State checkpoint written:** `.claude/state/last-verify.json`
**Session journal updated:** entry added

**Estimated resume time:** <reset timestamp>
**Pause active.**
```

State checkpoint shape:

```json
{
  "smoke": {...},
  "lint": {...},
  "visual": {...},
  "performance": {...},
  "security": {...},
  "integrity": {...},
  "rate_limit_pause": {
    "active": true,
    "paused_at": "<ISO timestamp>",
    "trigger": "tokens" | "requests" | "both",
    "current_usage": {
      "tokens_pct": Z,
      "requests_pct": Z
    },
    "last_completed_operation": "<description>",
    "would_have_been_next": "<description of next operation>",
    "current_ship_id": "<ship-id>",
    "current_phase": "<phase>",
    "estimated_resume_at": "<ISO timestamp>"
  }
}
```

### Resume protocol

When pause exits (either via new session start or auto-detected reset):

```markdown
## Resume Protocol Execution

**Resume triggered at:** <timestamp>
**Previous pause duration:** <duration>

**Reading state checkpoint:** `.claude/state/last-verify.json`
**Reading session journal:** last 5 entries

**Verifying no concurrent activity affected work:**
- git status: <result>
- smoke status: <result>
- conflict detection: <result>

**Resuming from:** <"would_have_been_next" operation>

**Session journal entry added.**
**Rate limit pause cleared in state file.**
```

If verification detects unexpected state, skill does NOT auto-resume — opens decision bubble or escalates per HALT_CRITERIA self-check.

## Hard rules

- **Cannot be overridden** — there is no "force continue" path. 90% threshold is mechanical.
- **Atomic operations complete** — pause never abandons mid-operation
- **State checkpoint mandatory** — silent pause is not acceptable
- **Session journal entry mandatory** — pause + resume both logged
- **Cost halt takes precedence** — operations breaching cost halt thresholds still halt per HALT_CRITERIA item 5 regardless of rate limit state

## Interaction with /loop pattern

When `/loop` pattern is active and rate limit pause triggers:
- Current loop iteration completes its atomic operation
- Loop state saved to state checkpoint
- Loop resumes from same iteration at resume time
- P10 loop-and-verify discipline holds across pause

## Interaction with decision bubbles

When decision bubble is active and rate limit pause triggers:
- Current bubble state saved to bubble file (Open status preserved)
- Voting and contributing agents complete their current writes
- Bubble resumes when rate limit resets — agents continue contributing from where they paused
- Plain English Translator fires only after bubble closes naturally, not mid-pause

## Interaction with post-push retrospective

When post-push retrospective is being generated and rate limit pause triggers:
- In-flight Component (e.g., Component 3 plain-English bubble transcripts) completes its current paragraph
- Retrospective generation pauses; partial output preserved
- Resume picks up at next Component

## Critic verification

Critic verifies during retrospective:
1. Any pauses during the period had correct trigger (at 90% not at 100% or 50%)
2. Atomic operations completed cleanly before pause
3. State checkpoints during pauses captured complete context
4. Resume worked cleanly without state conflicts
5. Session journal entries are present and accurate

## What this skill does NOT do

- Does NOT throttle proactively — pauses at threshold, doesn't slow down work below threshold
- Does NOT split operations into smaller chunks to avoid threshold — atomic operations are atomic
- Does NOT predict reset times beyond what API metadata provides
- Does NOT replace human Founder oversight — Founder reviews any unusual pause patterns at retrospective

## Cross-references

- RATE_LIMIT_DISCIPLINE.md — full governance
- HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md item 13
- SESSION_JOURNAL.md format
- `.claude/state/last-verify.json` schema

## Activation

Skill activates at Phase 1 commit and fires continuously thereafter. First pause-and-resume cycle (if any) fires during Wave Zero Dry-Run or first real-ship execution, whichever causes a rate-limit threshold approach first.

If no rate-limit threshold is approached during Wave Zero Dry-Run, the skill stays dormant but instrumented — every API response is still monitored, just no pause triggered.
