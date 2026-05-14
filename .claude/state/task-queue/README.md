# Inter-agent task queue

Cross-session coordination layer. Each Claude Code session ("agent") has
a queue directory under this root. Agents poll their own directory at the
start of every work cycle and pick up tasks left by other agents.

Founder direction 2026-05-14 ratified this protocol via AMD-022. Git is
the coordination layer — task files commit + push like any other change,
which means agents converge on the same task list across machines without
a separate message bus.

## Layout

```
.claude/state/task-queue/
├── README.md                  ← this file (architecture overview)
├── SCHEMA.md                  ← task-file frontmatter contract
├── main/                      ← Terminal 1 — main agent owner queue
├── dashboard/                 ← Terminal 2 — dashboard-health agent owner queue
├── main-flows/                ← Terminal 3 — main-flows polish agent owner queue
├── test-qa/                   ← Terminal 4 — test/QA agent owner queue
├── security/                  ← Terminal 5 — security/compliance agent owner queue
├── founder/                   ← Founder ad-hoc directives (any agent picks up)
└── completed/                 ← Archive (done + rejected tasks; do not pick up)
```

Each per-agent directory contains zero or more `.md` task files. Agents
**read only their own queue plus `founder/`** for inbound work. They
**write into other agents' queues** to assign tasks.

## Polling protocol

At the start of every interactive cycle (or every iteration of an
unattended/overnight loop) an agent must:

1. `ls .claude/state/task-queue/<own-agent>/` and `ls .claude/state/task-queue/founder/`
2. For each `.md` file:
   - Read frontmatter + body
   - Compare `priority` against current work
   - CRITICAL: stop current work, address immediately (per AMD-022)
   - HIGH: complete current ship, then address
   - MEDIUM: address in next eligible work cycle
   - LOW: batch with other LOW items, address periodically
3. On task completion:
   - Update `status:` to `completed` in the task file
   - Move file to `.claude/state/task-queue/completed/<original-name>`
   - Optionally write a "findings" task back into the assigning agent's queue
4. On task rejection (out of scope, blocked, prerequisite missing):
   - Update `status:` to `rejected` with rejection reason in body
   - Move file to `completed/`
   - Write a notification task into the assigning agent's queue

Agents should NOT reach into another agent's queue to mutate state. The
only valid cross-agent writes are:
- Assignment (writing a NEW task into another agent's queue)
- Notification (writing a NEW task back to the assigner after rejection)

## Priority handling

| Priority | Semantics |
|----------|-----------|
| `CRITICAL` | Stop current work. Address immediately. Auto-surfaces to dashboard banner so Founder sees all sessions converge on it. |
| `HIGH` | Complete the current ship-sized unit of work, then address before anything else. |
| `MEDIUM` | Pick up in the next eligible work cycle (after current ship). |
| `LOW` | Batch with other LOW items. Address opportunistically during slow periods. |

CRITICAL tasks bypass even AMD-017's continuation discipline — they ARE
the "Q1.A scope expansion authorized by user" stop condition,
pre-authorized.

## Task lifecycle

```
queued        ← assigner creates file in target agent's queue
   │
   ▼
in_progress   ← target agent claims task (updates status before starting)
   │
   ▼
completed     ← target agent finishes, moves file to completed/
   │  OR
   ▼
rejected      ← target agent refuses (scope/blocked/prereq); moves to completed/
                 + writes notification task back to assigner
```

A task in `in_progress` status that hasn't moved to `completed/` within
a reasonable window (~24h) is candidate for retry by another agent or
escalation to Founder via the `founder/` queue. AMD-022 doesn't specify
an exact stale-task timeout — agents use judgment.

## Engineering-mindset addendum

A task left in another agent's queue is not done until that agent has
verified the work AND the verification is reflected in the task file's
status. Assigners must not assume forward progress; they should re-read
the queued task file before relying on it.

If you find yourself wanting to "just do it yourself" instead of queuing
to the right owner, the impulse is usually wrong — the other agent has
context, conventions, or guard rails you don't. Queue first, intervene
only if the task ages past reason.

## Coordination with overnight-agent

The overnight bounded-scope agent (see `scripts/overnight-agent/README.md`)
does NOT poll this task queue. Its work is driven by the
`.claude/state/overnight-agent/prompts/queue/` directory which has a
different schema (prompt-text with required `##` sections) and lifecycle.

If you need overnight work assigned to a specific terminal, write the
prompt for the overnight queue (which any agent's run will pick up) AND
write a `task-queue/<agent>/` task that points at the prompt file, so
the agent reviewing morning output knows which prompt produced which
commits.

## References

- AMD-022 — Inter-agent task queue protocol
- AMD-017 — Stop conditions (CRITICAL pre-authorizes Q1.A scope expansion)
- AMD-018 — Push authorization (task completion still gated by 11-gate)
- AMD-019 — Dashboard freshness (CRITICAL tasks surface to banner)
- `SCHEMA.md` (this directory) — task-file frontmatter contract
- `scripts/task-queue/poll.sh` — CLI for queue inspection
