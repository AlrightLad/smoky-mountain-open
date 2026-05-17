# Maintenance Run 2026-05-17

**Started:** 2026-05-17T06:55:01Z
**Finished:** 2026-05-17T06:55:36Z
**Duration:** 34.3 seconds
**Log:** scripts/cron/logs/2026-05-17T06-55-01Z-maintenance.log

## Step outcomes

| Step | Status | Detail |
|------|--------|--------|
| preflight | ok | - |
| git-health | ok | ahead/behind=6	0 dirty=25 |
| quarantine-sweep | ok | moved=0 |
| log-rotation | ok | compressed=0 |
| dep-updates | ok | wsl+pip+npm probed |
| state-audit | ok | no findings |
| morning-report | ok | - |
| regen-all | error | exit=1 |
| telemetry | ok | - |

## Needs Founder attention

- **regen-all** (error): exit=1
