---
status: open
severity: red
priority: HIGH
verify_command: "if (Test-Path .env) { Select-String -Path .env -Pattern '^SENTRY_DSN=https://[a-f0-9]+@o\\d+\\.ingest\\.(us|de)\\.sentry\\.io/\\d+$' } else { 'NOT_FOUND' }"
verify_expected: "SENTRY_DSN=https://"
walkthrough_doc: docs/walkthroughs/sentry-dsn-fix.md
---

# Founder action — Replace Sentry Loader URL with SDK DSN

**Surfaced:** 2026-05-22 by Phase 1b verification.
**Why:** Phase 1b discovered the value pasted into `.env` and `.env.staging`
for `SENTRY_DSN=` is the **Sentry Loader Script URL** (starts with
`https://js.sentry-cdn.com/`), not the **SDK DSN** that `@sentry/browser`
needs. Same key, two different endpoints — Sentry's onboarding flow shows
both options.

`Sentry.init({ dsn: <loader-url> })` fails at runtime. The NPM SDK requires
the standard DSN format:
```
https://<32-hex-key>@o<orgId>.ingest.us.sentry.io/<projectId>
```

## How to fix (~2 minutes)

1. Open Sentry: <https://sentry.io/settings/parbaughs/projects/parbaughs-web/keys/>
2. Find the row "DSN" (NOT "Loader Script") — copy the value.
3. Open PowerShell at repo root, replace the existing line:

```powershell
(Get-Content .env)         -replace '^SENTRY_DSN=.*', 'SENTRY_DSN=<paste-the-DSN-here>' | Set-Content .env
(Get-Content .env.staging) -replace '^SENTRY_DSN=.*', 'SENTRY_DSN=<paste-the-DSN-here>' | Set-Content .env.staging
```

4. Verify:

```powershell
Select-String -Path .env,.env.staging -Pattern '^SENTRY_DSN='
```

Expected output: both files show a line like
`SENTRY_DSN=https://abc123def456...@o1234567.ingest.us.sentry.io/789012`

## What unblocks

- Phase 2 of tonight's session — wiring `@sentry/browser` SDK + creating
  `src/core/errorHandler.js`. The init call needs the proper DSN format.
- The "Wire Sentry" item on App Health How-to-Improve table moves from
  ~ PARTIAL to ✓ DONE after errors successfully arrive in Sentry dashboard.

## Why I can't fix this autonomously

The DSN value lives inside `.env` files which are gate-protected per
AMD-018 #6 (Secrets handling) — the agent cannot Edit/Write these files.
Founder edits + the next session's verify_command reads back to confirm.
