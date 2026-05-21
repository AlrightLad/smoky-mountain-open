# Walkthrough — Activate parbaughs-staging Firebase project

**Founder time:** ~5 minutes of console clicks + 1 minute paste.
**Status (as of 2026-05-21):** Project + Web App created by agent. Firestore/Auth need Founder console enable.

---

## What the agent already completed (no action needed)

| Step | State | Evidence |
|---|---|---|
| 1. Create `parbaughs-staging` Firebase project | DONE | `firebase projects:list` shows it (project number 608660343453) |
| 2. Create Web app `parbaughs-staging-web` | DONE | App ID `1:608660343453:web:c64f8ec9d09fd4c84a2274` |
| 3. Pull SDK config | DONE | API key + authDomain + storageBucket captured below |
| 4. `.firebaserc` multi-project map | DONE | `default=parbaughs · production=parbaughs · staging=parbaughs-staging` |
| 5. `scripts/deploy.sh` honors `--target=staging` | DONE | pre-existing |
| 6. `docs/deployment-environments.md` | DONE | pre-existing |

What's left is **two console enables** (Firestore + Auth) because Google's API gate denies agent-side calls without elevated console session.

---

## Step 1 — Enable Firestore (2 min)

1. Open: <https://console.firebase.google.com/project/parbaughs-staging/firestore>
2. Click **Create database**
3. **Mode:** Production (start in locked mode; rules deploy will replace this)
4. **Location:** `nam5 (us-central)` — match production for low cross-region latency
5. Click **Enable**

When the database initialization completes (~30s), Firestore is on.

---

## Step 2 — Enable Email/Password authentication (1 min)

1. Open: <https://console.firebase.google.com/project/parbaughs-staging/authentication/providers>
2. Click **Get started** (first-time)
3. Under **Sign-in providers**, click **Email/Password**
4. Toggle the first switch **ON** (Email/Password)
5. Leave the second switch (Email link) **OFF** — production doesn't use it
6. Click **Save**

---

## Step 3 — Create `.env.staging` locally (1 min — Founder paste)

This file is gitignored (`.env*` pattern). It only lives on your machine.

Open PowerShell at the repo root and paste:

```powershell
@'
# PARBAUGHS Staging environment — created 2026-05-21
# Source: docs/walkthroughs/staging-firebase-project.md
FIREBASE_PROJECT_ID=parbaughs-staging
FIREBASE_APP_ID=1:608660343453:web:c64f8ec9d09fd4c84a2274
FIREBASE_API_KEY=AIzaSyCO0WYQntITwU7ndI3B0ZXlvcxDZdvtF3M
FIREBASE_AUTH_DOMAIN=parbaughs-staging.firebaseapp.com
FIREBASE_STORAGE_BUCKET=parbaughs-staging.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=608660343453
FIREBASE_PROJECT_NUMBER=608660343453
'@ | Out-File -Encoding utf8 -NoNewline .env.staging
```

Verify the file exists + is gitignored:

```powershell
Test-Path .env.staging                  # True
git check-ignore .env.staging           # echoes .env.staging (means: ignored)
```

> Firebase Web API keys are public by design (they identify the project, not authenticate). The auth boundary is Firestore rules + Cloud Function security — both of which deploy as part of the staging promotion process. Treating `.env.staging` as private is still good hygiene (gitignore is unconditional) but no key here is a credential.

---

## Step 4 — Deploy Firestore rules + indexes to staging (1 min)

Once Firestore is enabled (Step 1 must finish), the agent can do this from `scripts/deploy.sh` after AMD-018 gate 2 approval. **You authorize once; agent runs the deploy:**

```powershell
firebase deploy --only firestore:rules --project staging
firebase deploy --only firestore:indexes --project staging
```

The agent will surface a one-click "deploy rules" button on the dashboard once Firestore is live, or you can run the commands above directly.

---

## Step 5 — Verify (auto-runs when you Mark complete)

When you click "Mark complete (copy command)" on the Founder Checklist, the verify
command runs automatically:

```powershell
firebase projects:list 2>&1 | Select-String parbaughs-staging
```

Expected output contains `parbaughs-staging` → verification passes → dashboard
flips item to "verified-closed".

---

## Done conditions

- [x] Project exists in Firebase console (agent verified)
- [x] Web app config captured to walkthrough (agent verified)
- [ ] Firestore enabled (Founder — Step 1)
- [ ] Email/Password auth enabled (Founder — Step 2)
- [ ] `.env.staging` exists locally (Founder — Step 3)
- [ ] Rules + indexes deployed (Founder authorizes, agent runs — Step 4)

After all checkboxes are green, the `staging-firebase-project` item drops off the
Founder Checklist and W1.I4 (Staging environment) is unblocked.

---

## What this unblocks

- **W1.I4** — Wave 1 Iteration 4 (Staging environment) ship
- **Wave 2 reveal-moment staging** — test new features in real Firebase before production
- **Wave 4 migration testing** — safe schema changes
- **Wave 3 TestFlight** — iOS pre-production builds point at staging
- **Smoke deploy-and-verify** — automation can hammer staging without affecting members
