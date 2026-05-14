---
id: AMD-014
title: PAUSE_DISCIPLINE section 2.1 reactivation - meter-gated rate-limit threshold
target_canonical_path: docs/agents/PAUSE_DISCIPLINE_v8.2_ADDENDUM.md
source_draft_path: .claude/state/amendments/pending/AMD-014-pause-discipline-reactivation.md
scope_summary: Amends section 2.1 of PAUSE_DISCIPLINE_v8.2 to reactivate the percentage-based rate-limit threshold WHEN quota-status.json from PROP-003.a is fresh (<6h old). When stale or absent, the section stays in its current dormant state (op-count-only). Bridges meter-wired vs meter-unwired states honestly.
type: edit-section
section_anchor: "Section 2.1 - Rate-limit threshold (REPLACED)"
depends_on: [PROP-003.a]
authored_by: claude-code (orchestration team)
authored_at: 2026-05-14T04:50:00Z
bubble_of_record: db-2026-05-13-003
estimate_tokens_to_apply: 2500
rollback_strategy: git revert; section 2.1 returns to its current dormant text. PROP-003.a's quota-status.json continues being written (sidecar untouched).
status: pending
operating_status: ADVISORY until applied. Once applied + PROP-003.a shipped, when quota-status.json is fresh, agents pause at 90% real-quota threshold; when stale or absent, current dormant behavior continues.
split_lineage: Founder Option A 2026-05-14 - PROP-003 split into PROP-003.a + AMD-014 + PROP-003.b. This amendment is the governance piece.
---

# AMD-014 — PAUSE_DISCIPLINE section 2.1 reactivation

Per Founder Option A 2026-05-14 (PROP-003 split). Reactivates the
percentage-based rate-limit threshold conditionally on quota-status.json
freshness.

## Section 2.1 — Rate-limit threshold (RE-REACTIVATED with meter gate)

When `.claude/state/quota-status.json` from PROP-003.a is FRESH
(`stale_seconds` < 21600 = 6 hours):

The agent pauses at **90% of the weekly_pct OR org_monthly_pct**, whichever
is higher. Emits `cycle.paused` with `reason="rate-limit-90pct-real"` and
the snapshot `as_of` timestamp.

When `.claude/state/quota-status.json` is STALE or ABSENT:

Section 2.1 remains in its current dormant state. Op-count-checkpoint and
manual-quota-paste paths continue as the only triggers. NO automatic
percentage pause fires.

### Why the conditional gate

The rate-limit pause at 90% is only honest when the percentage reflects
real consumption. Pre-PROP-003.a, the meter was operator-asserted estimates;
firing a 90% pause on an estimate is false-confidence (AMD-001 lineage).
Post-PROP-003.a, the meter is real if fresh; stale data should not trigger
the pause (operator may have rebooted the sidecar, may be offline, etc.).

The 6-hour staleness threshold gives the cron multiple poll cycles (default
5min) to recover from transient failures while keeping the pause-trigger
data fresh enough to be meaningful.

### Telemetry change

`cycle.paused` event reason enum gains `rate-limit-90pct-real`. Old
`reason="rate-limit-90pct-manual"` events stay valid as historical.

### Round-trip extension

`tests/round-trip-test.py` `[pause-discipline]` block gains a freshness
check: when quota-status.json present, validates the meter-gate logic
description appears in the amended section 2.1 prose.

## Cross-references

- Companion ship: PROP-003.a (the data producer)
- Companion ship: PROP-003.b (dashboard + telemetry consumers)
- Original PROP-003 (split-archived): `.claude/state/proposals/split-archived/PROP-003-original.md`
- AMD-001 PAUSE_DISCIPLINE v8.2 (the deactivation amendment this reactivates)
