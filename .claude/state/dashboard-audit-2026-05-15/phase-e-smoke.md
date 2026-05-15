# Phase E — Smoke Test Audit

**Date:** 2026-05-15
**Spec:** dashboard-completion-spec-2026-05-15.md (target: "Full smoke test passes (cross-browser, real Firebase, 12 scenarios) + vision-confirmed final states")

## What runner exists

Two distinct test runners exist in this repo:

### 1. Playwright E2E suite (`npm run test:e2e`)
- **Runner:** `playwright test` against `tests/e2e/flows/*.spec.js`
- **Location:** `tests/e2e/`
- **Scenarios:** 6 spec files (44+ tests per CLAUDE.md): `01-all-users-baseline`, `02-founding-four-regression`, `03-scenario-coverage`, `04-ui-layout-regression`, `05-xp-freshness`, `06-notifications-v8-17-0`
- **Backend:** Firebase emulator (Firestore + Auth on localhost). Requires `npm run emulator:start` + `npm run emulator:seed` before run
- **Fixtures:** `tests/e2e/setup/fixtures/` — synthetic users, rounds, leagues
- **App connects via:** `?emulator=1` URL param. Without it, the app talks to production Firebase
- **Auth:** Custom-token mint helper in `tests/e2e/helpers/auth.js`

### 2. Cross-browser smoke runner (`npm run smoke` / `npm run smoke:full`)
- **Runner:** Custom Node script `tests/smoke/run.js` (Playwright headless API)
- **Location:** `tests/smoke/`
- **Scenarios:** **26 registered** in `tests/smoke/scenarios/index.js` (s1 through s26, s11 last per registry comment because it logs out)
- **Backend:** Real Firebase production project — uses the `smoke@parbaughs.test` account (credentials in `.env.local`)
- **Browsers supported:** chromium, firefox, webkit, webkit-mobile (iPhone 14 Pro device profile via Playwright `devices`)
- **NPM scripts:**
  - `npm run smoke` — chromium only, headless
  - `npm run smoke:full` — all 4 browsers (`cross-env BROWSERS=chromium,firefox,webkit,webkit-mobile`)
  - `npm run smoke:headed` — chromium, visible
  - `npm run smoke:debug` — chromium, visible, slowmo, devtools
- **Prerequisite:** Vite dev server on `http://localhost:5173/smoky-mountain-open/` (overridable via `DEV_URL` env var)

The spec says "12 scenarios × 4 browsers." This phrase maps to the **smoke runner**, NOT the e2e Playwright suite. The smoke runner is the cross-browser path.

## What I observed

### Quick chromium smoke probe
Ran `npm run smoke` (chromium-only, headless). Output:
```
SMOKE RUNNER
  browsers: chromium
  scenarios: 26
ERROR: dev server not reachable at http://localhost:5173/smoky-mountain-open/
  Start it in another terminal:  npm run dev
EXIT_CODE=0
```

The runner exits cleanly (exit code 0) with an explicit error message when the dev server is down. It does NOT auto-spawn Vite. **Vite is not currently running in this session** — only the `localhost:8765` dashboard static server (different port, different content).

### Credentials
- `.env.local` is present and contains both `SMOKE_EMAIL` and `SMOKE_PASSWORD` (2 matches via grep)
- Smoke test account documentation: `docs/SMOKE_TEST_ACCOUNT.md`

### Playwright browser install
Installed under `C:\Users\Zach\AppData\Local\ms-playwright`:
- `chromium-1223`, `chromium_headless_shell-1223` — installed
- `firefox-1522` — installed
- `ffmpeg-1011` — installed (for video capture)
- **No `webkit-*` directory present**

**This is the gap for cross-browser execution.** WebKit is not currently installed locally, so `npm run smoke:full` would fail on the webkit + webkit-mobile launches. The remediation is `npx playwright install webkit`.

## Scenario inventory (the 26 vs spec's "12")

The spec's target of "12 scenarios" is **stale** — it was likely written against an earlier scenario count. The current registry has 26:

| ID | Name | Notes |
|----|------|-------|
| s1 | auth | login flow |
| s2 | listener | |
| s3 | panel-render | |
| s4 | v6-nav-fix | |
| s5 | legacy-linkpage | |
| s6 | params-forwarding | |
| s7 | readat | |
| s8 | scrollback | |
| s9 | mark-read-promotion | |
| s10 | dismiss-delete | |
| s12 | spectator-nonregression | |
| s13 | feed-action-row | v8.20.0 (Ship 5+5) |
| s14 | feed-kudos-persistence | |
| s15 | feed-comment-persistence | |
| s16 | hq-home-action-row | |
| s17 | hq-home-state-activity-clickable | |
| s18 | hq-greeting-hero | v8.21.0 (Ship 5+6 Phase 7) |
| s19 | hq-stats-strip-alignment | |
| s20 | hq-stats-last-30d | |
| s21 | masthead-league-chip | |
| s22 | hq-handicap-chart | |
| s23 | hq-engagement-no-rerender | |
| s24 | rounds-page-dispatch | v8.22.0 (Ship 5+7) |
| s25 | manage-section-tiers | |
| s26 | rounds-ship-5-7-e2e | B.44 + Edit + Delete |
| s11 | logout-cleanup | **MUST be last** per registry comment |

Net: 26 scenarios are wired up. The spec's "12 scenarios" target is **exceeded by surface coverage** — but only chromium has been the regular execution path. The "× 4 browsers" axis is the unmet half.

## What it would take to get to spec compliance ("12 scenarios × 4 browsers")

Translating the spec to current reality ("26 scenarios × 4 browsers"):

1. **Install webkit:** `npx playwright install webkit` — one-time, ~150 MB. Adds webkit + webkit-mobile (uses same engine binary).
2. **Start Vite dev server:** `npm run dev` in a separate shell. Smoke runner probes `http://localhost:5173/smoky-mountain-open/` via HEAD before launching browsers.
3. **Verify .env.local credentials still valid:** `smoke@parbaughs.test` against real Firebase. (Credentials are in place; password rotation status not verified by this phase.)
4. **Run:** `npm run smoke:full` — executes 26 × 4 = 104 scenario-browser pairs sequentially.
5. **Wall time estimate:** Currently a single browser passes ~26 scenarios in roughly 5-15 minutes against a warm dev server; full 4-browser run is plausibly 20-60 minutes.
6. **Vision verification gate (V1 of spec):** spec requires reading rendered PNGs and translating to plain English. Smoke output structure (under `tests/smoke/output/`) writes per-scenario captures via `helpers/capture.js`. Each PNG would need a Read-tool inspection step to satisfy V1.

### Known fragility (from MEMORY.md)
- **B.43:** webkit-only timing flakes are documented as intermittent on mobile + (since Ship 5+7) desktop. Expect 1-3 webkit flake retries.
- **B.46 + B.47:** captured alongside B.43 in Ship 5+7. Not detailed in this phase audit.

## Recommended path forward

**Two-step staged approach, escalating per smoke risk:**

### Step 1 — single-browser smoke baseline (low cost)
- Start Vite (`npm run dev` in a separate shell)
- Run `npm run smoke` (chromium-only, 26 scenarios)
- Confirm green baseline before adding browser axes
- Wall time: ~5-15 minutes
- Risk: zero — this is the daily-driver path

### Step 2 — full cross-browser (spec target)
- `npx playwright install webkit`
- `npm run smoke:full`
- Wall time: ~20-60 minutes
- Risk: 1-3 webkit flake retries per B.43; firefox known-good per recent ships
- Vision verification of each scenario's terminal PNG required to satisfy V1 of the dashboard-completion spec

### Step 3 — wire smoke into the spec's "12 scenarios" target language
- Decide: rename spec's target to "26 scenarios × 4 browsers" (more accurate), OR
- Decide: select a 12-scenario "smoke-fast" subset for CI/cron, keep 26 for ship-gate
- This is a Founder/Claude.ai decision, not Claude Code

## Verdict for Phase E

**PARTIAL — runner exists, scenarios exceed spec target, but cross-browser axis blocked by missing webkit install + dev server not running.**

- Runner: PRESENT (two: e2e + smoke)
- Scenario count: 26 (spec asks 12, surface coverage exceeds it)
- Cross-browser readiness: **BLOCKED** — webkit binary not installed; would silently fail on `smoke:full`
- Dev server: **BLOCKED in this session** — port 5173 not listening
- Credentials: PRESENT in `.env.local`
- Vision verification (V1): not yet integrated into smoke output pipeline; PNGs are written but no read-back loop exists

No regressions observed. No scenarios executed in this phase (dev server gating). Recommendation: get Step 1 green in a follow-on phase before reaching for `smoke:full`.
