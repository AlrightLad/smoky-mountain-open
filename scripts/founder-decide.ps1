# Founder Decision Recorder  -  approve / deny a founder-checklist item from chat
#
# Companion to scripts/founder-mark-complete.ps1. Where mark-complete records
# "this item is DONE + verify it", this records the Founder's APPROVE/DENY
# decision that comes BEFORE the work:
#
#   approve <slug> [note]      -> records approval; the agent then completes the
#                                 action end-to-end and runs founder-mark-complete
#                                 to verify + close. Money-cost items are flagged
#                                 (the agent never spends money; see -Reason note).
#   deny    <slug> "<reason>"  -> REASON REQUIRED. Appends the Founder's reason to
#                                 the item, archives it out of the active checklist,
#                                 and logs the decision for orchestration review.
#
# This script does ONLY bookkeeping (file moves, frontmatter status, an append-only
# decision log, and a dashboard regen). It deliberately contains NO deploy, secret,
# or network commands: the work approved here is performed by the agent using its
# own scoped tools, never bundled into this script. That keeps privileges unbundled
# and the audit trail honest.
#
# Decision log:   .claude/state/founder-decisions/<yyyy-MM-dd>.ndjson  (append-only)
# Denied items:   .claude/state/founder-decisions/archived/<slug>.md   (with reason)
# Status sidecar: .claude/state/founder-checklist-state.json           (shared w/ mark-complete)
#
# See .claude/state/founder-decisions/APPROVE-DENY-PROTOCOL.md for the full model.

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet('approve', 'deny')]
    [string]$Action,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$Slug,

    [Parameter(Position = 2)]
    [string]$Reason
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

$founderDir   = Join-Path $repoRoot ".claude\state\task-queue\founder"
$mdPath       = Join-Path $founderDir "$Slug.md"
$decisionsDir = Join-Path $repoRoot ".claude\state\founder-decisions"
$archivedDir  = Join-Path $decisionsDir "archived"
$statePath    = Join-Path $repoRoot ".claude\state\founder-checklist-state.json"

$null = New-Item -ItemType Directory -Path $decisionsDir -Force -ErrorAction SilentlyContinue
$null = New-Item -ItemType Directory -Path $archivedDir -Force -ErrorAction SilentlyContinue

if (-not (Test-Path $mdPath)) {
    # The item may already be archived (idempotent re-runs / typos). Tell the truth.
    $archivedCandidate = Join-Path $archivedDir "$Slug.md"
    if (Test-Path $archivedCandidate) {
        Write-Host "NOTE: '$Slug' is already archived (previously denied)." -ForegroundColor Yellow
        Write-Host "      $archivedCandidate"
        exit 0
    }
    Write-Host "ERROR: no such open checklist item: $Slug" -ForegroundColor Red
    Write-Host "       (looked in $mdPath)"
    Write-Host ""
    Write-Host "Open items:"
    Get-ChildItem $founderDir -Filter "*.md" -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch "^(BLOCKERS|README|APPROVE-DENY)" } |
        ForEach-Object { Write-Host "  - $($_.BaseName)" }
    exit 2
}

# Deny MUST carry a reason. This is the Founder's stated rationale that
# orchestration reviews + logs (Founder directive: "if I deny one it should
# ask me a reason and then I provide my reason").
if ($Action -eq 'deny' -and [string]::IsNullOrWhiteSpace($Reason)) {
    Write-Host "ERROR: deny requires a reason." -ForegroundColor Red
    Write-Host '       Usage: founder-decide.ps1 deny <slug> "your reason here"'
    exit 3
}

# --- Parse item frontmatter (cost / execute_by / gate) for the decision record.
#     Same flat-YAML contract as regen-founder-checklist.py + founder-mark-complete.ps1.
$mdContent = Get-Content $mdPath -Raw -Encoding utf8
$fmCost = $null; $fmExecBy = $null; $fmGate = $null; $fmSeverity = $null
if ($mdContent -match '(?s)\A---\s*\r?\n(.*?)\r?\n---\s*\r?\n') {
    foreach ($line in ($matches[1] -split "`r?`n")) {
        if ($line -match '^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$') {
            $k = $matches[1]; $v = $matches[2].Trim()
            if (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'"))) {
                $v = $v.Substring(1, $v.Length - 2)
            }
            switch ($k) {
                'cost'       { $fmCost = $v }
                'execute_by' { $fmExecBy = $v }
                'gate'       { $fmGate = $v }
                'severity'   { $fmSeverity = $v }
            }
        }
    }
}

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

# --- Money guard. The agent NEVER spends money. If an approved item carries a
#     non-zero cost, record it as approved-but-Founder-pays so the agent does
#     not attempt the paid step. (Founder: "the only time this does not apply is
#     when it comes to spending money ... that is something I need to complete".)
$costIsMoney = $false
if ($fmCost -and $fmCost -notmatch '^\s*(\$?0(\.00)?|none|free|n/?a)\s*$') { $costIsMoney = $true }

# --- Append decision to the append-only daily log (orchestration reviews these).
$logPath = Join-Path $decisionsDir ("{0}.ndjson" -f (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd"))
$entry = [ordered]@{
    ts            = $now
    slug          = $Slug
    action        = $Action
    reason        = if ($Reason) { $Reason } else { "" }
    cost          = if ($fmCost) { $fmCost } else { "unspecified" }
    cost_is_money = $costIsMoney
    execute_by    = if ($fmExecBy) { $fmExecBy } else { "agent" }
    gate          = if ($fmGate) { $fmGate } else { "" }
    severity      = if ($fmSeverity) { $fmSeverity } else { "" }
    decided_by    = "founder"
    reviewed_by   = "orchestration"
}
$entryJson = ($entry | ConvertTo-Json -Compress)
Add-Content -Path $logPath -Value $entryJson -Encoding utf8

# --- Update the shared status sidecar (read by regen-founder-checklist.py).
$state = @{ items = @{} }
if (Test-Path $statePath) {
    try {
        $raw = Get-Content $statePath -Raw -Encoding utf8 | ConvertFrom-Json
        if ($raw.items) {
            $state.items = @{}
            foreach ($p in $raw.items.PSObject.Properties) { $state.items[$p.Name] = $p.Value }
        }
    } catch {
        Write-Host "WARN: corrupt state file, starting fresh: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

if ($Action -eq 'approve') {
    $newStatus = if ($costIsMoney) { "approved-founder-pays" } else { "approved-agent-executing" }
    $state.items[$Slug] = [ordered]@{
        status      = $newStatus
        decided_at  = $now
        decision    = "approve"
        note        = if ($Reason) { $Reason } else { $null }
        cost        = if ($fmCost) { $fmCost } else { "unspecified" }
    }
    Write-Host "APPROVED: $Slug" -ForegroundColor Green
    if ($costIsMoney) {
        Write-Host "  COST FLAG: this item has a cost ($fmCost)." -ForegroundColor Yellow
        Write-Host "  The agent will NOT spend money. The paid step stays with the Founder;"
        Write-Host "  the agent completes every non-paid part around it."
    } else {
        Write-Host "  The agent will now complete this end-to-end and verify it"
        Write-Host "  (then run founder-mark-complete.ps1 $Slug to confirm + close)."
    }
}
else {
    # deny: append the Founder's reason to the item, then archive it out of the
    # active checklist. The agent does NOT perform the action.
    $denialBlock = @"

---

## Founder denial ($now)

$Reason

> Recorded by founder-decide.ps1 for orchestration review.
"@
    Add-Content -Path $mdPath -Value $denialBlock -Encoding utf8

    $dest = Join-Path $archivedDir "$Slug.md"
    try {
        & git mv -- "$mdPath" "$dest" 2>$null
        if ($LASTEXITCODE -ne 0) { throw "git mv non-zero" }
    } catch {
        Move-Item -Path $mdPath -Destination $dest -Force
    }

    $state.items[$Slug] = [ordered]@{
        status     = "denied-archived"
        decided_at = $now
        decision   = "deny"
        reason     = $Reason
        archived_to = ".claude/state/founder-decisions/archived/$Slug.md"
    }
    Write-Host "DENIED + ARCHIVED: $Slug" -ForegroundColor Magenta
    Write-Host "  Reason: $Reason"
    Write-Host "  Moved to: .claude/state/founder-decisions/archived/$Slug.md"
    Write-Host "  The agent will NOT perform this action."
}

# Persist sidecar (no-BOM UTF-8 so regen-founder-checklist.py parses cleanly).
function Convert-HashtablesDeep {
    param($obj)
    if ($obj -is [hashtable] -or $obj -is [System.Collections.Specialized.OrderedDictionary]) {
        $new = [ordered]@{}
        foreach ($k in $obj.Keys) { $new[$k] = Convert-HashtablesDeep $obj[$k] }
        return [PSCustomObject]$new
    }
    return $obj
}
$serialized = @{ schema_version = 1; updated_at = $now; items = $state.items }
$outObj = Convert-HashtablesDeep $serialized
$json = $outObj | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($statePath, $json, (New-Object System.Text.UTF8Encoding($false)))

# Regen the dashboard so the decision shows immediately.
$regenScript = Join-Path $repoRoot "scripts\regen-founder-checklist.py"
if (Test-Path $regenScript) {
    python $regenScript | Out-Null
    Write-Host ""
    Write-Host "  Dashboard updated: docs/reports/founder-checklist.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Logged to: .claude/state/founder-decisions/$((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')).ndjson"
