---
id: AMD-023
title: Approval pipeline reliability
target_canonical_path: docs/agents/APPROVAL_PIPELINE.md
source_draft_path: .claude/state/amendments/pending/AMD-023-approval-pipeline-reliability.md
scope_summary: Widen downloads-watcher routine-output allowlist so agent-work artifacts (user-context captures, audit outputs, heartbeats, deferred markers, pycache) do not stall Founder approvals. Add scripts/verify-approval-pipeline.sh for continuous end-to-end verification. Surface Approvals Pipeline health banner to dashboard.
type: new-file
section_anchor: null
depends_on:
  - AMD-020
  - AMD-019
  - AMD-022
authored_by: claude-code
authored_at: 2026-05-14T23:15:00Z
bubble_of_record: null
estimate_tokens_to_apply: 3500
rollback_strategy: Revert downloads-watcher.ps1 routine-pattern widening to the original 3-pattern allowlist; remove scripts/verify-approval-pipeline.sh. Approval pipeline reverts to current behavior (recurring SKIP on agent-work dirt).
status: pending
operating_status: ACTIVE — fix applied immediately per Founder directive 2026-05-14 "APPROVAL PIPELINE LOCKDOWN". Watcher allowlist widened; verify script in place. Dashboard banner deferred to dashboard agent.
---

# Approval pipeline reliability

Founder direction 2026-05-14 "APPROVAL PIPELINE LOCKDOWN — Make
decisions auto-propagate". 7+ approvals had stalled in
`.claude/state/proposals/approved/` because the downloads-watcher kept
SKIPping on dirty working tree.

See `.claude/state/approval-pipeline-trace-2026-05-14.md` for the
end-to-end trace and root-cause analysis.

## Root cause

`scripts/cron/downloads-watcher.ps1` preflight had a narrow auto-commit
allowlist (`telemetry/events`, `telemetry/aggregates`,
`package-lock.json`). Every other agent-work artifact (user-context
captures, click-every-interactive audit outputs, heartbeat markers,
deferred-marker JSON, Python bytecode, etc.) triggered SKIP. As long as
ANY of those files was uncommitted, the watcher refused to apply
Founder decisions.

This is consistent with AMD-020's intent (Class A artifacts should
auto-commit) but the implementation didn't enumerate the actual Class A
categories that pile up during normal agent work.

## What changes

### 1. Widened routine-output allowlist in downloads-watcher.ps1

Adds 13 new patterns covering Class A artifacts per AMD-020:

- `.claude/state/main-flows-v2/founder-real-context/*.{png,json}`
- `.claude/state/main-flows-v2/iter-*.{png,json}`
- `.claude/state/main-flows-v2/reference-frames/*.{png,jpg,jpeg,mp4,m4s}`
- `.claude/state/user-journey-audits/*.{png,md,json}`
- `.claude/state/heartbeats/*.json`
- `.claude/state/dashboard-health/*.{ndjson,json}`
- `.claude/state/security/cycles/*.ndjson`
- `.claude/state/proposals/ship-readiness-deferred/*.json`
- `.claude/state/overnight-agent/{logs,runs,reports}/*`
- `scripts/__pycache__/*.pyc`
- `tests/__pycache__/*.pyc`
- `.claude/state/proposals/inbox/*.json`
- `.claude/state/amendments/inbox/*.json`
- `.claude/state/escalations/inbox/*.json`
- `.claude/state/proposals/.last-processed-decisions.json`

### 2. Gitignore additions

Python bytecode now ignored across the tree:

- `tests/__pycache__/`
- `**/*.pyc`

(`scripts/__pycache__/` and `.playwright-mcp/` were already ignored.)

### 3. End-to-end verification script

`scripts/verify-approval-pipeline.sh`:

- Stages a canary proposal in `pending/`
- Drops synthetic decisions-canary-<ts>.json into `~/Downloads/`
- Polls `approved/` for up to 6 minutes
- Asserts canary propagated
- Cleans up canary state

Test/QA agent runs this on every cycle; pipeline regression =
automatic detection.

### 4. Dashboard banner (deferred to dashboard agent)

Task dropped to `.claude/state/task-queue/dashboard/` (per AMD-022):
add an "Approvals Pipeline" health banner showing:

- Watcher last-run timestamp + exit reason
- Inbox queue depth
- Approved/ count + delta since last cycle
- Last 3 stall events with cause

Green: ran within 10 min, exit ∈ {applied, no-op, no-new-files}
Yellow: SKIPped due to dirty tree last 2 cycles
Red: errored OR SKIPped 4+ cycles

## Drain of stalled approvals

The 8 proposals currently in `approved/` (PROP-005..PROP-012) are not
actually stalled — they already made the pending → approved hop
successfully (visible in the file system). They're sitting in approved/
waiting for the **separate** proposal-readiness scanner
(`scripts/cron/proposal-readiness.ps1`, every 2h) to ship-close them.

This amendment fixes the FUTURE pending → approved hop. The
approved → shipped hop is a separate scanner with its own preflight
logic that needs the same widening treatment in a follow-up amendment
if it shows similar drift.

## Operating change

Watcher allowlist active starting now. Verify script in place.
Test/QA agent picks up continuous verification on next cycle.

Dashboard banner pending dashboard agent pickup.

## Discipline references

- AMD-020 — auto-clean dirty tree (this widens the allowlist)
- AMD-019 — dashboard freshness (banner surfaces here)
- AMD-018 — push authorization (no exception-list operations in this fix)
- AMD-022 — inter-agent task queue (used to assign banner work to
            dashboard agent)
- PROP-007 — user-context verification (filesystem snapshot equivalent
            for non-UI verification)
