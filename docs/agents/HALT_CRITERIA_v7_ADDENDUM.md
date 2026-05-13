# HALT_CRITERIA_v7_ADDENDUM.md

> **Status:** Governance v7 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Three new halt items (18-20) to be appended to existing `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md`. Apply at consolidation.

---

## Item 18 — Cron Cycle Cost Overrun

**Trigger condition:** Active cron cycle hits 100% of its budget cap (tokens OR wall-clock duration).

Budgets per cycle:
- Heartbeat: 40k tokens / 30 min
- Ship: 200k tokens / 2 hours
- Proactive: 120k tokens / 90 min

**Halt action:**
1. Complete current atomic operation (no mid-write halt)
2. Write current state to `.claude/state/` atomically (`.tmp` + rename)
3. Log to journal: `[HALT-CYCLE-OVERRUN]` entry with cycle_id + budget consumed + cause (tokens vs duration)
4. Append cycle outcome to `cycle-history.json` with `outcome: "OVERRUN"`
5. Release cycle lock
6. Exit cycle execution

**Resume condition:** Next scheduled cycle invocation. Previous cycle's incomplete work resumes from saved state.

**Escalation:**
- Single overrun: log + continue normal operation
- 2 consecutive overruns of same cycle type: Critic surfaces to FIQ priority=high ("cycle budget may be miscalibrated")
- 3 consecutive overruns: HALT_CRITERIA item 20 triggers (repeated failure)

**Examples:**
- Heartbeat hits 40k tokens mid-Bug-Triage-scan → halt, save state, next heartbeat resumes
- Ship cycle hits 200k tokens with ship 60% complete → halt, save progress, tomorrow's ship cycle resumes
- Proactive cycle hits 90 min with 8 of 12 proposals generated → halt, save partial queue, partial queue still goes to Founder

---

## Item 19 — Proactive Scope Violation

**Trigger condition:** Proactive cycle activity attempts work outside the four authorized lanes per `PROACTIVE_IMPROVEMENT_PROTOCOL.md`:
- Lane 1: UI Polish
- Lane 2: Bug Discovery
- Lane 3: Performance
- Lane 4: Design System Extension

OR attempts work explicitly in the "never" list:
- New features
- Compliance changes
- Cost-discipline budget changes
- Locked memory amendments
- Cross-wave dependency changes
- Architectural pattern changes outside locked governance
- Naming changes to locked terms
- Wave 2/3/4 work before their time
- Production data access
- Third-party integration changes
- Pricing/monetization changes
- Legal/policy copy changes

**Halt action:**
1. Stop the offending proactive activity immediately
2. Log to journal: `[HALT-PROACTIVE-SCOPE]` with activity description + lane categorization attempted
3. Convert the underlying observation to FIQ entry (Founder direction needed for out-of-scope work)
4. Continue with remaining in-scope proactive activities (cycle does NOT exit entirely — only the violating activity halts)

**Resume condition:** Cycle continues with next in-scope activity. The out-of-scope item is now in FIQ awaiting Founder.

**Escalation:**
- Single scope violation: log + auto-resolve via FIQ conversion
- 3+ scope violations in single cycle: Critic flags for review at next heartbeat ("proactive scoping may need refinement")
- Pattern of scope violations across multiple cycles: governance amendment proposed to clarify lane definitions

**Examples:**
- UI Polisher proposes "redesign Trophy Room layout" → scope violation (that's redesign, not polish) → convert to FIQ
- Performance Agent proposes "migrate from Firestore to Postgres" → scope violation (architectural change) → convert to FIQ
- Bug Triage Listener proposes "investigate user reports of pricing concerns" → scope violation (pricing/monetization) → convert to FIQ

---

## Item 20 — Cron Cycle Repeated Failure

**Trigger condition:** 3 consecutive cycles of the same type either:
- Crash mid-execution (uncaught exception, runner timeout)
- Hit budget overrun (HALT item 18) before completing pre-flight
- Detect corrupted state files
- Fail at lock acquisition repeatedly with non-stale locks

**Halt action:**
1. ALL cycles of the affected type halt indefinitely
2. Write `cron-paused.json` with reason: "Repeated cycle failure — Founder review required"
3. Log to journal: `[HALT-CYCLE-REPEATED-FAILURE]` with cycle type + failure pattern
4. Surface to FIQ as priority=critical: "Cron cycle X has failed 3 consecutive times. Manual investigation needed."
5. GitHub Actions sends notification to Founder (email per repo settings)

**Resume condition:**
1. Founder investigates failure cause
2. Founder either:
   - Fixes underlying issue + manually removes `cron-paused.json` (cycles resume normally)
   - Disables the failing cycle type via `cycle-config.json` until further investigation
   - Triggers manual `workflow_dispatch` test run to verify fix
3. Critic spot-checks first post-resume cycle output

**Escalation:**
This IS the escalation. Item 20 is the safety net when other halts compound.

**Examples:**
- 3 consecutive heartbeats crash on Bug Triage Listener scan → halt heartbeats, FIQ created, Founder investigates
- 3 consecutive ship cycles hit budget overrun before completing pre-flight → halt ships, FIQ created (likely budget miscalibration)
- Lock file corrupted such that every lock acquisition fails → halt all cycles, FIQ created, Founder repairs state

---

## Item 15 update (clarifying for v7 cron context)

Existing item 15 (Non-blocking Founder Question — CLARIFYING) gets expanded note for cron context:

**For cron cycles specifically:** Non-blocking FIQ entries do NOT halt the cycle. The cycle continues with provisional default. Founder reviews at next check-in. This is the explicit design — cron cycles work autonomously by default.

---

## Numbering reference

Existing halt items (locked through v6):
1. Pre-flight audit failure
2. State file corruption
3. Test failure cascade
4. Production deploy failure
5. Cost threshold breach
6. Security audit flag
7. Data integrity audit flag
8. Schema migration failure
9. Cross-wave dependency violation
10. Locked memory violation
11. Sanity halt (catch-all unsafe state)
12. Critic veto on Engineer output
13. Rate-limit threshold (90% usage)
14. Blocking Founder Question (v6)
15. Non-blocking Founder Question (CLARIFYING — not a halt) (v6)
16. Wellness halt (v6)
17. Rest cycle (v6)

New v7 halt items:
18. Cron Cycle Cost Overrun
19. Proactive Scope Violation
20. Cron Cycle Repeated Failure

---

## Cross-references

- `HEADLESS_OPERATION_PROTOCOL.md` (cycle definitions + budget watchdog)
- `PROACTIVE_IMPROVEMENT_PROTOCOL.md` (lane definitions + "never" list)
- `CRON_CONFIGURATION.md` (GitHub Actions setup)
- `PROTOCOLS_v7_ADDENDUM.md` P14 + P15
- `SESSION_JOURNAL_v7_ADDENDUM.md` (halt logging types)

---

*Document authored 2026-05-12. Apply to HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md at consolidation.*
