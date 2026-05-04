# Smoke Test Account

## Why this exists

Smoke automation (`tests/smoke/`) runs against the real Parbaughs Firebase
production environment, not the emulator. To prevent test data from polluting
real members' activity feeds, leaderboards, stats, and notifications, we use a
dedicated hidden test account in a separate league.

## Architecture

- **Test league:** "Smoke Test League" (slug: `smoke-test-league` — to be created)
- **Test account:** `smoke@parbaughs.test` (to be created)
- The test account is the SOLE member of the test league.
- League isolation is enforced by the existing `leagueCollection` / `leagueDoc`
  wrappers — anything the test account writes is automatically scoped to the
  test league and invisible to real members.
- Real production Firebase Auth + Firestore + FCM bridge are exercised end-to-end.

## Security

**⚠ This repo is PUBLIC on GitHub. NEVER commit credentials.**

Defense-in-depth in place as of v8.17.0:

1. **`.gitignore`** — credential-shaped filenames are blocked from being added:
   `.env`, `.env.*`, `serviceAccountKey.json`, `firebase-adminsdk-*.json`,
   `*.pem`, `*.key`, `/tests/smoke/.profiles/`, etc.
2. **`.husky/pre-commit`** — scans staged ADDED lines for credential-shaped
   strings (high-entropy provider tokens + suspicious var-name assignments)
   and blocks the commit on match. Override only via `git commit --no-verify`
   (use rarely + only after confirming false positive).
3. **Audit baseline (v8.17.0):** V1-V6 hardening sweep confirmed zero
   credentials in git history, current tree, or service-account paths.

If credentials are ever suspected leaked: **rotate immediately** — change the
account password, regenerate any tokens, revoke + reissue any service-account
keys. Don't wait.

## Setup on a new development machine

1. Get test account credentials from your password manager (NOT from any
   committed file).
2. Copy the example env file:
   ```sh
   cp .env.example .env.local
   ```
3. Edit `.env.local` with the real credentials:
   ```sh
   SMOKE_EMAIL=smoke@parbaughs.test
   SMOKE_PASSWORD=...
   ```
4. Verify `.env.local` does NOT appear in `git status` (gitignore is working):
   ```sh
   git status .env.local   # → should show nothing
   ```
5. Run the demo scenario to verify auth path works:
   ```sh
   npm run smoke:debug
   ```

## Loading credentials into the smoke runner

The runner reads `SMOKE_EMAIL` + `SMOKE_PASSWORD` from process env. Local-only
options:

- **Inline (per-run):**
  ```sh
  SMOKE_EMAIL=... SMOKE_PASSWORD=... npm run smoke
  ```
- **Shell session (current terminal):**
  ```sh
  export SMOKE_EMAIL=...
  export SMOKE_PASSWORD=...
  npm run smoke
  ```
- **`.env.local` + a launcher** — for repeat runs without re-typing. Source
  the file in the same shell that runs npm:
  ```sh
  set -a; . ./.env.local; set +a
  npm run smoke
  ```

The runner does NOT auto-load `.env.local` (no `dotenv` dep). Keeping env
loading explicit makes it harder to accidentally leak credentials into a test
or CI environment that wasn't intended.

## Firebase web `apiKey` clarification

The `apiKey: "AIzaSy..."` value in `src/core/firebase.js`,
`public/firebase-messaging-sw.js`, and `legacy.html` is **INTENTIONALLY
PUBLIC**. Firebase web API keys are designed to be public — they identify the
Firebase project but grant no access on their own. Security is enforced by:

- Firestore rules (`firestore.rules`)
- Auth config (email verification, rate limiting, allowed sign-in providers)
- Cloud Function CORS origin locks
- App Check (if enabled in the future)

**Do not** try to "fix" this by moving the key to env vars. The Firebase web
SDK requires the key to be in the client to bootstrap. Hiding it gives no
security benefit and breaks deploys.

## What's safe to do with the test account

- Trigger achievements, notifications, mock rounds
- All operations are scoped to the test league via existing isolation wrappers
- Real Firebase backend, real FCM bridge, real auth flow — but isolated from
  real members' surfaces

## What's NOT safe

- Don't manually log in via the real Parbaughs UI as the test account for
  casual use — keep it dedicated for automation.
- Don't share credentials in any committed file (Slack DM with self is fine,
  password manager is better).
- Don't add real members to the test league — keeps the dataset clean.
- Don't run smoke against the production app URL (`alrightlad.github.io/...`).
  The runner targets `http://localhost:5173/smoky-mountain-open/` (dev server)
  by default — confirms that what you're testing matches your working tree.

## How to recreate if account/league gets corrupted

1. Sign in as Founder (Zach) on the real app.
2. Go to admin panel → delete the corrupted test league (this also nulls
   the test account's `activeLeague`).
3. Optionally: delete the test account via Firebase Console → Authentication
   → Users.
4. Re-run the test-account-creation procedure (linked from the Ship 5+1
   smoke-setup docs once it lands).
5. Update `.env.local` with new credentials if the password was rotated.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `SMOKE_EMAIL and SMOKE_PASSWORD must be set in the environment` | Env vars not loaded | Run with inline env or source `.env.local` |
| `auth/wrong-password` or `auth/user-not-found` | Credentials drifted from password manager | Update `.env.local`; if persistent, rotate password |
| `auth/network-request-failed` in browser | Dev server not running OR running with `?emulator=1` | `npm run dev`; ensure URL is the production-pointing one |
| `auth/too-many-requests` | Rate-limited by Firebase Auth | Wait ~5 min; rerun |
| Test runs leak data into real league | `currentProfile.activeLeague` doesn't equal test league after login | Confirm test account is sole member of test league + activeLeague is set |

## Related docs

- `tests/smoke/run.js` — runner entry, env var docs in header
- `.gitignore` — security patterns at top
- `.husky/pre-commit` — credential leak scanner
