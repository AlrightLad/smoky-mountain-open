#requires -Version 5.1
<#
.SYNOPSIS
    Installs (or updates) the PARBAUGHS-Token-Sidecar Scheduled Task.

.DESCRIPTION
    Must be run as Administrator. Registers a task that fires every
    5 minutes invoking scripts/sidecar/usage-snapshot.ps1, which writes
    .claude/state/quota-status.json from manual-quota-log.ndjson.

    Per PROP-003.a token meter sidecar mechanics (shipped 2026-05-14).
    Data source Plan A: manual-paste-derived. Plan B (headless /cost)
    and Plan C (console scrape) are documented fallbacks; not active.

.NOTES
    Idempotent: if the task already exists, gets updated rather than failing.
#>
$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Token-Sidecar"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sidecar  = Join-Path $repoRoot "scripts\sidecar\usage-snapshot.ps1"

if (-not (Test-Path $sidecar)) {
    Write-Host "[install] FATAL sidecar script missing: $sidecar" -ForegroundColor Red
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

Write-Host "[install] task=$taskName  sidecar=$sidecar"

# Remove existing task if present (idempotent re-install)
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install] existing task found - unregistering for clean re-install"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Action: invoke the sidecar
# Requires CurrentUser ExecutionPolicy=RemoteSigned (install-all.ps1 sets).
# Per AMD-021 strict closure, the execution-policy override workaround is
# replaced with the proper one-time policy fix.
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -File `"$sidecar`""

# Trigger: every 5 minutes, indefinitely, starting now
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration ([TimeSpan]::FromDays(365 * 5))

# Settings: short execution limit (sidecar is fast), wake to run, ok on battery
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 3) `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

# Principal: current user, Highest available privileges (matches other PARBAUGHS crons)
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
    -Description "PARBAUGHS - token meter sidecar (Plan A). Reads manual-quota-log.ndjson + writes .claude/state/quota-status.json on a 5-min cadence. Per PROP-003.a."

$created = Get-ScheduledTask -TaskName $taskName
Write-Host "[install] OK task registered: $($created.TaskName)" -ForegroundColor Green
Write-Host "[install] State: $($created.State)"
Write-Host "[install] Logs land in: $repoRoot\scripts\cron\logs\"
Write-Host ""
Write-Host "Next: verify via 'Get-ScheduledTask -TaskName $taskName' or Task Scheduler."
Write-Host "Test manually: powershell.exe -NoProfile -File scripts/sidecar/usage-snapshot.ps1"
