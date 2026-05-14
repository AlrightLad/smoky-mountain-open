# Test/QA agent queue (Terminal 4)

Tasks targeting the **test/qa** Claude Code session (Terminal 4). This
agent owns continuous verification across the repo: round-trip,
end-to-end Playwright suite, visual smoke, regression hunting.

## Scope

- `tests/` directory — Playwright e2e flows, fixtures, helpers
- `tests/round-trip-test.py` — the canonical PASS/FAIL gate
- `scripts/visual-audit/*` — capture + assertion scripts
- Regression triage across any surface (read-only investigation; fixes
  get queued to the surface owner)
- Approval pipeline verification (per AMD-023)

## NOT in scope (queue to other agents)

- Authoring the fix once regression diagnosed → queue to surface owner
  (main / dashboard / main-flows)
- New e2e fixtures + setup → may be in-scope if test/qa owned end-to-end;
  otherwise queue surface owner first

## Polling protocol

At the start of every interactive cycle:

```bash
ls .claude/state/task-queue/test-qa/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Read all `.md` files (excluding this README). Process in priority order.

## Continuous monitoring

Beyond explicit queued tasks, the test/qa agent runs continuous health
checks on its own cadence:

- Round-trip test on every commit (post-commit hook)
- Approval pipeline end-to-end via `scripts/verify-approval-pipeline.sh`
- Visual smoke against engagement surfaces

Findings that don't have a clear surface-owner get queued to `main/` as
a `type: investigate` task.

See `../README.md` and `../SCHEMA.md`.
