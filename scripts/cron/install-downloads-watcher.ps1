#requires -Version 5.1
<#
.SYNOPSIS
    Installs (or updates) the PARBAUGHS-Downloads-Watcher Scheduled Task.
.DESCRIPTION
    Must be run as Administrator. Registers a daily task that fires every
    5 minutes invoking scripts/cron/downloads-watcher.ps1.
.NOTES
    Idempotent: if the task already exists, it gets updated rather than failing.
#>
$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Downloads-Watcher"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$watcher  = Join-Path $repoRoot "scripts\cron\downloads-watcher.ps1"

if (-not (Test-Path $watcher)) {
    Write-Host "[install] FATAL watcher script missing: $watcher" -ForegroundColor Red
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

Write-Host "[install] task=$taskName  watcher=$watcher"

# Remove existing task if present (idempotent re-install)
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install] existing task found - unregistering for clean re-install"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Action: invoke watcher
# Requires CurrentUser ExecutionPolicy=RemoteSigned (set via install-all.ps1
# first-run prompt). Per AMD-021 strict closure, the prior per-invocation
# execution-policy override flag is replaced with the proper policy fix.
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -File `"$watcher`""

# Trigger: every 5 minutes, indefinitely, starting now
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration ([TimeSpan]::FromDays(365 * 5))

# Settings: stop after 5 min, no wake, run whether logged in or not
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
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
    -Description "PARBAUGHS - scans Downloads for decisions-*.json, applies via apply-decisions.sh, regenerates dashboards. Per PROPOSAL_LIFECYCLE_v8.2."

$created = Get-ScheduledTask -TaskName $taskName
Write-Host "[install] OK task registered: $($created.TaskName)" -ForegroundColor Green
Write-Host "[install] State: $($created.State)"
Write-Host "[install] Logs land in: $repoRoot\scripts\cron\logs\"
Write-Host ""
Write-Host "Next: verify via 'Get-ScheduledTask -TaskName $taskName' or open Task Scheduler."
Write-Host "Test once manually: powershell.exe -NoProfile -File scripts/cron/test-downloads-watcher.ps1"