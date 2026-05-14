
# PAUSE_DISCIPLINE v8.2 — Remove fictional 3.5M weekly cap

This draft amends the v8.1 ADDENDUM to remove the fictional 3.5M weekly
token cap as a pause trigger. Founder applies via:

```
git mv .claude/state/wave-zero-dry-run/remediation/proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md \
       docs/agents/PAUSE_DISCIPLINE_v8.2_ADDENDUM.md
```

## What changed


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
### Section 4 — HALT item 24 (REPHRASED)

**v8.1 (REMOVE):**
> ## 4 — New halt: item 24 — Pause auto-resume failure
> **Trigger:** A previously-paused cycle does not auto-resume within 1 hour
> after its `resume_after` timestamp passes.

**v8.2 (DORMANT NOTE):**
> ## 4 — HALT item 24 — Pause auto-resume failure (DORMANT)
>
> **Status:** Dormant. Item 24's trigger condition depended on a
> rate-limit pause having fired against a real quota threshold. With
> v8.2's op-count default, agents never sit waiting for a quota reset —
> the resume_after timestamp is always `now + 60s`. Item 24 cannot fire.
>
> **Reactivation:** When PROP-003 (token-meter-wiring-sidecar) ships and
> writes real quota data to `.claude/state/sidecar/quota-status.json`,
> the rate-limit pause path becomes load-bearing again; item 24 returns
> to active duty against the real quota's reset boundary.

## Migration notes

- `last-verify.json` schema unchanged. `reason` enum extended to include
  `op-count-checkpoint` and `rate-limit-90pct-manual`.
- `cycle.paused` event schema unchanged. New `reason` values added to
  the enum. Old `reason="rate-limit-90pct"` events stay valid as historical
  telemetry.
- No code change required in cron scripts beyond op-count counter
  initialization + the manual-quota probe. Comments added to
  `scripts/cron/overnight-triage.ps1` document the new heuristic.

## Round-trip test addition

`tests/round-trip-test.py` adds a `[pause-discipline]` block that fails
the test on any reference to `3.5M`, `3500000`, `weekly_budget_cap`,
or `budget_pct` in:
- `docs/reports/`
- `scripts/`

Exceptions: this audit doc, this remediation directory, historical
proposals under `.claude/state/proposals/`, and the
`refresh-quota-manual.ps1` placeholder caps (which serve a different
purpose: % → token conversion at paste time, not pause-trigger).

## Dependency tracking

This amendment STAYS IN EFFECT until PROP-003 ships AND its
sidecar writes verified real-quota data continuously. At that point a
follow-up amendment (`v8.3` or later) reactivates the percentage-based
trigger against REAL numbers.
