# Maintenance Run 2026-05-14

**Started:** 2026-05-14T06:55:01Z
**Finished:** 2026-05-14T06:55:17Z
**Duration:** 15.8 seconds
**Log:** scripts/cron/logs/2026-05-14T06-55-01Z-maintenance.log

## Step outcomes

| Step | Status | Detail |
|------|--------|--------|
| preflight | ok | - |
| git-health | ok | ahead/behind=0	134 dirty=7 |
| quarantine-sweep | ok | moved=0 |
| log-rotation | ok | compressed=0 |
| dep-updates | ok | wsl+pip+npm probed |
| state-audit | ok | no findings |
| regen-all | error | exit=2 |
| telemetry | ok | - |

## Needs Founder attention

- **regen-all** (error): exit=2
