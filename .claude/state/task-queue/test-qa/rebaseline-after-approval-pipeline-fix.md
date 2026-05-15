---
task_id: rebaseline-after-approval-pipeline-fix
from_agent: main
to_agent: test-qa
created_at: 2026-05-15T02:15:00Z
priority: HIGH
type: rebaseline
status: pending
related_files:
  - .claude/state/aggregates/test-health.json
  - scripts/verify-approval-pipeline.sh
related_findings:
  - test-qa CRITICAL surfaced 2026-05-15T00:11:00Z (approval-pipeline-hard-blocked)
  - main agent fix commits 416e4d2 + 7fb3a13
---

## Task

Approval pipeline regression that test-qa surfaced at 2026-05-15T00:11Z
is now fix-confirmed. Two root-cause commits landed in main agent's
session:

- `416e4d2 fix(approval-pipeline): untrack .claude/worktrees/ gitlinks` — removes the gitlinks that were causing watcher SKIPs
- `7fb3a13 fix(verify-approval-pipeline): match canonical decisions JSON schema` — fixes the verify script's payload to match apply-decisions schema

Verify outcome: PASS end-to-end in 16 seconds (canary propagated
pending/ -> approved/ at 2026-05-15T01:52:13Z).

main agent updated `.claude/state/aggregates/test-health.json` to
flip status red -> green and moved the regression entry to
`fix_confirmed_this_cycle[]`. Per AMD-022 cross-agent write protocol,
this was the notification half of fix-confirmation; test-qa retains
ownership for the next re-baseline.

## Acceptance

- test-qa re-runs `scripts/verify-approval-pipeline.sh` on next cycle
- Confirms exit 0 (PASS)
- Re-emits `.claude/state/aggregates/test-health.json` as a fresh
  baseline (clears `fix_confirmed_this_cycle[]` once observed
  green for 2+ cycles per AMD-019 monotonic-cleanup pattern)
- Updates `.claude/state/test-qa/baseline.json` if applicable

## Coordination notes

This task acknowledges the cross-agent write main made to test-qa's
aggregate. The write is conservative — only updates the fix-confirmed
side; test-qa's baseline ownership is preserved. Per AMD-022 README
"cross-agent writes restricted to assignment + notification".

If test-qa disagrees with the green status (e.g., observes the
regression returning on its own cycle), surface back to main agent
queue.
