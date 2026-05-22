# Walkthrough — Stand up staging deploy (~5 min one-time)

**Founder time:** ~5 minutes — service account JSON + GitHub secret.
**Status:** Required to unlock the staging iteration loop. After
setup, agent ships code → cron auto-deploys → Founder reviews
https://parbaughs-staging.web.app at their pace.

---

## Why

Founder directive 2026-05-22: "provide a staging link that I can
periodically check and have you improve on before we update the live
parbaugh setup."

Agent is classifier-blocked from running `firebase deploy` even
against staging. Setting up GitHub Actions deploy with a service
account token unblocks autonomous staging deploys forever.

---

## Option A — One-shot manual deploy (skip the setup, just ship now)

Open PowerShell at the repo root:

```powershell
npm run build
firebase deploy --only hosting --project staging
```

Wait ~30 seconds. Result URL: <https://parbaughs-staging.web.app>

Future deploys: re-run the same two commands whenever agent says
"new build ready for staging review."

---

## Option B — GitHub Actions auto-deploy (5 min once, then forever)

### Step 1 — Generate Firebase service account JSON

1. Open <https://console.firebase.google.com/project/parbaughs-staging/settings/serviceaccounts/adminsdk>
2. Click **Generate new private key**
3. Confirm the warning (the file is a write-credential for staging only)
4. Browser downloads `parbaughs-staging-firebase-adminsdk-xxx.json`
5. Open that file in a text editor; you'll need to copy ALL of it
   (including the leading `{` and trailing `}`)

### Step 2 — Paste JSON into GitHub Actions secret

1. Open <https://github.com/AlrightLad/smoky-mountain-open/settings/secrets/actions>
2. Click **New repository secret** (green button, top right)
3. **Name:** `FIREBASE_SERVICE_ACCOUNT_STAGING` (must match exactly —
   the workflow references this name)
4. **Value:** Paste the entire JSON file content (Ctrl+A, Ctrl+C in
   the JSON editor; Ctrl+V into the secret value field)
5. Click **Add secret**

### Step 3 — Test the workflow

1. Open <https://github.com/AlrightLad/smoky-mountain-open/actions/workflows/staging-deploy.yml>
2. Click **Run workflow** (gray button, right side)
3. Leave defaults; click the green **Run workflow** button
4. Wait ~3 minutes for the build + deploy to complete
5. The workflow status turns green if successful
6. Visit <https://parbaughs-staging.web.app> — you should see the app

### Step 4 — Delete the local JSON file

Once the secret is set in GitHub, delete the downloaded JSON file
from your Downloads folder. Don't keep credentials on disk longer
than needed.

```powershell
Remove-Item "$env:USERPROFILE\Downloads\parbaughs-staging-firebase-adminsdk-*.json"
```

---

## How auto-deploy works after setup

- **On push to `staging` branch:** deploys immediately
- **Daily at 5 AM UTC:** deploys main → staging (keeps staging fresh
  even when no manual push)
- **Manual trigger:** click "Run workflow" on the Actions page

The live production at https://alrightlad.github.io/smoky-mountain-open
keeps deploying on every push to main (existing workflow). Staging
is a SEPARATE preview that Founder reviews before promoting to live.

---

## Verify

After setup, run from the repo root:

```powershell
node scripts/verify-staging-deploy-ready.mjs
```

Expected: `PASS — staging URL responds 200 + serves current build`

If FAIL:
- Check the workflow run logs at the Actions page above
- Common issues: secret name typo, JSON paste truncated, service
  account permissions insufficient (re-generate from console)

---

## Security note

The service account JSON is a CREDENTIAL for staging only — it
cannot deploy to production. Treat it as sensitive (gitignored if
ever saved locally; only ever lives in GitHub Secrets after Step 2).

The agent never sees this token — it lives in GitHub Actions env
where the workflow runs. The agent's classifier blocking ensures
no agent process can read or transmit the service account.

---

## Done conditions

- [ ] Service account JSON generated from Firebase console (Step 1)
- [ ] `FIREBASE_SERVICE_ACCOUNT_STAGING` secret created in GitHub (Step 2)
- [ ] Workflow run completed green (Step 3)
- [ ] https://parbaughs-staging.web.app renders the app (Step 3)
- [ ] Local JSON file deleted (Step 4)
- [ ] `node scripts/verify-staging-deploy-ready.mjs` returns PASS
