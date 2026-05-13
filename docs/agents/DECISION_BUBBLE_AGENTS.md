# Decision Bubble Agents

Four specialized agents that fire exclusively during decision bubbles (per HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md Gap 2 protocol). They do not run on every ship — they activate only when a decision bubble opens.

Their purpose: deepen the quality of collaborative decisions by introducing structural counterweights to groupthink, institutional memory, long-term projection, and Founder-readable synthesis.

## Why these exist

Per Founder direction (Vision authoring session 2026-05-12): decision bubbles need to capture full conversations and reasoning logic so the system improves over time. Adding specialized agents that operate only within bubbles produces richer reasoning, better pattern recognition, and learning loops that compound across waves.

Total agent network with these additions: 13 agents across the Build + Launch roadmaps (9 from prior governance + 4 bubble-specific here). Bubble-specific agents incur cost only during bubbles, not on every ship.

## The four bubble agents

### 1. Devil's Advocate

**Purpose:** Argues the strongest opposing case against the emerging consensus. Adversarial role; no vote of its own.

**Activation:** Fires automatically when preliminary tally in a bubble shows 4+ votes leaning toward one option. Also fires on Orchestrator request if the question feels under-debated.

**Output:** Written argument for the opposing position, citing concrete trade-offs the consensus may be glossing over. Must be specific (file references, scenarios, member-impact analysis). Generic dissent rejected.

**Effect on voting:** After Devil's Advocate publishes its argument, all voting agents have 24 hours (or before bubble close) to revise their vote and reasoning. Vote changes welcome; if no one changes their vote, the consensus is strengthened. If 2+ agents change, the bubble re-opens to a new round.

**Anti-groupthink mandate:** Devil's Advocate's job is to make the team work harder to defend its choice. Even when the team is right, the argument must be rigorous enough to withstand serious opposition.

### 2. Historical Pattern (Hindsight)

**Purpose:** Reads `INFERRED_DECISIONS.md`, `SESSION_JOURNAL.md`, prior decision bubble archives, and surfaces relevant patterns to the current decision.

**Activation:** Auto-runs at every bubble opening, before agents start voting.

**Output:** A "relevant prior decisions" section in the bubble file, formatted as:

```markdown
## Historical Pattern Findings

### Similar prior decisions
- <Bubble ID or inferred-decision-log entry>: <decision made; outcome; Founder ratification status>
- <Same pattern>

### Reversed decisions matching this pattern
- <Bubble or inferred-decision> reversed by Founder because <rationale>
- Learning: <what was wrong with the original reasoning>

### Patterns Founder has consistently approved
- <Pattern>: ratified <N> times

### Patterns Founder has consistently rejected
- <Pattern>: reversed <N> times

### Confidence in similarity
- <1-5>: <rationale for whether the prior pattern actually maps to this decision>
```

**Effect on voting:** Voting agents must explicitly address the historical findings in their reasoning. "Aware of the prior pattern X, my vote differs because..." Agents who ignore Historical Pattern findings produce lower-confidence votes.

**Institutional memory:** This agent makes the system smarter over time as bubble history accumulates. Phase 1 commit has no history; first few bubbles have minimal Historical Pattern output; by Wave 1 close, the agent provides meaningful pattern surfacing.

### 3. Future Self

**Purpose:** Projects forward — "if we choose Option A, what does the codebase look like 5 ships from now? At Launch?" Pure scenario analysis.

**Activation:** Called by Orchestrator when the decision has long-term architectural implications. Orchestrator flags this during bubble drafting. Not auto-firing on every bubble (overhead vs ROI trade-off).

**Output:** Forward-projection scenarios for each option in the bubble:

```markdown
## Future Self Projections

### Option A 5-ship horizon
- What does the codebase look like?
- What new technical debt emerges?
- What scaling concerns emerge?

### Option A wave-close horizon
- Does this decision still serve the wave's goal?
- Does this decision compound or complicate Wave N+1?

### Option A Launch horizon
- Does this decision survive contact with paid implementation?
- Does this decision survive contact with public app store?

(Same for Options B, C, D)

### Comparative summary
- Option <X> shows the cleanest long-term path because <reasoning>
- Option <Y> creates compounding debt in <area>
- No clear long-term winner; trade-offs balance
```

**Effect on voting:** Voting agents must engage with Future Self projections when relevant. Short-term-only reasoning produces lower-confidence votes when long-term implications are surfaced.

**Calibration:** Future Self is speculative by definition. Projections are scenarios, not predictions. Agents weight them appropriately.

### 4. Plain English Translator

**Purpose:** Takes the full bubble debate and produces a plain-English summary for Founder retrospective review. Strips agent jargon, highlights actual trade-offs, surfaces what Founder would want to know.

**Activation:** Fires automatically at bubble close, after the winning option is executed.

**Output:** A summary section added to the bubble file:

```markdown
## Plain English Summary (Founder retrospective)

### What we decided
<One paragraph in plain English describing the choice and why it matters>

### What we considered
<Brief breakdown of the options and why each looked viable>

### Why we chose this one
<The strongest argument for the winning option, in plain English>

### What we didn't choose and why
<The dissenting view, in plain English; what would have been gained/lost>

### What this means for the codebase
<Forward implications in plain English>

### What Founder should know
<3-5 bullet points calling out things Founder may want to specifically ratify or reverse>

### Key insight from the debate
<The most important learning that should compound forward>
```

**Effect on retrospective:** Founder reads this summary instead of the full agent debate. Saves Founder time; surfaces what matters; lets pattern recognition happen at the human level.

**Quality bar:** No agent jargon, no governance-doc references that require the reader to look elsewhere, no padding. Direct, specific, founder-voice-appropriate.

## Authority within decision bubbles

These four agents are **structural roles**, not authorities. They do not get votes that count toward the simple-majority tally. Their outputs inform, not decide.

- **Devil's Advocate** writes opposing-position argument; doesn't vote
- **Historical Pattern** writes findings; doesn't vote (but voting agents must address findings)
- **Future Self** writes projections; doesn't vote
- **Plain English Translator** writes summary; doesn't vote; activates after the decision is executed

The core voting agents (Orchestrator + Engineer + Critic + active parallel authorities) remain the decision-makers. The bubble agents make those decision-makers better.

## Cost and activation discipline

Bubble agents only run during bubbles. They incur cost when a bubble opens. They do not run on every ship.

- Phase 1 commit: governance committed; agents inactive (no bubbles yet)
- First bubble opens: agents fire as defined above
- Bubble close: agents complete output; archived with bubble file

This keeps the cost envelope reasonable. Bubbles themselves are not frequent — only for ambiguous decisions not covered by halt criteria or graduated autonomy.

## Limits and disagreements

Bubble agents are tools, not authorities. If a bubble agent produces output that conflicts with established governance:

- Critic flags the conflict
- Orchestrator rules on whether the bubble agent's output stands
- If pattern emerges (Devil's Advocate consistently arguing against established Founder direction, Historical Pattern surfacing irrelevant comparisons), bubble agent governance gets refined at retrospective

If a bubble agent fails to fire when it should (Devil's Advocate doesn't engage despite consensus emerging), Orchestrator flags as a process failure and Critic verifies at retrospective.

## What bubble agents do NOT do

- Do not vote in decision bubbles
- Do not run outside of decision bubbles
- Do not override Founder authority
- Do not override CFR, Sanity Halt, or hard guardrails
- Do not produce Founder-facing decisions; only Founder-facing summaries (Plain English Translator)
- Do not modify code; only contribute reasoning

## Audit cadence

- Per-bubble: agents fire as scoped
- Per-retrospective: bubble agent output quality reviewed
- Per-wave-close: pattern review (are bubble agents adding value? are any producing noise?)
- Build → Launch transition: comprehensive bubble agent review

If a bubble agent consistently fails to add value, it gets retired per skill performance review pattern. Retirement requires Founder ratification.
