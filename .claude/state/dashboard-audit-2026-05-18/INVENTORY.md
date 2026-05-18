# Phase A — dashboard inventory + P9 baseline — 2026-05-18

## Surfaces inventory (D9 target: ≥ 10 HTML files, each > 5KB)

| # | Surface | Path | Size | Status |
|---|---|---|---|---|
| 1 | dashboard.html | docs/reports/dashboard.html | 104K | Active |
| 2 | activity.html | docs/reports/activity.html | 276K | Active |
| 3 | amendments.html | docs/reports/amendments.html | 72K | Active |
| 4 | design-system.html | docs/reports/design-system.html | 44K | Active |
| 5 | discussion-bubbles.html | docs/reports/discussion-bubbles.html | 104K | Active |
| 6 | escalations.html | docs/reports/escalations.html | 48K | Active |
| 7 | index.html | docs/reports/index.html | 20K | Active |
| 8 | main-flows.html | docs/reports/main-flows.html | 184K | Active (M-phase target) |
| 9 | proposals.html | docs/reports/proposals.html | 88K | Active |
| 10 | token-usage.html | docs/reports/token-usage.html | 36K | Active (T-phase target, T1+T5 shipped) |

✅ **D9 satisfied** — 10 surfaces, all > 5KB.

## Aggregates inventory

| Aggregate | Path | Last regen | Purpose |
|---|---|---|---|
| approvals-pipeline | `.claude/state/aggregates/approvals-pipeline.json` | Live | Approval flow state |
| architecture-review | `.claude/state/aggregates/architecture-review.json` | Live | Architecture decision tracking |
| fiq-status | `.claude/state/aggregates/fiq-status.json` | Live | Founder Input Queue status |
| goal-status | `.claude/state/aggregates/goal-status.json` | Live | Active /goal status |
| security-health | `.claude/state/aggregates/security-health.json` | Live | Security posture (will integrate AgentShield) |
| test-health | `.claude/state/aggregates/test-health.json` | Live | Test suite health (8 pre-existing audit failures noted from regen-all) |
| current-snapshot | `.claude/state/telemetry/aggregates/current-snapshot.json` | Live | Telemetry rollup |
| token-usage-snapshot | `.claude/state/telemetry/aggregates/token-usage-snapshot.json` | Live (post-T1+T5) | Token meter source |
| session-transcript-summary | `.claude/state/telemetry/aggregates/session-transcript-summary.json` | NEW (T1) | Session JSONL ingest output |
| quota-status | `.claude/state/quota-status.json` | Live (sidecar) | Anthropic quota sidecar |

## V1 baseline capture (Phase A deliverable)

Captured at `scripts/visual-audit/2026-05-18/` (32 PNGs):
- 10 surfaces × 3 viewports (desktop, tablet, mobile) = 30
- Plus 2 desktop-wide variants for layout stress = 32 total
- All > 5KB; activity.html and main-flows.html are the largest at ~6MB each

After T1+T5 ship: token-usage-desktop.png re-captured at 127KB, showing the new "WEEKLY 3951.52M · last 7 days · session transcripts (real)" and "ALL-TIME 6318.30M" values.

## P9 baseline traces (per surface, baseline pre-Phase B)

### token-usage.html — P9 ✅ TRUTHFUL (Phase T1+T5 shipped)

| Visible value | Source → aggregator → display | Status |
|---|---|---|
| WEEKLY 3951.52M | `~/.claude/projects/*.jsonl` → `ingest-session-transcripts.py` → `session-transcript-summary.weekly_real_7d` → template JS | TRUTHFUL |
| ALL-TIME 6318.30M | same source → `aggregate-token-usage.py` → `all_time.real+estimated` → template JS | TRUTHFUL |
| REAL 6311.01M / EST 7.29M | same source → snapshot's by_agent rollup | TRUTHFUL |
| METER STATUS LIVE | `quota-status.json` (sidecar) → `_state="fresh"` → meter_status="wired-real" | TRUTHFUL |
| Per-agent / per-cron / per-ship tables | same source → snapshot.by_agent/by_cron/by_ship → template JS | TRUTHFUL |

### dashboard.html — P9 ⚠ NEEDS PHASE B TRACE

Dashboard renders multiple banners (approvals, architecture, fiq, security, test). Each consumes its aggregate. Phase B will:
- B1. test-health aggregator P9 trace
- B2. security-health aggregator (integrate AgentShield baseline)
- B3. approvals-pipeline aggregator P9 trace
- B4. architecture-review aggregator OR intentional empty state
- B5. round-trip-last-pass STALE indicator

### Other surfaces — pending Phase B trace

- activity.html — handoffs / activity timeline (8 audit failures noted in regen-all)
- amendments.html — AMD-001 through AMD-025
- design-system.html — Clubhouse token reference
- discussion-bubbles.html — 8-bubble deliberation transcript surface (5 wiring failures in regen-all)
- escalations.html — escalation tracking
- index.html — directory of reports
- main-flows.html — operational view (M-phase target, ≥9.5 score required)
- proposals.html — PROP shipped + deferred

## Pre-existing audit failures (from `bash scripts/regen-all.sh`)

Captured at start of Phase A. These are PRE-EXISTING (not introduced by this session's work):

1. `cross-dash:handoffs_total` — divergent (ground=1 vs activity.html data.handoffs.length=500)
2. `user-context-gate` — 1 surface modified after last capture
3. `quota-status:schema` — validator exit 4
4-8. `wiring:discussion-bubble-to-caller / subagent-to-parent / agent-to-agent / proactive-to-ship / cycle-to-cycle` — dropdown options missing

Phase G visual+structural audits will address these; Phase B aggregator wiring will close the data-side ones. For now they're documented baseline state.

## Templates source-of-truth

All HTML scaffolds in `docs/reports/` are gitignored (per Founder directive — local-only dashboards). The source-of-truth is `templates/dashboards/*.template.html`. `scripts/scaffold-from-templates.sh` (idempotent; --force to overwrite) bootstraps the scaffolds. Phase H durability test verifies scaffold-then-regen reproduces full working dashboard from tracked-only state.

## Competitive references already captured

`.claude/state/design-research/peer-refs-2026-05-16/`:
- datadog-alerts.png, datadog-network.png, datadog-rum.png
- linear-hero.png, linear-timeline.png
- sentry-fatal-error.webp, sentry-issue-detail.webp, sentry-session-replay.webp
- stripe-ab-testing.svg
- vercel-monitor-queries-dark.svg, vercel-monitor-track-dark.svg

Need to add for Phase A completeness per spec line 322-326:
- Token/usage meter references (Vercel usage, OpenAI usage, Anthropic console usage, Stripe billing, AWS Cost Explorer, GCP billing, GitHub Actions usage)
- Pie chart references (Datadog cost breakdown, AWS Cost Explorer, Vercel team usage breakdown)
- Status banners (Vercel status, Cloudflare status, Datadog incidents, GitHub system status, AWS health)

These captures are P7 Taste backlog — pulled in incremental ships as relevant.
