#requires -Version 5.1
<#
.SYNOPSIS
    Apply 2026-05-19 Path 3 hardening to an EXISTING
    PARBAUGHS-Daily-Maintenance scheduled task without a full re-install.

.DESCRIPTION
    The original install-maintenance.ps1 (pre-2026-05-19) created the task
    with RestartCount=0, WakeToRun=false. When the computer was asleep at
    02:55, the task simply missed its run and the heartbeat went stale for
    19+ hours.

    This helper patches the live task with:
      RestartCount=3, RestartInterval=PT5M  (retry on failure)
      StartWhenAvailable=true                (catch up after missed run)
      WakeToRun=true                          (wake computer at 02:55)

    Founder runs this script ONCE as Administrator. No credential prompt
    (we are not re-registering, just updating settings). Idempotent: rerun
    is safe and reports current state.

.NOTES
    Run: Right-click PowerShell -> "Run as Administrator", then:
         powershell.exe -NoProfile -File scripts/cron/harden-maintenance-task.ps1

    To roll back: re-run install-maintenance.ps1 (the install path also
    applies the hardening as of 2026-05-19).
#>

$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Daily-Maintenance"

# Elevation check - Set-ScheduledTask on a Highest-privilege task requires admin.
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[harden-maint] FATAL must run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator' and re-run." -ForegroundColor Red
    exit 1
}

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $task) {
    Write-Host "[harden-maint] FATAL task not found: $taskName" -ForegroundColor Red
    Write-Host "Run scripts/cron/install-maintenance.ps1 first." -ForegroundColor Red
    exit 1
}

$before = $task.Settings
Write-Host "[harden-maint] task=$taskName"
Write-Host ""
Write-Host "--- BEFORE ---" -ForegroundColor DarkGray
Write-Host ("  StartWhenAvailable = " + $before.StartWhenAvailable)
Write-Host ("  RestartCount       = " + $before.RestartCount)
Write-Host ("  RestartInterval    = " + $before.RestartInterval)
Write-Host ("  WakeToRun          = " + $before.WakeToRun)

# Apply hardening
$s = $task.Settings
$s.StartWhenAvailable = $true
$s.RestartCount       = 3
$s.RestartInterval    = 'PT5M'
$s.WakeToRun          = $true

Set-ScheduledTask -TaskName $task.TaskName -Settings $s -ErrorAction Stop | Out-Null

$after = (Get-ScheduledTask -TaskName $taskName).Settings
Write-Host ""
Write-Host "--- AFTER ---" -ForegroundColor Green
Write-Host ("  StartWhenAvailable = " + $after.StartWhenAvailable)
Write-Host ("  RestartCount       = " + $after.RestartCount)
Write-Host ("  RestartInterval    = " + $after.RestartInterval)
Write-Host ("  WakeToRun          = " + $after.WakeToRun)

Write-Host ""
Write-Host "[harden-maint] OK hardening applied." -ForegroundColor Green
Write-Host "[harden-maint] The task will now:" -ForegroundColor DarkGray
Write-Host "[harden-maint]   - wake the computer at 02:55 to run" -ForegroundColor DarkGray
Write-Host "[harden-maint]   - retry up to 3 times every 5 min if it fails" -ForegroundColor DarkGray
Write-Host "[harden-maint]   - catch up after a missed run (already on by default)" -ForegroundColor DarkGray
