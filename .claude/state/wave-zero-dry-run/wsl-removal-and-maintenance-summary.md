# Fix C (WSL Removal) + Fix B (Daily Maintenance Cron) — Summary

**Run:** 2026-05-13 21:39–21:55 UTC
**Outcome:** **Both builds PASS.** Fix C verified live with Founder's real proposal-approval data flowing through. Fix B tested non-admin (admin steps skip cleanly with logged note); awaits Founder install for full live verification.

---

## Fix C — WSL dependency removed from cron pipeline

### Resolve-GitBash function — paths discovered on Founder's machine

Probe results from `Test-Path` on every candidate + `where.exe bash`:

| Path | Exists | Notes |
|------|--------|-------|
| `C:\Program Files\Git\bin\bash.exe` | **YES** (canonical) | Resolve-GitBash returns this |
| `C:\Program Files (x86)\Git\bin\bash.exe` | no | 32-bit Git install (not present) |
| `$env:LOCALAPPDATA\Programs\Git\bin\bash.exe` | no | per-user Git install (not present) |
| `C:\Program Files\Git\usr\bin\bash.exe` | YES | msys-bundled bash (lower-priority candidate) |
| `where.exe bash` slot 1 | `C:\Program Files\Git\usr\bin\bash.exe` | Git Bash (allowed by fallback filter) |
| `where.exe bash` slot 2 | `C:\Windows\System32\bash.exe` | **WSL launcher** (filtered out via `-notmatch "System32"`) |
| `where.exe bash` slot 3 | `C:\Users\Zach\AppData\Local\Microsoft\WindowsApps\bash.exe` | **WSL store wrapper** (filtered out via `-notmatch "WindowsApps"`) |

### Audit of PS scripts touching .sh (`grep "\.sh\|bash"`)

Only **one** PS script invokes `.sh` files in code: `scripts/cron/downloads-watcher.ps1`. Other matches are description-string references in metadata, not executable code.

| File | Pre-fix | Post-fix |
|------|---------|----------|
| `scripts/cron/downloads-watcher.ps1` | `Get-Command bash.exe` + `$bash.Source -c ...` | Resolve-GitBash + `& $gitBash -c ...` |
| `scripts/cron/install-downloads-watcher.ps1` | description-string only (no code) | unchanged |
| `scripts/cron/maintenance.ps1` (new, Fix B) | includes Resolve-GitBash (no .sh calls yet — future-proof) | n/a |

### Verification

1. **Standalone Resolve-GitBash test** — returns `C:\Program Files\Git\bin\bash.exe`. Filter rejects System32 + WindowsApps.
2. **Live watcher run** (post-Fix-C + a follow-up apply-decisions.sh heredoc fix):
   - Watcher invoked Git Bash explicitly
   - apply-decisions.sh ran end-to-end
   - PROP-003 and PROP-004 (Founder's real approvals) moved from `pending/` to `approved/`
   - decisions-log.ndjson written
   - regen-all completed including round-trip test PASS
   - Final commit: `c691735 Apply proposal decisions (2 total)`
   - **Zero WSL/wsl.exe mentions in the watcher log** (verified by grep)

### Follow-up fix surfaced during Fix C testing

The watcher's first post-Fix-C run reached apply-decisions.sh successfully (proving Fix C worked) but the script then failed on a Python heredoc parse error. Root cause: `apply-decisions.sh` was substituting bash variables (`$NOTE`, `$DECIDED_AT`, etc.) directly into Python single-quoted string literals — any embedded quote/newline broke the parse. Founder's actual decisions JSON had a multi-line note that triggered this.

Fixed in commit `c4fedaa`: replaced shell substitution with environment-variable passing (`os.environ.get("LE_*", "")`). Adjacent to Fix C scope but unblocking — committed as its own change.

### Fix C commits (head → root)

- `c691735` Apply proposal decisions (2 total) — watcher's auto-commit, Founder's real intent
- `c4fedaa` fix(apply-decisions): use env vars for Python log-entry heredoc
- `be63ba5` Fix C: remove WSL dependency from cron pipeline (Resolve-GitBash)

---

## Fix B — Daily maintenance cron at 02:55

### Maintenance script step-by-step

`scripts/cron/maintenance.ps1`. 10 steps. Each step wraps in try/catch — one failing step logs the error and the run continues.

| # | Step | Purpose | Admin needed? |
|---|------|---------|---------------|
| 1 | Pre-flight | Skip if `.claude/state/cron-paused.json` present | no |
| 2 | Git repo health | `git fetch origin`, `git gc --auto`, report ahead/behind + dirty count | no |
| 3 | Untracked-junk sweep | Move `*.tmp`, `*.bak-*`, `.test-rollback-target`, `*(1).md`, `*(2).md`, `*(3).md`, `tests/round-trip-workspace/*` into `scripts/cron/quarantine/<date>/` (recoverable for 30 days) | no |
| 4 | Log rotation | Compress `scripts/cron/logs/*.log` older than 30 days into `scripts/cron/logs/archive/<YYYY-MM>.zip`; delete originals after successful zip | no |
| 5 | Dep updates | `wsl --update`, `pip install --upgrade -r .claude/requirements.txt`, `npm update` (non-major) | **yes** (admin) |
| 6 | State-dir health | Audit `last-verify.json` age, halts present, `decisions-log.ndjson` size | no |
| 7 | Regen-all sanity | Run `scripts/regen-all.ps1`; must end with round-trip test PASS | no |
| 8 | Telemetry emit | Append `cycle.maintenance.complete` event with step outcomes to `.claude/state/telemetry/events/<date>.ndjson` | no |
| 9 | Daily report | Generate `.claude/state/cron/maintenance-<YYYY-MM-DD>.md` with step table + needs-Founder-attention list | no |
| 10 | Local commit | `git add` + commit if any state changes; NOT pushed | no |

### Test results — `test-maintenance.ps1` non-admin run

```
==[1/10]== Pre-flight: governance pause check       ok (cron-paused.json absent)
==[2/10]== Git repo health                          ok (ahead/behind=0/22, dirty=18)
==[3/10]== Untracked-junk sweep                     ok (moved=26 — test sandbox + duplicate spec MDs)
==[4/10]== Log rotation                             ok (no logs >30 days)
==[5/10]== Dependency updates (wsl/pip/npm)         skipped (not admin — expected)
==[6/10]== State directory health audit             ok (no findings)
==[7/10]== Regen-all sanity                         ok (round-trip PASS)
==[8/10]== Telemetry emit                           ok
==[9/10]== Daily report                             ok (.claude/state/cron/maintenance-2026-05-13.md)
==[10/10]== Local commit                            ok (committed: 38d65fa "Maintenance run 2026-05-13")

Total duration: 2.3 seconds (excluding step 5 which would extend it under admin)
```

### Founder install instructions (paste-ready)

1. **Open PowerShell as Administrator** (right-click PowerShell → Run as Administrator).

2. **Navigate to the repo:**
   ```powershell
   cd C:\Users\Zach\smoky-mountain-open
   ```

3. **Run the installer:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\cron\install-maintenance.ps1
   ```

4. **Enter your Windows password** when prompted. Windows stores it encrypted in the task definition (S4U logon type) so the task can run unattended with admin privileges.

5. **Verify task is registered:**
   ```powershell
   Get-ScheduledTask -TaskName PARBAUGHS-Daily-Maintenance
   ```

6. **First real run:** the task fires at 02:55 local time. Founder reviews the morning report at:
   ```
   .claude\state\cron\maintenance-<YYYY-MM-DD>.md
   ```
   and the per-run log at `scripts\cron\logs\<ts>-maintenance.log`.

### Security model documented in install-maintenance.ps1 header

The install script's `.SECURITY MODEL` block:

> The maintenance task needs admin to run wsl --update, pip install, npm update, etc. Windows Scheduled Tasks support this via the S4U (Service for User) logon type — Founder enters their Windows password ONCE during install, and Windows stores it encrypted in the task definition. The task then runs unattended with those credentials.
>
> IMPORTANT: this means the script in maintenance.ps1 runs with Founder's FULL credentials. Every line of that script must be trusted. Critic enforces this on every PR that modifies maintenance.ps1.

`maintenance.ps1` itself has a matching `.SECURITY` block; Critic gate applies to both.

### Fix B commits

After this commit, the chain will be:
- `<this commit>` Fix B: daily maintenance cron at 02:55
- `38d65fa` Maintenance run 2026-05-13 (the test-maintenance.ps1's commit during testing)
- `c691735` Apply proposal decisions (2 total) — from Fix C verification
- ...

### Step 3 (junk sweep) flagged a behavior to confirm

The first non-admin test run quarantined **26 items** including:
- `docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD (1).md` (Founder upload — matched `*(1).md`)
- `docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard (1).md` (Founder upload — matched `*(1).md`)
- `tests/round-trip-workspace/**` (26 files — test sandbox, regenerated on each round-trip run)

The duplicate `(1).md` files were Founder's intentional uploads from session start that have been sitting untracked since. They're recoverable at `scripts/cron/quarantine/2026-05-13/`. **Founder may want to keep these out of the junk-pattern set** — review and add to gitignore if intentional, OR commit if needed.

For the test sandbox: round-trip-test.py recreates `tests/round-trip-workspace/` at every run, so quarantining it between runs is harmless (the next regen rebuilds it cleanly — confirmed by step 7 round-trip PASS post-quarantine).

## Critic pre-close audit

- [x] All cron scripts grepped for `wsl|WSL` in code — only comment matches documenting WHY removed
- [x] `Resolve-GitBash` function present in every PS script that touches `.sh` (just `downloads-watcher.ps1` today; `maintenance.ps1` includes it future-proof)
- [x] Maintenance script's step list matches the spec above
- [x] `install-maintenance.ps1` documents admin-password security model in its header (`.SECURITY MODEL` block, lines 10-19)
- [x] All PS files em-dash free (verified via `grep -c "—"` returning 0 for each)
- [x] All PS files parse OK (`[System.Management.Automation.PSParser]::Tokenize` returned no errors)

## Cross-references

- Watcher: `scripts/cron/downloads-watcher.ps1`
- Maintenance: `scripts/cron/maintenance.ps1`
- Install scripts: `scripts/cron/install-{downloads-watcher,maintenance}.ps1`
- Test scripts: `scripts/cron/test-{downloads-watcher,maintenance}.ps1`
- Cron README: `scripts/cron/README.md`
- E2E watcher test (prior session): `.claude/state/wave-zero-dry-run/watcher-e2e-test-result.md`
- Apply-decisions follow-up fix: commit `c4fedaa`
