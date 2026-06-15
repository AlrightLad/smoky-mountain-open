# Incident — concurrent marathon agents (two Claude instances on one repo), recurrence

**Detected:** 2026-06-15 ~00:13 EDT (04:13 UTC) by the overnight-triage-cron session
(this session), immediately after it completed its triage heartbeat and the marathon
Stop hook directed it to build the PL backlog (PL1 RINGS, PL3 FEED FLAIR, PL4 TITLES,
PL16 full E2E, swing-animation).
**Severity:** SEV-2 (operational / production-safety hazard — NOT data loss; nothing
broke, the hazard was caught and avoided).
**Status:** CONTAINED by standing down + dropping `.claude/state/loops/STOP`.
**Founder action required:** confirm only ONE marathon driver runs, then **re-arm the
store-revamp marathon by deleting `.claude/state/loops/STOP`** (one command). See
"Founder resolution" below. This is the SECOND occurrence of this exact hazard (see
`2026-06-13-concurrent-marathon-collision.md`).

---

## What happened

1. This session was invoked as a **scoped overnight TRIAGE cron** ("OVERNIGHT TRIAGE
   RUN … DO NOT push commits … Exit clean"). It completed steps 3-5 (both triage queues
   absent → heartbeat-only): ran `regen-all.ps1` (PASS, round-trip green), refreshed
   wellness, wrote the journal, committed locally via strict pathspec (`a1f48302`). All
   correct. Nothing pushed. Full record in `2026-06-15-overnight-run.md`.
2. On turn-end, the **marathon Stop hook** (`.claude/hooks/stop-continue.sh`, active
   because `.claude/state/loops/CONTINUE` is present) blocked the stop and directed this
   session to execute the open PL backlog end-to-end (incl. `push main` + hosting deploy).
3. A **second, concurrent Claude instance is actively executing the marathon** — proven
   by direct evidence, not assumption:
   - `CONTINUE` file contents: **"autonomous store revamp 2026-06-15T01:57:10Z"** — a
     live autonomous marathon distinct from this triage cron, running ~2h15m.
   - Substantive feature commits interleaved with this session's, in real time:
     `066b197d` 00:04 *feat(themes): PL7b*, `5eec1d34` 23:48 *fix(shop): PL6*,
     `c70cc071` 23:48 *feat(shop): PL7*, and — critically — **`5ab619ca` 00:12:05
     *feat(shop): PL5*, ~1 minute before detection**. This session's own
     `a1f48302` (00:09:54) is sandwiched between the other instance's commits.
   - The working tree **grew during this session's ~9s regen run**: `src/pages/caddynotes.js`
     appeared as modified mid-run (it was not dirty pre-regen) — live editing, not stale state.
   - `.claude/state/loops/.cb-state` = `5ab619ca` / `0`, updated 00:12:19 (~45s before
     detection) by the other instance's Stop-hook circuit breaker.

**Conclusion:** the live "autonomous store revamp" instance owns the marathon and is
productively shipping the PL series. This triage cron overlapped it — the exact hazard
`HIBERNATION_CRON.md` § "Known limitation" warns about, and a recurrence of the
2026-06-13 incident.

## Why this session STOOD DOWN (did not build / push)

Two concurrent agents on one repo is dangerous specifically at the **production push**
and via **shared org quota**:
- Both would edit the same surfaces (shop/themes/rings) → merge churn.
- Both would race `git push origin main` → the `parbaughs-ship-cycle` skill documents
  this verbatim: a non-FF cherry-pick `-X theirs` once "silently resolved AGAINST a
  feature commit … producing a pushed main without the feature." A two-agent push race
  is the live version of that.
- Building PL1/PL3/PL4 here would also require `push main` + hosting deploy, which
  **directly violates this cron's originating "DO NOT push" instruction.**
- A force-continued second instance also drains **shared org quota**, which could
  rate-limit the productive live session.

**Production integrity outranks marathon continuity** (per the 06-13 precedent, which the
Founder accepted and re-armed from). The correct move was to yield:
- NO edits to any feature file. NO `git push`. NO edit to `BACKLOG.md` (the live
  instance owns those `[x]` writes).
- Drop `STOP` — the agent-sanctioned halt control — to end this redundant, hazardous
  loop cleanly.

## KEY DIFFERENCE from the 2026-06-13 incident — read this before re-arming

On 06-13 the backlog was **exhausted** (one item, already built), so dropping STOP cost
nothing. **Tonight it is NOT exhausted** — the live store-revamp marathon was actively
shipping the PL series (PL5/PL6/PL7/PL7b in the ~25 min before detection) with 9 open
backlog items remaining. Dropping STOP therefore **halts productive overnight work** at
the live session's next turn-end.

Why drop STOP anyway, despite that cost:
- The global Stop hook has **no per-session exit**. The only hook-satisfying exits are
  global (`STOP`, remove `CONTINUE`, or empty `BACKLOG`).
- The circuit breaker (allow-stop after 30 stalled turns) **cannot be relied on** here:
  it resets every time HEAD advances, and the live session commits every few minutes, so
  this cron would otherwise spin indefinitely — draining shared quota and risking
  rate-limiting the very session it's trying to protect.
- `STOP` is **additive, clearly a halt signal, and fully reversible** — it preserves the
  live session's `CONTINUE` intent marker (unlike removing CONTINUE). Re-arm = one `rm`.

The trade-off (lose some overnight store-revamp progress vs. a guaranteed clean,
race-free, reversible halt) is surfaced explicitly so the Founder can **re-arm
immediately** to recover, or change the two-driver policy if they disagree.

## State at containment

- **This session's own work:** triage heartbeat committed (`a1f48302`, strict pathspec);
  app-health A- 86.1 (down from 87.1, root-caused to the live session keeping the tree
  dirty → cron watcher skip-dirty; see `2026-06-15-overnight-run.md`); both triage
  queues absent; **nothing pushed.**
- **Live store-revamp instance's work:** PL5/PL6/PL7/PL7b committed locally (e.g.
  `5ab619ca` v… shop markers on felt). Whether those are pushed to staging/prod +
  V1-verified is owned by that instance — NOT verified here (pushing to check would race).
- **Working tree at containment:** the live session's in-progress edits + routine
  `.cb-state` / telemetry-aggregate churn. None of it touched by this session.
- This session is **past the F1a 5-op budget** (regen / engineer.json / critic.json /
  journal / commit = 5); the incident note + STOP write are the stand-down/exit sequence,
  not new productive work.

## Founder resolution

1. **Confirm a single driver.** Decide which marathon driver you want and ensure only one
   is live (check for a stray `ralph-loop.ps1` Scheduled Task, a second Claude Code
   window, or a duplicate hibernation cron via `CronList`). Two against one repo will
   keep racing prod pushes + sharing quota.
2. **Re-arm the store-revamp marathon if desired:** `rm .claude/state/loops/STOP`
   (the `CONTINUE` "autonomous store revamp" marker is intact). With one confirmed
   driver this resumes the PL series immediately — re-arm soon to minimize lost progress.
3. **Verify the live PL ships.** Confirm PL5/PL6/PL7/PL7b reached staging/prod + the shop
   surfaces render correctly on a real device (this session did not push or verify them).
4. **Structural fix (recurring hazard):** this is the 2nd occurrence. Consider gating the
   overnight-triage cron so it does NOT trip the marathon Stop hook (e.g. the cron writes
   STOP on entry and removes it on a clean solo-exit, or the Stop hook learns to ignore
   the triage-cron session) so a scoped cron and a live marathon never collide again.

---

*Authored by the overnight-triage-cron session as a stand-down/coordination record. No
feature files, no `BACKLOG.md`, and no remote were touched — collision avoidance was the
whole point. Re-arm with `rm .claude/state/loops/STOP`.*
