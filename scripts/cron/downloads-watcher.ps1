#requires -Version 5.1
<#
.SYNOPSIS
    PARBAUGHS Downloads Watcher - scans %USERPROFILE%\Downloads for
    decisions-*.json files exported from proposals.html, applies them
    via .claude/scripts/apply-decisions.sh, regenerates dashboards,
    and commits locally (does NOT push).

.DESCRIPTION
    Per PROPOSAL_LIFECYCLE_v8.2. Designed to run every 5 minutes via
    Windows Task Scheduler. Idempotent - re-runs are safe.

.NOTES
    Install: scripts/cron/install-downloads-watcher.ps1 (Founder runs as Admin)
    Test:    scripts/cron/test-downloads-watcher.ps1
    Logs:    scripts/cron/logs/<ts>-downloads-watcher.log
#>

$ErrorActionPreference = "Continue"
$started = (Get-Date).ToUniversalTime()
$startedIso = $started.ToString("yyyy-MM-ddTHH:mm:ssZ")
$startedTs  = $started.ToString("yyyy-MM-ddTHH-mm-ssZ")

# --- Locate repo root + python ---
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$logDir   = Join-Path $repoRoot "scripts\cron\logs"
$null = New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue
$logPath  = Join-Path $logDir "$startedTs-downloads-watcher.log"

function Log {
    param([string]$msg)
    $line = "[$((Get-Date).ToUniversalTime().ToString('HH:mm:ss'))] $msg"
    Add-Content -Path $logPath -Value $line -Encoding utf8
    Write-Host $line
}

# Shared helpers (Resolve-GitBash, Resolve-Python, Should-SkipCron, etc.)
. "$PSScriptRoot\common.ps1"

$runId = [Guid]::NewGuid().ToString("N").Substring(0, 12)
$script:cronSuccess = $true
$script:cronExitReason = "ok"
Log "START $startedIso  repoRoot=$repoRoot  runId=$runId"
Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.downloads-watcher.start" -data @{
    cron_source = "downloads-watcher"; run_id = $runId; claude_invoked = $false
}

# Locate python
$pythonCandidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
)
$python = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $python) {
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { $python = $cmd.Source }
}
if (-not $python) {
    Log "FATAL no python.exe found"
    $script:cronSuccess = $false
    $script:cronExitReason = "no-python"
    exit 2
}
Log "python=$python"

Push-Location $repoRoot
try {
    # --- Pre-flight: cron-paused.json absent ---
    $cronPaused = Join-Path $repoRoot ".claude\state\cron-paused.json"
    if (Test-Path $cronPaused) {
        Log "SKIP cron-paused.json present (governance pause respected)"
        $script:cronExitReason = "skip-paused"
        exit 0
    }

    # --- Pre-flight: last-verify.json absent OR resume_after has passed ---
    $lastVerify = Join-Path $repoRoot ".claude\state\last-verify.json"
    if (Test-Path $lastVerify) {
        try {
            $lv = Get-Content $lastVerify -Raw | ConvertFrom-Json
            $resumeAfter = $null
            if ($lv.resume_after) { $resumeAfter = [DateTime]::Parse($lv.resume_after).ToUniversalTime() }
            if ($resumeAfter -and $started -lt $resumeAfter) {
                Log "SKIP last-verify.json present and resume_after=$($lv.resume_after) not yet passed"
                $script:cronExitReason = "skip-verify-pending"
                exit 0
            }
        } catch {
            Log "WARN could not parse last-verify.json: $_"
        }
    }

    # --- Pre-flight: working tree clean (with auto-commit of routine cron output) ---
    # Routine cron output (telemetry events + aggregates) re-dirties the tree
    # on every cron cycle. Without auto-commit, the watcher refuses Founder
    # decisions indefinitely. We tolerate dirt ONLY when every dirty path
    # matches the routine-output allowlist; anything else still triggers skip.
    # Widened 2026-05-14 per approval-pipeline-trace findings: prior narrow
    # allowlist (telemetry + package-lock) caused recurring SKIP on every
    # cron tick whenever agent work emitted user-context captures, audit
    # outputs, heartbeats, deferred markers, or python bytecode. Stalled
    # 8 approvals (PROP-005..PROP-012) in approved/ during this session.
    # AMD-023 codifies the protocol; allowlist below covers Class A
    # artifacts per AMD-020.
    $routinePatterns = @(
        # Pre-existing telemetry
        '^\.claude/state/telemetry/events/.+\.ndjson$',
        '^\.claude/state/telemetry/aggregates/.+\.json$',
        '^package-lock\.json$',

        # User-context + audit outputs (Class A per AMD-020)
        '^\.claude/state/main-flows-v2/founder-real-context/.+\.(png|json)$',
        '^\.claude/state/main-flows-v2/iter-.+\.(png|json)$',
        '^\.claude/state/main-flows-v2/reference-frames/.+\.(png|jpg|jpeg|mp4|m4s)$',
        '^\.claude/state/user-journey-audits/.+\.(png|md|json)$',
        '^\.claude/state/heartbeats/.+\.json$',
        '^\.claude/state/dashboard-health/.+\.(ndjson|json)$',
        '^\.claude/state/security/cycles/.+\.ndjson$',
        '^\.claude/state/proposals/ship-readiness-deferred/.+\.json$',
        '^\.claude/state/overnight-agent/(logs|runs|reports)/.+',

        # Cross-agent health aggregates (Founder directive 2026-05-14
        # "TWO NEW SESSIONS"). Test/QA + Security agents write to
        # .claude/state/aggregates/{test,security}-health.json. AMD-023's
        # widening missed this newer path; adding now so watcher does not
        # skip-dirty when either source agent has uncommitted writes.
        '^\.claude/state/aggregates/.+\.(json|md)$',

        # Python bytecode (also gitignored where possible)
        '^scripts/__pycache__/.+\.pyc$',
        '^tests/__pycache__/.+\.pyc$',

        # Inbox processing artifacts (file moved into inbox/ after consume)
        '^\.claude/state/proposals/inbox/.+\.json$',
        '^\.claude/state/amendments/inbox/.+\.json$',
        '^\.claude/state/escalations/inbox/.+\.json$',
        '^\.claude/state/proposals/\.last-processed-decisions\.json$',

        # 2026-05-21 (Founder root-cause fix) — dashboard regen output is
        # Class A routine. Without these patterns the watcher SKIPped every
        # cycle after any regen ran (founder-checklist.html and sessions.html
        # are rewritten by every post-commit + every 5-min sidecar).
        '^docs/reports/.+\.html$',
        '^docs/reports/sessions/.+\.html$',
        '^\.claude/state/founder-checklist-state\.json$',
        '^\.claude/state/dashboard-health/.+\.log$',
        '^\.claude/state/critique/.+\.(md|json)$',
        '^\.claude/state/stop-verification/.+\.log$',
        '^\.claude/state/cron/.+\.(md|json)$',
        '^\.claude/state/cycle-history\.json$',
        '^\.claude/state/heartbeat/.+\.log$',
        '^docs/agents/SESSION_JOURNAL\.md$',

        # 2026-05-21 second-pass fix — additional artifacts that pulse every
        # cycle but are routine cron/agent output, not real changes:
        '^\.claude/state/stop-decisions/.+\.ndjson$',        # Stop hook session-end markers
        '^\.claude/state/incidents/.+\.md$',                 # Incident reports (Class A)
        '^\.claude/state/aggregates/founder-checklist-staleness\.json$',  # weekly staleness audit
        '^\.claude/state/aggregates/architecture-review\.json$',
        '^\.claude/state/aggregates/fiq-status\.json$',

        # Sibling-agent EnterWorktree dirs + verify canary. Both surfaced by
        # test-qa CRITICAL-watcher-allowlist-worktrees-and-canary (2026-05-15):
        # 6 consecutive watcher SKIPs were caused by a leftover worktree dir
        # under .claude/worktrees/dashboard-banners/ plus the verify script's
        # own canary at proposals/pending/TEST-PIPELINE-CANARY.md, neither of
        # which AMD-023's earlier widening covered.
        '^\.claude/worktrees/.+',
        '^\.claude/state/proposals/pending/TEST-PIPELINE-CANARY\.md$'
    )
    $allDirtyRaw = @()
    $allDirtyRaw += (& git diff --name-only HEAD 2>$null)
    $allDirtyRaw += (& git diff --cached --name-only 2>$null)
    $allDirtyRaw += (& git ls-files --others --exclude-standard 2>$null)
    $allDirty = $allDirtyRaw | Where-Object { $_ } | Sort-Object -Unique

    if ($allDirty.Count -gt 0) {
        $nonRoutine = @()
        foreach ($f in $allDirty) {
            $isRoutine = $false
            foreach ($pat in $routinePatterns) {
                if ($f -match $pat) { $isRoutine = $true; break }
            }
            if (-not $isRoutine) { $nonRoutine += $f }
        }
        if ($nonRoutine.Count -gt 0) {
            Log "SKIP working tree dirty with non-routine files: $($nonRoutine -join ', ')"
            $script:cronExitReason = "skip-dirty"
            exit 0
        }
        Log "AUTO-COMMIT routine cron output before preflight: $($allDirty.Count) files"
        foreach ($f in $allDirty) { & git add -- $f 2>&1 | Out-Null }
        $env:GIT_AUTHOR_NAME  = "PARBAUGHS Cron"
        $env:GIT_AUTHOR_EMAIL = "cron@parbaughs.local"
        $env:GIT_COMMITTER_NAME  = "PARBAUGHS Cron"
        $env:GIT_COMMITTER_EMAIL = "cron@parbaughs.local"
        $msg = "cron(routine): auto-commit telemetry output before watcher preflight (" + (Get-Date).ToUniversalTime().ToString("o") + ")"

        # 2026-05-22 fix: HEAD-lock retry. When sidecar + watcher run
        # concurrently they race for the git ref lock and one fails with
        # "fatal: cannot lock ref 'HEAD'". Retry with backoff (200/500/1000ms)
        # before giving up. Single retry usually wins since the conflicting
        # commit completes within 100ms.
        $commitOk = $false
        foreach ($attemptDelay in @(0, 250, 750, 1500)) {
            if ($attemptDelay -gt 0) { Start-Sleep -Milliseconds $attemptDelay }
            $output = & git commit -m $msg 2>&1
            $output | ForEach-Object { Log "  [auto-commit] $_" }
            if ($LASTEXITCODE -eq 0) { $commitOk = $true; break }
            $errStr = ($output | Out-String)
            if ($errStr -notmatch "cannot lock ref|index\.lock|fatal: Unable to create") { break }
            Log "  [auto-commit] HEAD-lock contention, retrying after ${attemptDelay}ms..."
        }
        if (-not $commitOk) {
            Log "WARN auto-commit of routine output failed (continuing - preflight will recheck)"
        }
    }

    # Re-verify tree clean after auto-commit, but apply the SAME routine-
    # pattern allowlist. Post-commit hook fires regen-dashboard.py which
    # appends to telemetry/events/*.ndjson AND rewrites snapshots in
    # telemetry/aggregates/ AND rewrites heartbeats/regen-all-last-pass.json.
    # These re-dirty the tree IMMEDIATELY after our auto-commit. Without
    # routine-pattern filtering on the re-check, the watcher SKIPs forever.
    # 2026-05-20 iter6 — Founder 'why are you stopping when errors persist'.
    # 2026-05-20 iter11 bug fix: was using git status --porcelain + Trim() +
    # Substring(3), but Trim() removes the leading space so Substring(3) was
    # also stripping the leading '.' from '.claude/...' paths. The routine
    # regex requires leading '.' so claude/state/heartbeats/... never matched
    # routine and skip-dirty looped. Use git diff --name-only HEAD instead
    # (same approach the first auto-commit block uses) — returns paths
    # verbatim, no offset arithmetic.
    $reDirtyRaw = @()
    $reDirtyRaw += (& git diff --name-only HEAD 2>$null)
    $reDirtyRaw += (& git diff --cached --name-only 2>$null)
    $reDirtyRaw += (& git ls-files --others --exclude-standard 2>$null)
    $reDirty = $reDirtyRaw | Where-Object { $_ } | Sort-Object -Unique
    if ($reDirty -and $reDirty.Count -gt 0) {
        $reNonRoutine = @()
        foreach ($f in $reDirty) {
            $isRoutine = $false
            foreach ($pat in $routinePatterns) {
                if ($f -match $pat) { $isRoutine = $true; break }
            }
            if (-not $isRoutine) { $reNonRoutine += $f }
        }
        if ($reNonRoutine.Count -gt 0) {
            Log "SKIP working tree dirty with non-routine after auto-commit: $($reNonRoutine -join ', ')"
            $script:cronExitReason = "skip-dirty-post-commit"
            exit 0
        }
        # Only routine files dirty after auto-commit — best-effort commit
        # them too. If the post-commit hook fires again, that's the next
        # watcher cycle's problem; don't loop forever.
        Log "AUTO-COMMIT post-commit drift: $($reDirty.Count) routine files"
        foreach ($f in $reDirty) { & git add -- $f 2>&1 | Out-Null }
        $env:GIT_AUTHOR_NAME  = "PARBAUGHS Cron"
        $env:GIT_AUTHOR_EMAIL = "cron@parbaughs.local"
        $env:GIT_COMMITTER_NAME  = "PARBAUGHS Cron"
        $env:GIT_COMMITTER_EMAIL = "cron@parbaughs.local"
        $msg2 = "cron(routine): post-watcher-commit drift sweep (" + (Get-Date).ToUniversalTime().ToString("o") + ")"
        # 2026-05-22 fix: same HEAD-lock retry as pre-flight auto-commit above
        foreach ($attemptDelay in @(0, 250, 750, 1500)) {
            if ($attemptDelay -gt 0) { Start-Sleep -Milliseconds $attemptDelay }
            $output2 = & git commit -m $msg2 2>&1
            $output2 | ForEach-Object { Log "  [drift-sweep] $_" }
            if ($LASTEXITCODE -eq 0) { break }
            $errStr2 = ($output2 | Out-String)
            if ($errStr2 -notmatch "cannot lock ref|index\.lock|fatal: Unable to create") { break }
            Log "  [drift-sweep] HEAD-lock contention, retrying after ${attemptDelay}ms..."
        }
        # Don't fail the watcher if this second commit also dirties (post-commit
        # hook will keep firing); just proceed to Downloads scan.
    }

    # --- Scan Downloads ---
    $downloads = Join-Path $env:USERPROFILE "Downloads"
    if (-not (Test-Path $downloads)) {
        Log "FATAL Downloads folder not found: $downloads"
        $script:cronSuccess = $false
        $script:cronExitReason = "no-downloads-folder"
        exit 1
    }
    $marker = Join-Path $repoRoot ".claude\state\proposals\.last-processed-decisions.json"
    $lastProcessed = [DateTime]::MinValue.ToUniversalTime()
    if (Test-Path $marker) {
        try {
            $m = Get-Content $marker -Raw | ConvertFrom-Json
            if ($m.last_processed_mtime_utc) {
                $lastProcessed = [DateTime]::Parse($m.last_processed_mtime_utc).ToUniversalTime()
            }
        } catch {}
    }
    Log "scanning $downloads for decisions-*.json + amendments-*.json + escalations-*.json newer than $($lastProcessed.ToString('o'))"

    # Three recognized file patterns (escalations lifecycle 2026-05-14):
    #   decisions-*.json    -> kind="decisions"    -> apply-decisions.sh (proposals)
    #   amendments-*.json   -> kind="amendments"   -> apply-amendments.sh (governance)
    #   escalations-*.json  -> kind="escalations"  -> apply-escalations.sh (Founder escalations)
    # Watcher inspects the kind field in the JSON to determine routing.
    $candidates = @(Get-ChildItem -Path $downloads -Filter "decisions-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed })
    $candidates += @(Get-ChildItem -Path $downloads -Filter "amendments-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed })
    $candidates += @(Get-ChildItem -Path $downloads -Filter "escalations-*.json" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.LastWriteTimeUtc -gt $lastProcessed })
    $candidates = $candidates | Sort-Object LastWriteTimeUtc

    if ($candidates.Count -eq 0) {
        Log "DONE no new decisions or amendments files"
        $script:cronExitReason = "no-new-files"
        exit 0
    }

    Log "found $($candidates.Count) new candidate file(s)"

    $inbox = Join-Path $repoRoot ".claude\state\proposals\inbox"
    $null = New-Item -ItemType Directory -Path $inbox -Force -ErrorAction SilentlyContinue

    $applyFailures = 0
    $appliedAnything = $false
    foreach ($f in $candidates) {
        Log "processing $($f.Name) (mtime=$($f.LastWriteTimeUtc.ToString('o')))"

        # Read JSON to detect kind; default to "decisions" if no kind field
        # (backward compatibility with pre-amendments-lifecycle exports).
        $kind = "decisions"
        try {
            $jsonObj = Get-Content $f.FullName -Raw | ConvertFrom-Json
            if ($jsonObj.kind) { $kind = $jsonObj.kind }
        } catch {
            Log "  WARN could not parse JSON: $_ - defaulting to kind=decisions"
        }
        Log "  detected kind: $kind"

        # Route to the appropriate apply script per kind
        switch ($kind) {
            "amendments" {
                $applyScript = ".claude/scripts/apply-amendments.sh"
                $inboxSub = Join-Path $repoRoot ".claude\state\amendments\inbox"
            }
            "decisions" {
                $applyScript = ".claude/scripts/apply-decisions.sh"
                $inboxSub = $inbox
            }
            "escalations" {
                $applyScript = ".claude/scripts/apply-escalations.sh"
                $inboxSub = Join-Path $repoRoot ".claude\state\escalations\inbox"
            }
            default {
                Log "  FATAL unrecognized kind=$kind in $($f.Name); skipping"
                $applyFailures++
                continue
            }
        }

        $null = New-Item -ItemType Directory -Path $inboxSub -Force -ErrorAction SilentlyContinue
        $dest = Join-Path $inboxSub $f.Name
        Copy-Item -Path $f.FullName -Destination $dest -Force
        Log "  copied to $dest"

        # Run apply script via Git Bash (Fix C: no WSL).
        $gitBash = Resolve-GitBash
        if (-not $gitBash) {
            Log "  FATAL Git Bash not found at any known install path; cannot run $applyScript"
            $applyFailures++
            break
        }
        $bashPath = $dest -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'
        $bashPath = $bashPath.Substring(0,2).ToLower() + $bashPath.Substring(2)
        & $gitBash -c "$applyScript '$bashPath'" 2>&1 | ForEach-Object { Log "    [apply] $_" }
        if ($LASTEXITCODE -ne 0) {
            Log "  $applyScript FAILED for $($f.Name) (exit $LASTEXITCODE)"
            $applyFailures++
            continue
        }
        Log "  $applyScript OK"
        $appliedAnything = $true

        # Update marker AFTER successful apply
        $marker_data = @{
            last_processed_mtime_utc = $f.LastWriteTimeUtc.ToString("o")
            last_processed_filename  = $f.Name
            last_processed_kind      = $kind
            last_processed_at        = (Get-Date).ToUniversalTime().ToString("o")
        }
        $marker_data | ConvertTo-Json | Set-Content -Path $marker -Encoding utf8
        Log "  marker updated"
    }

    if ($applyFailures -gt 0) {
        Log "FAIL $applyFailures apply-decisions.sh failures"
        $script:cronSuccess = $false
        $script:cronExitReason = "apply-failures"
        exit 1
    }

    if ($appliedAnything) {
        Log "running regen-all.ps1..."
        $regenScript = Join-Path $repoRoot "scripts\regen-all.ps1"
        # CurrentUser ExecutionPolicy=RemoteSigned is required (set via
        # scripts/cron/install-all.ps1 first-run prompt). Per AMD-021 strict
        # closure, the prior per-invocation execution-policy override flag
        # is replaced with the proper one-time policy fix.
        & powershell.exe -NoProfile -File $regenScript 2>&1 | ForEach-Object { Log "    [regen] $_" }
        $regenRc = $LASTEXITCODE
        if ($regenRc -ne 0) {
            Log "regen-all FAILED with exit $regenRc - apply-decisions changes are committed by the apply script; regen output may be stale"
            $script:cronSuccess = $false
            $script:cronExitReason = "regen-all-failed"
            exit 1
        }
        Log "regen-all OK"
    }

    Log "DONE applied=$appliedAnything"
    $script:cronExitReason = if ($appliedAnything) { "applied" } else { "no-op" }
    exit 0
}
finally {
    Pop-Location
    try {
        $endedAt = (Get-Date).ToUniversalTime()
        $durationMs = [int]($endedAt - $started).TotalMilliseconds
        Emit-CronTelemetry -repoRoot $repoRoot -eventType "cron.downloads-watcher.end" -data @{
            cron_source    = "downloads-watcher"
            run_id         = $runId
            duration_ms    = $durationMs
            success        = $script:cronSuccess
            exit_reason    = $script:cronExitReason
            claude_invoked = $false
        }
    } catch {
        # Best-effort - never let telemetry break the cron exit
    }

    # 2026-05-19 Path 2 (heartbeat redundancy): write a watcher-specific
    # heartbeat each cycle. Independent of the regen-all heartbeat, this
    # gives the dashboard a second freshness signal: if EITHER heartbeat is
    # fresh, the system is alive. Avoids the prior single-point-of-failure
    # where the daily-maintenance task's misses left the dashboard reporting
    # STALE despite the 5-min watcher cron firing normally.
    try {
        $heartbeatDir = Join-Path $repoRoot ".claude\state\heartbeats"
        $null = New-Item -ItemType Directory -Path $heartbeatDir -Force -ErrorAction SilentlyContinue
        $watcherHeartbeat = Join-Path $heartbeatDir "watcher-last-run.json"
        $hbIso = $endedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
        $hbHuman = $endedAt.ToString("yyyy-MM-dd HH:mm 'UTC'")
        $hbObj = [ordered]@{
            ts                 = $hbIso
            timestamp          = $hbIso
            generated_at       = $hbIso
            last_run_at_utc    = $hbIso
            last_run_at_human  = $hbHuman
            status             = if ($script:cronSuccess) { "PASS" } else { "FAIL" }
            exit_reason        = $script:cronExitReason
            duration_ms        = $durationMs
            run_id             = $runId
            source             = "downloads-watcher"
            cron_cadence_min   = 5
        }
        # Write BOM-free UTF-8 so downstream tooling that uses utf-8 (not
        # utf-8-sig) can parse the file without BOM-eating workarounds.
        # PS 5.1 Set-Content -Encoding utf8 always writes a BOM; use
        # WriteAllText with explicit BOM-free encoding to match the
        # python-written regen-all heartbeat.
        $hbJson = $hbObj | ConvertTo-Json -Compress
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($watcherHeartbeat, $hbJson, $utf8NoBom)
    } catch {
        # Best-effort - never let heartbeat write break the cron exit
    }
}
