#requires -Version 5.1
<#
.SYNOPSIS
    Installs the PARBAUGHS overnight-agent Windows Scheduled Task.

.DESCRIPTION
    Founder direction 2026-05-14: register an overnight bounded-scope
    Claude Code agent that runs Tuesday + Friday at 11pm ET, executes the
    next queued prompt, and emits commits (but does NOT push) for Founder
    morning review.

    The Scheduled Task launches Git Bash (via the shim) and invokes
    scripts/overnight-agent/run-overnight-agent.sh, which enforces the
    safety preamble, token budget, fail-gate, and AMD-018 push exception
    list.

    This installer is NOT run automatically. Founder must execute it
    explicitly to enable overnight runs:

        Set-Location 'C:\Users\Zach\smoky-mountain-open'
        .\scripts\overnight-agent\install-scheduled-task.ps1

.NOTES
    Run as Administrator (Register-ScheduledTask requires elevation).
    Times are local time (matches the rest of the PARBAUGHS cron stack
    per maintenance / overnight-triage tasks).

.EXAMPLE
    .\scripts\overnight-agent\install-scheduled-task.ps1
#>

$ErrorActionPreference = "Stop"

# ── Elevation check ─────────────────────────────────────────────────────────
$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "" -NoNewline
    Write-Host "[install-overnight-agent] FATAL must run as Administrator." -ForegroundColor Red
    Write-Host "  Open PowerShell with 'Run as Administrator', then:" -ForegroundColor DarkGray
    Write-Host "    Set-Location '$((Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path)'" -ForegroundColor DarkGray
    Write-Host "    .\scripts\overnight-agent\install-scheduled-task.ps1" -ForegroundColor DarkGray
    exit 1
}

# ── Resolve paths ───────────────────────────────────────────────────────────
$repoRoot     = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$wrapperPath  = Join-Path $repoRoot "scripts\overnight-agent\run-overnight-agent.sh"
$taskName     = "PARBAUGHS-Overnight-Agent"
$taskDesc     = "Tue+Fri 23:00 bounded-scope Claude Code overnight run. Commits only — Founder reviews + pushes morning."
$workingDir   = $repoRoot

if (-not (Test-Path $wrapperPath)) {
    Write-Host "[install-overnight-agent] FATAL wrapper script not found: $wrapperPath" -ForegroundColor Red
    exit 2
}

# Resolve Git Bash. Prefer Program Files install; fall back to PATH lookup.
$bashCandidates = @(
    "${env:ProgramFiles}\Git\bin\bash.exe",
    "${env:ProgramFiles(x86)}\Git\bin\bash.exe"
)
$bashExe = $bashCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $bashExe) {
    $gitCmd = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($gitCmd) {
        $gitDir = Split-Path $gitCmd.Source -Parent
        $candidate = Join-Path $gitDir "..\bin\bash.exe"
        if (Test-Path $candidate) { $bashExe = (Resolve-Path $candidate).Path }
    }
}
if (-not $bashExe) {
    Write-Host "[install-overnight-agent] FATAL Git Bash not found." -ForegroundColor Red
    Write-Host "  Install Git for Windows (https://gitforwindows.org) or set PATH so git.exe + bash.exe are reachable." -ForegroundColor DarkGray
    exit 3
}

Write-Host ""
Write-Host "[install-overnight-agent] repo:    $repoRoot" -ForegroundColor Cyan
Write-Host "[install-overnight-agent] wrapper: $wrapperPath" -ForegroundColor Cyan
Write-Host "[install-overnight-agent] bash:    $bashExe" -ForegroundColor Cyan
Write-Host "[install-overnight-agent] task:    $taskName" -ForegroundColor Cyan
Write-Host ""

# ── Idempotent re-install ───────────────────────────────────────────────────
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[install-overnight-agent] task already exists; removing for clean re-install." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# ── Action ──────────────────────────────────────────────────────────────────
# Git Bash expects POSIX-style paths. Convert C:\... to /c/... for the
# wrapper argument; Git Bash auto-handles this on invocation but be
# explicit to avoid surprises in mixed environments.
$wrapperPosix = $wrapperPath -replace '\\','/' -replace '^([A-Za-z]):','/$1' | ForEach-Object { $_.ToLower().Substring(0,3) + $_.Substring(3) }
# Simpler: trust Git Bash's auto-translation and pass the win path quoted.
$actionArgs = "--login -c `"cd '$repoRoot' && bash '$wrapperPath'`""
$action = New-ScheduledTaskAction -Execute $bashExe -Argument $actionArgs -WorkingDirectory $workingDir

# ── Triggers ────────────────────────────────────────────────────────────────
# Tuesday + Friday at 23:00 local time.
$triggerTue = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Tuesday -At "23:00"
$triggerFri = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday  -At "23:00"

# ── Settings ────────────────────────────────────────────────────────────────
# - AllowStartIfOnBatteries + DontStopIfGoingOnBatteries: laptop friendly
# - StartWhenAvailable: catch up if machine was off
# - WakeToRun: allowed if Founder's machine sleeps
# - ExecutionTimeLimit: hard 4h cap (wrapper enforces internal 3h cap)
# - MultipleInstances: IgnoreNew (avoid stacking if a run is still active)
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -WakeToRun `
    -ExecutionTimeLimit (New-TimeSpan -Hours 4) `
    -MultipleInstances IgnoreNew

# ── Principal ───────────────────────────────────────────────────────────────
# Run as the currently-logged-in user; need interactive token for `claude`
# (which may need to read user config). Run with highest privileges so
# git/npm/hooks behave the same as a normal terminal.
$principal = New-ScheduledTaskPrincipal `
    -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType S4U `
    -RunLevel Highest

# ── Register ────────────────────────────────────────────────────────────────
Register-ScheduledTask `
    -TaskName $taskName `
    -Description $taskDesc `
    -Action $action `
    -Trigger @($triggerTue, $triggerFri) `
    -Settings $settings `
    -Principal $principal | Out-Null

Write-Host "[install-overnight-agent] OK task registered." -ForegroundColor Green
Write-Host ""
Write-Host "  Tuesday 23:00 + Friday 23:00 local time." -ForegroundColor DarkGray
Write-Host "  Wrapper:        $wrapperPath" -ForegroundColor DarkGray
Write-Host "  Logs:           .claude/state/overnight-agent/logs/<date>.log" -ForegroundColor DarkGray
Write-Host "  Run records:    .claude/state/overnight-agent/runs/<date>.json" -ForegroundColor DarkGray
Write-Host "  Queue prompts:  scripts/overnight-agent/queue-prompt.sh <prompt-file>" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To run NOW (manual test, will execute next queued prompt):" -ForegroundColor DarkGray
Write-Host "    Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To uninstall:" -ForegroundColor DarkGray
Write-Host "    Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor DarkGray
Write-Host ""
exit 0
