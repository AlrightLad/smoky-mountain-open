# Architecture-review state directory

Output home for the Architecture / AI Engineer Agent (the 6th always-on
agent in the agent-view multi-session model). Per AMD-024.

Operating mode: extremely deep thinker + extensive researcher.
Free-replication-first principle paramount — no paid services when free
or open-source equivalents exist.

This directory holds the agent's continuous strategic-review output.
Other agents do execution work; this agent does the system thinking.

## Layout

```
architecture-review/
├── README.md                          ← this file
├── daily/<YYYY-MM-DD>.md              ← 30-60 min quick health check
├── weekly/<YYYY-WW>.md                ← 3-5 hour deep review (Sunday)
├── monthly/<YYYY-MM>.md               ← 8-12 hour strategic (last Sun)
├── recommendations/
│   ├── pending/<id>.md                ← awaiting Founder ratification
│   ├── ratified/<id>.md               ← approved + handed to owning agent
│   └── rejected/<id>.md               ← rejected with rationale
├── research/
│   ├── tools/<tool>.md                ← evaluation of a tool/service
│   ├── patterns/<pattern>.md          ← workflow pattern research
│   └── replications/<paid-svc>.md     ← free-replication case studies
└── self-evaluation/<date>.md          ← outcome vs prediction tracking
```

## Cadences

| Cadence | Cost (token-runtime) | Content |
|---|---|---|
| Daily | 30-60 min | Health rollup, stop-decision check, error-backlog severity, daily-priority surface, banner data file refresh |
| Weekly | 3-5 hours | Full Step 1-6 thinking methodology, memory consolidation via dream-skill, ecosystem research, recommendation packet |
| Monthly | 8-12 hours | Multi-week pattern synthesis, long-horizon planning, architecture evolution roadmap, substrate maturity assessment |
| On-demand | varies | Founder invokes for specific decision; surfaces inline via task queue |

## Deep-thinking methodology (AMD-024)

Every recommendation follows the 7-step path:

1. **STATE THE PROBLEM** — evidence-based, not "feels-like"
2. **ENUMERATE HYPOTHESES** — at least 3 with supporting/contradicting
   evidence and likelihood ranking
3. **RESEARCH CURRENT BEST PRACTICE** — primary sources, multiple
   community implementations
4. **EVALUATE FREE ALTERNATIVES FIRST** — list free alternatives,
   capability gap, DIY cost, maintenance burden
5. **PROPOSE WITH RATIONALE** — specific recommendation, why over
   alternatives, expected outcome, validation method, cost, rollback
6. **ANTICIPATE SECOND-ORDER EFFECTS** — what does this make harder?
   what agents/systems are affected? mitigation
7. **CITE SOURCES** — every external claim links to primary source;
   internal claims reference state file or commit hash

## Free-replication first

Paid services are LAST RESORT. For every recommendation:

- List free alternatives (open-source, built-in, community)
- Capability gap between free and paid
- DIY replication cost
- Maintenance burden of free vs paid
- Only consider paid if free path adds >10x more work than capability
  justifies

Case studies of paid → free already executed in this project live in
`research/replications/`. Read those before recommending any paid
service.

## Aggregated dashboard surface

`.claude/state/aggregates/architecture-review.json` emits:

- `latest_daily_health` — green/yellow/red color + timestamp
- `latest_weekly_summary` — one-paragraph summary + link
- `latest_monthly_strategic` — strategic anchor + link
- `pending_recommendations_count` — backlog depth
- `ratification_rate` — recommendations ratified / proposed
- `top_3_priorities` — current friction patterns by severity

Dashboard banner reads this file (dashboard agent owns the surface
work — task queued at `task-queue/dashboard/architecture-banner.md`).

## Coordination with other agents

Findings flow into other agents' task queues. Architecture agent does
not execute; it proposes via `task-queue/<owning-agent>/<id>.md` with
priority + acceptance criteria. Owning agent picks up via normal
polling.

Pattern:

```
Test/QA agent → flags pattern of N regressions in surface X
                ↓
Architecture agent ← reads test-qa cycles + correlates
                     ↓ (research, hypothesize, propose)
recommendation in pending/<id>.md
                     ↓ (Founder ratifies)
task in task-queue/<surface-owner>/<id>.md (CRITICAL/HIGH/MED/LOW)
                     ↓
surface owner ← polls + executes + reports back
```

## Push posture

Per AMD-024, this agent does NOT push commits upstream. All output is
PROPOSALS (recommendations) that the Founder ratifies before any other
agent acts. Recommendations live local; only their execution by the
owning agent generates pushable commits.

## References

- AMD-024 — Architecture / AI Engineer Agent + free-replication-first
- AMD-022 — Inter-agent task queue (how recommendations flow)
- AMD-015 — Team proposes / Agent-2 ratifies (alignment with
  proposal-first culture)
- AMD-009 — Senior engineering standard (P1-P7 governance)
- AMD-017 — Continuation discipline (Q0-Q4 between units of work)
- `migration-handoff-2026-05-14.md` §6 — boot prompt for this agent
- `~/.claude/skills/dream/` — memory consolidation skill (weekly use)
