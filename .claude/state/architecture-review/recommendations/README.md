# Recommendations

Architecture agent's proposals to evolve the substrate. Each
recommendation follows the AMD-024 deep-thinking methodology (7 steps).

## Lifecycle

```
pending/<id>.md       ← authored by architecture agent, awaiting Founder review
   │
   ▼
ratified/<id>.md      ← Founder approves → architecture agent writes
                         task to task-queue/<owning-agent>/<id>.md
   │
   ▼
rejected/<id>.md      ← Founder declines (with rationale captured)
```

## Recommendation file template

```markdown
---
id: REC-NNN
title: <short imperative title>
authored_by: architecture-agent
authored_at: <ISO-8601>
status: pending|ratified|rejected
priority: CRITICAL|HIGH|MEDIUM|LOW
type: substrate-amendment | tool-install | workflow-change | replication
owning_agent_on_ratify: main|dashboard|main-flows|test-qa|security|architecture
related_files: [...]
free_replication: true|false   # true if this replaces a paid service
estimated_token_cost: <number>
---

## Step 1 — State the problem
## Step 2 — Hypotheses (≥3)
## Step 3 — Research current best practice
## Step 4 — Free alternatives evaluated
## Step 5 — Proposed action with rationale
## Step 6 — Second-order effects
## Step 7 — Sources cited
```

## Ratification flow

Founder reviews `pending/<id>.md`. On approve:

1. Move file to `ratified/<id>.md`.
2. Update `status:` frontmatter.
3. Architecture agent writes a task to
   `.claude/state/task-queue/<owning_agent_on_ratify>/<id>.md` per
   AMD-022.
4. Owning agent picks up via normal polling.
5. Architecture agent monitors implementation in next cycle's
   self-evaluation.

## Rejection flow

Founder reviews `pending/<id>.md`. On reject:

1. Move file to `rejected/<id>.md`.
2. Update `status:` frontmatter + append `## Rejection rationale`.
3. Architecture agent learns from rejection (refines methodology).
