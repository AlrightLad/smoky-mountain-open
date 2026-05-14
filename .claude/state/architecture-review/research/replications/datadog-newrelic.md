---
paid_service: Datadog, New Relic, Honeycomb (APM/monitoring)
paid_cost: per-host or per-event subscription
free_replacement: custom cron + sidecar pattern + dashboard banners
status: replicated
replicated_at: 2026-05-14 (multiple ships across token-meter, dashboard-health, security)
---

## The paid service offered

Datadog / New Relic / Honeycomb provide:
- Metric aggregation (rates, counts, histograms)
- Log centralization
- Alerting on thresholds
- Dashboard composition
- Distributed tracing
- Service-level SLO tracking

## The free path

PARBAUGHS replaces each capability with in-repo equivalents:

| Paid capability | Free PARBAUGHS path |
|---|---|
| Metric aggregation | `.claude/state/telemetry/aggregates/*.json` updated by cron |
| Log centralization | `scripts/cron/logs/<ts>-*.log` per-task log files |
| Alerting | dashboard banners with green/yellow/red color logic |
| Dashboard composition | `docs/reports/*.html` (local-only per dashboard agent gitignore) |
| Distributed tracing | session.team-work.summary events with ship_id (ESC-003) |
| SLO tracking | 11-gate AMD-018 push criteria as effective SLOs |

Specific shipped pieces:

- **Token meter sidecar** (PROP-003.a + PROP-003.b shipped):
  `.claude/state/aggregates/quota-status.json` refreshed every 5 min
  from manual paste log via `PARBAUGHS-Token-Sidecar` cron. Dashboard
  banner reads.
- **Dashboard health log**:
  `.claude/state/dashboard-health/<date>.ndjson` appended by
  dashboard agent.
- **Security cycles log**:
  `.claude/state/security/cycles/<date>.ndjson` appended by security
  agent.
- **Cron telemetry**: every cron run emits start/end events to
  `.claude/state/telemetry/events/<date>.ndjson`. Aggregator rolls up.
- **Heartbeats**: `.claude/state/heartbeats/regen-all-last-pass.json`
  marks last successful regen.
- **Approval pipeline log**: `scripts/cron/logs/<ts>-downloads-watcher.log`
  per cron tick — every SKIP/applied/no-op recorded.

## Capability gap

| Paid feature | PARBAUGHS gap |
|---|---|
| Real-time alerts via Slack/PagerDuty | none — dashboard banner is the alert surface; Founder watches |
| Distributed tracing across services | n/a — single repo, no microservices |
| Historical retention (months/years) | git history is the retention; ndjson grows freely |
| Sub-second metric granularity | n/a — agentic work measured in minutes, not ms |
| Query UI (Datadog logs explorer) | grep / Read tool / dashboard banners |

For an agentic project with no production SLOs and a single Founder
operator, the gaps don't matter. For a multi-team SaaS with paying
customers and 24/7 oncall, the paid path would matter.

## Implementation cost

Mostly already paid (one-time amortized over many ships):

- Cron infrastructure: scripts/cron/* (5 Scheduled Tasks)
- Telemetry emit pattern: `Emit-CronTelemetry` helper in common.ps1
- Aggregator scripts: scripts/regen-*.py
- Dashboard banner reader pattern: scripts/regen-dashboard.py

Ongoing: each new monitored signal adds ~30 min (define aggregate
schema + emit + read + render banner).

## Maintenance burden

Lower than paid. Self-hosted, in-repo, evolves with project. No
vendor sales cycle, no per-event billing surprise, no quota cliff.

## Outcome

Operative across:
- Token quota monitoring (sidecar)
- Dashboard health (per-commit AMD-019)
- Security health (per-cycle scans)
- Approval pipeline health (downloads-watcher log)
- Cron run telemetry (cycle.cron.* events)

The pattern is mature enough that adding a new monitored signal is
~1 day work, not "buy + configure + train + integrate."

## Sources + community references

- PROP-003.a — token meter sidecar mechanics
- PROP-003.b — token meter dashboard telemetry integration
- ESC-003 — per-ship token attribution (session.team-work.summary)
- AMD-019 — dashboard freshness per commit
- AMD-023 — approval pipeline reliability (this session)
- Community pattern: in-repo telemetry via append-only ndjson is
  the standard pattern for self-hosted observability at small
  scale (see e.g. Prometheus' file_sd, or any "audit log" pattern)
