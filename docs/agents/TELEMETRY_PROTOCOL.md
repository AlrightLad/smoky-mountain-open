# TELEMETRY_PROTOCOL.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Define what telemetry data to capture, where stored, how aggregated. Feeds markdown + HTML reports.

---

## 0 — Core principle

Telemetry is captured INLINE during agent work, not reconstructed after-the-fact. Every cycle, ship, discussion bubble, handoff emits structured telemetry events. Aggregation happens at report generation time.

Telemetry data is the SOURCE OF TRUTH for reports. Reports are READ-ONLY views over telemetry data. Editing a report does NOT change underlying data.

---

## 1 — Telemetry event categories

### 1.1 Cycle events
Captured at cycle lifecycle boundaries:
- `cycle.start` — heartbeat/ship/proactive cycle begins
- `cycle.end` — cycle exits (success, halt, overrun, skip)
- `cycle.activity.start` — activity within cycle begins
- `cycle.activity.end` — activity within cycle ends
- `cycle.budget.checkpoint` — 25%/50%/75%/90% budget consumed

### 1.2 Ship events
Captured throughout ship execution:
- `ship.start` — ship work begins
- `ship.preflight.start` / `ship.preflight.end`
- `ship.execution.start` / `ship.execution.end`
- `ship.retrospective.start` / `ship.retrospective.end`
- `ship.atomic_unit.complete` — each atomic unit
- `ship.progress.update` — progress percentage update
- `ship.complete` — ship finishes (success or deferred)

### 1.3 Agent events
Captured per agent participation:
- `agent.invocation.start` — agent picks up work
- `agent.invocation.end` — agent hands off
- `agent.tokens.consumed` — token usage delta
- `agent.skill.invoked` — agent uses a skill

### 1.4 Discussion Bubble events
Captured per discussion bubble:
- `discussion_bubble.start` — discussion bubble convenes
- `discussion_bubble.vote.cast` — voter casts vote
- `discussion_bubble.input.contributed` — contributing/discussion-bubble-only agent contributes
- `discussion_bubble.decision` — discussion bubble closes with decision
- `discussion_bubble.tiebreak` — Orchestrator tie-breaks

### 1.5 Handoff events
Captured per handoff per HANDOFF_PROTOCOL.md:
- `handoff.created` — handoff note written
- `handoff.acknowledged` — receiving actor acknowledges
- `handoff.resumed` — receiving actor resumes work

### 1.6 FIQ events
Captured per FIQ lifecycle:
- `fiq.created` — entry added
- `fiq.resolved` — Founder resolves
- `fiq.stale_flagged` — entry crosses staleness threshold

### 1.7 Proposal events
Captured per proactive proposal lifecycle:
- `proposal.created` — proactive cycle creates
- `proposal.quality_bar.passed` — Critic approves at quality bar
- `proposal.quality_bar.rejected` — Critic rejects pre-queue
- `proposal.founder.accepted` — Founder accepts
- `proposal.founder.rejected` — Founder rejects
- `proposal.founder.deferred` — Founder defers
- `proposal.implemented` — ship cycle implements

### 1.8 Wellness events
Captured per wellness checkpoint:
- `wellness.threshold_reached` — agent hits threshold
- `wellness.checkpoint.start` — checkpoint begins
- `wellness.checkpoint.end` — checkpoint completes (clean/drift/escalate)
- `wellness.halt.declared` — wellness halt triggered

### 1.9 Halt events
Captured per HALT trigger:
- `halt.declared` — HALT item triggers
- `halt.preconditions_met` — resume conditions satisfied
- `halt.resumed` — work resumes

### 1.10 Code events
Captured per code change:
- `code.file.modified` — file edited
- `code.test.added` — test added
- `code.test.run` — test executed (pass/fail)
- `code.commit` — commit created
- `code.coverage.measured` — coverage measurement
- `code.bundle.size_measured` — bundle size measurement

### 1.11 Cost events
Captured per cost-relevant action:
- `cost.tokens.consumed` — token consumption delta
- `cost.cycle.cost` — full cycle cost at end
- `cost.threshold.crossed` — threshold breach (per cost-discipline 3i.5)

---

## 2 — Telemetry event format

Every event is a JSON object with universal fields plus event-specific fields:

```json
{
  "event_id": "uuid-or-hash",
  "event_type": "cycle.start | ship.progress.update | ...",
  "timestamp": "2026-05-19T11:00:00Z",
  "cycle_id": "ship-20260519-1100",
  "ship_id": "W1.S4",
  "actor": "Engineer | Critic | ...",
  "tokens_consumed_delta": 1500,
  "duration_ms": 240,
  "data": { /* event-specific payload */ }
}
```

Event-specific payload examples in TELEMETRY_EVENT_SPEC (below).

---

## 3 — Storage architecture

### 3.1 Event streams (raw telemetry)

Events written to append-only NDJSON files (newline-delimited JSON):

```
.claude/state/telemetry/
├── events/
│   ├── 2026-05-19.ndjson      # daily event stream
│   ├── 2026-05-20.ndjson
│   └── ...
├── aggregates/
│   ├── cycles.json            # all cycles, aggregated
│   ├── ships.json             # all ships, aggregated
│   ├── agents.json            # per-agent rollup
│   ├── handoffs.json          # all handoffs
│   ├── proposals.json         # all proposals
│   ├── waves.json             # per-wave rollup
│   └── current-snapshot.json  # current state (regenerated each heartbeat)
└── retention/
    └── archive-2026-Q1.tar.gz  # quarterly archives
```

### 3.2 Append-only discipline

- Event files NEVER edited after write (only appended)
- Concurrent appends serialized via cycle lock
- Atomic appends: build line in memory, single `>>` redirect
- Each line is valid JSON; corrupted lines logged + skipped in aggregation

### 3.3 Aggregation pattern

Aggregates regenerated at known times (not on every event):
- `current-snapshot.json` → every heartbeat
- `cycles.json` → every cycle end (incremental update)
- `ships.json` → every ship completion (incremental update)
- `agents.json` → every heartbeat (incremental update from events)
- `handoffs.json` → every handoff written (incremental update)
- `proposals.json` → every proactive cycle + every Founder review
- `waves.json` → wave close (manual or auto-detected)

### 3.4 Retention

- Raw events kept 90 days
- Aggregates kept indefinitely (small, useful for trends)
- After 90 days, events archived to compressed quarterly tarballs in `retention/`
- Archived events still readable for historical reports

---

## 4 — Emission patterns

### 4.1 Inline emission

Every agent emits telemetry inline as it works. Pattern:

```bash
# Pseudo-code (actual implementation in parbaughs-telemetry-emit skill)
emit_event "cycle.activity.start" '{"activity": "preflight_audit", "agent": "Critic"}'
# ... do work ...
emit_event "cycle.activity.end" '{"activity": "preflight_audit", "outcome": "PASS", "tokens_used": 8500}'
```

### 4.2 Batched emission

Within a cycle, events accumulated in memory then flushed at cycle end or every N events (whichever first). Reduces I/O.

### 4.3 Failure handling

If telemetry emission fails:
- Log to journal: `[TELEMETRY-EMIT-FAILURE] event_type={type} reason={reason}`
- Continue cycle work (telemetry failure does NOT halt cycle)
- If 5+ emission failures in one cycle → HALT_CRITERIA item 22 (telemetry data integrity)

### 4.4 What gets emitted vs not

Emit:
- All lifecycle boundary events
- All decision points
- All handoffs
- All token consumption deltas (per agent invocation)
- All file modifications
- All test runs
- All commits
- All proposals/FIQ/halts

Do NOT emit:
- Internal thought process details (privacy + cost)
- Full code content (just file paths + line counts)
- Full discussion bubble transcripts (stored separately in handoffs)
- Per-token consumption (just per-invocation rollups)

---

## 5 — Aggregation methodology

### 5.1 cycles.json structure

```json
{
  "cycles": [
    {
      "cycle_id": "ship-20260519-1100",
      "type": "ship",
      "started_at": "2026-05-19T11:00:00Z",
      "ended_at": "2026-05-19T12:45:00Z",
      "duration_seconds": 6300,
      "tokens_consumed": 187000,
      "outcome": "SUCCESS",
      "ship_id": "W1.S4",
      "ship_progress_delta_pct": 30,
      "bubbles_run": 2,
      "handoffs_written": 5,
      "fiq_created": 2,
      "wellness_checkpoints": 1,
      "tokens_by_role": {
        "Engineer": 120000,
        "Critic": 45000,
        "Orchestrator": 15000,
        "UIPolisher": 7000
      },
      "tokens_by_activity": {
        "preflight": 30000,
        "execution": 100000,
        "discussion-bubbles": 25000,
        "retrospective": 22000,
        "wellness": 10000
      },
      "files_modified": 4,
      "tests_added": 6,
      "tests_passing": 6,
      "commits": 4
    }
  ]
}
```

### 5.2 ships.json structure

```json
{
  "ships": [
    {
      "ship_id": "W1.S4",
      "wave_id": "W1",
      "status": "completed",
      "started_at": "2026-05-15T11:00:00Z",
      "completed_at": "2026-05-19T12:45:00Z",
      "cycles_consumed": 5,
      "total_duration_seconds": 28800,
      "total_tokens": 720000,
      "tokens_by_phase": {
        "preflight": 60000,
        "execution": 500000,
        "discussion-bubbles": 80000,
        "retrospective": 60000,
        "wellness": 20000
      },
      "tokens_by_role": {
        "Engineer": 480000,
        "Critic": 180000,
        "Orchestrator": 30000,
        "UIPolisher": 30000
      },
      "bubbles_run": 8,
      "handoffs_written": 22,
      "fiq_created": 5,
      "fiq_resolved_during_ship": 3,
      "wellness_checkpoints": 4,
      "wellness_halts": 0,
      "files_modified": 18,
      "tests_added": 24,
      "code_lines_added": 1240,
      "code_lines_removed": 380,
      "test_lines_added": 680,
      "coverage_at_start_pct": 85.2,
      "coverage_at_end_pct": 87.8,
      "commits": 14,
      "linked_proposals": ["PROP-007", "PROP-012"]
    }
  ]
}
```

### 5.3 agents.json structure

```json
{
  "agents": {
    "Engineer": {
      "total_invocations": 124,
      "total_tokens": 6800000,
      "total_duration_seconds": 432000,
      "ships_participated": 8,
      "bubbles_voted": 22,
      "wellness_checkpoints_clean": 18,
      "wellness_checkpoints_drift": 1,
      "skills_invoked": {
        "parbaughs-deep-research": 12,
        "parbaughs-goal-completion-verify": 124,
        "parbaughs-wellness-checkpoint": 19,
        "parbaughs-handoff-note": 88
      },
      "average_tokens_per_invocation": 54800
    },
    "Critic": {
      /* similar */
    }
  }
}
```

### 5.4 current-snapshot.json structure

Regenerated each heartbeat. Quick state-of-the-system view:

```json
{
  "generated_at": "2026-05-19T16:00:00Z",
  "current_cycle": {
    "active_cycle_id": null,
    "last_cycle": "heartbeat-20260519-1600",
    "next_scheduled": {
      "heartbeat": "2026-05-19T20:00:00Z",
      "ship": "2026-05-20T11:00:00Z",
      "proactive": "2026-05-25T01:00:00Z"
    }
  },
  "current_ship": {
    "ship_id": "W1.S5",
    "progress_pct": 35,
    "started_at": "2026-05-19T11:00:00Z",
    "expected_completion": "2026-05-21T11:00:00Z"
  },
  "current_wave": {
    "wave_id": "W1",
    "ships_completed": 4,
    "ships_total": 20,
    "wave_progress_pct": 20
  },
  "queue_health": {
    "fiq_active": 4,
    "fiq_blocking": 0,
    "fiq_stale": 0,
    "proposals_pending_review": 8,
    "proposals_approved_unimplemented": 2
  },
  "cost_state": {
    "last_24h_tokens": 480000,
    "last_7d_tokens": 3200000,
    "weekly_budget_consumed_pct": 91,
    "threshold_breached": false
  },
  "agent_state": {
    "agents_past_wellness_threshold": 0,
    "agents_in_rest_cycle": 0,
    "active_handoffs_pending_ack": 0
  },
  "halt_state": {
    "cron_paused": false,
    "any_halt_active": false,
    "last_halt": null
  }
}
```

---

## 6 — Report data layer

Reports are generated FROM these aggregate files. Generation pattern:

```
parbaughs-report-generate skill:
  1. Read aggregate files
  2. Compute report-specific metrics from aggregates
  3. Render markdown report from template
  4. Render HTML report from template (embed data inline as JSON)
  5. Write to docs/reports/
```

Per REPORT_TEMPLATES.md, six report types are generated:
1. Dashboard (current snapshot) — heartbeat
2. Daily — heartbeat (end of day)
3. Weekly — proactive cycle
4. Ship — ship completion
5. Wave — wave close
6. Quarterly — manual trigger

---

## 7 — Token cost of telemetry

Telemetry overhead per cycle:

| Cycle type | Telemetry overhead |
|---|---|
| Heartbeat | ~5k tokens (event emission + aggregation) |
| Ship | ~10k tokens (more events + report generation at completion) |
| Proactive | ~8k tokens (more events + report generation) |

Total weekly overhead: ~210k (heartbeat) + ~70k (ships) + ~8k (proactive) = ~290k tokens/week.

Adds ~9% overhead on top of existing ~3.2M/week → new steady state ~3.5M/week.

---

## 8 — Integration with handoffs

Every handoff written per HANDOFF_PROTOCOL.md emits telemetry event:

```json
{
  "event_type": "handoff.created",
  "timestamp": "...",
  "data": {
    "handoff_id": "...",
    "scenario": 1,
    "from_actor": "...",
    "to_actor": "...",
    "handoff_size_bytes": 1240
  }
}
```

Receiving actor's acknowledgment emits:

```json
{
  "event_type": "handoff.acknowledged",
  "data": {
    "handoff_id": "...",
    "ack_delay_seconds": 12
  }
}
```

Long ack_delay values surface in reports as "handoff backlog" signal.

---

## 9 — Privacy + retention

### 9.1 What we DO NOT emit
- Code content (only file paths + line counts)
- Founder personal data
- API keys, secrets, credentials
- Production data
- User PII (when production telemetry layer added in future)

### 9.2 What we DO emit
- Cycle metadata
- Agent activity counts
- Token usage rollups
- Decision outcomes (not full content)
- File paths + change sizes
- Test results

### 9.3 Retention discipline
- 90-day raw event retention
- Indefinite aggregate retention
- Quarterly archive of raw events
- Founder can purge any time via `.claude/scripts/telemetry-purge.sh` (not auto)

---

## 10 — Cross-references

- `REPORT_TEMPLATES.md` (how telemetry becomes reports)
- `REPORT_HTML_SPEC.md` (HTML rendering spec)
- `parbaughs-telemetry-emit` skill (emission pattern)
- `parbaughs-report-generate` skill (report generation)
- `HANDOFF_PROTOCOL.md` (handoff events feed telemetry)
- `HEADLESS_OPERATION_PROTOCOL.md` (cycle events feed telemetry)
- `PROTOCOLS_v8_ADDENDUM.md` P17
- `HALT_CRITERIA_v8_ADDENDUM.md` item 22

---

*Document authored 2026-05-12. Locked Founder ratification.*
