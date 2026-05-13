# parbaughs-telemetry-emit

## Description

Emit structured telemetry events inline during agent work, per TELEMETRY_PROTOCOL.md. Events stream to append-only NDJSON files in `.claude/state/telemetry/events/<date>.ndjson` and feed aggregates that drive markdown + HTML reports. Telemetry emission is mandatory at all lifecycle boundaries; failure is tolerated up to 5 occurrences per cycle.

Trigger conditions:
- Cycle starts, ends, hits budget checkpoint
- Ship starts, completes atomic unit, updates progress, completes
- Agent invocations start and end
- Discussion Bubbles start, vote cast, decision reached
- Handoffs created and acknowledged
- FIQ entries created and resolved
- Proposals created, quality-bar reviewed, Founder-decided, implemented
- Wellness checkpoints triggered
- Halts declared and resumed
- Code changes: files modified, tests added/run, commits, coverage measured
- Cost events: tokens consumed, thresholds crossed

## When to use

USE when:
- ANY lifecycle boundary event per TELEMETRY_PROTOCOL.md § 1 catalog
- Inline during agent work, NOT reconstructed after
- Before AND after work units (start + end events)
- At budget checkpoints (25%, 50%, 75%, 90%)

DO NOT use when:
- Internal thought process detail (privacy + cost)
- Per-token consumption (use per-invocation rollups)
- Code content (only file paths + line counts)
- Full discussion bubble transcripts (handoffs carry that)

## How to use

### 1. Build event JSON

```json
{
  "event_id": "<uuid-or-hash>",
  "event_type": "<category>.<subcategory>",
  "timestamp": "<ISO8601 UTC>",
  "cycle_id": "<current_cycle_id>",
  "ship_id": "<current_ship_id or null>",
  "actor": "<emitting_agent_role>",
  "tokens_consumed_delta": <integer>,
  "duration_ms": <integer or null>,
  "data": { /* event-specific payload */ }
}
```

### 2. Atomic append

```bash
# Pseudo-code; actual implementation in agent runtime
TODAY_FILE=".claude/state/telemetry/events/$(date -u +%Y-%m-%d).ndjson"
EVENT_LINE=$(echo "$EVENT_JSON" | jq -c .)
echo "$EVENT_LINE" >> "$TODAY_FILE"
```

Single `>>` redirect — one append per call. No multi-write atomicity issues. If line malformed, aggregation skips it; failure counter increments.

### 3. Emission patterns by event type

**Cycle boundary events** — emit start before any work, emit end after all work:
```
cycle.start → ... do work ... → cycle.end
```

**Activity events** — emit start/end pair for every distinct activity within cycle:
```
cycle.activity.start (activity=preflight_audit) → ... → cycle.activity.end (outcome=PASS, tokens_used=8500)
```

**Per-invocation events** — emit start when agent picks up, end when hands off:
```
agent.invocation.start (actor=Engineer) → ... → agent.invocation.end (actor=Engineer, tokens=24000)
```

**Per-handoff events** — emit when handoff written, when acknowledged:
```
handoff.created (handoff_id=..., scenario=2) → ... → handoff.acknowledged (handoff_id=..., ack_delay_seconds=180)
```

### 4. Failure handling

```bash
if ! echo "$EVENT_LINE" >> "$TODAY_FILE"; then
  log_journal "[TELEMETRY-EMIT-FAILURE] event_type=$event_type reason=<error>"
  increment_cycle_failure_counter
  
  if [ "$CYCLE_FAILURE_COUNT" -ge 5 ]; then
    declare_halt 22a "5 telemetry emission failures in cycle"
  fi
  
  # Continue cycle work; telemetry failure does not halt by itself
fi
```

### 5. Batching pattern (within cycle)

Within a cycle, events accumulate in memory and flush at:
- Cycle end (always)
- Every atomic unit completion
- Every 50 events (whichever first)

Reduces I/O while maintaining append-only semantics. Buffer flush is atomic (single `>>` of all buffered lines).

### 6. Aggregation triggers

Per TELEMETRY_PROTOCOL.md § 3.3:
- `current-snapshot.json` → every heartbeat
- `cycles.json` → every cycle end (incremental)
- `ships.json` → every ship completion
- `agents.json` → every heartbeat (incremental from events)
- `handoffs.json` → every handoff written
- `proposals.json` → every proactive cycle + every Founder review
- `waves.json` → wave close

Aggregations happen AFTER emission, not during. Pure read-from-events, compute, write-aggregate.

## Quality bar enforcement

Reject (skip emission, log warning) if:
- Event JSON malformed
- Event type not in TELEMETRY_PROTOCOL.md catalog
- Missing required universal fields
- Contains content/PII/credentials (privacy guard)
- Cycle_id is null when cycle is active

## Privacy guard

Pre-emit scrub:
- File paths OK
- File contents NEVER
- Decision summaries OK
- Full discussion bubble transcripts NEVER (stored in handoffs)
- Token counts OK
- API responses NEVER
- Test outcomes OK
- Test source code NEVER

## Cross-references

- TELEMETRY_PROTOCOL.md (event catalog + storage architecture)
- REPORT_TEMPLATES.md (downstream consumer)
- REPORT_HTML_SPEC.md (HTML report consumer)
- parbaughs-report-generate skill (paired)
- PROTOCOLS_v8_ADDENDUM.md P17
- HALT_CRITERIA_v8_ADDENDUM.md item 22
- SESSION_JOURNAL_v8_ADDENDUM.md (logging conventions)

---

## v8.1 additions

### New event types

**`report.generated`** — emitted by `parbaughs-report-generate` after every successful HTML/markdown write.

```json
{
  "event_id": "<uuid>",
  "event_type": "report.generated",
  "timestamp": "<ISO8601 UTC>",
  "cycle_id": "<current_cycle_id>",
  "ship_id": "<current_ship_id or null>",
  "actor": "parbaughs-report-generate",
  "tokens_consumed_delta": <N>,
  "duration_ms": <N>,
  "data": {
    "report_type": "dashboard" | "daily" | "weekly" | "ship" | "wave" | "quarterly"
                  | "discussion-bubbles" | "activity" | "proposals",
    "md_path": "<path or null>",
    "html_path": "<path>",
    "view_kind": "time-windowed" | "operational",
    "tokens_used": <N>,
    "entries_count": <N>
  }
}
```

`view_kind="operational"` is the discriminator that downstream aggregations use to count operational-view regens separately from time-windowed reports. Time-windowed reports tie to a date/period boundary; operational view regens tie to source-state change events (discussion bubble close, ship close, new proposal).

**`proposal.decided`** — emitted by `.claude/scripts/apply-decisions.sh` for each proposal it moves between pending/approved/rejected/deferred.

```json
{
  "event_id": "<uuid>",
  "event_type": "proposal.decided",
  "timestamp": "<ISO8601 UTC>",
  "cycle_id": "founder-decision-session",
  "ship_id": null,
  "actor": "founder",
  "tokens_consumed_delta": 0,
  "duration_ms": null,
  "data": {
    "proposal_id": "PROP-<NNN>-<slug>",
    "decision": "approve" | "reject" | "defer",
    "decided_at": "<ISO8601 UTC>",
    "applied_at": "<ISO8601 UTC>",
    "note_present": <boolean>,
    "lane": <int>,
    "source_export_generated_at": "<ISO8601 UTC>"
  }
}
```

Note text is intentionally NOT emitted in telemetry (lives only in the proposal markdown file body after apply-decisions appends it). Privacy + size discipline per § Privacy guard.

### Emission pattern: operational view regen

When `parbaughs-report-generate` regenerates an operational view, emit ONE event per view written:

```
report.generated(view_kind=operational, report_type=discussion-bubbles, html_path=docs/reports/discussion-bubbles.html, entries_count=12, tokens_used=2100)
```

Even if regen is triggered by an event (discussion bubble close, ship close, new proposal), the regen itself emits its own telemetry event. Triggering event and regen event are linked via timestamp ordering, not via foreign-key in the schema.

### Aggregation trigger additions

Per § 6 update:
- `report.generated` events feed into a new aggregate `reports.json`:
  - Counts per report_type and view_kind
  - Median + p99 tokens_used per report_type
  - Last regen timestamp per operational view (used by index.html to show "Last updated")
  - Regen frequency per operational view (used to detect debounce failures — e.g., discussion-bubbles.html regen firing 50x in an hour signals a runaway loop)

Aggregate `reports.json` is updated every heartbeat from the events stream (incremental, append-only friendly).

### v8.1 cross-references

- PROTOCOLS_v8.1_ADDENDUM.md P18 (operational view discipline)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 23 (operational view source-state failures — these emit `report.generation_failed` if added in v8.2; for v8.1, log to journal only)
- `.claude/scripts/apply-decisions.sh` (sole sanctioned emitter of `proposal.decided` events; agents must not emit `proposal.decided` directly)
