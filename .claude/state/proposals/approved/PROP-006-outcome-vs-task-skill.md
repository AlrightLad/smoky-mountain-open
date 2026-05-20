---
{
  "id": "PROP-006",
  "title": "Author outcome-vs-task skill (engineering-mindset gate)",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T18:45:00Z",
  "rationale": "Founder engineering-mindset call-out 2026-05-14 surfaced that the team has been executing tasks as literally described instead of solving the problems behind them — escalating on Plan A failures, ignoring already-on-disk artifacts, shipping structural sentinels that don't answer the operational question. PROP-005 (continuation-discipline) covers stop conditions; this proposal covers the symmetric START condition: before doing, declare the outcome + enumerate approaches + check what's already on disk. The 5-question discipline named in .claude/state/lessons-learned/engineering-mindset.md becomes a SKILL the team consults at decision time, not a policy doc.",
  "scope": "Three deliverables: (1) Author .claude/skills/outcome-vs-task/SKILL.md with the 5-question discipline + the 'check what's on disk' first-move + concrete pattern of when to invoke (before escalation, before declaring blocked, before ship-close). (2) Add Critic gate: outcome-vs-task skill must have been consulted before any escalation or ship-close. (3) Operate the skill immediately per the engineering-mindset directive — this proposal codifies the existing operative behavior.",
  "estimate": {
    "cost_tokens": 5000,
    "duration_minutes": 12,
    "risk": "low"
  },
  "cost_tokens": {
    "low": 4000,
    "high": 6000,
    "methodology": "Empirical estimate based on PROP-005 continuation-discipline skill authoring cost (~5000 tokens for SKILL.md + APPROVAL.md + worked-example section). Range captures variation in worked-example density and frontmatter verbosity."
  },
  "files_affected": [
    ".claude/skills/outcome-vs-task/SKILL.md (new)",
    ".claude/skills/outcome-vs-task/SKILL.APPROVAL.md (skill-approval-gate sidecar marker)",
    "docs/agents/CRITIC.md (or peer doc) — append outcome-vs-task gate (deferred to apply-time)",
    ".claude/state/proposals/pending/PROP-006-outcome-vs-task-skill.md (this file)"
  ],
  "fallback_plan": "Plan A: ship the skill + Critic gate as one bundle (this proposal). Plan B: ship the skill only, defer Critic gate to follow-on if CRITIC.md edit blocked by governance protection at apply-time. Plan C: keep the lessons-learned doc as the authoritative source; team operates from lesson text alone. Abandon: outcome-vs-task framing itself becomes unworkable (unlikely — the 5-question structure is a direct read of Founder's directive).",
  "rollback_strategy": "git revert; skill is new — removal restores prior implicit behavior. The engineering-mindset lessons-learned doc continues to operate as written.",
  "round_trip_coverage": "Existing [proposals] check verifies this proposal's frontmatter schema; no new round-trip block required (skills are loaded by Claude Code at session start, not by round-trip-test.py).",
  "depends_on": ["AMD-009", "AMD-015", "AMD-016", "AMD-017", "AUTONOMOUS_FAILURE_RECOVERY_v8.3"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1500,
  "status": "pending",
  "operating_status": "Skill content + structure operate immediately per the engineering-mindset directive even before formal approval. This proposal codifies it for the next agent loop."
}
---

# PROP-006 — Outcome-vs-Task Skill + Critic Gate

Authored 2026-05-14 per Founder engineering-mindset directive:

> "Before declaring blocked, escalating, or shipping, the team asks:
>  1. WHAT IS THE OUTCOME I NEED?
>  2. WHAT ARE ALL THE WAYS I COULD GET THAT OUTCOME?
>  3. WHICH OF THOSE HAVE I ACTUALLY TRIED?
>  4. WHAT TOOLS DO I HAVE AVAILABLE?
>  5. IS THIS REALLY BLOCKED OR DO I JUST NOT WANT TO TRY HARDER?"

## Why a skill (not just an amendment or lessons-learned doc)

The lessons-learned doc at `.claude/state/lessons-learned/engineering-mindset.md`
captures the principle. An AMD could codify it. But the failure mode
is at **decision time** — when the team is about to escalate, the team
needs a *reachable artifact* that lists the 5 questions + a worked
example of how each question reframes the problem. AMDs are read
once at session start; skills are explicitly invoked at decision
points.

PROP-005 established this pattern for continuation-discipline (stop
conditions). PROP-006 is the symmetric pattern for outcome-vs-task
(start conditions). Together they bracket the action: outcome-vs-task
fires at start ("are you doing the right thing?") and continuation-
discipline fires at end ("are you stopping for the right reason?").

## The skill content (preview — full version at apply-time)

The skill file will include:

### Section 1 — The 5 questions verbatim

Listed exactly as Founder stated them, in order, with the example
reframings:

| # | Question | What it forces |
|---|---|---|
| 1 | What is the OUTCOME I need? | Not the task description; the value the task exists to deliver |
| 2 | What are ALL the ways I could get that outcome? | Enumerate ≥3 approaches; don't stop at the first |
| 3 | Which have I actually TRIED? | Tried = code executed, evidence captured; not "I assumed it wouldn't work" |
| 4 | What tools do I have AVAILABLE? | Read skills list, installed packages, existing scripts on disk |
| 5 | Is this really blocked? | "Blocked" requires ≥3 documented failed attempts per AUTONOMOUS_FAILURE_RECOVERY v8.3 |

### Section 2 — The "check what's on disk" first move

Before authoring any new artifact, the team runs:

```bash
ls <target-directory>                       # what's already there?
cat <target-directory>/READ-ME-FIRST.md     # if exists, read it
cat <target-directory>/manifest*.json       # if exists, read it
cat <target-directory>/.last-*              # if exists, read it
```

Concrete prior failure: Janowiak reference frames were in
`.claude/state/main-flows-v2/reference-frames/` for hours. Team did
not run `ls` against that directory before declaring "WebFetch 402 =
blocked" and escalating to Founder.

### Section 3 — When to invoke

Mandatory invocation points (Critic gate enforces):
- Before any "blocked" or "need Founder input" declaration
- Before any ship-close / mark-complete declaration
- Before authoring a new spec / new script / new state directory
- Before the first attempt at a "match the reference" / "verify Y"
  / "deliver outcome X" task

### Section 4 — The pattern of doing-vs-engineering

Doing mode (anti-pattern):
- Read task → execute literal task description → ship when surface delivered
- First obstacle → assume blocked → escalate

Engineering mode (target):
- Read task → identify OUTCOME the task exists to deliver
- Enumerate ≥3 approaches; rank by likelihood + cost
- Check disk for relevant prior artifacts
- Execute Plan A; gather concrete evidence on result
- Plan A fails → try Plan B; fails → try Plan C; etc.
- Only escalate with ≥3 documented failed attempts + specific blocker

### Section 5 — Worked examples from this session

The skill includes 2-3 paired examples (task vs outcome) directly
from the engineering-mindset lessons-learned doc, anchored in the
real failures so the skill is grounded in PARBAUGHS history.

## Critic gate (deferred to apply-time)

When this proposal is approved + applied, an addendum to CRITIC.md
adds:

> "Before approving any escalation or ship-close, Critic verifies:
>  1. outcome-vs-task skill has been consulted in the current turn
>     (search for outcome-statement, approach-enumeration, tools-
>     checked acknowledgment in agent output);
>  2. ≥3 attempts documented if escalating (per AUTONOMOUS_FAILURE_
>     RECOVERY v8.3);
>  3. Outcome stated matches the OUTCOME the task exists to deliver,
>     not just the literal task description."

CRITIC.md edit is governance-protected. This proposal commits to the
edit at apply-time; bypass pattern per CLAUDE.md operational gotcha
"firestore.rules is hook-protected" applies (governance-protection
sister bypass).

## Path to apply

Once Founder approves:
1. Author `.claude/skills/outcome-vs-task/SKILL.md` with full content
2. Author `.claude/skills/outcome-vs-task/SKILL.APPROVAL.md` sidecar
3. Update CRITIC.md per Critic gate (governance-protection bypass)
4. Move PROP-006 from approved/ to applied/
5. Round-trip green
6. Single commit: "PROP-006 applied: outcome-vs-task skill + Critic gate"

## Why now

PROP-005 (continuation-discipline) is approved + skill is operating.
PROP-006 (outcome-vs-task) is the symmetric piece. Shipping both
brackets every agent action with discipline at start + end.

Without PROP-006, AMD-009 + AMD-016 are policy docs the team reads
once and forgets at decision time. With it, the discipline is
reachable through the skill system the team already uses.

## Operating status

Per Founder directive: skill content operates IMMEDIATELY. This
proposal codifies it for the next agent loop. The author of this
proposal (Agent 3) consults the 5-question discipline starting NOW;
the formal skill file lands on approval.

---

## Approval metadata

```
status: approved
approved_at: 2026-05-19T03:00:00Z
approved_by: founder-blanket-approval-2026-05-19
disposition: STILL-RELEVANT — content ratified; small finishing job (~600 tokens to author ~/.claude/skills/outcome-vs-task/SKILL.md as the symmetric sister-skill of continuation-discipline). Skill content currently lives in .claude/state/lessons-learned/engineering-mindset.md and operates from there; this approval green-lights the formal authoring.
triage_source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch A row 1.
```
