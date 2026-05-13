#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS daily maintenance cron - fires at 02:55 local time.

.DESCRIPTION
    Per Fix B (PROPOSAL_LIFECYCLE_v8.2 / governance v8.1.3). Runs as Founder
    with Highest privileges via S4U (Service for User) - admin password is
    stored encrypted in the Scheduled Task definition by install-maintenance.ps1.

    Each step wraps in try/catch. One step failing logs the error and continues
    to the next step. The daily report at .claude/state/cron/maintenance-<date>.md
    summarizes outcomes for Founder.

.SECURITY
    THIS SCRIPT RUNS WITH FOUNDER'S FULL CREDENTIALS (admin). Every line must
    be trusted. Critic enforces this on every PR that modifies this script.
    Do NOT add network calls beyond the explicit update commands (wsl/pip/npm).
    Do NOT add code that reads or writes outside this repo + the explicit
    update commands' install locations.

.NOTES
    Install: scripts/cron/install-maintenance.ps1 (Founder runs as Admin)
    Test:    scripts/cron/test-maintenance.ps1 (no admin needed; admin-only
             steps will skip with logged note)
    Logs:    scripts/cron/logs/<ts>-maintenance.log
    Daily report: .claude/state/cron/maintenance-<YYYY-MM-DD>.md
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")
$todayLocal = (Get-Date).ToString("yyyy-MM-dd")

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-maintenance.log"

$cronStateDir = Join-Path $repoRoot ".claude\state\cron"
$null = New-Item -ItemType Directory -Path $cronStateDir -Force -ErrorAction SilentlyContinue
$reportPath = Join-Path $cronStateDir "maintenance-$todayLocal.md"

# Step-result accumulator for the daily report
$script:stepResults = [ordered]@{}

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

function Record-Step {
    param([string]$name, [string]$status, [string]$detail = "")
    $script:stepResults[$name] = @{ status = $status; detail = $detail }
}

# Shared helpers (Resolve-GitBash, Resolve-Python, Should-SkipCron, etc.)
. "$PSScriptRoot\common.ps1"

Log "START $startedIso  repoRoot=$repoRoot"
Push-Location $repoRoot
try {

    # -----------------------------------------------------------------------
    # STEP 1 - Pre-flight: cron-paused.json absent
    # -----------------------------------------------------------------------
    Log ""
    Log "==[1/10]== Pre-flight: governance pause check"
    try {
        if (Test-Path ".claude\state\cron-paused.json") {
            Log "  SKIP cron-paused.json present (governance pause respected)"
            Record-Step "preflight" "skipped" "cron-paused.json present"
            Log "  exiting clean"
            return
        }
        Log "  cron-paused.json absent; proceeding"
        Record-Step "preflight" "ok" ""
    } catch {
        Log "  ERROR preflight: $_"
        Record-Step "preflight" "error" $_.Exception.Message
        return
    }

    # -----------------------------------------------------------------------
    # STEP 2 - Git repo health
    # -----------------------------------------------------------------------
    Log ""
    Log "==[2/10]== Git repo health (fetch + gc + ahead/behind)"
    try {
        & git fetch origin 2>&1 | ForEach-Object { Log "  [git-fetch] $_" }
        & git gc --auto 2>&1 | ForEach-Object { Log "  [git-gc] $_" }
        $aheadBehind = & git rev-list --left-right --count "origin/main...HEAD" 2>$null
        $dirtyCount = (& git status --porcelain 2>$null | Measure-Object).Count
        Log "  ahead/behind vs origin/main: $aheadBehind"
        Log "  working tree dirty entries: $dirtyCount"
        Record-Step "git-health" "ok" "ahead/behind=$aheadBehind dirty=$dirtyCount"
    } catch {
        Log "  ERROR git-health: $_"
        Record-Step "git-health" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 3 - Untracked-junk sweep -> quarantine
    # -----------------------------------------------------------------------
    Log ""
    Log "==[3/10]== Untracked-junk sweep (quarantine 30-day window)"
    try {
        $junkPatterns = @("*.tmp", "*.bak-*", ".test-rollback-target",
                          "*(1).md", "*(2).md", "*(3).md")
        $movedCount = 0
        $quarantineDir = Join-Path $repoRoot "scripts\cron\quarantine\$todayLocal"

        # Get untracked files
        $untracked = & git ls-files --others --exclude-standard 2>$null
        foreach ($f in $untracked) {
            $name = [System.IO.Path]::GetFileName($f)
            $matches = $false
            foreach ($pat in $junkPatterns) {
                if ($name -like $pat) { $matches = $true; break }
            }
            # Special-case: tests/round-trip-workspace/
            if ($f -like "tests/round-trip-workspace/*" -or $f -like "tests\round-trip-workspace\*") {
                $matches = $true
            }
            if ($matches) {
                if (-not (Test-Path $quarantineDir)) {
                    $null = New-Item -ItemType Directory -Path $quarantineDir -Force
                }
                $dest = Join-Path $quarantineDir $name
                try {
                    Move-Item -Path (Join-Path $repoRoot $f) -Destination $dest -Force -ErrorAction Stop
                    Log "  quarantined $f -> $dest"
                    $movedCount++
                } catch {
                    Log "  WARN could not quarantine $f : $_"
                }
            }
        }
        if ($movedCount -eq 0) {
            Log "  no junk found"
        }
        Record-Step "quarantine-sweep" "ok" "moved=$movedCount"
    } catch {
        Log "  ERROR quarantine-sweep: $_"
        Record-Step "quarantine-sweep" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 4 - Log rotation (compress logs > 30 days)
    # -----------------------------------------------------------------------
    Log ""
    Log "==[4/10]== Log rotation (compress + delete originals > 30 days)"
    try {
        $cutoff = (Get-Date).AddDays(-30)
        $oldLogs = Get-ChildItem -Path $logDir -Filter "*.log" -File -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -lt $cutoff }
        if ($oldLogs.Count -eq 0) {
            Log "  no logs older than 30 days"
            Record-Step "log-rotation" "ok" "compressed=0"
        } else {
            $archiveDir = Join-Path $logDir "archive"
            $null = New-Item -ItemType Directory -Path $archiveDir -Force
            $yearMonth = (Get-Date).ToString("yyyy-MM")
            $zipPath = Join-Path $archiveDir "$yearMonth.zip"
            # Use Compress-Archive (PS 5.1+); append to existing zip if present
            $action = if (Test-Path $zipPath) { "Update" } else { "Create" }
            Compress-Archive -Path $oldLogs.FullName -DestinationPath $zipPath -Update -ErrorAction Stop
            foreach ($l in $oldLogs) { Remove-Item -Path $l.FullName -Force }
            Log "  compressed $($oldLogs.Count) logs -> $zipPath ($action)"
            Record-Step "log-rotation" "ok" "compressed=$($oldLogs.Count) zip=$zipPath"
        }
    } catch {
        Log "  ERROR log-rotation: $_"
        Record-Step "log-rotation" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 5 - Known-dependency updates (admin required)
    # -----------------------------------------------------------------------
    Log ""
    Log "==[5/10]== Dependency updates (WSL / pip / npm)"
    $isAdmin = ([Security.Principal.WindowsPrincipal] `
        [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Log "  not running as admin; skipping wsl/pip/npm updates"
        Record-Step "dep-updates" "skipped" "not-admin (run via Scheduled Task with RunLevel Highest)"
    } else {
        # 5a. WSL update (check first; only update if available)
        try {
            $wslStatus = & wsl.exe --status 2>&1 | Out-String
            if ($wslStatus -match "no installed distributions") {
                Log "  [wsl] no distributions installed; skipping"
            } elseif ($wslStatus -match "update available|update is available") {
                Log "  [wsl] update available; running wsl --update --quiet"
                & wsl.exe --update --quiet 2>&1 | ForEach-Object { Log "    [wsl] $_" }
            } else {
                Log "  [wsl] up-to-date"
            }
        } catch {
            Log "  WARN wsl-update: $_"
        }

        # 5b. pip from .claude/requirements.txt if present
        try {
            $reqFile = Join-Path $repoRoot ".claude\requirements.txt"
            $python = Resolve-Python
            if ((Test-Path $reqFile) -and $python) {
                Log "  [pip] upgrading from $reqFile via $python"
                & $python -m pip install --upgrade -r $reqFile 2>&1 | ForEach-Object { Log "    [pip] $_" }
            } else {
                Log "  [pip] $reqFile absent or python missing; skipping"
            }
        } catch {
            Log "  WARN pip: $_"
        }

        # 5c. npm - only non-major bumps
        try {
            $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
            if ($npmCmd -and (Test-Path (Join-Path $repoRoot "package.json"))) {
                Log "  [npm] outdated check"
                & npm outdated 2>&1 | ForEach-Object { Log "    [npm-outdated] $_" }
                Log "  [npm] update (non-major bumps only)"
                & npm update 2>&1 | ForEach-Object { Log "    [npm-update] $_" }
            } else {
                Log "  [npm] not available or no package.json; skipping"
            }
        } catch {
            Log "  WARN npm: $_"
        }
        Record-Step "dep-updates" "ok" "wsl+pip+npm probed"
    }

    # -----------------------------------------------------------------------
    # STEP 6 - State directory health
    # -----------------------------------------------------------------------
    Log ""
    Log "==[6/10]== State directory health audit"
    try {
        $stateFindings = @()
        # 6a. last-verify.json older than 7 days
        $lv = Join-Path $repoRoot ".claude\state\last-verify.json"
        if (Test-Path $lv) {
            $age = (New-TimeSpan -Start (Get-Item $lv).LastWriteTime -End (Get-Date)).TotalDays
            if ($age -gt 7) {
                $stateFindings += "last-verify.json stale ($([int]$age) days old) - consider deleting"
            }
        }
        # 6b. halts/ contents
        $haltsDir = Join-Path $repoRoot ".claude\state\halts"
        if (Test-Path $haltsDir) {
            $haltFiles = Get-ChildItem -Path $haltsDir -File -ErrorAction SilentlyContinue
            if ($haltFiles.Count -gt 0) {
                $stateFindings += "$($haltFiles.Count) halt file(s) present - Founder review needed"
            }
        }
        # 6c. decisions-log.ndjson size
        $log = Join-Path $repoRoot ".claude\state\proposals\decisions-log.ndjson"
        if (Test-Path $log) {
            $sizeMB = [math]::Round((Get-Item $log).Length / 1MB, 2)
            if ($sizeMB -gt 10) {
                $stateFindings += "decisions-log.ndjson is $($sizeMB) MB - rotation proposal recommended"
            }
        }
        if ($stateFindings.Count -eq 0) {
            Log "  state directory healthy"
            Record-Step "state-audit" "ok" "no findings"
        } else {
            foreach ($f in $stateFindings) { Log "  FINDING: $f" }
            Record-Step "state-audit" "ok-with-findings" ($stateFindings -join "; ")
        }
    } catch {
        Log "  ERROR state-audit: $_"
        Record-Step "state-audit" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 7 - Regen-all sanity
    # -----------------------------------------------------------------------
    Log ""
    Log "==[7/10]== Regen-all sanity (must complete with round-trip PASS)"
    try {
        $regenScript = Join-Path $repoRoot "scripts\regen-all.ps1"
        if (Test-Path $regenScript) {
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $regenScript 2>&1 |
                ForEach-Object { Log "    [regen] $_" }
            $regenRc = $LASTEXITCODE
            if ($regenRc -ne 0) {
                Log "  regen-all FAILED exit=$regenRc"
                Record-Step "regen-all" "error" "exit=$regenRc"
            } else {
                Log "  regen-all OK"
                Record-Step "regen-all" "ok" ""
            }
        } else {
            Log "  regen-all.ps1 missing; skipping"
            Record-Step "regen-all" "skipped" "script missing"
        }
    } catch {
        Log "  ERROR regen-all: $_"
        Record-Step "regen-all" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 8 - Telemetry emit
    # -----------------------------------------------------------------------
    Log ""
    Log "==[8/10]== Telemetry: cycle.maintenance.complete"
    try {
        $eventsDir = Join-Path $repoRoot ".claude\state\telemetry\events"
        $null = New-Item -ItemType Directory -Path $eventsDir -Force -ErrorAction SilentlyContinue
        $eventFile = Join-Path $eventsDir "$todayLocal.ndjson"
        $eventObj = @{
            event_type = "cycle.maintenance.complete"
            timestamp = (Get-Date).ToUniversalTime().ToString("o")
            data = @{
                steps = $script:stepResults
                started_at = $startedIso
            }
        }
        $line = ($eventObj | ConvertTo-Json -Compress -Depth 6)
        Add-Content -Path $eventFile -Value $line -Encoding utf8
        Log "  emitted to $eventFile"
        Record-Step "telemetry" "ok" ""
    } catch {
        Log "  ERROR telemetry: $_"
        Record-Step "telemetry" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 9 - Daily report
    # -----------------------------------------------------------------------
    Log ""
    Log "==[9/10]== Daily report at $reportPath"
    try {
        $duration = ((Get-Date).ToUniversalTime() - $started).TotalSeconds
        $finished = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        $report = @"
# Maintenance Run $todayLocal

**Started:** $startedIso
**Finished:** $finished
**Duration:** $([math]::Round($duration, 1)) seconds
**Log:** scripts/cron/logs/$startedTs-maintenance.log

## Step outcomes

| Step | Status | Detail |
|------|--------|--------|
"@
        foreach ($name in $script:stepResults.Keys) {
            $r = $script:stepResults[$name]
            $detail = if ($r.detail) { $r.detail } else { "-" }
            $report += "`n| $name | $($r.status) | $detail |"
        }

        # Founder-attention items
        $attention = @()
        foreach ($name in $script:stepResults.Keys) {
            $r = $script:stepResults[$name]
            if ($r.status -eq "error" -or $r.status -eq "ok-with-findings") {
                $attention += "- **$name** ($($r.status)): $($r.detail)"
            }
        }
        if ($attention.Count -gt 0) {
            $report += "`n`n## Needs Founder attention`n`n"
            $report += ($attention -join "`n")
        } else {
            $report += "`n`n## Needs Founder attention`n`nNone."
        }

        Set-Content -Path $reportPath -Value $report -Encoding utf8
        Log "  report written"
        Record-Step "daily-report" "ok" $reportPath
    } catch {
        Log "  ERROR daily-report: $_"
        Record-Step "daily-report" "error" $_.Exception.Message
    }

    # -----------------------------------------------------------------------
    # STEP 10 - Commit state changes locally (no push)
    # -----------------------------------------------------------------------
    Log ""
    Log "==[10/10]== Commit maintenance artifacts locally"
    try {
        # Stage report + telemetry event; commit if there are changes
        & git add ".claude/state/cron/maintenance-$todayLocal.md" 2>&1 | Out-Null
        & git add ".claude/state/telemetry/events/$todayLocal.ndjson" 2>&1 | Out-Null
        $diffCached = & git diff --cached --quiet; $stagedDirty = ($LASTEXITCODE -ne 0)
        if ($stagedDirty) {
            & git commit -m "Maintenance run $todayLocal" 2>&1 | ForEach-Object { Log "    [git] $_" }
            Log "  committed locally"
            Record-Step "commit" "ok" ""
        } else {
            Log "  nothing to commit"
            Record-Step "commit" "ok" "no changes"
        }
    } catch {
        Log "  ERROR commit: $_"
        Record-Step "commit" "error" $_.Exception.Message
    }

    Log ""
    Log "DONE $((Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ'))"
}
finally {
    Pop-Location
}
