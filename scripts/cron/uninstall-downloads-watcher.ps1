#requires -Version 5.1
<#
.SYNOPSIS
    Removes the PARBAUGHS-Downloads-Watcher Scheduled Task.
.NOTES
    Must be run as Administrator.
#>
$ErrorActionPreference = "Stop"
$taskName = "PARBAUGHS-Downloads-Watcher"

$isAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[uninstall] FATAL must run as Administrator" -ForegroundColor Red
    exit 1
}

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[uninstall] task '$taskName' not present; nothing to do"
    exit 0
}
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "[uninstall] OK task '$taskName' removed" -ForegroundColor Green
