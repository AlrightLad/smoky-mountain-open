---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-05-24T14:30:00Z
authored_by: agent
founder_action_required: true
cost: $0
execute_by: founder
execute_by_reason: regenerate a token in the Sentry web portal (no agent session) + write it to .env (gate-protected); both are secret material
verify_command: "node scripts/sentry-fetch-events.mjs"
verify_expected: "full payload written to"
---

# Sentry auth token — missing `event:read` / `project:read` scopes

## What

`scripts/sentry-fetch-events.mjs` (new this cycle) fetches unresolved
Sentry events for the per-cycle repair loop per
`feedback-sentry-error-repair-loop` memory.

Test run:
```
[sentry-fetch] resolved org="parbaughs" project="javascript"
[sentry-fetch] GET https://sentry.io/api/0/projects/parbaughs/javascript/issues/?query=is:unresolved&statsPeriod=24h
[sentry-fetch] HTTP 403 Forbidden
{"detail":"You do not have permission to perform this action."}
```

The token can list organizations + projects, but can't read issues.
Missing scope: **`event:read`** (read individual events) and possibly
**`project:read`** (broader project read).

## Why

The token in `.env` (`SENTRY_AUTH_TOKEN=...`) was generated with
limited scopes during the original Sentry wiring (probe DSN
verification only). For the new per-cycle repair loop, the token
needs to LIST + READ issues, which requires `event:read` minimum.

## What you need to do

**Who can do this:** any maintainer with admin access to the Parbaughs
Sentry organization. No production code or deploy is involved — this is
purely a Sentry-dashboard token-scope change.

1. Open https://sentry.io/settings/account/api/auth-tokens/
2. Either:
   - **Edit the existing token** (if scopes are editable) to add
     `event:read` + `project:read`
   - **OR generate a new token** with these scopes + replace the
     existing `SENTRY_AUTH_TOKEN` value in `.env` (do NOT commit
     — pre-commit hook blocks it; `.env` is gitignored).
3. Run `node scripts/sentry-fetch-events.mjs` to verify the fetch
   returns events (0 events = clean; >0 = triage list). A successful
   run ends with `full payload written to ...`; a `403 Forbidden`
   means the scopes still aren't applied.

## Risk

The token is a credential. Treat like a password. The new scopes
DON'T grant write access — only read. Read-only Sentry tokens are
low-risk; an attacker with the token can see error events but
can't change them or post fake events.

## Closure criteria

- An authorized maintainer grants the scopes (or replaces the token)
- `node scripts/sentry-fetch-events.mjs` returns events (or "Clean.")
  with no 403 — the run ends with `full payload written to ...`
- Per-cycle Sentry triage starts running per the repair-loop memory
