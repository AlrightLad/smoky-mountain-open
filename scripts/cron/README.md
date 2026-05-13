# scripts/cron/

PARBAUGHS Windows Scheduled Tasks. Two pipelines:

## 1. Downloads watcher — every 5 minutes

Scans `%USERPROFILE%\Downloads\decisions-*.json` exported from `proposals.html`. On finding a new file: copies to `.claude/state/proposals/inbox/`, runs `.claude/scripts/apply-decisions.sh` via Git Bash explicitly (Fix C — never WSL), regenerates dashboards, commits locally (does NOT push).

### Install (Founder, as Administrator)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/install-downloads-watcher.ps1
```

### Test manually

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/test-downloads-watcher.ps1
```

### Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/uninstall-downloads-watcher.ps1
```

### Pre-flight checks (skip if any fail)

- `.claude/state/cron-paused.json` absent
- `.claude/state/last-verify.json` absent OR `resume_after` has passed
- Working tree clean (refuse to apply on top of in-flight work)

## 2. Daily maintenance — 02:55 local

Per Fix B. 10-step run: pre-flight, git fetch+gc, untracked-junk quarantine, log rotation, dep updates (wsl/pip/npm — admin only), state-dir health audit, regen-all sanity, telemetry emit, daily report, local commit. Each step in try/catch; one failing logs and continues.

### Install (Founder, as Administrator — REQUIRES PASSWORD)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/install-maintenance.ps1
```

You will be prompted for your Windows password. Windows stores it **encrypted** in the Scheduled Task definition (S4U — Service for User logon type). The task then runs unattended with admin privileges.

**Security:** `maintenance.ps1` runs with your full credentials. Every line of that script must be trusted. Critic enforces this on every PR that modifies it. Read the script's `.SECURITY` block before installing.

### Test manually (no admin needed)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/test-maintenance.ps1
```

Admin-only steps (wsl/pip/npm updates) skip with a logged note when run non-admin. State audit, log rotation, regen-all, etc. all run fine.

### Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/uninstall-maintenance.ps1
```

### Outputs

- Logs: `scripts/cron/logs/<ts>-maintenance.log`
- Daily report: `.claude/state/cron/maintenance-<YYYY-MM-DD>.md`
- Quarantined junk: `scripts/cron/quarantine/<YYYY-MM-DD>/` (30-day window)
- Log archive: `scripts/cron/logs/archive/<YYYY-MM>.zip`
- Telemetry event: `cycle.maintenance.complete` in `.claude/state/telemetry/events/<date>.ndjson`

## 3. Overnight triage — 03:00 local (daily)

Launches Claude Code with the fixed prompt at `scripts/cron/overnight-triage-prompt.txt`. Claude processes `.claude/state/founder-input-queue/` + `.claude/state/bug-reports/inbox/`, runs heartbeat (regen-all), commits locally. 4-hour wall-clock timeout; kill on exceed.

### Install (Founder, as Administrator — REQUIRES PASSWORD + Claude Code installed)

```powershell
# Verify Claude Code is on PATH first
claude --version

# Then install the task
powershell -ExecutionPolicy Bypass -File scripts/cron/install-overnight-triage.ps1
```

Founder enters Windows password when prompted (separate from the maintenance task's credential — each Scheduled Task stores its own encrypted password copy).

### Test manually

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/test-overnight-triage.ps1
```

This LAUNCHES Claude Code. Cancel with Ctrl-C if you don't want a real overnight run on demand.

### Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File scripts/cron/uninstall-overnight-triage.ps1
```

### Outputs

- Logs: `scripts/cron/logs/<ts>-overnight-triage.log` + `.stdout` + `.stderr`
- Session journal: `.claude/state/cron/<YYYY-MM-DD>-overnight-run.md`
- Telemetry: `cron.overnight-triage.complete` (with `exit_code`, `duration_seconds`, `stdout_lines`, `stderr_lines`)
- Any HALT 24 fires: `.claude/state/halts/halt-24-auto-resume-failure-<ts>.json`

### Dependencies (must be installed before first run)

| Dependency | Resolved via |
|------------|--------------|
| Claude Code CLI | `Resolve-ClaudeCode` (in `common.ps1`) — checks `$env:APPDATA\npm\claude.cmd` + similar |
| Git Bash | `Resolve-GitBash` — same as other crons; NOT WSL |
| Python 3.12 | `Resolve-Python` |

## Pause both crons

Write `.claude/state/cron-paused.json`:

```json
{ "paused_at": "<ISO-8601 UTC>", "reason": "<your reason>", "cleared_after": "<your condition>" }
```

Both pipelines respect this file's presence and skip immediately.

## Critical invariant: no WSL

Both pipelines invoke Git Bash explicitly via the `Resolve-GitBash` function. Windows' default `bash` resolution returns `System32\bash.exe` (WSL launcher) which we never want. Resolve-GitBash filters out `System32` and `WindowsApps` (the store-wrapped WSL launcher).

```powershell
function Resolve-GitBash {
    $candidates = @(
        "C:\Program Files\Git\bin\bash.exe",
        "C:\Program Files (x86)\Git\bin\bash.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe",
        "C:\Program Files\Git\usr\bin\bash.exe"
    )
    foreach ($p in $candidates) { if (Test-Path $p) { return $p } }
    $found = & where.exe bash 2>$null | Where-Object {
        $_ -notmatch "System32" -and $_ -notmatch "WindowsApps"
    } | Select-Object -First 1
    if ($found -and (Test-Path $found)) { return $found }
    return $null
}
```

If you add a new PS script that touches `.sh` files, copy this function in and use it.

## File inventory

| File | Purpose |
|------|---------|
| `common.ps1` | Shared helpers (Resolve-GitBash, Resolve-Python, Resolve-ClaudeCode, Should-SkipCron, Should-FireHalt24) — dot-sourced by all launchers |
| `downloads-watcher.ps1` | Watcher script — every 5 min |
| `install-downloads-watcher.ps1` | Register the watcher Scheduled Task (admin) |
| `uninstall-downloads-watcher.ps1` | Remove the watcher task (admin) |
| `test-downloads-watcher.ps1` | Manual single-run (no scheduling) |
| `maintenance.ps1` | Daily maintenance script — 10 steps |
| `install-maintenance.ps1` | Register the maintenance Scheduled Task (admin + password) |
| `uninstall-maintenance.ps1` | Remove the maintenance task (admin) |
| `test-maintenance.ps1` | Manual single-run of maintenance |
| `overnight-triage.ps1` | Launches Claude Code with the overnight-triage prompt (daily 03:00) |
| `overnight-triage-prompt.txt` | Fixed prompt Claude Code reads — changes go through normal review |
| `install-overnight-triage.ps1` | Register the overnight-triage task (admin + password) |
| `uninstall-overnight-triage.ps1` | Remove the overnight-triage task (admin) |
| `test-overnight-triage.ps1` | Manual single-run; LAUNCHES Claude Code, up to 4h |
| `logs/` | Per-run log files (`<ts>-<task>.log`) |
| `logs/archive/` | Compressed logs > 30 days old |
| `quarantine/` | Junk files moved here for 30-day recovery |
