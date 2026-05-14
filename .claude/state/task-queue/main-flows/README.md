# Main-flows polish agent queue (Terminal 3)

Tasks targeting the **main-flows-polish** Claude Code session (Terminal
3). This agent owns the main-flows architecture diagram fidelity work.

## Scope

- `docs/reports/main-flows.html` — the diagram surface itself
- `docs/reports/_assets/main-flows-data.json` — canonical source JSON
- `scripts/generate-flow-paths.py` / `scripts/generate-flow-paths.sh`
- `.claude/state/main-flows-v2/` — iteration captures, reference frames,
  flow inventory, visual review notes
- `scripts/visual-audit/capture-*` (only when targeting main-flows)

## NOT in scope (queue to other agents)

- Other dashboards (amendments, proposals, escalations, etc.) → `dashboard/`
- Member-facing app code → `main/`
- E2E test regressions → `test-qa/`

## Polling protocol

At the start of every interactive cycle:

```bash
ls .claude/state/task-queue/main-flows/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Read all `.md` files (excluding this README). Process in priority order.

See `../README.md` and `../SCHEMA.md`.
