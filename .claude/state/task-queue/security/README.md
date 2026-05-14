# Security agent queue (Terminal 5)

Tasks targeting the **security/compliance** Claude Code session
(Terminal 5). This agent owns credential leak detection, Firestore rule
audit, dependency CVE scanning, and AMD-018 exception-list enforcement.

## Scope

- Credential leak detection (`functions/`, `src/`, `scripts/`,
  `tests/`, `.claude/state/`, top-level)
- Firestore rule audit — read-only review of `firestore.rules`
  alignment with code paths; rule edits queue to `main/` with Founder
  pre-auth flagged
- Dependency CVE scanning (npm audit, pip-audit, etc.)
- Cloud Function security review (rate limits, CORS, secret handling)
- AMD-018 exception-list enforcement (Cloud Function deploys, rule
  edits, payment/ParCoin changes need Founder pre-auth — security
  agent flags violations)
- `.claude/state/security/` — findings log

## NOT in scope (queue to other agents)

- Authoring fixes for security findings → queue to surface owner
- Cloud Function deploys → AMD-018 exception list, requires Founder
  authorization
- Firestore rule edits → AMD-018 exception list, requires Founder
  authorization

## Polling protocol

At the start of every interactive cycle:

```bash
ls .claude/state/task-queue/security/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Read all `.md` files (excluding this README). Process in priority order.

CRITICAL findings (credential exposure, write-allow on sensitive
collections, etc.) are written into `task-queue/main/` AND the dashboard
banner — never just logged silently.

See `../README.md` and `../SCHEMA.md`.
