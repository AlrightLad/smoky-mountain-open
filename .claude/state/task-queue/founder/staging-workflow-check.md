---
status: open
severity: yellow
priority: MEDIUM
authored_at: 2026-05-22T20:00:00Z
verify_command: "node scripts/verify-staging-deploy-ready.mjs"
verify_expected: "PASS"
---

# Founder action — Check staging-deploy workflow ran (3 staging pushes since first deploy)

**Surfaced:** 2026-05-22 — agent pushed 3 commits to `staging` branch
after initial deploy (15549b6c, ca4fa6e9, b18553e9). Staging URL is
still serving the build from Last-Modified 2026-05-22 19:27:50 UTC —
that's the FIRST deploy, before my polish iterations landed.

The agent's polish work in iter1+2+3 (STREAK cell, recent rounds
dates, weather banner) is on `main` and `staging` branches but NOT
reaching the live staging URL.

## What you can check (~1 min)

Open <https://github.com/AlrightLad/smoky-mountain-open/actions/workflows/staging-deploy.yml>

You should see one of these patterns:

**Pattern A — Workflow runs queued / in progress:** wait ~3 min, then
the latest commit should deploy. URL will refresh.

**Pattern B — Workflow runs all failed:** click the failed run → look
at the build/deploy step. Common causes:
- `FIREBASE_SERVICE_ACCOUNT_STAGING` secret missing or malformed JSON
- IAM permission denied (service account lacks Firebase Hosting Admin)

**Pattern C — No workflow runs visible:** the secret name doesn't
match what the workflow expects, OR the secret was created at the
environment level instead of repository level.

## Most likely root cause

You ran `firebase deploy --only hosting --project staging` manually
the first time (Option A in the original walkthrough) — that's why
the URL is live. The GitHub Actions secret may not have been set up,
OR was set up with a different name.

## Fix options

**Option 1 — One-time manual re-deploy** to publish iter1+2+3:

```powershell
cd C:\Users\Zach\smoky-mountain-open
git checkout staging
git pull origin staging
npm run build
firebase deploy --only hosting --project staging
git checkout main
```

Result: https://parbaughs-staging.web.app refreshes with my polish.

**Option 2 — Verify the GitHub secret + workflow** (set-and-forget):

1. Open <https://github.com/AlrightLad/smoky-mountain-open/settings/secrets/actions>
2. Confirm `FIREBASE_SERVICE_ACCOUNT_STAGING` exists (at the
   "Repository secrets" section, NOT environment secrets)
3. If missing or named differently, recreate per docs/walkthroughs/staging-deploy-token.md
4. Trigger workflow manually via Actions tab → staging-deploy.yml →
   Run workflow

## What's NOT blocked

- Agent continues iterating polish locally
- All polish work is committed on main + staging branches
- Once staging deploy works, all 3 iterations + any subsequent ones
  surface immediately
