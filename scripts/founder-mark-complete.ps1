# Founder Checklist  -  Mark Complete + auto-verify
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

# Parse the item's .md front-matter  -  must match the Python parser in
# scripts/regen-founder-checklist.py exactly. Contract:
#   - Front-matter is the YAML block between two `---` lines at the file start
#   - Flat key:value pairs only; no multi-line values
#   - Values are stripped of one layer of surrounding quotes
#   - Colon-followed-by-letters inside a quoted value is preserved
$mdContent = Get-Content $mdPath -Raw -Encoding utf8
$verifyCmd = $null
$verifyExpected = $null
if ($mdContent -match '(?s)\A---\s*\r?\n(.*?)\r?\n---\s*\r?\n') {
    $fmBlock = $matches[1]
    foreach ($line in $fmBlock -split "`r?`n") {
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$') {
            $k = $matches[1]
            $v = $matches[2].Trim()
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            if ($k -eq 'verify_command')  { $verifyCmd = $v }
            if ($k -eq 'verify_expected') { $verifyExpected = $v }
        }
    }
}

# Critique F2 (HIGH): allowlist verify_command  -  prevent payload smuggling.
# Accept only verify commands that START with one of these whitelisted cmds.
# This catches both pure-PowerShell pipelines and external invocations.
$ALLOWED_VERIFY_PREFIXES = @(
    'if ', 'Test-Path', 'Select-String', 'Get-Content', 'Get-ChildItem',
    'firebase', 'git', 'npm', 'node', 'python', 'gh '
)
function Test-VerifyCommandAllowed {
    param([string]$cmd)
    if (-not $cmd) { return $false }
    if ($cmd.Length -gt 200) { return $false }    # Length cap
    $trimmed = $cmd.TrimStart()
    foreach ($prefix in $ALLOWED_VERIFY_PREFIXES) {
        if ($trimmed.StartsWith($prefix, [System.StringComparison]::Ordinal)) { return $true }
    }
    return $false
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
# Critique F2 (HIGH): allowlist check before any execution; refused commands
# fall through to the trust-only branch with verification_status=refused.
$verifyRefused = $false
if ($verifyCmd -and -not (Test-VerifyCommandAllowed -cmd $verifyCmd)) {
    Write-Host ""
    Write-Host "  REFUSED: verify_command failed allowlist check." -ForegroundColor Red
    Write-Host "  Allowed prefixes: $($ALLOWED_VERIFY_PREFIXES -join ', ')"
    Write-Host "  Got: '$verifyCmd'"
    $itemState.verification_status = "refused-not-allowlisted"
    $itemState.status = "verification-failed"
    $itemState.verify_output_excerpt = "REFUSED: verify_command did not start with an allowlisted prefix."
    $verifyRefused = $true
}

if ($verifyCmd -and -not $verifyRefused) {
    Write-Host ""
    Write-Host "Running verification:" -ForegroundColor Yellow
    Write-Host "  > $verifyCmd"
    Write-Host ""
    $output = $null
    $exitCode = 0
    # Critique F2 (HIGH): execute in a child powershell process so $LASTEXITCODE
    # is scoped to THIS verification run, not inherited from the previous external
    # command. Avoids Invoke-Expression (PowerShell's eval, banned by new policy).
    $global:LASTEXITCODE = 0
    try {
        $output = & powershell.exe -NoProfile -NonInteractive -Command $verifyCmd 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        if ($null -eq $exitCode) { $exitCode = 0 }
        if (-not $?) { $exitCode = 1 }
    } catch {
        $output = $_.Exception.Message
        $exitCode = 1
    }
    $itemState.verified_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $excerpt = "$output".Trim()
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
}

# Separate branch: no verify_command at all (trust the Founder mark)
if (-not $verifyCmd -and -not $verifyRefused) {
    Write-Host ""
    Write-Host "  No verify_command in item .md  -  accepting Founder mark on trust." -ForegroundColor Yellow
    $itemState.verification_status = "trust-only-no-verify"
    $itemState.status = "verified-closed"
}

# Persist state  -  convert hashtable values back to PSCustomObject for clean JSON
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
# Critique F5 (LOW): Out-File -Encoding utf8 writes UTF-8 WITH BOM on Windows PS 5.1.
# Python's read_text(encoding="utf-8") does NOT strip the BOM. Use the explicit
# no-BOM encoder so regen-founder-checklist.py can parse the state cleanly.
$json = $out | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($statePath, $json, (New-Object System.Text.UTF8Encoding($false)))

# Trigger founder-checklist regen so the dashboard reflects state immediately
$regenScript = Join-Path $repoRoot "scripts\regen-founder-checklist.py"
if (Test-Path $regenScript) {
    python $regenScript | Out-Null
    Write-Host ""
    Write-Host "  Dashboard updated: docs/reports/founder-checklist.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "DONE. Status persisted to .claude/state/founder-checklist-state.json"
