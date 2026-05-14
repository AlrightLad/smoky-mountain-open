#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Proposal Readiness Scanner Cron - fires every 2 hours.

.DESCRIPTION
    Invokes .claude/scripts/scan-proposal-readiness.py against the live
    approved/ queue. The scanner evaluates each proposal against AMD-009
    8-criteria readiness gate; READY proposals enter the auto-execute
    eligible state, DEFERRED proposals get a marker JSON with enumerated
    gaps. Emits cron.start + cron.end telemetry events.

    Per AMD-011 Auto-Execute Protocol: scanner runs every 2 hours OR at
    ship-close commits, whichever comes first. This script implements the
    2-hour cron half.

.SECURITY
    Same security model as PARBAUGHS-Downloads-Watcher: runs as
    interactive user with Highest privileges. Read-only against proposal
    frontmatter; writes ONLY to .claude/state/proposals/ship-readiness-
    deferred/ markers + telemetry events.

.NOTES
    Install: scripts/cron/install-proposal-readiness-scanner.ps1 (Founder runs as Admin)
    Logs:    scripts/cron/logs/<ts>-proposal-readiness.log
    Scanner: .claude/scripts/scan-proposal-readiness.py
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-proposal-readiness.log"

# Shared helpers (Resolve-Python, Emit-CronTelemetry, etc.)
. "$PSScriptRoot\common.ps1"

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

$runId = [Guid]::NewGuid().ToString("N").Substring(0, 12)
Log "START $startedIso  repoRoot=$repoRoot  runId=$runId"

# Pre-flight: cron-paused.json gate (same as other crons)
$cronPaused = Join-Path $repoRoot ".claude\state\cron\cron-paused.json"
if (Test-Path $cronPaused) {
    Log "SKIP cron-paused.json present"
    exit 0
}

# Pre-flight: last-verify.json gate (defensive parity with watcher)
$lastVerify = Join-Path $repoRoot ".claude\state\last-verify.json"
if (Test-Path $lastVerify) {
    try {
        $lv = Get-Content $lastVerify -Raw | ConvertFrom-Json
        if ($lv.resume_after) {
            $resumeAt = [DateTime]::Parse($lv.resume_after).ToUniversalTime()
            if ((Get-Date).ToUniversalTime() -lt $resumeAt) {
                Log "SKIP last-verify resume_after=$($lv.resume_after) not yet passed"
                exit 0
            }
        }
    } catch {
        Log "WARN could not parse last-verify.json: $_"
    }
}

# Resolve Python via the canonical fallback chain (POSIX-first then Windows .exe)
$python = Resolve-Python
if (-not $python) {
    Log "FATAL no Python interpreter resolved"
    exit 1
}
Log "python=$python"

# Emit cron.start telemetry. Per AMD-009 P1 + P5 honest: this cron does
# NOT invoke Claude (it runs a deterministic Python scanner), so token
# estimate is 0; duration tracked for completeness.
Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.proposal-readiness.start" -data @{
    claude_invoked = $false
    run_id         = $runId
    cron_source    = "proposal-readiness"
    estimated_tokens = 0
}

# Run the scanner
$scanner = Join-Path $repoRoot ".claude\scripts\scan-proposal-readiness.py"
if (-not (Test-Path $scanner)) {
    Log "FATAL scanner missing: $scanner"
    Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.proposal-readiness.end" -data @{
        run_id = $runId; cron_source = "proposal-readiness"
        exit_code = 2; success = $false; reason = "scanner-missing"
        estimated_tokens = 0
    }
    exit 2
}

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
$scanOutput = & $python $scanner 2>&1
$scanExit = $LASTEXITCODE
foreach ($line in $scanOutput) { Log "  [scan] $line" }

# Parse scanner summary line for the ready/deferred counts (best-effort)
$summary = ($scanOutput | Where-Object { $_ -match "^\[scan-proposal-readiness\] summary:" } | Select-Object -First 1)
$readyCount = 0; $deferredCount = 0
if ($summary -match "(\d+)\s+ready,\s+(\d+)\s+deferred") {
    $readyCount = [int]$Matches[1]
    $deferredCount = [int]$Matches[2]
}

$ended = (Get-Date).ToUniversalTime()
$duration = ($ended - $started).TotalSeconds
Log "DONE exit=$scanExit ready=$readyCount deferred=$deferredCount duration_seconds=$duration"

Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.proposal-readiness.end" -data @{
    run_id = $runId
    cron_source = "proposal-readiness"
    exit_code = $scanExit
    success = ($scanExit -eq 0)
    ready_count = $readyCount
    deferred_count = $deferredCount
    duration_seconds = [int]$duration
    estimated_tokens = 0
}

exit $scanExit
