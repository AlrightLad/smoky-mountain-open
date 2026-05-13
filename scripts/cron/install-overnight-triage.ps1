#requires -Version 5.1
<#
.SYNOPSIS
    Install (or update) the PARBAUGHS-Overnight-Triage Scheduled Task.

.DESCRIPTION
    Registers a daily Scheduled Task firing at 03:00 local time, running
    overnight-triage.ps1 with Highest privileges via S4U.

.SECURITY MODEL
    Same security model as install-maintenance.ps1. The Overnight Triage
    task launches Claude Code with Founder's credentials. The fixed
    prompt at scripts/cron/overnight-triage-prompt.txt is the only input
    Claude Code sees - changes to that prompt go through normal review.

.NOTES
    Idempotent: existing task is unregistered and re-registered.
    Founder runs THIS install script as Administrator. The team CANNOT
    install this task - admin password is required interactively.
#>

$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Overnight-Triage"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$script   = Join-Path $repoRoot "scripts\cron\overnight-triage.ps1"

if (-not (Test-Path $script)) {
    Write-Host "[install-ot] FATAL overnight-triage script missing: $script" -ForegroundColor Red
    exit 2
}

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[install-ot] FATAL must run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator' and re-run." -ForegroundColor Red
    exit 1
}

Write-Host "[install-ot] task=$taskName  script=$script"
Write-Host ""
Write-Host "This task runs as YOU with admin privileges, fires DAILY at 03:00 local time."
Write-Host "Wall-clock timeout: 4 hours. Windows stores your password encrypted in the task."
Write-Host ""
Write-Host "NOTE: this task launches Claude Code with the fixed prompt at"
Write-Host "      scripts/cron/overnight-triage-prompt.txt. Make sure Claude Code"
Write-Host "      is installed before installing this task."
Write-Host ""

$cred = Get-Credential -UserName $env:USERNAME `
                       -Message "Enter Windows password for PARBAUGHS-Overnight-Triage task"
if (-not $cred) {
    Write-Host "[install-ot] FATAL no credentials provided" -ForegroundColor Red
    exit 1
}

$plainPw = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password)
)

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install-ot] existing task found - unregistering for clean re-install"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""

$trigger = New-ScheduledTaskTrigger -Daily -At "03:00"

$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $cred.UserName `
    -Password $plainPw `
    -RunLevel Highest `
    -Description "PARBAUGHS overnight triage: launches Claude Code to process FIQ + bug-reports inbox, run heartbeat, commit locally. Per substrate-build-spec."

$plainPw = $null
[System.GC]::Collect()

$created = Get-ScheduledTask -TaskName $taskName
Write-Host ""
Write-Host "[install-ot] OK task registered: $($created.TaskName)" -ForegroundColor Green
Write-Host "[install-ot] State:    $($created.State)"
Write-Host "[install-ot] Trigger:  Daily 03:00 local"
Write-Host "[install-ot] Timeout:  4 hours"
Write-Host "[install-ot] RunLevel: Highest (admin)"
Write-Host "[install-ot] Logs:     $repoRoot\scripts\cron\logs\"
Write-Host "[install-ot] Session journal: $repoRoot\.claude\state\cron\<date>-overnight-run.md"
Write-Host ""
Write-Host "Test once manually before first scheduled fire:"
Write-Host "  powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/cron/test-overnight-triage.ps1"
