# PAUSE_DISCIPLINE_v8.1_ADDENDUM.md

> **Status:** Governance v8.1.2 addition. Ratified 2026-05-13.
> **Purpose:** Distinguish PAUSE (autonomous, time-bounded, auto-resumes) from HALT (emergency stop, Founder intervention required). Locks the rate-limit discipline so agents never wait for Founder restart on a rate-limit boundary.

---

## 1 — Why this exists

"Halt" and "pause" have been conflated across v4–v8 governance docs. They are semantically distinct flow-control mechanisms:

| | PAUSE | HALT |
|---|---|---|
| Trigger | Predictable boundary (rate limit, wellness, nightly) | Unexpected failure (corruption, audit fail, security flag) |
| Resume | Autonomous, on next cron after reset condition met | Manual, Founder must investigate + clear |
| Atomic-op rule | Complete current write/commit, do not start new | Stop immediately (after any safe-state guarantees) |
| State file | `.claude/state/last-verify.json` | `.claude/state/cron-paused.json` |
| Cron behavior | Cron continues firing; fires no-op until reset | Cron continues firing; fires no-op until Founder clears |
| Founder action | None — agents auto-resume | Required — Founder reads halt report, clears, re-enables |
| Journal entry | `[PAUSE-<reason>]` then `[RESUME-<reason>]` | `[HALT-<reason>]` then `[RESUME-FROM-HALT-<reason>]` |

**Critical invariant:** A PAUSE that requires Founder restart is a bug. If the orchestration team finds itself unable to auto-resume from a rate-limit boundary, that is a halt criterion (item 24, new — see below), not the rate-limit pause itself.

---

## 2 — Pause conditions

### 2.1 — Rate-limit threshold (90% usage)

**Trigger:** Token budget or request quota hits 90% of the rolling window (hourly / daily / weekly per the active quota type).

**Atomic-op rule:**
- Complete the currently in-flight file write
- Complete the currently in-flight git commit
- Do NOT start a new file write, tool call, or commit

**Pause sequence:**

```
1. Detect 90% threshold (telemetry: cycle.budget.checkpoint event)
2. Finish current atomic operation (≤ 1 file write or 1 commit)
3. Write .claude/state/last-verify.json:
   {
     "paused_at": "<ISO-8601 UTC>",
     "reason": "rate-limit-90pct",
     "quota_type": "weekly-tokens" | "daily-tokens" | "hourly-requests",
     "usage_pct": 0.91,
     "resume_after": "<ISO-8601 UTC, when quota resets>",
     "cycle_id": "<current cycle>",
     "ship_id": "<current ship>",
     "last_atomic_unit_completed": "<file path or commit sha>",
     "next_atomic_unit": "<what to do on resume>",
     "context_required": ["<repo paths needed for resume>"]
   }
4. Journal: [PAUSE-RATE-LIMIT] usage=91% quota=weekly-tokens resume_after=<ts>
5. Telemetry: cycle.paused (reason=rate-limit-90pct, resume_after=<ts>)
6. Exit cleanly (return 0)
```

**Resume sequence (next cron fire after `resume_after`):**

```
1. Cron fires per schedule
2. Read .claude/state/last-verify.json
3. If state file present + current_time >= resume_after:
   a. Journal: [RESUME-RATE-LIMIT] paused_for=<duration> usage_now=<pct>
   b. Telemetry: cycle.resumed (reason=rate-limit-90pct, pause_duration_seconds=<N>)
   c. Read next_atomic_unit + context_required, hydrate state
   d. Continue work from last_atomic_unit_completed boundary
   e. Delete .claude/state/last-verify.json on first successful new atomic operation
4. If state file present + current_time < resume_after:
   a. Exit immediately (no telemetry, no journal — don't burn tokens checking)
5. If no state file present: normal cycle
```

**Quota reset windows (locked):**
- Weekly tokens (3.5M cap): resets Sunday 00:00 UTC
- Daily tokens (per heartbeat budget): resets at start of next UTC day
- Hourly requests (proactive cycle): resets at top of next UTC hour
- Each window has its own state file entry; multiple windows can be paused independently

### 2.2 — Wellness rest cycle (item 17 of HALT_CRITERIA)

Documented separately in AGENT_WELLBEING_PROTOCOL.md. Mechanics are a PAUSE not a HALT: agent finishes current atomic operation, writes wellness rest reason to `last-verify.json` with `resume_after = pause + min_rest_duration`, next cron after resumes.

Item 17 should also be cross-referenced in HALT_CRITERIA as a PAUSE not a HALT. Numbering preserved for backward compatibility.

### 2.3 — Nightly heartbeat boundary

The 4hr/40k heartbeat (P14) is a built-in pause: cycle work completes through atomic boundary, end-of-day reports generate, then sleep until next heartbeat. Not a state-file-driven pause — heartbeat IS the cycle.

---

## 3 — What is NOT a pause (and why)

| Condition | Mechanism | Why not a pause |
|---|---|---|
| Critic veto on Engineer output (item 12) | HALT | Output failed quality bar; needs Founder or rework, not time |
| Pre-flight audit failure (item 1) | HALT | Spec/design issue; agent cannot proceed safely without reconciliation |
| State file corruption (item 2) | HALT | Data integrity; auto-resume on corrupt state propagates corruption |
| Security audit flag (item 6) | HALT | Cannot proceed without Founder review of finding |
| Sanity halt (item 11) | HALT | Cycle has detected its own reasoning is unsafe |
| Rate-limit threshold (item 13) | **PAUSE** | Predictable resource boundary; agents resume autonomously |
| Wellness rest cycle (item 17) | **PAUSE** | Scheduled recovery boundary; agents resume autonomously |

The mistake to avoid: treating a rate-limit threshold as a halt. Founder explicitly does NOT want to restart the system every Sunday when the weekly cap resets. The agent must auto-resume.

---

## 4 — New halt: item 24 — Pause auto-resume failure

**Trigger:** A previously-paused cycle does not auto-resume within 1 hour after its `resume_after` timestamp passes.

**Why it's a halt (not a pause):** if the auto-resume machinery itself is broken, agents would loop in pause indefinitely. Founder must investigate the resume failure.

**Detection:** monitoring cron fire reads `last-verify.json`, computes `now - resume_after`. If > 3600 seconds and `last-verify.json` still present, fire halt 24.

**Resolution path:**
1. Read pause state, identify why resume didn't fire (cron not firing? state file unreadable? next_atomic_unit malformed?)
2. Manually trigger resume; verify it lands cleanly
3. Patch the resume mechanism if a real bug

**Recovery deadline:** 4 hours. Beyond that, manually flush state and restart the affected cycle.

---

## 5 — State file schema reference

`.claude/state/last-verify.json` (single-writer, atomic via temp-rename):

```json
{
  "paused_at": "2026-05-18T14:30:00Z",
  "reason": "rate-limit-90pct" | "wellness-rest" | "heartbeat-boundary",
  "quota_type": "weekly-tokens" | "daily-tokens" | "hourly-requests" | null,
  "usage_pct": 0.91,
  "resume_after": "2026-05-25T00:00:00Z",
  "cycle_id": "ship-cycle-042",
  "ship_id": "W1.S3",
  "last_atomic_unit_completed": "src/pages/playnow.js write OR commit:abc1234",
  "next_atomic_unit": "Write src/pages/scorecard.js section per W1.S3 Vision §3.2",
  "context_required": ["src/pages/playnow.js", "docs/ship-visions/W1.S3.md"],
  "schema_version": 1
}
```

Write atomically: stage to `last-verify.json.tmp`, rename to `last-verify.json`. Concurrent readers see either the old file or the new one, never a partial.

Delete on first successful resumed atomic operation (not on resume detection — only after the resume actually does work). Prevents resume loops on a still-throttled API.

---

## 6 — Telemetry coverage

New event types (extend TELEMETRY_PROTOCOL.md):

```json
{
  "event_type": "cycle.paused",
  "data": {
    "reason": "rate-limit-90pct" | "wellness-rest" | "heartbeat-boundary",
    "quota_type": "weekly-tokens" | null,
    "usage_pct": 0.91,
    "resume_after": "<ISO-8601 UTC>",
    "cycle_id": "<id>"
  }
}

{
  "event_type": "cycle.resumed",
  "data": {
    "reason": "rate-limit-90pct" | "wellness-rest" | "heartbeat-boundary",
    "pause_duration_seconds": 86400,
    "cycle_id": "<id>",
    "usage_pct_at_resume": 0.05
  }
}
```

Aggregated weekly: total paused-time, pause count by reason, longest single pause. Surfaced on `dashboard.html` if pause-time exceeds 10% of clock time (signal of under-provisioned quota).

---

## 7 — What the orchestration team must remember

1. **90% threshold = PAUSE, never HALT.** Finish current atomic op, write state, exit clean. Don't wait for Founder.
2. **Resume is automatic on next cron after `resume_after`.** If it doesn't happen within 1 hour, that's halt 24 — but the rate-limit pause itself never blocks Founder.
3. **State file is the source of truth for resume.** Don't try to reconstruct from journal — read the JSON.
4. **One atomic operation in flight at any time.** Pause boundary is between operations, not mid-operation. A half-written file or half-applied commit is a state-corruption bug, not a pause.
5. **Pause + halt can coexist.** If a halt fires while paused, the halt takes precedence. Founder clears halt → resume reads `last-verify.json` → continues.

---

## 8 — Cross-references

- HALT_CRITERIA.md item 13 (Rate-limit threshold) — **functionally a PAUSE; documented here**
- HALT_CRITERIA.md item 17 (Wellness rest cycle) — **functionally a PAUSE; documented here**
- HALT_CRITERIA_v8.1_ADDENDUM.md item 24 (Pause auto-resume failure) — **true HALT**
- HEADLESS_OPERATION_PROTOCOL.md P14 (heartbeat 4hr/40k cadence)
- AGENT_WELLBEING_PROTOCOL.md P13 (wellness rest mechanics)
- TELEMETRY_PROTOCOL.md (extended with cycle.paused / cycle.resumed events)
- HANDOFF_NOTE_TEMPLATES.md (pause reason field separated from halt reason)
- WAVE_ZERO_DRY_RUN validation 5 (pause-and-resume dry-run)
