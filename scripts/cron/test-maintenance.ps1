#requires -Version 5.1
<#
.SYNOPSIS
    Run the maintenance script once, without scheduling.

.DESCRIPTION
    Use to verify the maintenance script's logic before installing the
    Scheduled Task. Admin-only steps (wsl/pip/npm) will skip with logged
    note when this is run from a non-elevated shell - that's expected.

.NOTES
    Output also logged to scripts/cron/logs/<ts>-maintenance.log.
#>
$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$script   = Join-Path $repoRoot "scripts\cron\maintenance.ps1"
if (-not (Test-Path $script)) {
    Write-Host "[test-maint] FATAL maintenance script missing: $script" -ForegroundColor Red
    exit 2
}
Write-Host "[test-maint] invoking $script"
# Requires CurrentUser ExecutionPolicy=RemoteSigned (install-all.ps1 sets).
& powershell.exe -NoProfile -File $script
$rc = $LASTEXITCODE
Write-Host "[test-maint] maintenance.ps1 exited with $rc"
exit $rc
