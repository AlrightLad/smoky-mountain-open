#requires -Version 5.1
<#
.SYNOPSIS
    Installs (or updates) the PARBAUGHS-Proposal-Readiness-Scanner Scheduled Task.

.DESCRIPTION
    Must be run as Administrator. Registers a task that fires every 2 hours
    invoking scripts/cron/proposal-readiness.ps1, which runs
    .claude/scripts/scan-proposal-readiness.py against the approved/ queue.

    Per AMD-011 Auto-Execute Protocol: 2-hour cron + ship-close-commit
    trigger (the latter wired into regen-all.{ps1,sh}). This installer
    sets up the cron half; the ship-close trigger is a separate ship.

.NOTES
    Idempotent: if the task already exists, it gets updated rather than
    failing.
#>
$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Proposal-Readiness-Scanner"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$cron     = Join-Path $repoRoot "scripts\cron\proposal-readiness.ps1"

if (-not (Test-Path $cron)) {
    Write-Host "[install] FATAL cron script missing: $cron" -ForegroundColor Red
    exit 2
}

# Elevation check
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[install] FATAL must run as Administrator." -ForegroundColor Red
    exit 1
}

Write-Host "[install] task=$taskName  cron=$cron"

# Remove existing task if present (idempotent re-install)
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install] existing task found - unregistering for clean re-install"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Action: invoke the cron script
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$cron`""

# Trigger: every 2 hours starting on the next top-of-hour, indefinitely.
# Compute next top-of-hour for cleaner cron-feel start.
$now = Get-Date
$startAt = (Get-Date $now -Minute 0 -Second 0 -Millisecond 0).AddHours(1)
$trigger = New-ScheduledTaskTrigger -Once -At $startAt `
    -RepetitionInterval (New-TimeSpan -Hours 2) `
    -RepetitionDuration ([TimeSpan]::FromDays(365 * 5))

# Settings: stop after 10 min (scanner is fast; this is defensive), wake to
# run, run whether logged in or not, ok on battery (the scanner is light).
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10) `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

# Principal: current user, run with highest available permissions
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType Interactive `
    -RunLevel Highest

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "PARBAUGHS - scans approved proposals against AMD-009 8-criteria readiness gate every 2 hours. Per AMD-011 Auto-Execute Protocol."

$created = Get-ScheduledTask -TaskName $taskName
Write-Host "[install] OK task registered: $($created.TaskName)" -ForegroundColor Green
Write-Host "[install] State: $($created.State)"
Write-Host "[install] First run scheduled: $startAt"
Write-Host "[install] Logs land in: $repoRoot\scripts\cron\logs\"
Write-Host ""
Write-Host "Next: verify via 'Get-ScheduledTask -TaskName $taskName' or open Task Scheduler."
Write-Host "Test once manually: Start-ScheduledTask -TaskName $taskName"
