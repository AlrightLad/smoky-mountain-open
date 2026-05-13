# Rate Limit Discipline

Agents pause at 90% usage threshold of token budget or request quota. Resume when limit resets. No half-completed pushes. State file captures precise pause point.

## Why this exists

Per Founder direction (Vision authoring session 2026-05-12): orchestration team should stop at 90% usage when nearing rate limits, not push through and get hard-rejected mid-task. Both Claude API and Claude Code expose rate limit metadata agents can read and act on. Per Anthropic's published guidance on long-running agents: graceful pause beats hard rejection.

Pushing through limit-approach risks:
- Hard rejection mid-file-write leaving repo in inconsistent state
- Lost session context when API throttles unexpectedly
- Mid-push commits that orphan part of a ship
- Critic verification cycle interrupted before stamp lands

Graceful pause produces:
- Clean atomic operation completion before pause
- Session journal entry preserving context for resume
- Predictable behavior orchestration team and Founder can rely on

## When this fires

Continuously during agent operation. Every API call or tool invocation includes a check against rate limit metadata. When usage approaches threshold, pause discipline activates.

## Threshold

**90% usage of either limit triggers pause:**

- **Token budget usage** — input + output tokens consumed against per-window quota
- **Request quota usage** — request count against per-window quota

Either threshold breach triggers pause. Both don't have to apply simultaneously.

## What "pause" means

When threshold breached, agent:

1. **Completes current atomic operation** — the in-flight file write, tool call, or commit finishes. Does NOT abandon mid-operation.
2. **Does NOT start new operation** — no new file writes, tool calls, commits, or API requests after current atomic operation completes.
3. **Writes state checkpoint** — `.claude/state/last-verify.json` captures precise pause point including: current ship ID, current phase, last completed operation, what would have been next, estimated resume time (rate limit reset timestamp).
4. **Logs session journal entry** per SESSION_JOURNAL.md — timestamp, agent, decision = "pause for rate limit," rationale = "90% threshold reached at [time]," outcome = "pausing; resume at [reset time]," cross-references = current ship + state file.
5. **Surfaces to Founder if pause exceeds expected duration** — most rate limits reset within minutes-to-hours; if pause exceeds 12 hours, agent surfaces via the next session start.

## What "resume" means

When rate limit resets, agent (or next session start):

1. **Reads state checkpoint** from `.claude/state/last-verify.json`
2. **Reads SESSION_JOURNAL.md** last 5 entries to confirm session context
3. **Verifies no other process touched the work** — git status, smoke status, no conflicts with concurrent activity
4. **Resumes from "what would have been next"** — the operation that was about to fire when pause triggered
5. **Logs session journal resume entry** — timestamp, agent, decision = "resume from rate-limit pause," outcome = "continuing ship X at phase Y."

## Hard rules

- **Never** override the 90% threshold to "just finish this one more thing." If the operation would push usage above 90%, pause.
- **Never** start a multi-step operation when current usage is above 80%. The cost-projection self-check should fire before starting work that would exceed threshold mid-execution.
- **Always** complete the in-flight atomic operation before pausing — partial file writes, partial commits, partial tool calls produce worse outcomes than the pause itself.
- **Always** write state checkpoint + journal entry before stopping. Silent pause = lost context.

## Pre-operation self-check

Before starting any operation that would consume significant tokens or requests, agent runs a self-check:

1. What is current rate limit usage (token + request)?
2. What is projected usage after this operation (worst case)?
3. Will projection exceed 90% threshold?
4. If yes: pause now rather than start operation that would breach mid-execution
5. If no: proceed

This is the "graceful pre-emption" pattern — better to pause one operation early than abandon one operation mid-execution.

## Interaction with other protocols

- **HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE** — rate-limit pause is item 13 of explicit halt list. Pre-halt self-check applies; pause is genuine halt, not bubble-resolvable.
- **POST_PUSH_RETROSPECTIVE** — if pause interrupts a push, retrospective generation also pauses; resumes after rate limit reset before ship close.
- **P10 loop-and-verify** — loop pauses cleanly mid-iteration; resume continues from same iteration state.
- **SESSION_JOURNAL** — every pause + resume logged. Future sessions read journal at start to understand current state.

## Failure response

If state checkpoint write fails (disk error, permissions, etc.):
1. Log error to stderr
2. Attempt fallback location for state file
3. If all fallbacks fail, surface error to Founder via next interaction
4. Do NOT silently lose state — better to fail loudly than continue without context

If resume detects inconsistent state (git conflicts, unexpected file modifications):
1. Do NOT auto-resolve
2. Log inconsistency to session journal
3. Open decision bubble for resolution OR escalate to Founder if outside graduated autonomy
4. Founder rules on how to proceed

## Cost discipline

Rate limit awareness operates against locked HALT_CRITERIA cost-halt thresholds:

- Pause does not bypass cost-halt; it adds an operational floor
- An operation that would breach cost-halt thresholds halts per HALT_CRITERIA item 5 regardless of rate limit
- An operation within cost-halt thresholds but breaching rate-limit threshold pauses per this protocol

## Audit cadence

- **Per session start**: check rate limit metadata, log session start state
- **Per retrospective**: review any pauses during the period — were they triggered correctly? Did resume work cleanly?
- **Per wave close**: pattern review — are there ships that consistently approach rate-limit threshold? If yes, ship scope may be too ambitious for single-session execution; consider phase splits.

## Activation

This protocol activates at Phase 1 commit. First pause-and-resume cycle (if any) fires during Wave Zero Dry-Run if the dry-run approaches rate-limit threshold, OR at first real-ship execution thereafter.

Skill `parbaughs-rate-limit-aware-pause` enforces this protocol at the operational layer. Skill activates whenever agent makes API calls or tool invocations.

## Critic verification

Critic verifies during retrospective:
1. Any pauses during the period were triggered at correct threshold (not panicked early, not pushed through)
2. State checkpoints during pauses were complete and accurate
3. Resume worked cleanly without state conflicts
4. Session journal entries for pause + resume are present and accurate

## What this protocol does NOT do

- Does NOT predict rate limit reset times — uses metadata from API responses, doesn't speculate
- Does NOT optimize token usage — that's separate cost discipline
- Does NOT replace cost halt — cost halt protects bills; this protects operational continuity
- Does NOT permit Founder synchronous override — pause is operational, resume happens automatically

## Cross-references

- HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md item 13
- SESSION_JOURNAL.md format
- `.claude/state/last-verify.json` schema
- Skill: parbaughs-rate-limit-aware-pause
