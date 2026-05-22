---
status: open
severity: green
priority: LOW
walkthrough_doc: docs/walkthroughs/sentry-auth-token.md
verify_command: "node scripts/verify-sentry-auth-token.mjs"
verify_expected: "PASS"
---

# Founder action — Generate Sentry Auth Token for sourcemap upload (enhancement)

**Surfaced:** 2026-05-22 by Phase 2 Sentry SDK wiring.
**Severity:** green — runtime is already working without this. Sourcemap upload
is an enhancement that converts minified production stack traces into readable
source lines.

## What this enables

Without the auth token: when Sentry receives an error from production, the
stack trace shows minified line numbers like `at e(dist/index.html:1:84321)` —
nearly impossible to debug.

With the auth token + `@sentry/vite-plugin`: at build time, the plugin uploads
the sourcemaps to Sentry. Sentry then automatically resolves stack traces to
readable line numbers like `at handleClick (src/pages/playnow.js:142)`.

## How to set up (~5 minutes)

1. Open <https://sentry.io/settings/account/api/auth-tokens/>
2. Click **Create New Token**
3. Set scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Set name: `parbaughs-vite-sourcemap-upload`
5. Click **Create Token** — copy the token (shown only once)
6. In PowerShell at repo root:
   ```powershell
   Add-Content -Path .env -Value "`r`nSENTRY_AUTH_TOKEN=<paste-token-here>"
   ```
7. Tell next session "Sentry auth token added" and the agent will install
   `@sentry/vite-plugin` and wire it into vite.config.js for sourcemap upload.

## Why I can't fix this autonomously

The auth token is a Founder-account-scoped credential. Sentry's UI doesn't
support agent-generated tokens. The token also lives in `.env` (gate-protected
per AMD-018 #6).

## What's NOT blocked

- Sentry's RUNTIME is fully working as of 2026-05-22 commit b07641ed +
  follow-ons. Errors land in the Sentry dashboard; you can read them now —
  the stack traces just show minified line numbers until this is set up.
- The session's Phase 2 work landed without this token. Sourcemap upload is
  a strictly-additive enhancement.
