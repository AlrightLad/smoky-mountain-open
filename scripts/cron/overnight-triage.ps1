#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Overnight Triage Cron - fires daily at 03:00 local.

.DESCRIPTION
    Launches Claude Code with the fixed overnight-triage-prompt.txt to
    process bug reports + FIQ entries while Founder sleeps. Per the
    substrate-build-spec at .claude/state/wave-zero-dry-run/substrate-
    build-spec.md.

    Wall-clock timeout: 4 hours. Kills the Claude Code process if
    exceeded. Telemetry emit on completion.

.SECURITY
    Runs as Founder with Highest privileges via S4U. Same security model
    as install-maintenance.ps1. The triage prompt itself is a fixed file
    in the repo (overnight-triage-prompt.txt) - changes to that file go
    through normal review.

.NOTES
    Install: scripts/cron/install-overnight-triage.ps1 (Founder runs as Admin)
    Test:    scripts/cron/test-overnight-triage.ps1
    Logs:    scripts/cron/logs/<ts>-overnight-triage.log
    Prompt:  scripts/cron/overnight-triage-prompt.txt

    PAUSE HEURISTIC (v8.2 — see proposed-PAUSE_DISCIPLINE_v8.2 in
    .claude/state/wave-zero-dry-run/remediation/)
    Until PROP-003 (token-meter-wiring-sidecar) ships, the agent does not have
    a programmatic real-time token meter. Pause discipline is OP-COUNT-BASED,
    NOT percentage-based against any hardcoded constant.

    Trigger: every 5 atomic operations, the agent writes a last-verify.json
    checkpoint and EXITS cleanly (return 0). The next scheduled fire of this
    cron resumes from that checkpoint.

    Real-quota fallback: when .claude/state/telemetry/manual-quota-log.ndjson
    has a Founder-paste entry within 24 hours, the agent additionally consults
    the most recent weekly-all percentage. If >= 90%, pause overrides the op-
    count rule.

    When PROP-003 ships, this heuristic gets replaced with a real-quota check
    against the sidecar's quota-status.json. The op-count fallback remains as
    a defensive secondary trigger.

    DO NOT add hardcoded ceiling constants to this script. The round-trip
    [pause-discipline] check fails the build on any such reference outside
    the audit doc.
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")
$todayLocal = (Get-Date).ToString("yyyy-MM-dd")

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-overnight-triage.log"

# Shared helpers
. "$PSScriptRoot\common.ps1"

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

# Emit a telemetry event to .claude/state/telemetry/events/<date>.ndjson
function Emit-Telemetry {
    param([string]$event_type, [hashtable]$data)
    try {
        $eventsDir = Join-Path $repoRoot ".claude\state\telemetry\events"
        $null = New-Item -ItemType Directory -Path $eventsDir -Force -ErrorAction SilentlyContinue
        $eventFile = Join-Path $eventsDir "$todayLocal.ndjson"
        $obj = @{
            event_type = $event_type
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
            data = $data
        }
        $line = ($obj | ConvertTo-Json -Compress -Depth 6)
        Add-Content -Path $eventFile -Value $line -Encoding utf8
    } catch {
        Log "  WARN telemetry emit failed: $_"
    }
}

Log "START $startedIso  repoRoot=$repoRoot"

# Setup environment for Claude Code
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

# Merge user + machine PATH so Python and other tools resolve correctly
# (Scheduled-Task context can have a narrow PATH).
$userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$machinePath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$env:PATH = "$machinePath;$userPath"

Push-Location $repoRoot
try {
    # -------------------------------------------------------------------
    # Pre-flight 1: cron-paused.json absent
    # Pre-flight 2: last-verify.json resume_after not in the future
    # -------------------------------------------------------------------
    if (Should-SkipCron -repoRoot $repoRoot) {
        Log "SKIP cron-paused.json or last-verify.json gating the run"
        Emit-Telemetry "cron.overnight-triage.skipped" @{ reason = "preflight-skip" }
        exit 0
    }

    # -------------------------------------------------------------------
    # HALT 24 check: resume_after passed by > 1 hour without resume
    # -------------------------------------------------------------------
    if (Should-FireHalt24 -repoRoot $repoRoot) {
        Log "HALT 24: last-verify.json has resume_after passed by >1h without resume"
        # Write halt evidence
        $haltDir = Join-Path $repoRoot ".claude\state\halts"
        $null = New-Item -ItemType Directory -Path $haltDir -Force -ErrorAction SilentlyContinue
        $haltFile = Join-Path $haltDir "halt-24-auto-resume-failure-$startedTs.json"
        $haltEvidence = @{
            halt_id = 24
            halt_name = "auto-resume-failure"
            fired_at = $startedIso
            detector = "scripts/cron/overnight-triage.ps1"
            evidence_path = ".claude/state/last-verify.json"
            resolution_required = "Founder investigates why the paused cycle did not auto-resume"
        }
        $haltEvidence | ConvertTo-Json -Depth 4 | Set-Content -Path $haltFile -Encoding utf8
        Log "  halt evidence written: $haltFile"
        Emit-Telemetry "cron.overnight-triage.halted" @{ halt_id = 24; halt_file = $haltFile }
        exit 1
    }

    # -------------------------------------------------------------------
    # Resolve Claude Code
    # -------------------------------------------------------------------
    $claude = Resolve-ClaudeCode
    if (-not $claude) {
        Log "FATAL Claude Code CLI not found (tried known install paths + PATH)."
        Log "      Founder must install Claude Code before this cron can run."
        Log "      See scripts/cron/README.md for install instructions."
        Emit-Telemetry "cron.overnight-triage.error" @{ reason = "claude-code-missing" }
        exit 2
    }
    Log "claude=$claude"

    # -------------------------------------------------------------------
    # Verify the prompt file exists
    # -------------------------------------------------------------------
    $promptFile = Join-Path $PSScriptRoot "overnight-triage-prompt.txt"
    if (-not (Test-Path $promptFile)) {
        Log "FATAL prompt file missing: $promptFile"
        Emit-Telemetry "cron.overnight-triage.error" @{ reason = "prompt-missing" }
        exit 3
    }
    $promptText = Get-Content $promptFile -Raw

    # -------------------------------------------------------------------
    # Launch Claude Code with the prompt
    # -------------------------------------------------------------------
    # Claude Code invocation: --dangerously-skip-permissions allows the
    # cron context (no interactive Y/N prompts). The prompt is piped on
    # stdin (newer claude CLI versions also accept @prompt.txt; this form
    # is the most portable across versions).
    Log "launching claude-code with overnight-triage-prompt.txt"

    $procStarted = (Get-Date).ToUniversalTime()
    $maxDuration = New-TimeSpan -Hours 4

    # Use Start-Process for kill-on-timeout support
    $stdoutPath = Join-Path $logDir "$startedTs-overnight-triage.stdout"
    $stderrPath = Join-Path $logDir "$startedTs-overnight-triage.stderr"

    # Write prompt to a temp file Claude Code can read via stdin redirect
    $tempPrompt = Join-Path $env:TEMP "parbaughs-ot-prompt-$startedTs.txt"
    Set-Content -Path $tempPrompt -Value $promptText -Encoding utf8

    Log "  invocation: $claude --dangerously-skip-permissions < <prompt-file>"

    # Start-Process -RedirectStandardInput cleanly handles stdin-from-file
    # with separate stdout/stderr capture. Avoids cmd.exe's finicky quote +
    # redirect parsing.
    $proc = Start-Process -FilePath $claude `
                          -ArgumentList "--dangerously-skip-permissions" `
                          -PassThru -NoNewWindow `
                          -RedirectStandardInput $tempPrompt `
                          -RedirectStandardOutput $stdoutPath `
                          -RedirectStandardError $stderrPath

    Log "  PID: $($proc.Id)"

    # Wait with timeout
    if (-not $proc.WaitForExit([int]$maxDuration.TotalMilliseconds)) {
        Log "  TIMEOUT 4h exceeded; killing process"
        try { $proc.Kill() } catch { Log "    kill failed: $_" }
        $proc.WaitForExit(10000)
        Remove-Item $tempPrompt -Force -ErrorAction SilentlyContinue
        Emit-Telemetry "cron.overnight-triage.timeout" @{ pid = $proc.Id; duration_hours = 4 }
        exit 4
    }

    $procExit = $proc.ExitCode
    $procDuration = (Get-Date).ToUniversalTime() - $procStarted
    Log "  claude-code exited $procExit after $([math]::Round($procDuration.TotalMinutes, 1)) minutes"

    # Stream stdout/stderr into the main log for grep-ability
    if (Test-Path $stdoutPath) {
        Get-Content $stdoutPath | ForEach-Object { Log "  [stdout] $_" }
    }
    if (Test-Path $stderrPath) {
        $errLines = Get-Content $stderrPath
        if ($errLines.Count -gt 0) {
            foreach ($l in $errLines) { Log "  [stderr] $l" }
        }
    }

    # Clean up temp prompt
    Remove-Item $tempPrompt -Force -ErrorAction SilentlyContinue

    Emit-Telemetry "cron.overnight-triage.complete" @{
        exit_code = $procExit
        duration_seconds = [int]$procDuration.TotalSeconds
        stdout_lines = if (Test-Path $stdoutPath) { (Get-Content $stdoutPath).Count } else { 0 }
        stderr_lines = if (Test-Path $stderrPath) { (Get-Content $stderrPath).Count } else { 0 }
    }

    Log "DONE exit=$procExit"
    exit $procExit
}
finally {
    Pop-Location
}
