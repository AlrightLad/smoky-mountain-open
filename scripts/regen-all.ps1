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
    @{ Name = "aggregate-telemetry"; Script = "scripts/aggregate-telemetry.py" },
    @{ Name = "regen-dashboard";     Script = "scripts/regen-dashboard.py" },
    @{ Name = "regen-ops-views";     Script = "scripts/dry-run-regen-ops-views.py" },
    @{ Name = "regen-main-flows";    Script = "scripts/regen-main-flows.py" },
    @{ Name = "regen-index";         Script = "scripts/regen-index.py" }
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
Pop-Location

if ($failed.Count -eq 0) {
    Write-Host ""
    Write-Host "ALL DASHBOARDS REGENERATED at $endTs" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "PARTIAL FAILURE at $endTs — failed steps: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
