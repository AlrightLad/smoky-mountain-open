# Incident — concurrent marathon agents (two Claude instances on one repo)

**Detected:** 2026-06-13 ~00:20 EDT (04:20 UTC) by the overnight-triage-cron session
(this session), immediately after it completed its triage heartbeat and the Stop hook
directed it to build the DISTANCE TO PIN backlog item.
**Severity:** SEV-2 (operational / production-safety hazard — NOT a data loss; nothing
broke, the hazard was caught and avoided).
**Status:** CONTAINED by standing down + dropping `.claude/state/loops/STOP`.
**Founder action required:** confirm only ONE marathon driver runs, then re-arm
(delete STOP) if desired. See "Founder resolution" below.

---

## What happened

1. This session was invoked as a **scoped overnight TRIAGE cron** ("OVERNIGHT TRIAGE
   RUN … DO NOT push commits … Exit clean"). It completed steps 3-5 (both triage queues
   were absent → heartbeat-only): ran `regen-all.ps1` (PASS), refreshed wellness, wrote
   the journal, committed locally (`32d1c22a`, `de05a514`). All correct.
2. On turn-end, the **marathon Stop hook** (`.claude/hooks/stop-continue.sh`, active
   because `.claude/state/loops/CONTINUE` is present) blocked the stop and directed this
   session to execute the only open backlog item: **DISTANCE TO PIN** (Founder-greenlit
   2026-06-13, Lane A).
3. Before editing anything, this session checked the working tree and found
   **distance-to-pin source already in flight**: a new `src/core/distance.js`, plus
   modified `src/pages/playnow-scoring.js` and `vite.config.js` — none authored by this
   session (this session never touches `src/`). `distance.js` had a **static mtime**
   (04:18:36, unchanged across two checks) but `playnow-scoring.js`/`vite.config.js`
   went from "5 insertions uncommitted" to **committed** within ~5 minutes.
4. A second check confirmed it: commit **`fafbf398`** (00:21:09 EDT) —
   *"feat(playnow): GPS distance-to-pin — Front/Center/Back to the green (v8.25.55)"* —
   with `distance.js` **tracked + bundled** (vite `CORE_FILES`) + **wired**
   (`playnow-scoring.js:165`) + **APP_VERSION bumped to 8.25.55**. HEAD then advanced
   again via cron regen (`ccdb8b50`). `tasklist` shows **two `claude.exe` processes**
   (PID 4668 + 38100).

**Conclusion:** a **second, concurrent Claude instance is actively executing the
marathon** and already built + committed the entire DISTANCE TO PIN feature. This is the
exact hazard `HIBERNATION_CRON.md` § "Known limitation" warned about and deliberately
avoided ("ralph-loop … not armed here to avoid a second Claude instance editing the
repo concurrently with the live session"). Something armed a second driver anyway
(external `ralph-loop.ps1`, a second Claude Code window, or a hibernation-cron fire that
spawned rather than re-used the idle REPL).

## Why this session STOOD DOWN (did not build / push)

Two concurrent agents on one repo + one backlog item is dangerous specifically at the
**production push**:
- Both would edit the same files (`distance.js`, `playnow-scoring.js`) → merge churn.
- Both would race `git push origin main` → the `parbaughs-ship-cycle` skill documents
  this disaster verbatim: a non-FF cherry-pick `-X theirs` once "silently resolved
  AGAINST a feature commit … producing a pushed main without the feature." A two-agent
  push race is the live version of that.
- The feature was **already done** by the other instance, so building it here would be
  pure duplication with zero added value and nonzero corruption risk.

**Production integrity outranks marathon continuity.** The correct move was to yield:
- NO edits to any feature file.
- NO `git push` (also honors this session's originating "DO NOT push" instruction).
- NO edit to `BACKLOG.md` (the other instance will mark DISTANCE TO PIN `[x]` when it
  finishes its ship cycle; editing it here would race that write too).
- Drop `STOP` — the explicitly agent-sanctioned halt control (BACKLOG.md § Control
  flags) — to end this redundant, hazardous loop cleanly.

Note: dropping `STOP` loses **no pending agent-actionable work** — DISTANCE TO PIN was
the **only** open `- [ ]` item, and it is built + committed. Every other BACKLOG item is
already `[x]` or in "Deferred with evidence" / "Genuinely blocked (a secret only the
Founder can create)". The agent-actionable queue is effectively exhausted; the marathon
was due to wind down after this item regardless.

## State at containment

- **DISTANCE TO PIN:** built + committed locally as **v8.25.55** (`fafbf398`) by the
  concurrent instance. Whether it is pushed to staging/prod + V1-verified is owned by
  that instance — NOT verified here (pushing to check would itself race).
- **This session's own work:** triage heartbeat committed (`32d1c22a` + `de05a514`);
  app-health A- 85.6 (down from 87.1, other-sessions' work, root-caused in
  `2026-06-13-overnight-run.md`); both triage queues absent; nothing pushed.
- **Working tree:** clean but for `.claude/state/loops/.cb-state` (circuit-breaker
  state, routine/auto-managed).

## Founder resolution

1. **Confirm single driver.** Decide which marathon driver you want running and ensure
   only one is live (check for a stray `ralph-loop.ps1` Scheduled Task, a second Claude
   Code window, or a duplicate hibernation cron via `CronList`). Running two against one
   repo will keep racing prod pushes.
2. **Verify DISTANCE TO PIN shipped cleanly.** Confirm `v8.25.55` is the intended state
   on prod + staging and the GPS Front/Center/Back read + 2-tap green capture work on a
   real device (the feature reads `navigator.geolocation` and writes the green's
   coordinates — NOT the member's location — to `courses/{id}.greens[holeIdx]`).
3. **Re-arm if desired.** Delete `.claude/state/loops/STOP` to resume the marathon (once
   single-driver is confirmed). With DISTANCE TO PIN done and everything else gated, the
   loop will likely find no agent-actionable items and idle anyway.

---

*Authored by the overnight-triage-cron session as a stand-down/coordination record. No
feature files, no `BACKLOG.md`, and no remote were touched — collision avoidance was the
whole point.*
