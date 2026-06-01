#requires -Version 5.1
<#
.SYNOPSIS
    Single-command installer for all PARBAUGHS scheduled tasks.

.DESCRIPTION
    Per Founder directive 2026-05-14 "INSTALL FLOW IS BROKEN - Team owns
    this, not Founder". Replaces the dashboard's broken `cd file://`
    consolidated install with a single owner-team-authored entry point.

    For each expected task:
      - Detect if already installed (Get-ScheduledTask)
      - If missing: invoke the per-task install script
      - If present: report and skip (idempotent)
      - If install fails: surface error clearly + continue

    Repo root resolved via $PSScriptRoot - no hardcoded paths; works from
    any clone location.

    End-of-run summary table: task / status / action.

.NOTES
    Must be run as Administrator (the per-task scripts call
    Register-ScheduledTask which requires elevation).

.EXAMPLE
    # In an admin PowerShell session:
    Set-Location 'C:\Users\Zach\smoky-mountain-open'
    .\scripts\cron\install-all.ps1
#>

$ErrorActionPreference = "Stop"

# Elevation check
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "" -NoNewline
    Write-Host "[install-all] FATAL must run as Administrator." -ForegroundColor Red
    Write-Host "  Open PowerShell with 'Run as Administrator', then:" -ForegroundColor DarkGray
    Write-Host "    Set-Location '$((Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path)'" -ForegroundColor DarkGray
    Write-Host "    .\scripts\cron\install-all.ps1" -ForegroundColor DarkGray
    exit 1
}

# Iter 16 (2026-05-14, Founder directive: agent-side fix for execution
# policy override per-run pattern): detect Restricted policy at CurrentUser
# scope + offer one-time proper fix. Replaces the prior pattern of using
# an execution-policy override flag on every invocation (a per-run
# workaround) with a one-time policy set that lets .ps1 run cleanly
# thereafter. RemoteSigned scope=CurrentUser is the conventional setting
# for development machines - allows local unsigned scripts (this repo's)
# while requiring signature on downloaded scripts. Founder consent
# required (interactive prompt).
$currentUserPolicy = Get-ExecutionPolicy -Scope CurrentUser -ErrorAction SilentlyContinue
$effectivePolicy = Get-ExecutionPolicy
if ($effectivePolicy -eq "Restricted" -or $effectivePolicy -eq "Undefined") {
    Write-Host "" -NoNewline
    Write-Host "[install-all] PowerShell ExecutionPolicy at CurrentUser scope: $currentUserPolicy" -ForegroundColor Yellow
    Write-Host "[install-all] effective policy: $effectivePolicy - .ps1 invocation requires per-run policy override." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[install-all] Proper fix: set policy ONCE at CurrentUser scope. After this," -ForegroundColor Cyan
    Write-Host "  .\scripts\cron\install-all.ps1 works directly without any per-run flag." -ForegroundColor Cyan
    Write-Host ""
    $consent = Read-Host "[install-all] Set ExecutionPolicy CurrentUser=RemoteSigned now? (y/N)"
    if ($consent -eq "y" -or $consent -eq "Y") {
        try {
            Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
            Write-Host "[install-all] OK ExecutionPolicy CurrentUser set to RemoteSigned. Future runs do not need any per-run flag." -ForegroundColor Green
        } catch {
            Write-Host "[install-all] FAIL Set-ExecutionPolicy: $_" -ForegroundColor Red
            Write-Host "[install-all] continuing - current invocation already proceeded past policy check." -ForegroundColor DarkGray
        }
    } else {
        Write-Host "[install-all] skipping policy set. Per-run policy override remains required." -ForegroundColor DarkGray
    }
    Write-Host ""
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$cronDir  = Join-Path $repoRoot "scripts\cron"

Write-Host ""
Write-Host "[install-all] repo: $repoRoot" -ForegroundColor Cyan
Write-Host "[install-all] cron: $cronDir" -ForegroundColor Cyan
Write-Host ""

$tasks = @(
    @{ TaskName = "PARBAUGHS-Downloads-Watcher";             InstallScript = "install-downloads-watcher.ps1";             Description = "scans ~/Downloads every 5 min for amendments/decisions/escalations" }
    @{ TaskName = "PARBAUGHS-Daily-Maintenance";              InstallScript = "install-maintenance.ps1";                    Description = "daily 02:55 maintenance: gc, sweep, regen-all heartbeat, telemetry, report" }
    @{ TaskName = "PARBAUGHS-Overnight-Triage";               InstallScript = "install-overnight-triage.ps1";               Description = "daily 00:00 (midnight) overnight FIQ + bug report triage" }
    @{ TaskName = "PARBAUGHS-Proposal-Readiness-Scanner";     InstallScript = "install-proposal-readiness-scanner.ps1";     Description = "every 2h scan of approved proposals + ship-close trigger" }
    @{ TaskName = "PARBAUGHS-Token-Sidecar";                  InstallScript = "install-sidecar.ps1";                        Description = "every 5 min refresh of quota-status.json from manual paste log" }
)

$summary = @()

foreach ($t in $tasks) {
    $name = $t.TaskName
    $script = Join-Path $cronDir $t.InstallScript
    Write-Host "[install-all] $name" -ForegroundColor Cyan
    Write-Host "  $($t.Description)" -ForegroundColor DarkGray

    if (-not (Test-Path $script)) {
        Write-Host "  FAIL install script missing: $script" -ForegroundColor Red
        $summary += [PSCustomObject]@{ Task = $name; Status = "install-script-missing"; Action = "skipped"; Detail = $script }
        Write-Host ""
        continue
    }

    $existing = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
    if ($existing) {
        $info = Get-ScheduledTaskInfo -TaskName $existing.TaskName -TaskPath $existing.TaskPath -ErrorAction SilentlyContinue
        $lastRun = if ($info) { $info.LastRunTime } else { "never" }
        Write-Host "  already installed (last run: $lastRun); skipping" -ForegroundColor Green
        $summary += [PSCustomObject]@{ Task = $name; Status = "already-installed"; Action = "skipped"; Detail = "last run: $lastRun" }
        Write-Host ""
        continue
    }

    Write-Host "  installing via $($t.InstallScript)..." -ForegroundColor Yellow
    try {
        & $script 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
        if ($LASTEXITCODE -eq $null -or $LASTEXITCODE -eq 0) {
            $verifyTask = Get-ScheduledTask -TaskName $name -ErrorAction SilentlyContinue
            if ($verifyTask) {
                Write-Host "  installed OK" -ForegroundColor Green
                $summary += [PSCustomObject]@{ Task = $name; Status = "newly-installed"; Action = "registered"; Detail = "task now present" }
            } else {
                Write-Host "  install script exited 0 but task not visible - investigate" -ForegroundColor Red
                $summary += [PSCustomObject]@{ Task = $name; Status = "install-uncertain"; Action = "ran"; Detail = "exit 0 but no task" }
            }
        } else {
            Write-Host "  install script exited $LASTEXITCODE" -ForegroundColor Red
            $summary += [PSCustomObject]@{ Task = $name; Status = "install-failed"; Action = "errored"; Detail = "exit $LASTEXITCODE" }
        }
    } catch {
        Write-Host "  install raised exception: $_" -ForegroundColor Red
        $summary += [PSCustomObject]@{ Task = $name; Status = "install-exception"; Action = "errored"; Detail = "$_" }
    }
    Write-Host ""
}

Write-Host ""
Write-Host "[install-all] SUMMARY" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
$summary | Format-Table -AutoSize | Out-String -Stream | ForEach-Object { Write-Host $_ }

$failed = $summary | Where-Object { $_.Status -like "install-failed*" -or $_.Status -eq "install-uncertain" -or $_.Status -eq "install-exception" -or $_.Status -eq "install-script-missing" }
$installedCount = ($summary | Where-Object { $_.Status -eq "newly-installed" }).Count
$alreadyCount   = ($summary | Where-Object { $_.Status -eq "already-installed" }).Count

Write-Host ""
if ($failed) {
    Write-Host "[install-all] DONE with $($failed.Count) failure(s); $installedCount newly installed; $alreadyCount already installed" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "[install-all] DONE - $installedCount newly installed; $alreadyCount already installed; 0 failures" -ForegroundColor Green
    exit 0
}
