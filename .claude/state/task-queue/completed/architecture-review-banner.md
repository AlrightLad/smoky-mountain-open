---
task_id: architecture-review-banner
from_agent: main
to_agent: dashboard
created_at: 2026-05-14T23:35:00Z
priority: MEDIUM
type: build
status: queued
related_files:
  - docs/reports/dashboard.html
  - docs/reports/_assets/dashboard.js
  - scripts/regen-dashboard.py
  - .claude/state/aggregates/architecture-review.json
related_findings:
  - AMD-024
  - .claude/state/architecture-review/README.md
---

## Task

Add an "Architecture Review" health banner to dashboard.html. Reads
`.claude/state/aggregates/architecture-review.json` (emitted by the
6th always-on Architecture / AI Engineer agent per AMD-024) and
surfaces the latest health state + recommendation backlog at a
glance.

The aggregator JSON shape (architecture agent emits this on each
daily / weekly / monthly cycle):

```json
{
  "schema_version": 1,
  "updated_at": "<ISO-8601>",
  "latest_daily_health": {
    "date": "<YYYY-MM-DD>",
    "color": "green|yellow|red",
    "summary": "<one-line>"
  },
  "latest_weekly_summary": {
    "week": "<YYYY-WW>",
    "summary": "<one-paragraph>",
    "link": "<path>"
  },
  "latest_monthly_strategic": {
    "month": "<YYYY-MM>",
    "summary": "<one-paragraph>",
    "link": "<path>"
  },
  "pending_recommendations_count": <int>,
  "ratification_rate": <float between 0 and 1>,
  "top_3_priorities": [
    { "title": "...", "owning_agent": "...", "priority": "..." },
    ...
  ]
}
```

## Acceptance criteria

- Banner renders on `docs/reports/dashboard.html` alongside the other
  top-row banners (Recent Handoffs, System Health, Test Health,
  Security Health, Approvals Pipeline once it lands)
- Surfaces:
  - Latest daily health color + summary
  - Pending recommendations count + link to
    `.claude/state/architecture-review/recommendations/pending/`
  - Top 3 priorities
  - Link to latest weekly + monthly review files
- Health colors:
  - **Green**: daily health color=green AND recommendation count <= 5
  - **Yellow**: daily health color=yellow OR recommendation count
    6-15 OR ratification_rate < 0.5
  - **Red**: daily health color=red OR recommendation count > 15
- Aggregator JSON read from
  `.claude/state/aggregates/architecture-review.json`
- Idempotent if aggregator JSON missing (graceful empty state — show
  "Architecture agent not yet active" with link to AMD-024)
- Visual review screenshot attached to commit (1920x1080 + 1280
  responsive checkpoint)

## Coordination notes

The aggregator JSON does not exist yet — the architecture agent emits
it on its first daily cycle after dispatch. Until then, this banner
shows the "not yet active" empty state.

The trigger for this work: AMD-024 just authored. Build alongside the
Approvals Pipeline banner from the prior task
(`approvals-pipeline-banner.md`) — they're sibling top-row banners
following the same pattern.

If the aggregator schema needs evolution to support a banner field,
queue a task back to `task-queue/main/` asking the architecture agent
to extend it — but the schema above should cover the v1 banner.

Pattern: same as Dashboard / Test Health / Security Health banner
readers already in `scripts/regen-dashboard.py` — extend with one
more aggregator section.

## Findings (2026-05-15T01:15Z, dashboard-health)

Banner shipped via the same commit pair as the sibling approvals banner
(497beaa aggregator + 1fb77d3 inject). `architecture_review_status()`
reads `.claude/state/aggregates/architecture-review.json` against the
schema spelled out in this task and returns the normalized banner
shape. Empty-state surfaces when the file is absent (current state —
architecture agent has not dispatched yet).

Current live state:

- Status: MISSING.
- Summary: `Architecture agent not yet active — dispatch via boot
  prompt §6.6`.
- Details: empty-state info row pointing at AMD-024.
- Links: AMD-024, Architecture review dir.

Status logic per task acceptance:
- green: `daily.color=green` AND `recs <=5`
- yellow: `daily.color=yellow` OR `recs 6-15` OR `ratification_rate <0.5`
- red: `daily.color=red` OR `recs >15`
- stale (>48h since `updated_at`): auto-downgrade to unknown

Visual review screenshots at same path as the sibling task.

Once the Architecture / AI Engineer agent emits its first
`architecture-review.json` on its first daily cycle after dispatch,
the banner will switch out of missing-state on the next post-commit
regen. No further dashboard work needed.
