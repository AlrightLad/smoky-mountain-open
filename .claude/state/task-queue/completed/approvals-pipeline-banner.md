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

## Findings (2026-05-15T01:15Z, dashboard-health)

Banner shipped via two tracked commits + one local regen pass:

- **497beaa** — `approvals_pipeline_status()` aggregator in
  `scripts/regen-dashboard.py`. Reads last 10 `*-downloads-watcher.log`
  files, marker `.last-processed-decisions.json`, and
  `.claude/state/proposals/{state}/` + `inbox/` counts. Status
  classification matches acceptance: green (<=10min + success exit),
  yellow (2x SKIP-dirty OR last-run >10min), red (errored OR 4+
  consecutive SKIPs). Returns normalized `read_health_banner()` shape
  so the existing JS `renderHealthBanner('approvals', ...)` path
  consumes it without a special case. Approved-count delta cached at
  `.claude/state/dashboard-health/approvals-pipeline-prev.json`.

- **1fb77d3** — `scripts/inject-health-banners.py` (idempotent inject
  for the gitignored `dashboard.html` markup, same pattern as
  `inject-page-nav.py`). Inserts the banner button, detail panel, and
  `renderHealthBanner` JS call after the existing Security siblings.
  Wired into `scripts/regen-all.{sh,ps1}` as a pipeline step BEFORE
  `regen-dashboard` so markup lands first, then data-block swap
  populates it. Verified idempotent: second pass reports all three
  inserts as `already-present`.

Live state on parent's `docs/reports/dashboard.html` (post-regen):

- Status: RED. `7 consecutive SKIPs · 25 in inbox`.
- The recent SKIPs are watcher cycles in this background-job
  worktree path (`.claude/worktrees/dashboard-banners/`) — the
  watcher's allowlist treats worktree-internal paths as non-routine.
  Worth a follow-up to widen the allowlist for `^\.claude/worktrees/`
  paths, but out of scope for this banner task.
- Counts: `proposals_pending=0 approved=9 deferred=0 rejected=0
  shipped=4 proposals_inbox=11 amendments_inbox=12 escalations_inbox=2`.
- Detail panel renders marker row + 3 most recent stall events +
  "Approvals pipeline trace" + "AMD-023" links.

Visual review at `.claude/state/dashboard-health/screenshots/2026-05-14/`:
- `dashboard-banners-1920x1080-viewport.png` — initial header band
- `dashboard-banners-1920x1080-fullpage.png` — full scroll
- `dashboard-banners-1280-fullpage.png` — responsive checkpoint
- `dashboard-banners-1920x1080-details-expanded.png` — both detail
  panels open

Acceptance criteria all met. Updates on every `regen-all` pass
(post-commit hook + cron maintenance).
