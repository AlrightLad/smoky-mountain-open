---
build: token-usage observability dashboard
status: complete (pending Founder commit review)
authored_by: claude-code
authored_at: 2026-05-13T22:35:00Z
---

# Token Usage Observability Dashboard — Build Summary

Pure instrumentation. Surfaces where Claude tokens are consumed across agents, crons,
and ships, with three explicitly-labeled sources. Not a safety rail, not quota
gating — just observability.

## Three-source model

| Source | Type | Label | Visual marker | Origin |
|--------|------|-------|---------------|--------|
| A | Real | `real` | solid bar | telemetry events with token deltas (`cycle.budget.checkpoint`, `cycle.paused`) |
| B | Estimated | `estimated` | hatched/striped bar | cron-log heuristic (INPUT_RATE_TOKENS_PER_SEC=100, OUTPUT_RATE_TOKENS_PER_SEC=30); applied only to crons that invoke Claude (currently overnight-triage) |
| C | Manual | `manual` | `*`-prefix | Founder paste via `scripts/refresh-quota-manual.ps1` (% of QUOTA_CAPS) |

**Rule: never blend.** Each panel surfaces real / estimated / manual as separate
buckets. `all_time.real + all_time.estimated + all_time.manual` is shown as three
separate stat tiles, not summed.

## Deliverables

### Ingestion (Deliverable 1)
- **`scripts/aggregate-token-usage.py`** — three scanners (Source A telemetry,
  Source B cron-log heuristic, Source C manual paste). Top-of-file CONSTANTS for
  recalibration: `INPUT_RATE_TOKENS_PER_SEC`, `OUTPUT_RATE_TOKENS_PER_SEC`,
  `QUOTA_CAPS`, `CRON_INVOKES_CLAUDE`. Idempotent via `.token-usage-cursor.json`.
  Writes `.claude/state/telemetry/aggregates/token-usage-snapshot.json` with
  `by_agent` / `by_cron` / `by_ship` / `all_time` panels.
- **`scripts/refresh-quota-manual.ps1`** — Founder prompts for 4 percentages
  (session %, weekly all, weekly Sonnet, weekly Claude Design) + optional raw
  all-time. Multiplies by `$caps` to derive token counts; appends to
  `.claude/state/telemetry/manual-quota-log.ndjson` with `source='founder-paste'`.
- **`.claude/state/telemetry/ingestion-audit.md`** — documents which event types
  surface token deltas and which crons invoke Claude.

### Dashboard (Deliverable 2)
- **`docs/reports/token-usage.html`** — 8-link nav, sticky all-time panel with
  separate Real/Estimated/Manual stat tiles, three drill-down panels
  (`by_agent`, `by_cron`, `by_ship`) each with a Chart.js stacked horizontal bar
  + table. Hatched CSS pattern for estimated bars; `*` prefix for manual entries.
  Warning row in `by_cron` table if downloads-watcher or maintenance accumulate
  > 0 tokens (those should be zero — they don't invoke Claude).
- **`scripts/regen-token-usage.py`** — data-block-swap regen pattern; runs
  aggregator first if snapshot missing.

### Integration (Deliverable 3)
- **`scripts/cron/common.ps1`** — added `Emit-CronTelemetry` helper. Used by
  start/end events from all PARBAUGHS crons.
- **`scripts/cron/downloads-watcher.ps1`** — generates `$runId`, emits
  `cron.downloads-watcher.start` at top, emits `cron.downloads-watcher.end` in
  the `finally` block with `duration_ms`, `success`, `exit_reason`.
  `claude_invoked=false` (this cron does NOT call Claude — its presence as zero
  tokens in `by_cron` is load-bearing for the warning logic).
- **`scripts/cron/maintenance.ps1`** — same pattern. `cron.maintenance.start` +
  `cron.maintenance.end` with derived `success` (any step.status==error flips
  it false), `exit_reason` carries the failing step names. Also `claude_invoked=false`.
- **`scripts/regen-all.ps1` + `scripts/regen-all.sh`** — added
  `aggregate-token-usage` and `regen-token-usage` to the chain; added
  `token-usage.html` to the rollback list.
- **`scripts/inject-page-nav.py`** — extended canonical nav to 8 links
  (Dashboard, Activity, Discussion Bubbles, Proposals, Main Flows, Design System,
  Tokens, Index). All 8 dashboards now share the same nav.
- **`tests/round-trip-test.py`** — extended:
  - nav audit now checks 8 links across 8 pages
  - new `[token-usage]` block validates: top-level keys
    `by_agent`/`by_cron`/`by_ship`/`all_time`; each panel bucket has numeric
    `real`/`estimated`/`manual`; **cross-panel reconciliation** —
    `sum(by_agent.real) == sum(by_cron.real) == sum(by_ship.real) == all_time.real`
    (same for estimated and manual); hatched CSS pattern present in HTML.

## Test result

```
[token-usage] Verifying production data block + cross-panel reconciliation...
  ✓ token-usage.html schema valid; all_time real=0 estimated=0 manual=0; cross-panel sums match
  ✓ token-usage.html visual distinction (hatched/striped) present

=== ALL CHECKS PASSED ===
```

`regen-all.ps1` runs the full chain green including the new aggregator + regen
steps; round-trip test passes.

## Open calibration question for Founder

Source B rate constants (`INPUT_RATE_TOKENS_PER_SEC = 100`,
`OUTPUT_RATE_TOKENS_PER_SEC = 30`) are placeholders for Claude Opus
reading/writing rates. Two options for refinement:

1. **Leave at 100/30 indefinitely.** Estimates are clearly labeled as
   estimated; over time the manual paste anchors via `*`-prefix entries
   correct any drift visually.
2. **Calibrate against first manual paste.** After your first
   `refresh-quota-manual.ps1` run, compare `all_time.manual` to
   `all_time.real + all_time.estimated`. If estimated is systematically
   over/under, retune the constants once and document the calibration date.

Recommendation: option 1 for now. Manual paste is the ground-truth anchor;
estimates exist only to show approximate scale for non-Claude crons becoming
contributors over time. Re-evaluate after 30 days of operation.

## Files touched (TU-scoped)

**New:**
- `scripts/aggregate-token-usage.py`
- `scripts/regen-token-usage.py`
- `scripts/refresh-quota-manual.ps1`
- `docs/reports/token-usage.html`
- `.claude/state/telemetry/ingestion-audit.md`
- `.claude/state/wave-zero-dry-run/token-usage-build-summary.md` (this file)

**Modified:**
- `scripts/cron/common.ps1` — `Emit-CronTelemetry` helper
- `scripts/cron/downloads-watcher.ps1` — runId + start/end emit
- `scripts/cron/maintenance.ps1` — runId + start/end emit
- `scripts/regen-all.ps1` — chain steps + rollback list
- `scripts/regen-all.sh` — chain steps + rollback list
- `scripts/inject-page-nav.py` — 8-link canonical nav
- `tests/round-trip-test.py` — 8-link nav audit + `[token-usage]` block
- `docs/reports/{dashboard,activity,proposals,discussion-bubbles,main-flows,design-system,index}.html`
  — nav re-injected with Design System + Tokens entries

**Not in this commit (separate concerns, may be in working tree):**
- `package-lock.json` — npm update churn from maintenance.ps1
- `.claude/state/proposals/.last-processed-decisions.json` — from earlier watcher run
- `scripts/cron/quarantine/2026-05-13/` — from maintenance.ps1 quarantine sweep
- `tests/round-trip-workspace/` — test scratch space (gitignore candidate)

## Founder review checklist

- [ ] `scripts/aggregate-token-usage.py` top constants reasonable for recalibration?
- [ ] `docs/reports/token-usage.html` renders three panels with hatched/striped
      pattern on estimated bars? (Open it in a browser.)
- [ ] `refresh-quota-manual.ps1` prompt flow feels right for end-of-session paste?
- [ ] `cron.*.start` / `cron.*.end` events emitting under
      `.claude/state/telemetry/events/<date>.ndjson`? (Run downloads-watcher
      manually and grep the file.)
- [ ] No `git push` per the directive — commit local only.
