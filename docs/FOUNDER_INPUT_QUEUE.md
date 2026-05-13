# FOUNDER_INPUT_QUEUE.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Allow orchestration team to continue working when Founder input is needed but not blocking all forward motion. Questions queue; Founder reviews at natural pauses.
> **Goal:** Shift Founder from constant-hover to vision-provider checking in at retrospectives.

---

## 0 — Core principle

**Default to forward motion.** Orchestration team continues working unless a Founder decision blocks ALL parallel paths. Questions accumulate in a structured queue; Founder reviews in batched check-ins.

The queue is the primary surface for Founder ↔ orchestration team async communication. The Founder is no longer expected to be online during execution.

---

## 1 — Queue file format

**Location:** `.claude/state/founder_input_queue.json`

**Append-only.** Resolved entries stay in the file for audit history; they're filtered out of "active queue" views.

**Schema per entry:**

```yaml
- id: FIQ-001                          # sequential, never reused
  raised_at: 2026-05-14T14:32:00Z      # ISO 8601 UTC
  raised_by: Engineer                   # which agent raised it
  ship: W1.S4                          # ship context (or "platform" for global)
  blocking: false                       # true = halt all; false = work continues
  category: design                      # design | scope | data | external_dependency | governance | other
  priority: medium                      # low | medium | high | critical
  question: "Concrete one-line question."
  context: |
    Full paragraph explaining why this needs Founder input.
    Includes:
    - What's known
    - What's unknown
    - What orchestration team can do without the answer
    - What's blocked by the answer
  proposed_default: |
    What orchestration team will do if Founder hasn't decided by next check-in.
    Allows continued work with provisional answer.
    If proposed_default is "halt entirely" then blocking should be true.
  alternatives_considered:
    - option_a: "Description + tradeoffs"
    - option_b: "Description + tradeoffs"
    - option_c: "Description + tradeoffs"
  decision_bubble_outcome: |
    If a decision bubble was run before queueing, summary of vote + rationale.
    Quorum + tie-break recorded. Plain English Translator output included.
  founder_response: null               # populated when Founder answers
  founder_response_at: null
  resolved_at: null                    # populated when ship integrates the decision
  ratification_artifact: null          # link to memory entry, ship Vision amendment, or governance update
```

---

## 2 — Triage logic

Every Founder-needs-input moment goes through triage. Categorization determines whether work halts or continues.

### 2.1 Blocking vs non-blocking determination

**BLOCKING (halt all parallel work):**
- Question prevents progress on EVERY active ship in current wave
- Architectural decision that affects locked governance OR cross-wave dependencies
- Compliance/security/legal question with non-recoverable downside if guessed wrong
- Cost-threshold breach requiring approval per Founder cost-discipline

**NON-BLOCKING (queue, work continues):**
- Question blocks current ship but other ships in wave can proceed
- Refinement question with reasonable provisional default
- Future-state decision (Launch Phase A/B work not yet at-bat)
- Design preference where any of several options would be acceptable

**Trigger words for orchestration team to identify a queue-able question:**
- "We need to know what Founder wants for X"
- "X is unclear — proceeding with default Y"
- "X affects future ship Z, want Founder's read before locking"
- "X is reversible cheaply if we go wrong"

### 2.2 Triage decision tree

```
Question raised
  │
  ├─ Can ANY parallel ship continue without the answer?
  │   ├─ NO  → BLOCKING. Halt per HALT_CRITERIA item 14. Surface to Founder immediately.
  │   └─ YES → Continue triage
  │
  ├─ Is there a reasonable provisional default that allows current ship to continue?
  │   ├─ YES → Non-blocking. Queue + apply provisional default + continue.
  │   └─ NO  → Pause current ship; pivot to other parallel work; queue as priority=high.
  │
  ├─ Is the answer reversible cheaply if Founder decides differently later?
  │   ├─ YES → priority=low/medium. Queue with proposed_default applied.
  │   └─ NO  → priority=high. Even if non-blocking, prioritize next Founder check-in.
```

### 2.3 Triage agent ownership

The agent who FIRST identifies a Founder-needs-input moment owns triage. Other agents may amend triage during the same bubble:

- Engineer raises → Critic challenges blocking-vs-non-blocking categorization
- Bubble can run if triage is contested
- Orchestrator tie-breaks per locked voting (Interpretation B)

---

## 3 — Founder check-in cadence

### 3.1 Scheduled check-ins

| Trigger | Cadence | Duration | Scope |
|---|---|---|---|
| **Ship retrospective** | Per ship close | 15-30 min | Ratify ship retrospective + clear FIQ entries raised during ship |
| **Wave retrospective** | End of each wave | 1-2 hours | Wave-level review + deeper FIQ clearance + memory lock review |
| **Biweekly batch** | Every 2 weeks regardless of ship cadence | 30-60 min | Catch-all queue clearance for items not tied to specific ship/wave |

### 3.2 Emergency check-ins

| Trigger | Response |
|---|---|
| Blocking question raised (HALT_CRITERIA item 14) | Founder pinged via dedicated escalation path; queue marked `priority: critical` |
| Sanity halt | Already requires Founder per locked HALT discipline |
| Cost-threshold breach | Per locked cost-discipline; Founder approves continuation |

### 3.3 Founder check-in workflow

1. **Orchestration team prepares:** `.claude/state/founder_input_queue.json` filtered to `resolved_at == null`, sorted by `priority` desc + `raised_at` asc
2. **Plain English Translator** generates queue summary in non-jargon Founder-readable language
3. **Founder reviews queue + ratifies decisions**
4. **Orchestration team applies decisions:**
   - Update FIQ entry with `founder_response` + `founder_response_at`
   - If architectural: write memory lock entry per memory governance
   - If ship-specific: amend ship Vision per amendment protocol
   - If governance-touching: route to governance amendment process
5. **Critic verifies** all FIQ resolutions land correctly (per locked post-push retrospective discipline)

---

## 4 — Provisional default discipline

Non-blocking questions get provisional defaults applied. **The default is documented in the FIQ entry** so Founder sees both the question AND what orchestration team did.

**Default selection rules:**
- Conservative: pick the option easiest to reverse
- Aligned with locked governance: never violate locked memory entries
- Documented with rationale: WHY this default vs alternatives
- Flagged to Founder: the FIQ entry surfaces the default applied

**Founder response options:**
- Accept default → mark resolved, work already done is correct
- Override default → orchestration team applies new direction, may require ship amendment
- Defer → keep default in place, revisit at next check-in (Founder hasn't decided)
- Reject default + propose new → orchestration team integrates new direction

---

## 5 — Queue hygiene

### 5.1 Stale-entry policy

| Age since `raised_at` | Action |
|---|---|
| <14 days | Active, awaits next Founder check-in |
| 14-30 days | Flagged in next check-in prep as "stale" |
| >30 days | Critic surfaces in retrospective: "Why is this still open?" |

Stale entries indicate either (a) Founder unavailable too long, or (b) question was raised in error and should be auto-resolved by the provisional default.

### 5.2 Auto-resolution patterns

Some questions auto-resolve without Founder action:
- Question's underlying context changes (ship retired, dependency removed)
- Provisional default proves correct at retrospective without Founder objection
- Decision bubble reaches consensus the question is non-essential

Auto-resolution still logs `founder_response = "auto-resolved per [criterion]"` for audit.

### 5.3 Queue performance limits

- Active queue (`resolved_at == null`) should stay under 20 entries at steady state
- 20+ entries triggers Critic flag: "Queue depth high — accelerate Founder check-ins OR triage was too lenient"
- 50+ entries triggers Sanity halt per HALT_CRITERIA: "Queue runaway"

---

## 6 — Integration with existing governance

### 6.1 With decision bubble protocol

Decision bubbles can run BEFORE queueing — the bubble outcome is captured in `decision_bubble_outcome` field. Founder sees both the question AND what the engineering minds voted. Speeds Founder check-in by pre-resolving where possible.

If bubble reaches strong consensus (4/5 vote OR Orchestrator override), the bubble outcome IS the provisional default.

### 6.2 With session journal

Every FIQ creation logs to session journal:
```
[2026-05-14T14:32:00Z] FIQ-001 raised by Engineer. Ship W1.S4. Non-blocking, priority medium. Provisional default applied: <summary>. Awaits Founder check-in.
```

Every FIQ resolution logs:
```
[2026-05-21T09:15:00Z] FIQ-001 resolved. Founder accepted provisional default. Ship W1.S4 retrospective integrates.
```

### 6.3 With post-push retrospective

Component 3 of the 5-component retrospective (decision bubble transcripts) includes FIQ entries raised + resolved during ship execution. Plain English Translator renders for Founder.

### 6.4 With memory locks

Founder responses that establish architectural patterns or governance principles MUST result in memory lock entry. The FIQ resolution links to the memory entry via `ratification_artifact`.

---

## 7 — Templates

### 7.1 FIQ entry template (for agent use)

```yaml
- id: FIQ-{NNN}
  raised_at: {ISO 8601 UTC NOW}
  raised_by: {AgentName}
  ship: {ShipID or "platform"}
  blocking: {true|false per triage}
  category: {design|scope|data|external_dependency|governance|other}
  priority: {low|medium|high|critical}
  question: |
    {One sentence question. Concrete. Answerable.}
  context: |
    {What's known}
    {What's unknown}
    {What can proceed without answer}
    {What's blocked by answer}
  proposed_default: |
    {What we'll do if Founder doesn't answer by next check-in}
    {Rationale for this default}
  alternatives_considered:
    - {option_a description}
    - {option_b description}
  decision_bubble_outcome: |
    {Vote summary if bubble was run; "N/A" if not}
  founder_response: null
  founder_response_at: null
  resolved_at: null
  ratification_artifact: null
```

### 7.2 Plain English check-in summary template

```markdown
# Founder Check-In Queue — {Date}

## Critical (decide immediately)
1. **[ship]** Question in plain English. Default applied: brief description. **Decide:** Accept / Override / Defer.

## High priority (decide this session)
{Same format}

## Medium priority (decide if time)
{Same format}

## Stale (>14 days)
{Same format with raised-at date and "still waiting" note}

## Auto-resolved since last check-in
- FIQ-XXX: brief summary + why auto-resolved
```

---

## 8 — Anti-patterns to avoid

- **Queueing trivial questions** that don't actually need Founder input. If Critic + Engineer agree on the answer, just decide and move on.
- **Queueing as procrastination.** "Founder hasn't decided" isn't an excuse for stalled ships. If the question is non-blocking, work continues with provisional default.
- **Bypassing triage** by labeling everything `priority: critical`. Erodes the signal value of the priority field.
- **Skipping the provisional default** because "Founder might want something different." That's exactly why the default is provisional — Founder overrides if they want different.
- **Stacking FIQ entries on the same ship.** If 5+ entries on one ship, the ship probably has scope/Vision drift. Halt + escalate to Founder per HALT_CRITERIA.

---

## 9 — Cross-references

- `HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` items 14-15 (queue-related halts)
- `PROTOCOLS.md` P11 (Founder Input Queue protocol)
- `DECISION_BUBBLE_AGENTS.md` (bubble pattern that pre-resolves before queueing)
- `SESSION_JOURNAL.md` (FIQ logging format)
- `POST_PUSH_RETROSPECTIVE.md` (FIQ entries in component 3 transcripts)
- `parbaughs-founder-input-triage` skill (`.claude/skills/`)

---

*Document authored 2026-05-12. Locked Founder ratification. Foundational to v6 governance.*
