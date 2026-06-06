# E2E full-sweep evidence — 2026-06-06

Backs: closure of #187 (W1-W4 verified, no regression) and the production-push
gate for #269 (staging→origin/main cutover).

## Result: GREEN

Full 3-project Playwright sweep, per-project reseed (fresh emulator data each
batch, the #221 per-batch-recycle approximation). Raw log:
`.pw-sweep-2026-06-06.log` (read in full, not just exit code, per the
prod-push gate: "even 1 flaky violates the gate, so the LOG must be read").

| Project | Result | Passed | Skipped | Failed | Flaky | Wall |
|---|---|---:|---:|---:|---:|---|
| chromium | EXIT=0 | 66 | 1 | 0 | 0 | 2.0m |
| iphone-14 | EXIT=0 | 56 | 11 | 0 | 0 | 3.1m |
| pixel-7 | EXIT=0 | 56 | 11 | 0 | 0 | 2.0m |
| **Total** | **all 0** | **178** | **23** | **0** | **0** | ~7m |

- **0 failed, 0 flaky** across all three viewport projects.
- Log parsed for failure AND retry/flaky signatures (`flaky`, `✘`, `failed`,
  `retry #`, `Test timeout`, `Killed`, `interrupted`): **none found.**
- The `permission-denied @ L537` console lines are the known-benign
  notification snapshot-listener noise on the logout/spectator path; tests
  pass directly through them (same as every prior green sweep).

## The 23 skips are all deliberate `test.skip`, not dropped tests

- `04-ui-layout-regression.spec.js:225` "Online Now level badge" — skipped on
  **all three** projects (universal `test.skip`, not viewport-related).
- `08-drawer-a11y.spec.js` (5 tests, BL-008 band-aware ARIA) — skipped on
  iphone-14 + pixel-7 only; **ran and passed on chromium** (log lines 58-62).
  Desktop nav-rail semantics don't apply at mobile widths.
- `09-playnow-hole-edit.spec.js` (5 tests, BL-001 live-scoring hole edit) —
  skipped on mobile; **ran and passed on chromium** (log lines 63-67).
  Desktop-viewport-gated.

Math: 67 tests/project. chromium 66+1, iphone-14 56+11, pixel-7 56+11. Every
mobile-skipped test has desktop coverage that passed.

## What this evidence does and does NOT authorize

- **DOES:** satisfy the E2E condition of the prod-push gate; back #187 closure.
- **Does NOT:** authorize the production push itself. `origin/main` is frozen
  by `.claude/hooks/push-protection.sh`; opening it (`CLAUDE_PARBAUGHS_FOUNDER_PUSH=1`)
  is the Founder's irreducible bootstrap act (Gate 3). Smoke + visual sweeps
  and the in-flight compliance items are the remaining cadence preconditions
  per the 2026-05-30 `production-autonomy-scope-and-cadence` decision.
