# Token usage sidecar

Per PROP-003.a (token meter sidecar mechanics) + PROP-003.b
(dashboard integration). Tracks Anthropic quota state for dashboards.

## Components

| Path | Role |
|---|---|
| `scripts/sidecar/usage-snapshot.ps1` | Cron-run sidecar — reads input log, writes output |
| `scripts/sidecar/usage-snapshot-config.json` | Cadence + threshold config |
| `scripts/refresh-quota-manual.ps1` | Founder-interactive script — populates input log |
| `.claude/state/telemetry/manual-quota-log.ndjson` | **INPUT** (Founder-paste from claude.ai billing UI) |
| `.claude/state/quota-status.json` | **OUTPUT** (computed snapshot; updated every 5 min) |
| `PARBAUGHS-Token-Sidecar` (Windows Scheduled Task) | Cron runner |

## Data flow

```
Founder types percentages from claude.ai
        │
        v
scripts/refresh-quota-manual.ps1
        │ writes
        v
.claude/state/telemetry/manual-quota-log.ndjson  (append-only)
        │ read every 5 min
        v
scripts/sidecar/usage-snapshot.ps1  (PARBAUGHS-Token-Sidecar cron)
        │ writes
        v
.claude/state/quota-status.json
        │ read on each regen-all
        v
docs/reports/dashboard.html  (TOKENS THIS WEEK + ANTHROPIC QUOTA cards)
```

## Operational state (as of 2026-05-14)

- Sidecar cron: ✓ installed + running every 5 min
- Sidecar last run: per `quota-status.json:as_of`
- Input log: typically EMPTY initially; populated by Founder action
- Dashboard surfaces: "ANTHROPIC QUOTA (no data) · sidecar present
  but no source data · run scripts/refresh-quota-manual.ps1"
  (honest gap per AMD-009 P5)

## To populate (Founder action, ~1 minute)

```powershell
# Open PowerShell. From repo root:
powershell -NoProfile -File scripts/refresh-quota-manual.ps1
```

Script prompts for percentages from your claude.ai billing UI:
- Current SESSION % used
- Weekly ALL MODELS % used
- Weekly SONNET ONLY % used
- Weekly CLAUDE DESIGN % used
- (Optional) Cumulative ALL-TIME tokens

Type `skip` to omit any. Values multiply against quota caps in
`scripts/aggregate-token-usage.py` `QUOTA_CAPS` to derive token
counts. Entries append to `manual-quota-log.ndjson`.

Within 5 minutes the cron sidecar refreshes `quota-status.json`.
Run `bash scripts/regen-all.sh` to immediately refresh the
dashboard.

## Cap reference

Defaults in `aggregate-token-usage.py:QUOTA_CAPS`:
- session: 200,000 tokens
- weekly-all: 3,500,000 tokens
- weekly-sonnet: 3,500,000 tokens
- claude-design: 1,000,000 tokens

If your Anthropic plan changes, update those constants. Or pin via
`weekly_cap_override` / `org_monthly_cap_override` in
`usage-snapshot-config.json` without editing scripts.

## Plan B (deferred)

`data_source_priority: ["headless-cost", "manual-paste"]` —
headless-cost would auto-scrape claude.ai billing or hit Anthropic
console API. Not yet implemented. Plan A (manual-paste) covers
current need.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Dashboard shows "no data" | `manual-quota-log.ndjson` missing | Run `refresh-quota-manual.ps1` |
| Dashboard data stale | Last paste >24h old (`stale_data_threshold_seconds`) | Re-run `refresh-quota-manual.ps1` |
| Cron task not running | `PARBAUGHS-Token-Sidecar` State != Ready | `scripts/cron/install-sidecar.ps1` |
| `_warning` field present | Sidecar surfacing diagnostic | Read the warning text |
