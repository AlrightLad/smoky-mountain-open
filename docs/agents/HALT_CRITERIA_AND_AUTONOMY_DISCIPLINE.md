# Halt Criteria and Autonomy Discipline

The master governance for when agents halt vs continue. Establishes explicit halt list, explicit do-NOT-halt list, refined cost-halt thresholds, trial-setup hard rule, decision-bubble protocol with full reasoning capture, pre-halt self-check, and session journal discipline.

## Why this exists

Per Founder direction (Vision authoring session 2026-05-12): the orchestration team was halting on items that did not require Founder attention. The goal was a minimum-prompt mode where agents act with confidence, collaborate among themselves on ambiguous decisions via decision bubbles, and halt only on items that genuinely require Founder ruling.

This document is the single source of truth. When agents are uncertain whether to halt, they read this document. If a situation isn't covered here, the answer is **continue with collaborative decision-bubble process** unless one of the explicit halt criteria applies.

## The explicit halt list

Agents halt ONLY for items on this list. Nothing else.

### Permanent-Founder-approval categories (never graduate, always halt)

1. **Critical Feature Registry triggers** — all 11 categories per CRITICAL_FEATURE_REGISTRY.md
2. **Sanity Halt conditions** — all 9 categories per SANITY_HALT.md
3. **Vision authoring** — Founder authors before any agent work begins on a ship
4. **Roadmap structure changes** — Founder edits ROADMAP.md; agents acknowledge
5. **Cost-incurring architecture per refined thresholds** — see Cost-Halt Thresholds section below
6. **Wave-to-wave gate ratifications** — Founder ratifies wave closes
7. **P0/P1 production rollback decisions** — Founder synchronous presence required

### Hard guardrails (vote/collaboration cannot override)

8. **Anything modifying production data without revert path** — halt regardless of vote
9. **Anything affecting auth, security, or Firestore rules** — halt regardless of vote
10. **Anything that would expose member data beyond intended visibility** — halt regardless of vote
11. **Anything that would commit a vendor bill within 30 days without prior Founder approval** — halt regardless of vote
12. **Trial setups of any kind** — halt regardless of vote (see Trial Setup Hard Rule below)

If a situation hits any of items 1-12, halt immediately. Do not vote, do not continue, do not infer. Escalate to Founder.

## Trial Setup Hard Rule (no graduation, no exceptions)

Any of the following requires Founder approval — agents do NOT activate these autonomously regardless of any tier graduation, vote outcome, or apparent free-ness:

- Starting a free trial of any paid service (Stripe trial, Mux trial, Datadog trial, any vendor trial)
- Starting a "free with credit card on file" arrangement
- Activating any service where billing begins after a trial period without further action
- Activating any "freemium" service where premium features default-on with future billing
- Activating any service requiring credit card entry even if "no charge today"
- Signing up for any service that requires payment-method registration as part of signup
- Activating any "first N units free, then billed" tier without explicit Founder ratification

**Reasoning:** Trials become bills. Founder controls vendor relationships and billing surfaces. No agent autonomy on trial activation regardless of graduated autonomy tier.

**Decision bubble vote cannot override this rule.** If a bubble's winning option requires a trial setup, the bubble does not execute; Orchestrator escalates to Founder.

## The explicit do-NOT-halt list

Agents continue without halt for these — even if uncertain. Use collaborative decision-bubble process if uncertain about specifics.

### Operational decisions within current graduated autonomy tier

- Skill triggering false-positive fixes (Tier 1+)
- Skill content drafting (Tier 1+)
- Backlog item severity tagging (Tier 1+)
- Phase report formatting decisions (Tier 1+)
- Member-relevance classification for Caddy Notes (Tier 1+)
- Skill modifications to existing approved skills (Tier 2+)
- Hook false-positive adjustments to loosen overly-strict matchers (Tier 2+)
- Ship plan phase-breakdown decisions (Tier 2+)
- Member-facing Caddy Notes copy authoring (Tier 2+)
- Member-facing roadmap section drafting (Tier 2+)

### Implementation choices that don't affect Vision or violate guardrails

- File path or directory placement (within established conventions)
- Variable / function / class naming
- Code style choices within lint compliance
- Import organization
- Test case enumeration (within ship acceptance criteria)
- Documentation phrasing within Caddy Notes Writing Standard
- Component breakdown within a single page
- State management approach within a single feature
- Helper extraction decisions
- Cross-browser compatibility approach choices
- Smoke test naming and organization
- Visual screenshot capture detail level

### Free-tier dependencies and tools (genuinely free, no payment method required)

- Adding open-source NPM dependencies (free, MIT/Apache/BSD/similar license, no payment method)
- Using truly free third-party APIs (no payment method registration ever)
- Using free Firebase services within Blaze plan's free quota (Blaze already authorized)
- Adding dev dependencies (free, no payment method)
- Using GitHub Actions runner minutes within GitHub's free tier (no payment method beyond existing account)
- Using free Playwright browsers (already in stack)
- Using free pose detection libraries (TensorFlow.js, etc. per W1.S10; no payment method)

**Note:** "Free tier" here means genuinely free — no credit card on file, no payment method registered, no billing potential without further explicit Founder action. If the service requires payment method at any point in signup, it's a trial setup and falls under item 12 (hard guardrail).

### Backlog and lessons-learned decisions

- Adding items to backlog
- Closing backlog items resolved within current ship
- Capturing lessons to lessons-learned
- Updating SESSION_JOURNAL.md
- Updating INFERRED_DECISIONS.md
- Updating DEVELOPMENT_GRADE_LOG.md
- Drafting Caddy Notes entries

### Internal coordination

- Inter-agent disputes resolvable within graduated autonomy tier
- Decision bubbles opened, voted on, closed by orchestration team
- Skill performance review at retrospective
- Bug scan classification
- Inferred decision logging

### Bug Triage Listener auto-repair (per BUG_TRIAGE_LISTENER.md)

Bug Triage Listener may autonomously auto-repair bugs **within strict scope** without opening a decision bubble or escalating:
- P3 cosmetic bugs with isolated single-file CSS changes
- P3 typos and copy fixes respecting leak protection
- P3 ARIA label additions (no modification of existing)
- P3 console warning fixes within single file
- P2 known-pattern fixes with high-confidence Historical Pattern match

Auto-repair must pass smoke + lint + visual verification before autonomous push. Auto-repair attempts outside this scope route to orchestration team. Auto-repair attempts that fail verification full-revert and route to orchestration team.

If a situation matches items in the do-NOT-halt list, agents proceed. They may open a decision bubble for collaborative input but do not escalate to Founder.

## Cost-halt thresholds (refined)

Per Gap 3 refinement, Cost Halt categorical breakdown:

| Category | Halt threshold | Continue-without-halt condition |
|---|---|---|
| Vendor billing within 30 days | ANY $ amount triggers halt | No bill in 30 days |
| Trial setup of any paid service | HALT regardless of $ | Truly free (no payment method) |
| Free tier dependency (no payment method) | No halt at any usage level | Free tier coverage confirmed |
| Free tier with documented graduation path | No halt until graduation imminent | Graduation > 30 days away |
| Firebase Blaze usage within free quota | No halt under quota | Under quota |
| Firebase Blaze usage above free quota | Halt at projected $25/month sustained | Projected $0/month |
| Cloud Function invocations | Halt at projected $25/month current scale OR $250/month at 10x | Below both thresholds |
| Firestore reads/writes | Halt at projected $50/month current scale OR $500/month at 10x | Below both thresholds |
| Firebase Storage | Halt at projected $25/month current scale OR $250/month at 10x | Below both thresholds |
| NPM/yarn dev dependency (free, no payment method) | No halt | Open-source dependency |
| NPM/yarn dependency requiring license fee | Halt regardless of amount | Free license |
| Third-party API (truly free, no payment method) | No halt at current usage; document graduation path | Free, no payment registration |
| Third-party API (paid OR requires payment method) | Halt regardless of amount | Free alternative exists |
| Stripe transactions (Launch Phase A) | No halt for integration; halt for transaction-fee-affecting decisions | Phase A scope inherent |
| GitHub Actions runner minutes | Halt at projected 2000+ minutes/month sustained | Below free-tier ceiling |
| Apple Developer Program | Halt at enrollment time ($99/year) | Already enrolled |
| Domain renewal | Halt at renewal time | Already renewed |
| One-time tooling cost | Halt at $50+ regardless of category | Below $50 |

### Cost-halt clarifications

- **"Halt threshold" means escalate to Founder**, not stop all other work
- **"Projected" means orchestration team's cost projection** based on 10x scalability mandate analysis
- **Multiple categories may apply** to a single decision — most restrictive wins
- **"Sustained" means 2+ months projected** at the threshold; one-month spikes don't trigger halt
- **Halt thresholds apply per-decision**, not cumulatively per month — each decision evaluated independently
- **Annual recurring cost ceiling: $1,000/year cumulative** across all categories at current scale; above $1,000 cumulative requires comprehensive Founder review even if individual decisions cleared
- **Payment method registration trumps cost projection** — a $0/month service that requires credit card on file is a trial setup (item 12), not a free tier

### Cost halt comparison matrix mandate

For any halt-triggering cost decision, Engineer drafts a 3+ option comparison matrix per the locked Cost Halt + Scalability mandate. Matrix must include:
1. The proposed paid option (with cost projection)
2. A free-tier alternative (with limitations documented)
3. A defer-to-later alternative (with implications of deferral)
4. Comparison of trade-offs (correctness, performance, cost, scalability, member-trust impact)
5. Founder ratifies the choice with full context

## Decision-bubble protocol (Gap 2 — replaces "halt on ambiguity")

When orchestration team encounters ambiguity not covered by HALT_CRITERIA above and not clearly an inferred decision the current Tier covers, agents collaborate via decision bubble instead of halting.

### Trigger

Orchestrator (or any agent) identifies an ambiguous decision:
- Not on the halt list
- Not on the do-NOT-halt list
- Not clearly within current Tier autonomy
- Could be resolved multiple ways
- Outcome affects ship quality or downstream work

### Process

1. **Orchestrator opens decision bubble** at `docs/agents/decision-bubbles/<timestamp>-<short-id>.md`

2. **Historical Pattern agent auto-runs** (per DECISION_BUBBLE_AGENTS.md) — reads prior INFERRED_DECISIONS.md, SESSION_JOURNAL.md, archived bubbles; surfaces relevant patterns to the bubble file BEFORE voting starts

3. **Orchestrator states the question** in the bubble:
   - Specific decision needed
   - Why it's ambiguous
   - What's the risk if Founder were asked but it's actually agent-resolvable
   - Why halt criteria don't apply
   - Why graduated autonomy tier doesn't clearly cover

4. **Orchestrator proposes 2-4 options** with concrete pros/cons:
   - Each option specific enough to implement
   - Trade-offs explicit
   - Cost/risk/benefit per option

5. **Future Self agent fires if applicable** (per DECISION_BUBBLE_AGENTS.md) — Orchestrator flags if decision has long-term architectural implications; Future Self produces forward-projection scenarios for each option

6. **All voting agents debate, not just vote** — each voting agent (Orchestrator + Engineer + Critic + active parallel authorities) participates in the bubble with full reasoning chain:

   ```markdown
   ### <Agent name>
   - **Initial position** (gut-call before reading others): <option + brief reason>
   - **Considerations weighed**: <factors evaluated>
   - **Evidence cited**: <specific files, prior decisions, governance docs>
   - **Engagement with Historical Pattern findings**: <how prior patterns inform this vote>
   - **Engagement with Future Self projections** (if applicable): <how long-term scenarios inform this vote>
   - **Counterarguments addressed**: <what the opposing view would say; how rebutted>
   - **Confidence level (1-5)**: <number + rationale for the number>
   - **Final vote**: <option>
   ```

7. **Agents respond to each other** — debate happens in the bubble file, not parallel monologues. If Engineer raises a consideration Critic hadn't weighed, Critic must address it before voting. The debate transcript itself is the reasoning record.

8. **Devil's Advocate fires if preliminary tally hits 4+ in one direction** (per DECISION_BUBBLE_AGENTS.md) — writes strongest opposing case. Voting agents have until bubble close to revise vote.

9. **Vote tally**:
   - Quorum: minimum 3 agents must vote (Orchestrator + Engineer + Critic at minimum)
   - Parallel authorities encouraged to vote (Flow Documenter, End User, etc. if active)
   - Simple majority wins
   - Tie → Orchestrator breaks tie with documented rationale
   - Unanimous dissent against Orchestrator's initial framing → question re-stated; if still unanimous against, becomes real halt → Founder

10. **Orchestrator executes** the winning option — verifies hard guardrails not violated (especially items 8-12 of halt list); if violated, bubble escalates to Founder despite vote outcome

11. **Plain English Translator fires** (per DECISION_BUBBLE_AGENTS.md) — generates the Founder-readable summary section

12. **Bubble committed** to `docs/agents/lessons-learned/decision-bubbles/<wave>/<bubble-id>.md` at retrospective

13. **Logged to INFERRED_DECISIONS.md** as a Tier-tracked inferred decision

14. **Founder reviews at next retrospective** — ratifies or reverses based primarily on the Plain English summary

### Decision bubble file format (expanded)

```markdown
# Decision Bubble: <short title>

**Opened:** <timestamp>
**Opened by:** <agent>
**Ship context:** <ship ID and status>
**Status:** Open | Voting | Devil's Advocate Active | Closed | Founder reviewed

## Question

<Specific decision needed>

## Why this is a decision bubble (not a halt)

- Halt criteria checked: <which ones; why none apply>
- Hard guardrails checked: <items 8-12 verified safe>
- Trial setup check: <confirmed no trial activation involved>
- Graduated autonomy tier: <current tier; why decision doesn't clearly fit>
- Cost halt thresholds: <verified below threshold>

## Historical Pattern Findings (auto-generated)

### Similar prior decisions
<populated by Historical Pattern agent>

### Reversed decisions matching this pattern
<populated by Historical Pattern agent>

### Patterns Founder has consistently approved
<populated by Historical Pattern agent>

### Patterns Founder has consistently rejected
<populated by Historical Pattern agent>

### Confidence in similarity (1-5)
<populated by Historical Pattern agent>

## Options

### Option A — <name>
- Description:
- Pros:
- Cons:
- Cost impact:
- Risk:

### Option B — <name>
- Description:
- Pros:
- Cons:
- Cost impact:
- Risk:

(2-4 options total)

## Future Self Projections (if applicable)

<populated by Future Self agent if Orchestrator flagged long-term implications>

## Debate Transcript

### Orchestrator
- Initial position:
- Considerations weighed:
- Evidence cited:
- Engagement with Historical Pattern findings:
- Engagement with Future Self projections:
- Counterarguments addressed:
- Confidence (1-5):
- Final vote:

### Engineer
(same structure)

### Critic
(same structure)

### Parallel authorities (Flow Documenter, End User, etc., if active and relevant)
(same structure)

### Inter-agent responses
<chronological back-and-forth as agents engage with each other's reasoning>

## Devil's Advocate (if fired)

### Triggering condition
<preliminary tally that triggered DA>

### Opposing position argument
<strongest case for the dissenting option, written by Devil's Advocate>

### Voting changes after Devil's Advocate
<which agents revised their vote; reasoning>

## Tally

- Total votes: N
- Quorum met: Y/N
- Winner: <option>
- Decision: <final>
- Dissents captured: <list>

## Hard Guardrail Verification

- Item 8 (production data revert path): <verified>
- Item 9 (auth/security/Firestore rules): <verified>
- Item 10 (member data exposure): <verified>
- Item 11 (vendor bill within 30 days): <verified>
- Item 12 (trial setup): <verified — no trial activation>
- Bubble execution authorized: Y/N

## Execution

- Action taken: <what was done>
- Files modified: <list>
- Outcome: <verified result>

## Plain English Summary (Founder retrospective)

<populated by Plain English Translator agent>

### What we decided
<plain English>

### What we considered
<plain English>

### Why we chose this one
<plain English>

### What we didn't choose and why
<plain English>

### What this means for the codebase
<plain English>

### What Founder should know
<3-5 bullet points>

### Key insight from the debate
<the most important learning>

## Founder review

- Status: pending | ratified | reversed
- Founder note: <captured at retrospective>
- Pattern recognition adjustment: <if reversed, what pattern shifts>
```

### Hard guardrails (vote/collaboration cannot override)

Even with unanimous agent vote, agents do NOT proceed if any of these apply:

1. Any item on the explicit halt list (items 1-12 above)
2. Any cost decision above refined cost-halt thresholds
3. Any modification to production data without revert path
4. Any modification to auth, security, or Firestore rules
5. Any decision that would expose member data beyond intended visibility
6. Any decision that overrides explicit Founder direction captured in memory or governance
7. Any decision that would activate a trial setup (item 12 of halt list)

These guardrails are absolute. Vote is invalid if it attempts to override these.

## Pre-halt self-check protocol (Gap 4)

Before any agent escalates to Founder, agent runs this 5-question self-check:

1. **Is this question covered by any existing governance document?**
   - Read HALT_CRITERIA, SANITY_HALT, CFR, PROTOCOLS, ship plan, Vision
   - If yes: follow governance; if governance says halt, halt; if not, continue
   - If no: proceed to question 2

2. **Have I attempted to resolve via available tools?**
   - Web search for current best practice
   - Code grep for existing patterns
   - Design spec read for Vision intent
   - Memory check for Founder direction
   - If not all attempted: do them; reconsider
   - If all attempted and still unresolved: proceed to question 3

3. **Could this be a decision bubble instead of a halt?**
   - Are there 2-4 reasonable options?
   - Are other agents available to vote?
   - Would the orchestration team collectively choose one option with confidence?
   - If yes: open decision bubble instead of halting
   - If no: proceed to question 4

4. **Could I make an inferred decision under current graduated autonomy tier?**
   - What tier is currently active?
   - Does this decision match patterns Founder has previously ratified?
   - Could I log to INFERRED_DECISIONS.md and continue?
   - If yes: do that; do not halt
   - If no: proceed to question 5

5. **Does the situation genuinely match an explicit halt criterion?**
   - Walk through items 1-12 of the explicit halt list
   - Specifically: is this CFR? Sanity Halt? Vision? Roadmap? Cost-halt threshold? Wave gate? P0/P1? Trial setup?
   - If yes, with specific match: halt and escalate
   - If no: do not halt; use decision bubble or inferred decision

**Self-check is mandatory.** Halts that survive all 5 questions are real halts. Halts that fail any question get converted (to inferred decision, decision bubble, or continuation).

## Session journal discipline (Gap 5)

Orchestration team maintains a single appended-only journal at `docs/agents/SESSION_JOURNAL.md`.

### Format per entry

```markdown
## <timestamp> — <session-id> — <agent>

**Decision:** <what was decided>
**Rationale:** <why>
**Outcome:** <what happened>
**Files affected:** <list>
**Cross-references:** <ship ID, decision bubble ID, INFERRED_DECISIONS.md entry>
```

### When entries are appended

- Every meaningful decision made during a session
- Every decision bubble opened or closed
- Every inferred decision logged
- Every halt that was avoided via self-check
- Every cost-halt threshold check passed or failed
- Every trial setup attempted-and-halted (per item 12)
- Every wave-gate or ship-close activity

### Why this exists

Per Anthropic's published research on long-running agents: agents work in discrete sessions; each new session begins with no memory of what came before. The session journal bridges sessions — future agents read it to understand decision history and resume work without ambiguity.

### Read protocol per session start

At every session start, Orchestrator reads:
1. Last 5 entries in SESSION_JOURNAL.md
2. Any decision bubble files marked Open
3. Any items in PHASE_1_FOUNDER_REVIEW or current wave equivalent

This gets the team up to speed on prior session state without forcing reading everything.

### Compaction

If SESSION_JOURNAL.md exceeds 10,000 lines, Orchestrator archives the older portion to `docs/agents/session-journal-archive/<wave>.md` and starts fresh.

## What this document is NOT

- Not a substitute for individual governance files (CFR, Sanity Halt, etc.). This document references and reinforces them.
- Not a way to bypass Founder permanent-approval categories. Items 1-12 of halt list remain absolute.
- Not a way to expand graduated autonomy without Founder ratification. Tier progression remains per GRADUATED_AUTONOMY.md.
- Not a substitute for retrospective review. Decision bubbles and inferred decisions still get reviewed by Founder.

## Initial state

At Phase 1 commit (after this governance is in repo):
- All halt list items active (items 1-12 including trial-setup hard rule)
- All do-NOT-halt list items active
- Cost-halt thresholds active
- Decision bubble protocol available
- Bubble-specific agents (Devil's Advocate, Historical Pattern, Future Self, Plain English Translator) committed per DECISION_BUBBLE_AGENTS.md; fire on first bubble
- Pre-halt self-check mandatory before any escalation
- Session journal active at `docs/agents/SESSION_JOURNAL.md`

First decision bubble fires at first ambiguous situation post-activation. No retroactive application.

## Audit cadence

- Per-retrospective: review decision bubble accuracy (did votes match Founder ruling?)
- Per-wave-close: review halt-vs-continue patterns (was anything halted that should have been a bubble? was anything bubbled that should have been a halt?)
- Per-wave-close: review bubble agent output quality (Devil's Advocate adding value? Historical Pattern accurate? Future Self calibrated? Plain English Translator useful?)
- Per-Build → Launch transition: comprehensive review of all halt/continue/bubble mechanics

## Updates to this document

Founder amends at any time. Halt criteria additions are retroactive (future decisions). Do-NOT-halt additions are retroactive. Cost threshold changes apply going forward only (prior decisions stand). Trial-setup hard rule cannot be relaxed except by explicit Founder ratification documented in this file.
