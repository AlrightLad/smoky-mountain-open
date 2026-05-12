---
name: parbaughs-smoke-failure-triage
description: Smoke failure severity tagging (P0/P1/P2/P3) + response path. Real-Firebase smoke against smoke@parbaughs.test; B.43 family known-flake exception; visual verification failures route to Sanity Halt category 9.
trigger: Smoke run produces failures; or smoke result-matrix shows a regression vs. last green
owner: Engineer (triage), Critic (verify), Orchestrator (escalate per severity)
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-smoke-failure-triage

How to classify a smoke failure and route to the right resolution path.

## When to invoke

- `npm run smoke` or `npm run smoke:full` produces a non-zero exit
- A scenario passes on chromium but fails on firefox/webkit/webkit-mobile (cross-browser regression suspect)
- Implementation review surfaces a smoke failure not present at audit baseline

## When NOT to invoke

- Smoke setup error (env vars missing, emulator not running) — fix setup first
- Build error (`npm run build` fails) — different skill / different triage
- Pre-existing failure with no recent change — document; don't re-triage every run

## Severity classification

### P0 — Production halt / data loss imminent
- App fails to reach home page after auth (e.g., scenario s1-auth FAIL on all browsers)
- Member-facing writes fail (round submission, profile save, DM send)
- Firestore queries fail with permission errors on routine paths
- Smoke account itself fails to sign in (smoke@parbaughs.test rejected)

**Response:** Founder synchronous; immediate rollback (single-ship); push reverted state; Sanity Halt category 1.

### P1 — Significant member impact, app functional
- Single critical scenario fails on 1+ browser (e.g., notifications panel fails to render after grouping rewrite)
- Layout breakage on specific viewport band (mobile fails, desktop OK)
- Performance regression beyond budget (specific scenario takes 2x baseline)

**Response:** Founder synchronous; roll-forward corrective in interrupt sprint; Sanity Halt category 2 if specific-band, category 9 if visual-verification specifically.

### P2 — Degraded but functional
- Non-critical scenario fails intermittently (1 of 5 runs)
- Specific edge case fails (long member names overflow on profile)
- Visual diff fails on non-critical surface

**Response:** Autonomous corrective in inter-wave sprint; capture to backlog; ratify at retrospective.

### P3 — Minor
- Console log noise (pbWarn entries that didn't exist before)
- Slow scenario passes but takes 20% longer
- Visual diff fails on hover state or other rarely-seen detail

**Response:** Backlog opportunistic; batch with future ship.

## B.43 family exception

`B.43 — webkit-mobile smoke timing fragility` per `project_b43_webkit_mobile_smoke_timing` memory. Recurrent webkit timing flakes (mobile + desktop). NOT Sanity Halt. Procedure:

1. Re-run smoke 2x. If passes on retry, document the run in console log + move on.
2. If fails 3x in a row, escalate to P2 (no longer "flake"; pattern emerging).
3. Always include B.43 reference in any flake report so future Engineers don't re-triage.

## Visual verification failures (per Correction 2)

If failure is specifically visual (screenshot diff vs expected; state coverage gap; cross-browser visual divergence): route to Sanity Halt category 9, not normal smoke triage. Visual verification has its own resolution pattern (see `parbaughs-visual-verification-protocol`).

## Triage procedure

1. **Read the failure.** Open `tests/smoke/output/<ts>/<browser>/results.json` and the failing scenario's `console.log`. Don't guess.

2. **Reproduce locally.** `BROWSERS=<failing-browser> npm run smoke -- --scenario=<id>`. Headed mode if visual: `npm run smoke:headed`.

3. **Classify severity** per above. Concrete evidence (specific scenario, browser, viewport, member impact).

4. **Check baseline.** Did this scenario pass on the prior commit? `git log --oneline` last 5 commits + identify which one introduced the failure.

5. **Route per severity.**
   - P0/P1 — escalate via P3 Sanity Halt → Founder synchronous
   - P2 — Engineer scopes fix in current or next ship; document
   - P3 — backlog item (BL-NNN), batch later

6. **Update last-verify state.** Hook 6 (push protection) reads `.claude/state/last-verify.json`. Failed smoke writes `{smoke: {pass: false, ...}}`. Don't manually flip to pass without re-running.

## Anti-patterns

- "Smoke flaked, try again" without reading the actual failure — masks real regressions
- Triaging without reproducing — failure context matters
- Classifying chromium-only success as pass — cross-browser parity is part of P8
- Skipping last-verify state write — push protection hook can't gate what it can't see

## References

- `docs/agents/PROTOCOLS.md` § P8 (smoke coverage)
- `docs/agents/SANITY_HALT.md` Categories 1, 2, 9
- `docs/agents/PROTOCOLS.md` § P5 (severity tiers)
- `project_b43_webkit_mobile_smoke_timing` memory (B.43 exception)
- `tests/smoke/run.js` (runner; 4 browsers chromium/firefox/webkit/webkit-mobile)
- `docs/SMOKE_TEST_ACCOUNT.md` (smoke account credentials reference)
