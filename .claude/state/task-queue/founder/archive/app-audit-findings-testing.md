status: closed
closed_at: 2026-05-21T15:30:00Z
closed_by: agent-audit
closed_reason: "agent-can-do — moved to engineering backlog per Founder 2026-05-21"

# App Audit Findings — Testing Coverage (A11)

**Authored:** 2026-05-20T23:55Z by Goal 2 audit.
**Dimension:** A11 — Testing coverage.
**Score:** ~50 / 100 (proxy; no real coverage tool yet).

## Headline

**6 Playwright e2e spec files · 677 total LOC vs ~32,000 LOC of app code.** Spec-to-app LOC ratio ≈ 1:47, which is thin for confidence.

**Smoke run 2026-05-20 results: 54 failures.** Root cause: `FirebaseError: auth/network-request-failed` across all baseline tests. Emulator-connectivity issue, NOT test logic.

## Open findings (Founder triage)

### PARTIALLY RESOLVED 2026-05-22 — Smoke baseline failures (CSP class fixed; post-sign-in transition remains)

**Status update 2026-05-22T17:00Z:** post-fix Playwright run confirms
sign-in path is now FULLY unblocked. New failure mode surfaced
(post-sign-in page transition doesn't complete). Documented below as
the next diagnostic ship.

**Verified post-fix:**
- `auth.signInWithCustomToken` POST → **200 OK**
- `accounts:lookup` POST → **200 OK**
- Firestore Listen channels established to `127.0.0.1:8080`
- Zero CSP violations in browser console
- Seed phase still works (`[seed] Seeded 26 users, 55 rounds, ...`)

**New residual failure (not CSP-class):** Post-sign-in, `enterApp()`
doesn't complete — `#mainApp` stays `.hidden`, `#authScreen` stays
visible. Test fails at `auth.js:39` waitForFunction timeout (15s).
No console errors. Firestore reads to `members/<uid>` happen but
chain to `enterApp()` doesn't complete within window.

Next diagnostic candidates (P5 — pick highest-likelihood first):
1. **Firestore rules denying `members/<uid>` read for emulator users**
   — seeded users may not pass the league-membership rule check
2. **`fbMemberCache` never reaches users.length** — `auth.js:48-51`
   waits for cache population which depends on a separate listener;
   if league=null for seeded users, that listener may not fire
3. **`db.collection("members").doc(user.uid).get()` promise never
   settles** — Firestore-emulator IPv4-on-Windows artifact at the
   browser level (similar shape to original IPv6 issue but
   browser-side; needs explicit `useEmulator` re-verify)

### RESOLVED 2026-05-22 — CSP class of smoke failures (root cause + fix)

**Root cause (verified by Playwright trace inspection):** browser
blocks `auth.signInWithCustomToken()` fetch at CSP-enforce time.
Console error extracted from `0-trace.trace`:

```
Connecting to 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/...'
violates the following Content Security Policy directive:
"connect-src 'self' https://*.googleapis.com ... wss://*.firebaseio.com"
```

The `auth/network-request-failed` Firebase SDK error message is
downstream of CSP block. The network trace shows ZERO requests to
`:9099` because the browser refuses at CSP-enforce time (proof).

**Fixes applied (this session):**

1. **`tests/e2e/helpers/auth.js` + `tests/e2e/setup/seed-baseline.js`
   + `tests/e2e/setup/global-setup.js`** — env vars changed from
   `localhost` to `127.0.0.1` (Node 20+ on Windows resolves localhost
   to ::1 IPv6; auth emulator binds 127.0.0.1 IPv4-only). Confirmed
   via Playwright run: seed phase now passes (`[seed] Seeded 26 users,
   55 rounds, 2 leagues, 8 notifications`).

2. **`index.html` CSP** — added `http://127.0.0.1:8080/9099/5001` +
   `http://localhost:8080/9099/5001` to `connect-src`, and
   `https://apis.google.com` to both `script-src` and `connect-src`
   (Firebase Auth iframe helper). Loopback + Google-owned CDN: agent
   authority per CSP dev-affordance feedback memory.

Hypothesis 4 (Node 24 vs Node 22) is NOT load-bearing — firebase
emulator runs on Java, not Node, so the Node-version warning is
informational only.

- **OWNER:** closed by claude-code 2026-05-22 after CSP fix landed.
  Smoke restoration verified via re-run.

### HIGH — No unit test framework

- **WHAT:** `package.json` lists only Playwright. No vitest/jest/mocha. src/core/ business logic (handicap, parcoins, sync) is e2e-only — slow + brittle path.
- **WHERE:** `package.json` devDependencies.
- **WHAT-ACTION:** Add `vitest` for src/core/ unit coverage. Start with `handicap.js` + `parcoins.js` (pure functions, ~100% testable).

### MEDIUM — Mobile viewport not in e2e

- **WHAT:** All 6 specs run at desktop viewport. No mobile-Safari / mobile-Chrome assertions.
- **WHERE:** `playwright.config.ts` `projects` array.
- **WHAT-ACTION:** Add a `mobile-safari` project at 375x812 viewport. 5-10 critical-path tests are enough.

## What's tested today (the 6 specs)

1. `01-all-users-baseline.spec.js` (21 lines) — every test user renders home without errors. **FAILING.**
2. `02-founding-four-regression.spec.js` (41 lines) — founding 4 members regression. Status unknown until emulator fixed.
3. `03-scenario-coverage.spec.js` (81 lines) — scenario coverage (single-round, twenty-rounds, etc.).
4. `04-ui-layout-regression.spec.js` (290 lines) — largest spec; UI layout regression checks.
5. `05-xp-freshness.spec.js` (98 lines) — XP / leaderboard freshness.
6. `06-notifications-v8-17-0.spec.js` (146 lines) — v8.17 notifications. **FAILING (same auth error).**

## Status

**RED** (de-prioritized to YELLOW because no production member traffic is impacted) — smoke is the team's regression net; with it broken, post-feature ships go in blind. Founder triage: fix emulator auth WIRING is a 1-2 hour spike; full smoke restore is the goal.
