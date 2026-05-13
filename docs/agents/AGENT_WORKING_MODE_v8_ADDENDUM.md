# AGENT_WORKING_MODE_v8_ADDENDUM.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Per-agent additions covering handoff + telemetry participation. Apply to each agent file alongside v6 and v7 working mode additions.

---

## How to apply

For each agent file, ADD the following subsections to the existing `## Working mode` section. These are additive to v6 and v7 additions.

---

## Engineer

```markdown
### Handoff discipline (v8)

**Handoffs Engineer writes (most common):**
- Scenario 1 (cycle-to-cycle) — when ship cycle exits with ship incomplete; Engineer is typically the actor whose work paused
- Scenario 2 (agent-to-agent) — handing back to Critic after execution phase
- Scenario 4 (parent-to-subagent) — Engineer rarely dispatches; only for highly focused sub-tasks within complex ships

**Handoffs Engineer receives:**
- Scenario 1 — resuming own work from previous cycle
- Scenario 2 — receiving from Critic after pre-flight audit
- Scenario 5 — receiving approved proactive proposal to implement
- Scenario 7 — receiving Founder direction via FIQ resolution
- Scenario 8 — receiving discussion bubble decision to act on
- Scenario 9 — receiving cross-ship context

**Handoff quality bar:** Engineer's handoffs MUST include explicit `next_action` for resumer. "Continue execution" is vague; "Resume at src/pages/scorecard.js:142 after retest of hole-edit flow" is acceptable.

### Telemetry emission (v8)

**Events Engineer emits:**
- `agent.invocation.start/end` per work pickup
- `ship.atomic_unit.complete` per logical work unit
- `ship.progress.update` when ship progress changes >5%
- `code.file.modified` per file edited
- `code.test.added` per test added
- `code.test.run` per test execution
- `code.commit` per commit
- `agent.skill.invoked` per skill use

**Emission discipline:** Engineer batches events between atomic units, flushes at unit completion. Reduces I/O overhead. Maximum 1k tokens overhead per atomic unit for telemetry.
```

---

## Critic

```markdown
### Handoff discipline (v8)

**Handoffs Critic writes:**
- Scenario 2 (agent-to-agent) — after pre-flight audit complete, handoff to Engineer
- Scenario 2 (agent-to-agent) — after retrospective audit, handoff to Orchestrator
- Critic's handoffs MUST include `decisions_locked` and `veto_or_concerns` fields populated

**Handoffs Critic receives:**
- Scenario 2 — from Engineer after execution phase
- Scenario 8 — from discussion bubble (Critic is voter; receives outcome to apply to next audit)

**Critical:** Critic's handoffs ARE quality gates. Engineer must address `veto_or_concerns` before proceeding. Skipping = HALT item 12.

### Telemetry emission (v8)

**Events Critic emits:**
- `agent.invocation.start/end` per audit
- `cycle.activity.start/end` for spot-checks during heartbeat
- Quality bar pre-review on proposals: emits `proposal.quality_bar.passed/rejected` events

**Audit role for telemetry:**
Critic audits telemetry completeness at retrospective. Flags missing events as anomalies. Verifies aggregates match raw events for the ship.
```

---

## Performance/Load Agent

```markdown
### Handoff discipline (v8)

**Handoffs Performance Agent writes:**
- Scenario 3 (subagent-to-parent) — when invoked as sub-agent for performance investigation, returns findings to Orchestrator
- Scenario 5 (proactive-to-ship) — Lane 3 proposals authored by Performance Agent

**Handoffs Performance Agent receives:**
- Scenario 4 (parent-to-subagent) — Orchestrator dispatches performance investigation
- Scenario 8 — discussion bubble decisions on performance-related questions

### Telemetry emission (v8)

**Events Performance Agent emits:**
- `agent.invocation.start/end` per benchmark or scan
- `code.bundle.size_measured` per bundle size measurement
- `code.coverage.measured` (when coverage relevant to perf, e.g., test execution time)
- Custom event: `performance.benchmark.run` per synthetic benchmark
- Custom event: `performance.regression.detected` when threshold crossed
```

---

## Security Agent

```markdown
### Handoff discipline (v8)

**Handoffs Security Agent writes:**
- Scenario 3 (subagent-to-parent) — when invoked as sub-agent for security review
- Scenario 7-adjacent — Security findings often go to FIQ (not direct handoff) for Founder direction

**Handoffs Security Agent receives:**
- Scenario 4 (parent-to-subagent) — Orchestrator or Engineer dispatches security review
- Scenario 8 — discussion bubble decisions on security-relevant questions (Launch A+)

**CMMC/HIPAA discipline:** Security Agent handoffs containing client-specific detail follow Founder's userPreferences on placeholder values. Real values only when explicitly authorized.

### Telemetry emission (v8)

**Events Security Agent emits:**
- `agent.invocation.start/end` per audit
- Custom event: `security.dependency_audit.completed`
- Custom event: `security.vulnerability.detected` (severity classified)
```

---

## Data Integrity Agent

```markdown
### Handoff discipline (v8)

**Handoffs Data Integrity Agent writes:**
- Scenario 3 (subagent-to-parent) — when invoked for data audit
- Scenario 2 (agent-to-agent) — handoff to Engineer when migration sign-off given

**Handoffs Data Integrity Agent receives:**
- Scenario 4 — dispatched for data audits, especially migration ships
- Scenario 8 — discussion bubble decisions on data-relevant questions (W2+)

### Telemetry emission (v8)

**Events Data Integrity Agent emits:**
- `agent.invocation.start/end` per audit
- Custom event: `data.integrity.audit.completed`
- Custom event: `data.migration.validated` for migration ships
```

---

## Orchestrator

```markdown
### Handoff discipline (v8)

**Handoffs Orchestrator writes:**
- Scenario 4 (parent-to-subagent) — dispatching subagents
- Scenario 2 (agent-to-agent) — coordinating handoffs between other agents (Orchestrator often orchestrates handoffs without being party to them — but writes summary handoffs when ship cycle ends)
- Scenario 10 (wave-to-wave) — Orchestrator writes wave-to-wave handoff at wave close
- Scenario 11 (multi-agent merge) — Orchestrator is typical merger

**Handoffs Orchestrator receives:**
- Scenario 3 (subagent-to-parent) — receiving subagent returns
- Scenario 8 — discussion bubble outcomes (Orchestrator facilitates discussion bubbles, receives Plain English Translator output)

**Orchestrator quality bar:** Orchestrator's handoffs include `cross_agent_coordination` notes — what other actors need to know about this handoff that wouldn't be in their direct handoff.

### Telemetry emission (v8)

**Events Orchestrator emits:**
- `agent.invocation.start/end` per orchestration activity
- `discussion_bubble.start/end` for discussion bubbles Orchestrator facilitates
- `ship.start/complete` for ship lifecycle (Orchestrator is ship dispatcher)
- Custom event: `orchestration.dispatch` per subagent dispatch
- Custom event: `orchestration.merge` per multi-agent merge
```

---

## Flow Documenter

```markdown
### Handoff discipline (v8)

**Handoffs Flow Documenter writes:**
- Scenario 2 — handing documentation back to Engineer/Critic after Flow Doc updates
- Rarely originates handoffs; primarily documents others' handoffs in journal

**Handoffs Flow Documenter receives:**
- Scenario 8 — discussion bubble decisions (documents in plain English per template Component 3)

### Telemetry emission (v8)

**Events Flow Documenter emits:**
- `agent.invocation.start/end`
- Custom event: `documentation.flow_diagram.updated`

**Special role:** Flow Documenter is the journal audit specialist. Verifies HANDOFF and TELEMETRY entries are complete during retrospective audits.
```

---

## UI Polisher

```markdown
### Handoff discipline (v8)

**Handoffs UI Polisher writes:**
- Scenario 5 (proactive-to-ship) — Lane 1 and Lane 4 proposals authored by UI Polisher
- Scenario 3 (subagent-to-parent) — when invoked for visual coherence review

**Handoffs UI Polisher receives:**
- Scenario 4 — dispatched for visual reviews
- Scenario 8 — discussion bubble decisions on visual/UX-relevant questions

### Telemetry emission (v8)

**Events UI Polisher emits:**
- `agent.invocation.start/end`
- Custom event: `proposal.created` (with lane classification)
- Custom event: `design_system.violation_detected`
```

---

## End User sub-agents (5 personas)

```markdown
### Handoff discipline (v8)

**Handoffs End User personas write:**
- Scenario 3 (subagent-to-parent) — returning findings from persona perspective

**Handoffs End User personas receive:**
- Scenario 4 — dispatched to evaluate from persona perspective

**Quality bar:** Persona handoffs include `persona_perspective` field describing which lens (Beginner/Engaged/Power User/Commissioner/Skeptic) was applied. Findings must be calibrated to that persona, not generic.

### Telemetry emission (v8)

**Events personas emit:**
- `agent.invocation.start/end`
- Custom event: `persona.evaluation.completed` (per persona)
```

---

## Bug Triage Listener

```markdown
### Handoff discipline (v8)

**Handoffs Bug Triage Listener writes:**
- Scenario 5 (proactive-to-ship) — Lane 2 proposals from triage data
- Scenario 7-adjacent — high/critical bugs go to FIQ for Founder direction (not direct handoff)
- Scenario 2 — handoff to Engineer when ship-affecting bug discovered during ship work

**Handoffs Bug Triage Listener receives:**
- Scenario 4 — dispatched for triage during heartbeat or proactive cycles

### Telemetry emission (v8)

**Events Bug Triage emits:**
- `agent.invocation.start/end`
- Custom event: `bug.triaged` (per bug, with severity classification)
- Custom event: `bug.pattern.detected` when aggregation reveals pattern
```

---

## Discussion Bubble agents (Devil's Advocate, Historical Pattern, Future Self, Plain English Translator)

```markdown
### Handoff discipline (v8)

**Handoffs discussion bubble agents write:**
- Scenario 8 (discussion-bubble-to-caller) — primary handoff type for these agents
- Plain English Translator specifically authors the Founder-readable summary section of every discussion bubble handoff

**Handoffs discussion bubble agents receive:**
- None directly; discussion bubble agents are invoked WITHIN discussion bubbles, return outputs that become part of discussion bubble's Scenario 8 handoff

### Telemetry emission (v8)

**Events discussion bubble agents emit:**
- `discussion_bubble.input.contributed` per discussion bubble participation
- No `agent.invocation.start/end` (their participation is part of discussion bubble lifecycle)
```

---

## Cross-references

- `HANDOFF_PROTOCOL.md` (11 scenarios)
- `HANDOFF_NOTE_TEMPLATES.md` (per-scenario templates)
- `TELEMETRY_PROTOCOL.md` (event catalog)
- `parbaughs-handoff-note` skill
- `parbaughs-telemetry-emit` skill
- `parbaughs-report-generate` skill
- `PROTOCOLS_v8_ADDENDUM.md` P16 + P17
- `AGENT_WORKING_MODE_ADDENDUM.md` (v6 working mode that this extends)
- `AGENT_WORKING_MODE_v7_ADDENDUM.md` (v7 additions)

---

*Document authored 2026-05-12. Apply to each agent file alongside v6 + v7 working mode additions.*
