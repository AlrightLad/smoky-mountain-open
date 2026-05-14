# main-flows.html + dashboard.html — design-review (iter 13)

**Authored:** 2026-05-14 (iter 13 first application of PROP-010
design-bot protocol)
**Reviewer:** Agent 3 in design-bot mode
**Capture set:** `.claude/state/main-flows-v2/founder-real-context/2026-05-14T20-27-33Z/` (main-flows) + `.claude/state/main-flows-v2/founder-real-context/dashboard-recent7days-1778789358244/` (dashboard chart) + `.claude/state/user-journey-audits/2026-05-14T20-27-38Z/` (click-through transcript + screenshots)

This is the inaugural design-review artifact per PROP-010 — proving
the protocol is operative.

## main-flows.html

### What was observed (user-journey across screen states)

**Initial state — page open:**
- Title "Architecture & Flows" Fraunces display font, single line, properly hierarchic
- Subtitle in PARBAUGHS pattern: "Every component and external service that powers PARBAUGHS, mapped across six columns from member action to external system..."
- Caveats block visible — PARBAUGHS-specific explainer, brass-bordered, intentional weight
- Legend dots: 6 colored category indicators inline
- 6-column architecture grid visible, ~5-12 components per column
- Right rail: search input + actor chips + tier chips + scrollable flow list + Steps panel
- Page footer visible

**Scroll the rail (mouse wheel, hover over rail):**
- Items scroll smoothly within the rail
- F1 (Member auth) → F62 (Token observability) all reachable
- **Iter 13 fix verified:** rail max-height is STABLE across page-scroll positions (verified via verify-rail-stability.mjs: 1 distinct rail.style.maxHeight across 5 scroll positions). No jitter.

**Click F1 in rail:**
- Path highlights in the architecture grid (brass border on on-path nodes)
- Off-path nodes dim to opacity 0.18
- Steps panel populates with 7 numbered steps
- "Clear selection" affordance becomes visible

**Click F62 in rail:**
- Same selection behavior as F1
- Metadata-only state in Steps panel (F9-F62 are catalog entries without step paths per Founder Q2)

### Design-bot assessment

**Positives:**
- Layout hierarchy is clear: title → subtitle → caveats → legend → diagram → rail
- Theme cohesion with dashboard: billiard-green + brass + chalk matches other surfaces
- Interaction feedback is crisp: brass on-path, dimmed off-path, brass step badges
- Rail stability holds (iter-13 fix): no expand/contract jitter as user scrolls
- All 62 flows reachable via rail scroll
- F1 click → flow selection works end-to-end

**Negatives (none blocking):**
- Component density varies per column (~5 to ~12 components) — uneven visual rhythm; matches data so not fixable without data changes
- Right rail flow rows show actor + status chip (Founder-Q2 ratified denser format; reference shows title-only — accepted deviation)

**Subtle details verified:**
- Arrows are solid brass (not dashed) per ref + iter R2 alignment
- Step badges are brass-filled circles with mono number
- Legend dots use distinct `--col-*` tokens; category meaning encoded

### Design-bot verdict: **APPROVE**

The rail stability fix (iter 13) closes the visible interaction bug.
All other elements either match the reference (structurally + with
Founder-ratified theme deviations) or are improvements PARBAUGHS-
specific (caveats block, 62-flow filterable rail).

No "doesn't feel right" observations remain. Ship-close approved by
design-bot.

---

## dashboard.html

### What was observed (user-journey across screen states)

**Initial state — page open:**
- Founder Review Queue section at top, brass-bordered, prominent
- Governance gates: 4 KPI cards (Amendments / Bubbles / Proposals / Escalations)
- System Health: Round-trip last pass + Working tree + Active halts
- Cron banner: shows "1 CRON TASK NEWLY INSTALLED · AWAITING FIRST FIRE" — brass border (benign), correct semantics per iter-11 fix
- Activity since last visit + Exceptions blocks

**Scroll down to "This Week" KPIs:**
- 4 cards: Tokens (7.30M · $175.25 spend), Anthropic Quota (no data), Ships (23 · approved & shipped), Halts (0 · clean = good)
- $175.25 spend is post-iter-11 fix (was $0.00 hardcoded)

**Scroll to Recent 7 Days graph:**
- Two side-by-side charts: TOKEN CONSUMPTION PER DAY (single brass bar) + ACTIVITY COUNTS PER DAY (5-series grouped bars)
- 5-series legend: Complete (green), Paused (yellow), Ships (rose), Handoffs (teal), Bubbles (violet)
- **Iter 12 fix verified:** 5 distinct hues, perceptually distinguishable. HSL audit shows no collisions.

**Click nav links:**
- All 6 secondary nav links (Activity / Bubbles / Proposals / Amendments / Escalations / Main Flows) navigate correctly
- All return to dashboard via back-nav

### Design-bot assessment

**Positives:**
- Information hierarchy is clear: governance gates → health → activity → charts → recent ships table
- Visual rhythm: KPI cards balance with explainer text blocks
- Cron banner shows correct state (newly-installed, not REQUIRES INSTALL)
- Recent 7 Days legend has 5 perceptually distinct hues (iter-12 fix holds)
- Token spend shows honest estimate ($175.25 vs prior $0.00)

**Negatives (none blocking):**
- Working Tree shows "dirty (N files) · watcher cycling" — useful operational info but visually busy
- Recent Ships table at very bottom of page; users may not scroll there often (acceptable — secondary info)

### Design-bot verdict: **APPROVE**

All iter 11/12 fixes hold in user-context inspection. No new
"doesn't feel right" observations. Ship-close approved by design-bot.

---

## Ship-close verdict (iter 13)

| Gate | Verdict | Notes |
|---|---|---|
| Round-trip (structural) | ALL CHECKS PASSED | scroll-reachability 5/5, theme guard, protected layouts |
| Click-through audit (PROP-009) | ✓ | No perceptual collisions, all interactions verified |
| User-context capture (PROP-007) | ✓ | Real-Chrome rendering matches expectations |
| Reference diff (iter-13 frame-by-frame) | 0 actual gaps | All deviations Founder-ratified or theme-derived |
| **Design-bot (PROP-010)** | **APPROVE** | Rail jitter fix verified; no UX regressions; no "doesn't feel right" observations |

Iter 13 ship-close: **APPROVED by both Critic AND design-bot.**
