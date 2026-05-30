---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-05-23T14:00:00Z
authored_by: agent
founder_action_required: true
cost: $0
execute_by: founder
execute_by_reason: handles a service-account secret (gate 6); the agent must never read or pipe raw credential material
---

# GitHub Actions staging deploy — needs FIREBASE_SERVICE_ACCOUNT_STAGING secret

## What

The `.github/workflows/staging-deploy.yml` workflow has been failing
on every push to the `staging` branch (and on daily scheduled runs).
Red checkmarks appear on each commit on the Founder's GitHub view.

## Why

The workflow's `FirebaseExtended/action-hosting-deploy@v0` step requires
a GitHub Actions secret named `FIREBASE_SERVICE_ACCOUNT_STAGING` —
the JSON content of a Firebase service-account key. That secret has
never been added to the GitHub repo. The workflow fails at the deploy
step with an authentication error.

The agent's local deploys (`node scripts/seed-deploy-staging-hosting.mjs`)
work because they use `scripts/.service-account.json` (gitignored
local file). The two paths are independent — fixing the GitHub
Actions secret does NOT change local behavior.

## What the agent already did

- Updated `.github/workflows/staging-deploy.yml` to fail-soft:
  - Added a check step that detects whether the secret is present.
  - Deploy step now only runs when the secret is detected.
  - When the secret is absent, the workflow runs build-only and
    finishes GREEN with a log explaining how to set the secret.
- This stops the red checkmarks on every push.
- Local deploys continue to work unchanged.

## What you need to do

**Who can do this:** any maintainer with admin access to the GitHub repo
(`AlrightLad/smoky-mountain-open`) settings and to the `parbaughs-staging`
Firebase console. Optional convenience — the workflow already finishes
GREEN without it.

If you want the GitHub Action to ALSO push to Firebase (in addition
to the local deploy), add the secret:

1. **Get a fresh service-account JSON for parbaughs-staging:**
   - Open https://console.firebase.google.com/project/parbaughs-staging
   - Project Settings → Service accounts tab
   - Click "Generate new private key" → confirm → JSON downloads
2. **Add the secret to GitHub:**
   - Open https://github.com/AlrightLad/smoky-mountain-open/settings/secrets/actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT_STAGING`
   - Value: paste the **entire JSON content** of the file you just
     downloaded (including the outer `{` and `}`)
   - Click "Add secret"
3. **Verify:**
   - Push any small commit to staging (or trigger the workflow
     manually from the Actions tab)
   - The next run should show "Firebase staging service account
     secret detected — deploy will proceed" + a successful Deploy
     step
4. **Delete the local copy** of the downloaded JSON from your
   Downloads folder once the GitHub secret is set, to reduce blast
   radius if your machine is ever compromised.

If you DON'T want GitHub Actions deploying (keeping local-only):
just leave the secret unset. The workflow will keep finishing
GREEN with build-only runs. No action needed.

## Risk

The service-account JSON is a credential — treat like a password.
GitHub Actions secrets are encrypted at rest and never exposed to
PR runs from forks. AMD-018 gate #6 (Secrets handling) covers this:
agent does not edit/read the secret; Founder pastes once + manages.

## Closure criteria

- Either: an authorized maintainer sets the secret + next workflow run
  succeeds with the Deploy step.
- Or: the Founder explicitly closes this task as "local deploys only,
  no GitHub Action deploy needed."
