# parbaughs-handoff-note

## Description

Generate structured handoff notes per HANDOFF_PROTOCOL.md when transitioning work between actors (agents, subagents, cycles, Founder, discussion bubbles, ships, waves). Trigger this skill at EVERY transition point, no exceptions. Produces a paste-ready handoff note using the scenario-appropriate template from HANDOFF_NOTE_TEMPLATES.md.

Trigger conditions:
- Outgoing actor about to conclude work
- Receiving actor needs to resume from prior work
- Cycle ending with incomplete ship work
- Subagent dispatch or return
- Founder FIQ resolution propagating to agents
- Discussion Bubble decision closing
- Cross-ship or cross-wave context transfer needed
- Multi-agent parallel work merging

## When to use

USE when:
- ANY transition between actors per the 11 scenarios in HANDOFF_PROTOCOL.md
- Cycle is exiting with work in flight (Scenario 1)
- One agent has completed its phase within a cycle (Scenario 2)
- Subagent is returning to parent (Scenario 3)
- Parent is dispatching to subagent (Scenario 4)
- Approved proactive proposal is being picked up (Scenario 5)
- Cycle is halting OR resuming from halt (Scenario 6)
- Founder has resolved FIQ entry (Scenario 7)
- Discussion Bubble has reached decision (Scenario 8)
- Cross-ship context needs to transfer (Scenario 9)
- Wave is closing OR opening (Scenario 10)
- Multiple parallel actors are merging output (Scenario 11)

DO NOT use when:
- Same actor continuing its own work within a single uninterrupted operation
- Logging routine activity that doesn't change actor (use journal entries instead)
- Internal notes within an agent's work product (use comments)

## How to use

1. Identify which scenario (1-11) applies
2. Load matching template from HANDOFF_NOTE_TEMPLATES.md
3. Populate ALL universal fields (handoff_id, scenario, from_actor, to_actor, timestamp, what_was_being_done, where_it_stopped, why_it_stopped, state_snapshot, resumer_needs_to_know, next_action, open_questions, references)
4. Populate ALL scenario-specific fields per template
5. Write atomically:
   - Build full content in memory
   - Write to `.tmp` file: `<final_path>.tmp`
   - Rename to final path
6. Storage hierarchy per HANDOFF_PROTOCOL.md § 14:
   - Scenario 1: `.claude/state/handoffs/cycle-to-cycle/`
   - Scenario 2: `.claude/state/handoffs/agent-to-agent/<cycle_id>/`
   - Scenario 3: `.claude/state/handoffs/subagent-returns/<cycle_id>/`
   - Scenario 4: `.claude/state/handoffs/dispatches/<cycle_id>/`
   - Scenario 5: `.claude/state/handoffs/proactive-to-ship/`
   - Scenario 6: `.claude/state/handoffs/halts/`
   - Scenario 7: `.claude/state/handoffs/founder-responses/`
   - Scenario 8: `.claude/state/handoffs/discussion-bubbles/`
   - Scenario 9: `.claude/state/handoffs/cross-ship/`
   - Scenario 10: `.claude/state/handoffs/wave-transitions/`
   - Scenario 11: `.claude/state/handoffs/parallel-merge/`
7. Log journal entry: `[HANDOFF-WRITE] handoff_id=<id>. scenario=<N>. from=<actor>. to=<actor>. <brief_summary>.`
8. Emit telemetry event: `handoff.created` with handoff metadata
9. If receiving actor known and active: notify them (no message channel; log in journal `[HANDOFF-NOTIFY]`)

## Quality bar enforcement

Reject handoff if:
- Any universal field empty or generic ("see notes", "TBD")
- Scenario-specific fields missing
- `next_action` vague ("continue work" — must be explicit step)
- `resumer_needs_to_know` empty (every handoff has context to transfer)
- References don't resolve to actual files
- Handoff stored in wrong directory
- Multiple handoffs accidentally generated for one transition

Resolution: Critic audit catches at next pre-flight. Outgoing actor (if still active) re-authors. If outgoing actor unavailable (cycle ended), HALT item 21b triggers; FIQ entry created.

## Failure modes

- Missing handoff at transition → HALT item 21a
- Incomplete handoff → HALT item 21b
- Receiver cannot resume → HALT item 21c
- Stale handoff (code drifted) → HALT item 21d

## Cross-references

- HANDOFF_PROTOCOL.md (all 11 scenarios)
- HANDOFF_NOTE_TEMPLATES.md (paste-ready templates)
- PROTOCOLS_v8_ADDENDUM.md P16
- HALT_CRITERIA_v8_ADDENDUM.md item 21
- SESSION_JOURNAL_v8_ADDENDUM.md (logging conventions)
- parbaughs-telemetry-emit skill (paired emission)

---

## v8.1 additions

### Scenario 8 fires operational view regen

When a discussion bubble handoff (Scenario 8: discussion-bubble-to-caller) is written, the originating Discussion Bubble must already have its decision file at `.claude/state/discussion-bubbles/<id>.md`. After writing the handoff, the skill MUST trigger `parbaughs-report-generate` for `discussion-bubbles.html` regen.

```
handoff written (scenario 8)
  → parbaughs-report-generate(view="discussion-bubbles")
  → discussion-bubbles.html updated with new discussion bubble entry
```

Debounce: if a second scenario-8 handoff arrives within 15 minutes of a prior regen, skip the second regen (next end-of-day heartbeat will sweep all changes).

### Scenarios that trigger activity.html regen

`activity.html` is NOT regenerated per-handoff (would be too noisy). It regenerates on:
- Ship close (sweep all handoffs from the closing ship's cycle range)
- End-of-day heartbeat

The handoff-note skill does NOT call into report generation for activity.html — that's the ship-close cycle's responsibility. The skill emits the handoff and emits `handoff.created` telemetry; downstream consumers regenerate when they regenerate.

### v8.1.1: Discussion bubble state files carry full transcripts

Discussion bubble state files at `.claude/state/discussion-bubbles/<id>.md` now carry the full message-by-message transcript, not just decision metadata. The discussion-bubbles.html operational view renders these as a Slack-style threaded transcript (master/detail layout: thread list rail + transcript pane).

When the discussion-bubble-orchestrator writes the bubble state file, the frontmatter MUST include:

```json
{
  "id": "db-<YYYY-MM-DD>-<NNN>",
  "topic": "<short title — used in thread list>",
  "claim": "<the proposition being decided>",
  "summary": "<1-2 sentence outcome blurb for thread list preview>",
  "ship_id": "<ship>",
  "opened_at": "<ISO-8601 UTC>",
  "closed_at": "<ISO-8601 UTC | null>",
  "status": "open | approved | approved-with-dissent | rejected | tied",
  "decision": "<full decision rationale>",
  "vote_tally": { "approve": N, "reject": N, "abstain": N },
  "messages": [
    {
      "author": "<agent role name>",
      "role_in_bubble": "open | voting | contributing | bubble-only | decision | summary",
      "timestamp": "<ISO-8601 UTC>",
      "content": "<message text>",
      "vote": "approve | reject | abstain | null"
    },
    ...
  ]
}
```

**Invariants enforced by parbaughs-report-generate on regen:**
- Every `role_in_bubble: "voting"` message MUST have a non-null `vote`
- `vote_tally` MUST match the sum of votes in `messages` (HALT 23.3 fires on mismatch)
- Every bubble MUST have at least one `role_in_bubble: "open"` and one `role_in_bubble: "decision"` message (except `status: "open"` which only has `open` plus zero or more contributing/voting messages)
- Status must be canonical (one of the 5 enum values above)

**Writing pattern:** each message is appended to the `messages` array as the deliberation unfolds. After every append, regen `discussion-bubbles.html` (debounced to 1 per 30s). On status transition (close, tiebreak, dissent recorded), regen is mandatory.

### v8.1 cross-references

- PROTOCOLS_v8.1_ADDENDUM.md P18 (operational view discipline)
- REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.2 (discussion-bubbles.html schema, full message contract)
- REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.3 (data block contract for activity.html)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 23.2 (parse failure on handoff file → operational view fails)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 23.3 (vote_tally / messages divergence)
