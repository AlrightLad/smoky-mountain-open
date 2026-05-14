#requires -Version 5.1
<#
.SYNOPSIS
    Uninstall the PARBAUGHS-Proposal-Readiness-Scanner Scheduled Task.
.DESCRIPTION
    Idempotent: no-op if task already absent.
#>
$ErrorActionPreference = "Stop"

$taskName = "PARBAUGHS-Proposal-Readiness-Scanner"
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[uninstall] task '$taskName' not found - no-op" -ForegroundColor Yellow
    exit 0
}
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "[uninstall] OK task '$taskName' removed" -ForegroundColor Green
