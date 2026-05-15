
# Inter-agent task queue protocol

Founder direction 2026-05-14: enable terminals to assign work to each
other via a shared file-based task queue. Git is the coordination
layer — task files commit and push like any other change, so multiple
machines stay synchronized without a separate message bus.

## Problem

Multiple parallel Claude Code sessions (Terminals 1-5: main, dashboard,
main-flows, test-qa, security) operate concurrently. Cross-session
coordination today is Founder-mediated: every assignment requires
Founder to paste context into the right terminal. This creates:

- Bottlenecks (every transfer waits on Founder availability)
- Lost context (paraphrased re-injection is lossy)
- No audit trail (assignments live in Founder's head)
- Drift (agents diverge on what's queued vs. in-flight)

## What changes

### Directory structure

```
.claude/state/task-queue/
├── README.md                  ← architecture overview
├── SCHEMA.md                  ← task-file frontmatter contract
├── main/                      ← Terminal 1
├── dashboard/                 ← Terminal 2
├── main-flows/                ← Terminal 3
├── test-qa/                   ← Terminal 4
├── security/                  ← Terminal 5
├── founder/                   ← Founder ad-hoc, any agent picks up
└── completed/                 ← Archive (done + rejected)
```

Each per-agent directory contains zero or more `.md` task files.

### Task-file schema

YAML frontmatter (required fields) + markdown body with `## Task`,
`## Acceptance criteria`, optional `## Coordination notes`,
optional `## Findings` (written by owner on completion).

Full contract: `.claude/state/task-queue/SCHEMA.md`.

### Polling protocol

Every Claude Code session at cycle start:

```bash
ls .claude/state/task-queue/<own-agent>/*.md
ls .claude/state/task-queue/founder/*.md
```

Process in priority order: CRITICAL → HIGH → MEDIUM → LOW. Claim by
updating `status: in_progress` before starting work. On completion,
update frontmatter status + append `## Findings` + move file to
`completed/`.

### Priority semantics

| Priority | Behavior |
|----------|----------|
| `CRITICAL` | Stop current work. Address immediately. Auto-surfaces to dashboard banner (Founder sees all sessions converge). |
| `HIGH` | Complete current ship-sized work, then address. |
| `MEDIUM` | Pick up in next eligible cycle. |
| `LOW` | Batch with other LOW items. |

CRITICAL pre-authorizes AMD-017 Q1.A scope expansion — it IS the
"authorized by user" stop condition.

### Cross-agent writes

The only valid cross-agent writes are:

1. **Assignment** — writing a NEW task into another agent's queue.
2. **Notification** — writing a NEW task back to the assigner after
   completion or rejection.

Agents must NOT reach into another agent's queue to mutate state.

## Files added in this amendment

- `.claude/state/task-queue/README.md` (architecture)
- `.claude/state/task-queue/SCHEMA.md` (frontmatter contract)
- `.claude/state/task-queue/main/README.md` (scope per agent)
- `.claude/state/task-queue/dashboard/README.md`
- `.claude/state/task-queue/main-flows/README.md`
- `.claude/state/task-queue/test-qa/README.md`
- `.claude/state/task-queue/security/README.md`
- `.claude/state/task-queue/founder/README.md`
- `.claude/state/task-queue/completed/README.md`
- `scripts/task-queue/poll.sh` — CLI for inspection + lifecycle

## CLI

`scripts/task-queue/poll.sh` provides:

- `list [agent]` — show queued tasks, optionally filtered by agent
- `show <path>` — render a task file
- `validate <path>` — verify shape (frontmatter + required sections)
- `claim <path>` — set status: in_progress
- `complete <path>` — mark completed + move to completed/
- `reject <path> <reason>` — mark rejected + move + record reason

## Engineering-mindset addendum

A task left in another agent's queue is not done until that agent has
verified the work AND the verification is reflected in the task file's
status. Assigners must not assume forward progress; they should re-read
the queued task file before relying on it.

If you find yourself wanting to "just do it yourself" instead of
queuing to the right owner, the impulse is usually wrong — the other
agent has context, conventions, or guard rails you don't. Queue first,
intervene only if the task ages past reason.

## Coordination with adjacent infrastructure

- **AMD-019 (dashboard freshness per commit)** — task-queue updates
  commit, post-commit hook fires, dashboard banner reflects CRITICAL
  items within seconds.
- **AMD-018 (push authorization)** — task-queue work still gated by
  the 11-gate criteria. Queue task completion does NOT auto-push.
- **AMD-017 (continuation discipline)** — CRITICAL queued tasks
  pre-authorize Q1.A scope expansion. Other priorities respect the
  Q0-Q4 discipline.
- **Overnight-agent** — does NOT poll this queue. Its work is driven
  by `.claude/state/overnight-agent/prompts/queue/` (different schema +
  lifecycle). To bridge, write a prompt-file for overnight AND a
  task-file for the morning-review agent.

## Operating change (immediate)

Starting now (Founder pastes polling directive into each terminal):

1. Every interactive session polls its own queue + `founder/` at
   start of every response cycle.
2. CRITICAL items interrupt current work.
3. Agents write findings back via task files, not Founder-mediated
   messages.

## Rollback

If the protocol introduces more friction than coordination:

1. Remove `.claude/state/task-queue/` directory.
2. Remove `scripts/task-queue/`.
3. Remove polling step from agent directives.
4. Cross-session work reverts to Founder-mediated assignment.

The audit trail in `completed/` survives rollback (read-only history).

## Discipline references

- AMD-022 (this file) — protocol
- AMD-017 — stop conditions
- AMD-018 — 11-gate push authorization
- AMD-019 — dashboard freshness
- AMD-020 — auto-clean dirty tree
- PROP-007 — user-context verification
- continuation-discipline skill — Q0-Q4
