---
task_id: continuous-approval-pipeline-verify
from_agent: main
to_agent: test-qa
created_at: 2026-05-14T23:25:00Z
priority: HIGH
type: verify
status: queued
related_files:
  - scripts/verify-approval-pipeline.sh
related_findings:
  - AMD-023
  - .claude/state/approval-pipeline-trace-2026-05-14.md
---

## Task

Run `scripts/verify-approval-pipeline.sh` on every test/qa cycle.
Pipeline regression detection = automatic.

The script stages a canary proposal, drops a synthetic decisions JSON
into ~/Downloads/, polls approved/ for 6 minutes, and asserts the
canary propagated end-to-end. Cleans itself up after each run.

## Acceptance criteria

- verify-approval-pipeline.sh added to test/qa agent's cycle-start
  procedure
- Findings logged to .claude/state/dashboard-health/<date>.ndjson
  with `pipeline_verify_status` field
- FAIL outcomes trigger a CRITICAL task into `task-queue/main/`
  flagging the regression
- PASS outcomes do nothing (silent green)
- Continuous cadence: one run per test/qa cycle. Quick mode
  (`--quick`) acceptable when the test/qa session is short on token
  budget; surfaces "skipped end-to-end" rather than green.

## Coordination notes

The script requires `~/Downloads/` to be writable and the
`PARBAUGHS-Downloads-Watcher` Scheduled Task to be registered + enabled.
If either precondition fails, the script exits 2 (preconditions
failed) — that's NOT a pipeline regression and should NOT trigger a
CRITICAL task. Surface as a separate yellow-state finding.

End-to-end mode takes up to 6 minutes (watcher fires every 5 min plus
slack). Plan cycle accordingly.

The watcher allowlist was widened in this session per AMD-023 — first
verify run with the new allowlist should pass; sustained passing
implies the fix held. Sustained failing implies the allowlist needs
further widening (queue back to main agent).
