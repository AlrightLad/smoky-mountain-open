---
status: verified-closed
closed_at: 2026-05-30T14:00:00Z
severity: yellow
priority: MEDIUM
authored_at: 2026-05-22T19:50:00Z
walkthrough_doc: docs/walkthroughs/firestore-agent-access.md
verify_command: "node scripts/verify-firestore-agent-access.mjs"
verify_expected: "PASS"
---

# Founder action — Grant agent Firestore access on parbaughs-staging (secure, limited)

**Surfaced:** 2026-05-22 per Founder directive: "what permissions do I
need to alter so we can have an effective firestore connection between
you two but also be secure."

## What this enables

Agent can:
- Read Firestore documents to verify state at write-time (closes the
  evidence-supported-test-on-both-ends loop for any Firestore-touching
  ship)
- Write seed data + test fixtures directly via firebase-admin without
  always needing the local emulator running
- Iterate visible polish that depends on real-shape data (not just
  emulator-seeded synthetic fixtures)

Agent does NOT get:
- Production Firestore access (parbaughs project) — staging only
- Auth provider modify, Functions deploy, Hosting deploy, or any
  resource other than Firestore
- The credential itself in any tracked file (lives in
  scripts/.service-account.json which is gate-protected per AMD-018 #6
  + Hook 4)

## Security boundary (concrete)

| What | Granted | Denied |
|---|---|---|
| Firestore read/write on `parbaughs-staging` | ✓ | |
| Firestore on `parbaughs` (production) | | ✗ |
| Auth provider config | | ✗ |
| Cloud Functions deploy | | ✗ |
| Service account JSON in any tracked file | | ✗ (gate-protected) |
| Service account JSON in dist/ bundle | | ✗ (build excludes scripts/) |
| Network access from internet to staging Firestore | restricted to allowlisted IAM identities only |

Blast radius if leaked: staging-only Firestore data. NO production
data, NO auth, NO real members. Seed data + test fixtures only.

## Recommended approach (TL;DR — Option B in walkthrough)

1. Open the Firebase Console → parbaughs-staging → Settings → Service Accounts
2. Click **Generate new private key** with the **default scope**
   (Firebase Admin SDK service account — already has datastore.user)
3. Save the JSON file
4. Move it to `scripts/.service-account.json` in the repo root
5. Verify with `node scripts/verify-firestore-agent-access.mjs`

The full walkthrough at `docs/walkthroughs/firestore-agent-access.md`
covers the locked-down variant (Option A) if you want a custom role
with ONLY datastore.user (no Firebase Auth Admin, no Storage Admin).
Option B uses the default service account which has slightly broader
scope but is the standard Firebase practice for backend service
accounts.

## How to approve / done conditions

- [ ] Service account JSON generated on parbaughs-staging project
- [ ] File saved to `scripts/.service-account.json` (root of repo)
- [ ] `node scripts/verify-firestore-agent-access.mjs` returns `PASS`
- [ ] gate-protected.sh (Hook 4) confirmed blocking edits to that file
      (run `git status` after attempting an edit — should remain dirty
      and the hook should print a refusal message)
