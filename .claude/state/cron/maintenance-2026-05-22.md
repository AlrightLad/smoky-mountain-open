# Maintenance Run 2026-05-22

**Started:** 2026-05-22T06:55:02Z
**Finished:** 2026-05-22T06:55:26Z
**Duration:** 24.3 seconds
**Log:** scripts/cron/logs/2026-05-22T06-55-02Z-maintenance.log

## Step outcomes

| Step | Status | Detail |
|------|--------|--------|
| preflight | ok | - |
| git-health | ok | ahead/behind=0	3 dirty=0 |
| quarantine-sweep | ok | moved=0 |
| log-rotation | ok | compressed=0 |
| dep-updates | skipped | not-admin (run via Scheduled Task with RunLevel Highest) |
| state-audit | ok | no findings |
| morning-report | ok | - |
| regen-all | error | exit=1 |
| telemetry | ok | - |

## Needs Founder attention

- **regen-all** (error): exit=1
