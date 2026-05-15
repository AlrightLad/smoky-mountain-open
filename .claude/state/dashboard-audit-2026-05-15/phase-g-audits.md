# Phase G — Visual + Structural Audits

**Date:** 2026-05-15
**Scope:** Four automated audit scripts run sequentially, exit codes + output summaries captured honestly.

## Environment note

- Working directory: `C:\Users\Zach\smoky-mountain-open`
- Static dashboard HTTP server on `http://localhost:8765` is up in this session (visual-audit scripts that need it would already be served)
- Vite dev server on `http://localhost:5173` is **not** running (not required for these four scripts — they read local files / hit `localhost:8765`)
- All four scripts ran to completion without infrastructure timeouts

---

## 1. `python tests/round-trip-test.py`

**Exit code:** `1` (FAIL)

**Stdout summary:**

Ran 26+ named check blocks. All passed EXCEPT one:

PASSING checks (representative):
- Seeding (5 handoffs, 3 bubbles, 2 proposals)
- Reading source state (counts match)
- HTML swap of all 4 data-block files
- HTML validity + JSON validity + required-key presence on dashboard, activity, discussion-bubbles, proposals
- Transcript validation (3 bubbles, all tallies match messages)
- Cross-dashboard nav audit (9 dashboards, 9 links each, is-active stamp correct on all)
- main-flows + index production data blocks
- meter-wiring (7 checks pass)
- founder-queue (7 checks pass)
- quota-type-enum
- cross-dash count consistency
- PROPOSAL_LIFECYCLE_v8.2 + AMENDMENTS lifecycle schema validation
- Banner-text data-bound (no hardcoded count)
- design-tokens (CSS clean, 11 canonical tokens present)
- token-usage cross-panel reconciliation
- theme convergence (no raw hex)
- no-charts guard
- protected-layouts sentinels (master/detail + arch grid + design system + W1.S1 primitives all intact)
- proposal-readiness scanner
- install-scripts parseability (6 scripts)
- install-cmd-surface execution-context handling
- scroll-reachability (5 pass / 0 fail)
- escalations lifecycle
- quota-status schema
- pause-discipline (no fictional-cap refs in prod)
- wiring (CSS classes + dropdown options for all 5 scenario tokens)

**The single failure:**

```
[user-context-gate]
  X user-context-gate  main-flows.html: modified 1262.9 min after most recent
    user-context capture (2026-05-14T23-07-48Z) — Founder runs
    `node scripts/visual-audit/founder-context-capture.mjs` to seed fresh capture
    before ship-close

=== 1 FAILURE(S) ===
  - user-context-gate: 1 surface(s) modified after last capture
```

**Root cause:** `main-flows.html` has been modified ~21 hours after the last Founder-context capture (timestamp `2026-05-14T23-07-48Z`). The gate is a freshness check: user-facing surfaces edited after the most recent capture imply the screenshot baseline is stale. This is not a regression — it's a process gate signaling that `founder-context-capture.mjs` needs to be re-run before ship-close.

**Verdict:** **FAIL (single gate failure, intentional staleness signal)** — not a code regression. Remediation = run `node scripts/visual-audit/founder-context-capture.mjs` to refresh capture. The other 25+ checks all pass.

---

## 2. `node scripts/visual-audit/verify-scroll-reachability.mjs`

**Exit code:** `0` (PASS)

**Stdout summary:**

```
[scroll-reachability] 5 pass / 0 fail / 0 skip
  [PASS] main-flows rail (62 flows)
         last-item rect: top=715 bottom=745 (viewport h=1080); fully-visible=true
  [PASS] dashboard recent ships table
         last-item rect: top=1005 bottom=1040 (viewport h=1080); fully-visible=true
  [PASS] amendments applied list
         last-item rect: top=641 bottom=1040 (viewport h=1080); fully-visible=true
  [PASS] proposals shipped list
         last-item rect: top=932 bottom=1040 (viewport h=1080); fully-visible=true
  [PASS] escalations applied list
         last-item rect: top=78 bottom=1040 (viewport h=1080); fully-visible=true

[scroll-reachability] OK: all required surfaces pass
```

Every scrollable list's last item is reachable AND fully visible inside the 1080px viewport. PNG evidence is referenced from `.claude/state/main-flows-v2/iter-8-*-bottom.png` for all 5 surfaces.

**Verdict:** **PASS — 5/5 surfaces, no exceptions.**

---

## 3. `node scripts/visual-audit/verify-all-flows-light-up.mjs`

**Exit code:** `0` (PASS)

**Stdout summary:**

```
Rail has 62 flow items
  [PASS] F1: gridHasSelection=true stepsCount=7
  [PASS] F5: gridHasSelection=true stepsCount=6
  [PASS] F9: gridHasSelection=true stepsCount=4
  [PASS] F15: gridHasSelection=true stepsCount=3
  [PASS] F22: gridHasSelection=true stepsCount=3
  [PASS] F30: gridHasSelection=true stepsCount=3
  [PASS] F38: gridHasSelection=true stepsCount=4
  [PASS] F45: gridHasSelection=true stepsCount=4
  [PASS] F55: gridHasSelection=true stepsCount=4
  [PASS] F62: gridHasSelection=true stepsCount=3

10/10 sample flows light up the diagram correctly.
```

10 sampled flows (spread across the 62-flow rail: F1, F5, F9, F15, F22, F30, F38, F45, F55, F62) each cause the architecture grid to register a selection (`gridHasSelection=true`) and surface a non-zero step count.

**Verdict:** **PASS — 10/10 sampled flows, full rail bridge intact.**

---

## 4. `node scripts/visual-audit/verify-rail-stability.mjs`

**Exit code:** `0` (PASS)

**Stdout summary:**

```
Rail stability across scroll positions:

scrollY | railTop | railHeight | railMaxH(style) | listHeight | listMaxH(style)
--------|---------|------------|-----------------|------------|----------------
0       | 381     | 679        | 678.625px       | 363        | 350.625px
248     | 133     | 679        | 678.625px       | 363        | 350.625px
248     | 133     | 679        | 678.625px       | 363        | 350.625px
248     | 133     | 679        | 678.625px       | 363        | 350.625px
248     | 133     | 679        | 678.625px       | 363        | 350.625px

Distinct rail.style.maxHeight values across 5 scroll positions: 1
Stability: STABLE (same maxH at every scroll position)
```

Rail dimensions (railHeight=679px, listHeight=363px, both explicit maxHeight styles) remain identical across all 5 sampled scroll positions. One distinct maxHeight value observed → STABLE.

**Verdict:** **PASS — rail dimensions are sticky-stable across the entire scroll range.**

---

## Aggregate Verdict

| Script | Exit | Verdict |
|--------|------|---------|
| `tests/round-trip-test.py` | 1 | **FAIL** (single gate — user-context-gate stale; not a code regression) |
| `verify-scroll-reachability.mjs` | 0 | PASS (5/5) |
| `verify-all-flows-light-up.mjs` | 0 | PASS (10/10 sampled) |
| `verify-rail-stability.mjs` | 0 | PASS (1 distinct maxH) |

**Aggregate: PARTIAL**

The three visual-audit `.mjs` scripts are fully green. The Python `round-trip-test.py` has one failure that is a **process gate (capture freshness)**, not a code regression. The dashboards themselves render correctly, navigate correctly, validate against schema, and pass scroll/visibility/light-up audits. The remediation is one command:

```
node scripts/visual-audit/founder-context-capture.mjs
```

That re-captures the Founder-context screenshots and clears the staleness flag. No code change is required to flip the round-trip test back to green.

### Non-blocking observations from round-trip stdout
- **Phase 2 raw-px migration scope (informational):** raw-px counts are reported (dashboard=17, activity=13, proposals=15, amendments=15, discussion-bubbles=45, main-flows=78, index=11; raw-hex=0 across the board except main-flows=6 which is documented). These are tracked for future token migration, not failures.
- **Token-usage all-time:** real=102,000 / estimated=7,226,910 / manual=0 — cross-panel sums reconcile cleanly.
- **Lifecycle counts:** proposals (pending=0 approved=9 shipped=4 rejected=0 deferred=0), amendments (pending=0 applied=25 rejected=0 deferred=0), escalations (pending=0 applied=3).
- **Discussion bubbles total:** 7 (matches across index + bubbles page).

These are all baseline-healthy.

## What this phase did NOT do

Per the spec's V1 vision-verification gate, the four scripts produce text output and PNG references; this phase did NOT open each referenced PNG in the Read tool and translate the visual content to plain English. That work belongs to a vision-verification phase per the spec; here we captured exit codes and stdout only.
