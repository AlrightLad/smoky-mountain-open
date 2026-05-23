# scripts/ralph-loop.ps1 — PARBAUGHS Ralph loop controller
#
# Prolonged autonomous loop wrapper around Claude Code CLI. Re-invokes
# the agent with the directive in .claude/state/loops/NEXT_PROMPT.md
# every cycle. Survives single-iteration failures so a bad cycle does
# not end the loop.
#
# Authorship: 2026-05-23, per Founder directive "If the loop cannot
# last over a week+ I need you to research how to implement Ralph
# loops and other PROLONGED agent loops".
#
# USAGE:
#   pwsh -File scripts/ralph-loop.ps1
#   pwsh -File scripts/ralph-loop.ps1 -MaxCycles 1000 -DelaySeconds 60
#   pwsh -File scripts/ralph-loop.ps1 -StopFile .claude/state/loops/STOP
#
# Stop the loop by creating the file at -StopFile (default
# .claude/state/loops/STOP) — the loop exits at the next iteration
# boundary. Useful when you want to gracefully halt without Ctrl-C.
#
# References (Ralph loop pattern, 2024-2025):
#   - Anthropic's Claude Code SDK + --resume flag for stateful loops
#   - https://www.anthropic.com/news/claude-code (SDK announcement)
#   - Community pattern (Ralph, Codex CLI similar): controller polls
#     a prompt file + journal, re-invokes CLI, captures stdout
#
# WHAT THIS DOES NOT DO:
#   - It does not bypass AMD-018 gates. Founder approval still required
#     for deploys, secrets, force-push, etc. The agent surfaces those
#     to task-queue/founder/ and continues with non-gated work.
#   - It does not self-modify NEXT_PROMPT.md unsupervised. The agent
#     can edit it (e.g. to redirect focus), but the controller treats
#     the prompt file as authoritative each cycle.

param(
    [int]$MaxCycles = 10000,
    [int]$DelaySeconds = 30,
    [string]$PromptFile = ".claude/state/loops/NEXT_PROMPT.md",
    [string]$JournalFile = ".claude/state/loops/LOOP_JOURNAL.md",
    [string]$StopFile = ".claude/state/loops/STOP",
    [string]$LogDir = ".claude/state/loops/cycles"
)

$ErrorActionPreference = "Continue"
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

function Write-CycleLog {
    param([int]$Cycle, [string]$Status, [string]$Note)
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $line = "- Cycle $Cycle [$ts] $Status :: $Note"
    Add-Content -Path $JournalFile -Value $line
}

Write-Host ""
Write-Host "=== PARBAUGHS Ralph loop starting ==="
Write-Host "  Max cycles:     $MaxCycles"
Write-Host "  Delay seconds:  $DelaySeconds"
Write-Host "  Prompt file:    $PromptFile"
Write-Host "  Journal file:   $JournalFile"
Write-Host "  Stop file:      $StopFile"
Write-Host ""
Write-Host "  To stop the loop: create file at $StopFile"
Write-Host ""

# Verify Claude Code CLI is installed
$claudeCmd = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claudeCmd) {
    Write-Error "Claude Code CLI not found in PATH. Install: https://docs.claude.com/claude-code"
    exit 1
}

$cycle = 0
while ($cycle -lt $MaxCycles) {
    if (Test-Path $StopFile) {
        Write-Host "[ralph] Stop file detected at $StopFile. Exiting at cycle $cycle."
        Write-CycleLog -Cycle $cycle -Status "STOP" -Note "Stop file detected; loop halted gracefully."
        break
    }

    $cycle++
    $cycleStart = Get-Date
    $cycleStartIso = $cycleStart.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $logFile = Join-Path $LogDir "cycle-$cycle-$($cycleStart.ToString('yyyy-MM-ddTHH-mm-ssZ')).log"

    Write-Host ""
    Write-Host "=== Cycle $cycle of $MaxCycles starting ($cycleStartIso) ==="

    if (-not (Test-Path $PromptFile)) {
        Write-Host "[ralph] Prompt file missing at $PromptFile. Sleeping $DelaySeconds s and retrying..."
        Start-Sleep -Seconds $DelaySeconds
        continue
    }

    $prompt = Get-Content -Path $PromptFile -Raw

    # Invoke Claude Code with --print (non-interactive) and --resume
    # to carry conversation context across cycles.
    try {
        $cycleOutput = & claude --print --resume $prompt 2>&1
        $cycleOutput | Out-File -FilePath $logFile -Encoding utf8

        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0) {
            $headSha = (& git rev-parse --short=8 HEAD 2>$null).Trim()
            Write-CycleLog -Cycle $cycle -Status "OK" -Note "exit=0 head=$headSha log=$logFile"
            Write-Host "[ralph] Cycle $cycle OK (head=$headSha)"
        } else {
            Write-CycleLog -Cycle $cycle -Status "FAIL" -Note "exit=$exitCode log=$logFile"
            Write-Host "[ralph] Cycle $cycle FAIL (exit=$exitCode). Log: $logFile"
        }
    } catch {
        Write-CycleLog -Cycle $cycle -Status "EXCEPTION" -Note ($_.Exception.Message)
        Write-Host "[ralph] Cycle $cycle exception: $($_.Exception.Message)"
    }

    $cycleDuration = (Get-Date) - $cycleStart
    Write-Host "[ralph] Cycle $cycle duration: $($cycleDuration.TotalSeconds) s"

    if ($cycle -lt $MaxCycles) {
        Write-Host "[ralph] Sleeping $DelaySeconds s before next cycle..."
        Start-Sleep -Seconds $DelaySeconds
    }
}

Write-Host ""
Write-Host "=== PARBAUGHS Ralph loop completed after $cycle cycles ==="
