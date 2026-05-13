# Substrate Build Spec — Overnight Triage Cron via Windows Task Scheduler

> **Status:** SPEC CAPTURED. Not yet executed. Honors the "EXECUTION ORDER" constraint from Founder's directive: substrate build runs AFTER Wave Zero F5/V7-V12 + first proactive cycle ratify.
> **Source:** Founder directive received 2026-05-13 during F5 remediation work.
> **Apply window:** Eligible when (a) V7-V12 records exist, (b) FIRST_PROACTIVE_CYCLE_KICKOFF.md has executed, (c) Founder has reviewed `proposals.html` once.

---

## Context

- Founder uses Claude Code with Claude.ai login (no API key)
- Windows 11 dev machine, always on
- One run/day, overnight (target 3 AM local)
- Bug-report inbox = FIQ (Founder Input Queue, P11) + bug-reports/inbox/
- Goal: Founder wakes to triaged queue, not raw bug reports
- This SUBSTRATE was specified by Founder mid-remediation-pass with explicit instruction NOT to interleave; captured here for later execution

## What this substrate solves

Founder gets: overnight triage of whatever's in `.claude/state/founder-input-queue/` and `.claude/state/bug-reports/inbox/`, with proposals + discussion bubbles ready for morning review. This is the "users report bugs, agents review without waiting for me" loop, scoped to what's buildable on Claude.ai login + Windows Task Scheduler.

## What this substrate does NOT solve (honest list)

- True API-key headless mode: not built. Requires Anthropic API billing.
- 24/7 cloud autonomy: not built. Requires API key + GH Actions or server.
- Org-cap mid-run failures: still possible. Defensive pause heuristic is best-effort, not enforced by a real meter.
- Multi-day continuous work: not enabled. One run/day, ~4hr cap each.
- Real user-facing bug reporting UI: not in scope. FIQ + bug-reports/inbox/ are file-drop inboxes; Founder still needs to populate them OR build in-app Caddy Notes feedback in a later ship.

---

## PHASE A — Substrate scripts to author (when triggered)

All under `scripts/cron/`:

### 1. `scripts/cron/overnight-triage.ps1`

PowerShell launcher. Responsibilities:
- `cd C:\Users\Zach\smoky-mountain-open`
- Set `PYTHONIOENCODING=utf-8`, `PYTHONUTF8=1` in env
- Merge user + machine PATH so `python` resolves
- **Pre-flights (all logged to `scripts/cron/logs/<ts>-pf.log`):**
  - `git status` — refuse to run if working tree dirty → log to `<ts>-skipped-dirty-tree.log`, exit 0
  - Read `.claude/state/cron-paused.json` — if present, log + exit 0 (governance pause respected by cron)
  - Read `.claude/state/last-verify.json`:
    - If present and `resume_after` has NOT passed → log + exit 0
    - If present and `resume_after` passed by > 3600s → write HALT 24 evidence file + exit 1 (auto-resume failure)
- Launch Claude Code with the overnight-triage prompt
- Capture stdout + stderr to `scripts/cron/logs/<ts>-run.log`
- Wall-clock timeout: 4 hours. Kill process if exceeded.
- Exit code reflects success/failure for Task Scheduler history

**Claude Code invocation pattern (CHOOSE ONE, document rationale in code header):**
- (a) `claude --dangerously-skip-permissions < prompt.txt` — stdin pipe; works if Claude Code reads stdin on non-tty
- (b) `claude --dangerously-skip-permissions @prompt.txt` — newer file-as-prompt pattern
- (c) Wrapper that launches Windows Terminal + SendKeys the prompt + waits — brittle but works without API key; last resort

Test (a) and (b) first; fall back to (c) only if neither works. The PS1 should detect the working pattern at first install and pin it.

### 2. `scripts/cron/overnight-triage-prompt.txt`

The fixed prompt the launcher passes to Claude Code. Verbatim contents:

```
OVERNIGHT TRIAGE RUN — autonomous, no Founder available

Read these to ground yourself:
  docs/agents/WAVE_ZERO_DRY_RUN_RUNBOOK.md (skip if already familiar)
  docs/agents/FIRST_PROACTIVE_CYCLE_KICKOFF.md
  docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md
  .claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md

Work to do:
1. Scan .claude/state/founder-input-queue/ for new untriaged entries
   (no `triaged_at` field in frontmatter).
2. Scan .claude/state/bug-reports/inbox/ for any *.md files.
3. For each: open a discussion bubble per P3e if the diagnosis is
   non-trivial. Voters: Engineer + Critic + Data-Integrity.
   Devil's-Advocate bubble-only.
4. Diagnose: confirmed vs. hypothesis (Founder rule). Cite line
   numbers, file paths, error strings verbatim. No inventing.
5. Where a fix is clear and small: author a proposal at
   .claude/state/proposals/pending/PROP-NNN-*.md with full schema.
6. Where the issue needs Founder decision: append to FIQ as
   new entry per FOUNDER_INPUT_QUEUE template (P11) + grade it
   per the FIQ_QUALITY_RUBRIC (after F3 lands; until then,
   write the entry with all 5 rubric dimensions filled).
7. Move processed bug reports from inbox/ to bug-reports/triaged/
8. Update existing FIQ entries with `triaged_at` field once handled.
9. Run heartbeat activities at end (per V9 spec):
   - Invoke `scripts/regen-all.ps1` (Windows) OR `scripts/regen-all.sh` (bash). This runs
     aggregate-telemetry → regen-dashboard → regen-ops-views → regen-main-flows →
     regen-index in sequence, with a final summary line "ALL DASHBOARDS REGENERATED at
     <ts>" on success or "PARTIAL FAILURE — failed steps: ..." on partial failure.
   - Refresh wellness state files (separate step; not part of regen-all).
10. Write session journal entry at
    .claude/state/cron/<YYYY-MM-DD>-overnight-run.md summarizing
    what was triaged, what was proposed, what got punted.
11. Commit all state changes with message:
    "Overnight triage <date> — <N> reports processed, <M> proposals
     authored, <K> FIQ entries graded"
12. Exit clean.

Discipline:
- Defensive pause heuristic until F1a token meter exists: pause +
  write last-verify.json every 5 atomic operations OR after any
  single tool call returns API error / org-cap.
- DO NOT push commits. Founder reviews local diff first.
- DO NOT modify docs/agents/* directly (hook blocks; write proposals
  to .claude/state/ for Founder application).
- DO NOT auto-merge or auto-deploy anything. Triage + propose only.
- Critic must do the metric-integrity check before close:
  "Was this run's work substantive or did I generate fluff to look
   productive?"

If the inbox is empty across all sources, do steps 9-12 only and
exit. Heartbeat alone is valuable.
```

### 3. `scripts/cron/install-task.ps1`

One-shot installer. Registers a Windows Scheduled Task:
- Name: `PARBAUGHS-Overnight-Triage`
- Trigger: Daily at 3:00 AM local
- Action: `powershell.exe -ExecutionPolicy Bypass -File C:\Users\Zach\smoky-mountain-open\scripts\cron\overnight-triage.ps1`
- Run whether user logged in or not
- Power: do NOT wake to run task (machine is always on per Founder)
- Stop the task if it runs longer than 4 hours
- Logs to Task Scheduler history + the per-run log file
- **Idempotent:** if task already exists, update it rather than fail

### 4. `scripts/cron/uninstall-task.ps1`

Removes the scheduled task. Symmetric to install.

### 5. `scripts/cron/test-run.ps1`

Runs `overnight-triage.ps1` immediately (not via scheduler) for manual testing. Same pre-flight, same Claude Code invocation, same log capture. Use to validate before installing the task.

### 6. `scripts/cron/README.md`

Documents:
- How to install (run install-task.ps1 as Admin)
- How to test manually (run test-run.ps1 from regular shell)
- Where logs live (`scripts/cron/logs/`)
- How to pause cron (write `.claude/state/cron-paused.json`)
- How to uninstall (run uninstall-task.ps1 as Admin)
- Known limitations (interactive-CLI-via-stdin, not true headless; org cap can still stall a run)
- What to do if a run hangs (check logs/, kill process, investigate)

### 7. `scripts/cron/logs/.gitkeep` + `.gitignore` update

`.gitkeep` keeps the dir in git. Logs themselves go to .gitignore:
- `scripts/cron/logs/*.log`
- `scripts/cron/logs/*-skipped-*.log`

---

## PHASE B — Test before scheduling

Before installing the task, prove the launcher works:

### Test seed inputs

- Synthetic FIQ entry at `.claude/state/founder-input-queue/SYNTH-test-overnight-triage.md` with realistic question + missing `triaged_at`
- Synthetic bug report at `.claude/state/bug-reports/inbox/SYNTH-test-bug.md` simulating "User reports scores not saving on hole 14"

### Run + verify

1. Run `scripts/cron/test-run.ps1` manually. Watch the log file.
2. Verify outputs:
   - Synthetic FIQ entry has `triaged_at` set
   - Synthetic bug report moved to `bug-reports/triaged/`
   - At least 1 discussion bubble authored at `.claude/state/discussion-bubbles/`
   - Proposal or FIQ entry authored for the bug
   - Heartbeat artifacts updated (dashboard.html data block fresh)
   - Session journal entry at `.claude/state/cron/<date>-overnight-run.md`
   - Local git diff shows the new commit (not pushed)
3. Document test result at `.claude/state/wave-zero-dry-run/substrate-test-run.md`
4. If test PASSES → install the scheduled task via `install-task.ps1` (Founder runs as Admin). Note install date + task GUID in cron README.
5. If test FAILS → do NOT install. Write failure analysis to `.claude/state/wave-zero-dry-run/substrate-test-failure.md` and stop.

---

## PHASE C — First real overnight run

Once installed, first run fires at 3 AM. Founder morning review:
1. Open `docs/reports/dashboard.html` — see overnight activity summary
2. Open `docs/reports/proposals.html` — see new triaged proposals
3. Open `docs/reports/discussion-bubbles.html` — read agent reasoning
4. `git log --oneline -5` — see the overnight commit
5. `git diff HEAD~1` — review actual changes
6. If approves: `git push` (or `apply-decisions.sh` for proposal approvals)

---

## Trigger conditions (when this spec becomes executable)

All of:
1. **Wave Zero F1-F5 remediation complete** — proposed-*.md files in `.claude/state/wave-zero-dry-run/remediation/` exist and are Founder-ratified (moved to `docs/agents/`).
2. **V7-V12 executed** — `07-fiq.md` through `12-telemetry-reports.md` exist in `.claude/state/wave-zero-dry-run/`. SUMMARY.md exists.
3. **FIRST_PROACTIVE_CYCLE_KICKOFF.md executed** — `.claude/state/proactive/<cycle-id>-summary.md` exists.
4. **Founder has reviewed `proposals.html` at least once** — at least one proposal in `.claude/state/proposals/approved/` or `rejected/` indicates Founder has touched the review surface.

When all 4 conditions are met, a future Claude Code session can pick up this spec and execute Phase A → B → C in sequence.

## Why not build now

1. Founder's directive ends with explicit **EXECUTION ORDER** stating "Finish F5 + V7-V12 first."
2. Substrate that runs against incomplete governance produces incomplete triage. The overnight-triage prompt references F3's FIQ rubric and F5's metric-integrity protocol — both currently exist only as `proposed-*.md` drafts. The triage cron should pull the ratified versions, not drafts.
3. Token-budget discipline: F1a meter gap is real this session. Building 6 PowerShell scripts + testing the install/uninstall + first run would consume budget that should be preserved for the in-flight remediation pass close-out.

---

## Cross-references

- F1 token-meter diagnostic (substrate's defensive-pause comment depends on this): `.claude/state/wave-zero-dry-run/remediation/F1a-token-meter-gap-diagnostic.md`
- F3 FIQ quality rubric (substrate's grading step depends on this): pending — to be authored at `.claude/state/wave-zero-dry-run/remediation/proposed-FIQ_QUALITY_RUBRIC.md`
- F5 metric integrity (Critic pre-close audit referenced in substrate prompt): `.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md`
- PAUSE_DISCIPLINE (substrate honors cron-paused.json + last-verify.json + HALT 24): `docs/agents/PAUSE_DISCIPLINE_v8.1_ADDENDUM.md`
- Heartbeat protocol (substrate runs heartbeat at end of run): `docs/agents/HEADLESS_OPERATION_PROTOCOL.md` P14

---

*Spec captured 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass. Execution deferred per Founder's EXECUTION ORDER constraint. Future Claude Code session picks this up after the 4 trigger conditions are met.*
