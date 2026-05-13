# Proposed HALT 25 — Pause Meter Unavailable

> **Status:** Draft authored 2026-05-13 by the orchestration team for Founder ratification.
> **Apply path:** When Founder ratifies, this moves to `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` as a new item 25 (Founder applies; governance hook blocks orchestration-team writes to `docs/agents/`).
> **Bubble of record:** `db-2026-05-13-003` (approved-with-dissent, 2-1-1).
> **Critic's binding rider satisfied:** HALT 25 × HALT 24 interaction documented in § 4 below.

---

## 1 — Trigger

HALT 25 fires when an agent cannot confirm its own usage state before crossing a discipline boundary that the meter is supposed to gate. Specifically:

- Agent is about to perform an atomic operation
- PAUSE_DISCIPLINE § 2.1 says: "check meter at every operation boundary"
- Agent cannot read `.claude/state/usage-snapshot.json` (sidecar absent or stale > 60s)
- AND the per-session defensive heuristic (agent-feel pacing with N=5 / M=10 guideposts) suggests near-cap proximity
- AND the org-monthly cap is at unknown state

The first three are necessary; the fourth is sufficient to fire HALT 25 even when the first three look clean. **In the absence of meter data, treat unknown == near-cap.** Over-pause beats under-pause.

## 2 — Why this is a HALT, not a PAUSE

PAUSE expects predictable boundaries (rate-limit-90pct, wellness-rest, heartbeat). HALT 25 fires when the agent doesn't know WHICH boundary it's near. That's not a predictable resource event — it's an integrity gap in the discipline itself. Auto-resume on the next cron without a working meter would be the same bug all over again.

HALT 25 → Founder reviews → confirms or restores meter → clears via standard halt-clearance flow.

## 3 — State written at fire

`.claude/state/halts/halt-25-meter-unavailable-<ISO-8601>.json`:

```json
{
  "halt_id": 25,
  "halt_name": "pause-meter-unavailable",
  "fired_at": "<ISO-8601>",
  "agent": "<agent-id>",
  "cycle_id": "<cycle-id>",
  "ship_id": "<ship-id or null>",
  "last_atomic_unit_completed": "<file or commit>",
  "next_atomic_unit_attempted": "<what was about to happen>",
  "meter_status": {
    "sidecar_present": false,
    "sidecar_last_write": null,
    "agent_feel": "near-cap" | "fine" | "unknown",
    "ops_since_last_pause_check": <int>,
    "minutes_since_last_pause_check": <float>
  },
  "resolution_required": "Founder verifies meter status (sidecar running OR billing dashboard) and clears halt by deleting this file."
}
```

## 4 — Interaction with HALT 24 (auto-resume failure)

HALT 24 fires when a previously-paused cycle does not auto-resume within 1 hour of `resume_after`. HALT 25 can fire on the resume cycle if the meter is still unavailable.

**Interaction rule:** If both halts can fire, HALT 25 takes precedence — the agent must NOT auto-resume into a meter-unavailable state. Specifically:

1. Resume cycle fires.
2. Resume cycle reads `last-verify.json`.
3. Resume cycle checks meter status BEFORE proceeding with the next atomic operation.
4. If meter unavailable: HALT 25 fires, supersedes the resume. The pause cycle remains paused; HALT 25's halt-file is created; HALT 24's 1-hour timer continues but is now subordinate.
5. Founder resolution clears HALT 25 first; that allows the resume to proceed; HALT 24's timer may or may not have elapsed (Founder judges; HALT 24 clearance is auto-handled when the meter is restored AND the resume completes).

**Why HALT 25 supersedes HALT 24:** HALT 24 is a flow-control halt (something didn't happen on time). HALT 25 is an integrity halt (we don't know what state we're in). Integrity halts always win over flow-control halts.

## 5 — Recovery semantics

Founder clears HALT 25 by:

1. Verify meter is now reading (run `scripts/cron/usage-snapshot.ps1` once OR check the billing dashboard manually OR start the sidecar process per PROP-003).
2. Delete the halt-25 state file.
3. (If HALT 24 was deferred under HALT 25, re-evaluate after clearance.)
4. Next cron fire proceeds.

If meter cannot be restored (e.g., billing dashboard down, sidecar broken), Founder may TEMPORARILY clear HALT 25 with a `force-clear: true` flag in the deletion artifact, accepting the risk that the next cycle operates blind. This is a Founder-only escape hatch — not for agents.

## 6 — Sunset condition

HALT 25 retires when:
1. PROP-003 (token-meter-wiring-sidecar) ships AND
2. Sidecar runs reliably for 7 consecutive days without an out-of-band quota event AND
3. Founder ratifies sunset via discussion bubble

Until then, HALT 25 is permanent.

## 7 — Cross-references

- PAUSE_DISCIPLINE_v8.1_ADDENDUM.md § 2.1 (90% pause trigger — the discipline HALT 25 protects)
- HALT_CRITERIA_v8.1_ADDENDUM.md item 24 (auto-resume failure — the cousin halt; § 4 above documents interaction)
- F1a-token-meter-gap-diagnostic.md (evidence of the gap this halt closes)
- PROP-003 (token-meter-wiring-sidecar — heuristic-sunset path)
- F5 metric-integrity protocol (HALT 25 is the integrity guardrail for the metric "tokens consumed")

---

*Draft authored 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass F1. Awaiting Founder review + ratification + move to `docs/agents/HALT_CRITERIA_v8.1_ADDENDUM.md` as item 25.*
