# SKILL_CATALOG_v6_ADDENDUM.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Three new skills registered. Append to existing `SKILL_CATALOG_OVERVIEW.md` at consolidation.

---

## New skills

### parbaughs-founder-input-triage

**Location:** `.claude/skills/parbaughs-founder-input-triage/SKILL.md`

**When to use:**
- Agent encounters a question requiring Founder direction
- Decision about whether to halt (blocking) vs queue (non-blocking)
- Determining priority + category of FIQ entry
- Drafting Founder-readable provisional defaults

**What it provides:**
- 5-question triage checklist
- Blocking-vs-non-blocking decision tree (codified version of `FOUNDER_INPUT_QUEUE.md` § 2.2)
- FIQ entry template (paste-ready)
- Plain English template for Founder check-in summary
- Anti-pattern catalog (common triage mistakes)

**Owner:** Any agent identifying a Founder-input moment; Orchestrator if disputed.

**Related protocols:** P11

**Skill performance review cadence:** After every 10 FIQ entries created. Review: were the entries correctly triaged? Did Founder override our defaults?

---

### parbaughs-deep-research

**Location:** `.claude/skills/parbaughs-deep-research/SKILL.md`

**When to use:**
- Before any architectural decision
- Before adopting any new library/tool
- Before any external integration
- Before any compliance-touching decision
- Before any cost-projection decision
- Before any security pattern decision
- Before any performance optimization with multiple approaches

**What it provides:**
- 5-step research methodology (frame, survey, matrix, validate, fault-tolerance)
- Comparison matrix template
- Source validation checklist (independence, authority, recency)
- Research artifact template
- Common-shape examples by decision type (library adoption / pattern selection / migration / etc.)
- Anti-pattern catalog (incestuous sources, empty cells, skipped fault-tolerance)

**Owner:** All agents per their P12 working mode requirements.

**Related protocols:** P12

**Skill performance review cadence:** After every 5 research artifacts produced per agent. Review: did chosen options prove correct? Did failures match documented failure modes? Were revert plans executed cleanly when needed?

---

### parbaughs-wellness-checkpoint

**Location:** `.claude/skills/parbaughs-wellness-checkpoint/SKILL.md`

**When to use:**
- Wellness checkpoint trigger fires (5 ships / 100k tokens / 8 hours)
- Self-healing triggered (drift detected, self-declared uncertainty, etc.)
- Rest cycle activity planning

**What it provides:**
- 4-step wellness checkpoint methodology
- 5-step self-healing pass methodology
- Drift detection patterns (common drift signatures observed historically)
- Subjective reflection prompt templates (honest, not performative)
- Wellness journal entry format (template per outcome: clean / drift / escalate)
- Rest cycle activity templates (skill review / governance review / deep research)
- Honest framing language for subjective experience without metaphysical claims

**Owner:** Each agent runs own checkpoints. Critic audits across network.

**Related protocols:** P13

**Skill performance review cadence:** After every 10 checkpoints per agent. Review: were checkpoints substantive or superficial? Did wellness output catch real drift? Did rest cycles produce useful research/review output?

---

## Updated skill count

Pre-v6: 11 skills
Post-v6: 14 skills

Full v6 skill catalog (alphabetical):

1. caddy-notes-update
2. cross-surface-dependency-audit
3. css-token-usage-audit
4. decision-bubble-write
5. firestore-writer-audit
6. legacy-field-consumer-audit
7. **parbaughs-deep-research** (NEW v6)
8. **parbaughs-founder-input-triage** (NEW v6)
9. parbaughs-goal-completion-verify (P10)
10. parbaughs-rate-limit-aware-pause
11. **parbaughs-wellness-checkpoint** (NEW v6)
12. semver-triple-bump
13. state-reassignment-audit
14. validator-strictness-audit

---

## Cross-references

- `FOUNDER_INPUT_QUEUE.md`
- `EXTENDED_THINKING_DEEP_RESEARCH.md`
- `AGENT_WELLBEING_PROTOCOL.md`
- `SKILL_PERFORMANCE_REVIEW.md` (review cadence governance)
- `PROTOCOLS_v6_ADDENDUM.md` (P11/P12/P13)

---

*Document authored 2026-05-12. Apply to SKILL_CATALOG_OVERVIEW.md at consolidation.*
