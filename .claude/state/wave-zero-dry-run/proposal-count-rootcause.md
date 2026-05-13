# Root Cause Diagnosis — Proposal Count Divergence

**Confirmed cause:** Pattern (a) from Founder directive. The banner card title and quick-link subtitles in `docs/reports/dashboard.html` are STATIC HTML, hand-authored with seed values from the v8.1.2 governance drop. They are not connected to the data block. `scripts/regen-dashboard.py` updates the JSON in `<script id="report-data">` but does NOT touch the rendered markup.

## Evidence

### 1. Static "5" on disk in dashboard.html (line 86)

```html
<div class="card-title text-brass">5 proposals awaiting Founder review</div>
```

This is plain HTML text. There is no data-binding attribute on the element. Nothing reads from `data.proposals_pending` to update it.

Same root cause for lines 96-98 (quick-link subtitles), e.g. line 98: `5 pending — ~78k tokens combined cost if all approved`.

### 2. Data block at line 223 IS correct

```json
"proposals_pending": 2,
```

Verified via `grep -n` on dashboard.html. The data is fresh; only the markup is stale.

### 3. dashboard.js renderer hits other elements, not the banner

`docs/reports/_assets/dashboard.js` line 218-256 `renderers.dashboard(data)`:
- Line 225: `setText('[data-metric="proposals-pending"]', data.proposals_pending || 0);` — populates the **metric tile** at line 67 of dashboard.html (`<div class="metric-value" data-metric="proposals-pending">`), which IS being correctly rendered. The metric tile shows "2".
- The renderer does NOT have a selector for the banner card title. There is no `[data-banner-...]` selector in the renderer. The banner text is invisible to the renderer.

### 4. Disagreement made physical

Open `dashboard.html` post-regen in a browser:
- Metric tile labeled "Pending proposals": **2** (correct, from `data-metric="proposals-pending"`)
- Banner card title: **5 proposals awaiting Founder review** (stale, hardcoded)
- Quick-links card subtitle (Proposals): **5 pending — ~78k tokens...** (stale, hardcoded)

Founder's screenshot shows exactly this contradiction.

## Other hardcoded numbers (caught while diagnosing this one)

Same pattern, different metrics. **These were not in the screenshot but will divergence the moment state changes:**

| Line | Hardcoded content                                                            | Truth                       |
|------|-------------------------------------------------------------------------------|------------------------------|
| 96   | `3 recorded · 1 with dissent · 1 deferred` (bubbles quick-link)               | 5 bubbles today, 1 with dissent, 0 deferred |
| 97   | `Last handoff: 03:58 UTC — engineer → next-cycle` (activity quick-link)        | most recent handoff is 2026-05-13T11:38:00Z, discussion-bubble-orchestrator → wave-zero-dry-run-orchestrator |
| 98   | `5 pending — ~78k tokens combined cost if all approved` (proposals quick-link) | 2 pending (PROP-003 45k + PROP-004 8k = ~53k) |
| 107  | `<span data-progress="weekly-budget-pct">68%</span>`                          | weekly_tokens=0, budget_pct=0 (meter unwired per F1a); banner should show 0% or "meter gap" |

All four are the same defect: stale seed values from the v8.1.2 template, untouched by any regen.

## Why this slipped through earlier fix-passes

The Step 0 diagnostic in the previous fix-pass checked **data block** correctness, not **rendered markup**. It found data blocks reflected on-disk state and called it OK. The eye-test was missing — Founder caught it visually.

This is exactly the failure mode the F5 Metric Integrity Protocol's "cross-check" rule is designed to prevent: a metric whose stated value (data block = 2) diverges from a related signal (rendered banner = 5) suggests a bug. No automated cross-check existed for "data block vs rendered text" until this directive.

## Pattern code-path summary

```
.claude/state/proposals/pending/   ←──── ground truth (2)
        │
        │ walked by:
        ↓
scripts/aggregate-telemetry.py:146 (proposals_pending = 2)
        ↓
.claude/state/telemetry/aggregates/current-snapshot.json (_aggregate_counts.proposals_pending = 2)
        │
        │ separately walked by:
        ↓
scripts/regen-dashboard.py:99 (proposals_pending = 2)
        ↓
docs/reports/dashboard.html line 223 (data block: "proposals_pending": 2)   ← CORRECT
        │
        │ rendered by dashboard.js renderer:
        ↓
docs/reports/dashboard.html line 67 ([data-metric="proposals-pending"])      ← shows "2" ✓
        ↓
docs/reports/dashboard.html line 86 (banner card title)                       ← shows "5" ✗ NOT WIRED
docs/reports/dashboard.html lines 96, 97, 98 (quick-link subtitles)           ← shows stale text ✗ NOT WIRED
docs/reports/dashboard.html line 107 (budget pct span)                        ← shows "68%" ✗ NOT WIRED
```

Five elements in the markup were never wired to the data block. The data block is correct; the markup-side bindings are missing.

## Diagnosis status

**Confirmed (not hypothesis).** All four bugs are:
- Visible on disk (grep'd)
- Static HTML text without data-binding attributes
- Outside the dashboard renderer's selector list

The fix is mechanical: convert the static text to data-bound elements and add render hooks. No working-dir bug, no stale snapshot, no count-method disagreement between scripts.

## Hypothesis vs confirmed table

| Statement                                                          | Status     |
|--------------------------------------------------------------------|------------|
| Line 86 contains hardcoded "5"                                      | CONFIRMED (grep + Read) |
| dashboard.js renderer does not touch line 86                        | CONFIRMED (grep over dashboard.js for data-banner selectors found none) |
| Data block at line 223 is correctly populated by regen-dashboard.py | CONFIRMED (verified via post-regen JSON parse) |
| Lines 96-98 quick-link subtitles also have stale numbers            | CONFIRMED (grep + Read) |
| Line 107 budget pct is similarly stale                              | CONFIRMED (read shows literal `68%`) |
| Fix is to add data-binding attributes + extend render hooks         | DECISION (Step 4) — applies pattern (a) |

---

## Bug 2 — Empty proposal cards on proposals.html (added per Founder directive)

### Evidence

`docs/reports/proposals.html` renderer expects (per `REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.4` — the authoritative schema):

```json
{
  "id": "...",
  "title": "...",
  "lane": 1|2|3|4,                        // NUMBER
  "lane_label": "UI Polish" | ...,         // separate string
  "created_at": "ISO-8601",
  "rationale": "...",
  "scope": "...",
  "estimate": {                            // NESTED OBJECT
    "cost_tokens": N,
    "duration_minutes": N,
    "risk": "low|medium|high"
  },
  "files_affected": [...],
  "evidence_paths": [...],
  "ship_target": "..."
}
```

My proposals (PROP-002 approved, PROP-003 + PROP-004 pending) and the round-trip workspace fixture (PROP-008, PROP-009) use a DRIFTED schema:

```json
{
  "id": "...",
  "title": "...",
  "lane": "Lane 3 — Performance / Infrastructure",  // STRING, not number
  // lane_label: ABSENT
  // created_at: ABSENT
  "rationale": "...",
  "scope": "...",
  "estimate_tokens": 45000,                // FLAT, not nested
  // estimate.duration_minutes: ABSENT
  // estimate.risk: ABSENT
  "files_affected": [...],
  // evidence_paths: ABSENT
  "ship_target": "..."
}
```

### Failure mechanism

In `docs/reports/proposals.html`:

- **Line 441 (sort callback, default `cost-asc`):** `a.estimate.cost_tokens - b.estimate.cost_tokens` → `a.estimate` is `undefined` → `TypeError: Cannot read properties of undefined (reading 'cost_tokens')`.
- Sort throws. `filtered.sort(...)` propagates the throw before reaching `filtered.map(...)`.
- Line 449-452: `list.innerHTML = ...` rhs evaluation never completes. `proposal-list` div stays empty.
- Line 454-455: `wireInputs()` and `updateCounts()` never run.
- `render()` throws; no outer try/catch around the call site at line 588 (or at lines 346, 360, 549). Unhandled exception silently logged to browser console; page partially renders (everything before render() is static and renders fine).

What Founder sees: the page chrome renders (page-nav, summary bar with `—` placeholders, filter dropdowns, help banner), but `<div id="proposal-list">` is empty. Founder reports "cards/rows that exist, but each card has no visible content" — likely referring to the summary-bar tiles (Pending: —, Approve: 0, Reject: 0, Defer: 0) which look card-shaped but show placeholder values because `updateCounts()` never ran.

### Authority direction

Per Founder directive: "proposal schema is authoritative per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.4 — patch the renderer if it drifted." Reading §amendment.4 confirms the renderer matches the spec. The PROPOSALS drifted from the spec, not the renderer. Fix: update my 3 proposal files to spec-compliant schema.

### Where the drift came from

The round-trip-test.py synthetic fixture (PROP-008, PROP-009 seeded in `tests/round-trip-workspace/.claude/state/proposals/pending/`) uses the flat-`estimate_tokens` schema. When I authored PROP-002 / PROP-003 / PROP-004 during F1+F4 remediation, I matched the fixture pattern instead of reading §amendment.4. The fixture itself was authored before the spec ratified, or drifted afterward.

This is a real example of P6 (verify design-spec data sources before spec authoring) — memory entry from Founder. I matched a sibling artifact instead of cross-checking against the canonical spec. The mistake re-fires here.
