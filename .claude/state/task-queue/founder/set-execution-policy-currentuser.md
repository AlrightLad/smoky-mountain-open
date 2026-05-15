---
task_id: set-execution-policy-currentuser
from_agent: main
to_agent: founder
created_at: 2026-05-15T02:00:00Z
priority: HIGH
type: founder-action
status: pending
related_files:
  - scripts/cron/install-all.ps1
  - scripts/cron/downloads-watcher.ps1
  - scripts/cron/maintenance.ps1
  - .claude/state/goal-progress/bypass-flag-scan-2026-05-15.md
related_findings:
  - Goal Objective 5 (bypass-flag scan)
  - CLAUDE.md "PowerShell ExecutionPolicy" gotcha
---

## Task

/goal Objective 5 requires zero `-ExecutionPolicy Bypass` hits in
production paths. Current machine state has CurrentUser=Undefined,
which forces every production .ps1 invocation (cron Scheduled Tasks +
child shell-outs in downloads-watcher.ps1 / maintenance.ps1) to use
`-ExecutionPolicy Bypass` as the documented workaround.

Per CLAUDE.md "PowerShell ExecutionPolicy" gotcha (added iter 16),
the proper one-time fix is:

```
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

This requires interactive Founder consent — Agent 3 cannot run it
autonomously (no auth-prompt handling).

## Acceptance criteria

After Founder runs the policy set:

1. `Get-ExecutionPolicy -Scope CurrentUser` returns `RemoteSigned`
2. Founder posts "policy set" back to this task; Agent 3 then:
   - Updates `scripts/cron/install-*.ps1` to emit Scheduled Task
     arguments WITHOUT `-ExecutionPolicy Bypass`
   - Updates `scripts/cron/downloads-watcher.ps1:314` and
     `scripts/cron/maintenance.ps1:336` to remove Bypass on child
     invocations
   - Re-registers all Scheduled Tasks via `install-all.ps1`
   - Re-runs the bypass-flag scan to confirm zero hits in
     production paths
3. Goal Objective 5 closes

## Surface

Tell Founder: "To close /goal Objective 5 fully, run this once in
PowerShell:
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
Then post 'policy set' to .claude/state/task-queue/main/ and I'll
clean up the production scripts + re-register Scheduled Tasks. Until
this happens, the goal's grep-zero criterion can't be honored
without breaking your machine."

Until then: scan documents the remaining hits as a Founder-gate item.
The OTHER 6 patterns in Objective 5 (--no-verify, --force, || true,
exit 0, except.*pass, catch{}) are all compliant.

## Coordination notes

- Scan record: `.claude/state/goal-progress/bypass-flag-scan-2026-05-15.md`
- This task does NOT block other /goal priorities. P1, P2, P3, P4
  (governance), and final push continue in parallel.
- If Founder declines to set policy: amend the goal's success
  criterion to "documented workaround in place" rather than
  "grep-zero". Surface a follow-up amendment for that revision.
