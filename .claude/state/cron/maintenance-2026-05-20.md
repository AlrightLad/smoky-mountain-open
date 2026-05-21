# Maintenance Run 2026-05-20

**Started:** 2026-05-21T02:32:27Z
**Finished:** 2026-05-21T02:32:51Z
**Duration:** 23.4 seconds
**Log:** scripts/cron/logs/2026-05-21T02-32-27Z-maintenance.log

## Step outcomes

| Step | Status | Detail |
|------|--------|--------|
| preflight | ok | - |
| git-health | ok | ahead/behind=0	2 dirty=9 |
| quarantine-sweep | ok | moved=0 |
| log-rotation | ok | compressed=0 |
| dep-updates | skipped | not-admin (run via Scheduled Task with RunLevel Highest) |
| state-audit | ok | no findings |
| morning-report | ok | - |
| regen-all | error | exit=1 |
| telemetry | ok | - |

## Needs Founder attention

- **regen-all** (error): exit=1
