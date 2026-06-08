---
{
  "id": "PROP-015",
  "title": "Harden round-trip ship-gate: retry the flaky scroll-reachability check + fix the no-op rollback target list",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-31T18:10:00Z",
  "rationale": "During the 2026-05-31 overnight heartbeat, scripts/regen-all.ps1 round-trip gate FAILED on run 1 (scroll-reachability: escalations applied list, '#applied-list > *:last-child' not found) then PASSED on an immediate standalone re-run AND on a second gated run — same git tree, no source change. A throwaway Playwright diagnostic loaded the identical on-disk escalations.html and found #applied-list correctly populated with 3 <article> cards, 0 console errors, 0 page errors. Conclusion: the failure was a transient timing flake in a Playwright behavioral check, NOT a dashboard defect. The gate runs verify-scroll-reachability.mjs as a single subprocess with NO retry (tests/round-trip-test.py:1806, timeout=180), so one flake across 5 surfaces fails the whole gate, triggers rollback, and exits non-zero. In a cron cycle this spuriously aborts the heartbeat and rolls back 8 correct dashboards. SECONDARY: the rollback list in regen-all.ps1:100-106 targets 8 files (dashboard/activity/proposals/amendments/discussion-bubbles/index/main-flows/token-usage.html) that are ALL gitignored/untracked (verified: git check-ignore matches docs/reports/dashboard.html; git ls-files --error-unmatch fails for all 8), so 'git checkout HEAD -- <file>' errors with 'pathspec did not match' and rolls back nothing; meanwhile docs/reports/app-health.html — the ONLY tracked dashboard — is NOT in the rollback list, so a genuinely bad app-health regen would survive a gate failure. The rollback gives false reassurance and emits error spam.",
  "scope": "Two small, independent, revertible edits in the round-trip ship-gate, both in tooling (no member-facing surface, no AMD-018 gated touch point): (A) FLAKE RESILIENCE — add a bounded render-readiness wait + single retry to the per-surface check in scripts/visual-audit/verify-scroll-reachability.mjs: before counting the last-item selector, poll up to ~3s (e.g. page.waitForFunction on document.querySelector(lastItemSelector)) so the fixed 1500ms+300ms sleeps are not the sole guarantee; if a surface fails, re-check it once in a fresh context before recording FAIL. This keeps a true regression failing (it fails both attempts) while absorbing single-frame timing flakes. (B) ROLLBACK CORRECTNESS — fix regen-all.ps1:100-106 so the rollback only attempts files that are actually git-tracked (guard each path with `git ls-files --error-unmatch` before `git checkout HEAD --`, skip + log untracked ones instead of erroring), AND add docs/reports/app-health.html (the one tracked dashboard) to the protected set so a bad app-health regen is the thing actually rolled back. Net: the gate stops emitting pathspec errors on gitignored files and starts protecting the file that the gitignore policy actually version-controls.",
  "estimate": {
    "cost_tokens": 6000,
    "duration_minutes": 25,
    "risk": "low",
    "loc_estimate": 45
  },
  "files_affected": [
    "scripts/visual-audit/verify-scroll-reachability.mjs (per-surface readiness wait + single retry)",
    "scripts/regen-all.ps1 (rollback list: tracked-only guard + add app-health.html)",
    ".claude/state/proposals/pending/PROP-015-round-trip-gate-flake-and-rollback.md (this file)"
  ],
  "fallback_plan": "Plan A (recommended): both edits A+B. Plan B: edit A only (retry the flake) — lowest-risk, directly stops the spurious cron aborts; defer the rollback fix. Plan C: edit B only — fixes the false-reassurance rollback but leaves the flake able to abort cycles. Plan D (status quo, rejected): do nothing — the gate will keep flake-aborting heartbeats (~1-in-3 observed this cycle) and its rollback will keep no-op-ing on untracked files while leaving the one tracked dashboard unprotected.",
  "rollback_strategy": "git revert of the two-file diff. Both files are local tooling; no remote dependency, no deploy, no AMD-018 surface. If the retry masks a real regression, the verify-scroll-reachability.mjs change is independently revertible without touching regen-all.ps1.",
  "round_trip_coverage": "This proposal IMPROVES the round-trip gate itself. Verification on apply: run scripts/regen-all.ps1 5x consecutively and confirm 0 spurious scroll-reachability failures; then artificially break one surface (rename a list element id) and confirm the retry still reports FAIL (true negatives preserved); then trigger a gate failure and confirm app-health.html is restored to HEAD and no 'pathspec did not match' errors are printed.",
  "depends_on": [],
  "authored_by": "claude-code",
  "bubble_of_record": "overnight-2026-05-31-round-trip-flake",
  "estimate_tokens_to_apply": 6000,
  "token_cost_estimate": {
    "low": 4000,
    "expected": 6000,
    "high": 9000,
    "methodology": "Derived from the two-file diff scope (~45 LoC: verify-scroll-reachability.mjs readiness-wait + single-retry; regen-all.ps1 tracked-only rollback guard + app-health.html addition) plus the round_trip_coverage acceptance protocol (5 consecutive regen-all.ps1 runs for flake-absorption evidence, one deliberate list-id break to confirm true-negative preservation, one forced gate-failure to confirm app-health.html rollback). Low = clean apply with minimal re-runs; expected matches the original 6000-token point estimate with full prescribed verification; high adds flake re-runs and the rollback failure-path exercise."
  },
  "status": "shipped",
  "shipped_at": "2026-06-07T17:37:00Z",
  "shipped_in_commit": "35eec381",
  "shipped_note": "shipped_in_commit backfilled 2026-06-08 overnight cycle to satisfy round-trip immutability contract § 3 rule 5 (lifecycle:shipped-fields requires both shipped_at AND shipped_in_commit; round-trip-test.py:970-975). Value 35eec381 is the literal ship commit ('fix(gate): PROP-015 round-trip gate flake-retry + rollback correctness', 2026-06-07T17:40:33Z) that landed both code edits (regen-all.ps1 +23, verify-scroll-reachability.mjs +29) and set status:shipped/shipped_at — the field was omitted at ship time because a commit cannot self-reference its own hash. Same backfill pattern as PROP-006 + PROP-010 + PROP-011.",
  "applied_by": "claude-code",
  "evidence": {
    "flake_run_1": "scripts/regen-all.ps1 gated run ~17:0x — round-trip FAIL, scroll-reachability exit 1, 'escalations applied list: last item #applied-list > *:last-child not found'",
    "flake_run_2_standalone": "node scripts/visual-audit/verify-scroll-reachability.mjs — 5 pass / 0 fail / 0 skip; escalations last-item rect top=125 bottom=1040 fully-visible=true",
    "flake_run_3_gated": "scripts/regen-all.ps1 — '=== ALL CHECKS PASSED ===' + round-trip PASS, ALL DASHBOARDS REGENERATED at 2026-05-31T18:06:07Z",
    "render_diagnostic": "Playwright load of on-disk escalations.html: #applied-list childCount=3 (3 ARTICLE cards), 0 console errors, 0 pageerrors, innerHTMLLen=12895 — surface renders correctly",
    "rollback_untracked": "git ls-files --error-unmatch fails for all 8 rollback-list files; git check-ignore matches docs/reports/dashboard.html; only docs/reports/app-health.html is tracked and it is absent from regen-all.ps1:100-106 rollback list"
  }
}
---

# PROP-015 — Harden the round-trip ship-gate (flake retry + rollback correctness)

> **SHIPPED 2026-06-07 by claude-code.** Approved via the `pending/`→`approved/`
> decision step (commit `728a114c`), then applied per the Founder APPROVE/DENY
> model ("approved and then completed by you"). The authoring-time "do not
> self-apply, surface to Founder" note in the deliberation below is therefore
> superseded — the surface-and-approve step already happened. Both edits landed;
> verified per `round_trip_coverage`: scroll-reachability run 5× consecutively
> (0 spurious failures), a deliberately broken selector still FAILed both
> attempts (true-negatives preserved, exit 1), the rollback loop skipped all 8
> untracked dashboards with no `pathspec` errors and restored the one tracked
> dashboard (`app-health.html`), and the full `regen-all.ps1` gate passed green
> end-to-end (round-trip ALL CHECKS PASSED).

Authored 2026-05-31 during the overnight heartbeat run. Both findings are evidence-backed (see the `evidence` block in the frontmatter); neither is a speculative "refactor for code health."

## Finding A — the scroll-reachability check is flaky and has no retry

`scripts/regen-all.ps1` gates success on `tests/round-trip-test.py`, which runs `scripts/visual-audit/verify-scroll-reachability.mjs` as a single subprocess (round-trip-test.py:1806, `timeout=180`, no retry). The check launches Chromium and, for each of 5 dashboard surfaces, opens `<details>`, waits a fixed `1500ms + 300ms`, then counts the last-item selector.

This cycle it failed **once** and passed **twice** on identical inputs:

| Run | Mode | Result |
|---|---|---|
| 1 | gated (regen-all) | **FAIL** — `escalations applied list: '#applied-list > *:last-child' not found` |
| 2 | standalone mjs | PASS — 5/5, escalations last item fully visible (rect top=125, bottom=1040) |
| 3 | gated (regen-all) | PASS — ALL CHECKS PASSED, round-trip PASS |

A throwaway Playwright diagnostic loaded the **same on-disk** `escalations.html` and found `#applied-list` populated with **3 `<article>` cards, 0 console errors, 0 page errors**. The data is correct too: the inlined `#report-data` JSON carries `applied: 3` (ESC-001/002/003) and the `escalations` data guard independently reports `applied=3`. So the surface is genuinely correct — run 1 was a transient timing flake (Chromium render/layout not settled when the fixed sleep elapsed).

**Cost:** because the gate has no retry, one flake across any of 5 surfaces fails the whole round-trip, rolls back the dashboards, and exits non-zero (exit 2). In a cron cycle that spuriously aborts the heartbeat — exactly what happened to run 1 this cycle before the re-run recovered it.

**Fix (A):** add a bounded readiness wait (`page.waitForFunction` for the last-item selector, ~3s cap) so the fixed sleeps aren't the sole guarantee, plus a single per-surface retry in a fresh context. A true regression fails both attempts and still reports FAIL; a single-frame flake is absorbed.

## Finding B — the gate's rollback targets untracked files and omits the tracked one

On round-trip failure, `regen-all.ps1:100-106` rolls back 8 files via `git checkout HEAD -- <file>`. **All 8 are gitignored/untracked** (`git check-ignore` matches `docs/reports/dashboard.html`; `git ls-files --error-unmatch` fails for all 8), which is intentional — the dashboards are regenerated locally, not committed (per the dashboard-is-production-direct policy). So every `git checkout HEAD --` in the rollback loop errors with `pathspec 'docs/reports/dashboard.html' did not match any file(s) known to git` and rolls back **nothing**.

Meanwhile `docs/reports/app-health.html` is the **only tracked** dashboard (the cron `post-commit dashboard regen` commits it), and it is **not in the rollback list**. So if a regen genuinely corrupted `app-health.html`, a gate failure would leave the bad version on disk while printing reassuring "rollback" output.

**Fix (B):** guard each rollback path with `git ls-files --error-unmatch` (skip + log untracked instead of erroring) and add `docs/reports/app-health.html` to the protected set. Net: no more pathspec error spam, and the rollback actually protects the file the gitignore policy version-controls.

## Why a proposal and not a self-applied fix

`verify-scroll-reachability.mjs` and `regen-all.ps1` are part of the ship-close round-trip **gate**. Modifying a gate crosses into Founder-decision territory (a too-aggressive retry could mask real regressions). Per PARBAUGHS governance the conservative move is to author the proposal and let the Founder apply, rather than self-modifying the gate that protects every ship.

## Disposition deliberation (P3e)

- **Engineer:** Real, reproducible non-determinism with a concrete cron-abort cost; fix is small/single-area/revertible. → author.
- **Critic (+ Devil's-Advocate lens):** Checked for fluff — evidence is fail→pass→pass on identical inputs plus a render diagnostic, not invented. Run 1 was a clean sequential gated run (no self-induced concurrency), so the fragility is genuine. Scope it as hardening, don't self-apply. → author, flag Founder.
- **Data-Integrity:** Dashboards are truthful (applied=3 traces to ESC-001/002/003; app-health 88.3→88.8 is the documented rolling-window recovery). The flake is a gate false-negative, not a data error. → proposal OK.

Consensus: author PROP-015, do not self-apply, surface to Founder.
