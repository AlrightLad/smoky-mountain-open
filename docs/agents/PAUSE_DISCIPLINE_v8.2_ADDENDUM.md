
# PAUSE_DISCIPLINE v8.2 — Remove fictional 3.5M weekly cap

This draft amends the v8.1 ADDENDUM to remove the fictional 3.5M weekly
token cap as a pause trigger. Founder applies via:

```
git mv .claude/state/wave-zero-dry-run/remediation/proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md \
       docs/agents/PAUSE_DISCIPLINE_v8.2_ADDENDUM.md
```

## What changed

### Section 2.1 — Rate-limit threshold (REPLACED)

**v8.1 (REMOVE):**
> **Trigger:** Token budget or request quota hits 90% of the rolling window
> (hourly / daily / weekly per the active quota type).
>
> 1. Detect 90% threshold (telemetry: cycle.budget.checkpoint event)
> ...

This relied on `weekly_tokens_cap: 3500000` as the denominator. The 3.5M was a v8.1 placeholder, not a real Anthropic-quota number. Agents pausing on a fictional denominator is worse than not pausing — false confidence.

**v8.2 (NEW):**
> **Trigger (op-count, default):** Every 5 atomic operations within a cycle.
> An atomic operation is one of: file write, commit, sub-agent dispatch,
> external-system call (e.g., Slack, GitHub API). Cycle counts ops across
> all internal sub-steps.
>
> **Trigger (real-quota, when available):** When `.claude/state/telemetry/
> manual-quota-log.ndjson` contains a Founder-paste entry less than 24 hours
> old, the most recent entry's `weekly-all` percentage is consulted. If
> >= 90%, pause regardless of op count.
>
> **No fictional cap is consulted.** A telemetry event's
> `weekly_tokens_consumed` field is recorded for visibility, NEVER divided
> by a hardcoded denominator to derive `usage_pct`.

#### Op-count atomic-op rule

1. Increment `ops_in_cycle` counter on each atomic op completion.
2. When `ops_in_cycle >= 5`:
   - Finish current atomic operation (≤ 1 file write or 1 commit).
   - Write `.claude/state/last-verify.json`:
     ```
     {
       "reason": "op-count-checkpoint",
       "ops_in_cycle": 5,
       "resume_after": "<ISO-8601 UTC, current time + 60s>",
       "checkpoint_state": { ... cycle-specific state ... }
     }
     ```
   - Telemetry: `cycle.paused` event with `reason="op-count-checkpoint"`.
   - Exit cleanly (return 0).
3. Next scheduled fire resumes from the checkpoint, reading `last-verify.json`.

#### Real-quota check (manual-quota path)

When `manual-quota-log.ndjson` has a fresh entry (`anchored_at` within 24h):

1. Read most recent `weekly-all` entry's percentage.
2. If pct >= 90, override op-count rule and pause immediately with:
   ```
   {
     "reason": "rate-limit-90pct-manual",
     "manual_pct": 0.93,
     "anchored_at": "<paste timestamp>",
     "resume_after": "<next Friday 23:00 UTC>"
   }
   ```
3. Telemetry: `cycle.paused` event with `reason="rate-limit-90pct-manual"`.

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
