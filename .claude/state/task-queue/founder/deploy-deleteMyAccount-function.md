---
status: open
severity: yellow
priority: HIGH
authored_at: 2026-05-29T11:05:00Z
authored_by: agent
founder_action_required: true
gate: AMD-018 gate 1 (Cloud Functions deploy)
cost: $0
execute_by: agent
verify_command: node scripts/verify-delete-fn-deployed.mjs
verify_expected: PASS
---

# Deploy the `deleteMyAccount` Cloud Function (App Store 5.1.1(v) / GDPR)

## What

A new Cloud Function, `deleteMyAccount`, needs to be deployed to the
production `parbaughs` project. Deploying Cloud Functions is AMD-018
gate 1, so it requires your explicit go-ahead. The function code is
written, reviewed, and verified; it is NOT deployed.

## Why this matters

In-app account deletion is **required** by App Store Review Guideline
5.1.1(v) and GDPR Article 17 (right to erasure). It was effectively
**broken**: the old code tried to delete the member's own Firestore
doc from the browser, but `firestore.rules` line 206 only allows the
Founder to delete member docs (`allow delete: if amIFounder()`). So
every real deletion attempt failed with `PERMISSION_DENIED`, and in
some cases left a half-deleted account (profile data wiped, sign-in
stranded).

The fix moves deletion server-side, where the Admin SDK bypasses the
rules (the correct, standard pattern). The browser re-authenticates the
user, then asks the function to erase them.

## What the agent already did (no deploy)

- **Wrote `deleteMyAccount`** (`functions/index.js`): verifies a fresh
  Firebase ID token, then deletes the member doc + the member's photos
  + the Firebase Auth account, and writes a compliance audit-log entry.
  Auth account is deleted LAST so a mid-way failure stays retryable.
- **Hardened it:** CORS allow-list, POST-only, bearer-token required,
  `checkRevoked` token verification, a 5-minute `auth_time` freshness
  guard (a stale long-lived session cannot trigger deletion without a
  fresh password reauth), and a 5/min per-user rate limit.
- **Rebuilt the in-app flow** (`src/core/firebase.js`,
  `src/pages/settings.js`): a branded bottom-sheet that requires the
  password **and** typing the word DELETE, re-authenticates FIRST, then
  calls the function. Honest copy: "This removes your profile, photos,
  and sign-in from Parbaughs. This cannot be undone."
- **Verified two ways against the local emulator:**
  - In-process handler test (`scripts/visual-audit/verify-delete-fn-2026-05-29.mjs`): 12/12.
    Covers OPTIONS/origin/method/missing-token/bad-token rejections, the
    real erasure (member + photo + auth gone), and the audit-log write.
  - Full browser end-to-end (`scripts/visual-audit/verify-delete-account-2026-05-29.mjs`): 8/8.
    Wrong password deletes NOTHING (reauth-first); correct password runs
    the real function and erases everything. Screenshots in
    `.claude/state/design-pass-2026-05-22/delete-account-2026-05-29/`.

## Interim behavior until you deploy (fail-closed, safe)

On staging/production the function isn't deployed yet, so a member who
confirms deletion will reauthenticate, then see:

> "Account deletion is being finalized on our end. Email
> support@parbaughs.golf and we will remove your account right away.
> Nothing was deleted yet."

Nothing is half-deleted, and there is a clear support path. This is
strictly better than the previous broken state and is an
Apple-acceptable interim (in-app initiation + support completion).

## What you need to do

**Who can do this:** any maintainer with production Firebase deploy
access (`firebase login` against an account with Editor/Owner on the
`parbaughs` project). This is AMD-018 gate 1 (Cloud Functions deploy),
so it also needs the Founder's explicit go-ahead before the agent runs
it — the gate is the authorization, the maintainer is the executor.

**Option A (recommended) — deploy all functions:**
This also picks up the additive CORS change that lets the **staging**
site call `validateInvite` / `searchCourses` (needed for full staging
testing). Only behavioral delta to existing functions is the expanded
origin allow-list (adds staging + loopback hosts). Run:

```
firebase deploy --only functions --project parbaughs
```

**Option B (minimal) — deploy just the new function:**

```
firebase deploy --only functions:deleteMyAccount --project parbaughs
```

Run it directly (in a Claude Code session, prefix with `! ` so the
agent sees the output), or reply "approved, you deploy" to authorize
the agent to run it once for this specific ship.

## Verify after deploy

1. Open the live app, Settings, Delete My Account.
2. With a throwaway test account: wrong password shows
   "That password is not correct. Nothing was deleted."; correct
   password fully deletes (you are signed out and the member is gone
   from the Members list).
3. Confirm a `platform_audit_log` entry with `action: account_self_deleted`.

## Risk

- Additive function; existing functions' logic is unchanged except the
  shared origin allow-list expansion (safe: it only adds staging +
  loopback, which are ours).
- Admin-SDK deletion is irreversible by design (that is the point).
  Guards: password reauth, typed DELETE, fresh-token requirement, rate
  limit. No bulk/cron deletion path exists; only the signed-in user can
  delete themselves.

## Follow-up (Phase 2, not blocking)

Current scope matches the in-app copy exactly: member doc + photos +
auth account. A full GDPR cascade across every collection the member
appears in (scores, round records, social actions, DMs, etc.) needs a
collection-ownership audit + its own emulator verification before it is
safe to write. Tracked as a follow-up; the current scope satisfies the
App Store requirement and the user-facing promise.

## Closure criteria

- An authorized maintainer deploys (Option A or B) and the post-deploy
  verification passes, OR
- The Founder explicitly defers (members keep seeing the support-path
  message until then).
