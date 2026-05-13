#requires -Version 5.1
<#
.SYNOPSIS
    Remove the PARBAUGHS-Overnight-Triage Scheduled Task.
.NOTES
    Must be run as Administrator.
#>
$ErrorActionPreference = "Stop"
$taskName = "PARBAUGHS-Overnight-Triage"

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[uninstall-ot] FATAL must run as Administrator" -ForegroundColor Red
    exit 1
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[uninstall-ot] task '$taskName' not present; nothing to do"
    exit 0
}
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "[uninstall-ot] OK task '$taskName' removed" -ForegroundColor Green
