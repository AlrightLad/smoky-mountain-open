---
status: open
severity: green
priority: MEDIUM
verify_command: "if (Test-Path .env.staging) { Select-String -Path .env.staging -Pattern 'SENTRY_DSN' } else { 'NOT_FOUND' }"
verify_expected: "SENTRY_DSN="
walkthrough_doc: docs/walkthroughs/sentry-signup.md
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
