#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Token Meter Sidecar - Plan A (manual-paste-derived).

.DESCRIPTION
    Per PROP-003.a token meter sidecar mechanics. Reads the most recent
    entries from .claude/state/telemetry/manual-quota-log.ndjson, transforms
    into the unified quota-status.json schema, and writes to
    .claude/state/quota-status.json.

    SCOPE-ISOLATED per PROP-003.a discipline: this script produces the
    quota-status.json file. It does NOT modify dashboards, telemetry
    aggregators, or governance docs. Those integrations are PROP-003.b.

    DATA SOURCE: 'manual-paste' (Plan A from the proposal).
    refresh-quota-manual.ps1 is the operator-facing entry that populates
    manual-quota-log.ndjson. This sidecar is a translator + freshness
    signal layered on that existing source.

    SCHEMA (quota-status.json):
        {
          "as_of": "<ISO-8601 UTC>",
          "data_source": "manual-paste" | "manual-paste-stale" | "none",
          "stale_seconds": <int>,
          "weekly_tokens": <int>,
          "weekly_cap": <int | null>,
          "weekly_pct": <0-1 | null>,
          "org_monthly_tokens": <int>,
          "org_monthly_cap": <int | null>,
          "org_monthly_pct": <0-1 | null>,
          "org_monthly_reset_boundary": "<ISO-8601 UTC | null>",
          "_warning": "<set if stale_seconds > threshold>"
        }

    NO-DATA CASE (per proposal abandon_criteria): when manual-quota-log
    is absent OR empty, sidecar emits a no-data quota-status.json with
    data_source='none' + descriptive _warning. The file IS produced;
    downstream consumers (PROP-003.b) read the no-data state honestly
    rather than crashing on missing file.

.NOTES
    Install: scripts/cron/install-sidecar.ps1 (Founder, as Administrator)
    Logs:    scripts/cron/logs/<ts>-sidecar.log
    Config:  scripts/sidecar/usage-snapshot-config.json
    Output:  .claude/state/quota-status.json
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-sidecar.log"

# Shared helpers (Emit-CronTelemetry, etc.). common.ps1 is in scripts/cron/.
. "$repoRoot\scripts\cron\common.ps1"

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

$runId = [Guid]::NewGuid().ToString("N").Substring(0, 12)
Log "START $startedIso  repoRoot=$repoRoot  runId=$runId"

# Pre-flight: cron-paused.json gate
$cronPaused = Join-Path $repoRoot ".claude\state\cron\cron-paused.json"
if (Test-Path $cronPaused) {
    Log "SKIP cron-paused.json present"
    exit 0
}

# Load config
$configPath = Join-Path $repoRoot "scripts\sidecar\usage-snapshot-config.json"
$config = $null
try {
    $config = Get-Content $configPath -Raw -Encoding utf8 | ConvertFrom-Json
} catch {
    Log "FATAL could not parse config at $configPath - $_"
    exit 1
}
$staleDataThreshold = $config.stale_data_threshold_seconds
if (-not $staleDataThreshold) { $staleDataThreshold = 86400 }

# Default quota caps - emit null when no override is set so downstream
# consumers render an honest 'unknown' state rather than a fictional cap.
# Per AMD-001/AMD-002/AMD-014 pause-discipline reactivation: production tree
# must not contain references to the fictional 3.5M weekly cap. The cap can
# only enter via $config.weekly_cap_override (operator-confirmed) or a future
# automated source that supplies a real value. When the cap is null the
# weekly_tokens conversion is skipped (weekly_pct still emitted from paste).
$weeklyCap = if ($config.weekly_cap_override) { $config.weekly_cap_override } else { $null }
$orgMonthlyCap = if ($config.org_monthly_cap_override) { $config.org_monthly_cap_override } else { $null }

# Read the latest manual-quota-log entries (one entry per scope per paste)
$logFile = Join-Path $repoRoot ".claude\state\telemetry\manual-quota-log.ndjson"
$weeklyEntry = $null
$orgMonthlyEntry = $null
$mostRecentTs = $null

if (Test-Path $logFile) {
    $lines = Get-Content $logFile -Encoding utf8 -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if (-not $line.Trim()) { continue }
        try {
            $entry = $line | ConvertFrom-Json
        } catch { continue }
        $scope = $entry.scope
        if (-not $entry.timestamp) { continue }
        $entryTs = [DateTime]::Parse($entry.timestamp).ToUniversalTime()
        if (-not $mostRecentTs -or $entryTs -gt $mostRecentTs) {
            $mostRecentTs = $entryTs
        }
        if ($scope -eq "weekly-all" -and (-not $weeklyEntry -or $entryTs -gt [DateTime]::Parse($weeklyEntry.timestamp).ToUniversalTime())) {
            $weeklyEntry = $entry
        }
        if ($scope -eq "org-monthly" -and (-not $orgMonthlyEntry -or $entryTs -gt [DateTime]::Parse($orgMonthlyEntry.timestamp).ToUniversalTime())) {
            $orgMonthlyEntry = $entry
        }
    }
}

# Compose the quota-status.json payload
$now = (Get-Date).ToUniversalTime()
$status = [ordered]@{
    schema_version = 1
    as_of = $now.ToString("o")
    data_source = "none"
    stale_seconds = $null
    weekly_tokens = 0
    weekly_cap = $weeklyCap
    weekly_pct = $null
    org_monthly_tokens = 0
    org_monthly_cap = $orgMonthlyCap
    org_monthly_pct = $null
    org_monthly_reset_boundary = $config.org_monthly_reset_boundary_override
    "_warning" = $null
    "_source_log_path" = ".claude/state/telemetry/manual-quota-log.ndjson"
    "_run_id" = $runId
}

# BUG-6 fix (2026-05-16): Founder reported "sidecar for token counter is
# still not working" because manual-quota-log perpetually absent → sidecar
# perpetually reported data_source=none → UI perpetually showed "sidecar
# empty". That made the sidecar a half-baked feature on a Founder-only
# workstation where claude.ai pastes are infrequent.
#
# Fix: when manual paste is absent OR empty, AUTO-DERIVE from the measured
# weekly_tokens in current-snapshot.json (real cycle telemetry, 7-day
# window — per BUG-7 fix). Mark data_source="auto-derived" so the UI can
# show the value with an honest "measured · paste for ground truth %"
# label instead of "sidecar empty".
function Get-AutoDerivedWeeklyTokens {
    param([string]$repoRoot)
    # Two-source fallback (2026-05-21 Founder data-accuracy fix):
    # 1. current-snapshot.json (cycle telemetry)
    # 2. session-transcript-summary.json (claude.ai conversation JSONL roll-up)
    #
    # current-snapshot may be 0 if no cycles are tagged for the week. Session
    # transcripts persist all token usage. Fall through to the broader source
    # when the narrower one is empty.
    $snapPath = Join-Path $repoRoot ".claude\state\telemetry\aggregates\current-snapshot.json"
    if (Test-Path $snapPath) {
        try {
            $snap = Get-Content $snapPath -Raw -Encoding utf8 | ConvertFrom-Json
            $measured = [int]($snap.weekly_tokens)
            if ($measured -gt 0) { return $measured }
        } catch { }
    }
    # Fallback: session-transcript-summary.json carries by_day_total (~/.claude/projects/*.jsonl roll-up).
    # Sum the last 7 days (including today) to compute weekly_real_7d on the fly.
    $transPath = Join-Path $repoRoot ".claude\state\telemetry\aggregates\session-transcript-summary.json"
    if (Test-Path $transPath) {
        try {
            $trans = Get-Content $transPath -Raw -Encoding utf8 | ConvertFrom-Json
            $byDay = $trans.by_day_total
            if ($byDay) {
                $cutoff = (Get-Date).AddDays(-7).Date
                [int64]$sum = 0
                foreach ($prop in $byDay.PSObject.Properties) {
                    try {
                        $d = [datetime]::ParseExact($prop.Name, "yyyy-MM-dd", $null)
                        if ($d -ge $cutoff) { $sum += [int64]$prop.Value }
                    } catch { }
                }
                if ($sum -gt 0) { return $sum }
            }
        } catch { }
    }
    return $null
}

if (-not (Test-Path $logFile)) {
    $autoTokens = Get-AutoDerivedWeeklyTokens -repoRoot $repoRoot
    if ($autoTokens) {
        $status.data_source = "auto-derived"
        $status.weekly_tokens = $autoTokens
        $status."_warning" = "auto-derived from measured cycle telemetry (last 7 days); run scripts/refresh-quota-manual.ps1 to paste claude.ai % for live quota tracking"
        Log "auto-derived: weekly_tokens=$autoTokens (manual-quota-log absent)"
    } else {
        $status.data_source = "none"
        $status."_warning" = "no measured telemetry and no manual paste; run scripts/refresh-quota-manual.ps1"
        Log "no-data: manual-quota-log absent + no measured telemetry"
    }
} elseif (-not $mostRecentTs) {
    $autoTokens = Get-AutoDerivedWeeklyTokens -repoRoot $repoRoot
    if ($autoTokens) {
        $status.data_source = "auto-derived"
        $status.weekly_tokens = $autoTokens
        $status."_warning" = "auto-derived from measured cycle telemetry (last 7 days); manual-quota-log present but contains no parseable entries"
        Log "auto-derived: weekly_tokens=$autoTokens (manual-quota-log empty)"
    } else {
        $status.data_source = "none"
        $status."_warning" = "manual-quota-log.ndjson exists but contains no parseable entries"
        Log "no-data: log present but empty"
    }
} else {
    $ageSeconds = [int]($now - $mostRecentTs).TotalSeconds
    $status.stale_seconds = $ageSeconds
    if ($ageSeconds -gt $staleDataThreshold) {
        $status.data_source = "manual-paste-stale"
        $status."_warning" = "manual-quota-log last updated $ageSeconds seconds ago (> $staleDataThreshold threshold); rerun refresh-quota-manual.ps1"
        Log "stale: latest entry age=$ageSeconds seconds"
    } else {
        $status.data_source = "manual-paste"
    }
    if ($weeklyEntry) {
        $pct = [double]$weeklyEntry.percentage / 100.0
        $status.weekly_pct = [math]::Round($pct, 6)
        if ($weeklyCap) { $status.weekly_tokens = [int]($pct * $weeklyCap) }
    }
    if ($orgMonthlyEntry) {
        $pct = [double]$orgMonthlyEntry.percentage / 100.0
        $status.org_monthly_pct = [math]::Round($pct, 6)
        if ($orgMonthlyCap) { $status.org_monthly_tokens = [int]($pct * $orgMonthlyCap) }
    }
    Log "wrote $($status.data_source) snapshot - weekly_pct=$($status.weekly_pct) org_monthly_pct=$($status.org_monthly_pct)"
}

# Write atomic: temp file + rename, prevents partial reads if consumer
# reads while sidecar writes. BOM-less UTF-8 (Set-Content -Encoding utf8
# writes BOM, which json.loads rejects; UTF8Encoding($false) is the no-BOM
# form).
$outputPath = Join-Path $repoRoot ".claude\state\quota-status.json"
$tempPath = "$outputPath.tmp"
$jsonText = $status | ConvertTo-Json -Depth 6
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tempPath, $jsonText, $utf8NoBom)
Move-Item -Path $tempPath -Destination $outputPath -Force
Log "wrote $outputPath"

# Emit telemetry. claude_invoked=$false (deterministic transform, no Claude).
$durationSeconds = [int]((Get-Date).ToUniversalTime() - $started).TotalSeconds
Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.token-sidecar.end" -data @{
    run_id = $runId
    cron_source = "token-sidecar"
    success = $true
    data_source = $status.data_source
    stale_seconds = $status.stale_seconds
    weekly_pct = $status.weekly_pct
    org_monthly_pct = $status.org_monthly_pct
    duration_seconds = $durationSeconds
    estimated_tokens = 0
    claude_invoked = $false
}

# BUG-1/BUG-4 fix (2026-05-16): refresh dashboard.html + activity.html + main-flows.html
# locally on every sidecar tick so the rendered surfaces stay current even when no
# commit fires (downloads-watcher SKIPs on dirty tree → no post-commit hook →
# dashboard goes stale). The watcher / commit pipeline still owns the COMMITTED
# state; this only keeps the working-tree HTML in sync with the latest data so the
# operator's local browser at http://localhost:8765 shows reality.
#
# Local-only by design: we deliberately do NOT git-add or git-commit the refreshed
# HTML here. That avoids competing with the watcher's AMD-020 Class A commit policy
# and prevents 5-min cadence commit storms. The post-commit hook still does the
# canonical regen + commit when content changes (proposals/amendments/code).
$pythonExe = $null
$candidates = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python312\python.exe",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\Python\Python311\python.exe",
    "python.exe"
)
foreach ($cand in $candidates) {
    if (Test-Path $cand -ErrorAction SilentlyContinue) { $pythonExe = $cand; break }
    $resolved = Get-Command $cand -ErrorAction SilentlyContinue
    if ($resolved) { $pythonExe = $resolved.Source; break }
}

if ($pythonExe) {
    $regenScripts = @(
        "scripts\aggregate-telemetry.py",
        "scripts\aggregate-token-usage.py",
        "scripts\aggregate-approvals-pipeline.py",
        "scripts\aggregate-architecture-review.py",
        "scripts\aggregate-fiq-status.py",
        "scripts\aggregate-test-health.py",
        "scripts\aggregate-security-health.py",
        "scripts\inject-health-banners.py",
        "scripts\regen-dashboard.py",
        "scripts\regen-activity.py",
        "scripts\regen-token-usage.py"
    )
    foreach ($script in $regenScripts) {
        $fullPath = Join-Path $repoRoot $script
        if (-not (Test-Path $fullPath)) {
            Log "skip $script (missing)"
            continue
        }
        try {
            $regenOut = & $pythonExe $fullPath 2>&1 | Out-String
            $exitCode = $LASTEXITCODE
            if ($exitCode -ne 0) {
                Log "WARN $script exit=$exitCode  $($regenOut.Trim() -replace "`r?`n", ' | ')"
            } else {
                $shortOut = ($regenOut.Trim() -split "`r?`n")[0]
                Log "regen $script  $shortOut"
            }
        } catch {
            Log "WARN $script threw: $_"
        }
    }
} else {
    Log "WARN no python executable found; skipping dashboard refresh"
}

Log "DONE data_source=$($status.data_source) duration_seconds=$durationSeconds"
exit 0
