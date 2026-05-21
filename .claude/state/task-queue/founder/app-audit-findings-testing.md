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

### CRITICAL — Smoke baseline 54 failures (carries forward from Goal 1 D5)

- **WHAT:** `tests/e2e/flows/01-all-users-baseline.spec.js` and `tests/e2e/flows/06-notifications-v8-17-0-v-*.spec.js` all fail with `FirebaseError: Firebase: A network AuthError (such as timeout, interrupted connection or unreachable host) has occurred. (auth/network-request-failed)`.
- **WHERE:** Test config likely in `playwright.config.ts` + `tests/e2e/_fixtures/`; emulator port config in `firebase.json`.
- **WHAT-ACTION:** Possible root causes (run diagnostic on each):
  1. Auth emulator port mismatch — tests expect `localhost:9099`, emulator running elsewhere
  2. Race between Playwright test launch and emulator readiness — need `await emulator.ready()` in beforeAll
  3. Missing `connectAuthEmulator(auth, "http://127.0.0.1:9099")` call in test fixtures
  4. Node 24 (host) vs Node 22 (functions) mismatch — `firebase.json` requested node 22, emulator falling back to 24
- **OWNER:** Goal 2 A11 follow-on ship.

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
