# PROTOCOLS_v8_ADDENDUM.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Two new protocols (P16, P17) to be appended to existing `PROTOCOLS.md` at consolidation.

---

## P16 — Handoff Discipline

**Owner:** Every agent at every transition between actors.

**Triggers:** Any of 11 handoff scenarios per `HANDOFF_PROTOCOL.md`:
1. Cycle-to-cycle (ship resumption)
2. Agent-to-agent within cycle
3. Subagent-to-parent
4. Parent-to-subagent
5. Proactive-to-ship
6. Halt-to-resume
7. Founder-to-agent
8. Discussion-bubble-to-caller
9. Cross-ship
10. Wave-to-wave
11. Multi-agent parallel merge

**Discipline:**

1. **Write before transition** — outgoing actor writes handoff note BEFORE concluding their work, so resume is not blocked on parallel write.

2. **Use scenario-specific template** — every handoff uses the matching template from `HANDOFF_NOTE_TEMPLATES.md`. No ad-hoc free-form handoffs.

3. **Universal fields populated** — every handoff has: handoff_id, scenario, from_actor, to_actor, timestamp, what_was_being_done, where_it_stopped, why_it_stopped, state_snapshot, resumer_needs_to_know, next_action, open_questions, references.

4. **Scenario-specific fields populated** — each template's additional fields are not optional.

5. **Atomic write** — handoff written to `.tmp` file, then renamed to final path. No partial handoffs on crash.

6. **Storage discipline** — handoffs stored in correct subdirectory per Scenario (see HANDOFF_PROTOCOL.md § 14).

7. **Acknowledgment required** — receiving actor logs `[HANDOFF-ACK]` in journal before resuming work.

8. **Read first** — receiving actor reads handoff note FIRST before any other state, on resumption.

9. **State verification** — for Scenario 1 (cycle-to-cycle) and Scenario 9 (cross-ship), receiving actor verifies code state matches handoff's files_modified before proceeding.

10. **Immutability** — handoff notes are immutable once written. Corrections appended as addendum fields, not edits.

**Violations:**
- Missing handoff at expected transition (HALT item 21)
- Vague handoff content (Critic rejects, transition replays)
- Skipping acknowledgment
- Ignoring decisions_locked from prior handoff
- Re-litigating handoff's locked decisions without cause

**Verification:**
- Critic audits handoff completeness at next cycle's pre-flight
- Telemetry tracks handoff creation + acknowledgment events
- Weekly report surfaces handoff backlog (long ack_delay values)

**See:** `HANDOFF_PROTOCOL.md` for full scenarios + `HANDOFF_NOTE_TEMPLATES.md` for templates + `parbaughs-handoff-note` skill.

---

## P17 — Telemetry Discipline

**Owner:** Every agent emits telemetry inline during work.

**Triggers:** All work that generates measurable events per `TELEMETRY_PROTOCOL.md`:
- Cycle lifecycle (start/end/budget/activity)
- Ship lifecycle (start/preflight/execution/retrospective/atomic-unit/progress/complete)
- Agent invocations
- Discussion Bubbles
- Handoffs
- FIQ lifecycle
- Proposal lifecycle
- Wellness checkpoints
- Halts
- Code changes (files/tests/commits/coverage)
- Cost events (tokens/thresholds)

**Discipline:**

1. **Inline emission** — emit telemetry events as work happens, not reconstructed after. Pattern: emit start event → do work → emit end event with outcome + delta.

2. **Universal event fields** — every event has: event_id, event_type, timestamp, cycle_id, ship_id (if applicable), actor, tokens_consumed_delta, duration_ms, data payload.

3. **Append-only** — events written to daily NDJSON files; files never edited, only appended.

4. **Atomic appends** — build full JSON line in memory, single `>>` redirect.

5. **Failure tolerance** — telemetry emission failure does NOT halt cycle work. Log failure, continue. 5+ failures in one cycle → HALT item 22.

6. **Aggregation discipline** — aggregates regenerated at known times (per-cycle, per-ship-completion, per-heartbeat for snapshot). Not on every event.

7. **Privacy adherence** — emit metadata, NOT content. File paths but not code. Decision outcomes but not full discussion bubble transcripts. Token rollups but not per-token detail.

8. **Retention discipline** — raw events 90 days, aggregates indefinite, quarterly archives compressed.

9. **Reports as views** — reports generated FROM telemetry, never the source of truth. Editing report does not change underlying data.

**Violations:**
- Skipping emission at expected event boundary (incomplete data)
- Reconstructing events after the fact (corruption risk + wasted tokens)
- Emitting content/code/personal data (privacy violation)
- Mid-write append (data corruption)
- Editing events post-write (immutability violation)
- 5+ emission failures in one cycle → HALT item 22

**Verification:**
- Critic audits telemetry completeness at retrospective
- Aggregate generation reveals gaps (event types missing for known activities)
- Telemetry health surfaces in heartbeat dashboard

**See:** `TELEMETRY_PROTOCOL.md` for full event catalog + `REPORT_TEMPLATES.md` for downstream usage + `parbaughs-telemetry-emit` skill.

---

## Numbering reference

Existing protocols:
- P1 — Audit-first
- P2 — Caddy Notes update mandate
- P3 — Semver triple-bump
- P4 — Discussion bubble write
- P5 — Validator strictness audit
- P6 — CSS token usage audit
- P7 — Legacy field consumer audit
- P8 — State re-assignment audit
- P9 — Firestore writer audit
- P10 — Loop-and-verify
- P11 — Founder Input Queue triage discipline
- P12 — Extended thinking + deep research default
- P13 — Agent wellbeing discipline
- P14 — Headless operation discipline (v7)
- P15 — Proactive improvement discipline (v7)

New v8 protocols:
- P16 — Handoff discipline
- P17 — Telemetry discipline

---

*Document authored 2026-05-12. Apply to PROTOCOLS.md at consolidation.*
