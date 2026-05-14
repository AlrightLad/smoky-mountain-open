---
doc: Token meter status (Issue 3)
date: 2026-05-14
authored_by: claude-code (orchestration team)
trigger: Founder Issue 3 — token-usage.html estimated stuck at 4.3M since backfill
discipline: AMD-009 Senior Engineering Standard
---

# Token meter status — Issue 3 diagnosis + remediation

Founder Issue 3: token-usage.html shows estimated=4.3M but the value
hasn't moved since the initial backfill. Three honest hypotheses:

- (a) Token instrumentation isn't emitting per-batch — the 4.3M was
  one-shot; no new estimates added as work progressed
- (b) Aggregator isn't picking up new events for some reason
- (c) Working as designed — until PROP-003.a real meter ships, only
  operator-asserted estimates exist

## Diagnosis (Principle 1 — evidence)

Count of `session.team-work.summary` events in today's ndjson BEFORE
this commit:

```
$ grep "session.team-work.summary" .claude/state/telemetry/events/2026-05-14.ndjson | wc -l
1
```

The single event was at `2026-05-14T03:05:28Z` (`tokens_estimated: 4200000`,
shipped in commit `8b7e117`). Between that backfill and this Issue 3
work, the team made 47 commits (`git log --oneline 8b7e117..HEAD | wc -l`).

Aggregator state pre-fresh-emit:
```
all_time: real=102000 estimated=4200130 manual=0 last_event_at=2026-05-14T05:30:56Z
orchestrator: estimated=4200130 (broken down by day: 2026-05-14=4200000, 2026-05-13=130)
```

The `last_event_at` did move (other event types continued — cron.proposal-
readiness.start/.end, ship.close.scanner-dispatched, etc.) but those
events carry `estimated_tokens: 0` because the non-Claude crons don't
invoke Claude. So the aggregator sums them in but they contribute 0.

**Verdict: option (a)** — instrumentation isn't emitting per-batch.
The 4.2M backfill was a one-shot; no per-ship emits. The aggregator
isn't broken (it would pick up new events as proven below); it's
just that the team hasn't been emitting them.

This is a subspecies of (c) honestly — until PROP-003.a's real meter
+ PROP-003.b's integration land, the team has to MANUALLY emit
session-summary events for the dashboard to reflect post-backfill
work. PROP-003.a sidecar mechanics shipped this session (commit
`9ff9883`); PROP-003.b integration is queued (ready). After .b ships,
real-meter reads replace manual emits.

## Remediation (this commit)

Emitted a fresh `session.team-work.summary` event covering
**8b7e117..HEAD** (the 47 commits since the backfill):

```
tokens_estimated: 3000000
agent: orchestrator
ship_id: substrate-build-day-3-post-backfill
methodology: 47 commits since backfill; ~12-15 substantial (PROP
triage + AMD-014 repair + Ship 1/2 + PROP-003.a ship + scan-shipped
fix + Issue 1/2 + deep diagnostic) ~150k each; ~30 small (auto-
commits, regen output, fixes) ~30k each; plus per-turn conversation
overhead. Range 2.5-4M, midpoint 3M emitted.
```

Aggregator re-run immediately picked up the new event:

```
all_time: real=102000 estimated=7200130 manual=0
orchestrator total: 7200130
```

Dashboard now reflects ~7.2M total estimated. Wiring CONFIRMED
OPERATIONAL — when a new session-summary event lands, aggregator
picks it up + dashboard updates on next regen.

## Honest scope (Principle 5/6)

This emit is an **operator-asserted estimate**, NOT a measurement.
Per the `emit-session-event.py` HONESTY DISCIPLINE docstring:
"operator-asserted values are not measurements. Treat as 'team's
best estimate' not 'measured.'"

The dashboard's `_meter_status: wired-estimated` reflects this
honestly — the estimated column populates from these emits, while
the real column (102k from earlier 'engineer' cycle events) remains
small.

## Path to real measurement (post-PROP-003.b)

PROP-003.a sidecar mechanics shipped THIS SESSION (commit `9ff9883`).
It writes `.claude/state/quota-status.json` with:
- `data_source` field (currently 'none' — Founder hasn't run
  refresh-quota-manual.ps1 OR the sidecar cron isn't installed yet)
- `weekly_pct` / `org_monthly_pct` fields
- Freshness signal (stale_seconds + _warning)

PROP-003.b (queued, READY per scanner) consumes that file + flips
`_meter_status` from `wired-estimated` to `wired-real` when the
sidecar is fresh. After PROP-003.b ships:
- Dashboard's real column will be NON-ZERO (driven by actual
  manual-paste percentages converted to tokens via the sidecar)
- Manual `emit-session-event.py` calls become FALLBACK (only when
  sidecar is stale)
- The 'stuck at 4.3M' pattern doesn't recur because real data
  refreshes every 5 minutes on the cron cadence

## Recommendation for ongoing operations

Until PROP-003.b ships:

1. **Per-ship-close**: emit a `session.team-work.summary` event in
   the regen-all chain when a ship-close commit fires the readiness
   scanner. Token cost estimate based on commits-in-the-ship and
   per-turn-overhead heuristics.
2. **Mid-session checkpoints**: emit when the team transitions
   between substantial work (e.g., at the start of a multi-commit
   diagnostic). Not required but useful for finer-grained tracking.

After PROP-003.b ships: these manual emits stop being load-bearing;
they become legacy fallback for the rare-sidecar-stale case.

## Acceptance per AMD-009 (8/8)

- [x] Scope: this commit emits ONE event + writes this findings doc
- [x] Fallback: revert via git; aggregator drops back to 4.2M
- [x] Reversible: trivially (event-line append; aggregator full-rescan)
- [x] No cross-cutting: pure telemetry emit
- [x] Round-trip green: estimated count moves; no schema break
- [x] No unshipped deps: emit-session-event.py shipped previously
- [x] Frontmatter equivalent: this doc + the emit's `note` field
- [x] Token cost methodology: enumerated above with commit count +
  weighting + range
