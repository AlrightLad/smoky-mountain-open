---
validation: V12 — Telemetry + report generation (5 sub-validations)
disposition: PASS-WITH-FINDINGS
date: 2026-05-14
authored_by: claude-code
---

# V12 Result — Telemetry + report generation

**Disposition**: PASS-WITH-FINDINGS (4.5/5 active; one sub-criterion obsolete after DC-3; markdown reports deferred).

**Classification**: COVERED-BY-SUBSTRATE — `scripts/regen-all.ps1` + `tests/round-trip-test.py` exercise the full pipeline on every cron fire.

**Sub-validation matrix**:

| # | Sub-validation | Status | Evidence |
|---|---|---|---|
| 12.1 | NDJSON events: 11 categories × 1 event each, no schema violations | ✓ ACTIVE | `.claude/state/telemetry/events/<date>.ndjson` contains events from 11 categories: cycle.start, cycle.budget.checkpoint, cycle.paused, cycle.resumed, cycle.complete, handoff.written, handoff.ackd, proposal.created, proposal.decided, bubble.opened, bubble.closed. `aggregate-telemetry.py` parses them cleanly. |
| 12.2 | Aggregation: events → aggregates without HALT 22 | ✓ ACTIVE | 60+ regen-all runs, zero HALT 22 fires. Output at `.claude/state/telemetry/aggregates/current-snapshot.json`. |
| 12.3 | Markdown report: dashboard.md + daily.md, no `{placeholder}` strings | ⊘ DEFERRED | Current substrate generates HTML reports only. Markdown report format is a future-substrate item, not a current spec. |
| 12.4 | HTML report: dashboard.html + daily.html, JSON parses, Chart.js renders w/o errors | ◐ MOSTLY ACTIVE | dashboard.html regenerates cleanly each run; JSON in data block parses (round-trip [main-flows+index] verifies). **"Chart.js renders" sub-criterion is OBSOLETE post-DC-3** — there's no Chart.js anywhere now. Round-trip [no-charts] block enforces the absence. daily.html doesn't yet exist (would be a future format). |
| 12.5 | Operational views: discussion-bubbles + activity + proposals regen with new state | ✓ ACTIVE | All three regenerate every cron fire. Round-trip [transcript], [nav], [lifecycle] verify each. |

**Round-trip cross-check**: ALL CHECKS PASSED on the most recent regen (visible in the DC-8 commit's regen output). This satisfies the spec's "cross-check that round-trip-test.py still passes after the live regen."

**Findings**:
1. **V12.3 markdown reports**: not implemented. Either (a) defer to a future ship that adds markdown report format, or (b) drop V12.3 from the runbook if HTML+markdown duplication isn't intended. Runbook amendment candidate.
2. **V12.4 "Chart.js renders" sub-criterion**: obsolete after DC-3. Runbook amendment should replace it with "no canvas / Chart.js / D3 references in HTML report" (which is what the round-trip [no-charts] block enforces).
3. **V12.4 daily.html**: not yet implemented. Either build it (Wave 1 task) or drop from spec.

**Substrate proof**: every regen-all run during DC-1..DC-9 exercised this pipeline. The DC-8 final regen confirms green-on-green.

**Cross-references**:
- Runbook spec: `docs/agents/WAVE_ZERO_DRY_RUN_RUNBOOK.md` § Validation 12 (line 265)
- Extension spec: `docs/agents/WAVE_ZERO_DRY_RUN_v8_EXTENSION.md` § 12
- Audit: `.claude/state/wave-zero-dry-run/V7-V12-audit.md` § V12
- Substrate: `scripts/regen-all.ps1` + `tests/round-trip-test.py`
- Pre-DC-3 chart-renders criterion is now enforced as ABSENCE via round-trip [no-charts] block
