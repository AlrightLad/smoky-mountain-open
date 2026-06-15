---
status: open
title: Drop the prod Firebase service-account JSON (unblocks real-league verification)
est_minutes: 3
unblocks: Agent can verify ANY Parbaughs member's actual view (feed, profile, pulse) headlessly — closes the wrong-league verification gap that let the FatalBert pulse bug slip.
---

# Prod service-account key → real-league visual verification

## Why this matters (the bug it prevents)
The agent's verification captures sign in as the **smoke-test account, which lives
in `smoke-test-league` — NOT The Parbaughs.** League isolation means that account
**cannot see The Parbaughs data** (FatalBert's round, your pulse, your roster). So
every "verified ✓" was the wrong league — which is exactly how the FatalBert
"shows on full pulse but not profile/landing pulse" issue slipped through untested.

A read-only prod service-account key lets the agent mint a custom token for ANY
Parbaughs member uid and load the app **as that member**, headless, to verify the
real surfaces — then build an automated cross-surface visibility screen so this
class of bug is caught every run.

## What to do (3 minutes, no CLI needed)
1. Open the Firebase service-accounts page for the prod project:
   **https://console.firebase.google.com/project/parbaughs/settings/serviceaccounts/adminsdk**
2. Click **"Generate new private key"** → confirm. A `.json` file downloads.
3. Move + rename it to exactly:
   **`C:\Users\Zach\smoky-mountain-open\scripts\.secrets\prod-service-account.json`**
   (That folder is git-ignored — the key is never committed. Same place as the
   existing `fb-oauth.json`.)

That's it. Tell the agent "prod SA is in place" (or it will detect the file).

### CLI alternative (if you prefer a command)
```
gcloud iam service-accounts keys create scripts/.secrets/prod-service-account.json ^
  --iam-account="<PROD_SA_EMAIL>" ^
  --project=parbaughs
```
(If that exact service-account email errors, run `gcloud iam service-accounts list --project=parbaughs`
and use the `firebase-adminsdk-...@parbaughs.iam.gserviceaccount.com` address it lists.)

## What the agent does once it's present
`node scripts/verify-as-member.mjs <uid> <route>` — mints a read-only custom
token for that member, loads the app as them, and reports/captures what renders.
Then it becomes a standing cross-surface screen (a round must render on profile +
pulse + feed, not just exist in the data).

## Security
Read-only verification use, in-memory token only, key stays in the git-ignored
`scripts/.secrets/`. Revoke anytime from the same Firebase console page.
