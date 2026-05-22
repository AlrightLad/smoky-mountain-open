# Walkthrough — Grant agent Firestore access on parbaughs-staging

**Founder time:** ~3 minutes (Option B) or ~8 minutes (Option A — custom role).
**Status:** Required for autonomous agent work that reads/writes
Firestore. Without it, agent depends on the local emulator (which
breaks every time it restarts).

---

## Two options

| Option | Time | Scope | Recommendation |
|---|---|---|---|
| **A — Custom role** | 8 min | Firestore read/write ONLY (locked down) | Most secure; preferred if you want to inspect every grant |
| **B — Default Firebase Admin** | 3 min | Firestore + Auth Admin + Storage Admin (broader) | Faster; standard Firebase pattern; safe-enough because limited to STAGING |

Both options apply to the **staging** project only (parbaughs-staging).
Production Firestore (parbaughs) is never touched.

---

## Option B — Default Firebase Admin (3 min, recommended for speed)

### Step 1 — Generate the service account key

1. Open <https://console.firebase.google.com/project/parbaughs-staging/settings/serviceaccounts/adminsdk>
2. Click the **Generate new private key** button (bottom of page)
3. Confirm the warning. A JSON file downloads:
   `parbaughs-staging-firebase-adminsdk-xxxxx.json`

### Step 2 — Move the file into the repo

Open PowerShell. Move from Downloads to the repo root:

```powershell
$src = Get-ChildItem "$env:USERPROFILE\Downloads\parbaughs-staging-firebase-adminsdk-*.json" | Select-Object -First 1
Move-Item -Path $src.FullName -Destination "scripts\.service-account.json"
```

### Step 3 — Verify it's gate-protected

The agent's Hook 4 (`gate-protected.sh`) blocks any Edit/Write to
`scripts/.service-account.json`. Confirm:

```powershell
git status scripts/.service-account.json
```

Expected: file is UNTRACKED + gitignored. The hook ensures no agent
can modify or commit it.

### Step 4 — Verify connection works

```powershell
node scripts/verify-firestore-agent-access.mjs
```

Expected: `PASS — connected to parbaughs-staging Firestore, can read + write _ping doc`.

Done.

---

## Option A — Custom IAM role (8 min, most locked-down)

If you want to grant ONLY Firestore access (no Auth Admin, no Storage
Admin, no other Firebase services), use this option.

### Step 1 — Create the service account

1. Open <https://console.cloud.google.com/iam-admin/serviceaccounts?project=parbaughs-staging>
2. Click **+ Create Service Account** at top
3. **Name:** `agent-firestore-rw`
4. **ID:** `agent-firestore-rw` (auto-fills)
5. **Description:** `Firestore-only access for Claude Code agent —
   staging only, no other resources`
6. Click **Create and Continue**

### Step 2 — Grant ONLY datastore.user role

7. **Role:** scroll/search for **Cloud Datastore User**
   (`roles/datastore.user`)
8. Click **Continue**
9. Skip the "Grant users access" step → **Done**

### Step 3 — Generate key

10. Find the new service account in the list, click its email
11. Go to **Keys** tab
12. **Add key → Create new key → JSON → Create**
13. JSON downloads

### Step 4 — Move + verify (same as Option B Steps 2-4)

Move the JSON to `scripts/.service-account.json` + verify with
`node scripts/verify-firestore-agent-access.mjs`.

---

## What the agent will do with this access

The agent will use this credential ONLY for:

1. **State verification at write-time** — after writing data via the
   app code, agent reads back via firebase-admin to confirm the
   write landed. Closes the evidence-supported-test-on-both-ends
   loop (no more "I wrote it, did it land?").

2. **Seed data for staging** — instead of relying on the local
   emulator (which the agent has trouble keeping alive across
   capture cycles), agent seeds staging Firestore directly with
   test data, then captures screenshots of staging URL with that
   real data.

3. **Audit cross-collection consistency** — round writes that span
   multiple collections (rounds + members + leagues + activity feed)
   can be verified across all four via direct queries instead of
   inferring from the rendered UI.

What the agent will NOT do:

- Touch production Firestore (parbaughs project). The service account
  is scoped to parbaughs-staging.
- Modify Firestore rules (still gate-protected per AMD-018 #2).
- Deploy Cloud Functions (still gate-protected per AMD-018 #1).
- Read/write member auth providers.

---

## Rotation procedure (if key ever leaks)

1. Open the service account page (Cloud Console or Firebase Console)
2. Find the existing key under **Keys** tab
3. Click **Delete** → confirm
4. Generate a new key via the same flow (Option B Step 1 OR Option A
   Step 3)
5. Replace `scripts/.service-account.json` with the new file
6. Re-run `node scripts/verify-firestore-agent-access.mjs`

The old key stops working immediately on deletion. No downstream
config update needed because the agent reads the file at use-time.

---

## Security note

The file `scripts/.service-account.json` is:

- **Gitignored** by default (`.gitignore` excludes `scripts/.service-account*`)
- **Gate-protected** by `.claude/hooks/gate-protected.sh` (any agent
  Edit/Write to this path is BLOCKED at the hook level — Founder must
  approve)
- **Excluded from dist/** bundles (Vite only bundles `src/` + `public/`;
  `scripts/` is never shipped to clients)

The blast radius if leaked: someone with the JSON can read/write
staging Firestore. That's it — no production, no auth, no Functions.
Staging contains only test fixtures + agent scratch data.

---

## Done conditions

- [ ] Service account key generated (Option A or B)
- [ ] File saved to `scripts/.service-account.json`
- [ ] `node scripts/verify-firestore-agent-access.mjs` returns PASS
- [ ] git status shows the file as ignored (NOT tracked)

Tell next session "firestore-agent-access set; scan for it" and the
agent re-verifies + starts using the credential for direct Firestore
operations.
