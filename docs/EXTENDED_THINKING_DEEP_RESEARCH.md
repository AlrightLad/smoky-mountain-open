# EXTENDED_THINKING_DEEP_RESEARCH.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Codify extended thinking and deep research as the DEFAULT working mode for all orchestration agents — not exceptions reserved for hard problems.
> **Locked context:** Aligns with memory locked Vision discipline ("Every Wave 1 ship requires deep, thorough research and investigation before code lands").

---

## 0 — Core principle

Speed is not the metric. Quality of decision is. Decisions that are wrong require ships to revert; ships that revert cost more time than the original decision took.

Extended thinking and deep research compound positively. Skipping them compounds negatively. Default: ALWAYS think deeply, ALWAYS research before commitment.

---

## 1 — When extended thinking is required

**ALWAYS** for any decision more consequential than a typo fix.

Specifically required for:
- Architectural decisions (data model, file structure, API surface)
- Cross-wave dependency changes
- Migration patterns
- Performance optimization choices (multiple approaches available)
- Security/compliance decisions
- External library/tool adoption
- Naming decisions (anything that lands in public surface)
- Spec interpretation when text is ambiguous

**NOT required** (skip extended thinking) for:
- Typo fixes
- Style/formatting adjustments
- Direct application of explicit governance directives
- Repeat operations following a previously-established pattern

The trade-off: agents that always do extended thinking on trivial things compound token cost; agents that never do extended thinking compound drift. Calibration matters.

---

## 2 — Extended thinking pattern

Each agent uses a `<thinking>` block (or equivalent context-private reasoning space) before any consequential output. The block contains:

1. **Restate the problem.** What's actually being asked.
2. **What I know.** Pull-from-governance + ship Vision + locked memory.
3. **What I don't know.** Honest enumeration of gaps.
4. **Options considered.** Minimum 2; more if non-trivial. Each option with tradeoffs.
5. **Reasoning to chosen path.** Why this option over alternatives.
6. **Failure modes.** What could go wrong with chosen path.
7. **Revert plan.** How we undo if wrong.

The thinking block is for the agent's own clarity. It MAY be surfaced in post-push retrospective if the decision is consequential enough.

---

## 3 — When deep research is required

**ALWAYS** for:
- Any tool/library not previously used by the platform
- Any external API integration (Firebase products, Apple/Google services, third-party APIs)
- Any architectural pattern not already documented in locked governance
- Any compliance-touching decision (CMMC, NIST, HIPAA, SOC 2)
- Any cost-projection decision (which approach will scale economically)
- Any security pattern (auth, encryption, authorization model)
- Any performance optimization with multiple competing approaches

**NOT required** for:
- Pattern application where pattern is already locked + documented in governance
- Direct implementation of explicit ship Vision directives

---

## 4 — Deep research methodology

Per locked memory: "comparison matrices for cost decisions, fault-tolerant plans with revert paths, fundamentals-grounded methodology not invented."

### 4.1 The 5-step research pattern

**Step 1 — Frame the question.**
What is the decision? What's at stake? What's reversible vs irreversible?

**Step 2 — Survey the landscape.**
Minimum 3 sources. Real sources, not vibes. Authoritative > popular. Recent > stale. For tools/libraries: official docs + 1-2 community-validated patterns. For architectural patterns: industry references (Martin Fowler, Google SRE book, AWS Well-Architected, etc.) + project-specific governance.

**Step 3 — Build comparison matrix.**
For ANY decision with multiple viable options: explicit matrix.

Format:
```
| Option | Description | Pros | Cons | Cost (time/$) | Risk | Reversibility |
|--------|-------------|------|------|---------------|------|---------------|
| A | ... | ... | ... | ... | ... | ... |
| B | ... | ... | ... | ... | ... | ... |
| C | ... | ... | ... | ... | ... | ... |
```

Minimum 2 options. "Status quo / do nothing" is ALWAYS a valid option to include.

**Step 4 — Validate against fundamentals.**
The chosen option must align with foundational principles:
- Locked governance memory
- Ship Vision intent
- Cross-wave dependencies
- Performance/security/cost budgets
- User experience principles per design system

If chosen option violates a fundamental — STOP. Reconsider.

**Step 5 — Document fault tolerance + revert path.**
Every recommended path includes:
- What could fail?
- How would we detect failure?
- What's the rollback procedure?
- What's the time-to-revert?

If revert is impossible or expensive, that fact alone may eliminate the option.

### 4.2 Research artifact

**Location:** `.claude/research/<ship-id>/<decision-name>.md`

**Template:**

```markdown
# Research: <decision name>

**Ship:** <W?.?S? or platform>
**Decision required by:** <agent name>
**Date:** <ISO 8601>

## 1 — Question framing
{What's being decided. What's at stake.}

## 2 — Landscape survey
{Minimum 3 sources. Cite them.}

## 3 — Comparison matrix
{The matrix from §4.1 step 3}

## 4 — Fundamentals validation
{Each fundamental check; pass/fail per option}

## 5 — Recommended path
{Chosen option + rationale}

## 6 — Fault tolerance + revert plan
{Failure modes; detection; rollback; time-to-revert}

## 7 — Open questions
{What this research did NOT answer; what gets queued to FIQ if Founder input needed}
```

### 4.3 Research artifact lifecycle

- Authored before any code lands for the affected decision
- Reviewed by Critic during pre-flight audit
- Referenced in ship retrospective if decision turned out wrong (debrief learning)
- Preserved in `.claude/research/` forever — institutional memory

---

## 5 — Per-agent application

### 5.1 Engineer

- Extended thinking on EVERY architectural decision before writing implementation code
- Deep research artifact required before:
  - Adopting any new library/tool
  - Implementing any new pattern not in governance
  - Making any irreversible data structure decision
- Research artifact reviewed by Critic in pre-flight audit

### 5.2 Critic

- Extended thinking on EVERY audit before declaring outcome
- Deep research required when locked governance is unclear/ambiguous
- Critic-authored research artifacts inform governance amendments

### 5.3 Performance/Load Agent

- Comparison matrices REQUIRED for every performance optimization
- At minimum: "current approach" vs "proposed approach" with measurements
- Synthetic benchmarks required where possible

### 5.4 Security Agent

- Multi-source validation REQUIRED for any security claim or threat model
- Compliance frameworks must be cited authoritatively (NIST SP 800-171, CMMC AB, etc.)
- Threat model artifact required for any auth/authorization decision

### 5.5 Data Integrity Agent

- Extended thinking REQUIRED on every schema decision
- Fault-tolerance plan REQUIRED for every migration
- Migration research artifact must address: forward-compat, backward-compat, rollback path, data loss risk

### 5.6 Orchestrator

- Extended thinking REQUIRED on every workflow gap
- Deep research REQUIRED when bubble votes split
- Orchestrator tie-break decisions documented with research rationale

### 5.7 Flow Documenter

- Extended thinking when documenting decision rationale
- Deep research when documenting institutional patterns (rare; mostly captures Critic/Engineer research output)

### 5.8 UI Polisher

- Extended thinking on every cross-surface coherence decision
- Deep research for new visual patterns not in design system
- Research artifact references design spec section + design system tokens

### 5.9 End User sub-agents (5 personas)

- Extended thinking when validating UX from persona perspective
- Deep research when persona's expected behavior is unclear (e.g., "What WOULD a Beginner do here?")

### 5.10 Bug Triage Listener

- Extended thinking on triage categorization
- Deep research on bug patterns to detect repeat occurrences

### 5.11 Bubble agents (Devil's Advocate, Historical Pattern, Future Self, Plain English Translator)

Extended thinking IS their entire contribution mode. They don't ship anything else.

- **Devil's Advocate** — extended thinking surfaces objections others miss
- **Historical Pattern** — extended thinking matches current decision against past patterns
- **Future Self** — extended thinking on long-term implications
- **Plain English Translator** — extended thinking on accessibility of agent jargon to Founder

---

## 6 — Working mode addendum for each agent file

Each agent doc gets the following section (template below). Applied at consolidation.

```markdown
## Working mode

This agent operates in extended thinking + deep research mode by default per `EXTENDED_THINKING_DEEP_RESEARCH.md` (P12).

### Extended thinking
Used before any consequential decision. Pattern per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 2.

### Deep research
Required for: {agent-specific list per § 5}
Methodology: 5-step research pattern per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 4.1
Artifacts: stored at `.claude/research/<ship-id>/<decision>.md`
Reviewed by: Critic in pre-flight audit

### Skipping extended thinking
Permitted only for: typo fixes, formatting, direct application of explicit governance, repeat operations following established pattern.
```

---

## 7 — Anti-patterns to avoid

- **Performative thinking blocks.** "Let me think... done!" with no substance. Critic flags.
- **3-source research where all 3 sources cite each other.** Source independence matters.
- **Comparison matrix with one cell empty.** If you can't fill the cell, the option isn't fully understood — research more.
- **Skipping fault-tolerance because "this won't fail."** Hubris. Fill it in.
- **Reusing old research without re-validation.** Things change. Cite the date of research artifact; re-validate if >30 days old AND the decision is being applied to a new context.
- **Citing research artifact without actually reading it.** Critic spot-checks.

---

## 8 — Cost of extended thinking

Extended thinking + deep research costs more tokens per decision. This is intentional.

Locked budget:
- Wave 1 ships: research-heavy budget. Per locked memory: "deep, thorough research and investigation before code lands."
- Wave 2-4 ships: research budget calibrated per ship complexity
- Trivial ships: minimal research overhead

Founder cost-discipline (per locked governance) monitors total spend. If research budget runs over, Critic flags. If consistently over, governance amendment considers tightening per-decision research requirements.

The trade-off is explicit: more tokens spent on thinking and research, fewer tokens spent on reverting wrong decisions. Per locked Vision discipline, the Founder has chosen the former.

---

## 9 — Integration with existing governance

### 9.1 With P10 Loop-and-Verify

P10 verifies completion of stated goals. P12 (this protocol) ensures the path to those goals was thoughtful. The two complement.

### 9.2 With decision bubble

Bubbles consume extended thinking as input. Agents who participate in a bubble have already done their extended thinking. The bubble compares perspectives, not generates them.

### 9.3 With wellness checkpoints

Wellness checkpoint subjective reflection IS extended thinking applied to one's own state. The reflection log entry is part of P12 discipline.

### 9.4 With Founder Input Queue

When extended thinking reveals "I genuinely need Founder input," queue per P11. Don't fake-decide just to keep moving.

---

## 10 — Cross-references

- `PROTOCOLS.md` P12
- `FOUNDER_INPUT_QUEUE.md` (P11; surfaces unanswerable questions)
- `AGENT_WELLBEING_PROTOCOL.md` (P13; rest cycles include research time)
- `parbaughs-deep-research` skill (`.claude/skills/`)
- `SKILL_PERFORMANCE_REVIEW.md` (decision quality is reviewed here)
- Locked memory (Vision discipline)

---

*Document authored 2026-05-12. Locked Founder ratification.*
