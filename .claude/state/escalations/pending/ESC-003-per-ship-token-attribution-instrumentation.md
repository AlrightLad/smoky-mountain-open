---
id: ESC-003
title: Per-ship token attribution — going-forward instrumentation approach
type: architecture-decision
origin_commit: 5e04b68
origin_ship: per-ship-token-attribution
question: |
  Per Founder directive 2026-05-14 "PER-SHIP TOKEN ATTRIBUTION", every ship's
  tokens + cost should populate in the dashboard Recent Ships table. Current
  state: aggregator scans session.team-work.summary events for ship_id matching
  the artifact ID. Historical events carry ship_id like "substrate-build-day-3"
  rather than PROP-NNN / AMD-NNN / ESC-NNN, so all artifacts surface "—" (honest
  per AMD-009 P5).

  Going-forward instrumentation requires picking HOW session.team-work.summary
  events get tagged with the correct artifact ID. Three architecturally-
  distinct approaches; team lacks high confidence on which is correct.
context_summary: |
  Today's events have ship_id="substrate-build-day-3" for ~7M tokens of
  orchestration work that produced 21 shipped artifacts. The team can't
  retroactively attribute those tokens to specific artifacts without
  fabricating a mapping. Going forward, every emit point needs to know which
  artifact (if any) it's contributing to.
proposed_answer: Approach A — Session-scoped current_ship_id state file
rationale: |
  Lowest infrastructure overhead. Single source of truth. Agent 3 sets the
  current_ship_id at ship-plan-author time and clears at ship-close commit.
  Every session.team-work.summary emit reads from the file. Compatible with
  the existing manual-emit pattern. Migrates cleanly to automated meter
  when PROP-003.a sidecar wires real per-call attribution.
options:
  - id: a
    label: Approach A — Session-scoped current_ship_id state file [team recommendation]
    rationale: |
      Single file at .claude/state/current-ship.json. Agent 3 writes
      {"ship_id": "PROP-NNN", "started_at": "..."} at ship-plan-author.
      Clears at ship-close commit. session.team-work.summary emits read
      this file. Compatible with multi-ship sessions (sequential, not
      parallel). Migration path: when PROP-003.a sidecar wires real per-call
      meter, this becomes the fallback for events outside the metered path.
  - id: b
    label: Approach B — Per-emit explicit ship_id parameter
    rationale: |
      Every place that emits session.team-work.summary takes a ship_id
      parameter from the caller. No state file. More explicit, but every
      caller has to know the current ship — high cognitive load + easy to
      forget. Sites: scripts/emit-session-event.py, manual emit by Agent 3,
      maintenance.ps1 ship-close emit, sidecar emit, etc.
  - id: c
    label: Approach C — Git-commit-based retroactive attribution
    rationale: |
      Don't tag events at emit. Instead, attribute by event timestamp window
      between consecutive ship-close commits. Aggregator does the work post-
      hoc. Simpler upstream (no instrumentation change). Brittle when commits
      are out-of-order or when sessions span multiple ships (one event would
      attribute to whichever ship-close happens to fall after it).
default_if_no_response: Approach A
default_window_hours: 168
authored_by: claude-code
authored_at: 2026-05-14T17:39:00Z
estimated_decision_complexity: deep
blocks_ship: false
source_artifact_paths:
  - scripts/aggregate-telemetry.py
  - scripts/lib/anthropic-pricing.json
  - .claude/state/telemetry/events/2026-05-14.ndjson
---

# ESC-003 — Per-ship token attribution instrumentation approach

Authored per AMD-015 propose-first + AMD-017 continuation-discipline skill
Step 3 (LOW confidence → escalate, don't stop).

## Why this is an escalation rather than direct execution

Per AMD-017 + continuation-discipline skill: LOW confidence items go to
escalation, the team continues to next eligible work. This is the
"feature-breaking risk + low confidence" path from Step 3 of the skill.

The architectural decision has three distinct approaches with different
maintenance + correctness trade-offs. The team's proposed answer
(Approach A) is the lowest-risk path but Approach B or C may better
match Founder's intent depending on multi-session architecture goals.

## What's in scope for the deciding decision

- File location for current_ship_id (if Approach A)
- Set/clear lifecycle (when does Agent 3 know it's starting a ship?)
- Multi-ship-in-session handling (sequential, parallel, or restricted?)
- Pre-ship-plan-author work attribution (substrate / unattached)

## What's out of scope

- Real per-call token metering (that's PROP-003.a + .b territory; this
  ship deals with attribution at the session.team-work.summary
  granularity)
- Historical backfill (events without ship_id stay attributed to
  "substrate" pseudo-ship per current honest-"—" rendering)

## Cross-references

- AMD-016 INFRASTRUCTURE_OPERATIONAL_QUESTION (the gate this escalation
  unblocks for the Recent Ships table)
- AMD-015 TEAM_PROPOSES_AGENT_2_RATIFIES (propose-first pattern)
- AMD-017 CONTINUATION_DISCIPLINE + .claude/skills/continuation-
  discipline/SKILL.md (the runtime decision rule that escalated this)
- AMD-009 SENIOR_ENGINEERING_STANDARD (foundation discipline)
- PROP-003.a + .b (the related token-meter infrastructure)
- Founder directive 2026-05-14 "PER-SHIP TOKEN ATTRIBUTION" (origin)
