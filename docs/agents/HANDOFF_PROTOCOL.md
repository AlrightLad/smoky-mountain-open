# HANDOFF_PROTOCOL.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Define structured handoff between agents, subagents, cycles, and scopes. Eliminates context loss in scheduled wake-cycle architecture. 11 scenarios + per-scenario note format.

---

## 0 — Why handoffs need a protocol

Cycle-to-cycle context loss is the #1 risk in scheduled wake-cycle architecture (per HEADLESS_OPERATION_PROTOCOL.md). Without structured handoffs:
- Resuming agent reconstructs state from scratch (wasted tokens)
- Critical decisions made in prior cycle get re-litigated
- Atomic operations lose their reasoning when resumed
- Subagent findings get lost when parent returns
- Discussion bubble decisions don't propagate cleanly

Structured handoffs solve this by mandating a written note at every transition. Every handoff has: WHAT was being done, WHERE it stopped, WHY it stopped, WHAT comes next, WHAT context the resumer needs.

Handoff notes persist in `.claude/state/handoffs/` for audit trail and resumption.

---

## 1 — Eleven handoff scenarios

| # | Scenario | When |
|---|---|---|
| 1 | Cycle-to-cycle | Ship cycle exits at budget, next ship cycle resumes mid-ship |
| 2 | Agent-to-agent within cycle | Critic finishes audit → Engineer takes over execution |
| 3 | Subagent-to-parent | End User persona finishes → Orchestrator continues |
| 4 | Parent-to-subagent | Orchestrator dispatches → subagent works |
| 5 | Proactive-to-ship | Approved proposal queue → next ship cycle implements |
| 6 | Halt-to-resume | Cycle halted (any HALT item) → cycle resumed after unblock |
| 7 | Founder-to-agent | Founder responds to FIQ → agent picks up resolution |
| 8 | Discussion-bubble-to-caller | Discussion bubble closes → calling agent resumes with decision |
| 9 | Cross-ship | Context from prior ship matters for current ship work |
| 10 | Wave-to-wave | Wave closes → next Wave begins with carried context |
| 11 | Multi-agent parallel merge | Multiple agents work concurrently → results merged |

---

## 2 — Universal handoff fields

Every handoff note, regardless of scenario, contains these fields:

```
- handoff_id: <scenario_code>-<YYYYMMDD>-<HHMM>-<short_descriptor>
- scenario: 1-11
- from_actor: <agent/subagent/cycle/founder>
- to_actor: <agent/subagent/cycle/founder>
- timestamp: ISO 8601 UTC
- what_was_being_done: 1-3 sentences
- where_it_stopped: file/section/step/sub-task reference
- why_it_stopped: completion reason or halt cause
- state_snapshot: pointer to relevant .claude/state/ files
- resumer_needs_to_know: bullet list of context essentials
- next_action: explicit next step for resumer
- open_questions: any unresolved items requiring resumer attention
- references: links to related docs/skills/protocols
```

Plus scenario-specific fields detailed below.

---

## 3 — Scenario 1: Cycle-to-cycle (ship resumption)

**When:** Ship cycle exits at budget watchdog (90% threshold) with ship work incomplete. Next ship cycle (next day) resumes.

**From:** Outgoing ship cycle
**To:** Incoming ship cycle (24 hours later)

**Critical fields beyond universal:**
- ship_id: which ship was in flight
- ship_progress_pct: 0-100
- last_atomic_unit_completed: descriptor
- next_atomic_unit_to_start: descriptor
- discussion_bubble_decisions_made_this_cycle: list of decisions reached
- discussion_bubble_decisions_pending: decisions deferred
- critic_observations: any audit findings to carry forward
- wellness_state: was wellness checkpoint due/triggered?
- token_budget_consumed: actual usage
- files_modified: list (so resumer knows current state of code)

**Storage:** `.claude/state/handoffs/cycle-to-cycle/<from_cycle_id>-to-next.md`

**Resumer protocol:**
1. Read handoff note FIRST before any other state
2. Read referenced state files
3. Verify code state matches handoff note's `files_modified` list
4. Resume at `next_atomic_unit_to_start`

---

## 4 — Scenario 2: Agent-to-agent within cycle

**When:** One agent completes its phase of work; another agent takes over within same cycle. Most common: Critic audit → Engineer execution → Critic review.

**From:** Outgoing agent
**To:** Incoming agent

**Critical fields beyond universal:**
- phase_completed: pre-flight audit / discussion bubble vote / execution / retrospective component / wellness checkpoint / etc.
- decisions_locked: what was decided that must NOT be re-litigated
- assumptions_carried: what assumptions the resumer should NOT challenge without cause
- veto_or_concerns: any Critic findings the incoming agent must address
- handoff_acknowledgment_required: yes/no — does incoming agent need to confirm receipt before proceeding?

**Storage:** `.claude/state/handoffs/agent-to-agent/<cycle_id>/<seq>-<from>-to-<to>.md`

**Resumer protocol:**
1. Read handoff note
2. Acknowledge in journal: `[HANDOFF-ACK] from=<actor> to=<actor> handoff_id=<id>`
3. Honor `decisions_locked` — do not re-relitigate
4. Address `veto_or_concerns` if present before proceeding with new work

---

## 5 — Scenario 3: Subagent-to-parent

**When:** A subagent (e.g., one of the 5 End User personas, a research sub-agent, a specialized scanner) completes its task and returns to parent orchestrator.

**From:** Subagent
**To:** Parent agent

**Critical fields beyond universal:**
- subagent_role: what specialized role the subagent played
- findings: bulleted list of substantive findings
- recommendations: what subagent recommends parent does with findings
- confidence: high/medium/low per finding
- methodology: what process subagent used (replicable)
- tokens_consumed: how much budget subagent used
- escalations: items requiring parent's authority that subagent could not resolve

**Storage:** `.claude/state/handoffs/subagent-returns/<cycle_id>/<subagent_role>-<seq>.md`

**Parent protocol:**
1. Read findings
2. Apply confidence weighting
3. Integrate recommendations into parent's work
4. Resolve any escalations or surface to FIQ

---

## 6 — Scenario 4: Parent-to-subagent (dispatch)

**When:** Orchestrator or other coordinating agent dispatches work to a subagent.

**From:** Parent agent
**To:** Subagent

**Critical fields beyond universal:**
- task_specification: exactly what subagent should accomplish
- scope_boundaries: what subagent must NOT do
- token_budget_allocated: how much budget for this subtask
- expected_output_format: how subagent reports back
- deadline_within_cycle: when subagent must return
- access_permissions: what state/files subagent may read/write
- escalation_path: when to escalate vs continue

**Storage:** `.claude/state/handoffs/dispatches/<cycle_id>/<subagent_role>-<seq>.md`

**Subagent protocol:**
1. Read dispatch note
2. Acknowledge in journal
3. Stay within scope_boundaries
4. Return via Scenario 3 handoff at completion

---

## 7 — Scenario 5: Proactive-to-ship

**When:** Founder-approved proactive proposal from weekly queue is picked up by next ship cycle for implementation.

**From:** Proactive cycle (via Founder-approved queue)
**To:** Ship cycle

**Critical fields beyond universal:**
- proposal_id: PROP-XXX reference
- proposal_lane: 1/2/3/4
- proposal_full_content: complete proposal text
- founder_decision_note: any Founder qualifications/conditions
- estimated_cost_at_proposal: original cost estimate
- design_system_citations: any design system references from proposal
- related_proposals: other approved proposals that should ship together (if any)

**Storage:** `.claude/state/handoffs/proactive-to-ship/<proposal_id>-to-<ship_cycle_id>.md`

**Ship cycle protocol:**
1. Treat proposal as mini-ship within main cycle work
2. Apply full P1 audit-first discipline
3. Apply Founder decision_note conditions
4. Implement per proposal_full_content
5. Mark proposal as implemented in queue file
6. Verify estimated_cost vs actual

---

## 8 — Scenario 6: Halt-to-resume

**When:** Any HALT item triggers, halting cycle work. After Founder unblocks (or auto-resume), work resumes.

**From:** Halting actor (could be any agent or watchdog)
**To:** Resuming actor (next cycle of same type, typically)

**Critical fields beyond universal:**
- halt_item_number: HALT_CRITERIA item number (1-22)
- halt_trigger_details: specifics of what triggered
- atomic_op_completion_status: completed cleanly / mid-write / aborted
- state_integrity_at_halt: verified clean / verified corrupted / unknown
- founder_response: if applicable, Founder's resolution
- preconditions_for_resume: what must be true before resume safe to proceed
- resume_verification_steps: explicit checks resumer runs before continuing

**Storage:** `.claude/state/handoffs/halts/<halt_item>-<cycle_id>.md`

**Resumer protocol:**
1. Run resume_verification_steps
2. Confirm preconditions_for_resume satisfied
3. Critic spot-check the resumer's first action
4. Log resume in journal: `[HANDOFF-HALT-RESUME] halt_id=<id> verified=true`

---

## 9 — Scenario 7: Founder-to-agent

**When:** Founder responds to a FIQ entry, providing direction. Agent picks up the resolution.

**From:** Founder (via FIQ resolution)
**To:** Agent originally awaiting Founder direction

**Critical fields beyond universal:**
- fiq_id: FIQ-XXX reference
- original_question: text of original FIQ
- founder_decision: Founder's specific direction
- founder_rationale: any reasoning Founder shared
- supersedes: which provisional defaults (if any) get overridden
- ratchet_effects: any locked memory updates this triggers
- downstream_impacts: other agents/ships/decisions affected

**Storage:** `.claude/state/handoffs/founder-responses/<fiq_id>-resolution.md`

**Agent protocol:**
1. Apply founder_decision exactly as stated
2. Update any provisional defaults to match founder_decision
3. Surface ratchet_effects to memory consolidation
4. Notify downstream_impacts agents via Scenario 2 handoffs

---

## 10 — Scenario 8: Discussion-bubble-to-caller

**When:** Discussion bubble runs, closes with decision. Calling agent (the one who initiated the discussion bubble) resumes with decision in hand.

**From:** Discussion Bubble (Orchestrator-facilitated)
**To:** Calling agent

**Critical fields beyond universal:**
- discussion_bubble_id: unique discussion bubble identifier
- decision_question: original question put to discussion bubble
- voters_present: list of voting agents
- votes_cast: per-voter vote + rationale
- contributing_inputs: contributing agents' observations
- discussion_bubble_only_inputs: Devil's Advocate, Historical Pattern, Future Self, Plain English Translator outputs
- decision_outcome: final decision
- tie_break_used: if Orchestrator tie-broke, the rationale
- minority_concerns: any voter dissent worth carrying forward
- plain_english_summary: Founder-readable summary

**Storage:** `.claude/state/handoffs/discussion-bubbles/<discussion_bubble_id>-decision.md`

**Calling agent protocol:**
1. Apply decision_outcome
2. Document tie_break_used if applicable
3. Address minority_concerns if substantive
4. Plain_english_summary feeds retrospective component 3

---

## 11 — Scenario 9: Cross-ship handoff

**When:** Context from prior ship (within same wave or across waves) matters for current ship's work. Different from cycle-to-cycle (which is same-ship resume).

**From:** Prior ship (now complete)
**To:** Current ship (now starting or in-flight)

**Critical fields beyond universal:**
- prior_ship_id: which ship the context comes from
- prior_ship_outcome: completion summary
- relevant_artifacts: code patterns, decisions, deferred items from prior ship
- carries_decisions: locked decisions from prior ship that constrain current work
- carries_open_questions: items prior ship surfaced but did not resolve
- design_system_state_changes: any palette/token/component additions from prior ship
- known_brittleness: areas of prior ship code that current ship should be careful around

**Storage:** `.claude/state/handoffs/cross-ship/<from_ship_id>-to-<to_ship_id>.md`

**Receiving ship protocol:**
1. Read all carries_decisions before pre-flight audit
2. Address carries_open_questions where in current ship's scope
3. Honor known_brittleness — apply extra Critic scrutiny when touching
4. Update design_system_state references in current ship

---

## 12 — Scenario 10: Wave-to-wave handoff

**When:** Wave closes (e.g., Wave 1 of 14 ships completes). Next Wave begins (e.g., Wave 2 HQ Redesign). Substantial context transfer.

**From:** Closing Wave
**To:** Opening Wave

**Critical fields beyond universal:**
- closing_wave_id: which Wave is closing
- closing_wave_summary: total ships, tokens, duration, FIQ resolved, proposals implemented
- key_decisions_locked_this_wave: all significant decisions, with rationale
- design_system_state_at_close: full state of design system after wave
- tech_debt_inventory: tracked debt items carrying forward
- proven_patterns: patterns validated this wave that next wave can reuse
- known_anti_patterns: patterns to avoid based on wave learnings
- founder_directives_carrying_forward: explicit Founder direction that persists
- opening_wave_id: which Wave is opening
- opening_wave_prerequisites: what must be true to safely begin

**Storage:** `.claude/state/handoffs/wave-transitions/<closing_wave>-to-<opening_wave>.md`

**Opening Wave protocol:**
1. Read full closing wave summary
2. Verify all opening_wave_prerequisites satisfied
3. Apply founder_directives_carrying_forward to ship Visions
4. Use proven_patterns; avoid known_anti_patterns
5. Surface any uncertainty to FIQ before starting first ship

---

## 13 — Scenario 11: Multi-agent parallel merge

**When:** Multiple agents work concurrently on different facets of a single deliverable. Results merge into single output.

**From:** Multiple parallel actors
**To:** Single merging agent (typically Orchestrator or designated lead)

**Critical fields beyond universal:**
- merge_task_id: what the merge produces
- parallel_actors: list of contributing agents
- per_actor_outputs: each actor's output with timestamp
- conflict_detection: any conflicting outputs identified
- conflict_resolution_strategy: how conflicts resolved (priority order, discussion bubble, escalation)
- merge_validation: how merger verified result is coherent
- residual_concerns: minority concerns or edge cases not fully resolved

**Storage:** `.claude/state/handoffs/parallel-merge/<merge_task_id>.md`

**Merger protocol:**
1. Collect all per_actor_outputs
2. Run conflict_detection systematically
3. Apply conflict_resolution_strategy
4. Document residual_concerns
5. Single coherent output emitted as merge result

---

## 14 — Handoff note storage hierarchy

```
.claude/state/handoffs/
├── cycle-to-cycle/
│   └── ship-20260519-1100-to-next.md
├── agent-to-agent/
│   └── ship-20260519-1100/
│       ├── 01-critic-to-engineer.md
│       ├── 02-engineer-to-critic.md
│       └── 03-critic-to-orchestrator.md
├── subagent-returns/
│   └── ship-20260519-1100/
│       └── beginner-persona-01.md
├── dispatches/
│   └── ship-20260519-1100/
│       └── beginner-persona-01.md
├── proactive-to-ship/
│   └── PROP-001-to-ship-20260522-1100.md
├── halts/
│   └── 18-ship-20260519-1100.md
├── founder-responses/
│   └── FIQ-007-resolution.md
├── discussion-bubbles/
│   └── discussion-bubble-20260519-1145-typography.md
├── cross-ship/
│   └── W1-S3-to-W1-S4.md
├── wave-transitions/
│   └── W1-to-W2.md
└── parallel-merge/
    └── proposal-queue-20260520.md
```

---

## 15 — Mandatory handoff discipline

Per P16 (added in PROTOCOLS_v8_ADDENDUM.md):

- Every transition between actors writes a handoff note. No exceptions.
- Handoff note written BEFORE outgoing actor finishes (so resume isn't blocked on parallel write)
- Receiving actor reads handoff note FIRST before any other state
- Receiving actor logs acknowledgment in journal
- Missing handoff at expected transition = HALT_CRITERIA item 21
- Handoff notes are immutable once written; corrections go in addendum field

---

## 16 — Integration with existing governance

### With cycle architecture (P14)
Cycle-to-cycle handoffs (Scenario 1) are mandatory at any cycle exit with incomplete work. Cycle entry includes mandatory read of latest cycle-to-cycle handoff.

### With proactive improvement (P15)
Proactive-to-ship handoffs (Scenario 5) replace ad-hoc "implement next proposal" pattern. Every approved proposal becomes structured handoff.

### With discussion bubbles (P4)
Discussion-bubble-to-caller handoffs (Scenario 8) replace ad-hoc decision communication. Every discussion bubble closure produces structured handoff with full vote record.

### With FIQ (P11)
Founder-to-agent handoffs (Scenario 7) replace direct FIQ resolution propagation. Every Founder FIQ resolution becomes structured handoff.

### With wellness (P13)
Wellness state is mandatory field in Scenario 1 (cycle-to-cycle) — resumer knows if wellness checkpoint was due/triggered.

### With telemetry (P17)
Every handoff emits telemetry entries (Scenario, from_actor, to_actor, timestamp, tokens at handoff). See TELEMETRY_PROTOCOL.md.

---

## 17 — Anti-patterns

### Anti-pattern 1: Skipping handoff at transition
❌ "I finished the audit; Engineer can just look at the journal."
✅ Write handoff note. Journal is summary; handoff is full context transfer.

### Anti-pattern 2: Vague handoff content
❌ "Did pre-flight audit. Looks good. Engineer can proceed."
✅ List specific decisions locked, assumptions carried, concerns to address.

### Anti-pattern 3: Mid-handoff context drift
❌ Resumer reads handoff, then ignores it and re-runs everything.
✅ Honor handoff context. Question only with cause.

### Anti-pattern 4: Handoff as journal substitute
❌ Putting full activity log in handoff note.
✅ Handoff = essential context for resume. Activity log goes in journal.

### Anti-pattern 5: Conflicting handoffs from parallel work
❌ Two agents both write handoffs assuming they own the next phase.
✅ Multi-agent parallel work uses Scenario 11 (merge) not parallel Scenario 2 handoffs.

### Anti-pattern 6: Founder-bypass handoffs
❌ Agent makes scope decision that should have been FIQ, writes handoff as if Founder decided.
✅ Out-of-scope decisions go to FIQ first; handoff after Founder responds.

### Anti-pattern 7: Stale handoff resume
❌ Resumer reads handoff from 2 weeks ago without verifying state.
✅ Resumer verifies state matches handoff's files_modified before proceeding.

---

## 18 — Cross-references

- `HANDOFF_NOTE_TEMPLATES.md` (per-scenario paste-ready templates)
- `parbaughs-handoff-note` skill (generation pattern)
- `PROTOCOLS_v8_ADDENDUM.md` P16
- `HALT_CRITERIA_v8_ADDENDUM.md` item 21
- `SESSION_JOURNAL_v8_ADDENDUM.md` (handoff entry types)
- `TELEMETRY_PROTOCOL.md` (handoff metric capture)
- `WAVE_ZERO_DRY_RUN_v8_EXTENSION.md` validation 11

---

*Document authored 2026-05-12. Locked Founder ratification. Core to v8 governance.*
