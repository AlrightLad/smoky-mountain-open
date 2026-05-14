# Main agent queue (Terminal 1)

Tasks targeting the **main** Claude Code session (Terminal 1). This
agent owns the broadest scope across the PARBAUGHS repo and typically
handles P3/P4 audit work, member-facing app fixes (`src/pages/`,
`src/core/`), and infrastructure that crosses other agents' boundaries.

## Scope

- `src/pages/`, `src/core/`, `src/styles/` — member-facing app code
- `tests/round-trip-test.py` and other repo-level verification
- `scripts/cron/` — Windows Scheduled Task infrastructure
- `scripts/overnight-agent/` — overnight bounded-scope agent wrapper
- `.claude/state/app-audit-*` — P3 audit working files
- `.claude/state/amendments/`, `.claude/state/proposals/` — discipline doc authoring
- `CLAUDE.md`, top-level `docs/`

## NOT in scope (queue to other agents)

- `docs/reports/*.html` + `docs/reports/_assets/*` → `dashboard/`
- `docs/reports/main-flows.html` + flow-data + reference frames → `main-flows/`
- E2E test failures + regressions → `test-qa/`
- Credential leaks + rule audit → `security/`

## Polling protocol

At the start of every interactive cycle:

```bash
ls .claude/state/task-queue/main/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Read all `.md` files (excluding this README). Process in priority order:
CRITICAL → HIGH → MEDIUM → LOW. Update `status: in_progress` before
starting work to claim the task.

See `../README.md` (this directory's parent) for full protocol and
`../SCHEMA.md` for task-file frontmatter contract.
