# Proposal Count Fix — Summary

**Run:** 2026-05-13 (Founder URGENT: "Banner shows 5, page shows 2")
**Outcome:** **TWO BUGS FIXED.** Banner divergence root-caused (hardcoded HTML never wired to data block) + empty-cards bug root-caused (proposal schema drifted from §amendment.4) + round-trip test extended to catch both bug classes + `regen-all` now gates on the test.

---

## Step 1 — Ground truth

| Folder      | Count | Filenames                                                          |
|-------------|-------|--------------------------------------------------------------------|
| pending     | **2** | PROP-003 (token-meter sidecar), PROP-004 (org-monthly quota)      |
| approved    | 1     | PROP-002 (main-flows.html)                                         |
| rejected    | 0     | —                                                                  |
| deferred    | 0     | —                                                                  |

Canonical `proposals_pending = 2` for every dashboard surface.

Pending proposals' frontmatter schema integrity at start of fix-pass: both had the FLAT schema (e.g., `estimate_tokens` as a scalar, `lane` as a string). Authoritative §amendment.4 schema is nested (`estimate.cost_tokens`) with numeric `lane`. The proposals drifted from spec — Bug 2 detected during Step 4 of this fix-pass.

Full record: `.claude/state/wave-zero-dry-run/proposal-count-truth.md`.

## Step 2 — Every reference inventoried

Full audit at `.claude/state/wave-zero-dry-run/proposal-count-audit.md`. Five hardcoded numbers found in `dashboard.html` alone (lines 86, 96, 97, 98, 107) — same root pattern: static HTML text from the v8.1.2 governance template that no regen ever updates.

## Step 3 — Root cause (two bugs)

### Bug 1 — Banner divergence

`dashboard.html:86` was literally `<div class="card-title text-brass">5 proposals awaiting Founder review</div>` — plain HTML text, no data-binding attribute, no entry in `dashboard.js`'s renderer selector list. Stale seed value from the template. The data block at line 223 correctly read `proposals_pending: 2`. The metric tile at line 67 (which IS data-bound via `data-metric="proposals-pending"`) correctly read "2". The banner displayed "5". Same pattern for lines 96-98 (quick-link subtitles) and 107 (budget pct).

### Bug 2 — Empty proposal cards

`docs/reports/proposals.html`'s renderer (per `REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.4`) expects:
- `lane`: NUMBER 1-4
- `lane_label`: separate string
- `created_at`: ISO-8601
- `estimate`: NESTED object {cost_tokens, duration_minutes, risk}
- `evidence_paths`: array

My PROP-002 / PROP-003 / PROP-004 (and the round-trip fixture PROP-008 / PROP-009) used a DRIFTED schema (lane as string, no lane_label, no created_at, flat `estimate_tokens`, no evidence_paths). The sort callback at line 441 (`a.estimate.cost_tokens - b.estimate.cost_tokens`) threw `TypeError` on `undefined.cost_tokens`. `render()` propagated the throw; `proposal-list` div stayed empty.

Founder's directive cited the authoritative source: **proposal schema is authoritative per §amendment.4; the renderer matches spec — patch the proposals.**

Full diagnosis with evidence: `.claude/state/wave-zero-dry-run/proposal-count-rootcause.md`.

## Step 4 — Fixes applied

### Bug 1 fix

`dashboard.html`:
- Line 86 banner: `5 proposals awaiting Founder review` → `<span data-banner-text="proposals-count">—</span> proposals awaiting Founder review`
- Lines 96-98 quick-link subtitles: hardcoded text → `<div ... data-quicklink="bubbles-summary">—</div>` + ditto for activity + proposals
- Line 107 budget pct: `<span data-progress="weekly-budget-pct">68%</span>` → `<span data-progress="weekly-budget-pct">—</span>`
- Inline `DOMContentLoaded` script extended to call `setText('[data-banner-text="proposals-count"]', ...)` etc. and populate budget pct label from `data.budget_pct`

### Bug 2 fix

PROP-002 (approved/), PROP-003 (pending/), PROP-004 (pending/): all three proposal markdown files' JSON frontmatter rewritten to §amendment.4 schema:
- `lane`: 2 | 3 | 4 (numeric)
- `lane_label`: "Bug Discovery" / "Performance" / "Design System Extension"
- `created_at`: ISO-8601 UTC
- `estimate`: nested `{cost_tokens, duration_minutes, risk}`
- `evidence_paths`: array citing diagnostics + bubble transcripts

Renderer simulation confirms: sort succeeds (cost-asc → PROP-004 first), all required fields present, every card now has full content.

## Step 5 — Cross-dashboard consistency tests

`tests/round-trip-test.py` extended with three new sections:

```
[cross-dash] Cross-dashboard count consistency...
  ✓ proposals_pending           ground=2  all=dashboard.html=2, proposals.html=2, index.html=2
  ✓ discussion_bubbles_total    ground=5  all=discussion-bubbles.html=5, index.html=5
  ✓ handoffs_total              ground=1  all=activity.html=1, dashboard.html=1

[banner-text] dashboard.html banner must be data-bound, not hardcoded...
  ✓ dashboard.html banner uses data-bound placeholder (no hardcoded count)

[proposal-cards] Each pending proposal has full §amendment.4 schema...
  ✓ PROP-003-token-meter-wiring-sidecar.md   id=PROP-003 lane=3 (Performance) cost=45000
  ✓ PROP-004-org-monthly-quota-type.md       id=PROP-004 lane=2 (Bug Discovery) cost=8000
```

Each section will fail loudly if:
- Any dashboard's count diverges from on-disk truth (catches Bug 1 class)
- A hardcoded digit count returns to the banner card-title (regression check)
- Any pending proposal's schema drifts from §amendment.4 (catches Bug 2 class)

## Step 6 — regen-all gates on the test

`scripts/regen-all.sh` and `scripts/regen-all.ps1` extended:
- After all 5 regen scripts succeed, run `tests/round-trip-test.py`
- If test fails (exit ≠ 0): roll back the 6 dashboard HTML files via `git checkout HEAD -- <file>` for each, print test output's tail, exit code 2
- If test passes: print `round-trip test PASS` + final success line

This means: a regen run that produces inconsistent dashboards never reaches Founder's eyes — the test is the gate, and a failure restores the last-known-good state.

Verified end-to-end: `bash scripts/regen-all.sh` now ends with `[regen-all] round-trip test PASS / ALL DASHBOARDS REGENERATED at <ts>`.

## Step 7 — Critic audit protocol amendment

`.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md` § 3.1 added — the 3-item dashboard-consistency checklist now part of Critic's pre-close audit:

```
- [ ] All counts displayed on dashboards verified against on-disk state
- [ ] Cross-dashboard consistency verified (same number everywhere)
- [ ] Round-trip test cross-dashboard section passed post-regen
```

Fires on any ship that touches `docs/reports/*.html`, `scripts/regen-*.py`, or a state directory whose count surfaces on a dashboard.

## Confirmation: post-fix state

| Surface                                      | Value         | Source            |
|----------------------------------------------|---------------|-------------------|
| On-disk `pending/*.md`                       | **2**         | filesystem        |
| Snapshot `_aggregate_counts.proposals_pending` | **2**       | aggregator        |
| dashboard.html data block                    | **2**         | regen-dashboard.py|
| dashboard.html metric tile (`Pending proposals`) | **2**     | dashboard.js renderer |
| dashboard.html banner card title (post-fix)  | **2**         | inline DOMContentLoaded hook (data-bound) |
| dashboard.html quick-link "Proposals" subtitle | **2 pending — review on the proposals page** | inline hook |
| proposals.html data block                    | **2**         | regen-ops-views   |
| proposals.html `data.proposals.length` (renderer) | **2**    | renderer succeeds (no schema throw) |
| index.html status panel "Proposals pending"  | **2**         | regen-index.py    |
| index.html dashboard card badge "X pending"  | **2 pending** | regen-index.py    |

All show 2. No divergence.

## Files changed

**Modified:**
- `docs/reports/dashboard.html` — 5 hardcoded numbers converted to data-bound; inline render hook extended
- `.claude/state/proposals/pending/PROP-003-token-meter-wiring-sidecar.md` — schema migrated to §amendment.4
- `.claude/state/proposals/pending/PROP-004-org-monthly-quota-type.md` — schema migrated to §amendment.4
- `.claude/state/proposals/approved/PROP-002-main-flows-html-operational-view.md` — schema migrated to §amendment.4
- `.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md` — § 3.1 added (dashboard-consistency checklist)
- `tests/round-trip-test.py` — 3 new test sections
- `scripts/regen-all.sh` — gate on round-trip test + rollback on fail
- `scripts/regen-all.ps1` — same as above
- (data-block-swap regens produced naturally during the fix-pass on all 6 dashboards)

**New:**
- `scripts/dashboard-diagnostic.py` (reused from prior fix-pass; not new this round)
- `.claude/state/wave-zero-dry-run/proposal-count-truth.md`
- `.claude/state/wave-zero-dry-run/proposal-count-audit.md`
- `.claude/state/wave-zero-dry-run/proposal-count-rootcause.md`
- `.claude/state/wave-zero-dry-run/proposal-count-fix-summary.md` (this file)

## Discipline notes

- Diagnose-before-fix observed: Step 3 root-cause file built before any fix was applied.
- Hypothesis-vs-confirmed table maintained in `proposal-count-rootcause.md` § hypothesis/confirmed.
- Second bug (empty cards) was caught while diagnosing the first — both fixed in this pass.
- Defensive pause heuristic: no API errors observed; ~15 atomic ops across the pass; staying disciplined.
- NOT pushed.
