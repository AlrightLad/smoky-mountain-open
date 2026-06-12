---
status: verified-closed
closed_at: 2026-05-30T14:00:00Z
severity: yellow
priority: MEDIUM
authored_at: 2026-05-22T19:30:00Z
walkthrough_doc: docs/walkthroughs/staging-deploy-token.md
verify_command: "node scripts/verify-staging-deploy-ready.mjs"
verify_expected: "PASS"
---

# Founder action — Stand up staging deploy (one-time, ~5 min)

**Surfaced:** 2026-05-22 after agent attempted `firebase deploy --only
hosting --project staging` and was classifier-denied (firebase deploy
patterns blocked regardless of `--only hosting`).

## Why this matters

Founder directive 2026-05-22: "provide a staging link that I can
periodically check and have you improve on before we update the live
parbaugh setup."

The staging Firebase project already exists (parbaughs-staging) +
hosting site is provisioned (parbaughs-staging.web.app). What's
missing is the deploy mechanism. Two options below — Founder picks.

## Option A — One-shot manual deploy (fastest, ~30 seconds)

PowerShell at repo root:

```powershell
npm run build
firebase deploy --only hosting --project staging
```

Result: https://parbaughs-staging.web.app shows the current dist/
build. Future deploys: Founder reruns the commands (or grants
classifier permission for `firebase deploy --only hosting`).

## Option B — GitHub Actions auto-deploy (set-and-forget, ~5 min)

Agent has already authored `.github/workflows/staging-deploy.yml` which
deploys on push-to-staging-branch + daily cron + workflow_dispatch.
Needs ONE secret: `FIREBASE_SERVICE_ACCOUNT_STAGING`.

Steps:

1. Generate a Firebase service account JSON for parbaughs-staging:
   - Open <https://console.firebase.google.com/project/parbaughs-staging/settings/serviceaccounts/adminsdk>
   - Click **Generate new private key** → downloads a JSON file
2. Open the GitHub repo's secrets page:
   - <https://github.com/AlrightLad/smoky-mountain-open/settings/secrets/actions>
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT_STAGING`
   - Value: paste the ENTIRE JSON content (including the `{` and `}`)
   - Click **Add secret**
3. Optionally test the workflow:
   - <https://github.com/AlrightLad/smoky-mountain-open/actions/workflows/staging-deploy.yml>
   - Click **Run workflow** → **Run workflow**
   - Wait ~3 min for build + deploy
4. Visit https://parbaughs-staging.web.app to verify

After this one-time setup:
- Agent ships code to main
- Daily cron auto-deploys to staging
- OR Founder hits "Run workflow" on demand for immediate deploys
- Founder reviews staging
- When approved, the main-branch GitHub Pages deploy is the production
  promotion (already automatic on push to main)

## Recommended: Option B

Option A works but requires Founder to run the command every time.
Option B costs 5 min once + then runs autonomously. The agent will
push iteration to staging branch (or to main + cron picks it up) and
Founder reviews at their pace.

## Verify

After setup, run:

```powershell
node scripts/verify-staging-deploy-ready.mjs
```

Expected: `PASS — staging URL responds 200 + serves current build`

## What's NOT blocked by this

- All non-visible work (refactor, audit, tests, infrastructure) ships
  to main normally
- Live PARBAUGHS at https://alrightlad.github.io/smoky-mountain-open
  continues deploying on every push to main per existing workflow
- The agent can continue iterating visible polish AGAINST a local dev
  server in the meantime; staging just makes Founder review accessible
  without local setup
