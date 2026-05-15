# scaffold-from-templates.ps1 — PowerShell mirror of scaffold-from-templates.sh.
#
# R2 remediation (2026-05-15): bootstrap docs/reports/ from tracked
# templates/dashboards/. Idempotent — does not overwrite existing files.
# Pass -Force to re-scaffold.

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = Split-Path -Parent $ScriptDir
$Templates = Join-Path $RepoRoot "templates\dashboards"
$Dest      = Join-Path $RepoRoot "docs\reports"

if (-not (Test-Path $Templates)) {
    Write-Error "[scaffold-from-templates] FAIL templates directory missing: $Templates"
    exit 1
}

if (-not (Test-Path $Dest)) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
}

$Scaffolded = 0
$Skipped    = 0

Get-ChildItem -Path $Templates -Filter "*.template.html" | ForEach-Object {
    $fname    = $_.BaseName -replace '\.template$', ''
    $destFile = Join-Path $Dest "$fname.html"
    if ((Test-Path $destFile) -and (-not $Force)) {
        $Skipped++
        return
    }
    Copy-Item $_.FullName $destFile -Force
    Write-Host "[scaffold-from-templates] scaffolded $fname.html"
    $Scaffolded++
}

$AssetsSrc = Join-Path $Templates "_assets"
$AssetsDst = Join-Path $Dest "_assets"
if (Test-Path $AssetsSrc) {
    if (-not (Test-Path $AssetsDst) -or $Force) {
        New-Item -ItemType Directory -Path $AssetsDst -Force | Out-Null
        Copy-Item -Recurse -Force (Join-Path $AssetsSrc "*") $AssetsDst
        Write-Host "[scaffold-from-templates] scaffolded _assets/"
        $Scaffolded++
    } else {
        $Skipped++
    }
}

Write-Host "[scaffold-from-templates] done: scaffolded=$Scaffolded skipped=$Skipped"
exit 0
