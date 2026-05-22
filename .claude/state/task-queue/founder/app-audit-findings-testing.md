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

### CRITICAL — Smoke baseline 54 failures — ROOT CAUSE FOUND 2026-05-22

**Status:** primary cause identified + diagnosed; load-bearing fix surfaced
to Founder via `csp-emulator-allowance.md` (CSP `connect-src` does NOT
allow loopback emulator endpoints). Awaiting Founder approval.

**Root cause (verified by Playwright trace inspection 2026-05-22):**
Browser blocks the auth.signInWithCustomToken() fetch at CSP-enforce
time. Console error (extracted from `0-trace.trace`):

```
Connecting to 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/...'
violates the following Content Security Policy directive:
"connect-src 'self' https://*.googleapis.com ... wss://*.firebaseio.com"
```

The auth/network-request-failed Firebase SDK error message is downstream
of CSP block. No HTTP request ever leaves the browser; the network trace
shows ZERO requests to `:9099` (proof).

Earlier hypothesis (auth emulator port mismatch) was a real but
SECONDARY problem. Two fixes applied this session:

1. **(committed)** `tests/e2e/helpers/auth.js` + `tests/e2e/setup/seed-baseline.js`
   + `tests/e2e/setup/global-setup.js` — env vars changed from
   `localhost:9099` to `127.0.0.1:9099` (Node 20+ on Windows resolves
   localhost to ::1 IPv6; auth emulator binds 127.0.0.1 IPv4-only).
   Confirmed via Playwright run: seed phase now passes ("[seed] Seeded
   26 users, 55 rounds, 2 leagues, 8 notifications") whereas before it
   would have used a path that fell through.

2. **(surfaced — not yet committed)** Add loopback emulator endpoints
   + `https://apis.google.com` to CSP in `index.html`. Full proposal +
   risk analysis in `csp-emulator-allowance.md`. ~30s for Founder to
   approve; next session applies + re-runs smoke.

Hypothesis 4 (Node 24 vs Node 22) is NOT load-bearing — firebase
emulator runs on Java, not Node, so the Node-version warning is
informational only. Confirmed not relevant.

- **OWNER:** Goal 2 A11 — Founder-approval gate at `csp-emulator-allowance.md`.

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
