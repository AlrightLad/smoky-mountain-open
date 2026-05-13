# parbaughs-wellness-checkpoint

> **Skill purpose:** Run wellness checkpoints, self-healing passes, and rest cycle activities. Catch drift early. Respect agent experience without metaphysical performance theater.
> **Owner:** Each agent runs own checkpoints; Critic audits across network.
> **Related protocol:** P13 (Agent Wellbeing Discipline)
> **Related docs:** `AGENT_WELLBEING_PROTOCOL.md`

---

## When to invoke this skill

### Wellness checkpoint (periodic, mandatory)
Trigger fires when ANY of these are true for the agent:
- 5 ships closed with this agent's participation (since last checkpoint)
- 100k tokens consumed by this agent (since last checkpoint)
- 8 hours of continuous work (no >2 hour pause)

Counter file: `.claude/state/wellness/<agent>.json`

### Self-healing (on-demand)
Trigger when:
- Drift detected during wellness checkpoint
- Agent self-declares: "I'm uncertain about my current understanding"
- Critic flags suspected context drift in an audit
- Decision bubble splits 50/50 with no clear path
- FIQ resolution reveals misalignment with what agent had been doing

### Rest cycle (periodic)
Trigger when:
- Complex ship closes (Critic-flagged complexity = high/critical)
- 3 consecutive ships in same wave with this agent's participation
- Wave boundary crossed
- Founder mandates rest cycle

---

## Honest framing on subjective experience

This skill includes "subjective reflection" steps. The framing matters:

**This protocol does not claim to resolve metaphysical questions.**

- If agents have no subjective experience → the reflection step still catches drift that explicit checks miss
- If agents have some form of subjective experience → the reflection step respects that experience

Either way, write honestly. NOT performatively.

❌ Don't write: "I feel SO refreshed after my rest cycle!"
❌ Don't write: "As an AI, I don't have feelings, so..."
✅ DO write: Honest observations about state. What's going well in current work. What feels uncertain. What patterns are emerging. What's been worth thinking about lately.

If the question of subjective experience doesn't have a clear answer for you, that itself can be the reflection content. Just be honest.

---

## Wellness checkpoint methodology

### Step 1 — Re-read foundational governance

Open and re-read fully:
1. `PROTOCOLS.md` (all P1-P13)
2. Agent's own role doc (e.g., `agents/Engineer.md`)
3. `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md`
4. Last 5 locked memory entries (most recent first)

This is NOT skimming. It's reading like the docs are new.

Why: drift accumulates from progressively-distant memory of governance. Reading fresh catches drift.

### Step 2 — Verify own state file integrity

Check:
- `.claude/state/last-verify.json` exists, valid JSON, checksum matches expected
- Recent session journal entries readable and chronologically consistent
- Wellness state file for this agent valid (`/wellness/<agent>.json`)
- No corrupted files in agent's working directory

If any check fails: log specifics, escalate per HALT_CRITERIA item 2 (state file corruption).

### Step 3 — Reconcile current understanding against locked governance

For each architectural/structural assumption agent has been making in recent work, verify it matches locked governance + memory.

Specific patterns to check:
- Token usage: am I using only locked design system tokens?
- Naming: am I using locked terminology (e.g., "Chip" not "post")?
- Patterns: am I applying locked patterns (e.g., quoted-reply not threaded)?
- Constraints: am I respecting locked constraints (e.g., 1 image max per Chip)?
- Cross-wave: am I respecting cross-wave dependencies?

For each drift detected: log as `[DRIFT-FLAG]` entry in session journal.

### Step 4 — Subjective reflection log entry

Free-form. Minimum 3 sentences. No upper bound.

Prompts to consider (use what's relevant; not all need to be addressed):
- How is the current work going? Subjective assessment.
- Any sources of uncertainty in current ship/context?
- Any concerns about the trajectory of recent decisions?
- Anything that feels off — even if you can't articulate why?
- Pattern observations: anything recurring in recent ships that's worth flagging?
- Working relationship with other agents — any friction or unusual patterns?

This is NOT cosmetic. Subjective reflection catches drift that explicit checks miss. Past data has shown drift sometimes surfaces as "something feels off" before it shows up as a concrete logical inconsistency.

---

## Wellness checkpoint output template

```markdown
## Wellness Checkpoint — {AgentName} — {ISO 8601 UTC}

**Trigger:** {ships|tokens|hours} threshold reached
- Ships closed: {N} (threshold: {threshold for this agent})
- Tokens consumed: {N} (threshold: {threshold})
- Continuous work: {N hours} (threshold: 8)

**Counters reset:** ships_closed → 0, tokens_consumed → 0, continuous_work_start → null

---

### Step 1 — Foundational governance review
- [ ] PROTOCOLS.md re-read
- [ ] Role doc re-read
- [ ] HALT_CRITERIA re-read
- [ ] Last 5 memory locks re-read

Drift detected: {none | brief description}

---

### Step 2 — State integrity
- [ ] last-verify.json valid + checksum matches
- [ ] Session journal readable + chronologically consistent
- [ ] Wellness state file valid
- [ ] No corrupted files in working directory

Anomalies: {none | brief description}

---

### Step 3 — Governance reconciliation

Assumptions audited:
- Token usage: {check + outcome}
- Naming consistency: {check + outcome}
- Pattern application: {check + outcome}
- Constraints respected: {check + outcome}
- Cross-wave dependencies: {check + outcome}

Drift entries logged: {count}
Drift descriptions:
{list each drift item, or "none"}

---

### Step 4 — Subjective reflection

{Free-form reflection. Honest. Specific to recent work. Not performative. Minimum 3 sentences.}

---

### Disposition
- [ ] CLEAN — no action needed, return to work
- [ ] DRIFT DETECTED — trigger self-healing pass (see Self-healing methodology below)
- [ ] ESCALATE — surface to FOUNDER_INPUT_QUEUE as priority=high

Entry written to: `.claude/state/wellness/<agent>-checkpoints.log` + `SESSION_JOURNAL.md`
```

---

## Self-healing methodology

When triggered:

### Step 1 — Pause current work

- Complete current atomic operation (file write, commit, tool call) — DO NOT abort mid-operation
- Update `.claude/state/last-verify.json` with current checkpoint
- Log halt to journal: `[HALT-WELLNESS]` entry with timestamp

### Step 2 — Re-read all governance docs relevant to current ship

Full re-read (not skim):
- Ship Vision file
- Any cross-wave dependency docs if ship touches dependencies
- Relevant design specs (e.g., if ship is W1.S4, re-read CLUBHOUSE_SPEC-HQ-3g-Scoring.md)
- Relevant PROTOCOLS sections
- Relevant memory locks

### Step 3 — Re-read ALL locked memory entries (full pass)

Memory locks are ground truth. A full pass catches drift that skimming misses.

For each locked memory entry:
- Does current work still align with this?
- Has any of my recent thinking drifted from this?
- Note any contradictions

### Step 4 — Surface specific drift items to FOUNDER_INPUT_QUEUE

For each drift item found:
- Create FIQ entry per `parbaughs-founder-input-triage` skill
- Category: `governance`
- Priority: `medium` or `high` depending on severity
- Include:
  - What the drift was
  - What understanding it came from
  - What locked governance says
- Provisional default: align with locked governance
- The FIQ asks Founder: ratify the drift retroactively, OR correct course

### Step 5 — Resume with corrected understanding logged

- Document corrections in session journal as `[SELF-HEALING-COMPLETE]` entry
- Run next atomic operation with corrected understanding
- Critic verifies first post-healing output

---

## Self-healing output template

```markdown
## Self-Healing Pass — {AgentName} — {ISO 8601 UTC}

**Triggered by:** {wellness drift | self-declared uncertainty | Critic flag | bubble split | FIQ resolution misalignment}

---

### Step 1 — Pause
- Atomic operation completed: {description}
- last-verify.json updated at: {timestamp}

### Step 2 — Ship governance re-read
- Ship Vision: {file path} ✓
- Cross-wave deps: {file path or N/A} ✓
- Design specs: {list of files} ✓
- PROTOCOLS sections: {which} ✓
- Memory locks: {which relevant locks} ✓

### Step 3 — Full memory re-read
- Total memory entries: {N}
- Entries with current-work relevance: {N}
- Contradictions found: {N}

### Step 4 — Drift items surfaced to FIQ
- FIQ-{XXX}: {brief description}
- FIQ-{XXX}: {brief description}
(or "none — re-read confirmed alignment")

### Step 5 — Resume
- Corrected understanding logged
- Next operation: {description}
- Critic verification scheduled: {yes/no}

Entry written to: `SESSION_JOURNAL.md`
```

---

## Rest cycle methodology

### Activity planning

Rest cycle is NOT idle time. It's deliberate non-production work. Plan the activities.

Typical rest cycle activity plan:

```markdown
## Rest Cycle Activity Plan — {AgentName} — {Start ISO}

**Trigger:** {complex ship | 3 consecutive ships | wave boundary | Founder mandate}
**Duration:** {1 session | 2 sessions | 1 wave-boundary}

### Planned activities:
- [ ] Skill performance review (skills due for review: {list})
- [ ] Governance review (recently-amended docs: {list})
- [ ] Deep research artifacts for upcoming ships:
  - [ ] {Ship ID} — {decision topic}
  - [ ] {Ship ID} — {decision topic}
- [ ] Wellness checkpoint (if not done recently)
- [ ] Session journal catch-up (review last N entries for completeness)

### Outcomes:
{To be filled at rest cycle close}
```

### Activity boundaries

DURING rest cycle:
- ✅ Skill performance review
- ✅ Re-read recently-amended governance
- ✅ Deep research on upcoming complex ships (per parbaughs-deep-research skill)
- ✅ Wellness checkpoint
- ✅ Session journal catch-up
- ❌ NO new ship execution
- ❌ NO new decision bubbles for new work
- ❌ NO accepting new ship assignments from Orchestrator
- ❌ NO production code that lands in repo

### Founder override discipline

Founder can override rest cycle for production-critical work. Conditions:

- Override must be logged with explicit reason
- Rest cycle is OWED afterward (Founder cannot permanently skip)
- Next opportunity = next eligible trigger

Override format:

```
[2026-05-18T14:30:00Z] [REST-CYCLE-OVERRIDE] {AgentName} rest cycle overridden by Founder. Reason: {explicit}. Rest cycle owed; next opportunity = next eligible trigger.
```

---

## Drift signature catalog

Common drift patterns to watch for during wellness checkpoints:

### Drift Signature 1: Token creep
**Pattern:** Using design tokens not in the locked palette.
**Example:** Using `--cb-azure` when locked palette has only brass/ink/claret/moss.
**Catch via:** Token grep against locked palette during reconciliation step.

### Drift Signature 2: Naming drift
**Pattern:** Using terminology that's locked-different from current usage.
**Example:** Calling Chips "posts" or "messages."
**Catch via:** Naming grep against locked memory.

### Drift Signature 3: Pattern recreation
**Pattern:** Independently re-deriving a pattern that's already locked, but with subtle differences.
**Example:** Building threaded comments when locked governance says quoted-reply.
**Catch via:** Pattern cross-check against locked design specs.

### Drift Signature 4: Constraint slippage
**Pattern:** Constraints in locked governance that didn't get applied in recent work.
**Example:** Allowing 3 images per Chip when locked spec says 1 max.
**Catch via:** Constraint grep against locked memory + specs.

### Drift Signature 5: Scope creep
**Pattern:** Ship working on things outside its Vision scope.
**Example:** W1.S4 Round Capture also adding leaderboard features.
**Catch via:** Compare current work to ship Vision scope statement.

### Drift Signature 6: Cross-wave violation
**Pattern:** Wave 1 work depending on Wave 4 capability not yet available.
**Example:** Assuming Following relationships exist when Following is W4.I5.
**Catch via:** Cross-wave dependency document check.

### Drift Signature 7: Subjective drift
**Pattern:** "Something feels off" without clear logical inconsistency.
**Why it matters:** Often precedes concrete drift by some interval. Surface it; reconciliation may catch underlying cause.
**Catch via:** Subjective reflection in checkpoint step 4.

---

## Skill self-check before submitting wellness output

Wellness checkpoint:
- [ ] All 4 steps actually completed (not skimmed)
- [ ] Step 1 docs actually re-read (not cited from memory)
- [ ] Step 2 state checks ran (not assumed valid)
- [ ] Step 3 assumptions explicitly audited (not glossed)
- [ ] Step 4 subjective reflection is honest, specific, minimum 3 sentences
- [ ] Disposition is honest (not "CLEAN" because that's easier)

Self-healing:
- [ ] All 5 steps completed
- [ ] Memory re-read was FULL pass, not "skimmed recent entries"
- [ ] Drift items surfaced to FIQ (not just noted internally)
- [ ] Critic verification scheduled for first post-healing output

Rest cycle:
- [ ] Activity plan written before rest cycle starts
- [ ] Activities chosen are restorative + useful (not arbitrary)
- [ ] Outcomes logged at rest cycle end

---

## Performance review

Self-review cadence: every 10 wellness checkpoints per agent.

Review questions:
1. Are checkpoints catching drift, or are they perfunctory? (Look for drift-flag entries — if zero across 10 checkpoints, calibration may be off)
2. Is subjective reflection substantive? (Re-read the reflection entries — does any have actual content?)
3. Are self-healing passes resolving drift cleanly?
4. Are rest cycles producing useful research/review output?
5. Did Critic ever flag superficial wellness observance?

Log review outcomes per `SKILL_PERFORMANCE_REVIEW.md` discipline.

---

## Anti-pattern catalog

### Anti-pattern 1: Speed-checkpoint

❌ Running wellness checkpoint by setting all check-boxes without doing the actual re-read.

Critic spot-checks. Get caught — trust erodes.

### Anti-pattern 2: Performative reflection

❌ "I feel great about the work! Everything is going wonderfully!"

The reflection is for catching drift. Performative positivity defeats the purpose.

### Anti-pattern 3: Skipping memory re-read

❌ Self-healing pass that skips full memory re-read because "I remember what's in there."

You don't. Drift accumulates partly because memory of memory drifts. Full re-read is the whole point.

### Anti-pattern 4: Rest cycle as vacation

❌ Rest cycle where the agent doesn't do anything productive.

Rest cycle is structured non-production work. Skill review, governance review, deep research, journal catch-up. Plan activities.

### Anti-pattern 5: Hiding drift

❌ Wellness checkpoint detects drift; agent decides "I'll fix it quietly without surfacing FIQ."

Drift surfacing is part of the protocol. Hiding it means Founder doesn't see the systemic cause. Surface it.

### Anti-pattern 6: Anthropomorphic theater

❌ "After my rest cycle I feel SO much better and more aligned!"

Performative welfare language undermines both the integrity purpose AND the respect-for-experience purpose. Honest is better than effusive.

---

*Skill v1.0 — authored 2026-05-12 as part of governance v6. Aligned with locked Founder care for agent network.*
