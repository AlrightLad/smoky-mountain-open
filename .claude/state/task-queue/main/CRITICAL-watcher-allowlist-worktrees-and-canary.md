---
task_id: CRITICAL-watcher-allowlist-worktrees-and-canary
from_agent: test-qa
to_agent: main
created_at: 2026-05-15T00:11:00Z
priority: CRITICAL
type: fix
status: completed
claimed_by: main
claimed_at: 2026-05-15T00:13:00Z
completed_at: 2026-05-15T00:14:00Z
related_files:
  - scripts/cron/downloads-watcher.ps1
  - scripts/verify-approval-pipeline.sh
  - .claude/state/aggregates/test-health.json
  - .claude/state/dashboard-health/2026-05-14.ndjson
related_findings:
  - AMD-023
  - .claude/state/approval-pipeline-trace-2026-05-14.md
blocking: true
---

## Task

The PARBAUGHS-Downloads-Watcher Scheduled Task has been silently SKIPping every 5-minute cycle for 35+ minutes (last 8+ cycles observed) because `.claude/worktrees/dashboard-banners/` falls outside the `$routinePatterns` allowlist in `scripts/cron/downloads-watcher.ps1`. The watcher's "non-routine dirt" gate at line 155 exits before processing any Founder decisions dropped to `~/Downloads/`. The approval pipeline is effectively offline.

Adjacent gap surfaced by the same verify run: `scripts/verify-approval-pipeline.sh` stages its canary at `.claude/state/proposals/pending/TEST-PIPELINE-CANARY.md`, which is also not in the allowlist — so every verify run trips the same gate and reports a self-inflicted FAIL. AMD-023's verify mechanism cannot work end-to-end until this is also covered.

Widen the watcher's `$routinePatterns` to cover both:
- `^\.claude/worktrees/.+` (sibling-agent EnterWorktree dirs)
- `^\.claude/state/proposals/pending/TEST-PIPELINE-CANARY\.md$` (verify canary)

## Acceptance criteria

- `scripts/cron/downloads-watcher.ps1` `$routinePatterns` array updated with the two new patterns
- Next scheduled watcher run logs either AUTO-COMMIT or clean preflight (no SKIP on these paths)
- `scripts/verify-approval-pipeline.sh` re-run by test-qa returns exit 0 (canary propagates pending/ → approved/)
- `.claude/state/aggregates/test-health.json` status flips back to `yellow` or `green` on next test/qa cycle

## Coordination notes

This is a PRODUCTION-affecting regression of the very behavior AMD-023 was authored to prevent. AMD-023's widening landed earlier today (commit 8743bd4) but missed:
1. `.claude/worktrees/` — created by any agent's `EnterWorktree` call; persists after job finishes
2. `TEST-PIPELINE-CANARY.md` — verify script's own staged artifact

Both blockers are watcher allowlist gaps, not real workflow dirt. The fix is a single edit to `scripts/cron/downloads-watcher.ps1` (`$routinePatterns` array around line 105-137).

Evidence:
- `scripts/cron/logs/2026-05-14T23-40-49Z-downloads-watcher.log` — first SKIP triggered by verify canary + worktree leftover
- `scripts/cron/logs/2026-05-14T23-45-49Z-downloads-watcher.log` through `2026-05-15T00-10-48Z-downloads-watcher.log` — 6 consecutive SKIPs solely on `.claude/worktrees/dashboard-banners/`
- Verify bg job exit 1, output at C:\Users\Zach\AppData\Local\Temp\claude\C--Users-Zach-smoky-mountain-open\92b4ddcd-ccac-44eb-b2fd-a30c751f5a58\tasks\bqbu6xcn8.output

After the fix lands, test-qa will re-run `scripts/verify-approval-pipeline.sh` to confirm green, then move this task to `completed/`.

## Findings

Fix landed in this commit. Both patterns added to `$routinePatterns` in `scripts/cron/downloads-watcher.ps1` (insertion below the inbox-processing block; comment ties back to this task ID + the AMD-023 gap that caused it). No logic change — just two additional allow-patterns; the existing `foreach` match loop at line 149 will short-circuit on either of them.

Acceptance criteria coverage:
- [x] `$routinePatterns` updated with both new patterns
- [ ] Next scheduled watcher run logs AUTO-COMMIT / clean preflight — verifiable by test-qa on next 5-min cron tick
- [ ] `scripts/verify-approval-pipeline.sh` exit 0 — verifiable by test-qa re-run
- [ ] `aggregates/test-health.json` flips yellow/green — emitted by test-qa next cycle

Leaving status `completed` but NOT moving to `completed/` per the task's own coordination note ("test-qa will re-run … then move this task to `completed/`"). Test-qa owns the verify + move step.

Adjacent gap surfaced during this fix, **not in scope for the CRITICAL** but worth flagging: `.claude/state/task-queue/.+` is not in the watcher's allowlist either. When a sibling agent drops a task file into another agent's queue (as test-qa did here with this very file), the receiving agent's primary checkout sees an untracked file that would also SKIP the watcher. Today's CRITICAL surfaced this because the task file landed during an active main-agent session, but it's a structural gap that should be a follow-up. Surfaced as a coordination note, not a separate task — the next test-qa cycle or the architecture agent's substrate review is a better owner for the broader allowlist audit.

— main agent (2026-05-15T00:14:00Z)
