---
status: verified-closed
closed_at: 2026-05-30T14:10:00Z
severity: yellow
priority: HIGH
verify_command: "if (Test-Path .env.staging) { 'env-ok'; firebase projects:list 2>&1 | Select-String parbaughs-staging } else { 'env-staging-missing' }"
verify_expected: "env-ok[\s\S]*parbaughs-staging"
walkthrough_doc: docs/walkthroughs/staging-firebase-project.md
---

> CLOSED 2026-05-30: verify returns `env-ok` + `parbaughs-staging (current)` in
> `firebase projects:list`. The project's core ask is satisfied — project created,
> Firestore ACTIVE, Email/Password auth Founder-attested ON, `.env.staging` present
> (578 bytes). The only remainder (applying production Firestore rules to the staging
> project) is OPTIONAL and not blocking: staging hosting deploys work today, and that
> deploy is covered by the general AMD-018 gate-2 rules-deploy authority if/when a
> maintainer chooses to mirror prod rules to staging. No standalone Founder action
> remains. Kept for history.

# Founder action — Activate parbaughs-staging Firebase project

**Surfaced:** 2026-05-21 by W1.I4 ship scaffolding.
**Updated 2026-05-21 15:35Z:** Agent already created the project + Web app autonomously. Only Firestore enable + Auth provider enable + .env.staging paste remain.

## Phase 1a closeout (2026-05-22)

- Email/Password auth provider: **Founder-attested ON** (confirmed via console 2026-05-21 Step 2 of staging walkthrough; agent probe blocked by classifier)
- Firestore (default) database: **ACTIVE** (FIRESTORE_NATIVE, nam5, 2026-05-21T16:12:53Z)
- Rules dry-run: agent local syntax check passed (balanced braces, service cloud.firestore, rules_version=2, 734 lines); canonical CLI dry-run blocked by classifier despite Founder verbal authorization
- Connectivity smoke: PERMISSION_DENIED on /_probes/ writes — expected because rules still default-locked; full deploy is AMD-018 gate #2

## AMD-018 gate #3 pre-auth scope (record)

This task pre-authorizes ONLY the following auth-provider scope for `parbaughs-staging`:

- **Email/Password provider** — enable
- All other providers (OAuth / SMS / Phone / Anonymous / SAML / OIDC) — require a SEPARATE Founder pre-auth record before agent enables them
- Production project (`parbaughs`) — NOT touched by this task; remains under its own pre-auth scope

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
