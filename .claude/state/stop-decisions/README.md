# Stop-decision log

Per continuation-discipline skill (2026-05-14, Founder-ratified).

Every stop attempt logs an entry per `<YYYY-MM-DD>.ndjson` in this dir.
Founder reviews periodically + marks VALID vs FALSE_STOP.

Entry schema:

```json
{
  "timestamp": "<ISO>",
  "ship_id": "<from current-ship.json>",
  "stop_condition_cited": "<A-G letter>",
  "evidence": "<text>",
  "queue_state": { ... },
  "founder_assessment": null,
  "was_real_stop": null,
  "false_stop_reason": null
}
```

Pattern analysis after N≥10 stops surfaces refinements to AMD-017.
