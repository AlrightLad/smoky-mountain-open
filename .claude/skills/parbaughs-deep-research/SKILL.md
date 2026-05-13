# parbaughs-deep-research

> **Skill purpose:** Conduct deep research before consequential decisions. Build comparison matrices. Validate against fundamentals. Document fault-tolerance. Make decisions that prove right.
> **Owner:** All agents per P12 working mode.
> **Related protocol:** P12 (Extended Thinking + Deep Research Default)
> **Related docs:** `EXTENDED_THINKING_DEEP_RESEARCH.md`

---

## When to invoke this skill

REQUIRED for:
- Adopting any new library/tool not previously used by the platform
- Implementing any new architectural pattern not in locked governance
- Any external API integration (Firebase product, Apple/Google service, third-party)
- Any compliance-touching decision (CMMC, NIST, HIPAA, SOC 2)
- Any cost-projection decision (which approach scales economically)
- Any security pattern decision (auth, encryption, authorization)
- Any performance optimization with multiple competing approaches
- Any irreversible data structure decision

NOT required for:
- Direct application of explicit governance directives
- Pattern reuse where pattern is locked + documented
- Repeat operations following established pattern

---

## 5-step research methodology

### Step 1 — Frame the question

State explicitly:
- What is the decision?
- What's at stake?
- What's reversible vs irreversible about it?
- What's the timeline pressure (if any)?

Bad framing: "Should we use Postgres?"
Good framing: "For W1.S4 Round capture: should round write-path use Firestore subcollections (current pattern) or denormalize to top-level collection? Decision is reversible at moderate cost (migration script). Not timeline-pressured."

---

### Step 2 — Survey the landscape

Minimum 3 sources. Real sources, not vibes.

**Source hierarchy (preference order):**
1. Official documentation of the technology/framework
2. Peer-reviewed or industry-standard references (Martin Fowler, Google SRE book, AWS Well-Architected, OWASP, NIST SP 800-171)
3. Direct measurements (benchmarks you ran yourself)
4. Established community patterns (multiple independent sources converging on same answer)
5. Project-specific governance + locked memory

**Avoid:**
- Single source citing itself
- 3 sources that all cite same upstream (effectively 1 source)
- "Some Stack Overflow answer" (single point, no authority)
- "I remember reading once" (no actual source)

**Documentation pattern:**
```
Sources surveyed:
1. <Source name, URL or citation, date accessed>
2. <Source name, URL or citation, date accessed>
3. <Source name, URL or citation, date accessed>
```

---

### Step 3 — Build comparison matrix

For ANY decision with multiple viable options.

**Template:**

| Option | Description | Pros | Cons | Cost (time/$) | Risk | Reversibility |
|--------|-------------|------|------|---------------|------|---------------|
| A | {one-line} | {bullets} | {bullets} | {estimate} | {low/med/high + why} | {cheap/moderate/expensive to undo} |
| B | {one-line} | {bullets} | {bullets} | {estimate} | {low/med/high + why} | {cheap/moderate/expensive to undo} |
| C | {one-line} | {bullets} | {bullets} | {estimate} | {low/med/high + why} | {cheap/moderate/expensive to undo} |

**Rules:**
- Minimum 2 options
- "Status quo / do nothing" is ALWAYS a valid option to include if applicable
- Every cell must be filled — empty cells mean you don't understand that option well enough
- Cost can be ranges ("4-8 hours" or "$50-100/mo")
- Risk must include rationale (not just "medium")
- Reversibility must be concrete (not just "easy" — say "1-hour migration script" or "requires data backfill")

---

### Step 4 — Validate against fundamentals

For each option in matrix, check:

| Fundamental | Pass/Fail per option |
|---|---|
| Aligns with locked governance memory | A: ? / B: ? / C: ? |
| Aligns with ship Vision intent | A: ? / B: ? / C: ? |
| Respects cross-wave dependencies | A: ? / B: ? / C: ? |
| Within performance budget | A: ? / B: ? / C: ? |
| Within security/compliance requirements | A: ? / B: ? / C: ? |
| Within cost budget | A: ? / B: ? / C: ? |
| Aligned with design system principles (if UI-touching) | A: ? / B: ? / C: ? |

If chosen option FAILS any fundamental — STOP. Reconsider:
- Is the fundamental actually applicable here?
- Is there a way to mitigate the failure?
- Should we pick a different option?
- Should we queue to FIQ asking Founder to amend the fundamental?

Do NOT proceed with a fundamentals-violating option without explicit Founder approval via FIQ.

---

### Step 5 — Document fault tolerance + revert path

For the recommended path:

**Failure modes:**
- What could fail? (3+ failure modes minimum)
- For each: probability + impact + detection method

**Detection:**
- How would we know if the chosen path is failing?
- What monitoring/alerting would catch it?
- What signal would trigger revert?

**Rollback:**
- Concrete steps to revert
- Time-to-revert estimate
- Data loss risk during revert
- Coordination required (other agents, Founder, external systems)

**Revert decision threshold:**
- At what signal/threshold do we revert vs continue and fix forward?

If revert is impossible or prohibitively expensive, that's a major risk factor that may eliminate the option entirely.

---

## Research artifact template

**Location:** `.claude/research/<ship-id>/<decision-name>.md`

**Naming:** kebab-case, descriptive. `composer-component-architecture.md` not `decision.md`.

**Template:**

```markdown
# Research: <decision name>

**Ship:** <W?.?S? or platform>
**Decision required by:** <agent name>
**Date authored:** <ISO 8601>
**Date last reviewed:** <ISO 8601>
**Status:** <draft|pre-flight-pending|approved|amended|deprecated>

---

## 1. Question framing

{What's being decided. What's at stake. Reversible/irreversible. Timeline pressure.}

## 2. Landscape survey

Sources surveyed:
1. <citation>
2. <citation>
3. <citation>
(More if needed)

Key findings from survey:
- {finding 1}
- {finding 2}
- {finding 3}

## 3. Comparison matrix

| Option | Description | Pros | Cons | Cost | Risk | Reversibility |
|--------|-------------|------|------|------|------|---------------|
| A | ... | ... | ... | ... | ... | ... |
| B | ... | ... | ... | ... | ... | ... |
| C | ... | ... | ... | ... | ... | ... |

## 4. Fundamentals validation

| Fundamental | A | B | C |
|---|---|---|---|
| Locked governance | ✅ | ✅ | ❌ (violates X) |
| Ship Vision | ✅ | ⚠️ (partial) | ✅ |
| Cross-wave deps | ✅ | ✅ | ✅ |
| Performance budget | ⚠️ (close) | ✅ | ✅ |
| Security/compliance | ✅ | ✅ | ✅ |
| Cost budget | ✅ | ⚠️ (close) | ❌ (over) |
| Design system | N/A | N/A | N/A |

## 5. Recommended path

**Chosen: Option {A|B|C}**

**Rationale:**
{Why this option over alternatives. Specific reasoning, not vague preference.}

## 6. Fault tolerance + revert plan

**Failure modes:**
1. {failure mode 1} — probability: {low/med/high} — impact: {description} — detection: {how}
2. {failure mode 2} — ...
3. {failure mode 3} — ...

**Detection:**
{What signals catch failure}

**Rollback steps:**
1. {step 1}
2. {step 2}
3. {step 3}

**Time-to-revert:** {estimate}

**Revert decision threshold:** {signal or metric that triggers revert}

## 7. Open questions

{What this research did NOT answer. What gets queued to FIQ if Founder input needed.}

## 8. Pre-flight audit (Critic)

**Audited by:** {Critic agent}
**Audit date:** {ISO 8601}
**Audit outcome:** {APPROVED | REVISIONS-REQUESTED | REJECTED}
**Audit notes:**
{Critic's findings}

## 9. Post-decision review (after ship closes)

**Decision proved correct?** {yes/no/partial}
**What we learned:** {brief}
**Did revert plan get executed?** {yes/no — if yes, how did it go}
```

---

## Common-shape examples

### Example 1: Library adoption

Decision: Adopt `react-query` for data fetching in HQ Web?

Sources to survey:
- react-query official docs
- React state management comparison (Redux vs Context vs Zustand vs react-query)
- 1-2 recent industry articles on data-fetching patterns
- Locked governance on existing data-fetching pattern

Matrix options:
- A: Adopt react-query everywhere
- B: Adopt react-query for new code only
- C: Continue with current Firestore listener pattern
- D: Build internal hook library

### Example 2: Migration pattern

Decision: Should we add an index for the new query pattern in W1.S11?

Sources:
- Firestore documentation on indexes
- Cost/performance tradeoffs of composite indexes
- Locked governance on existing index patterns
- Estimated query volume from W1.S11 Vision

Matrix options:
- A: Add composite index (expensive to maintain, fast queries)
- B: Restructure denormalization to avoid index (slow startup migration, no ongoing index cost)
- C: Use Firestore array-contains-any with limit (no index needed, query limitations)

### Example 3: Compliance pattern

Decision: How do we structure the audit log for CMMC Level 2 compliance?

Sources:
- NIST SP 800-171 Audit and Accountability family
- CMMC AB guidance on AU controls
- Founder's documented compliance posture (memory)

Matrix options:
- A: Append-only log table in Firestore (high storage cost, simple)
- B: Stream to dedicated audit log service (extra integration, lower storage cost)
- C: Hybrid (recent in Firestore, archive to cold storage after 90 days)

---

## Anti-pattern catalog

### Anti-pattern 1: Incestuous sources

❌ 3 blog posts that all cite the same Reddit thread.

Source independence matters. Trace citations to ground truth.

### Anti-pattern 2: Empty matrix cells

❌ Comparison matrix with "?" or blank cells.

If you can't fill a cell, you don't understand that option well enough. Research more or eliminate the option.

### Anti-pattern 3: Skipping fault tolerance

❌ "This won't fail because [reason]." Skip rollback section.

Hubris. Fill in fault tolerance even when confident. The exercise often surfaces failure modes that weren't obvious.

### Anti-pattern 4: Reusing stale research

❌ Citing a research artifact from 6 months ago without re-validating.

Things change. Cite the date of artifact; re-validate if >30 days old AND applying to a new context. Update the artifact's "last reviewed" date.

### Anti-pattern 5: Citing without reading

❌ Pulling artifact filename into citation without actually re-reading content.

Critic spot-checks. Get caught and trust erodes.

### Anti-pattern 6: Single-option matrix

❌ Only option A listed. "Other options weren't really viable."

If other options weren't viable, document WHY in the matrix. Show your work.

### Anti-pattern 7: Performative thinking

❌ Thinking block: "I considered this carefully. Done."

The thinking block must show actual reasoning. Critic verifies substance, not presence.

---

## Skill self-check before submitting research artifact

- [ ] All 5 steps completed
- [ ] Minimum 3 sources surveyed, independent of each other
- [ ] Comparison matrix has minimum 2 options, all cells filled
- [ ] All fundamentals checked per option
- [ ] Recommended path has explicit rationale (not vague preference)
- [ ] Failure modes documented (minimum 3)
- [ ] Rollback steps are concrete (not "we'll figure it out")
- [ ] Time-to-revert estimated
- [ ] Open questions surfaced (if any)
- [ ] Artifact stored at correct location: `.claude/research/<ship-id>/<name>.md`
- [ ] Pre-flight audit by Critic scheduled

---

## Performance review

Self-review cadence: every 5 research artifacts produced.

Review questions:
1. Did chosen options prove correct? (Tracking decision quality over time)
2. Did failures match documented failure modes? (Quality of fault tolerance analysis)
3. Were revert plans executed cleanly when needed? (Quality of rollback documentation)
4. Did Critic find substantive issues in pre-flight audit? (Quality of artifacts)
5. Did Founder approve at retrospective? (Alignment with Founder vision)

Log review outcomes per `SKILL_PERFORMANCE_REVIEW.md` discipline.

---

*Skill v1.0 — authored 2026-05-12 as part of governance v6.*
