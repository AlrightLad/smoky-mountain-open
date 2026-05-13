# PROTOCOLS_v7_ADDENDUM.md

> **Status:** Governance v7 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Two new protocols (P14, P15) to be appended to existing `PROTOCOLS.md`. Apply at consolidation.

---

## P14 — Headless Operation Discipline

**Owner:** All orchestration agents during cron-cycle execution.

**Triggers:** Cron cycle invocation (heartbeat, ship, or proactive).

**Discipline:**

1. **Cycle lock observance** — first action of any cycle: acquire lock per `HEADLESS_OPERATION_PROTOCOL.md` § 2.1. Exit immediately if concurrent cycle detected.

2. **Pre-flight checks** — verify state file integrity, check FIQ for blocking entries, check cycle-history for repeated failures (3 consecutive crashes = HALT per item 20).

3. **Budget watchdog** — track tokens + duration. 90% threshold: complete atomic operation, skip new operations, exit gracefully. 100% threshold: HALT per item 18.

4. **Atomic state persistence** — every state write uses `.tmp` + rename pattern to prevent partial writes on crash.

5. **Cycle journal entry** — every cycle writes CYCLE-START + CYCLE-END entries to `SESSION_JOURNAL.md`. Plus internal entries for major events.

6. **Idempotency** — all activities must be safely rerunnable if interrupted. No state changes that can't be recomputed from inputs.

7. **Pause + halt respect** — every cycle wake reads `cron-paused.json` first; reads `emergency-halt.json` every minute during execution; reads `cycle-config.json` to check if cycle type is enabled.

**Violations:**
- Skipping lock acquisition (race conditions)
- Ignoring budget watchdog (token overruns)
- Non-atomic state writes (corruption on crash)
- Skipping cycle journal entries (loss of observability)
- Non-idempotent operations (data loss on retry)
- Ignoring pause/halt signals (Founder loses control)

**Verification:**
- GitHub Actions workflow logs preserve all stdout/stderr per cycle
- Cycle-history.json captures success/failure pattern
- Critic spot-checks cycle outputs during next heartbeat
- Founder reviews cycle outcomes at retrospective

**See:** `HEADLESS_OPERATION_PROTOCOL.md` for full mechanics + `CRON_CONFIGURATION.md` for setup.

---

## P15 — Proactive Improvement Discipline

**Owner:** Proactive cycle agents (UI Polisher, Performance Agent, Bug Triage Listener primarily; others contribute).

**Triggers:** Weekly proactive cycle (Monday 01:00 UTC).

**Discipline:**

1. **Scope adherence** — proactive work happens ONLY in four authorized lanes per `PROACTIVE_IMPROVEMENT_PROTOCOL.md`:
   - Lane 1: UI Polish
   - Lane 2: Bug Discovery
   - Lane 3: Performance
   - Lane 4: Design System Extension

2. **Out-of-scope detection** — if scan surfaces something in the "never" list (new features, compliance changes, cost-discipline budget changes, locked memory amendments, etc.), agent creates FIQ entry instead of proactive proposal.

3. **Quality bar pre-review** — every proposal gets Critic quality-bar review before reaching Founder queue. Vague, unsupported, scope-creeping, or repeat proposals get rejected pre-queue.

4. **Proposal completeness** — every proposal includes: observation + proposed action + estimated cost + risk classification + reversibility + justification + detection method.

5. **Volume calibration** — target 10-15 proposals/week steady state across all lanes. Critic flags volume drift.

6. **No autonomous implementation** — proactive cycle generates proposals ONLY. Implementation happens in next ship cycle AFTER Founder approves.

7. **Implementation discipline** — when ship cycle implements approved proposal: full audit-first + retrospective, treat as mini-ship, commit references PROP-XXX ID.

**Violations:**
- Implementing during proactive cycle (scope violation, HALT item 19)
- Proposing new features (not a polish/bug/perf/design-system item)
- Speculative proposals without evidence
- Re-proposing rejected items
- Skipping Critic quality-bar review
- Proposals that don't cite design system / governance for fix justification

**Verification:**
- Critic logs quality-bar review per proposal
- Founder review captures Accept/Reject/Defer per proposal
- Performance review: acceptance rate per agent, per lane
- Ship cycle implementation tracking per proposal ID

**See:** `PROACTIVE_IMPROVEMENT_PROTOCOL.md` for full mechanics + `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md` for proposal format.

---

## Numbering reference

Existing protocols (locked through v6):
- P1 — Audit-first
- P2 — Caddy Notes update mandate
- P3 — Semver triple-bump
- P4 — Decision bubble write
- P5 — Validator strictness audit
- P6 — CSS token usage audit
- P7 — Legacy field consumer audit
- P8 — State re-assignment audit
- P9 — Firestore writer audit
- P10 — Loop-and-verify (goal-completion-verify)
- P11 — Founder Input Queue triage discipline
- P12 — Extended thinking + deep research default
- P13 — Agent wellbeing discipline

New v7 protocols:
- P14 — Headless operation discipline
- P15 — Proactive improvement discipline

---

*Document authored 2026-05-12. Apply to PROTOCOLS.md at consolidation.*
