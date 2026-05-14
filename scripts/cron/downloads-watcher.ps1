#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Downloads Watcher - scans %USERPROFILE%\Downloads for
    decisions-*.json files exported from proposals.html, applies them
    via .claude/scripts/apply-decisions.sh, regenerates dashboards,
    and commits locally (does NOT push).

.DESCRIPTION
    Per PROPOSAL_LIFECYCLE_v8.2. Designed to run every 5 minutes via
    Windows Task Scheduler. Idempotent - re-runs are safe.

.NOTES
    Install: scripts/cron/install-downloads-watcher.ps1 (Founder runs as Admin)
    Test:    scripts/cron/test-downloads-watcher.ps1
    Logs:    scripts/cron/logs/<ts>-downloads-watcher.log
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")

# --- Locate repo root + python ---
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-downloads-watcher.log"

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

# Shared helpers (Resolve-GitBash, Resolve-Python, Should-SkipCron, etc.)
. "$PSScriptRoot\common.ps1"

$runId = [Guid]::NewGuid().ToString("N").Substring(0, 12)
$script:cronSuccess = $true
$script:cronExitReason = "ok"
Log "START $startedIso  repoRoot=$repoRoot  runId=$runId"
Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.downloads-watcher.start" -data @{
    cron_source = "downloads-watcher"; run_id = $runId; claude_invoked = $false
}

# Locate python
$pythonCandidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
)
$python = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $python) {
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { $python = $cmd.Source }
}
if (-not $python) {
    Log "FATAL no python.exe found"
    $script:cronSuccess = $false
    $script:cronExitReason = "no-python"
    exit 2
}
Log "python=$python"

Push-Location $repoRoot
try {
    # --- Pre-flight: cron-paused.json absent ---
    $cronPaused = Join-Path $repoRoot ".claude\state\cron-paused.json"
    if (Test-Path $cronPaused) {
        Log "SKIP cron-paused.json present (governance pause respected)"
        $script:cronExitReason = "skip-paused"
        exit 0
    }

    # --- Pre-flight: last-verify.json absent OR resume_after has passed ---
    $lastVerify = Join-Path $repoRoot ".claude\state\last-verify.json"
    if (Test-Path $lastVerify) {
        try {
            $lv = Get-Content $lastVerify -Raw | ConvertFrom-Json
            $resumeAfter = $null
            if ($lv.resume_after) { $resumeAfter = [DateTime]::Parse($lv.resume_after).ToUniversalTime() }
            if ($resumeAfter -and $started -lt $resumeAfter) {
                Log "SKIP last-verify.json present and resume_after=$($lv.resume_after) not yet passed"
                $script:cronExitReason = "skip-verify-pending"
                exit 0
            }
        } catch {
            Log "WARN could not parse last-verify.json: $_"
        }
    }

    # --- Pre-flight: working tree clean (with auto-commit of routine cron output) ---
    # Routine cron output (telemetry events + aggregates) re-dirties the tree
    # on every cron cycle. Without auto-commit, the watcher refuses Founder
    # decisions indefinitely. We tolerate dirt ONLY when every dirty path
    # matches the routine-output allowlist; anything else still triggers skip.
    $routinePatterns = @(
        '^\.claude/state/telemetry/events/.+\.ndjson$',
        '^\.claude/state/telemetry/aggregates/.+\.json$',
        '^package-lock\.json$'
    )
    $allDirtyRaw = @()
    $allDirtyRaw += (& git diff --name-only HEAD 2>$null)
    $allDirtyRaw += (& git diff --cached --name-only 2>$null)
    $allDirtyRaw += (& git ls-files --others --exclude-standard 2>$null)
    $allDirty = $allDirtyRaw | Where-Object { $_ } | Sort-Object -Unique

    if ($allDirty.Count -gt 0) {
        $nonRoutine = @()
        foreach ($f in $allDirty) {
            $isRoutine = $false
            foreach ($pat in $routinePatterns) {
                if ($f -match $pat) { $isRoutine = $true; break }
            }
            if (-not $isRoutine) { $nonRoutine += $f }
        }
        if ($nonRoutine.Count -gt 0) {
            Log "SKIP working tree dirty with non-routine files: $($nonRoutine -join ', ')"
            $script:cronExitReason = "skip-dirty"
            exit 0
        }
        Log "AUTO-COMMIT routine cron output before preflight: $($allDirty.Count) files"
        foreach ($f in $allDirty) { & git add -- $f 2>&1 | Out-Null }
        $env:GIT_AUTHOR_NAME  = "PARBAUGHS Cron"
        $env:GIT_AUTHOR_EMAIL = "cron@parbaughs.local"
        $env:GIT_COMMITTER_NAME  = "PARBAUGHS Cron"
        $env:GIT_COMMITTER_EMAIL = "cron@parbaughs.local"
        $msg = "cron(routine): auto-commit telemetry output before watcher preflight (" + (Get-Date).ToUniversalTime().ToString("o") + ")"
        & git commit -m $msg 2>&1 | ForEach-Object { Log "  [auto-commit] $_" }
        if ($LASTEXITCODE -ne 0) {
            Log "WARN auto-commit of routine output failed (continuing — preflight will recheck)"
        }
    }

    # Re-verify tree clean after auto-commit (defensive)
    & git diff --quiet HEAD 2>$null
    if ($LASTEXITCODE -ne 0) {
        Log "SKIP working tree still dirty after auto-commit attempt"
        $script:cronExitReason = "skip-dirty"
        exit 0
    }

    # --- Scan Downloads ---
    $downloads = Join-Path $env:USERPROFILE "Downloads"
    if (-not (Test-Path $downloads)) {
        Log "FATAL Downloads folder not found: $downloads"
        $script:cronSuccess = $false
        $script:cronExitReason = "no-downloads-folder"
        exit 1
    }
    $marker = Join-Path $repoRoot ".claude\state\proposals\.last-processed-decisions.json"
    $lastProcessed = [DateTime]::MinValue.ToUniversalTime()
    if (Test-Path $marker) {
        try {
            $m = Get-Content $marker -Raw | ConvertFrom-Json
            if ($m.last_processed_mtime_utc) {
                $lastProcessed = [DateTime]::Parse($m.last_processed_mtime_utc).ToUniversalTime()
            }
        } catch {}
    }
    Log "scanning $downloads for decisions-*.json and amendments-*.json newer than $($lastProcessed.ToString('o'))"

    # Two recognized file patterns (amendments lifecycle DC-7+):
    #   decisions-*.json  → kind="decisions"  → apply-decisions.sh (proposals)
    #   amendments-*.json → kind="amendments" → apply-amendments.sh (governance)
    # Watcher inspects first line of JSON to determine kind for safety.
    $candidates = @(Get-ChildItem -Path $downloads -Filter "decisions-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed }) + @(Get-ChildItem -Path $downloads -Filter "amendments-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed })
    $candidates = $candidates | Sort-Object LastWriteTimeUtc

    if ($candidates.Count -eq 0) {
        Log "DONE no new decisions or amendments files"
        $script:cronExitReason = "no-new-files"
        exit 0
    }

    Log "found $($candidates.Count) new candidate file(s)"

    $inbox = Join-Path $repoRoot ".claude\state\proposals\inbox"
    $null = New-Item -ItemType Directory -Path $inbox -Force -ErrorAction SilentlyContinue

    $applyFailures = 0
    $appliedAnything = $false
    foreach ($f in $candidates) {
        Log "processing $($f.Name) (mtime=$($f.LastWriteTimeUtc.ToString('o')))"

        # Read JSON to detect kind; default to "decisions" if no kind field
        # (backward compatibility with pre-amendments-lifecycle exports).
        $kind = "decisions"
        try {
            $jsonObj = Get-Content $f.FullName -Raw | ConvertFrom-Json
            if ($jsonObj.kind) { $kind = $jsonObj.kind }
        } catch {
            Log "  WARN could not parse JSON: $_ - defaulting to kind=decisions"
        }
        Log "  detected kind: $kind"

        # Route to the appropriate apply script per kind
        switch ($kind) {
            "amendments" {
                $applyScript = ".claude/scripts/apply-amendments.sh"
                $inboxSub = Join-Path $repoRoot ".claude\state\amendments\inbox"
            }
            "decisions" {
                $applyScript = ".claude/scripts/apply-decisions.sh"
                $inboxSub = $inbox
            }
            default {
                Log "  FATAL unrecognized kind=$kind in $($f.Name); skipping"
                $applyFailures++
                continue
            }
        }

        $null = New-Item -ItemType Directory -Path $inboxSub -Force -ErrorAction SilentlyContinue
        $dest = Join-Path $inboxSub $f.Name
        Copy-Item -Path $f.FullName -Destination $dest -Force
        Log "  copied to $dest"

        # Run apply script via Git Bash (Fix C: no WSL).
        $gitBash = Resolve-GitBash
        if (-not $gitBash) {
            Log "  FATAL Git Bash not found at any known install path; cannot run $applyScript"
            $applyFailures++
            break
        }
        $bashPath = $dest -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'
        $bashPath = $bashPath.Substring(0,2).ToLower() + $bashPath.Substring(2)
        & $gitBash -c "$applyScript '$bashPath'" 2>&1 | ForEach-Object { Log "    [apply] $_" }
        if ($LASTEXITCODE -ne 0) {
            Log "  $applyScript FAILED for $($f.Name) (exit $LASTEXITCODE)"
            $applyFailures++
            continue
        }
        Log "  $applyScript OK"
        $appliedAnything = $true

        # Update marker AFTER successful apply
        $marker_data = @{
            last_processed_mtime_utc = $f.LastWriteTimeUtc.ToString("o")
            last_processed_filename  = $f.Name
            last_processed_kind      = $kind
            last_processed_at        = (Get-Date).ToUniversalTime().ToString("o")
        }
        $marker_data | ConvertTo-Json | Set-Content -Path $marker -Encoding utf8
        Log "  marker updated"
    }

    if ($applyFailures -gt 0) {
        Log "FAIL $applyFailures apply-decisions.sh failures"
        $script:cronSuccess = $false
        $script:cronExitReason = "apply-failures"
        exit 1
    }

    if ($appliedAnything) {
        Log "running regen-all.ps1..."
        $regenScript = Join-Path $repoRoot "scripts\regen-all.ps1"
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $regenScript 2>&1 | ForEach-Object { Log "    [regen] $_" }
        $regenRc = $LASTEXITCODE
        if ($regenRc -ne 0) {
            Log "regen-all FAILED with exit $regenRc - apply-decisions changes are committed by the apply script; regen output may be stale"
            $script:cronSuccess = $false
            $script:cronExitReason = "regen-all-failed"
            exit 1
        }
        Log "regen-all OK"
    }

    Log "DONE applied=$appliedAnything"
    $script:cronExitReason = if ($appliedAnything) { "applied" } else { "no-op" }
    exit 0
}
finally {
    Pop-Location
    try {
        $endedAt = (Get-Date).ToUniversalTime()
        $durationMs = [int]($endedAt - $started).TotalMilliseconds
        Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.downloads-watcher.end" -data @{
            cron_source    = "downloads-watcher"
            run_id         = $runId
            duration_ms    = $durationMs
            success        = $script:cronSuccess
            exit_reason    = $script:cronExitReason
            claude_invoked = $false
        }
    } catch {
        # Best-effort - never let telemetry break the cron exit
    }
}
