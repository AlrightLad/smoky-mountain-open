# Telemetry Ingestion Audit — Token Usage

**Captured:** 2026-05-13 (Token Usage Observability Dashboard build, TU-1)
**Source files audited:** `.claude/state/telemetry/events/*.ndjson` (1 file present: `2026-05-13.ndjson`)

---

## Event types + fields present

| Event type | Token-related fields | Agent attribution | Ship attribution |
|------------|----------------------|-------------------|------------------|
| `cycle.budget.checkpoint` | `usage_pct`, `weekly_tokens_cap`, `weekly_tokens_consumed`, `quota_type` | no (`cycle_id` only) | no |
| `cycle.start` | `token_budget_allocated` (budget, not actual) | yes (`agent`) | yes (`ship_id`) |
| `cycle.paused` | `tokens_consumed_since_last_rest`, `usage_pct` | yes (`agent`) | no |
| `cycle.resumed` | `usage_pct_at_resume`, `pause_duration_seconds` | yes (`agent`) | no |
| `cycle.end` | (none — outcome + atomic-units only) | no | no |
| `cycle.maintenance.complete` | (none) | no | no |
| `cron.overnight-triage.complete` | `duration_seconds` | no (implicit: orchestration) | no |
| `proposal.shipped_scan.complete` | (none) | no | no |
| `ship.atomic_unit.complete` | (none) | no | yes (`ship_id`) |

## Source A — Real events the ingestor can scrape

| Source | Extraction method | Confidence |
|--------|---------------------|-----------|
| `cycle.budget.checkpoint.weekly_tokens_consumed` | Latest checkpoint event per quota_type = current cumulative consumption | **Real** (Anthropic-derived if surfaced; check upstream) |
| `cycle.paused.tokens_consumed_since_last_rest` | Per-pause delta attributable to `agent` | **Real** when present (semantic field implies actual count) |
| Two checkpoint events bracketing a `cycle.start`/`cycle.end` pair | Compute delta consumption during that cycle, attribute to its `agent`/`ship_id` | **Real** |

**Gap:** none of these are per-Anthropic-API-call `usage.input_tokens` + `usage.output_tokens`. They're aggregate roll-ups. The granularity is "delta consumed during cycle X" rather than "tokens consumed by agent Y reading file Z."

**Decision for ingestor:** treat `cycle.budget.checkpoint.weekly_tokens_consumed` as the canonical real-counter axis. Use deltas between consecutive checkpoints to attribute consumption to the cycle/agent/ship that spanned them.

## Source B — Cron-log heuristic estimation

For each cron pipeline (downloads-watcher, maintenance, overnight-triage), the cron's start/end telemetry (or its log file's first-line + last-line timestamps) gives a session duration. Estimation:

```
input_estimate  = duration_seconds * INPUT_RATE_TOKENS_PER_SEC
output_estimate = duration_seconds * OUTPUT_RATE_TOKENS_PER_SEC
```

Per Founder spec: `INPUT_RATE = 100` tokens/sec, `OUTPUT_RATE = 30` tokens/sec (Opus reading + writing rates). These live as named constants at the top of `aggregate-token-usage.py` for easy recalibration.

**Confidence:** estimated. Mark events with `source_type='estimated'`.

**Gap to be aware of:** the `downloads-watcher` cron does NOT invoke Claude API at all — its work is pure file-shuffling + bash + Python. Estimating tokens for it would be wrong. Treat downloads-watcher session durations as **non-Claude** and either skip them OR attribute to `cron_source='downloads-watcher'` with `tokens=0`. Same for `maintenance` (it runs `wsl update`, `pip install`, `regen-all.ps1` — no Claude API).

**Only `overnight-triage` launches Claude Code.** Source B's estimation should ONLY apply to overnight-triage sessions. Downloads-watcher and maintenance get cron.start/end emitted (for activity visibility) but with `claude_invoked: false` so the ingestor knows to set their token_estimate to 0.

## Source C — Manual paste

`.claude/state/telemetry/manual-quota-log.ndjson` — Founder appends from `scripts/refresh-quota-manual.ps1`. Schema:

```json
{
  "timestamp": "<ISO>",
  "scope": "session" | "weekly" | "all-time" | "daily-tokens" | "weekly-tokens" | "claude-design",
  "tokens_used": <int>,
  "source": "founder-paste",
  "note": "<string, optional>"
}
```

Treated as ground truth for the time range. When manual entries overlap with Source A or B estimates, manual wins for the all-time-display number; the breakdown still shows all three.

## Ingestor contract

`scripts/aggregate-token-usage.py`:

1. Read cursor `.claude/state/telemetry/aggregates/.token-usage-cursor.json` (`{"last_processed_event_ts": "<ISO>"}`).
2. Scan all `events/*.ndjson` files for events after cursor.
3. For each cycle-bracketed sequence, derive Source A real attribution (`agent`, `ship_id`, `cron_source`).
4. For each cron-pipeline session that invoked Claude (overnight-triage only for now), derive Source B estimation.
5. Read `manual-quota-log.ndjson` for Source C.
6. Merge into `token-usage-snapshot.json` with the schema specified in the directive.
7. Update cursor to the latest event timestamp scanned.

Idempotent: re-running with no new events is a no-op.

## Confidence summary

| Source | Confidence | Visual treatment |
|--------|------------|-------------------|
| A (telemetry-real) | High when present | Solid color |
| B (estimated) | Medium (calibration-dependent) | Hatched/striped pattern |
| C (manual) | Highest (Founder paste from claude.ai) | Dot prefix + distinct badge |

The all-time panel always shows three distinct numbers; never blended.
