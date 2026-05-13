#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Downloads Watcher — scans %USERPROFILE%\Downloads for
    decisions-*.json files exported from proposals.html, applies them
    via .claude/scripts/apply-decisions.sh, regenerates dashboards,
    and commits locally (does NOT push).

.DESCRIPTION
    Per PROPOSAL_LIFECYCLE_v8.2. Designed to run every 5 minutes via
    Windows Task Scheduler. Idempotent — re-runs are safe.

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

Log "START $startedIso  repoRoot=$repoRoot"

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
    exit 2
}
Log "python=$python"

Push-Location $repoRoot
try {
    # --- Pre-flight: cron-paused.json absent ---
    $cronPaused = Join-Path $repoRoot ".claude\state\cron-paused.json"
    if (Test-Path $cronPaused) {
        Log "SKIP cron-paused.json present (governance pause respected)"
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
                exit 0
            }
        } catch {
            Log "WARN could not parse last-verify.json: $_"
        }
    }

    # --- Pre-flight: working tree clean ---
    & git diff --quiet HEAD 2>$null
    $dirty = ($LASTEXITCODE -ne 0)
    & git diff --cached --quiet 2>$null
    $stagedDirty = ($LASTEXITCODE -ne 0)
    if ($dirty -or $stagedDirty) {
        Log "SKIP working tree dirty (refuse to apply on top of in-flight work)"
        exit 0
    }

    # --- Scan Downloads ---
    $downloads = Join-Path $env:USERPROFILE "Downloads"
    if (-not (Test-Path $downloads)) {
        Log "FATAL Downloads folder not found: $downloads"
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
    Log "scanning $downloads for decisions-*.json newer than $($lastProcessed.ToString('o'))"

    $candidates = Get-ChildItem -Path $downloads -Filter "decisions-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed } |
        Sort-Object LastWriteTimeUtc

    if ($candidates.Count -eq 0) {
        Log "DONE no new decisions files"
        exit 0
    }

    Log "found $($candidates.Count) new decisions file(s)"

    $inbox = Join-Path $repoRoot ".claude\state\proposals\inbox"
    $null = New-Item -ItemType Directory -Path $inbox -Force -ErrorAction SilentlyContinue

    $applyFailures = 0
    $appliedAnything = $false
    foreach ($f in $candidates) {
        Log "processing $($f.Name) (mtime=$($f.LastWriteTimeUtc.ToString('o')))"
        $dest = Join-Path $inbox $f.Name
        Copy-Item -Path $f.FullName -Destination $dest -Force
        Log "  copied to $dest"

        # Run apply-decisions.sh via bash (Git Bash on Windows)
        $bash = Get-Command bash.exe -ErrorAction SilentlyContinue
        if (-not $bash) {
            Log "  FATAL bash.exe not on PATH (need Git Bash for apply-decisions.sh)"
            $applyFailures++
            break
        }
        # Convert Windows path to bash-style for apply-decisions.sh
        $bashPath = $dest -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'
        $bashPath = $bashPath.Substring(0,2).ToLower() + $bashPath.Substring(2)
        & $bash.Source -c ".claude/scripts/apply-decisions.sh '$bashPath'" 2>&1 | ForEach-Object { Log "    [apply] $_" }
        if ($LASTEXITCODE -ne 0) {
            Log "  apply-decisions.sh FAILED for $($f.Name)"
            $applyFailures++
            continue
        }
        Log "  apply-decisions.sh OK"
        $appliedAnything = $true

        # Update marker AFTER successful apply
        $marker_data = @{
            last_processed_mtime_utc = $f.LastWriteTimeUtc.ToString("o")
            last_processed_filename  = $f.Name
            last_processed_at        = (Get-Date).ToUniversalTime().ToString("o")
        }
        $marker_data | ConvertTo-Json | Set-Content -Path $marker -Encoding utf8
        Log "  marker updated"
    }

    if ($applyFailures -gt 0) {
        Log "FAIL $applyFailures apply-decisions.sh failures"
        exit 1
    }

    if ($appliedAnything) {
        Log "running regen-all.ps1..."
        $regenScript = Join-Path $repoRoot "scripts\regen-all.ps1"
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $regenScript 2>&1 | ForEach-Object { Log "    [regen] $_" }
        $regenRc = $LASTEXITCODE
        if ($regenRc -ne 0) {
            Log "regen-all FAILED with exit $regenRc — apply-decisions changes are committed by the apply script; regen output may be stale"
            exit 1
        }
        Log "regen-all OK"
    }

    Log "DONE applied=$appliedAnything"
    exit 0
}
finally {
    Pop-Location
}
