# SESSION_JOURNAL_v8_ADDENDUM.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** New entry types for `SESSION_JOURNAL.md` covering handoffs + telemetry. Apply at consolidation.

---

## New entry types

All entries use ISO 8601 UTC timestamps.

### Handoff entries

```
[2026-05-19T12:45:00Z] [HANDOFF-WRITE] handoff_id=c2c-20260519-1245-W1S4. scenario=1 (cycle-to-cycle). from=ship-20260519-1100. to=next-ship-cycle. ship=W1.S4 at 60%.

[2026-05-19T13:00:00Z] [HANDOFF-WRITE] handoff_id=a2a-ship-20260519-1100-03-engineer-to-critic. scenario=2 (agent-to-agent). phase=execution complete; critic audit pending.

[2026-05-19T13:05:00Z] [HANDOFF-ACK] handoff_id=a2a-ship-20260519-1100-03-engineer-to-critic. actor=Critic. ack_delay=300s.

[2026-05-20T11:05:00Z] [HANDOFF-RESUME] handoff_id=c2c-20260519-1245-W1S4. actor=ship-20260520-1100. state_verified=true. proceeding with next_action.

[2026-05-20T11:20:00Z] [HANDOFF-VERIFICATION-FAIL] handoff_id=c2c-20260519-1245-W1S4. files_modified mismatch detected. HALT item 21d triggered.
```

### Telemetry entries

```
[2026-05-19T11:00:00Z] [TELEMETRY-EMIT] event=cycle.start cycle_id=ship-20260519-1100. tokens=0.

[2026-05-19T12:45:00Z] [TELEMETRY-EMIT] event=cycle.end cycle_id=ship-20260519-1100. tokens=187000. duration_seconds=6300. outcome=SUCCESS.

[2026-05-19T16:18:00Z] [TELEMETRY-AGGREGATE] aggregates updated: cycles, agents, current-snapshot.

[2026-05-19T16:18:30Z] [TELEMETRY-REPORT-GENERATE] type=dashboard. md_path=.claude/state/reports/dashboard.md. html_path=docs/reports/dashboard.html. generation_tokens=5200.

[2026-05-19T11:15:00Z] [TELEMETRY-EMIT-FAILURE] event=ship.atomic_unit.complete. reason="disk full". cumulative_failures_this_cycle=1.

[2026-05-19T11:30:00Z] [TELEMETRY-EMIT-FAILURE] cumulative_failures_this_cycle=5. HALT item 22a triggered.
```

### Report generation entries

```
[2026-05-19T23:55:00Z] [REPORT-DAILY-GENERATE] date=2026-05-19. cycles_summarized=7. tokens=4800. md+html written.

[2026-05-20T01:50:00Z] [REPORT-WEEKLY-GENERATE] week=2026-W20. ships_closed=3. tokens=8400. md+html written.

[2026-05-19T12:45:00Z] [REPORT-SHIP-GENERATE] ship=W1.S4. cycles_consumed=5. tokens=3200. md+html written.

[2026-06-15T10:00:00Z] [REPORT-WAVE-GENERATE] wave=W1. ships=20. tokens=11200. md+html written. wave-to-wave handoff also written.
```

### Halt entries (v8 additions)

```
[2026-05-19T13:00:00Z] [HALT-HANDOFF-FAILURE] subtype=21a (missing handoff). cycle_id=ship-20260519-1100. transition=engineer-to-critic. Corrective action: outgoing actor writes corrected handoff.

[2026-05-20T11:20:00Z] [HALT-HANDOFF-FAILURE] subtype=21d (stale handoff). handoff_id=c2c-20260519-1245. files_modified drift detected. FIQ-023 created priority=high.

[2026-05-19T11:30:00Z] [HALT-TELEMETRY-INTEGRITY] subtype=22a (5+ emission failures). cycle_id=ship-20260519-1100. cumulative_failures=5. Cycle work paused.

[2026-05-19T17:00:00Z] [HALT-TELEMETRY-INTEGRITY] subtype=22b (corrupted NDJSON). file=.claude/state/telemetry/events/2026-05-19.ndjson. Last 3 lines malformed. FIQ-024 created.
```

### Handoff scenario summary entries (end of cycle)

```
[2026-05-19T12:45:00Z] [HANDOFFS-SUMMARY] cycle_id=ship-20260519-1100. Total handoffs written this cycle: 5. By scenario: 1×scenario-1, 3×scenario-2, 1×scenario-8. Avg ack delay: 180s. Pending acks at cycle end: 0.
```

---

## Updated journal hygiene rules

### Search patterns

- `grep "[HANDOFF-WRITE]" SESSION_JOURNAL.md` — handoffs created
- `grep "[HANDOFF-ACK]" SESSION_JOURNAL.md` — handoffs acknowledged
- `grep "[HANDOFF-RESUME]" SESSION_JOURNAL.md` — handoffs consumed at resume
- `grep "[HANDOFF-VERIFICATION-FAIL]" SESSION_JOURNAL.md` — verification failures
- `grep "[TELEMETRY-EMIT-FAILURE]" SESSION_JOURNAL.md` — telemetry emission failures
- `grep "[TELEMETRY-AGGREGATE]" SESSION_JOURNAL.md` — aggregation events
- `grep "[REPORT-" SESSION_JOURNAL.md` — report generation history
- `grep "[HALT-HANDOFF" SESSION_JOURNAL.md` — handoff halts
- `grep "[HALT-TELEMETRY" SESSION_JOURNAL.md` — telemetry halts

### Critic audit additions

Critic's journal audit checklist extends to verify:

- Every transition has matching HANDOFF-WRITE entry
- Every HANDOFF-WRITE has matching HANDOFF-ACK (within reasonable time)
- Every cycle has matching TELEMETRY-EMIT cycle.start + cycle.end pair
- Every cycle has matching TELEMETRY-AGGREGATE entry
- Every heartbeat has matching REPORT-DASHBOARD-GENERATE entry
- Every ship completion has matching REPORT-SHIP-GENERATE entry
- Every weekly proactive cycle has matching REPORT-WEEKLY-GENERATE entry
- HALT-HANDOFF-FAILURE entries have matching resolution entries
- HALT-TELEMETRY-INTEGRITY entries have matching resolution entries

### Volume expectations (steady state)

Per week:
- HANDOFF-WRITE entries: 100-200 (10-30 per ship cycle, multiple ships per week)
- HANDOFF-ACK entries: matching count
- HANDOFF-RESUME entries: 7-10 (per ship cycle resumption)
- TELEMETRY-EMIT entries (in journal — only major lifecycle): 50-100 (cycle starts/ends)
- TELEMETRY-AGGREGATE entries: 50-60 (per heartbeat + per ship + per proactive)
- REPORT-DASHBOARD-GENERATE: 42 (one per heartbeat)
- REPORT-DAILY-GENERATE: 7 (one per day)
- REPORT-WEEKLY-GENERATE: 1
- REPORT-SHIP-GENERATE: 0-3 (per ships closed that week)
- HALT-HANDOFF-FAILURE: 0-1 (anomaly if higher)
- HALT-TELEMETRY-INTEGRITY: 0 (anomaly if any)

---

## Cross-references

- `HANDOFF_PROTOCOL.md` (handoff scenarios)
- `HANDOFF_NOTE_TEMPLATES.md` (handoff templates)
- `TELEMETRY_PROTOCOL.md` (telemetry events)
- `REPORT_TEMPLATES.md` (report types)
- `HALT_CRITERIA_v8_ADDENDUM.md` (items 21-22)
- `PROTOCOLS_v8_ADDENDUM.md` P16 + P17

---

*Document authored 2026-05-12. Apply to SESSION_JOURNAL.md at consolidation.*
