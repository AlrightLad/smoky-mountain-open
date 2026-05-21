---
status: open
severity: yellow
priority: HIGH
verify_command: "firebase projects:list 2>&1 | Select-String parbaughs-staging"
verify_expected: "parbaughs-staging"
walkthrough_doc: docs/walkthroughs/staging-firebase-project.md
---

# Founder action — Activate parbaughs-staging Firebase project

**Surfaced:** 2026-05-21 by W1.I4 ship scaffolding.
**Updated 2026-05-21 15:35Z:** Agent already created the project + Web app autonomously. Only Firestore enable + Auth provider enable + .env.staging paste remain.

## Walkthrough

`docs/walkthroughs/staging-firebase-project.md` — opens in your browser. ~4 minutes total:

- **Step 1** (2 min) — Click "Create database" in Firebase console → Firestore enabled
- **Step 2** (1 min) — Toggle Email/Password ON in Auth providers
- **Step 3** (1 min) — Paste pre-built `.env.staging` block into PowerShell

Verify runs automatically when you Mark complete; it confirms the project is reachable via `firebase projects:list`.

## What this unblocks

W1.I4 (Staging environment) — separate Firebase project mirroring production, used for:
- Wave 2 reveal-moment staging before production
- Wave 4 migration testing
- Wave 3 mobile (TestFlight pre-production)
- Smoke automation deploy-and-verify

## How to apply (~10 minutes)

1. **Open Firebase console:** https://console.firebase.google.com/
2. **Create new project** named `parbaughs-staging`
   - Use the same Google account that owns `parbaughs`
   - Region: us-central1 (match production)
   - Enable Google Analytics: **No** (staging doesn't need analytics)
3. **Enable required services:**
   - Authentication → Sign-in providers → Email/Password ON
   - Firestore Database → Create database (production mode)
   - Cloud Functions → Skip until first deploy
   - Storage → Skip until needed
4. **Apply firestore rules + indexes from production:**
   ```bash
   firebase deploy --only firestore:rules --project staging
   firebase deploy --only firestore:indexes --project staging
   ```
5. **Create staging .env.staging file** (gitignored):
   ```bash
   # Copy .env from production source and update:
   FIREBASE_PROJECT_ID=parbaughs-staging
   FIREBASE_API_KEY=<from console>
   ```
6. **Optional: register CI service account** for automated deploys to staging.

## What the agent has scaffolded (already done)

| File | Purpose |
|---|---|
| `.firebaserc` | Multi-project config (default=parbaughs, production, staging) |
| `scripts/deploy.sh` | `--target=staging` flag respects FIREBASE_PROJECT env |
| `docs/deployment-environments.md` | Production vs staging deployment flow doc |

## Verify after

After project creation:
```bash
firebase projects:list
# Should show parbaughs + parbaughs-staging

firebase use --add staging
# Selects parbaughs-staging as active project

npm run build && firebase deploy --only hosting --project staging
# Verify a smoke deploy lands on staging
```

## Cross-reference

- `docs/agents/ships/W1.I4.md` — ship plan
- AMD-018 11-gate item #3 (auth provider config) — gate applies to staging project setup
- AMD-018 11-gate item #1 (Cloud Functions deploy) — gate applies to staging functions deploy

## Why agent can't do this

Firebase project creation requires:
- Founder Google account authentication (biometric/MFA — AMD-018 item #11)
- Founder console access (not exposed to agent CLI)
- Per-project billing setup (Founder financial authority)
