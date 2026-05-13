#requires -Version 5.1
<#
.SYNOPSIS
    Manual quota paste - Founder anchors the token-usage dashboard to
    reality by entering percentages from claude.ai billing.

.DESCRIPTION
    Per Source C of the token-usage dashboard ingestion plan. Founder
    runs this whenever they want to anchor the dashboard against
    ground truth from the claude.ai billing UI.

    Suggested cadence: end of each work session, OR before reviewing
    the token-usage dashboard for accuracy.

    Output: appends one entry per non-skipped value to
    .claude/state/telemetry/manual-quota-log.ndjson with
    source='founder-paste'. The next aggregate-token-usage.py run
    picks these up automatically.

.NOTES
    Quota caps are coded in scripts/aggregate-token-usage.py as
    QUOTA_CAPS (top of file). If your Anthropic plan changes, update
    those constants there. The percentages Founder enters here get
    multiplied by those caps to derive token counts.

    Type 'skip' for any prompt to omit that scope.
#>

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$logPath = Join-Path $repoRoot ".claude\state\telemetry\manual-quota-log.ndjson"
$null = New-Item -ItemType Directory -Path (Split-Path $logPath) -Force -ErrorAction SilentlyContinue

# Quota caps (must match QUOTA_CAPS in aggregate-token-usage.py)
$caps = @{
    "session"        = 200000
    "weekly-all"     = 3500000
    "weekly-sonnet"  = 3500000
    "claude-design"  = 1000000
}

Write-Host ""
Write-Host "PARBAUGHS - Manual Quota Paste" -ForegroundColor Cyan
Write-Host ""
Write-Host "Paste current claude.ai billing percentages. Type 'skip' to omit any."
Write-Host "All values are PERCENTAGES (0-100)."
Write-Host ""

$prompts = @(
    @{ key = "session";       label = "Current SESSION % used"; },
    @{ key = "weekly-all";    label = "Weekly ALL MODELS % used"; },
    @{ key = "weekly-sonnet"; label = "Weekly SONNET ONLY % used"; },
    @{ key = "claude-design"; label = "Weekly CLAUDE DESIGN % used"; }
)

$entries = @()
$ts = (Get-Date).ToUniversalTime().ToString("o")

foreach ($p in $prompts) {
    $raw = Read-Host "  $($p.label) (0-100, or 'skip')"
    if ([string]::IsNullOrWhiteSpace($raw) -or $raw.Trim().ToLower() -eq "skip") {
        Write-Host "    skipped"
        continue
    }
    $pct = 0.0
    if (-not [double]::TryParse($raw, [ref]$pct)) {
        Write-Host "    not a number; skipping"
        continue
    }
    if ($pct -lt 0 -or $pct -gt 100) {
        Write-Host "    out of range (0-100); skipping"
        continue
    }
    $cap = $caps[$p.key]
    $tokens = [int][math]::Round(($pct / 100.0) * $cap)
    $entries += @{
        timestamp = $ts
        scope = $p.key
        tokens_used = $tokens
        source = "founder-paste"
        note = "$pct% of $cap cap"
    }
    Write-Host "    $pct% x $cap = $tokens tokens"
}

# All-time cumulative (optional separate entry)
Write-Host ""
$raw = Read-Host "  Cumulative ALL-TIME tokens (if visible on billing, raw number), or 'skip'"
if (-not ([string]::IsNullOrWhiteSpace($raw) -or $raw.Trim().ToLower() -eq "skip")) {
    $tokens = 0
    if ([int]::TryParse($raw, [ref]$tokens)) {
        $entries += @{
            timestamp = $ts
            scope = "all-time"
            tokens_used = $tokens
            source = "founder-paste"
            note = "Direct token count from billing dashboard"
        }
        Write-Host "    $tokens tokens (raw)"
    } else {
        Write-Host "    not an integer; skipping"
    }
}

if ($entries.Count -eq 0) {
    Write-Host ""
    Write-Host "No entries recorded; nothing to write." -ForegroundColor Yellow
    exit 0
}

# Append to manual-quota-log.ndjson
foreach ($e in $entries) {
    $line = $e | ConvertTo-Json -Compress
    Add-Content -Path $logPath -Value $line -Encoding utf8
}

Write-Host ""
Write-Host "Wrote $($entries.Count) entries to:" -ForegroundColor Green
Write-Host "  $logPath"
Write-Host ""
Write-Host "Run scripts\aggregate-token-usage.py to refresh the dashboard."
Write-Host "Or run scripts\regen-all.ps1 to do that + regen everything."
