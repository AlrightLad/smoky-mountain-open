# Overnight Triage Cron — Build Summary

**Run:** 2026-05-13 21:55–22:13 UTC
**Outcome:** **All 3 deliverables shipped.** Launcher + fixed prompt + install/uninstall/test scripts authored, parse-clean, em-dash-free. Resolve-GitBash + Resolve-Python + Resolve-ClaudeCode refactored into `scripts/cron/common.ps1` (DRY across all 3 cron pipelines). Pre-flights verified in non-Claude-Code dry runs; full Claude-Code-runs-to-completion verification is Founder's post-install task.

---

## Deliverable 1 — `scripts/cron/overnight-triage.ps1`

Launcher script. Per Founder spec:

- Dot-sources `common.ps1` for `Resolve-GitBash`, `Resolve-Python`, `Resolve-ClaudeCode`, `Should-SkipCron`, `Should-FireHalt24`
- Sets `PYTHONIOENCODING=utf-8` + merges User+Machine PATH for Scheduled-Task narrow-PATH safety
- Pre-flight 1: `cron-paused.json` present → SKIP exit 0 + telemetry `cron.overnight-triage.skipped`
- Pre-flight 2: `last-verify.json.resume_after` in the future → SKIP exit 0
- Pre-flight 3: HALT 24 check (resume_after passed by >1h) → write `.claude/state/halts/halt-24-auto-resume-failure-<ts>.json` + telemetry + exit 1
- Resolves Claude Code CLI (returns null with FATAL log + exit 2 if missing)
- Verifies `overnight-triage-prompt.txt` present (exit 3 if missing)
- Launches Claude Code via `Start-Process -RedirectStandardInput $promptFile -RedirectStandardOutput .stdout -RedirectStandardError .stderr`
- Wall-clock timeout: 4 hours (`$proc.WaitForExit($maxDurationMs)`); kills + telemetry + exit 4 on timeout
- Streams stdout + stderr into the main log after Claude Code exits
- Emits `cron.overnight-triage.complete` with `exit_code`, `duration_seconds`, `stdout_lines`, `stderr_lines`
- Returns Claude Code's own exit code

Parse OK; em-dash-free; no WSL refs.

## Deliverable 2 — `scripts/cron/overnight-triage-prompt.txt`

114-line fixed prompt. Sections:

1. **Read first** — 7 governance docs to ground the run (skim-friendly: "skim if you've seen them in this session")
2. **Work to do** — 6 numbered steps:
   - FIQ triage with FIQ_QUALITY_RUBRIC grading (demote <B to backlog; set triaged_at on B+)
   - bug-reports/inbox/ processing via P3e discussion bubbles (Engineer + Critic + Data-Integrity voters; Devil's-Advocate bubble-only); diagnose confirmed-vs-hypothesis with cited line numbers; author proposals OR FIQ entries; move to triaged/
   - Heartbeat: `regen-all.ps1` (the gating wrapper — explicitly NOT individual regens), refresh wellness state files
   - Session journal at `.claude/state/cron/<YYYY-MM-DD>-overnight-run.md`
   - Local commit with exact message format
   - Exit clean
3. **Discipline** — block:
   - **Defensive pause heuristic** explicit in prompt (F1a token-meter gap): pause every 5 atomic ops OR on any API error; write last-verify.json reason "pause-rate-limit", exit clean
   - NO push
   - NO docs/agents/* direct writes (governance hook blocks; route to proposals/pending)
   - NO auto-anything that crosses Founder-decision boundary
   - **Critic metric-integrity check** before close (METRIC_INTEGRITY_PROTOCOL § 3.1): three concrete questions; if Critic can't attest, ship doesn't close — write Scenario 2 handoff + last-verify.json reason "metric-integrity-deferred" + non-zero exit

Empty-inbox fallback: do heartbeat-only and log "inbox empty; heartbeat only" — heartbeat alone is valuable.

ASCII dashes throughout. No em-dashes.

## Deliverable 3 — install / uninstall / test

| Script | Purpose |
|--------|---------|
| `install-overnight-triage.ps1` | Admin-required. Prompts for Founder's Windows password (S4U logon). Trigger: Daily at 03:00 local. RunLevel: Highest. ExecutionTimeLimit: 4 hours. DontStopOnIdleEnd, AllowStartIfOnBatteries, DontStopIfGoingOnBatteries, StartWhenAvailable. Symmetric to install-maintenance.ps1. |
| `uninstall-overnight-triage.ps1` | Admin-required. Idempotent removal. |
| `test-overnight-triage.ps1` | Non-admin manual run. **WARNING: launches Claude Code, may run up to 4 hours.** Ctrl-C to cancel. |

## DRY refactor — `scripts/cron/common.ps1`

Pulled out:

- `Resolve-GitBash` (paths probed first, then `where.exe bash` filtered against System32 + WindowsApps)
- `Resolve-Python` (Python 3.12 → 3.11 install paths, then `Get-Command python.exe`)
- `Resolve-ClaudeCode` (NEW: probes `$env:LOCALAPPDATA\Programs\claude\claude.exe`, `$env:APPDATA\npm\claude.{cmd,ps1}`, `$env:LOCALAPPDATA\Programs\AnthropicClaude\claude.exe`, then `Get-Command claude`)
- `Should-SkipCron` (cron-paused.json + last-verify.json resume_after-in-future check, combined)
- `Should-FireHalt24` (last-verify.json with resume_after > 1h past)

`downloads-watcher.ps1` and `maintenance.ps1` refactored to dot-source `common.ps1` instead of inlining the helpers. **Net effect:** ~40 lines deleted from each, ~120 lines added in `common.ps1`. Three pipelines now share one source of truth for resolution + pre-flight logic.

`overnight-triage.ps1` was authored from the start using these helpers. No copy-pasting.

## Verification

| Check | Result |
|-------|--------|
| `common.ps1` PARSE OK | ✓ |
| `overnight-triage.ps1` PARSE OK | ✓ |
| `install-overnight-triage.ps1` PARSE OK | ✓ |
| `uninstall-overnight-triage.ps1` PARSE OK | ✓ |
| `test-overnight-triage.ps1` PARSE OK | ✓ |
| Em-dash free across all 5 files | ✓ (0 occurrences of `—`) |
| `wsl` / `WSL` references | only in `common.ps1` comments documenting WHY removed (allowed per Critic spec) |
| `Resolve-GitBash` available everywhere via dot-source | ✓ |
| Watcher post-refactor smoke test | ✓ (test-downloads-watcher exits clean after dirty-tree SKIP — Resolve-GitBash sourced correctly) |
| `Resolve-ClaudeCode` finds Founder's install | ✓ (returns `C:\Users\Zach\AppData\Roaming\npm\claude.cmd`) |
| Launcher reaches Claude Code invocation | ✓ (PID captured; killed in dry run — full E2E is Founder's post-install task) |

## Founder install instructions (paste-ready)

```powershell
# 1. Verify Claude Code is installed and on PATH
claude --version

# 2. Open PowerShell as Administrator
cd C:\Users\Zach\smoky-mountain-open

# 3. Install the Scheduled Task (will prompt for Windows password)
powershell -ExecutionPolicy Bypass -File scripts\cron\install-overnight-triage.ps1

# 4. Verify task is registered
Get-ScheduledTask -TaskName PARBAUGHS-Overnight-Triage

# 5. First run fires at 03:00 local. Founder reviews in the morning:
#    - scripts\cron\logs\<ts>-overnight-triage.log
#    - .claude\state\cron\<YYYY-MM-DD>-overnight-run.md (session journal)
#    - git log --oneline -5  (local commit visible)
```

## Open question for Founder

**Credential sharing — separate password per task, or single shared?**

Founder has already entered a Windows password for `PARBAUGHS-Daily-Maintenance` (the 02:55 maintenance task). The new `PARBAUGHS-Overnight-Triage` task will require another `Get-Credential` prompt during install. Windows stores each task's credential separately encrypted; no built-in "share between tasks" mechanism.

Two ways to think about this:
- **As designed** (each install prompts independently) — minor friction, but the security model is clear. Each task's credential is invalidated independently when Founder changes their Windows password.
- **Alternative** (shared credential, single password entry) — would require both install scripts to accept an already-provided credential. Not implemented; would need design + Founder ratification.

Recommendation: keep as designed. The 5-second extra prompt during install isn't worth the added complexity of a credential-sharing scheme, especially when both tasks already have the same security implications (admin Founder execution).

## Dependencies (must exist on Founder's machine before the cron is useful)

| Dependency | Status on Founder's machine | Resolver |
|-----------|------------------------------|----------|
| Claude Code CLI | Installed (`C:\Users\Zach\AppData\Roaming\npm\claude.cmd`) | `Resolve-ClaudeCode` |
| Git Bash | Installed (`C:\Program Files\Git\bin\bash.exe`) | `Resolve-GitBash` |
| Python 3.12 | Installed (`C:\Users\Zach\AppData\Local\Programs\Python\Python312\python.exe`) | `Resolve-Python` |
| `cron-paused.json` absent at run time | Currently present (governance state) — Founder removes when ready | n/a |

The launcher fails loudly with clear exit codes if any dependency is missing. Founder review of the per-run log will surface "FATAL Claude Code CLI not found" etc. immediately.

## Cross-references

- Launcher: `scripts/cron/overnight-triage.ps1`
- Prompt: `scripts/cron/overnight-triage-prompt.txt`
- Install/uninstall/test: `scripts/cron/install-overnight-triage.ps1`, `uninstall-overnight-triage.ps1`, `test-overnight-triage.ps1`
- Shared helpers: `scripts/cron/common.ps1`
- README (updated): `scripts/cron/README.md` § 3
- Substrate spec source: `.claude/state/wave-zero-dry-run/substrate-build-spec.md`
- Prior Fix B summary: `.claude/state/wave-zero-dry-run/wsl-removal-and-maintenance-summary.md`
