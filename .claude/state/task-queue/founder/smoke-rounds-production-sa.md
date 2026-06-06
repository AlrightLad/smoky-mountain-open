---
status: open
severity: yellow
priority: LOW
founder_action_required: true
gate: AMD-018 #5 (credentials) / #6 (secrets)
verify_command: node -e "console.log(require('./scripts/.service-account.json').project_id)"
verify_expected: ^parbaughs\s*$
---

# Optional: let smoke exercise rounds engagement against production

**Who can do this:** anyone with access to the Firebase **`parbaughs`**
(production) console who can download a service-account key — Founder, or a
maintainer with Owner/Editor on the prod project. About 3 minutes.

**This is optional and nothing is broken.** The smoke suite is already green
and honest without it (see "What's true today"). Do this only if you want the
pre-push smoke signal to *also* exercise rounds kudos / comment / manage
engagement against the live production database, the way the full E2E suite
already does against the emulator.

## What's true today (no action = totally fine)

Seven rounds-engagement smoke scenarios (S13, S14, S15, S16, S23, S25, S26)
seed test rounds through the Firebase **Admin SDK**, then assert on what the
browser renders. That only works when the admin key and the web app point at
the **same** Firebase project.

Right now they don't:

- the web app is hardcoded to **`parbaughs`** (production) — `src/core/firebase.js`
- the only admin key on disk is for **`parbaughs-staging`** — `scripts/.service-account.json`

So an admin-seeded round lands in *staging* while the browser reads
*production*: the seed is invisible to the page. Rather than report a false
failure, those seven scenarios now **detect the mismatch and soft-pass with a
one-line diagnostic** (a project-guard added 2026-06-06). Every other smoke
scenario runs normally and the suite stays green.

Those same engagement paths are **already covered for real** by the full E2E
suite (flows 01-09) against the emulator, where seed and read share one
project. Skipping them in the lighter smoke signal is **not** a coverage hole;
it is belt-and-suspenders.

## What you need to do (only if you want the extra coverage)

1. Open the production project's service-account page:
   https://console.firebase.google.com/project/parbaughs/settings/serviceaccounts/adminsdk
2. Click **Generate new private key**, confirm, and a `.json` downloads.
3. Save it **locally** to this exact path, replacing the staging key:
   ```
   C:\Users\Zach\smoky-mountain-open\scripts\.service-account.json
   ```
4. That is all. On the next `npm run smoke`, the seven scenarios seed into
   production and assert for real instead of soft-passing.

### This key must NEVER be committed

`scripts/.service-account.json` is already gitignored (`.gitignore:21`),
blocked from edits by the `gate-protected.sh` hook, and any private-key shape
is caught by the secretlint pre-commit gate. Per incident
INC-2026-05-21-001 the credential-commit exception list is empty. Leave all
three guards in place. The file stays on your machine only.

### Trade-off to weigh first

Doing this makes every `npm run smoke` write a handful of **namespaced test
rounds into the live production Firestore** (`smoke-test-league`,
`isTestAccount: true`, cleared at the start of each run). That is the same
production the real smoke account already signs into and writes notifications
to, so it is consistent with the existing model. If you would rather keep zero
test writes hitting prod, **leave this as-is**: the guard-only posture above is
the safe default and costs you nothing.

## Mark complete

After saving the production key, run:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 smoke-rounds-production-sa
```

The verify prints the project id of the key now on disk and passes only if it
reads `parbaughs` (not `parbaughs-staging`).
