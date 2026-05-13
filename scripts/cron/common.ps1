#requires -Version 5.1
<#
.SYNOPSIS
    Shared helpers for PARBAUGHS cron scripts.

.DESCRIPTION
    Dot-source from any cron PS script:
        . "$PSScriptRoot\common.ps1"
    Then call Resolve-GitBash and Resolve-Python by name.

    DRY pattern - downloads-watcher.ps1, maintenance.ps1, and
    overnight-triage.ps1 all use these helpers. If you author a new
    cron script, dot-source this file rather than copy-pasting.

.NOTES
    ASCII dashes only (PowerShell 5.1 reads .ps1 without BOM as Win-1252;
    UTF-8 multibyte characters trigger parse errors). Critic enforces.
#>

# Resolve Git Bash explicitly. Fix C: never let Windows pick a bash - the
# default resolution order on Windows includes System32\bash.exe (WSL launcher)
# and WindowsApps\bash.exe (WSL store wrapper). We do NOT want WSL.
function Resolve-GitBash {
    $candidates = @(
        "C:\Program Files\Git\bin\bash.exe",
        "C:\Program Files (x86)\Git\bin\bash.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\bash.exe",
        "C:\Program Files\Git\usr\bin\bash.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    # Fallback: where.exe bash - but filter out WSL paths.
    $found = & where.exe bash 2>$null | Where-Object {
        $_ -notmatch "System32" -and $_ -notmatch "WindowsApps"
    } | Select-Object -First 1
    if ($found -and (Test-Path $found)) { return $found }
    return $null
}

# Resolve a Python interpreter. Prefer known Windows install paths, then
# fall back to PATH lookup. Returns full path to python.exe or $null.
function Resolve-Python {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    $cmd = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

# Resolve Claude Code CLI. Used by overnight-triage.ps1 to launch headless
# Claude. Returns full path to claude.exe (or .cmd / .bat wrapper) or $null.
function Resolve-ClaudeCode {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\claude\claude.exe",
        "$env:APPDATA\npm\claude.cmd",
        "$env:APPDATA\npm\claude.ps1",
        "$env:LOCALAPPDATA\Programs\AnthropicClaude\claude.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    $cmd = Get-Command claude -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

# Pre-flight guard: returns $true if the cron should SKIP this run.
# Reasons: cron-paused.json present, or last-verify.json with resume_after
# in the future. Caller logs the skip and exits 0 if this returns $true.
function Should-SkipCron {
    param([string]$repoRoot)
    $cronPaused = Join-Path $repoRoot ".claude\state\cron-paused.json"
    if (Test-Path $cronPaused) { return $true }

    $lastVerify = Join-Path $repoRoot ".claude\state\last-verify.json"
    if (Test-Path $lastVerify) {
        try {
            $lv = Get-Content $lastVerify -Raw | ConvertFrom-Json
            if ($lv.resume_after) {
                $resumeAfter = [DateTime]::Parse($lv.resume_after).ToUniversalTime()
                if ((Get-Date).ToUniversalTime() -lt $resumeAfter) { return $true }
            }
        } catch {
            # Malformed last-verify.json - proceed (don't skip blindly)
        }
    }
    return $false
}

# HALT 24 check: last-verify.json present with resume_after passed by > 1 hour.
# Returns $true if HALT 24 should fire. Caller writes the halt evidence and
# exits non-zero.
function Should-FireHalt24 {
    param([string]$repoRoot)
    $lastVerify = Join-Path $repoRoot ".claude\state\last-verify.json"
    if (-not (Test-Path $lastVerify)) { return $false }
    try {
        $lv = Get-Content $lastVerify -Raw | ConvertFrom-Json
        if (-not $lv.resume_after) { return $false }
        $resumeAfter = [DateTime]::Parse($lv.resume_after).ToUniversalTime()
        $now = (Get-Date).ToUniversalTime()
        $elapsed = ($now - $resumeAfter).TotalSeconds
        return ($elapsed -gt 3600)
    } catch {
        return $false
    }
}
