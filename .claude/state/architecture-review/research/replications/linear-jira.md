---
paid_service: Linear, Jira (cross-team task tracking)
paid_cost: per-seat-per-month
free_replacement: .claude/state/task-queue/ + scripts/task-queue/poll.sh
status: replicated
replicated_at: 2026-05-14 (AMD-022 ratifies the protocol)
---

## The paid service offered

Linear / Jira / similar provide:
- Task / ticket queues per team or per person
- Priority + status + assignment lifecycle
- Cross-team handoff
- Audit trail
- Integrations (Slack, GitHub, email)
- Dashboards + reporting

## The free path

PARBAUGHS replaces all of the above with file-based task queues under
`.claude/state/task-queue/<agent>/`. Git is the coordination layer;
the filesystem is the storage; markdown is the schema.

Architecture (per AMD-022):

```
.claude/state/task-queue/
├── README.md           ← architecture overview
├── SCHEMA.md           ← frontmatter contract
├── main/               ← Terminal 1 queue
├── dashboard/          ← Terminal 2 queue
├── main-flows/         ← Terminal 3 queue
├── test-qa/            ← Terminal 4 queue
├── security/           ← Terminal 5 queue
├── founder/            ← Founder ad-hoc, any agent picks up
└── completed/          ← Archive
```

Each task: markdown file with YAML frontmatter (task_id, priority,
status, from_agent, to_agent, type). Priority semantics:
CRITICAL/HIGH/MEDIUM/LOW.

CLI: `bash scripts/task-queue/poll.sh list|show|validate|claim|complete|reject`

## Capability gap

| Capability | Paid | PARBAUGHS file-queue |
|---|---|---|
| Queue per team | yes | yes (per-agent dir) |
| Priority lifecycle | yes | yes (frontmatter) |
| Cross-team handoff | yes | yes (write into other agent's dir) |
| Audit trail | yes | yes (completed/ archive + git history) |
| Dashboards | yes | partial (dashboard banner pending dashboard agent) |
| Real-time notification | yes (push/email) | no (polling at cycle start) |
| Multi-tenant | yes | no (single repo) |
| Mobile app | yes | no |

The gaps that matter:
- Real-time notification: agents poll at cycle start, so a CRITICAL
  task added between cycles waits for next cycle. Mitigated by
  AMD-019 dashboard freshness — CRITICAL items auto-surface to
  banner so Founder sees them within seconds. Other agents see them
  on next cycle (sub-minute in interactive sessions).
- Mobile app: irrelevant for an in-repo coordination tool.

## Implementation cost

One-time (already done):
- Directory structure
- Per-agent README.md files
- SCHEMA.md frontmatter contract
- `scripts/task-queue/poll.sh` CLI
- AMD-022 amendment

Ongoing: zero cost beyond normal repo maintenance. The queue lives
in git; commits flow normally.

## Maintenance burden

Lower than paid. No accounts, no per-seat license growth, no SSO
configuration, no vendor lock-in. Schema evolution lives in
SCHEMA.md and applies via re-validation only when changed.

## Outcome (to date)

First end-to-end test passed iter 16: validate sub-command
accepted the first real cross-agent task
(`task-queue/dashboard/approvals-pipeline-banner.md` written by main
agent for dashboard agent). The pattern is live.

## Sources + community references

- AMD-022 — full protocol
- `.claude/state/task-queue/README.md` — architecture
- `.claude/state/task-queue/SCHEMA.md` — frontmatter contract
- This document's parent directory:
  `.claude/state/architecture-review/research/`
- Community pattern: agentic task queues via shared filesystem is
  a recognized pattern (see e.g. the Codespaces "shared state via
  git" pattern; Claude Code skill ecosystem agents follow similar)
