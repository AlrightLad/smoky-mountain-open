# Dashboard agent queue (Terminal 2)

Tasks targeting the **dashboard-health** Claude Code session (Terminal
2). This agent owns the docs/reports/ dashboard surface and the regen
scripts that produce it.

## Scope

- `docs/reports/*.html` (dashboard, amendments, proposals, escalations,
  activity, design-system, discussion-bubbles, index, main-flows,
  token-usage)
- `docs/reports/_assets/*` — CSS, JS, JSON data files for the dashboards
- `scripts/regen-*.py` / `scripts/regen-*.sh` — generators
- `scripts/regen-all.sh` — orchestrator
- `.husky/post-commit` — dashboard freshness hook (AMD-019)
- `.claude/state/dashboard-health/` — agent log

## NOT in scope (queue to other agents)

- Member-facing app code (`src/`) → `main/`
- Main-flows specific (`main-flows.html`, flow data, reference frames,
  visual-audit scripts that target main-flows) → `main-flows/`
- Cron infrastructure (Scheduled Tasks, install scripts) → `main/`
- E2E regressions → `test-qa/`

## Polling protocol

At the start of every interactive cycle:

```bash
ls .claude/state/task-queue/dashboard/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Read all `.md` files (excluding this README). Process in priority order:
CRITICAL → HIGH → MEDIUM → LOW.

## Coordination with main agent

The dashboard agent often gets tasks asking for new aggregator data or
new dashboard surfaces. If the data source doesn't exist yet, queue a
task back to `main/` asking for the aggregator, then mark the original
task `blocked` (set `blocking: true` in frontmatter) until the
prerequisite ships.

See `../README.md` and `../SCHEMA.md` for the full protocol.
