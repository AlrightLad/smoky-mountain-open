#requires -Version 5.1
<#
.SYNOPSIS
    Runs the Downloads watcher once, without scheduling. Use for manual
    verification before installing the task.
.NOTES
    Does NOT require Administrator (it's just running the watcher directly).
    Output goes to scripts/cron/logs/<ts>-downloads-watcher.log.
#>
$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$watcher = Join-Path $repoRoot "scripts\cron\downloads-watcher.ps1"
if (-not (Test-Path $watcher)) {
    Write-Host "[test] FATAL watcher script missing: $watcher" -ForegroundColor Red
    exit 2
}
Write-Host "[test] invoking $watcher (output also logged to scripts/cron/logs/...)"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $watcher
$rc = $LASTEXITCODE
Write-Host "[test] watcher exited with $rc"
exit $rc
