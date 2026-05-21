# Founder Checklist — Mark Complete + auto-verify
#
# Founder clicks "Mark Complete" on docs/reports/founder-checklist.html → button
# copies a command like `bash scripts/founder-mark-complete.ps1 <slug>` to clipboard.
# Founder pastes + runs in PowerShell. This script:
#   1. Writes the marker to .claude/state/founder-checklist-state.json
#   2. Runs the embedded verify_command (if any) from the item's .md
#   3. Updates state: verified-closed OR verification-failed
#   4. Triggers regen-founder-checklist so the dashboard updates immediately
#
# Per Founder directive 2026-05-21: "how do I know when the founder checklist
# item is completed currently there is no way to mark complete or to have
# orchestration team check and confirm that it was completed".

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Slug
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

$mdPath = Join-Path $repoRoot ".claude\state\task-queue\founder\$Slug.md"
$statePath = Join-Path $repoRoot ".claude\state\founder-checklist-state.json"

if (-not (Test-Path $mdPath)) {
    Write-Host "ERROR: no such checklist item: $Slug" -ForegroundColor Red
    Write-Host "       (looked in $mdPath)"
    Write-Host ""
    Write-Host "Available items:"
    Get-ChildItem (Join-Path $repoRoot ".claude\state\task-queue\founder") -Filter "*.md" |
        Where-Object { $_.Name -notmatch "^(BLOCKERS|README)" } |
        ForEach-Object { Write-Host "  - $($_.BaseName)" }
    exit 2
}

# Read existing state
$state = @{ items = @{} }
if (Test-Path $statePath) {
    try {
        $raw = Get-Content $statePath -Raw -Encoding utf8 | ConvertFrom-Json
        if ($raw.items) {
            $state.items = @{}
            foreach ($prop in $raw.items.PSObject.Properties) {
                $state.items[$prop.Name] = $prop.Value
            }
        }
    } catch {
        Write-Host "WARN: corrupt state file, starting fresh: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# Parse the item's .md for verify_command
$mdContent = Get-Content $mdPath -Raw -Encoding utf8
$verifyCmd = $null
$verifyExpected = $null
if ($mdContent -match '(?ms)^verify_command:\s*(.+?)(?=\r?\n[a-z_]+:|\r?\n---|\r?\n\r?\n)') {
    $verifyCmd = $matches[1].Trim().Trim('"').Trim("'")
}
if ($mdContent -match '(?ms)^verify_expected:\s*(.+?)(?=\r?\n[a-z_]+:|\r?\n---|\r?\n\r?\n)') {
    $verifyExpected = $matches[1].Trim().Trim('"').Trim("'")
}

Write-Host "Marking complete: $Slug" -ForegroundColor Cyan
Write-Host "  Founder confirmation timestamp: $now"

$itemState = [ordered]@{
    status = "marked-complete-by-founder"
    marked_at = $now
    verify_command = $verifyCmd
    verify_expected = $verifyExpected
    verified_at = $null
    verify_output_excerpt = $null
    verification_status = "pending"
}

# Run verify_command if present
if ($verifyCmd) {
    Write-Host ""
    Write-Host "Running verification:" -ForegroundColor Yellow
    Write-Host "  > $verifyCmd"
    Write-Host ""
    $output = $null
    $exitCode = 0
    try {
        $output = Invoke-Expression $verifyCmd 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
    } catch {
        $output = $_.Exception.Message
        $exitCode = 1
    }
    $itemState.verified_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $excerpt = $output.Trim()
    if ($excerpt.Length -gt 500) { $excerpt = $excerpt.Substring(0, 500) + "..." }
    $itemState.verify_output_excerpt = $excerpt

    $verified = $false
    if ($exitCode -eq 0) {
        if ($verifyExpected) {
            if ($output -match $verifyExpected) { $verified = $true }
        } else {
            $verified = $true
        }
    }

    if ($verified) {
        $itemState.verification_status = "verified-closed"
        $itemState.status = "verified-closed"
        Write-Host "  VERIFIED: orchestration team confirms completion." -ForegroundColor Green
    } else {
        $itemState.verification_status = "verification-failed"
        $itemState.status = "verification-failed"
        Write-Host "  VERIFICATION FAILED: marker recorded but agent could not confirm." -ForegroundColor Red
        Write-Host "  Output (first 500 chars):"
        Write-Host $excerpt
    }
} else {
    Write-Host ""
    Write-Host "  No verify_command in item .md — accepting Founder mark on trust." -ForegroundColor Yellow
    $itemState.verification_status = "trust-only-no-verify"
    $itemState.status = "verified-closed"
}

# Persist state — convert hashtable values back to PSCustomObject for clean JSON
$serialized = @{
    schema_version = 1
    updated_at = $now
    items = $state.items
}
$serialized.items[$Slug] = $itemState

# Convert nested hashtables to PSCustomObject so ConvertTo-Json formats them
function Convert-HashtablesDeep {
    param($obj)
    if ($obj -is [hashtable] -or $obj -is [System.Collections.Specialized.OrderedDictionary]) {
        $new = [ordered]@{}
        foreach ($k in $obj.Keys) { $new[$k] = Convert-HashtablesDeep $obj[$k] }
        return [PSCustomObject]$new
    }
    return $obj
}
$out = Convert-HashtablesDeep $serialized
$out | ConvertTo-Json -Depth 6 | Out-File $statePath -Encoding utf8

# Trigger founder-checklist regen so the dashboard reflects state immediately
$regenScript = Join-Path $repoRoot "scripts\regen-founder-checklist.py"
if (Test-Path $regenScript) {
    python $regenScript | Out-Null
    Write-Host ""
    Write-Host "  Dashboard updated: docs/reports/founder-checklist.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "DONE. Status persisted to .claude/state/founder-checklist-state.json"
