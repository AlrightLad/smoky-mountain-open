# parbaughs-proactive-proposal

> **Skill purpose:** Generate proactive improvement proposals cleanly. Stay in scope. Quality bar enforced before Founder review.
> **Owner:** UI Polisher (Lane 1, Lane 4), Performance Agent (Lane 3), Bug Triage Listener (Lane 2). Other agents contribute lightly.
> **Related protocol:** P15 (Proactive Improvement Discipline)
> **Related docs:** `PROACTIVE_IMPROVEMENT_PROTOCOL.md`, `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md`

---

## When to invoke this skill

Use during weekly proactive cycle (Monday 01:00 UTC) when generating proposals for one of the four authorized lanes:
- Lane 1: UI Polish
- Lane 2: Bug Discovery
- Lane 3: Performance
- Lane 4: Design System Extension

Do NOT use:
- For new features (out of scope)
- For compliance/security changes (out of scope)
- For cost-discipline budget changes (out of scope)
- For locked memory amendments (out of scope)
- For anything in the "never" list of PROACTIVE_IMPROVEMENT_PROTOCOL § 3

---

## 5-step proposal generation pattern

### Step 1 — Confirm lane

Ask yourself: which of the 4 lanes does this belong in?

- **Lane 1 (UI Polish):** typography, spacing, micro-interactions, a11y, loading/empty/error states, touch targets, color consistency
- **Lane 2 (Bug Discovery):** evidence-backed bug findings (NOT speculation)
- **Lane 3 (Performance):** measurement-backed optimizations
- **Lane 4 (Design System Extension):** consolidation with 3+ usage proof

If it doesn't fit cleanly into one lane → it's probably out of scope → create FIQ entry instead.

### Step 2 — Gather evidence

Each lane has specific evidence requirements:

**Lane 1:** Screenshot reference OR code citation OR design system violation reference
**Lane 2:** Logs, benchmark results, failed test scenarios, dependency audit output
**Lane 3:** Baseline measurement with methodology
**Lane 4:** Usage count across codebase (3+ for tokens, 5+ for utility classes, 4+ for primitives)

If you can't gather evidence → don't propose. Speculation isn't a proposal.

### Step 3 — Verify NOT in "never" list

Check against PROACTIVE_IMPROVEMENT_PROTOCOL § 3:
- ❌ New features outside Vision
- ❌ Compliance/security posture changes
- ❌ Cost-discipline budget changes
- ❌ Locked memory amendments
- ❌ Cross-wave dependency changes
- ❌ Architectural pattern changes outside locked governance
- ❌ Naming changes to locked terms
- ❌ Wave 2/3/4 work before their time
- ❌ Production data access
- ❌ Third-party integration changes
- ❌ Pricing/monetization changes
- ❌ Legal/policy copy changes

If ANY match → STOP. Create FIQ entry instead.

### Step 4 — Compose proposal per template

Use the template from `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md`. Lane-specific fields:

**Lane 1 template:**
```markdown
### PROP-{NNN} — <short title>

**Surface:** {file/section reference}
**Observation:** {what was found}
**Detection method:** {how you found it}
**Proposed action:** {concrete fix with design system citation}
**Estimated cost:** {time + tokens}
**Risk:** {Low/Med/High} — {1-sentence rationale}
**Reversibility:** {Trivial/Moderate/Expensive}
**Justification:** {why this is worth doing}
**Critic pre-review:** _pending_
**Founder decision:** _pending_
```

**Lane 2 template:**
```markdown
### PROP-{NNN} — <short title>

**Detection:** {evidence}
**Reproducer:** {steps or "no reproducer — pattern from logs"}
**Severity:** {Critical/High/Medium/Low} — {rationale}
**Surface affected:** {area}
**Hypothesized cause:** {best hypothesis, labeled as hypothesis}
**Confirmed vs hypothesis:**
- Confirmed: {bullets}
- Hypothesis: {bullets}
**Proposed investigation cost:** {time + tokens}
**Risk if unaddressed:** {impact}
**Critic pre-review:** _pending_
**Founder decision:** _pending_
```

**Lane 3 template:**
```markdown
### PROP-{NNN} — <short title>

**Detection method:** {benchmark/analyzer/profiler}
**Baseline measurement:** {specific number with methodology}
**Projected improvement:** {specific number with methodology}
**Implementation approach:** {concrete code-level approach}
**Fault tolerance:** {what could go wrong + detection + revert}
**Estimated cost:** {time + tokens}
**Risk:** {Low/Med/High} — {rationale}
**Reversibility:** {Trivial/Moderate/Expensive}
**Critic pre-review:** _pending_
**Founder decision:** _pending_
```

**Lane 4 template:**
```markdown
### PROP-{NNN} — <short title>

**Usage analysis:** {count of repetitions, where they appear}
**Proposed addition:** {new token/utility/primitive + definition}
**Design system integration plan:** {how this fits, citations}
**Migration cost for existing usages:** {time + tokens}
**Justification:** {why consolidation worth migration cost}
**Critic pre-review:** _pending_
**Founder decision:** _pending_
```

### Step 5 — Submit to Critic quality-bar pre-review

Before adding to Founder queue:
- Submit proposal to Critic
- Critic runs quality-bar checklist (see § Quality bar below)
- If APPROVED → add to queue
- If REJECTED → log rejection reason + don't propose

---

## Quality bar (Critic enforces)

Critic rejects proposals that fail ANY of these:

| Check | Pass criteria |
|---|---|
| Observation specific | Concrete element/surface/metric named; not vague |
| Evidence sufficient | Lane-appropriate evidence present |
| Action concrete | "Change X to Y" not "improve X" |
| Cost estimated | Hours + tokens, not "small" |
| Risk classified | Low/Med/High with rationale |
| Reversibility documented | Trivial/Moderate/Expensive with note |
| Justification reasonable | Value clear, not "because it's better" |
| Detection method replicable | Someone else could find this the same way |
| In-scope | One of 4 lanes, not in "never" list |
| Not scope creep | Polish isn't redesign in disguise |
| Not speculative | Bug discovery has evidence, not "what if" |
| Not vibes | Performance has measurement, not "feels slow" |
| Not token proliferation | Lane 4 has 3+ usages, not 1 |
| Not governance amendment | Doesn't change locked memory |
| Not re-proposal | Not previously rejected (check history) |

Critic logs each rejection with reason for skill performance review of proposing agent.

---

## Volume calibration

### Targets per cycle

- Lane 1: 3-8 proposals
- Lane 2: 2-5 proposals
- Lane 3: 1-3 proposals
- Lane 4: 0-2 proposals
- **Total: 10-15 proposals/week**

### Volume drift signals

| Signal | Action |
|---|---|
| <5 proposals total | Critic flags: agents may be missing opportunities |
| 16-20 proposals total | Critic flags: quality may be slipping; review next cycle |
| >20 proposals total | Critic enforces volume cap; rejects lowest-quality |
| Lane 1 dominates 80%+ | Other lane agents may be under-contributing |
| Lane 4 0 for 4+ cycles | Design system consolidation opportunity check needed |

---

## Per-agent proposal patterns

### UI Polisher (Lane 1 + Lane 4 owner)

Lane 1 generation flow:
1. Audit recent ships' visual output (last 2 weeks)
2. Compare against design system specs
3. Identify violations or polish opportunities
4. Cite design system section for proposed fix
5. Estimate cost (most Lane 1 fixes <30 min)

Lane 4 generation flow:
1. Codebase scan for repeated patterns
2. Identify candidates (3+ for tokens, 5+ for utilities, 4+ for primitives)
3. Propose consolidation with migration plan
4. Estimate migration cost honestly (often substantial)

### Performance Agent (Lane 3 owner)

Lane 3 generation flow:
1. Review last week's heartbeat benchmark data
2. Identify regression patterns or unmeasured-but-suspect areas
3. Establish baseline if not present
4. Project improvement with methodology
5. Document fault tolerance (performance optimizations can regress in subtle ways)

### Bug Triage Listener (Lane 2 owner)

Lane 2 generation flow:
1. Aggregate last week's triage data
2. Identify patterns: same surface, same flow, same browser, same time-of-day
3. Severity assessment per impact analysis
4. Reproducer where possible; "pattern from logs" when not
5. Estimate investigation cost (spike time)

---

## Anti-pattern catalog

### Anti-pattern 1: Lane misclassification
❌ Filing a redesign as Lane 1 polish.
✅ Redesigns require Founder direction → FIQ entry.

### Anti-pattern 2: Speculative Lane 2
❌ "Investigate possible race conditions in scoring flow."
✅ Lane 2 requires DATA. No evidence → no proposal.

### Anti-pattern 3: Performance vibes
❌ "Leaderboard feels slow."
✅ Lane 3 requires measurement: baseline + projected delta + methodology.

### Anti-pattern 4: Single-use Lane 4
❌ "Add `--cb-warning-yellow` for one Wave 1 surface usage."
✅ Lane 4 requires 3+ usages. Below threshold → don't propose.

### Anti-pattern 5: Scope creep disguised as polish
❌ Lane 1 proposal that's actually a new component family.
✅ Pure polish only; new architecture requires Founder direction.

### Anti-pattern 6: Skipping Critic quality-bar
❌ Adding directly to queue without Critic review.
✅ Every proposal passes Critic pre-review.

### Anti-pattern 7: Re-proposing rejected items
❌ "PROP-007 (rejected last month, re-proposing now)."
✅ Rejected stays rejected unless Founder direction changes.

---

## Skill self-check before submitting proposal to Critic

- [ ] Lane confirmed (one of 4)
- [ ] Evidence gathered per lane requirements
- [ ] NOT in "never" list
- [ ] All template fields populated
- [ ] Cost estimated honestly
- [ ] Risk classification with rationale
- [ ] Reversibility documented
- [ ] Justification clear
- [ ] Detection method replicable
- [ ] No scope creep
- [ ] No vibes/speculation
- [ ] Not a re-proposal of rejected item

---

## Performance review

Self-review cadence: after every proactive cycle.

Review questions:
1. How many of my proposals were rejected at Critic quality-bar? (Pattern reveals quality calibration)
2. How many of my proposals were accepted by Founder? (Acceptance rate signals proposal quality)
3. Were my accepted proposals' projected impacts realized after implementation?
4. Did I propose anything that scope-violated and converted to FIQ?
5. Was my volume within lane target range?

Log review outcomes per `SKILL_PERFORMANCE_REVIEW.md` discipline.

Pattern recognition over time:
- Consistent rejections in Lane 1 → polish detection skills need refinement
- Consistent rejections in Lane 2 → evidence requirements not understood
- Consistent rejections in Lane 3 → measurement methodology needs strengthening
- Consistent rejections in Lane 4 → consolidation threshold sensitivity off

---

*Skill v1.0 — authored 2026-05-12 as part of governance v7.*
