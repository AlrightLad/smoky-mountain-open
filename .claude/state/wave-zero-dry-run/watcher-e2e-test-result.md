# Downloads Watcher E2E Test — Result

**Run:** 2026-05-13 21:02–21:12 UTC
**Outcome:** **PASS-WITH-FIXES.** Pipeline verified end-to-end. Two infrastructure fixes applied along the way to make the watcher viable on a real Windows machine without WSL.
**Recommendation:** **Safe to leave running every 5 minutes** with the two committed fixes in place.

---

## Verification — all 5 success items GREEN

| Item | Expected | Observed | Result |
|------|----------|----------|--------|
| 1. `pending/PROP-TEST-001-synthetic.md` gone post-apply | absent | confirmed absent | ✓ |
| 2. `deferred/PROP-TEST-001-synthetic.md` exists post-apply | present | confirmed present | ✓ |
| 3. `decisions-log.ndjson` has new line | one line | `{"ts":"2026-05-13T21:07:19Z","proposal_id":"PROP-TEST-001","decision":"defer",...}` | ✓ |
| 4. New commit past baseline | yes | `d4c36ad Apply proposal decisions (1 total)` landed by `apply-decisions.sh` | ✓ |
| 5. `proposals.html` data block reflects PROP-TEST-001 in deferred | deferred count = 1, includes PROP-TEST-001 | confirmed via data-block parse | ✓ |

All five items observed within the same watcher invocation (retry 3).

## Time from watcher invocation to commit landing

- Watcher start: `21:07:18`
- apply-decisions.sh complete: `21:07:21` (3s)
- Watcher's commit `d4c36ad` landed: `21:07:22` (4s total)
- regen-all subsequent fail (em-dash mojibake — fixed separately, NOT in critical path): `21:07:22`–`21:07:23`

The critical pipeline (Downloads → inbox → apply → commit) completes in **~4 seconds**. The downstream regen-all step is separate and runs after the test-validation surface.

## Fixes applied along the way

### Fix 1 — Python interpreter fallback in `.claude/scripts/apply-decisions.sh`

**Root cause:** Script hard-required `python3` on PATH. Founder's Windows + Git Bash environment has `python.exe` at `$LOCALAPPDATA\Programs\Python\Python312\python.exe` with no `python3` symlink. The watcher's first invocation failed with `Error: python3 not found.`

**Fix:** Replaced the hard requirement with a fallback chain — try `python3`, then `python`, then `py`, then known Windows install paths (`/c/Users/$USER_NAME/AppData/Local/Programs/Python/Python31{1,2}/python.exe`). Also: guarded the `USER`/`USERNAME` envvar reads against `set -u` failure (Git Bash doesn't always export both).

**Additional fix (path conversion):** When `PYTHON_BIN` ends in `.exe` (Windows-native), the script converts the JSON file path from Git-Bash POSIX form (`/c/Users/...`) to Windows form (`C:/Users/...`) before passing to Python — via `cygpath -w` when available, otherwise via `sed` regex. Without this, Windows Python sees `/c/Users/...` as a relative path under root and `open()` fails.

**Commit:** `d61c2b7 fix(apply-decisions): locate python via fallback chain (python3 → python → py → Windows install paths)`

### Fix 2 — Em-dash mojibake in `scripts/regen-all.ps1`

**Root cause:** Two `—` (em-dash, UTF-8 `E2 80 94`) characters in `Write-Host "..."` strings on lines 79 and 103. PowerShell 5.1 reads `.ps1` files without a BOM as Windows-1252, which interprets the 3-byte UTF-8 sequence as 3 separate chars. The downstream parse error surfaced as `Array index expression is missing or not valid` at the `[regen-all]` literal in a string — misleading line attribution but root cause was the prior em-dash byte sequence corrupting parser state.

**Fix:** Byte-replacement pattern (Founder's prescribed approach for E2 80 XX): `—` → ASCII hyphen `-` at both locations. No re-encoding of the file required.

**Commit:** `058ac37 fix(regen-all): replace em-dashes (E2 80 94) with ASCII hyphens — PowerShell 5.1 reads .ps1 without BOM as Win-1252 and chokes on UTF-8 multibyte`

(Note: that commit's own commit-message contains an em-dash. Git's commit-message storage is UTF-8 — that's fine. Only `.ps1` source files PowerShell parses are sensitive.)

## Mojibake fixes applied — affected files

| File                                    | Bytes replaced              | Reason |
|-----------------------------------------|-----------------------------|--------|
| `.claude/scripts/apply-decisions.sh`    | NONE (the fix was logic, not encoding) | python3 → fallback chain + path conversion |
| `scripts/regen-all.ps1`                 | `E2 80 94` → `2D` × 2       | PowerShell 5.1 Win-1252 parser corruption |

The cron PS1 files (`downloads-watcher.ps1`, `install-downloads-watcher.ps1`, `test-downloads-watcher.ps1`, `uninstall-downloads-watcher.ps1`) were already mojibake-free per the prior session (Founder + I cleaned them in the earlier UTF-8 pass).

## Rollback executed

Per Phase 3:
1. After verification, identified 3 commits to handle:
   - `d61c2b7` apply-decisions fix — KEEP (infrastructure)
   - `d4c36ad` watcher test-data commit — DROP (synthetic test)
   - `058ac37` em-dash fix — KEEP (infrastructure)
2. Rebase: `git rebase --onto d61c2b7 d4c36ad` (drops only the watcher commit; rebases em-dash fix onto apply-decisions fix).
3. Restored `cron-paused.json` from `.bak-test` backup → committed as `618d378`.
4. Deleted `.test-rollback-target`, `.last-processed-decisions.json`, test Downloads JSON.
5. Re-ran `regen-all.ps1` → dashboards reflect pre-test state (pending=2, approved=1, deferred=0) → committed as `3cf85b9`.
6. Final state: real proposals (PROP-002 approved, PROP-003 + PROP-004 pending) untouched. No PROP-TEST-001 anywhere on disk or in any data block.

## Final commit chain (head → baseline)

```
3cf85b9 regen-all post-rollback: dashboards reflect pre-test state (pending=2, approved=1, deferred=0)
618d378 Restore cron-paused.json after watcher e2e test complete
058ac37 fix(regen-all): replace em-dashes (E2 80 94) with ASCII hyphens ...
d61c2b7 fix(apply-decisions): locate python via fallback chain (python3 → python → py → Windows install paths)
9ff2001 Pre-watcher-test cleanup: untrack local settings, gitignore test artifacts, clear pause for e2e test
46bd30d Session state snapshot: regen-proposals output + telemetry events
b69ab91 Fix UTF-8 encoding in cron scripts (em-dash mojibake removed; PowerShell parser now accepts)
```

The watcher's auto-commit `d4c36ad` does not appear in the log — successfully dropped via rebase. Real infrastructure work survived.

## Round-trip test

`tests/round-trip-test.py` PASS at the final state. All sections green including `[lifecycle]` PROPOSAL_LIFECYCLE_v8.2 schema validation.

## Final disposition

**PASS-WITH-FIXES.** The watcher pipeline IS functional. Two viable-on-Windows infrastructure fixes are now committed. With those in place, the watcher run every 5 minutes:

1. Will skip immediately when `cron-paused.json` is present (current state — the file was restored as part of cleanup; watcher's pre-flight respects it).
2. When Founder eventually clears `cron-paused.json`, future runs will:
   - Detect new `decisions-*.json` in Downloads
   - Copy to inbox, apply via the fixed `apply-decisions.sh`
   - Update marker, run `regen-all.ps1`, leave the commit local (not pushed)
3. Latency: ~5 min worst case (cron interval) + ~4 sec for the apply + ~5 sec for the regen.

## Recommendation

**Safe to leave the Scheduled Task running every 5 min.** Caveats:

1. `cron-paused.json` is currently present → watcher will SKIP every run until Founder removes it. This is the intended governance-pause state. Remove when Founder is ready to trust the cron loop.
2. Founder should monitor `scripts/cron/logs/<ts>-downloads-watcher.log` for the first week to confirm pre-flight checks (cron-paused, last-verify, working-tree-clean) behave as expected against real working-tree activity. The `working-tree-dirty` check will gate the watcher whenever Founder has uncommitted edits.
3. If the watcher commits something Founder didn't expect, `git reset --hard HEAD~1` undoes it cleanly (the apply-decisions.sh commit is a single, atomic, narrowly-scoped change).
4. Future Wave Zero cron clearance (`cron-paused.json` removal) should be paired with verifying the watcher's first real run via the log file before walking away.

## Cross-references

- Watcher script: `scripts/cron/downloads-watcher.ps1`
- Apply-decisions: `.claude/scripts/apply-decisions.sh` (post-fix)
- Regen-all: `scripts/regen-all.ps1` (post-fix)
- Install (Founder, as Admin): `scripts/cron/install-downloads-watcher.ps1`
- Test (manual, no scheduling): `scripts/cron/test-downloads-watcher.ps1`
- Logs: `scripts/cron/logs/2026-05-13T21-07-18Z-downloads-watcher.log` (this test run)
- Lifecycle spec: `.claude/state/wave-zero-dry-run/remediation/proposed-PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`
- Test procedure that informed this run: `.claude/state/wave-zero-dry-run/lifecycle-test.md`
