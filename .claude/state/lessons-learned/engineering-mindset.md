# Engineering mindset — outcome vs task

**Authored:** 2026-05-14 by Agent 3, after Founder's explicit
engineering-mindset call-out reproduced verbatim below.

## Founder call-out (verbatim, summarized for substrate)

> "The team has been EXECUTING TASKS instead of SOLVING PROBLEMS."
>
> Pattern across multiple deliverables this session:
> - Task "match Janowiak reference" → Doing: WebFetch returns 402,
>   escalate. Engineering: Playwright is installed, use it.
> - Task "surface install command" → Doing: JS template, ship.
>   Engineering: test the actual output in PowerShell before shipping.
> - Task "show recent activity" → Doing: wire aggregator, render
>   table. Engineering: inject synthetic event, verify it surfaces.
> - Task "per-ship token attribution" → Doing: write quota status.
>   Engineering: what question does this answer? Build attribution
>   at the same time, not as a follow-on.
> - Task "get reference frames" → Doing: WebFetch fails, escalate.
>   Engineering: try Playwright → try yt-dlp → try ToDesktop marketing
>   site → try public talks → escalate ONLY if all attempts fail.
>
> The 5 questions before declaring blocked, escalating, or shipping:
>   1. What is the OUTCOME I need (not "complete this task")?
>   2. What are ALL the ways I could get that outcome (enumerate)?
>   3. Which of those have I actually TRIED (executed code, gathered
>      evidence)?
>   4. What tools do I have AVAILABLE (skills, packages, scripts)?
>   5. Is this really blocked or do I just not want to try harder?
>      ("Blocked on Founder" requires evidence of 3+ failed attempts.)

## Concrete observations from this session

### Observation 1 — Reference frames were on disk; team didn't consult them

The 7 Janowiak reference frames were captured 02:22 UTC by a prior
session (May 14) and sat at
`.claude/state/main-flows-v2/reference-frames/dave-frame-t*.png`
with a `READ-ME-FIRST.md` directing future agents to use them.

When Founder asked for iteration 6 to match the reference, the team:
- Did NOT first run `ls .claude/state/main-flows-v2/reference-frames/`
- Did NOT consult `READ-ME-FIRST.md`
- Did NOT read any frame
- Did execute structural sentinels + cross-browser smoke that
  proved IMPLEMENTATION-COMPLETE but not VALUE-COMPLETE

The frames were sitting on disk. The team optimized against derived
prose. Five iterations shipped while the canonical reference was
ignored.

### Observation 2 — `capture-janowiak-reference.mjs` didn't exist as a tool

When iter 7's directive arrived, the team's first reaction was to
plan a Playwright-based capture *as if it was a new problem*. But:
- Playwright is installed (used in `scripts/visual-audit/capture-dashboards.mjs`)
- The pattern is established (~6 existing capture scripts in
  `scripts/visual-audit/`)
- The prior session's network probe captured every video URL needed
  (`.claude/state/main-flows-v2/reference-frames/x-probe-media.json`)

Authoring the script took ~4 minutes once recognized as a substrate
fix. It worked on first run (7/7 frames captured). The earlier
"WebFetch 402 = blocked" framing was a doing-vs-engineering failure.

### Observation 3 — Founder iter 5 + iter 7 directives appear contradictory; team didn't surface

- Iter 5 directive: "use --bg-page billiard-green NOT black; --accent-brass
  warm brass NOT pure yellow"
- Iter 7 directive: "iteration 6 must match" (the reference is black + yellow)

The honest engineering resolution: replicate **structure** + **layout**
+ **density** + **interaction model** from the reference; replicate
**palette** from PARBAUGHS dashboard (per iter 5 directive). The two
directives are compatible at that level.

The team should have surfaced this tension explicitly per AMD-009 P5
(honest language) BEFORE shipping iter 6, rather than silently picking
one interpretation and hoping it satisfied both directives.

## Root cause

**Execute-the-task-as-stated mode replaces engineer-the-outcome mode.**

Symptoms:
- "Plan A failed with permission error" → blocked, escalate
- "Sentinels pass" → ship-complete, regardless of whether the
  operational question is answered
- "First approach didn't work" → assume can't do it
- Tools available on disk go unconsulted because they weren't named
  in the task description

The team can write quality code. The gap is at the layer ABOVE
writing code: deciding what to write, against what target, with
what verification.

## Structural fixes

### Fix 1 — The 5-question discipline as a pre-action gate

Before any of the following, the team must answer the 5 questions
explicitly (in inner monologue or in the report — but explicitly):

| Action | Required pre-gate |
|---|---|
| Escalating to Founder | 5 questions answered; ≥3 failed attempts documented (AUTONOMOUS_FAILURE_RECOVERY v8.3) |
| Declaring ship-complete | 5 questions answered; AMD-016 operational question test passed |
| Saying "this is blocked" | 5 questions answered; specific evidence of why blocked |

The questions:
1. What is the OUTCOME I need?
2. What are ALL the ways I could get that outcome?
3. Which of those have I actually TRIED?
4. What tools do I have AVAILABLE?
5. Is this really blocked or do I just not want to try harder?

### Fix 2 — "Look at what's already on disk" as the first move

Before authoring new scripts, new specs, new state directories:

  ls <target-dir>
  cat <target-dir>/READ-ME-FIRST.md (if exists)
  cat <target-dir>/manifest*.json (if exists)

The 5x main-flows iteration failure had reference frames sitting in
the target directory the whole time. Future "match the reference"
tasks must verify-on-disk first.

### Fix 3 — Outcome-vs-task as a Critic gate

The Critic protocol (per AMD-016 + this lesson) adds:

  Before approving any ship for close, Critic asks:
  - What's the outcome this ship was built to deliver?
  - Does the shipped state demonstrate that outcome, or just the
    surface task description?
  - If outcome-not-delivered: name the gap, block the ship.

This is AMD-016's "operational question test" applied at engineering-
intent time, not just at value-complete time.

### Fix 4 — A new skill (proposed): outcome-vs-task

Sister skill to continuation-discipline (which forces correct stop
conditions). The outcome-vs-task skill forces correct start
conditions: before doing, the agent answers the 5 questions
explicitly. See PROP-006 (this ship) for the skill proposal.

## Cross-references

- `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md` (3+ attempts
  before blocked discipline)
- `docs/agents/AMD-009-senior-engineering-standard.md` (P5 honest
  language, P7 honest delta)
- `docs/agents/AMD-016` (operational question test, value-complete)
- `docs/agents/lessons-learned/SHIP_main-flows-iter6_LESSONS.md`
  (the 5-iteration retro that surfaced the broader pattern)
- `scripts/visual-audit/capture-janowiak-reference.mjs` (Plan A
  substrate fix authored under this lesson)
- `.claude/state/main-flows-v2/reference-spec-from-frames.md`
  (visual spec derived from actual reference frames)
- `.claude/skills/continuation-discipline/SKILL.md` (sister skill,
  stop discipline; this lesson proposes its start-discipline peer)
- PROP-006 (this ship — skill proposal: outcome-vs-task)
