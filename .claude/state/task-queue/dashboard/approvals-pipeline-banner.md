---
task_id: approvals-pipeline-banner
from_agent: main
to_agent: dashboard
created_at: 2026-05-14T23:20:00Z
priority: HIGH
type: build
status: queued
related_files:
  - docs/reports/dashboard.html
  - docs/reports/_assets/dashboard.js
  - scripts/regen-dashboard.py
  - scripts/cron/logs/*-downloads-watcher.log
  - .claude/state/proposals/.last-processed-decisions.json
related_findings:
  - AMD-023
  - .claude/state/approval-pipeline-trace-2026-05-14.md
---

## Task

Add an "Approvals Pipeline" health banner to dashboard.html. Reads
watcher cron state to surface pipeline reliability at a glance.

Data sources:
- `scripts/cron/logs/<latest>-downloads-watcher.log` — exit reason +
  timestamp
- `.claude/state/proposals/.last-processed-decisions.json` — marker
- `.claude/state/proposals/{pending,approved,deferred,rejected}/` —
  counts
- `.claude/state/proposals/inbox/` — queue depth

## Acceptance criteria

- Banner renders on dashboard.html alongside other top-row banners
- Shows: watcher last-run timestamp, exit reason, queue depth,
  approved-count + delta since last cycle, last 3 stall events
- Health color logic:
  - **Green**: watcher ran within 10 min, exit_reason ∈
    `{applied, no-op, no-new-files}`
  - **Yellow**: last 2 runs `SKIP working tree dirty`
  - **Red**: last run errored OR 4+ consecutive SKIPs
- Updates on every dashboard regen (post-commit + cron)
- Visual review screenshot attached to commit (1920x1080 + 1280
  responsive checkpoint)

## Coordination notes

Trigger for this work: AMD-023 (just authored, pending ratification).
The trace document at
`.claude/state/approval-pipeline-trace-2026-05-14.md` has the full
diagnosis — start there for context.

Main agent has already widened the downloads-watcher allowlist
(commit upcoming this session) to fix the recurring SKIP root cause.
This banner is the surfacing layer — it lets Founder + agents see
pipeline state without grepping logs.

Aggregator pattern follows the existing Dashboard / Test Health /
Security Health banner pattern visible in `scripts/regen-dashboard.py`
— extend with one more aggregator that reads cron logs + marker
state.

If you find that aggregator data needs the watcher log to emit
structured telemetry events (vs grepping unstructured log text),
queue a task to `task-queue/main/` asking for a watcher telemetry
addition first.
