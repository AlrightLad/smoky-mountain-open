#requires -Version 5.1
<#
.SYNOPSIS
    Install (or update) the PARBAUGHS-Daily-Maintenance Scheduled Task.

.DESCRIPTION
    Registers a daily Scheduled Task firing at 02:55 local time, running
    maintenance.ps1 with Highest privileges.

.SECURITY MODEL
    The maintenance task needs admin to run wsl --update, pip install,
    npm update, etc. Windows Scheduled Tasks support this via the S4U
    (Service for User) logon type - Founder enters their Windows password
    ONCE during install, and Windows stores it encrypted in the task
    definition. The task then runs unattended with those credentials.

    IMPORTANT: this means the script in maintenance.ps1 runs with
    Founder's FULL credentials. Every line of that script must be trusted.
    Critic enforces this on every PR that modifies maintenance.ps1.

.NOTES
    Idempotent: existing task is unregistered and re-registered.
    Founder runs THIS install script as Administrator. The team CANNOT
    install this task - admin password is required interactively.
#>

$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Daily-Maintenance"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$script   = Join-Path $repoRoot "scripts\cron\maintenance.ps1"

if (-not (Test-Path $script)) {
    Write-Host "[install-maint] FATAL maintenance script missing: $script" -ForegroundColor Red
    exit 2
}

# Elevation check - installing a Highest-privilege task requires admin
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[install-maint] FATAL must run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell -> 'Run as Administrator' and re-run." -ForegroundColor Red
    exit 1
}

Write-Host "[install-maint] task=$taskName  script=$script"
Write-Host ""
Write-Host "This task runs as YOU with admin privileges, fires DAILY at 02:55 local time."
Write-Host "Windows stores your password encrypted in the task definition."
Write-Host ""

# Prompt for credentials (S4U: stored encrypted by Windows)
$cred = Get-Credential -UserName $env:USERNAME `
                       -Message "Enter Windows password for PARBAUGHS-Daily-Maintenance task"
if (-not $cred) {
    Write-Host "[install-maint] FATAL no credentials provided" -ForegroundColor Red
    exit 1
}

# Convert SecureString to plain-text ONLY for the Register-ScheduledTask call
$plainPw = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($cred.Password)
)

# Remove existing task if present (idempotent re-install)
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install-maint] existing task found - unregistering for clean re-install"
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Action: invoke maintenance script via powershell.exe
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""

# Trigger: daily at 02:55 local
$trigger = New-ScheduledTaskTrigger -Daily -At "02:55"

# Settings: 30-min timeout (WSL updates can take 5+ min); resilient
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -StartWhenAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries

# Register with S4U + Highest. Windows encrypts and stores the password.
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -User $cred.UserName `
    -Password $plainPw `
    -RunLevel Highest `
    -Description "PARBAUGHS daily maintenance: git health, log rotation, dep updates, state audit, regen-all. Per Fix B."

# Zero the plaintext password reference
$plainPw = $null
[System.GC]::Collect()

$created = Get-ScheduledTask -TaskName $taskName
Write-Host ""
Write-Host "[install-maint] OK task registered: $($created.TaskName)" -ForegroundColor Green
Write-Host "[install-maint] State:    $($created.State)"
Write-Host "[install-maint] Trigger:  Daily 02:55 local"
Write-Host "[install-maint] Timeout:  30 minutes"
Write-Host "[install-maint] RunLevel: Highest (admin)"
Write-Host "[install-maint] Logs:     $repoRoot\scripts\cron\logs\"
Write-Host "[install-maint] Daily report: $repoRoot\.claude\state\cron\maintenance-<date>.md"
Write-Host ""
Write-Host "Test once manually (no admin needed for test-only steps):"
Write-Host "  powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/cron/test-maintenance.ps1"
