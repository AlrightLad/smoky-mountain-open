#requires -Version 5.1
<#
.SYNOPSIS
    Run the overnight-triage script once, without scheduling.

.DESCRIPTION
    Use to verify the launcher's pre-flight checks + Claude Code
    resolution + prompt file presence before installing the Scheduled
    Task. The launcher will attempt to invoke Claude Code with the
    fixed prompt - if Claude Code isn't installed, the launcher exits 2
    with a clear error message and does NOT attempt anything else.

    For a true end-to-end test that LAUNCHES Claude Code, the launcher
    will run for up to 4 hours. Cancel with Ctrl-C if you don't want
    that.

.NOTES
    Output also logged to scripts/cron/logs/<ts>-overnight-triage.log.
#>
$ErrorActionPreference = "Continue"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$script   = Join-Path $repoRoot "scripts\cron\overnight-triage.ps1"
if (-not (Test-Path $script)) {
    Write-Host "[test-ot] FATAL overnight-triage script missing: $script" -ForegroundColor Red
    exit 2
}
Write-Host "[test-ot] invoking $script"
Write-Host "[test-ot] (Ctrl-C to cancel if Claude Code launches and runs longer than you want)"
# Requires CurrentUser ExecutionPolicy=RemoteSigned (install-all.ps1 sets).
& powershell.exe -NoProfile -File $script
$rc = $LASTEXITCODE
Write-Host "[test-ot] overnight-triage.ps1 exited with $rc"
exit $rc
