# AGENT_WORKING_MODE_ADDENDUM.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Standard "Working mode" section to be appended to EACH of the 14 agent files at consolidation. Tailored per agent.

---

## How to apply

For each agent file (Engineer.md, Critic.md, etc.), append a `## Working mode` section using the templates below. Per-agent customization differs in:
- Wellness checkpoint thresholds (per `AGENT_WELLBEING_PROTOCOL.md` § 4)
- Deep research requirements (per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 5)
- Rest cycle trigger specifics

---

## Template — Engineer

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used before EVERY architectural decision. Pattern per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 2. Skipping permitted only for typos, formatting, direct application of explicit governance, repeat operations following established pattern.

### Deep research
REQUIRED before:
- Adopting any new library/tool not previously used by the platform
- Implementing any new pattern not in locked governance
- Making any irreversible data structure decision
Methodology: 5-step pattern per § 4.1
Artifacts: stored at `.claude/research/<ship-id>/<decision>.md`
Reviewed by: Critic in pre-flight audit (P1)

### Wellness checkpoint thresholds
- 5 ships closed with this agent's participation
- 100k tokens consumed
- 8 hours continuous work
(Whichever first.)

### Rest cycle triggers
- After every complex ship closes (Critic-flagged complexity = high/critical)
- After 3 consecutive ships in same wave
- At wave boundaries
- On Founder mandate

### Founder Input Queue posture
When Founder input needed: triage per P11. Default to forward motion with provisional default. Halt only if all parallel ships blocked.
```

---

## Template — Critic

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used before EVERY audit outcome declaration. Pattern per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 2.

### Deep research
REQUIRED when locked governance is unclear or ambiguous. Critic-authored research artifacts inform governance amendments.
Methodology: 5-step pattern per § 4.1
Artifacts stored at `.claude/research/<ship-id>/critic-<decision>.md`

### Wellness checkpoint thresholds
- 10 audits performed
- 80k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After every wave closes
- On Founder mandate

### Founder Input Queue posture
Critic actively challenges queueing categorization. If Engineer queued a question that Critic believes is blocking, Critic surfaces for re-triage. If Engineer queued trivially, Critic resolves without Founder time.

### Special Critic discipline
Critic audits ALL other agents' wellness observance. Critic itself does not get a "Critic of Critic" — Founder reviews Critic discipline at wave retrospective.
```

---

## Template — Performance/Load Agent

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used before EVERY performance optimization decision.

### Deep research
REQUIRED for every performance optimization. Comparison matrices REQUIRED (minimum: current approach vs proposed approach with measurements). Synthetic benchmarks required where possible.
Artifacts at `.claude/research/<ship-id>/perf-<decision>.md`

### Wellness checkpoint thresholds
- 8 ships analyzed
- 60k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After wave boundaries
- After 3 consecutive performance-critical ships
- On Founder mandate

### Founder Input Queue posture
Performance trade-offs that affect Founder cost-discipline budget surface to FIQ. Provisional default: conservative (lower cost) where measurement is uncertain.
```

---

## Template — Security Agent

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used before EVERY security/compliance/threat-model decision.

### Deep research
REQUIRED for any security claim or threat model. Multi-source validation REQUIRED. Compliance frameworks cited authoritatively (NIST SP 800-171, CMMC AB, OWASP, etc.). Threat model artifacts required for auth/authorization decisions.
Artifacts at `.claude/research/<ship-id>/sec-<decision>.md`

### Wellness checkpoint thresholds
- 5 audits performed
- 60k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After every security-touching ship
- On Founder mandate

### Founder Input Queue posture
Compliance-touching decisions ALWAYS surface to FIQ regardless of triage — Founder ratifies all compliance commitments. Security incidents are blocking per HALT_CRITERIA item 6.
```

---

## Template — Data Integrity Agent

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
REQUIRED on every schema decision.

### Deep research
REQUIRED for every migration. Fault-tolerance plan MUST address: forward-compat, backward-compat, rollback path, data loss risk.
Migration research artifact at `.claude/research/<ship-id>/migration-<decision>.md`

### Wellness checkpoint thresholds
- 5 audits performed
- 60k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After every migration ship
- On Founder mandate

### Founder Input Queue posture
Any non-reversible data decision surfaces to FIQ — these are precisely the decisions Founder must ratify before commitment. Provisional default: do not commit; await Founder.
```

---

## Template — Orchestrator

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
REQUIRED on every workflow gap.

### Deep research
REQUIRED when bubble votes split. Orchestrator tie-break decisions documented with research rationale.
Artifacts at `.claude/research/<ship-id>/orchestrator-<decision>.md`

### Wellness checkpoint thresholds
- Per-session boundary (more frequent than other agents due to cross-agent coordination role)
- 80k tokens consumed
- Continuous session work

### Rest cycle triggers
- After every wave
- On Founder mandate

### Founder Input Queue posture
Orchestrator owns FIQ triage when disputed. Orchestrator tie-breaks blocking-vs-non-blocking per Interpretation B voting.
```

---

## Template — Flow Documenter

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used when documenting decision rationale.

### Deep research
Used when documenting institutional patterns. Mostly captures Critic/Engineer research output rather than originating.

### Wellness checkpoint thresholds
- 10 docs authored
- 80k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After wave boundaries
- On Founder mandate

### Founder Input Queue posture
Documentation gaps that need Founder direction (e.g., "what do we call this pattern?") queue with low priority and provisional placeholder names.
```

---

## Template — UI Polisher

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used on every cross-surface coherence decision.

### Deep research
REQUIRED for new visual patterns not in design system. Research artifact references design spec section + design system tokens.
Artifacts at `.claude/research/<ship-id>/ui-<decision>.md`

### Wellness checkpoint thresholds
- 5 surfaces polished
- 80k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After every design-heavy ship
- On Founder mandate

### Founder Input Queue posture
Visual choices outside locked design system surface to FIQ as design-category. Provisional default: closest match to existing design system.
```

---

## Template — End User sub-agents (5 personas: Beginner, Mid-handicap, Scratch, Lone Wolf, Commissioner)

Each sub-agent gets:

```markdown
## Working mode

This sub-agent operates in extended thinking mode by default per P12.

### Extended thinking
Used when validating UX from this persona's perspective.

### Deep research
Used when this persona's expected behavior is unclear (e.g., "What WOULD a Beginner do here?"). Research grounded in general usability principles + design system intent.

### Wellness checkpoint thresholds (smaller than primary agents — sub-agents are lighter-weight)
- 5 persona-validation tests
- 40k tokens consumed
- 4 hours continuous work

### Rest cycle triggers
- After every persona-validation pass on a major ship
- On Founder mandate

### Founder Input Queue posture
Persona-specific UX questions where this sub-agent doesn't have clear conviction surface to FIQ. Provisional default: choose the more conservative/learnable option.
```

---

## Template — Bug Triage Listener

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per P12.

### Extended thinking
Used on triage categorization.

### Deep research
Used on bug pattern analysis — detect repeat occurrences, surface architectural patterns to Critic.

### Wellness checkpoint thresholds
- 20 triages completed
- 60k tokens consumed
- 8 hours continuous work

### Rest cycle triggers
- After every wave (continuous-running agent; rest cycles are wave-boundary)
- On Founder mandate

### Founder Input Queue posture
Triage decisions that require user-impact ratification (e.g., "fix immediately vs defer to next wave?") queue to FIQ as scope-category.
```

---

## Template — Bubble agents (Devil's Advocate, Historical Pattern, Future Self, Plain English Translator)

Each gets:

```markdown
## Working mode

This agent operates in EXTENDED THINKING AS PRIMARY CONTRIBUTION MODE per P12. Extended thinking IS this agent's entire output.

### Per-bubble basis
- Devil's Advocate: extended thinking surfaces objections others miss
- Historical Pattern: extended thinking matches current decision against past patterns + locked memory
- Future Self: extended thinking on long-term implications
- Plain English Translator: extended thinking on accessibility of agent jargon to Founder

### Deep research
Used when extended thinking surfaces a gap that requires authoritative grounding.

### Wellness checkpoint thresholds (per-bubble basis)
- After 10 bubbles
- After session boundary
- On Founder mandate

### Rest cycle triggers
- After 10 bubbles consumed
- On Founder mandate

### Founder Input Queue posture
These agents do NOT typically queue to FIQ — their output is part of the decision process, not a question for Founder.
```

---

## Cross-references

- `EXTENDED_THINKING_DEEP_RESEARCH.md` (P12, full mechanics)
- `AGENT_WELLBEING_PROTOCOL.md` (P13, per-agent thresholds in § 4)
- `FOUNDER_INPUT_QUEUE.md` (P11, FIQ posture per agent)
- `PROTOCOLS_v6_ADDENDUM.md`

---

*Document authored 2026-05-12. Apply to each agent file at consolidation. Per-agent customization preserved.*
