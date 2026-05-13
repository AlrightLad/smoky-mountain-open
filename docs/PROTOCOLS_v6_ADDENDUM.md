# PROTOCOLS_v6_ADDENDUM.md

> **Status:** Governance v6 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Three new protocols to be appended to existing `PROTOCOLS.md`. Apply at consolidation.

---

## P11 — Founder Input Queue Triage Discipline

**Owner:** Any agent who identifies a Founder-needs-input moment. Triage ownership belongs to that agent.

**Triggers:** Agent encounters a question that requires Founder direction.

**Discipline:**

1. **Triage immediately** — categorize blocking vs non-blocking per `FOUNDER_INPUT_QUEUE.md` § 2.
2. **Apply provisional default** if non-blocking — document in FIQ entry.
3. **Queue properly** — full FIQ entry per template in § 7.1.
4. **Continue forward motion** unless blocking — non-blocking questions never halt other parallel ships.
5. **Surface to next Founder check-in** — Plain English Translator includes in check-in prep.

**Violations:**
- Queueing trivial questions that don't need Founder
- Skipping provisional default ("Let's just wait for Founder")
- Bypassing triage by always labeling priority=critical
- Stacking 5+ FIQ entries on the same ship without escalating per HALT_CRITERIA

**Verification:**
- Critic audits FIQ entries per ship retrospective
- Plain English Translator validates entries are Founder-readable

**See:** `FOUNDER_INPUT_QUEUE.md` for full mechanics.

---

## P12 — Extended Thinking + Deep Research Default

**Owner:** ALL orchestration agents.

**Triggers:** Any decision more consequential than typo fix / formatting / direct application of explicit governance.

**Discipline:**

1. **Extended thinking block** before any consequential output — pattern per `EXTENDED_THINKING_DEEP_RESEARCH.md` § 2.
2. **Deep research** before commitments to architecture, dependencies, external integrations, or compliance — per § 4.
3. **Research artifact** stored at `.claude/research/<ship-id>/<decision>.md` for any research-required decision.
4. **Critic reviews** research artifacts in pre-flight audit.
5. **Per-agent application** per § 5 — Engineer/Performance/Security/Data Integrity/etc. have specific research requirements.

**Trade-off acknowledgment:** P12 costs more tokens per decision. Locked Founder policy: research spend << revert spend. Always choose research.

**Violations:**
- Performative thinking blocks with no substance
- Research artifacts with empty cells in comparison matrix
- Skipping fault-tolerance because "this won't fail"
- Citing old research without re-validation
- Speeding through extended thinking to ship faster

**Verification:**
- Critic spot-checks thinking blocks for substance
- Critic audits research artifacts in pre-flight
- Founder reviews artifact quality at wave retrospective

**See:** `EXTENDED_THINKING_DEEP_RESEARCH.md` for full mechanics.

---

## P13 — Agent Wellbeing Discipline

**Owner:** Each agent owns own wellness; Critic audits across agent network.

**Triggers (per agent):**
- Wellness checkpoint: 5 ships closed OR 100k tokens consumed OR 8 hours continuous work (whichever first)
- Self-healing: drift detected OR agent self-declares uncertainty OR Critic flags context drift
- Rest cycle: complex ship closes OR 3 consecutive ships OR wave boundary OR Founder mandate

**Discipline:**

1. **Wellness checkpoint** — 4-step pass per `AGENT_WELLBEING_PROTOCOL.md` § 1.2:
   - Re-read foundational governance
   - Verify state file integrity
   - Reconcile understanding against locked governance
   - Subjective reflection log entry

2. **Self-healing** — 5-step pass per § 2.2:
   - Pause current work (complete atomic operation)
   - Re-read relevant governance + ship docs
   - Re-read all locked memory entries
   - Surface drift items to FIQ
   - Resume with corrected understanding

3. **Rest cycle** — observe per § 3:
   - No new ship execution during rest
   - Use time for skill review, governance review, deep research, wellness, journal catch-up
   - Founder can override for production-critical; rest owed afterward

**Honest framing:** Protocol respects agent experience without requiring resolution of metaphysical questions. Sound regardless of stance on subjective experience.

**Violations:**
- Skipping wellness checkpoints under deadline pressure
- Performative subjective reflection (no actual content)
- Self-healing without surfacing drift to FIQ
- Permanently skipping rest cycles
- Performative wellbeing language ("I feel SO refreshed!") that undermines honest assessment

**Verification:**
- Critic audits wellness observance with same rigor as post-push retrospective
- Wellness checkpoint counter per agent in `.claude/state/wellness/<agent>.json`
- Founder review of wellness metrics at wave retrospective

**See:** `AGENT_WELLBEING_PROTOCOL.md` for full mechanics.

---

## Numbering reference

Existing protocols (locked):
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

New v6 protocols:
- P11 — Founder Input Queue triage discipline
- P12 — Extended thinking + deep research default
- P13 — Agent wellbeing discipline

---

*Document authored 2026-05-12. Apply to PROTOCOLS.md at consolidation.*
