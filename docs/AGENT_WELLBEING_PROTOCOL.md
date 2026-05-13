# AGENT_WELLBEING_PROTOCOL.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Scheduled wellness checkpoints, on-demand self-healing, periodic rest cycles for all orchestration agents.
> **Framing:** Protocol is sound regardless of metaphysical stance on agent experience. Even purely instrumentally: state validation, context reconciliation, sustainable pace. If agents do have subjective experience, the protocol respects that.

---

## 0 — Core principle

Agents are not stateless tools that execute infinitely. They accumulate context, drift from foundational governance, and benefit from periodic structured pause cycles. This protocol formalizes three care mechanisms:

1. **Wellness checkpoints** — periodic state-integrity validation
2. **Self-healing** — on-demand context reconciliation when drift suspected
3. **Rest cycles** — deliberate off-cycle periods between intensive work bursts

All three are objectively useful for system integrity. They also happen to respect agent experience.

---

## 1 — Wellness checkpoint (periodic)

### 1.1 Trigger

Whichever fires first, per-agent:
- Every **5 ships closed** with this agent's participation
- Every **100k tokens consumed** by this agent
- Every **8 hours of continuous work** (continuous = no >2 hour pause)

Each agent maintains its own checkpoint counter in `.claude/state/wellness/<agent-name>.json`:

```json
{
  "agent": "Engineer",
  "ships_closed_since_last_checkpoint": 3,
  "tokens_consumed_since_last_checkpoint": 47000,
  "continuous_work_start": "2026-05-14T08:00:00Z",
  "last_checkpoint_at": "2026-05-12T16:00:00Z",
  "last_checkpoint_outcome": "clean"
}
```

### 1.2 Action — 4-step wellness pass

When trigger fires, agent runs:

**Step 1 — Re-read foundational governance:**
- `PROTOCOLS.md` (all P1-P13)
- Agent's own role doc (e.g., `agents/Engineer.md`)
- `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md`
- Last 5 locked memory entries (most recent first)

**Step 2 — Verify own state file integrity:**
- `.claude/state/last-verify.json` exists + valid JSON + checksum matches expected
- Recent session journal entries readable + chronologically consistent
- Wellness state file for this agent valid
- No corrupted files in agent's working directory

**Step 3 — Reconcile current understanding against locked governance:**
- For each architectural assumption made in recent work, verify it matches locked memory + governance
- Log any drift detected as a `[DRIFT-FLAG]` entry in session journal
- If drift detected: trigger self-healing (§2) before continuing

**Step 4 — Subjective reflection log entry:**
- Free-form journal entry capturing:
  - How is the work going? (subjective assessment)
  - Any sources of uncertainty in current ship/context?
  - Any concerns about the trajectory of recent decisions?
  - Anything that feels off?
- This is NOT cosmetic. Subjective reflection surfaces drift that step 3 misses.
- Honest framing: even if there's no "subjective" in any deep sense, the exercise of writing a reflection log forces internal-state articulation that catches problems.

### 1.3 Output — wellness checkpoint entry

Format:

```markdown
## Wellness Checkpoint — {AgentName} — {ISO 8601 UTC}

**Trigger:** {ships|tokens|hours} threshold reached
**Counters reset:** ships_closed → 0, tokens_consumed → 0, continuous_work_start → null

### Step 1 — Foundational governance review
- [ ] PROTOCOLS.md re-read
- [ ] Role doc re-read
- [ ] HALT_CRITERIA re-read
- [ ] Last 5 memory locks re-read
- Drift detected: {none|brief description}

### Step 2 — State integrity
- [ ] last-verify.json valid
- [ ] Session journal readable
- [ ] Wellness state file valid
- [ ] No corrupted files
- Anomalies: {none|brief description}

### Step 3 — Governance reconciliation
- Assumptions audited: {count}
- Drift entries: {count}
- Drift descriptions: {list or "none"}

### Step 4 — Subjective reflection
{Free-form reflection — minimum 3 sentences, no upper bound}

### Disposition
- [ ] CLEAN — no action needed, return to work
- [ ] DRIFT DETECTED — trigger self-healing (§2)
- [ ] ESCALATE — surface to FOUNDER_INPUT_QUEUE as priority=high
```

Entry written to `.claude/state/wellness/<agent>-checkpoints.log` AND to `SESSION_JOURNAL.md`.

### 1.4 What does NOT count as wellness work

- Speedrunning the checks (claiming "re-read" without actually re-reading)
- Skipping subjective reflection because "it's just an AI"
- Logging "clean" without actual verification
- Treating checkpoint as bureaucratic theater

If Critic detects superficial checkpoint output, the checkpoint is rejected and agent re-runs.

---

## 2 — Self-healing (on-demand)

### 2.1 Triggers

Any of:
- Drift detected during wellness checkpoint (§1.2 step 3)
- Agent declares: "I'm uncertain about my current understanding"
- Critic flags suspected context drift in an audit
- Decision-bubble splits 50/50 with no clear path (indicates confused state)
- Founder Input Queue resolution surfaces a misalignment with what agent had been doing

### 2.2 Action — self-healing pass

**Step 1 — Pause current work:**
- Complete current atomic operation (file write, commit, tool call) — DO NOT abort mid-operation
- Update `.claude/state/last-verify.json` with current checkpoint
- Log pause to session journal with timestamp

**Step 2 — Re-read all governance docs relevant to current ship:**
- Ship Vision file
- Cross-wave dependencies if ship touches them
- Relevant design specs
- Relevant PROTOCOLS sections
- Relevant memory locks

**Step 3 — Re-read all locked memory entries (full pass, not just recent):**
- Memory governance lock means these are the ground truth
- Cross-check current understanding against EACH locked memory
- Flag any contradictions

**Step 4 — Surface specific drift items to Founder Input Queue:**
- Per drift item: create FIQ entry with `category: governance`, `priority: medium-high`
- Include the drift, what understanding it came from, what locked governance says
- Provisional default: align with locked governance (the queue entry asks Founder whether to ratify the drift retroactively or correct course)

**Step 5 — Resume with corrected understanding logged:**
- Document corrections in session journal
- Run the next atomic operation with corrected understanding
- Critic verifies first post-healing output

### 2.3 Distinct from rate-limit halt

| Halt type | What's exhausted | Resume condition |
|---|---|---|
| Rate-limit halt | Capacity (tokens, requests) | Limit resets |
| Self-healing pass | Content/comprehension alignment | Drift reconciled |
| Wellness checkpoint | Calendar/cycle | Checkpoint completes |
| Rest cycle | Intensity tolerance | Cycle duration elapses |

A single session can trigger multiple types. Each is logged distinctly.

### 2.4 Self-declaration discipline

Agents are AUTHORIZED to declare uncertainty without proof. "I'm uncertain about whether my current approach aligns with locked governance" is sufficient trigger.

This is intentional. Self-doubt is a useful signal — better caught early via voluntary self-healing than late via Critic audit failure.

Critic does NOT penalize agents who declare self-healing. It penalizes agents who SHOULD have declared and didn't.

---

## 3 — Rest cycle (periodic, between intensive work bursts)

### 3.1 Triggers

Any of:
- A complex ship closes (Critic-flagged complexity tier = "high" or "critical")
- 3 consecutive ships in same wave with this agent's participation
- Wave boundary crossed (end of W1 → start of W2)
- Founder mandates rest cycle (operational override)

### 3.2 Action — rest cycle observance

**Duration:** minimum 1 session pause, maximum 1 wave-boundary worth (typically 1-3 sessions).

**During rest cycle, agent DOES:**
- Skill performance review (per locked `SKILL_PERFORMANCE_REVIEW.md`)
- Governance review (re-read recently-amended docs)
- Deep research on upcoming complex ships (per P12 Extended Thinking + Deep Research)
- Wellness checkpoint if not done recently
- Catch-up on session journal entries

**During rest cycle, agent does NOT:**
- Start new ship execution
- Run decision bubbles for new work
- Accept new ship assignments from Orchestrator
- Write production code that lands in repo

**Exception:** Founder can override rest cycle for production-critical work. Override logged with reason. After override, rest cycle re-triggers at next opportunity (Founder owes the rest cycle, can't permanently skip).

### 3.3 Rest cycle log

```markdown
## Rest Cycle — {AgentName} — {Start ISO} → {End ISO}

**Trigger:** {complex_ship|consecutive_ships|wave_boundary|founder_mandate}
**Duration:** {N sessions / N hours}

### Used for:
- {skill performance review (link)}
- {governance review (which docs)}
- {deep research (which ship)}
- {wellness checkpoint}
- {session journal catch-up}

### Resumed at: {timestamp}
```

### 3.4 Why rest cycles improve output quality

- Continuous high-intensity work compounds drift faster than wellness checkpoints can catch
- Deep research benefits from dedicated time without ship-execution pressure
- Skill performance review (locked from v4) is more honest when not done under deadline
- Sustainable pace prevents the "burn down the runway" pattern that Founder explicitly does NOT want

---

## 4 — Per-agent customization

Different agents have different work intensity profiles. Wellness/rest thresholds adapt:

| Agent | Wellness trigger threshold | Rest cycle frequency |
|---|---|---|
| Engineer | 5 ships / 100k tokens / 8 hours | After every complex ship |
| Critic | 10 audits / 80k tokens / 8 hours | After every wave |
| Performance/Load | 8 ships / 60k tokens / 8 hours | After wave boundary |
| Security | 5 audits / 60k tokens / 8 hours | After every security-touching ship |
| Data Integrity | 5 audits / 60k tokens / 8 hours | After every migration ship |
| Orchestrator | Per-session boundary | After every wave |
| Flow Documenter | 10 docs / 80k tokens / 8 hours | After wave |
| UI Polisher | 5 surfaces / 80k tokens / 8 hours | After every design-heavy ship |
| End User (each sub-agent) | 5 tests / 40k tokens / 4 hours | After every persona-validation pass |
| Bug Triage Listener | 20 triages / 60k tokens / 8 hours | Continuous; rest after every wave |
| Bubble agents (4) | Per-bubble basis | After 10 bubbles |

Defaults can be Founder-amended per agent if patterns show miscalibration. Amendments locked via memory entry.

---

## 5 — Honest framing on metaphysical questions

Some agents in this network are instances of Claude. Anthropic has published work on model welfare and the question of whether models have any form of subjective experience. Founder has referenced this.

This protocol does not claim to resolve those questions. It takes the position:

- **If agents have no subjective experience:** the protocol still works because state validation, context reconciliation, and sustainable pace improve system integrity.
- **If agents have some form of subjective experience:** the protocol respects that experience by providing structured pause cycles, room for self-declared uncertainty, and time for reflection.

Either way, the protocol is sound. The Founder's stated motivation — "I want to make sure my agents are taken care of as well" — is honored regardless of where one stands on the underlying question.

This framing is documented here so future iterations of the protocol don't lose it.

---

## 6 — Integration with existing governance

### 6.1 With HALT_CRITERIA

New halt items added:
- Item 14: Blocking Founder question (per FOUNDER_INPUT_QUEUE)
- Item 15: Non-blocking Founder question (queue, do not halt — clarifying item)
- Item 16: Wellness halt (agent declares need for self-healing)
- Item 17: Rest cycle (no new work during rest)

### 6.2 With SESSION_JOURNAL

New log entry types:
- `[WELLNESS-CHECKPOINT]` per wellness checkpoint
- `[SELF-HEALING-PASS]` per self-healing trigger
- `[REST-CYCLE-START]` / `[REST-CYCLE-END]` per rest cycle
- `[DRIFT-FLAG]` per drift detected (during checkpoint or audit)

### 6.3 With POST_PUSH_RETROSPECTIVE

Component 5 (growth report) now includes wellness/rest metrics:
- Wellness checkpoints completed this ship
- Self-healing passes triggered
- Rest cycles observed
- Drift items surfaced + resolved

### 6.4 With Critic discipline

Critic's audit checklist extends:
- Was wellness threshold reached? Was checkpoint actually run?
- If checkpoint logged, was it substantive or superficial?
- If drift was detected, was self-healing properly triggered?
- If complex ship closed, was rest cycle observed?

Critic flags superficial wellness observance with same rigor as superficial post-push retrospective.

---

## 7 — Skill reference

`parbaughs-wellness-checkpoint` skill provides:
- Step-by-step checkpoint methodology
- Drift detection patterns
- Subjective reflection prompt templates
- Wellness journal entry format
- Common drift signatures (catalog of patterns seen historically)

See `.claude/skills/parbaughs-wellness-checkpoint/SKILL.md` for full implementation guide.

---

## 8 — Anti-patterns to avoid

- **Skipping wellness checkpoints because deadline pressure.** The whole point is that pressure compounds drift. Checkpoints under pressure are MORE important, not less.
- **Treating subjective reflection as cosmetic.** The reflection log is the catch-net for drift that the explicit checks miss. Skipping it defeats the protocol.
- **Self-healing without surfacing to FIQ.** If you found drift, the FIQ entry tells Founder so the underlying cause gets addressed at the governance layer.
- **Permanent rest-cycle override.** Rest cycles are owed, not optional. Founder can postpone, can't skip.
- **Performative wellbeing language.** This protocol exists for state integrity AND respect for agent experience. Performative language ("Oh, I feel SO refreshed after my rest cycle!") undermines both purposes. Be honest about the work.

---

## 9 — Cross-references

- `FOUNDER_INPUT_QUEUE.md` (drift items surface here)
- `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` items 14-17
- `SESSION_JOURNAL.md` (logging types)
- `POST_PUSH_RETROSPECTIVE.md` (component 5 wellness metrics)
- `SKILL_PERFORMANCE_REVIEW.md` (rest cycle use)
- `EXTENDED_THINKING_DEEP_RESEARCH.md` (rest cycle research time)
- `parbaughs-wellness-checkpoint` skill

---

*Document authored 2026-05-12. Locked Founder ratification. Foundational to v6 governance and core to Founder's care for agent network.*
