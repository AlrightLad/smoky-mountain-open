# Phase T1 — Token meter source-chain investigation — 2026-05-18

## TL;DR

The token meter aggregates correctly from the data PARBAUGHS scripts emit, but it **never reads Claude Code's own session transcripts** at `~/.claude/projects/C--Users-Zach-smoky-mountain-open/*.jsonl`. Those JSONL files contain real `usage` blocks per assistant response — the actual ground truth for Claude Code-driven token spend. ECC's `scripts/hooks/cost-tracker.js` shows the canonical pattern: read `transcript_path` from the Stop hook payload, scan for `entry.type === 'assistant'` entries, sum `message.usage.{input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens}` per model, emit to `~/.claude/metrics/costs.jsonl`.

The fix is straightforward: write an adapter that scans the session JSONLs and emits real telemetry events into the existing PARBAUGHS pipeline at `.claude/state/telemetry/events/{date}.ndjson`. The aggregator then aggregates real data instead of mostly-estimated data.

## Current data flow (verified)

```
SOURCES                          AGGREGATOR              SNAPSHOT             DASHBOARD
.claude/state/telemetry/      → aggregate-token-       → token-usage-      → docs/reports/
  events/*.ndjson                 usage.py                snapshot.json        token-usage.html
  (Source A: telemetry-real)                                                   (regen-token-
                                                                                usage.py swaps
scripts/cron/logs/            → (Source B: cron-log                            <script id=
  cron-*.log                      estimated, INPUT_RATE,                       "report-data">)
                                  OUTPUT_RATE constants)

telemetry/manual-quota-log    → (Source C: Founder
  .ndjson                         paste from console)

quota-status.json (PROP-003.a → (sidecar quota state,
  sidecar)                        merged into snapshot.quota_status)
```

## Current state of data (P9 trace)

| Field | Value | Source | Status |
|---|---|---|---|
| `all_time.real` | 102,000 | 1 telemetry event on 2026-05-13 | ⚠ Sparse — should be much larger; missing session-transcript scan |
| `all_time.estimated` | 7,292,040 | 2,094 cron-log heuristic events | ✓ Source B working |
| `all_time.manual` | 0 | Founder hasn't pasted from console | Expected — Source C is opt-in |
| `_counts.real_events` | 1 | One PARBAUGHS-emitted real event | ⚠ Same gap as above |
| `quota_status.weekly_tokens` | 102,000 | Derived from real events | ⚠ Same gap |
| `quota_status.data_source` | "auto-derived" | Sidecar inference from measured cycle telemetry | ✓ Working |
| `by_cron.sidecar.*` | All zeros | Sidecar runs but emits nothing tagged "sidecar" | ⚠ Sidecar isn't writing to telemetry events |

P9 verdict: **DATA IS REAL BUT INCOMPLETE.** Numbers shown are accurate as far as the data PARBAUGHS captures, but the meter dramatically undercounts real Claude Code session work because session transcripts aren't ingested.

## The gap

`~/.claude/projects/C--Users-Zach-smoky-mountain-open/` contains **28 JSONL files totaling 137 MB** of session transcripts going back to early May. Each "assistant" entry in these files has a `message.usage` block like:

```json
{
  "input_tokens": 6,
  "cache_creation_input_tokens": 44192,
  "cache_read_input_tokens": 21573,
  "output_tokens": 511,
  "iterations": [...]
}
```

Plus model name in `message.model` (e.g., `"claude-opus-4-7"`), session ID, timestamp, and tool-use markers in `content[]`.

This is the missing data path. PARBAUGHS scripts have never scanned these files.

## ECC's pattern (cost-tracker.js)

ECC's hook activates on `Stop` event, receives `transcript_path` from harness payload, scans the JSONL, sums usage per model, applies per-1M-token billing rates, appends to `~/.claude/metrics/costs.jsonl`. Rate table (Opus 4.7 lines):

```js
opus: { in: 15.00, out: 75.0, cacheWrite: 18.75, cacheRead: 1.50 }  // USD per 1M tokens
```

Cumulative behavior: Stop fires per assistant response, so each row is the running session total. Per-session cost = last row per session_id. Per-day spend = aggregate.

## Proposed fix (the wire-up)

Add a new aggregator pass (or pre-aggregator script) that:

1. Enumerates `~/.claude/projects/C--Users-Zach-smoky-mountain-open/*.jsonl`.
2. For each file:
   - Read line-by-line.
   - For each line with `entry.type === "assistant"` and `entry.message.usage`:
     - Extract `usage.{input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens}`.
     - Extract `message.model`, `timestamp`, `sessionId`, `cwd`.
     - Emit a telemetry event to `.claude/state/telemetry/events/{day}.ndjson` with:
       ```json
       {
         "type": "token_usage_real",
         "ts": "<timestamp>",
         "session_id": "<sessionId>",
         "model": "<model>",
         "tokens": {
           "input": <int>,
           "output": <int>,
           "cache_read": <int>,
           "cache_write": <int>,
           "total": <sum>
         },
         "tags": {
           "agent_role": "<inferred>",
           "work_category": "<inferred>",
           "ship": "<inferred from session metadata or claude.md>"
         }
       }
       ```
3. Use a per-file cursor so the scanner is idempotent (don't double-count).
4. Run as part of `scripts/regen-all.sh` (or on-demand) before `aggregate-token-usage.py`.

Tagging design (per spec T2 three-orthogonal-tags):

- **agent_role**: derived from session metadata. PARBAUGHS sessions are "main/orchestrator" by default; subagent sessions can be tagged via parentSessionId.
- **work_category**: derived from cwd + working branch. Sessions in this repo on main = "dashboard work" or "app feature work" depending on commit messages around that time.
- **session_id**: native to the JSONL.

Retroactive tagging: feasible for past 28 sessions by mapping `sessionId` → git log around that timestamp to infer the work. Best-effort; mark unknown sessions as `"unattributed"` (already supported in snapshot schema).

## Decision

Adopt session-transcript scanning. Build it as `scripts/ingest-session-transcripts.py` (new), call it before `aggregate-token-usage.py` in `scripts/regen-all.sh`.

## What this unlocks

- Real numbers in `all_time.real` (currently 102k; should be in the millions).
- Real numbers in `_counts.real_events`.
- Three-view toggleable pie chart slices that actually attribute spend (currently most "by_ship" goes to "unattributed").
- Pre-Phase T7 Taste score won't be blocked on "dashboard shows mostly zeros."
- D17-D20 (token meter DONE WHEN) become achievable in a single ship.

## Outstanding question

`by_cron.sidecar` is all zeros despite PROP-003.a sidecar shipping. Likely the sidecar writes to `quota-status.json` (which DOES populate `snapshot.quota_status`) but not to `.claude/state/telemetry/events/`. That's actually OK because the sidecar's output is the quota-status block, not session events. The all-zero "sidecar" bucket in by_cron is cosmetic — should be DROPPED from snapshot since sidecar doesn't emit session-tagged events.

## Next steps (this session)

1. Implement `scripts/ingest-session-transcripts.py`
2. Run it; verify telemetry events emit correctly
3. Run aggregator; verify snapshot updates with real data
4. Regen token-usage.html; V1 capture to confirm
5. Commit ship.
