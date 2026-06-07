#requires -Version 5.1
<#
.SYNOPSIS
    Run the full dashboard regen pipeline.
.DESCRIPTION
    Sequence:
      1. scripts/aggregate-telemetry.py
      2. scripts/regen-dashboard.py
      3. scripts/dry-run-regen-ops-views.py
      4. scripts/regen-main-flows.py
      5. scripts/regen-index.py
    Each step's stdout is captured. Final line: ALL DASHBOARDS REGENERATED at <ts>,
    or PARTIAL FAILURE with specific script names.
.EXAMPLE
    & .\scripts\regen-all.ps1
#>

$ErrorActionPreference = "Stop"

# Locate python.exe (Founder's machine has it at Local\Programs\Python\Python312)
$pythonCandidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe",
    "$env:ProgramFiles\Python312\python.exe",
    "$env:ProgramFiles\Python311\python.exe"
)
$python = $null
foreach ($c in $pythonCandidates) {
    if (Test-Path $c) { $python = $c; break }
}
if (-not $python) {
    # Fall back to PATH lookup
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { $python = $cmd.Source }
}
if (-not $python) {
    Write-Host "[regen-all] FATAL: no python.exe found on disk or PATH" -ForegroundColor Red
    exit 2
}

$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $repoRoot

$startTs = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
Write-Host "[regen-all] START $startTs   python=$python" -ForegroundColor Cyan

$steps = @(
    @{ Name = "scan-shipped-proposals";  Script = "scripts/scan-shipped-proposals.py" },
    @{ Name = "aggregate-telemetry";     Script = "scripts/aggregate-telemetry.py" },
    @{ Name = "aggregate-token-usage";   Script = "scripts/aggregate-token-usage.py" },
    @{ Name = "inject-health-banners";   Script = "scripts/inject-health-banners.py" },
    @{ Name = "regen-proposals";         Script = "scripts/regen-proposals.py" },
    @{ Name = "regen-amendments";        Script = "scripts/regen-amendments.py" },
    @{ Name = "regen-escalations";       Script = "scripts/regen-escalations.py" },
    @{ Name = "regen-dashboard";         Script = "scripts/regen-dashboard.py" },
    @{ Name = "regen-ops-views";         Script = "scripts/dry-run-regen-ops-views.py" },
    @{ Name = "regen-main-flows";        Script = "scripts/regen-main-flows.py" },
    @{ Name = "regen-token-usage";       Script = "scripts/regen-token-usage.py" },
    @{ Name = "aggregate-app-health";    Script = "scripts/aggregate-app-health.py" },
    @{ Name = "regen-app-health";        Script = "scripts/regen-app-health.py" },
    @{ Name = "regen-sessions";          Script = "scripts/regen-sessions.py" },
    @{ Name = "regen-session-detail";    Script = "scripts/regen-session-detail.py" },
    @{ Name = "regen-founder-checklist"; Script = "scripts/regen-founder-checklist.py" },
    @{ Name = "regen-index";             Script = "scripts/regen-index.py" }
)

$failed = @()
foreach ($s in $steps) {
    $stepTs = (Get-Date).ToUniversalTime().ToString("HH:mm:ss")
    Write-Host "[regen-all] $stepTs   $($s.Name) ..." -NoNewline
    & $python $s.Script 2>&1 | ForEach-Object { Write-Host "" ; Write-Host "    $_" -ForegroundColor DarkGray }
    if ($LASTEXITCODE -ne 0) {
        $failed += $s.Name
        Write-Host "[regen-all] $($s.Name) FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
    } else {
        Write-Host "[regen-all] $($s.Name) OK" -ForegroundColor Green
    }
}

$endTs = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

if ($failed.Count -ne 0) {
    Pop-Location
    Write-Host ""
    Write-Host "PARTIAL FAILURE at $endTs -failed steps: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}

# Sanity-gate: run round-trip-test before declaring success.
Write-Host ""
Write-Host "[regen-all] running round-trip sanity test..." -ForegroundColor Cyan
& $python "tests/round-trip-test.py"
$testRc = $LASTEXITCODE
if ($testRc -ne 0) {
    Write-Host "[regen-all] ROUND-TRIP TEST FAILED (exit $testRc). Dashboards will be rolled back." -ForegroundColor Red
    $files = @(
        "docs/reports/dashboard.html", "docs/reports/activity.html",
        "docs/reports/proposals.html", "docs/reports/amendments.html",
        "docs/reports/discussion-bubbles.html",
        "docs/reports/index.html", "docs/reports/main-flows.html",
        "docs/reports/token-usage.html",
        "docs/reports/app-health.html"
    )
    foreach ($f in $files) {
        # PROP-015 Finding B: only roll back files git actually tracks.
        # Most dashboards are gitignored (regenerated locally, never
        # committed per the dashboard-is-production-direct policy), so
        # 'git checkout HEAD --' on them errors with 'pathspec did not
        # match' and rolls back nothing. Guard with ls-files: skip+log the
        # untracked ones, and actually restore the one tracked dashboard
        # (app-health.html) so a bad regen of it is the thing rolled back.
        git ls-files --error-unmatch $f 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[regen-all] skip rollback $f (untracked - regenerated locally, nothing to restore)"
            continue
        }
        git checkout HEAD -- $f 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[regen-all] could not roll back $f (checkout failed)"
        } else {
            Write-Host "[regen-all] rolled back $f to HEAD" -ForegroundColor Yellow
        }
    }
    Pop-Location
    Write-Host ""
    Write-Host "REGEN ROLLED BACK at $endTs -round-trip test failed; consult the test output above" -ForegroundColor Red
    exit 2
}
Pop-Location
Write-Host "[regen-all] round-trip test PASS" -ForegroundColor Green

# Write heartbeat for dashboard surfacing (Founder directive 2026-05-14
# "DASHBOARD FIDELITY"): round-trip last-pass timestamp persisted to disk
# so regen-dashboard.py can read it on the next pass and surface real
# UTC precision (not just today's date).
$heartbeatDir = Join-Path $repoRoot ".claude\state\heartbeats"
$null = New-Item -ItemType Directory -Path $heartbeatDir -Force -ErrorAction SilentlyContinue
$heartbeatPath = Join-Path $heartbeatDir "regen-all-last-pass.json"
$heartbeat = @{
    last_pass_at_utc = (Get-Date).ToUniversalTime().ToString("o")
    last_pass_at_human = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm 'UTC'")
    duration_seconds = [int]((Get-Date).ToUniversalTime() - [DateTime]::Parse($startTs).ToUniversalTime()).TotalSeconds
    status = "PASS"
} | ConvertTo-Json -Compress
Set-Content -Path $heartbeatPath -Value $heartbeat -Encoding utf8
Write-Host "[regen-all] heartbeat written: $heartbeatPath" -ForegroundColor DarkGray

# Ship-close-commit trigger (AMD-011 Step 2 - dispatch scanner inline
# at ship boundaries). Detects ship-close patterns in HEAD commit
# message; on match invokes scan-proposal-readiness.py + emits
# ship.close.scanner-dispatched telemetry. Dispatch != execute.
# Subject-only (--pretty=%s) prevents recursive false-positives when a
# prior commit's BODY quotes the trigger output. Per AMD-011: only the
# SUBJECT is the ship-close contract.
$headMsg = & git log -1 --pretty=%s 2>$null
if (-not $headMsg) { $headMsg = "" }
$shipCloseRe = '(W\d+\.[SIMm][0-9a-z]+ ship (close|complete)|Shipped PROP-\d+(\.[a-z])?|[Ss]hip (close|complete):)'
if ($headMsg -match $shipCloseRe) {
    $shipHeadLine = $headMsg
    Write-Host ""
    Write-Host "[regen-all] SHIP-CLOSE DETECTED: $shipHeadLine" -ForegroundColor Cyan
    Write-Host "[regen-all] dispatching proposal-readiness scanner..." -ForegroundColor Cyan
    Push-Location $repoRoot
    $scannerOut = & $python ".claude\scripts\scan-proposal-readiness.py" 2>&1
    $scannerRc = $LASTEXITCODE
    Pop-Location
    $scannerOut | ForEach-Object { Write-Host "    [scan] $_" -ForegroundColor DarkGray }
    $summaryLine = ($scannerOut | Where-Object { $_ -match "summary:" } | Select-Object -First 1)
    $readyCount = 0
    $deferredCount = 0
    if ($summaryLine -match "(\d+)\s+ready,\s+(\d+)\s+deferred") {
        $readyCount = [int]$Matches[1]
        $deferredCount = [int]$Matches[2]
    }
    Write-Host "[regen-all] ship-close scanner: ready=$readyCount deferred=$deferredCount exit=$scannerRc" -ForegroundColor Cyan
    # Emit telemetry event
    $nowUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $today = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd")
    $eventDir = Join-Path $repoRoot ".claude\state\telemetry\events"
    $null = New-Item -ItemType Directory -Path $eventDir -Force -ErrorAction SilentlyContinue
    $eventFile = Join-Path $eventDir "$today.ndjson"
    $eventObj = @{
        event_type = "ship.close.scanner-dispatched"
        timestamp = $nowUtc
        data = @{
            head_commit_subject = $shipHeadLine
            ready_count = $readyCount
            deferred_count = $deferredCount
            scanner_exit = $scannerRc
        }
    }
    $line = ($eventObj | ConvertTo-Json -Compress -Depth 6)
    Add-Content -Path $eventFile -Value $line -Encoding utf8
}

Write-Host ""
Write-Host "ALL DASHBOARDS REGENERATED at $endTs" -ForegroundColor Green
exit 0
