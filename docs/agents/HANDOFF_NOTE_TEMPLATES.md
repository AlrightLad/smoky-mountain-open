# HANDOFF_NOTE_TEMPLATES.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Paste-ready handoff note templates per scenario. Used by `parbaughs-handoff-note` skill.

---

## Template 1 — Cycle-to-cycle (Scenario 1)

```markdown
# Handoff: Cycle-to-cycle ship resumption

**handoff_id:** c2c-{YYYYMMDD}-{HHMM}-{ship_id}
**scenario:** 1 (cycle-to-cycle)
**from_actor:** {outgoing_cycle_id}
**to_actor:** next-ship-cycle
**timestamp:** {ISO8601}

## What was being done

{1-3 sentences describing the work in flight when cycle exited.}

## Where it stopped

- **Ship:** {ship_id}
- **Progress:** {N}% complete
- **Last atomic unit completed:** {descriptor}
- **Next atomic unit to start:** {descriptor}
- **Files in flight:** {list of files touched but not yet committed}

## Why it stopped

**Stop type:** {PAUSE | HALT}

**If PAUSE (auto-resumes; Founder does NOT need to clear):**
- Reason: {rate-limit-90pct | wellness-rest | heartbeat-boundary}
- Quota type (if rate-limit): {weekly-tokens | daily-tokens | hourly-requests}
- Usage at pause: {pct}%
- Resume after: {ISO-8601 UTC}
- State written to: `.claude/state/last-verify.json`

**If HALT (requires Founder intervention; cron continues but no-ops until cleared):**
- Halt criterion #: {item number from HALT_CRITERIA}
- Reason: {brief description}
- FIQ entry: {FIQ-NNN}
- Clear condition: {what needs to happen before Founder clears halt}

## State snapshot

- ship-progress: `.claude/state/ship-progress/{ship_id}.json`
- cycle-history: `.claude/state/cycle-history.json`
- last-verify: `.claude/state/last-verify.json`
- wellness: `.claude/state/wellness/{relevant_agents}.json`

## Discussion bubble decisions made this cycle

- {decision 1: question → outcome}
- {decision 2: question → outcome}

## Discussion bubble decisions pending

- {pending question 1 — deferred to next cycle because: {reason}}

## Critic observations to carry forward

- {observation 1}
- {observation 2}

## Wellness state

- Engineer ships closed: {N} (threshold 5)
- Engineer tokens consumed: {Nk} (threshold 100k)
- Engineer hours active: {Nh} (threshold 8)
- Last wellness checkpoint: {timestamp}
- Wellness due next cycle: yes/no

## Token budget consumed this cycle

- Allocated: {N}k
- Consumed: {N}k ({pct}%)

## Files modified (need verification on resume)

- `src/pages/{file1}.js` — added {feature}
- `src/core/{file2}.js` — refactored {function}
- `docs/agents/CADDY_NOTES.js` — version bumped to {x.y.z}

## Resumer needs to know

- {essential context bullet 1}
- {essential context bullet 2}
- {essential context bullet 3}

## Next action

{Explicit next step. E.g., "Run pre-flight audit on remaining sub-task {X}, then continue execution at {file}:{line}."}

## Open questions

- {unresolved item 1 — does NOT block resume but resumer should address}

## References

- Ship Vision: `docs/agents/ship-visions/W1.S4.md`
- Last-verify: `.claude/state/last-verify.json`
- Related FIQ entries: FIQ-{XXX}
```

---

## Template 2 — Agent-to-agent within cycle (Scenario 2)

```markdown
# Handoff: Agent-to-agent within cycle

**handoff_id:** a2a-{cycle_id}-{seq}-{from}-to-{to}
**scenario:** 2 (agent-to-agent within cycle)
**from_actor:** {Engineer | Critic | Performance | Security | DataIntegrity | Orchestrator | UIPolisher | ...}
**to_actor:** {same options}
**timestamp:** {ISO8601}

## What was being done

{What phase of work the outgoing agent owned.}

## Phase completed

{Pre-flight audit | Discussion Bubble vote | Execution | Retrospective component {N} | Wellness checkpoint | Other}

## Where it stopped

{Specific reference. E.g., "Pre-flight audit complete; planted issue detected at src/pages/scorecard.js:142; Engineer must address before execution."}

## Decisions locked (do NOT re-litigate)

- {Decision 1 with citation}
- {Decision 2 with citation}

## Assumptions carried (do NOT challenge without cause)

- {Assumption 1 — why it stands}
- {Assumption 2 — why it stands}

## Veto or concerns (incoming actor MUST address)

- {Concern 1 — required resolution before proceeding}
- {Concern 2 — required resolution before proceeding}

## Handoff acknowledgment required

{yes/no} — does incoming actor confirm receipt in journal before proceeding?

## Resumer needs to know

- {essential context bullet 1}
- {essential context bullet 2}

## Next action

{Explicit next step for incoming agent.}

## References

- Discussion bubble decisions this cycle: `.claude/state/handoffs/discussion-bubbles/`
- Ship-in-flight: `docs/agents/ship-visions/{ship_id}.md`
- Critic-audit-log: `.claude/state/critic-audit-log.json`
```

---

## Template 3 — Subagent-to-parent (Scenario 3)

```markdown
# Handoff: Subagent returns to parent

**handoff_id:** sub-ret-{cycle_id}-{subagent_role}-{seq}
**scenario:** 3 (subagent-to-parent)
**from_actor:** {subagent role, e.g., BeginnerPersona, ResearchSubagent, PerformanceScanner}
**to_actor:** {parent role, e.g., Orchestrator, EndUserCoordinator}
**timestamp:** {ISO8601}

## Subagent role

{What specialized function this subagent played.}

## Task

{What subagent was dispatched to do.}

## Methodology

{What process subagent used. Should be replicable.}

## Findings

- **{Finding 1}:** {description}
  - Confidence: high/medium/low
  - Evidence: {what supports this finding}
- **{Finding 2}:** {description}
  - Confidence: high/medium/low
  - Evidence: {what supports this finding}

## Recommendations

- {Recommendation 1 — parent action}
- {Recommendation 2 — parent action}

## Escalations (require parent's authority)

- {Item 1 — why subagent couldn't resolve}

## Tokens consumed

{N}k of {N}k allocated

## References

- Dispatch handoff: `.claude/state/handoffs/dispatches/{dispatch_id}.md`
- Subagent skill used: {skill_name}
```

---

## Template 4 — Parent-to-subagent dispatch (Scenario 4)

```markdown
# Handoff: Parent dispatches to subagent

**handoff_id:** disp-{cycle_id}-{subagent_role}-{seq}
**scenario:** 4 (parent-to-subagent)
**from_actor:** {parent role}
**to_actor:** {subagent role}
**timestamp:** {ISO8601}

## Task specification

{Exactly what subagent should accomplish. Concrete, not vague.}

## Scope boundaries

**In scope:**
- {item 1}
- {item 2}

**Out of scope (subagent must NOT do):**
- {item 1}
- {item 2}

## Token budget allocated

{N}k for this subtask.

## Expected output format

{How subagent should report back. Reference to Template 3 unless different.}

## Deadline within cycle

{When subagent must return — relative to cycle start.}

## Access permissions

- Read: {state files / source dirs}
- Write: {what subagent may write}

## Escalation path

{When subagent should escalate vs continue:}
- Escalate if: {condition 1}
- Continue if: {condition 2}

## References

- Skill subagent should use: {skill_name}
- Cycle context: {cycle_id}
```

---

## Template 5 — Proactive-to-ship (Scenario 5)

```markdown
# Handoff: Approved proactive proposal to ship cycle

**handoff_id:** p2s-PROP-{XXX}-to-{ship_cycle_id}
**scenario:** 5 (proactive-to-ship)
**from_actor:** proactive-cycle-{date}
**to_actor:** {ship_cycle_id}
**timestamp:** {ISO8601}

## Proposal reference

- **Proposal ID:** PROP-{XXX}
- **Lane:** {1 UI Polish | 2 Bug Discovery | 3 Performance | 4 Design System}
- **Original cycle:** proactive-{YYYYMMDD-HHMM}
- **Founder decision date:** {YYYY-MM-DD}

## Proposal full content

{Complete proposal text from queue file, including:
- Observation
- Detection method
- Proposed action
- Cost estimate
- Risk classification
- Reversibility
- Justification
- Design system citations (if Lane 1 or 4)}

## Founder decision note

> {Founder's note text from queue file}

## Founder conditions/qualifications

{Any specific direction Founder added beyond Accept.}

## Estimated cost at proposal

- Time: {N min/hours}
- Tokens: {N}k

## Related approved proposals shipping together (if any)

- PROP-{XXX} — {reason for bundling}

## Ship cycle protocol

1. Treat as mini-ship within main cycle work
2. Apply full P1 audit-first discipline
3. Apply Founder conditions
4. Implement per proposed_action
5. Mark PROP-{XXX} as `implemented_at: {timestamp}` in queue file
6. Compare actual cost to estimated

## References

- Original queue file: `.claude/state/proactive-proposals/{YYYY-MM-DD}.md`
- Founder approval commit: {commit_hash}
```

---

## Template 6 — Halt-to-resume (Scenario 6)

```markdown
# Handoff: Halt to resume

**handoff_id:** halt-{halt_item_number}-{cycle_id}
**scenario:** 6 (halt-to-resume)
**from_actor:** {halting actor}
**to_actor:** {resuming actor, typically next cycle of same type}
**timestamp:** {ISO8601}

## Halt item triggered

- **Number:** {HALT_CRITERIA item 1-22}
- **Title:** {full halt item title}

## Halt trigger details

{Specific event/condition that triggered halt.}

## Atomic operation completion status

{completed cleanly | mid-write (state may be partial) | aborted (state should be considered suspect)}

## State integrity at halt

- last-verify checksum: {hash}
- last-verify timestamp: {ISO8601}
- Integrity verdict: {clean | corrupted | unknown — needs verification}

## Founder response (if applicable)

{Founder's resolution text. If halt is auto-resume type, this section says "auto-resume".}

## Preconditions for resume

- {Condition 1 must be true}
- {Condition 2 must be true}
- {Condition 3 must be true}

## Resume verification steps

1. {Step 1 — explicit check}
2. {Step 2 — explicit check}
3. {Step 3 — explicit check}

## Resumer protocol

1. Run verification steps above
2. Confirm preconditions satisfied
3. Critic spot-check resumer's first action
4. Log resume in journal: `[HANDOFF-HALT-RESUME] halt_id={id} verified=true`
5. Proceed with normal cycle work

## References

- HALT_CRITERIA item: `docs/agents/HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` item {N}
- Cycle that halted: {cycle_id}
```

---

## Template 7 — Founder-to-agent (Scenario 7)

```markdown
# Handoff: Founder response to FIQ

**handoff_id:** f2a-FIQ-{XXX}-resolution
**scenario:** 7 (founder-to-agent)
**from_actor:** Founder
**to_actor:** {agent originally awaiting Founder direction}
**timestamp:** {ISO8601}

## FIQ reference

- **FIQ ID:** FIQ-{XXX}
- **Original question:** {full text}
- **Raised by:** {agent}
- **Raised on:** {timestamp}
- **Provisional default applied:** {what agents did while waiting}

## Founder decision

{Founder's specific direction. Verbatim.}

## Founder rationale

{Any reasoning Founder shared.}

## Supersedes (provisional defaults overridden)

- {Default 1 → Founder direction}
- {Default 2 → Founder direction}

## Ratchet effects (locked memory updates)

- {Update 1 to add to memory}
- {Update 2 to add to memory}

## Downstream impacts

- **Agents affected:** {list}
- **Ships affected:** {list}
- **Decisions to revisit:** {list}

## Agent protocol

1. Apply founder_decision exactly as stated
2. Update provisional defaults to match
3. Surface ratchet_effects to memory consolidation
4. Notify downstream_impacts agents via Scenario 2 handoffs

## References

- FIQ entry: `.claude/state/founder_input_queue.json` entry FIQ-{XXX}
- Founder commit: {commit_hash}
```

---

## Template 8 — Discussion-bubble-to-caller (Scenario 8)

```markdown
# Handoff: Discussion bubble closure

**handoff_id:** discussion-bubble-{YYYYMMDD-HHMM}-{topic_short}
**scenario:** 8 (discussion-bubble-to-caller)
**from_actor:** discussion bubble (Orchestrator-facilitated)
**to_actor:** {calling agent}
**timestamp:** {ISO8601}

## Discussion Bubble identifier

discussion-bubble-{YYYYMMDD-HHMM}-{topic_short}

## Decision question

{Original question put to discussion bubble. Verbatim.}

## Voters present

- Engineer: present/absent
- Critic: present/absent
- Performance/Load (if W2+): present/absent/n/a
- Security (if Launch A+): present/absent/n/a
- Data Integrity (if W2+): present/absent/n/a
- Quorum met: {yes/no — minimum 2}

## Votes cast

| Voter | Vote | Rationale |
|---|---|---|
| Engineer | {A/B/C} | {short rationale} |
| Critic | {A/B/C} | {short rationale} |
| ... | ... | ... |

## Contributing inputs (no vote)

- **Orchestrator:** {observation}
- **Flow Doc:** {observation}
- **UI Polisher:** {observation}
- **End User:** {observation}
- **Bug Triage:** {observation}

## Discussion-bubble-only inputs

- **Devil's Advocate:** {opposing case}
- **Historical Pattern:** {pattern observed}
- **Future Self:** {what future self would want}
- **Plain English Translator:** {Founder-readable summary}

## Decision outcome

{Final decision. Concrete.}

## Tie-break (if used)

**Orchestrator tie-break:** {yes/no}
**Tie-break rationale:** {if yes, why Orchestrator chose this side}

## Minority concerns to carry forward

- {Concern from dissenting voter — should be addressed even though decision went other way}

## Plain English summary (for Founder retrospective)

{Plain English Translator's output. Founder-readable, no jargon.}

## Calling agent protocol

1. Apply decision_outcome
2. Document tie_break_used if applicable in agent's work
3. Address minority_concerns if substantive
4. Plain_english_summary feeds retrospective component 3

## References

- Plain English summary feeds: post-push retrospective component 3
- Decision adds to: discussion-bubble-decisions index
```

---

## Template 9 — Cross-ship handoff (Scenario 9)

```markdown
# Handoff: Cross-ship context transfer

**handoff_id:** cross-{from_ship}-to-{to_ship}
**scenario:** 9 (cross-ship)
**from_actor:** {prior_ship_id}
**to_actor:** {current_ship_id}
**timestamp:** {ISO8601}

## Prior ship reference

- **Ship ID:** {prior_ship_id}
- **Ship completion:** {timestamp}
- **Final outcome:** {summary}

## Current ship reference

- **Ship ID:** {current_ship_id}
- **Starting context:** {state at start}

## Relevant artifacts from prior ship

- **Code patterns:** {patterns/abstractions current ship may use}
- **Design decisions:** {decisions still binding}
- **Deferred items:** {what prior ship intentionally deferred}

## Decisions that carry forward (still binding)

- {Decision 1 — from prior ship, applies to current}
- {Decision 2 — from prior ship, applies to current}

## Open questions carrying forward

- {Question 1 — prior ship surfaced but did not resolve}
- {Question 2 — prior ship surfaced but did not resolve}

## Design system state changes from prior ship

- {Token added: --cb-{name} = {value}}
- {Primitive extracted: {name} at {file}}
- {Utility class added: .{name} in {file}}

## Known brittleness (apply extra Critic scrutiny)

- {Area 1: brief description of fragility}
- {Area 2: brief description of fragility}

## Receiving ship protocol

1. Read all carries_decisions before pre-flight audit
2. Address carries_open_questions where in scope
3. Honor known_brittleness — extra Critic scrutiny when touching
4. Update design_system_state references in current ship

## References

- Prior ship retrospective: `docs/agents/retrospectives/{prior_ship_id}.md`
- Current ship Vision: `docs/agents/ship-visions/{current_ship_id}.md`
```

---

## Template 10 — Wave-to-wave handoff (Scenario 10)

```markdown
# Handoff: Wave transition

**handoff_id:** wave-{closing}-to-{opening}
**scenario:** 10 (wave-to-wave)
**from_actor:** {closing_wave_id}
**to_actor:** {opening_wave_id}
**timestamp:** {ISO8601}

## Closing Wave summary

- **Wave ID:** {closing_wave_id}
- **Ships completed:** {N}/{N total}
- **Total duration:** {Nh}
- **Total tokens consumed:** {N}M
- **FIQ entries resolved:** {N}
- **Proposals implemented:** {N}
- **Ships deferred to future wave:** {list if any}

## Key decisions locked this Wave

- **{Decision 1}:** {rationale} — affects: {scope}
- **{Decision 2}:** {rationale} — affects: {scope}
- **{Decision 3}:** {rationale} — affects: {scope}

## Design system state at close

- **Tokens:** {N total, broken down by family}
- **Primitives:** {list of components extracted}
- **Utility classes:** {N total}
- **Color palette:** {state if changed this Wave}
- **Typography scale:** {state}
- **Spacing scale:** {state}

## Tech debt inventory

- **Carried from prior waves:** {N items, link}
- **Added this Wave:** {N items, link}
- **Resolved this Wave:** {N items, link}
- **Active inventory:** `docs/agents/TECH_DEBT_INVENTORY.md`

## Proven patterns (reusable in next Wave)

- {Pattern 1 — what it solves}
- {Pattern 2 — what it solves}
- {Pattern 3 — what it solves}

## Known anti-patterns (avoid in next Wave)

- {Anti-pattern 1 — why}
- {Anti-pattern 2 — why}

## Founder directives carrying forward

- {Directive 1 from Founder, with origin reference}
- {Directive 2 from Founder, with origin reference}

## Opening Wave reference

- **Wave ID:** {opening_wave_id}
- **First ship to execute:** {ship_id}

## Opening Wave prerequisites

- [ ] {Prerequisite 1 — must be true to start}
- [ ] {Prerequisite 2 — must be true to start}
- [ ] {Prerequisite 3 — must be true to start}

## Opening Wave protocol

1. Read full closing wave summary
2. Verify all opening_wave_prerequisites satisfied
3. Apply founder_directives_carrying_forward to ship Visions
4. Use proven_patterns; avoid known_anti_patterns
5. Surface uncertainty to FIQ before starting first ship

## References

- Closing Wave summary: `docs/reports/waves/{closing_wave_id}.md`
- Opening Wave Visions: `docs/agents/ship-visions/{opening_wave_id}/`
- CROSS_WAVE_DEPENDENCIES.md
```

---

## Template 11 — Multi-agent parallel merge (Scenario 11)

```markdown
# Handoff: Multi-agent parallel merge

**handoff_id:** merge-{merge_task_id}
**scenario:** 11 (multi-agent parallel merge)
**from_actor:** multiple ({list})
**to_actor:** {merger, typically Orchestrator or designated lead}
**timestamp:** {ISO8601}

## Merge task

{What the merge produces.}

## Parallel actors

- {Actor 1}: completed at {timestamp}
- {Actor 2}: completed at {timestamp}
- {Actor 3}: completed at {timestamp}

## Per-actor outputs

### Actor 1: {role}
{Output summary + reference to full output file}

### Actor 2: {role}
{Output summary + reference to full output file}

### Actor 3: {role}
{Output summary + reference to full output file}

## Conflict detection

- **Conflicts identified:** {N}
- **Conflict 1:** {description}
- **Conflict 2:** {description}

## Conflict resolution strategy

{How conflicts were resolved:
- Priority order (rank actors)
- Discussion Bubble decision (escalate to discussion bubble)
- Escalation (FIQ)
- Other}

## Merge validation

{How merger verified result is coherent. E.g.:
- Cross-reference check against each actor's output
- Critic audit of merged result
- Spot-check against original task spec}

## Residual concerns

- {Concern 1 — minority view or edge case not fully resolved}
- {Concern 2 — minority view or edge case not fully resolved}

## Merged output

{Reference to where merged output lives.}

## References

- Per-actor outputs: {paths}
- Merger's validation log: {path}
```

---

## Skill integration

`parbaughs-handoff-note` skill generates these notes following these templates exactly. Skill enforces:
- All universal fields populated
- All scenario-specific fields populated
- References resolve to actual files
- Timestamp in ISO 8601 UTC
- Handoff stored in correct directory per Scenario

---

*Document authored 2026-05-12. Templates 1-11 cover all 11 handoff scenarios per HANDOFF_PROTOCOL.md.*
