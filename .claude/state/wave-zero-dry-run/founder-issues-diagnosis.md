---
doc: Founder issues diagnosis 2026-05-14
date: 2026-05-14
authored_by: claude-code
trigger: Founder URGENT — amendments approved ~30 min ago, nothing applied; dashboards blank in places
discipline: AUTONOMOUS_FAILURE_RECOVERY v8.3
---

# Phase 1 — Diagnosis (cited findings)

Hypothesis-vs-confirmed discipline. Every finding cites evidence.

## F1 — Amendments JSONs ARE in Downloads (CONFIRMED)

**Hypothesis:** Founder claims they exported, but maybe file is missing or
named differently.

**Evidence:** PowerShell scan of `$env:USERPROFILE\Downloads`:
```
Name                                Length LastWriteTime
amendments-2026-05-14T02-09-05.json   1164 5/13/2026 10:09:06 PM
amendments-2026-05-14T01-52-22.json   1024 5/13/2026 9:52:22 PM
amendments-2026-05-14T01-47-56.json    884 5/13/2026 9:47:56 PM
decisions-2026-05-13T21-23-31.json     372 5/13/2026 5:35:17 PM
```

**Confirmed:** 3 amendments-*.json exports + 1 old decisions-*.json. Founder
iterated 3 times (approving more AMDs each time):
- JSON#1 (01:47:56Z): approve AMD-001..005 (the "5 amendments" Founder mentioned)
- JSON#2 (01:52:22Z): approve AMD-001..006
- JSON#3 (02:09:05Z): approve AMD-001..007 (latest intent)

## F2 — Watcher Scheduled Task is installed and firing (CONFIRMED)

**Hypothesis:** Maybe the watcher isn't running.

**Evidence:** Task Scheduler query:
```
Name                          State LastRun                LastResult
PARBAUGHS-Downloads-Watcher   Ready 5/13/2026 10:05:48 PM           0
PARBAUGHS-Daily-Maintenance   Ready 5/13/2026 6:02:53 PM            0
```

Task name was `PARBAUGHS-Downloads-Watcher` (not `DownloadsWatcher` as
guessed in directive). LastResult=0 (success). NextRun scheduled.
Watcher fires every 5 minutes.

**Confirmed:** Watcher is alive and firing.

## F3 — Watcher SKIPS on every run because working tree is dirty (ROOT CAUSE)

**Hypothesis:** Watcher fired but couldn't apply — likely preflight check.

**Evidence:** Latest 2 watcher logs (`scripts/cron/logs/`):

```
[02:05:48] START 2026-05-14T02:05:48Z  repoRoot=C:\Users\Zach\smoky-mountain-open  runId=a50a4cf71501
[02:05:48] python=C:\Users\Zach\AppData\Local\Programs\Python\Python312\python.exe
[02:05:48] SKIP working tree dirty (refuse to apply on top of in-flight work)
```

Same SKIP message at 02:00:48Z. Watcher script at line 94-100:
```powershell
& git diff --quiet HEAD 2>$null
$dirty = ($LASTEXITCODE -ne 0)
& git diff --cached --quiet 2>$null
if ($dirty -or $stagedDirty) {
    Log "SKIP working tree dirty (refuse to apply on top of in-flight work)"
```

Working tree at this moment (`git status --short`):
- `M .claude/state/telemetry/aggregates/*.json` (telemetry artifacts from cron runs)
- `M package-lock.json`
- `M .claude/state/telemetry/events/2026-05-13.ndjson`
- Untracked: `.claude/state/proposals/.last-processed-decisions.json`,
  `.claude/state/telemetry/events/2026-05-14.ndjson`, `scripts/cron/quarantine/2026-05-13/`,
  `scripts/v7-mtd-diagnostic.js`, `tests/round-trip-workspace/`

`git diff --quiet HEAD` exits 1 → watcher SKIPs every cycle.

**Confirmed root cause.** Watcher is firing, kind-detection is in place,
JSONs are present, but the dirty-tree preflight refuses to apply.

## F4 — Watcher uses Git-Bash (not WSL) — Fix C still holds (CONFIRMED)

**Hypothesis:** Maybe the old WSL bug from the 21:35Z log resurfaced.

**Evidence:** `scripts/cron/downloads-watcher.ps1` line 182:
```powershell
# Run apply script via Git Bash (Fix C: no WSL).
```

`scripts/cron/common.ps1` line 25-28 explicitly excludes System32 and
WindowsApps paths from bash resolution. Good.

Old log at `21:35:49Z` shows a pre-Fix-C WSL invocation that failed — but
that was a one-off pre-Fix-C run. Current watcher is Fix-C-compliant.

## F5 — Kind-detection patch is in the running watcher (CONFIRMED)

**Evidence:** `scripts/cron/downloads-watcher.ps1` line 122-160:
```
scanning $downloads for decisions-*.json and amendments-*.json
detected kind: $kind
switch ($kind) {
    "amendments" { $applyScript = ".claude/scripts/apply-amendments.sh" }
```

When the tree is clean, the watcher would correctly route
`amendments-*.json` to `apply-amendments.sh`.

## F6 — AMD-006 collision in Founder's JSON#3 (PROBLEM)

**Evidence:** JSON#3 approves AMD-001..007 including AMD-006. But
AMD-006 already moved to `.claude/state/amendments/applied/` earlier in
this session (commit 9edb38e at 2026-05-14T01:59:33Z).

`apply-amendments.sh` requires the AMD file to be in `pending/` to apply.
JSON#3 + AMD-006 will fail with "AMD not found in pending/".

**Cause:** Founder iterated their amendment review across multiple
exports. JSON#2 was generated at 01:52Z, before AMD-006 was applied. The
amendments.html localStorage carried AMD-006:approve forward into
JSON#3's export even though AMD-006 was no longer pending.

**Treatment:** Sanitize JSON#3 to exclude AMD-006 before manual apply.

## F7 — AMD-002 anchor will not match (PROBLEM)

**Evidence:** AMD-002 frontmatter sets
`section_anchor: "For cron-specific thresholds"`.

`apply-amendments.sh` edit-section logic only matches HEADING lines
(regex `^#+\s*<anchor>\s*$` OR a line starting with `#` that contains
the anchor). In `docs/agents/CRON_CONFIGURATION.md`:

```
614:For cron-specific thresholds:
615:- Daily token budget alert: 600k/day expected, alert at 800k/day
616:- Weekly token budget alert: 3.5M/week expected, alert at 4.5M/week
```

Line 614 is plain prose, not a heading. The edit-section anchor will not
resolve. AMD-002 application will fail.

**Cause:** AMD-002 was authored with a prose-anchor that the apply
script doesn't support. This is a Critic-level miss in the AMD itself.

**Treatment options:**
- (A) Extend apply-amendments.sh to support text-anchor matching
- (B) Re-author AMD-002 with `replace-existing` against the 3 affected
      lines (different type)
- (C) Apply by hand outside the script, document deviation

Recommendation: defer AMD-002 from this batch, surface for Founder
attention. Author a corrective AMD-008 with workable anchor as a
follow-up.

## F8 — Dashboards have correct data (NOT BLANK)

**Hypothesis:** Founder said "dashboards showing blank in places."

**Evidence:** Just regenerated all dashboards via regen-all.sh at
2026-05-14T02:08:19Z; round-trip PASS. amendments.html shows
6 pending AMDs (AMD-001..005, AMD-007). dashboard.html shows
amendments_counts.pending=6. main-flows.html shows 8 flows.

**Likely Founder observation:** if Founder viewed dashboards BEFORE
the 02:08 regen, the amendments-pending count would not yet show
AMD-007 (which I authored at 02:08). The "blank in places" is
plausibly:
- Tile-amendments label was missing from index.html (we added it in
  the prior commit but the status panel still has 6 tiles, not 7 — so
  no `tile-amendments` exists in the status panel).
- The "Founder Review Queue" section doesn't exist yet (that's the
  P18.6 implementation gap pending AMD-007 approval).

**Status:** Not actually "blank" — but absent the Founder Review Queue
section means Founder can't see open governance gates at a glance from
dashboard.html itself. That's the AMD-007 protocol's whole purpose.
Implementation ship will land it.

## F9 — No active HALT, no cron-paused, no stuck states (CONFIRMED HEALTHY)

**Evidence:**
- No `.claude/state/cron/cron-paused.json`
- No `.claude/state/cron/last-verify.json` (which would gate the watcher)
- HALT state in dashboard data block: "none"

System substrate is healthy. Only blocker is the dirty tree.

# Phase 1 root cause summary

| # | Finding                                                  | Severity |
|---|----------------------------------------------------------|----------|
| F3 | Watcher SKIPs on dirty tree → no apply since 21:35Z      | **ROOT** |
| F6 | AMD-006 in Founder's JSON#3 but already in applied/      | medium   |
| F7 | AMD-002 anchor won't resolve (prose, not heading)        | medium   |
| F8 | Dashboards not "blank" — Review Queue not yet built      | accepted |
| F1, F2, F4, F5, F9 | All confirmed-healthy support claims                | ok       |

**Single root cause:** dirty working tree blocks the watcher. Founder's
exports have been waiting since 01:47Z.

**Secondary:** AMD-002 anchor won't apply; AMD-006 in JSON#3 is a
duplicate. Both need handling before apply.

---

(Phase 2/3 fix narrative appended below as work proceeds.)
