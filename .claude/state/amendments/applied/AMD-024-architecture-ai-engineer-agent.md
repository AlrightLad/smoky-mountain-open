---
id: AMD-024
title: Architecture / AI Engineer Agent + free-replication-first principle
target_canonical_path: docs/agents/ARCHITECTURE_AGENT.md
source_draft_path: .claude/state/amendments/pending/AMD-024-architecture-ai-engineer-agent.md
scope_summary: Add 6th always-on specialized agent (Architecture/AI Engineer). Operating mode: extremely deep thinker + extensive researcher. Free-replication-first principle paramount — paid services are last resort. Multi-cadence review (daily 30-60min / weekly 3-5h / monthly 8-12h / on-demand). Output lives at .claude/state/architecture-review/. Recommendations flow into other agents' task queues via AMD-022; Founder ratifies before any execution.
type: new-file
section_anchor: null
depends_on:
  - AMD-009
  - AMD-015
  - AMD-016
  - AMD-017
  - AMD-018
  - AMD-022
authored_by: claude-code
authored_at: 2026-05-14T23:25:00Z
bubble_of_record: null
estimate_tokens_to_apply: 5000
rollback_strategy: Stop the architecture agent's agent-view session. Existing .claude/state/architecture-review/ output remains as audit trail; can be deleted if substrate weight outweighs value. Replications case studies stay even on rollback (they're project knowledge artifacts, not agent state).
status: pending
operating_status: ACTIVE — Architecture/AI Engineer Agent role defined; boot prompt added to migration handoff; substrate directory + case studies seeded. Awaiting Founder ratification + first agent-view dispatch.
---

# Architecture / AI Engineer Agent + free-replication-first principle

Founder direction 2026-05-14 "ARCHITECTURE/AI ENGINEER AGENT — Always-
on deep thinker + researcher". 6th specialized always-on agent in the
agent-view multi-session model. Strategic thinking + extensive research
+ free-replication-first.

## What changes

### 1. New agent role

A 6th always-on specialized session dispatched via `claude agents`.
Scope: continuous substrate review + ecosystem research + paid-to-free
replication. Does NOT execute on member-facing code or other agents'
surfaces; surfaces recommendations via task queue (AMD-022) for owning
agents to pick up.

In scope:
- Full substrate state audit (continuous)
- Agent activity pattern analysis
- Failure mode + recurring pattern detection
- Stop-decision log analysis (false stops, real stops, trends)
- Error-backlog analysis + severity distribution
- Lessons-learned synthesis
- Memory consolidation via `~/.claude/skills/dream/` (weekly minimum)
- AI ecosystem research (Anthropic releases, community patterns)
- Substrate amendment proposals
- Free-tool installation proposals
- Architecture report generation (daily / weekly / monthly cadences)
- Cross-agent coordination effectiveness analysis
- Replication of paid features as free substrate
- Long-horizon planning (30 / 90 / 180 day horizons)

Out of scope:
- Execution work (other agents handle their domains)
- Modifying `src/pages/` / `docs/reports/*` / `tests/`
- Authoring fixes for individual bugs (surface to owning agent via
  task queue)
- Cloud Function deploys / Firestore rule edits (AMD-018 exception
  list)
- Day-to-day operational work

### 2. Free-replication-first principle (paramount)

Paid services are LAST RESORT, never default. For every recommendation
that proposes a tool or service:

1. List free alternatives (open-source, built-in, community)
2. Capability gap between free and paid
3. DIY replication cost (one-time + ongoing)
4. Maintenance burden of free vs paid
5. Only consider paid if free path adds >10× more work than capability
   justifies

When a paid service is genuinely better, the recommendation must
explicitly justify the cost/benefit. When a free equivalent exists or
can be built reasonably, the free path is the recommendation.

This project has already replicated 5 paid services. Case studies live
at `.claude/state/architecture-review/research/replications/`:

- Z.AI Vision MCP → Read tool built-in vision
- Applitools visual testing → Playwright MCP + pixelmatch (in
  progress)
- Composio design-review-loop → design-bot via Playwright MCP +
  frontend-design skill
- Linear / Jira → `.claude/state/task-queue/` (AMD-022)
- Datadog / New Relic → custom cron + sidecar + banner pattern

### 3. Multi-cadence review

| Cadence | Runtime | Output |
|---|---|---|
| Daily | 30-60 min | `daily/<YYYY-MM-DD>.md` — health rollup, stop-decision check, error severity, daily priorities, banner refresh |
| Weekly | 3-5 h | `weekly/<YYYY-WW>.md` — 7-step deep-thinking methodology output, memory consolidation, ecosystem research, recommendation packet |
| Monthly | 8-12 h | `monthly/<YYYY-MM>.md` — multi-week pattern synthesis, long-horizon planning, architecture evolution roadmap, maturity assessment |
| On-demand | varies | Founder invokes for specific decision; surfaces inline via task queue |

### 4. Deep-thinking methodology (mandatory for every recommendation)

7 steps:

1. **STATE THE PROBLEM** — evidence-based, not "feels-like"
2. **ENUMERATE HYPOTHESES** — at least 3 with supporting/contradicting
   evidence and likelihood ranking
3. **RESEARCH CURRENT BEST PRACTICE** — primary sources (Anthropic
   docs, official blogs, RFCs, papers), multiple community implementations
4. **EVALUATE FREE ALTERNATIVES FIRST** — paid is last resort
5. **PROPOSE WITH RATIONALE** — specific recommendation + why over
   alternatives + expected outcome + validation method + cost + rollback
6. **ANTICIPATE SECOND-ORDER EFFECTS** — what does this make harder?
   what other agents/systems are affected? mitigation
7. **CITE SOURCES** — every external claim has a link; internal claims
   reference state file or commit hash

### 5. Research discipline

Web searches per cycle target current state of:

- "Anthropic Claude release [current month]" — new features
- "Claude Code [feature] community alternative free" — free replication
- "MCP server [capability] open source" — free tooling
- "agentic workflow [pattern] best practice" — pattern research
- "site:github.com claude code [pattern]" — community implementations
- "Reddit r/ClaudeAI [topic]" — community discourse

Primary-source priority:
1. docs.claude.com — Anthropic official docs
2. claude.com/blog — Anthropic release announcements
3. github.com/anthropics — Official skills, examples
4. Open-source community repos (high stars + recent activity)
5. Engineering blogs from teams using similar agentic stacks
6. Research papers on agentic systems

Reject:
- SEO-spam aggregators
- Outdated tutorials (>1 year old unless foundational)
- Paid services positioned as "essential"
- Vendor blogs masquerading as objective

### 6. Coordination with other agents

Findings flow into other agents' task queues per AMD-022:

```
Test/QA flags pattern → Architecture investigates root cause →
proposes substrate amendment → Founder ratifies →
Architecture writes task to task-queue/<surface-owner>/ →
owning agent executes → Architecture monitors outcome in self-eval
```

### 7. Push posture

This agent does NOT push commits upstream. All output is PROPOSALS
(recommendations) that the Founder ratifies before any other agent
acts on them. Recommendations live local until ratified. Only their
EXECUTION (by the owning agent) generates pushable commits.

This is a hard constraint — the architecture agent's value is in
strategic thinking + research, not unilateral substrate changes.

### 8. Token / quota considerations

This agent is the most expensive per cycle (deep thinking + extensive
research). Budget guidance:

- Daily: moderate (~30-60 min runtime)
- Weekly: high (~3-5 hours)
- Monthly: very high (~8-12 hours)

If approaching weekly cap:
- Defer monthly by 1 week
- Reduce daily to every other day
- Pause weekly deep review temporarily
- Surface to Founder via dashboard quota banner

Cost is justified because architecture agent prevents 10× more quota
waste downstream (catches recurring patterns before they multiply).

### 9. Engineering-mindset addendum

"Strategic review separate from execution. Deep-thinking + extensive-
research agent prevents architectural debt + replicates paid features
as free substrate."

This codifies the gap-closure mode the project has been operating in
informally for several ships (PROP-007 user-context verification,
PROP-010 design-bot, PROP-012 mandatory visual review, AMD-017
continuation discipline). Formalizing the role lets the rest of the
substrate stay clean — agents 1-5 execute; agent 6 thinks + researches.

## Files added in this amendment

- `.claude/state/architecture-review/README.md`
- `.claude/state/architecture-review/{daily,weekly,monthly,recommendations,research,self-evaluation}/README.md`
- `.claude/state/architecture-review/research/replications/{zai-vision-mcp,applitools-visual-testing,composio-design-review-loop,linear-jira,datadog-newrelic}.md` — 5 seeded case studies
- `.claude/state/aggregates/architecture-review.json` (emitted by agent
  on first cycle; not yet present)
- `migration-handoff-2026-05-14.md` §6.6 (added in companion commit)
- `task-queue/dashboard/architecture-banner.md` — task for dashboard
  agent to surface architecture-review aggregate

## Operating change

Active starting now (no agent-view dispatch yet — Founder runs
`claude agents` and dispatches the 6th boot prompt).

Substrate directory + READMEs + case studies + amendment present.
Awaiting Founder ratification + dispatch.

## Rollback

If the agent introduces more substrate weight than thinking value:

1. Stop dispatching it via agent-view (don't paste the boot prompt
   on next launch).
2. Existing `.claude/state/architecture-review/` output remains as
   audit trail; can be deleted if pressure is on.
3. The 5 replication case studies stay regardless — they're project
   knowledge artifacts, not agent state.

## Discipline references

- AMD-009 — Senior engineering standard (especially P5 honest delta)
- AMD-015 — Team proposes / Agent-2 ratifies (architecture agent's
  recommendations follow the same propose-first culture)
- AMD-016 — Infrastructure-operational question test
- AMD-017 — Continuation discipline (Q0-Q4 between units of work)
- AMD-018 — Push authorization (architecture agent does NOT push)
- AMD-022 — Inter-agent task queue (recommendations flow through)
- `~/.claude/skills/dream/` — weekly memory consolidation skill
