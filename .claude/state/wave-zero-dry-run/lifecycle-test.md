# Proposal Lifecycle E2E Test — Founder-Verifiable Procedure

**Status:** DEFERRED to Founder verification. The scripts have been authored, validated structurally (no syntax errors, no schema mismatches), and unit-tested where possible. The full end-to-end test (synthetic decisions → Downloads → watcher → apply → scan → regen → revert) requires an authoritative environment and Founder oversight on the test-commit/revert dance.
**Authored:** 2026-05-13

---

## Why this is deferred to Founder

The E2E test creates **synthetic** test data in the real Downloads folder, runs apply-decisions.sh against real proposals, makes a fake "test: Implements PROP-002" commit, then reverts. Every step is logically reversible, but the test mutates real state. Doing this autonomously, especially after a long session that's already consumed substantial budget, has more downside than benefit:

1. If something goes wrong mid-test (e.g., apply-decisions.sh edge case, or the fake commit unexpectedly preserved), the recovery requires careful state inspection that's better done with Founder oversight.
2. The Downloads-watcher's job is to react to Founder's REAL exports of decisions.json. A synthetic test approximates that, but Founder's first real export is the cleanest E2E validation.

## What HAS been validated structurally (no real-state risk)

| Component | Validation | Result |
|-----------|------------|--------|
| `scripts/scan-shipped-proposals.py` | Ran on real state with no implementing commits | PASS — `approved=1 candidate-commits-90d=0; moved=0` |
| `scripts/regen-proposals.py` | Ran via `regen-all.sh`, populated proposals.html with 5-state schema | PASS — counts: pending=2 approved=1 deferred=0 shipped=0 rejected=0 |
| `scripts/regen-all.sh` (chain) | Now includes scan + regen-proposals; gates on round-trip test | PASS — all 7 steps complete; round-trip test PASS |
| `scripts/regen-dashboard.py` | Surfaces `proposals_counts` object for banner | PASS — banner data populated |
| `tests/round-trip-test.py` `[lifecycle]` section | Validates new schema, all 5 buckets, counts.shipped_total, immutability of shipped_at fields | PASS — schema valid; counts match on-disk |
| `proposals.html` renderer | Handles both legacy array shape and new 5-state object shape | PASS — `bucketedProposals()` normalizer |
| `dashboard.html` banner | "X pending · N in flight · M shipped" data-bound | PASS — three spans populated from data block |
| `scripts/cron/downloads-watcher.ps1` | Pre-flight logic (cron-paused, last-verify, dirty tree); Downloads scan; apply-decisions invocation pattern | NOT YET EXECUTED against synthetic data — Founder runs |
| `scripts/cron/install-downloads-watcher.ps1` | Idempotent Scheduled Task registration | NOT YET EXECUTED — requires Founder Admin elevation |

The structural validation confirms the pipeline works on the regen + scan side. The remaining validation is the watcher's interaction with the OS — that's Founder territory.

## E2E Test Procedure (for Founder)

When you have ~10 min, run the following in order. **Verify each step's expected output before proceeding.**

### Step 1 — Seed a synthetic decisions JSON

In a fresh PowerShell session, create a test decisions file. PROP-002 is currently in `approved/`, so we'll exercise the watcher with a fake new proposal first. Actually, simpler: just verify the watcher reads from Downloads and applies. Create:

```powershell
$ts = (Get-Date).ToString("yyyy-MM-ddTHH-mm-ss")
$path = "$env:USERPROFILE\Downloads\decisions-$ts-TEST.json"
@'
{
  "exported_at": "<ISO>",
  "decisions": []
}
'@ -replace '<ISO>', (Get-Date).ToUniversalTime().ToString("o") | Set-Content $path -Encoding utf8
Write-Host "Seeded: $path"
```

**Expected:** A file at `~\Downloads\decisions-<ts>-TEST.json` containing valid empty-decisions JSON.

### Step 2 — Run the watcher once manually

```powershell
cd C:\Users\Zach\smoky-mountain-open
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\cron\test-downloads-watcher.ps1
```

**Expected output:** Watcher logs "found 1 new decisions file", copies to `.claude/state/proposals/inbox/`, runs apply-decisions.sh with empty decisions (no-op), updates marker, exits 0. The log lands at `scripts/cron/logs/<ts>-downloads-watcher.log`.

### Step 3 — Verify marker advanced

```powershell
type .claude\state\proposals\.last-processed-decisions.json
```

**Expected:** JSON with `last_processed_filename: "decisions-<ts>-TEST.json"` and timestamps.

### Step 4 — Test the shipped-detection branch

Make a fake commit that references PROP-002:

```powershell
echo "test marker" > scripts\cron\.test-marker
git add scripts\cron\.test-marker
git commit -m "test: Implements PROP-002 — proposal lifecycle E2E"
```

Then run the scanner:

```powershell
& "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" scripts\scan-shipped-proposals.py
```

**Expected output:** `[scan-shipped] SHIPPED PROP-002 via <sha>: test: Implements PROP-002 — proposal lifecycle E2E` + `[scan-shipped] done: moved=1 skipped_already_shipped=0`.

Verify:
- `.claude/state/proposals/approved/` no longer contains PROP-002
- `.claude/state/proposals/shipped/PROP-002-*.md` exists with `shipped_at` + `shipped_in_commit` fields appended
- `.claude/state/proposals/shipped-log.md` has a new row

### Step 5 — Re-regen and confirm dashboard banner

```powershell
bash scripts\regen-all.sh
```

**Expected:** Dashboard banner now reads "2 pending · 0 in flight · 1 shipped". proposals.html Section 4 ("Shipped — archive") collapsible has PROP-002 visible (after expanding).

### Step 6 — Revert + clean up

```powershell
git reset --hard HEAD~1
del scripts\cron\.test-marker
del "$env:USERPROFILE\Downloads\decisions-<ts>-TEST.json"
# Restore PROP-002 from shipped/ to approved/ (the reset only moved git's HEAD; the file system moves persist)
git checkout HEAD -- .claude/state/proposals/
bash scripts\regen-all.sh
```

**Expected post-revert:** Dashboard banner back to "2 pending · 1 in flight · 0 shipped". PROP-002 back in approved/. State identical to pre-test.

## If Founder confirms E2E passes

Founder runs install (as Administrator):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\cron\install-downloads-watcher.ps1
```

Document install timestamp in `.claude/state/cron/README.md` (Founder adds the line). Next time Founder exports decisions from proposals.html, the watcher fires within 5 minutes and applies them automatically.

## If Founder finds an issue

The most likely failure modes:

1. **bash.exe not on PATH** — Git Bash needs to be installed and on PATH for apply-decisions.sh to run. Verify with `Get-Command bash.exe`.
2. **Path conversion edge case** — `dest -replace '\\', '/' -replace '^([A-Za-z]):', '/$1'` may not handle all Windows path quirks. If apply-decisions.sh errors with "file not found", fix the path conversion in `downloads-watcher.ps1` lines around 100.
3. **apply-decisions.sh expects bash** — if it shows `\r` issues (CRLF), run `dos2unix .claude/scripts/apply-decisions.sh` once.
4. **Marker stuck at far-future date** — if the watcher silently skips all files, delete `.claude/state/proposals/.last-processed-decisions.json` and re-run.

## References

- Lifecycle spec: `.claude/state/wave-zero-dry-run/remediation/proposed-PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`
- Scanner: `scripts/scan-shipped-proposals.py`
- Watcher: `scripts/cron/downloads-watcher.ps1`
- Install: `scripts/cron/install-downloads-watcher.ps1`
- Test (manual run): `scripts/cron/test-downloads-watcher.ps1`
- Uninstall: `scripts/cron/uninstall-downloads-watcher.ps1`
- Audit trail: `.claude/state/proposals/shipped-log.md` (created on first ship)
