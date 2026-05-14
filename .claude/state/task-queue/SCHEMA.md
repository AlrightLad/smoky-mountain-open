# Task-file schema

Every task file in `.claude/state/task-queue/<agent>/` is a markdown
document with YAML frontmatter. Filename is short and slug-like:
`<task-id>.md` or `<priority>-<task-id>.md` for sortability.

## Frontmatter contract

```yaml
---
task_id: <short-id-or-timestamp>     # required. unique within agent queue. e.g. "fix-banner-2026-05-14"
from_agent: <agent-name>             # required. who created the task. founder|main|dashboard|main-flows|test-qa|security
to_agent: <agent-name>               # required. who is the owner. must match the parent directory.
created_at: <ISO-8601>               # required. UTC ISO timestamp. e.g. "2026-05-14T22:00:00Z"
priority: <CRITICAL|HIGH|MEDIUM|LOW> # required. see README.md for semantics.
type: <fix|investigate|verify|surface|build|review>  # required. nature of the work.
status: <queued|in_progress|completed|rejected>      # required. starts at "queued".
related_files: [<list>]              # optional. file paths the task touches or references.
related_findings: [<list>]           # optional. references to audit findings, FIQs, escalations.
blocking: <true|false>               # optional. if true, owner agent should stop until this clears.
deadline: <ISO-8601>                 # optional. absolute deadline. uncommon — usually priority is enough.
---
```

## Body sections

Use `## H2` headings for these. The required ones are enforced by
`scripts/task-queue/poll.sh validate`.

| Section | Required | Purpose |
|---------|----------|---------|
| `## Task` | yes | What the owner agent should do. 1-3 sentences. Specific and actionable. |
| `## Acceptance criteria` | yes | How the owner knows the task is done. Bullet list. Each bullet observable. |
| `## Coordination notes` | optional | Anything the owner needs to know that isn't task or acceptance — links, prior context, related queued tasks. |
| `## Findings` | optional | Used by owner on completion. Writes back what was learned, what failed, what surprised. |

## Lifecycle write-back

When the owner agent finishes the task:

1. Update frontmatter `status:` to `completed` or `rejected`.
2. Append `## Findings` section to the body (per AMD-022).
3. Move the file to `.claude/state/task-queue/completed/`.
   Filename: `<original-name>` (no rename — keeps `from_agent` and
   `to_agent` intact for audit).

If `rejected`, the body's `## Findings` must include a rejection reason
(out-of-scope, blocked, missing-prereq, etc.) AND the owner must write a
notification task back to `from_agent`'s queue.

## Examples

### Minimal task

```markdown
---
task_id: fix-banner-color-mismatch
from_agent: main
to_agent: dashboard
created_at: 2026-05-14T22:00:00Z
priority: MEDIUM
type: fix
status: queued
related_files:
  - docs/reports/dashboard.html
  - docs/reports/_assets/dashboard.css
---

## Task

The Recent Handoffs banner is using `--cb-brass` for accent but the
sibling banners use `--cb-moss`. Reconcile so all top-row banners share
one accent token.

## Acceptance criteria

- All top-row banner accents read from the same CSS token
- Visual review screenshot (1920x1080) attached to commit
- Round-trip test passes

## Coordination notes

The accent inconsistency was found during iter 16 visual review. See
.claude/state/main-flows-v2/iter-15-visual-review-notes.md for the
specific finding.
```

### Critical task (auto-surfaces to dashboard)

```markdown
---
task_id: CRITICAL-credential-leak-functions
from_agent: security
to_agent: main
created_at: 2026-05-14T22:05:00Z
priority: CRITICAL
type: fix
status: queued
related_files:
  - functions/index.js
blocking: true
---

## Task

`functions/index.js` line 42 contains a hardcoded API key (`sk_live_...`
prefix). Remove and rotate. The key appears to be a stripe test key but
must be rotated regardless. Replace with `functions.config()` lookup.

## Acceptance criteria

- Hardcoded key removed from functions/index.js
- Replacement reads from functions.config() or process.env
- Key rotated in source-of-truth credential store
- Cloud Function re-deployed (requires Founder authorization per AMD-018)

## Coordination notes

Cloud Function deploy is AMD-018 exception-list — this task needs Founder
authorization for the deploy step. Main agent should stage the code fix
and stop at the deploy gate.
```

### Rejection write-back

```markdown
---
task_id: fix-banner-color-mismatch
from_agent: main
to_agent: dashboard
created_at: 2026-05-14T22:00:00Z
priority: MEDIUM
type: fix
status: rejected
related_files:
  - docs/reports/dashboard.html
  - docs/reports/_assets/dashboard.css
---

## Task

[original task body]

## Acceptance criteria

[original criteria]

## Findings

Rejected — out of scope for dashboard agent.

The accent token used (`--cb-brass`) is intentional per design-bot iter
15 ruling: top-row banners use brass for action-affordance, moss for
system-state. The "inconsistency" the assigner observed is design intent.

Notified `main` agent via task-queue/main/dashboard-rejection-banner-color.md
with this finding and the design-bot ruling reference.
```

## Hard rules

- Filename, `task_id`, and frontmatter `to_agent` must match the
  containing directory.
- `from_agent` must NOT be the same as `to_agent` (no self-assignment).
- An agent must not pick up a task without first updating `status:` to
  `in_progress` (so other agents don't double-claim).
- Completed/rejected tasks live in `completed/` forever — no garbage
  collection except via Founder-authorized cleanup.
