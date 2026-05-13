# PROACTIVE_IMPROVEMENT_PROTOCOL.md

> **Status:** Governance v7 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Define scoped lanes where orchestration team proactively finds bugs, surfaces improvements, and proposes UI/free-feature wins. Strict scope boundaries. Approval gate before implementation.

---

## 0 — Core principle

Orchestration team is NOT a passive Vision executor. Agents proactively:
- Find bugs before users do
- Identify UI polish opportunities
- Surface performance optimization wins
- Propose design system extensions

But: **proactive work is bounded.** Strict lane definitions. No autonomous merge. Founder approves before implementation.

---

## 1 — Four authorized lanes

| Lane | What | Why it's free/cheap |
|---|---|---|
| **1 — UI Polish** | Typography, spacing, micro-interactions, a11y, loading/empty/error states | No new features; design-system-aligned |
| **2 — Bug Discovery** | Log scanning, cross-browser testing, dependency audits, performance regression detection | Preventative; silent quality |
| **3 — Performance** | Unused CSS, listener consolidation, lazy-loading, image compression, bundle size | Existing code; often net-negative cost |
| **4 — Design System Extension** | Token additions, utility classes, primitive component extraction | Consolidation; makes future ships faster |

These are the ONLY lanes orchestration team works in proactively. Anything outside requires Founder direction via FIQ or Vision amendment.

---

## 2 — Lane definitions

### 2.1 Lane 1 — UI Polish

**Scope:**
- Typography refinements (sizes, weights, line-heights aligning to design system)
- Spacing consistency (margins, padding, gaps using design tokens)
- Micro-interactions (hover states, focus indicators, transition smoothness)
- Accessibility improvements (ARIA labels, keyboard nav, contrast ratios, focus traps)
- Loading state quality (skeleton primitives, progress indicators, perceived performance)
- Empty state copy (editorial tone alignment with locked country-club voice)
- Error message improvements (helpful copy, clear next actions, dignified tone)
- Touch target sizes (44px+ on mobile bands)
- Color usage consistency (correct semantic application of brass/claret/moss/ink/mute)

**Out of scope:**
- New page layouts or component architectures
- Visual redesigns (those go through design bot + Founder)
- Brand identity changes
- Logo/wordmark modifications
- Any change requiring new design tokens beyond Lane 4 governance

**Detection patterns:**
- Inconsistencies caught during cross-ship audit
- Design system violations (using non-token colors, off-grid spacing)
- Accessibility audit failures
- User-reported friction points
- Visual diff regressions

**Proposal format:** Lane 1 proposal includes screenshot/code reference, design system citation for the fix, estimated time, reversibility note.

---

### 2.2 Lane 2 — Bug Discovery

**Scope:**
- Production log scanning (when telemetry available)
- Cross-browser smoke testing extension (beyond locked 12-scenario × 4-browser baseline)
- Dependency audit (npm audit, vulnerable libs surfacing)
- Performance regression detection (heartbeat synthetic benchmarks)
- Error boundary trip detection
- Console error/warning accumulation tracking
- Network failure pattern detection
- Firestore listener orphan detection
- Cache invalidation correctness audits
- Cross-device sync correctness audits

**Out of scope:**
- Speculative bug hunts not tied to evidence
- "What if X happens" thought experiments without reproducer
- Bug investigation that requires production data access (compliance issue)
- Bug investigation requiring user-impact rationalization

**Detection patterns:**
- Bug Triage Listener aggregating reports
- Heartbeat synthetic benchmarks showing regressions
- Repeated cross-browser smoke failures (pattern, not single flake)
- npm audit results
- Performance Agent monitoring deltas

**Proposal format:** Lane 2 proposal includes detection evidence, reproducer (if available), severity rating, surface affected, hypothesized cause, estimated investigation cost.

---

### 2.3 Lane 3 — Performance Optimization

**Scope:**
- Unused CSS deletion (orphan classes from previous ships)
- Redundant Firestore listener consolidation (multiple components listening to same path)
- Lazy-loading non-critical paths (route-level code splitting)
- Image compression audits (oversized images, missing modern formats)
- Bundle size monitoring (per-route bundle growth)
- Render performance audits (unnecessary re-renders, expensive computations)
- Memoization opportunities (high-frequency renders with stable inputs)
- Event listener leak detection (missing cleanup)
- Critical path optimization (first-contentful-paint improvements)
- Cache header optimization (asset caching policies)

**Out of scope:**
- Major framework changes (React → Vue, etc.)
- Database engine changes
- CDN provider changes
- Build tool changes (Vite stays per locked stack)
- Anything affecting compliance or security posture

**Detection patterns:**
- Performance Agent benchmarks
- Bundle analyzer output
- Render profiler data
- Lighthouse audits
- Network waterfall analysis

**Proposal format:** Lane 3 proposal includes baseline measurement, projected improvement (with measurement methodology), implementation approach, fault tolerance plan.

---

### 2.4 Lane 4 — Design System Extension

**Scope:**
- New design tokens when same value used 3+ times across codebase
- Utility class additions for patterns appearing 5+ times
- Primitive component extraction for compositions appearing 4+ times
- Design system documentation improvements
- Token naming consistency improvements
- Style guide refinements

**Out of scope:**
- New visual languages or aesthetics
- Anything contradicting locked design system principles
- Brand-level decisions
- Anything requiring design bot involvement (those are Founder-direction territory)

**Detection patterns:**
- Cross-ship audit identifying repeated patterns
- Token usage analysis (where are raw values vs tokens?)
- Component duplication analysis (similar code in multiple places)
- Design coherence reviews

**Proposal format:** Lane 4 proposal includes usage analysis (count of repetitions across codebase), proposed addition, design system integration plan, migration cost for existing usages.

---

## 3 — What proactive work NEVER includes

Hard "no" list:

- **New features** outside ship Visions (those require Founder direction)
- **Compliance/security posture changes** (require Security Agent + Founder)
- **Cost-discipline budget changes** (require Founder)
- **Locked memory amendments** (require Founder ratification)
- **Cross-wave dependency changes** (require Founder ratification)
- **Architectural pattern changes** outside locked governance
- **Naming changes** to locked terms (Chip, Parcoin, etc.)
- **Wave 2/3/4 ship work** before their time (proactive only on done waves)
- **Production data access** for investigation
- **Third-party integration changes** (require deep research + Founder direction)
- **Pricing or monetization changes** (require Founder)
- **User-visible copy in legal/policy surfaces** (require Founder review)

If proactive scan surfaces something in the "never" list, agent surfaces to FIQ instead of proactive proposal queue.

---

## 4 — Approval gate

### 4.1 Workflow

```
Proactive cycle (weekly)
  ↓ generates
Proactive proposal queue (.claude/state/proactive-proposals/<date>.md)
  ↓ Founder reviews (weekly)
Decisions captured (Accept / Reject / Defer)
  ↓
Approved proposals → next ship cycle implements
Rejected → archived, permanent audit
Deferred → resurfaces in 4 weeks
```

### 4.2 Founder review process

Weekly review target: 15-30 min. Founder:
1. Opens `.claude/state/proactive-proposals/<latest>.md`
2. Per proposal: edits decision field (Accept/Reject/Defer/Comment)
3. Saves file
4. Commits with message: `decisions(proactive): <YYYY-MM-DD> proposal queue reviewed`

Next ship cycle reads decisions + implements approved.

### 4.3 Decision capture format

Per proposal section:

```markdown
### PROP-001 — <title>
[... proposal content ...]

**Founder decision:** Accept
**Founder note:** "Good catch. Implement next ship cycle."
**Decision date:** 2026-05-20
```

OR

```markdown
**Founder decision:** Reject
**Founder note:** "Don't think this matters at current scale."
**Decision date:** 2026-05-20
```

OR

```markdown
**Founder decision:** Defer
**Founder note:** "Revisit after Wave 1 closes."
**Decision date:** 2026-05-20
```

### 4.4 Implementation discipline

When ship cycle implements approved proposal:
1. Treats it as mini-ship within main cycle work
2. Full audit-first + retrospective discipline
3. Marks proposal as `implemented_at: <timestamp>` in queue file
4. Commits with message referencing PROP-XXX ID

---

## 5 — Quality bar for proposals

### 5.1 Every proposal must include

- **Observation** — what was detected, with evidence
- **Proposed action** — concrete, not vague
- **Estimated cost** — implementation time + tokens
- **Risk classification** — low/medium/high with rationale
- **Reversibility** — trivial/moderate/expensive
- **Justification** — why this is worth doing
- **Detection method** — how the agent found it (replicable)

### 5.2 What kills a proposal at quality bar

Critic rejects proposals that are:
- Vague ("button looks off")
- Unsupported ("performance might be better")
- Outside-lane (new feature disguised as polish)
- Speculative bug hunts ("what if X breaks?" without reproducer)
- Repeats of past proposals (already rejected)
- Cost > impact (10-hour polish for 2-pixel improvement)

Critic flags rejected proposals before they reach Founder. Saves Founder review time.

### 5.3 Calibration over time

Per-cycle review:
- Founder acceptance rate per agent
- Founder acceptance rate per lane
- Implementation success rate (did approved proposals actually deliver the claimed improvement?)
- Critic rejection rate at quality bar

Calibration data informs next cycle's proposal generation. Agents whose proposals get consistently rejected at Founder review should propose less or shift lanes.

---

## 6 — Proposal volume guidance

### 6.1 Per-week target

- Lane 1 (UI Polish): 3-8 proposals
- Lane 2 (Bug Discovery): 2-5 proposals
- Lane 3 (Performance): 1-3 proposals
- Lane 4 (Design System): 0-2 proposals

Total: ~10-15 proposals/week steady state.

### 6.2 Founder review time budget

- ~2 minutes per proposal review
- 10-15 proposals = 20-30 min/week
- This is the Founder's TOTAL weekly time commitment for proactive review

If proposal volume exceeds this consistently → Critic flags → orchestration team self-limits OR Founder amends volume target.

### 6.3 Quality > volume

A week with 3 high-quality proposals is better than 15 vague ones. Critic enforces.

---

## 7 — Anti-patterns

### Anti-pattern 1: Scope creep masking as polish
❌ "Lane 1 UI polish: redesign the entire onboarding flow."
That's not polish; that's a redesign. Goes to Founder via FIQ, not proactive queue.

### Anti-pattern 2: Speculative bug hunts
❌ "Lane 2: investigate whether Safari might have a race condition somewhere."
No evidence, no reproducer. Bug discovery requires DATA, not hypotheses.

### Anti-pattern 3: Performance vibes
❌ "Lane 3: the app feels slow on the leaderboard page."
Feel ≠ measurement. Lane 3 requires baseline + projected delta with methodology.

### Anti-pattern 4: Token proliferation
❌ "Lane 4: add `--cb-brass-extra-soft` token for one usage in 3o Profile."
Tokens require 3+ usages. Single-use tokens are anti-pattern.

### Anti-pattern 5: Proactive as governance amendment
❌ "Lane 1: change the empty-state copy on Trophy Room to be funnier."
Editorial voice is locked governance. Changes require Founder ratification.

### Anti-pattern 6: Bypassing Critic at quality bar
❌ Agent files proposal without Critic pre-review.
All proposals get Critic quality-bar pass before reaching Founder queue.

### Anti-pattern 7: Re-proposing rejected items
❌ "Lane 1: PROP-007 (rejected last month)."
Rejected proposals stay rejected. Re-proposing requires Founder direction.

---

## 8 — Integration with existing governance

### 8.1 With FOUNDER_INPUT_QUEUE
- Bugs needing Founder direction = FIQ entry (questions)
- Improvements not needing Founder direction = proactive proposal (suggestions with provisional default)

### 8.2 With locked design system
Lane 1 + Lane 4 work cites design system sections in proposals. Proposals that violate design system are rejected at quality bar.

### 8.3 With cost-discipline
Proactive cycle has its own cost cap (120k tokens). Proactive implementation work inside ship cycles counts toward ship cycle budget.

### 8.4 With wellness/rest cycles
During rest cycles, agents CAN review proactive proposals from previous weeks. CANNOT generate new proposals (that's the proactive cycle's job).

### 8.5 With Critic discipline
Critic owns quality-bar pre-review of all proposals before Founder sees them. Critic's review is logged per proposal.

---

## 9 — Cross-references

- `HEADLESS_OPERATION_PROTOCOL.md` (cron cycle definitions)
- `PROACTIVE_PROPOSAL_QUEUE_TEMPLATE.md` (proposal format)
- `parbaughs-proactive-proposal` skill
- `FOUNDER_INPUT_QUEUE.md` (when to FIQ vs propose)
- `HALT_CRITERIA_v7_ADDENDUM.md` item 19 (proactive scope violation)
- `SESSION_JOURNAL_v7_ADDENDUM.md` (proposal entry types)
- Locked design system docs (CLUBHOUSE_SPEC + HQ specs)

---

*Document authored 2026-05-12. Locked Founder ratification.*
