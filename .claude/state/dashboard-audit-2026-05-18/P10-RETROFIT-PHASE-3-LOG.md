# P10 retrofit Phase 3 log — 2026-05-19

Per AMD-026 (Actionable Surfacing) + Founder LOCK 2026-05-19.
Source catalog: `.claude/state/dashboard-audit-2026-05-18/P10-VIOLATIONS-CATALOG.md` sections 5 + 8.
Reference pattern: `scripts/regen-activity.py:183-197` (P10 prototype fix in code).

## Scope

Phase 3 surfaces:
- `templates/dashboards/discussion-bubbles.template.html` — 7 violations
- `templates/dashboards/proposals.template.html` — 8 violations

Plus: 9-bubble copy update per AMD-026 (Actionability bubble added to deliberation gate).

## discussion-bubbles.template.html (7 violations + 9-bubble copy)

| # | Catalog ref | Fix | Location |
|---|---|---|---|
| 1 | KPI: "Total bubbles" | Wrapped card in `<a href=".claude/state/discussion-bubbles/">` for trust verification. Sub-label switches to "no bubbles recorded yet — legitimate empty (see source dir)" when count=0. | template lines 396-432, JS setSub('bubbles-total', ...) |
| 2 | KPI: "Open" | Same destination link. Sub-label classifies "no bubbles to be open — legitimate empty" (when total=0) vs "no open bubbles — quorum reached on all" (when total>0 but open=0). When non-zero: "awaiting decision (9-bubble quorum 3)" per AMD-026. | same |
| 3 | KPI: "Closed (7d)" | Same destination link. Sub-label classifies "no bubbles closed — none recorded" (total=0) vs "no closures in last 7 days — legitimate empty" (total>0). | same |
| 4 | KPI: "Approved w/ dissent" | Same destination link. Sub-label includes "(9-bubble quorum 3 per AMD-026)" annotation. Empty classification: "no bubbles to dissent" (total=0) vs "no dissent — all closures unanimous" (total>0 dissent=0). | same |
| 5 | Threads rail "0 threads" | New empty-state panel inside #thread-list when filtered.length === 0. Differentiates: (a) `bubbles.length === 0` → "No discussion bubbles recorded · Legitimate empty · link to source dir"; (b) filters applied → "No threads match current filters · Try widening: set Status to 'All' or Ship to 'All ships'"; (c) bubbles exist but none rendered → diagnostic message. | JS renderThreadList() filtered.length === 0 branch |
| 6 | Empty-state right pane | `<h3 data-empty-title>` + `<p data-empty-body>` sentinels added. JS swaps copy: "Select a discussion bubble" / "Pick a thread…" when threads exist; "No discussion bubbles recorded" / link to source dir when bubbles.length === 0; "No threads match filters" / "Widen the Status or Ship filter…" when filters reduce to 0. | template lines 462-478, JS renderThreadList() |
| 7 | Filter dropdowns when ships array empty | When ships.length === 0, inject `#db-ship-filter-helper` div after .db-rail-filters with copy "no ships tagged in any bubble yet — legitimate empty". Dropdown also gets a `title` attribute. | JS populate ship filter block |
| AMD-026 9-bubble | Visible copy | Annotation "(9-bubble quorum 3 per AMD-026)" surfaces in "Approved w/ dissent" sub-label and in "Open" sub-label when populated. Data shape unchanged (Actionability is process-bubble, not data-bubble). | template line 432, JS setSub |

**Counter-note (AMD-026):** No hardcoded "8 bubbles" or "quorum 3 of 8" strings existed in `templates/dashboards/discussion-bubbles.template.html` (grepped). Per the spec, the 8-bubble data shape is preserved; only visible deliberation-count copy is updated. The annotation is added inline to the dissent + open sub-labels so Founder sees the AMD-026 9-bubble framing on-surface.

## proposals.template.html (8 violations)

| # | Catalog ref | Fix | Location |
|---|---|---|---|
| 1 | Decision Queue "Pending" KPI | Card wrapped in `<a href=".claude/state/proposals/pending/">` for trust verification. Sub-label switches to "no proposals pending — orchestration team has authored none" when total=0. | template lines 189-220, JS updateCounts setSub('pending', ...) |
| 2 | Approve/Reject/Defer mini-KPIs | Sub-labels classified: "no decisions yet — mark any pending proposal to populate" when total=0 AND all session marks=0; else "marked in this session". | same |
| 3 | Filter dropdowns "No proposals match" | Differentiated 3-way: (a) totalPending=0 → "No pending proposals · Legitimate empty · link to source dir"; (b) hasFilters=true → "No proposals match current filters · N pending exist · Widen Lane to 'All' or Status to 'All'"; (c) totalPending>0 + no filters but render=0 → diagnostic. | JS render() pending-list branch |
| 4 | "Approved — in flight (0)" counter logic | Added console.warn when `data.counts.approved !== buckets.approved.length` to surface regen-proposals.py count mismatch. Section header continues to use data.counts.approved when present. | JS updateCounts() trailing block |
| 5 | Archive sections (Approved/Deferred/Shipped/Rejected) | Each section header now includes `→ archive dir` link to `.claude/state/proposals/{approved,deferred,shipped,rejected}/`. `onclick="event.stopPropagation()"` on details-summary links so click doesn't toggle collapse. | template lines 256-294 |
| 6 | Raw data (debug) | Helper paragraph above the `<pre>` explains "If JSON below is `{}`, the data block has not yet been swapped. Run `python scripts/regen-proposals.py`…". | template lines 296-310 |
| 7 | Compact card "tokens: ~—" when estimate absent | New `formatCost(n)` + `formatDuration(n)` helpers classify null/undefined as `<span ... font-style:italic>not estimated</span>`. Used in renderProposal (the full-card pending render). Compact archive cards don't render estimate block in current schema, so violation surface is renderProposal. | JS formatCost / formatDuration |
| 8 | evidence_paths + files_affected lists | New `renderPathLink(path)` helper wraps each path in `<a href="../../path">` for click-to-open from docs/reports/ to repo file. Used in both files_affected and evidence_paths sections of renderProposal. | JS renderPathLink, renderProposal usage |

## Method

1. Read all relevant files (P10 catalog, AMD-026 spec, both templates, regen scripts, prototype P10 pattern at regen-activity.py:183-197).
2. Edited templates inline with AMD-026 P10 code-comment citations (each fix carries WHAT/WHERE/WHAT-ACTION rationale).
3. Re-scaffolded: deleted `docs/reports/{discussion-bubbles,proposals}.html`, ran `scripts/dry-run-regen-ops-views.py` (discussion-bubbles) + `scripts/regen-proposals.py` (proposals). Bootstrap helper re-scaffolded from updated templates.
4. V1 captured: `node scripts/visual-audit/capture-dashboards.mjs P10-RETROFIT-PHASE-3-2026-05-19` (32 PNGs across 4 viewports for all 8 dashboards).
5. Vision-verified both surfaces at desktop + desktop-wide viewports.

## V1 verification

**discussion-bubbles-desktop.png** (artifact: `scripts/visual-audit/P10-RETROFIT-PHASE-3-2026-05-19/discussion-bubbles-desktop.png`):
- KPIs render Total=7, Open=1, Closed (7d)=6, Approved w/ dissent=3
- Sub-labels populated state visible: "recorded threads", "awaiting decision (9-bubble quorum 3)", "approved or rejected this week", "non-unanimous outcomes (9-bubble quorum 3 per AMD-026)"
- Threads rail shows 7 thread items; right pane shows transcript of most recent bubble
- Empty-state branches not exercised under current data; code paths in place and audited.

**proposals-desktop.png** (artifact: `scripts/visual-audit/P10-RETROFIT-PHASE-3-2026-05-19/proposals-desktop.png`):
- Decision Queue cards: Pending=0 with sub-label "no proposals pending — orchestration team has authored none"; Approve/Reject/Defer all 0 with sub-label "no decisions yet — mark any pending proposal to populate"
- Pending review section shows classified empty state: "No pending proposals · Legitimate empty — orchestration team has authored none · link to .claude/state/proposals/pending/"
- Approved — in flight (9) section header shows "→ archive dir" link
- 9 approved compact cards render with timestamps + lane labels
- Deferred / Shipped / Rejected archive section headers each show "→ archive dir" link
- Raw data (debug) section shows the helper paragraph with regen-proposals.py command

## Outstanding work

- None for this phase. Surface ready for Phase 4 retrofit (if any) or Founder Verification Packet re-emission per AMD-026 LOCK conditions (a)+(b)+(c).
- Note: pre-existing test failure `theme:dashboard.html: raw hex count 1 > allowed 0` confirmed unrelated to this work (verified via git-stash diff). Out of scope.

## Counts

- Total violations closed: **15** (7 discussion-bubbles + 8 proposals)
- 9-bubble update sites: **2 inline sub-label annotations** (Open + Approved w/ dissent) + comment block citation in template
- V1 captures: **32 PNGs** across 4 viewports
- Files modified (templates only, per constraints): **2** (discussion-bubbles.template.html, proposals.template.html)
- No regen-script changes required (data-layer schema unchanged; all retrofit lives at the surface layer per Phase 3 constraints)
