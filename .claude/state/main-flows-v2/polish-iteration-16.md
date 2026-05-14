# main-flows polish — iter 16

**Authored:** 2026-05-14 by main-flows-polish agent
**Scope:** `docs/reports/main-flows.html` ARCHITECTURE + CLEANLINESS + FLOW
**Reference:** Janowiak `dave-frame-t000p5.png` (selected-flow state)
**Method:** PROP-012 visual review (multimodal Read tool diff) + Playwright
MCP measurement + after-capture verification

## Founder context updates this iteration

Two clarifications during this iteration:
1. "mobile mode isn't needed this will only ever run from my local desktop
   when I am deving" — saved to memory as `feedback_reports_desktop_only`.
2. "also only I need access locally" — reaffirms the prior `8eb0a15`
   directive that gitignored `docs/reports/*` for the public repo. Memory
   updated to capture both facts.

Consequences:
- Dropped mobile (375px) capture from the loop.
- Recognized `docs/reports/main-flows.html` is gitignored; edits are
  durable locally and survive `regen-main-flows.py` (data-block swap only).
- Polish work commits only the `.claude/state/main-flows-v2/` artifacts,
  not the HTML itself.

## Iter 16 GAPs (PROP-012)

| # | Element | Reference | Before iter 16 | Verdict | Fix |
|---|---------|-----------|----------------|---------|-----|
| G1 | Subtitle | 1-2 lines, single block | Verbose 3-clause text, **3 lines (120px)** | ✗ GAP | Reworded to 2-clause, single sentence + invitation |
| G2 | Caveats block | (none in ref — intentional PARBAUGHS addition) | Multi-clause brass-bordered aside, **57px** | ✗ GAP (visual weight) | Condensed to single-line summary with inline links |
| G3 | Pre-grid intro band | ~13% of viewport | **36% of viewport (394px / 1080)** | ✗ GAP — derivative of G1 + G2 | Closes when G1+G2 close |

All other rows: per iter-14 visual review verdict (13 MATCH, 3 Founder-
ratified DEVIATION, 2 INTENTIONAL difference, 1 APPROXIMATION). Iter 16
does not re-litigate ratified deviations.

## Fixes applied

**Fix 1 — subtitle rewrite** (`docs/reports/main-flows.html:291`):

```diff
-<p class="pb-page-subtitle">Every component and external service that powers PARBAUGHS, mapped across six columns from member action to external system. Pick a flow on the right rail (search + actor + tier filters surface all 62 flows in the scrollable panel); the path lights up, arrows draw between nodes, and the steps panel walks the journey. Every node and step is grep-evidenced &mdash; see the <a href="...">architecture audit</a>.</p>
+<p class="pb-page-subtitle">Every component and external service that powers PARBAUGHS, mapped across six columns from member action to external system. Pick a flow on the right to highlight the path and walk the steps.</p>
```

Rationale: reference subtitle is "what the diagram is + invitation to act".
Mechanics ("search + actor + tier filters") are self-evident from the UI;
evidence reference moves into the caveats block where binding context
already lives.

**Fix 2 — caveats condense** (`docs/reports/main-flows.html:295-299`):

```diff
-<aside class="mf-caveats">
-    <strong>Read this artifact correctly</strong> (binding caveats from <code>db-2026-05-13-004</code>):
-    this is the orchestration team's recommendation — Founder is the product source of truth.
-    <strong>NOT a roadmap</strong> (read <a href="../agents/ROADMAP.md">ROADMAP.md</a> for shipping order). Single source of truth is <code>docs/reports/_assets/main-flows-data.json</code>; HTML is generator-driven via <code>scripts/regen-main-flows.py</code>.
-</aside>
+<aside class="mf-caveats">
+    <strong>Read correctly:</strong> orchestration team's recommendation, not a roadmap (see <a href="../agents/ROADMAP.md">ROADMAP.md</a>). Source of truth: <code>docs/reports/_assets/main-flows-data.json</code> via <code>scripts/regen-main-flows.py</code>. Evidence: <a href="...">architecture audit</a>. Binding caveats: <code>db-2026-05-13-004</code>.
+</aside>
```

Rationale: same facts, one line. All four pointers (caveats id, source
of truth file, generator script, evidence audit) preserved as inline
links — discoverability holds, visual weight halves.

## Verification (Playwright MCP measure)

| Metric | Before iter 16 | After iter 16 | Δ |
|---|---|---|---|
| Subtitle height | 120 px (3 lines) | 72 px (2 lines) | −48 |
| Caveats block height | 57 px | 38 px | −19 |
| Pre-grid intro vertical (top → grid.top) | 394 px | 327 px | −67 |
| Pre-grid intro as % of 1080 viewport | 36% | 30% | −6 pp |
| Total page height (scroll-to-bottom) | 1343 px | 1275 px | −68 |
| F1 default selection | active | active | ✓ |
| On-path nodes lit | 7 | 7 | ✓ |
| Arrows rendered | 7-8 | 7 | ✓ |
| Step badges | 7 | 7 | ✓ |
| Steps panel visible items | 7 | 7 | ✓ |
| Console errors | 0 (favicon 404 only) | 0 (favicon 404 only) | ✓ |

After-iter-16 viewport capture saved to:
`.claude/state/main-flows-v2/iter-16-after-fix1-viewport.png`

## Design-bot verdict (PROP-010 format)

**APPROVE for iter 16 close.**

- G1 + G2 closed at root (HTML edits, not CSS workarounds).
- G3 closes as derivative of G1 + G2 — measurable Δ −6 pp.
- Reference fidelity improved on ARCHITECTURE axis (vertical proportion
  closer to reference ~13% / 70%).
- Reference fidelity improved on CLEANLINESS axis (less verbose intro,
  cleaner caveat one-liner).
- FLOW axis unchanged (was MATCH per iter 14).
- Functional verification clean: F1 default + path + steps all working.

## Open for future iterations

- **Pre-grid still 30% vs reference 13%** — the remaining ~17 pp gap is
  the dashboard-shell nav header (54px, fixed for cross-page navigation
  in the Orchestration site) + the necessary h1/legend/caveat band.
  Further compression would require moving title to a horizontal row
  with legend, which is a bigger restructure.
- **Component density** — 47 components in 6 cols vs reference ~60.
  Data difference, not fixable without architecture additions.

These are documented for the next iter's consideration, not blockers.

## Iteration cadence note

This is the first iteration under the dedicated main-flows-polish agent
brief (iter 16 in the polish-iterations log, distinct from main-agent's
own "iter 16" commits which addressed F1 default + F9-F62 paths). Both
streams now coexist; future iters from this agent stay tagged with
`[main-flows-polish]` prefix and write to `polish-iteration-N.md`.
