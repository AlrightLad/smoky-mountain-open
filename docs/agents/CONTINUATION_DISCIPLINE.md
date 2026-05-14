
# Continuation Discipline

The team's default behavior is to **continue immediately** after every
ship-complete + consolidated report. Reports are async checkpoints
that Founder reads at their own pace; the team does not pause on
them.

## Founder principle (recorded verbatim)

> "Consolidated reports are CHECKPOINTS, not GATES.
> Founder reads them ASYNC, not BLOCKING.
> Team continues immediately to next eligible work.
> 'Founder reviews when ready' should mean 'Founder reads at their
> pace; team continues at their pace'."

## Pattern that was wrong (corrected here)

The team's ending phrase "Tree clean. Round-trip green. Founder
reviews when ready." had been functioning as an implicit synchronous
gate. The team treated consolidated reports as the end of a turn.

Per AMD-009 P5 (honest language) + P7 (acknowledge what breaks):
this was a violation of continuation discipline. The team produced
ship-complete reports at logical handoff points and then stopped
working, awaiting next-direction. The substrate's next-direction
was already present (ROADMAP_v2 + readiness pipeline + open
escalations).

## Exhaustive stop conditions

These are the **only** conditions under which the team pauses:

1. All Wave 1 + Wave 2 ships shipped (per ROADMAP_v2 binding sequence)
2. HALT criterion fires (per AUTONOMOUS_FAILURE_RECOVERY v8.3 §
   halt-and-escalate)
3. Escalation criterion fires (per AMD-011 + AMD-015: proposed
   answer attached, not blank escalation)
4. AUTONOMOUS_FAILURE_RECOVERY abandon criteria met after 3+ plan
   attempts on a single ship
5. Working tree corruption detected (git refuses operations,
   filesystem-level issues, etc.)
6. Founder's account session limit hits organically (rate limit,
   not voluntary pause)
7. Founder issues explicit new directive that requires re-planning

**NOT stop conditions** (these have been treated as pauses in
practice and shouldn't be):

- "Ship complete; producing consolidated report" → continue immediately
- "Awaiting Founder review" → Founder reviews async; team continues
- "Logical handoff point" → not a stop, just a checkpoint
- "It's been a while" → not a stop
- Pacing caution of any kind → not a stop
- Op-count thresholds → deprecated per AMD-005

## Continuation triggers (explicit)

After every ship-complete + consolidated report, the team MUST:

1. Run readiness scanner (already happens via ship-close trigger
   per regen-all.ps1 ship-close-commit dispatch)
2. Identify next eligible work per priority:
   a. Phase C dashboard infrastructure incomplete items
   b. Open escalations requiring action (per AMD-015 propose-first)
   c. Wave 1 ships per ROADMAP_v2 sequence
   d. Wave 2 ships after Wave 1 complete
   e. Background tracks (e.g., main-flows v2 visual replication
      if explicitly open)
3. Author ship plan for next item (if Wave 1+ ship; substrate work
   may go directly to execution)
4. Execute immediately

No "Founder reviews when ready" pauses. No "awaiting next direction"
states. The next direction is the ROADMAP + readiness pipeline.

Founder direction arrives asynchronously via:
- Approving amendments / proposals / escalations through dashboards
- Authoring new directives between Claude Code sessions
- Closing discussion bubbles

None of those require the team to PAUSE work waiting for them.

## Critic gate (new)

Before ending a session/turn, Critic verifies the team has triggered
next work, not paused. Specifically:

```
[ ] Next eligible work identified per priority (a-e above)
[ ] Ship plan authored OR execution begun on the next item
[ ] If no next eligible work exists (queue empty), this is genuinely
    a stop condition #1 (Wave 1 + Wave 2 complete) → Critic verifies
    that's true; if not, queue is mis-classified
[ ] Consolidated report explicitly notes next-work-in-flight (e.g.,
    "Continuing immediately with X") rather than "Founder reviews
    when ready"
```

Critic blocks ship-close (and therefore the report sign-off) if any
of these gates fail.

## Founder action surfaces (related discipline)

A separate but related issue surfaced 2026-05-14 with the install
flow: the team had been over-routing engineering work as "Founder
action required" callouts on dashboards. Per Founder principle:

> "Dashboard 'Founder action required' surfaces must be:
>   - Truly Founder-only (decisions, approvals, hardware access,
>     Anthropic account login, etc.)
>   - NOT engineering work the team could have done first"

The install-all.ps1 commit `6fcdf49` consolidated 5 per-task install
scripts into a single owner-team-authored entry point. The dashboard
surface now shows ONE command (Set-Location + .\install-all.ps1)
instead of multi-fragment instructions. Founder runs once; team
owns end-to-end.

Critic gates this too: before any "Founder action required" surface
ships, Critic verifies it's truly Founder-only and not packaged-as-
Founder-action when the team could have shipped the working flow.

## Application to in-flight work

Operating immediately:

- This session's pattern of ending at consolidated reports stops.
  Each report is followed by immediate continuation to next work.
- The team's Critic adds these gates to its pre-ship-close checklist.
- Dashboard surfaces are audited (in next maintenance pass) for any
  "Founder action" callouts that should be team-owned.

## Cross-references

- AMD-009 Senior Engineering Standard (P5 honest language, P7
  acknowledge what breaks — this amendment honors both)
- AMD-011 Auto-Execute Protocol (the readiness pipeline that
  drives continuation)
- AMD-015 Team Proposes; Agent 2 Ratifies (the escalation
  discipline that pairs with continuation)
- AUTONOMOUS_FAILURE_RECOVERY v8.3 (the stop-condition definitions
  this amendment cross-references)
- Founder directive 2026-05-14 "CONTINUATION DISCIPLINE" (verbatim
  source)
