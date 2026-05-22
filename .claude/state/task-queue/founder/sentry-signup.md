---
status: open
severity: green
priority: MEDIUM
walkthrough_doc: docs/walkthroughs/sentry-signup.md
verify_command: "$envFile = if (Test-Path .env.staging) { '.env.staging' } else { '.env' }; $line = Select-String -Path $envFile -Pattern '^SENTRY_DSN=(.+)$' | Select-Object -First 1; if (-not $line) { 'FAIL' } else { $value = $line.Matches[0].Groups[1].Value; if ($value -match '^https://[a-f0-9]+@o[0-9]+\\.ingest\\.(us|de|eu)\\.sentry\\.io/[0-9]+$') { 'PASS' } else { 'FAIL' } }"
verify_expected: "PASS"
---

# Founder action — Sign up for Sentry (free tier, no credit card)

**Surfaced:** 2026-05-21. Adds production-grade error monitoring with stack traces, breadcrumbs, and release tracking. Free tier covers 5K errors/month — comfortably above PARBAUGHS member count.

## Walkthrough

`docs/walkthroughs/sentry-signup.md` — ~6 minutes:

1. Go to <https://sentry.io/signup/> and create an account (email or "Sign up with Google")
2. Org name: `parbaughs`  Project name: `parbaughs-web`  Platform: `JavaScript (Browser)`
3. Sentry shows the DSN — paste it into `.env` and `.env.staging`
4. Agent auto-wires `@sentry/browser` into `src/core/utils.js` when DSN is detected

## What this unblocks

- A3 Security → Observability lift (~+8 points)
- A8 Monitoring → score moves from "logging only" to "alerted on errors"
- Production debug velocity — stack traces with member identity (after consent) shorten incident triage
