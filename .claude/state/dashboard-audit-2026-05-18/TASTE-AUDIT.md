# TASTE-AUDIT — surface-by-surface scoring against P7 ≥ 9.5 — 2026-05-18 session 2

Per spec D41: "Every UI surface ship-close has TASTE SCORE ≥ 9.5/10 OR Founder-approved gap note."
Per spec D42: "TASTE-AUDIT.md committed."

This document scores every dashboard surface against the 5 P7 dimensions: composition, typography, density, motion, editorial emphasis. References are documented per surface.

## Methodology

For each surface:
1. V1 capture (Playwright screenshot) post-most-recent ship
2. Score each dimension 1-10 against the surface's relevant peer references (≥ 2 per spec M5 cross-cutting)
3. Justify the score with concrete observations
4. Document gaps + remediation path if below 9.5

## Surface 1 — `docs/reports/main-flows.html`

**Peer references (post-session-2 capture):**
1. Janowiak ToDesktop video frames (12 captured at `.claude/state/main-flows-v2/janowiak-reference-frames/`)
2. Stripe Atlas hero (`competitive-references/architecture-flows/stripe-atlas-hero.png`)
3. Eraser.io Architecture Diagrams marketing page (`competitive-references/architecture-flows/eraser-architecture-diagrams.png`)
4. Excalidraw hero (`competitive-references/architecture-flows/excalidraw-hero.png`)

**M5 ≥ 2-peer triangulation requirement: SATISFIED** (4 peers, spec requires ≥ 2).

**Latest capture:** `.claude/state/main-flows-v2/current-render-flow-selected.png` (post-M5.3, F1 selected)

| Dimension | Score | Reference | Notes |
|---|---|---|---|
| D1 Composition | 9.0 | Janowiak D1 + Stripe Atlas | Two-column macro ✓; implicit grid columns within architecture grid; collapsed caveats (post-M5.1); generous title area. Subtle gap: PARBAUGHS retains explicit column headers (ACTORS / CLIENT SURFACES / etc.) where Janowiak relies on implicit columns. |
| D2 Interaction | 8.5 | Janowiak D2 + Linear cycle review | Click flow → select state ✓; STEPS panel synchronous update ✓; selected nodes amber border + numbered badges + arrows ✓. Gap: no auto-cycling demo (Janowiak has it; debatable add). |
| D3 Motion | 8.5 | Janowiak D3 | 220ms ease-out transitions on nodes ✓; staggered path-draw on flow selection (M5.2) ✓; badge fade-in synced ✓. Gap: no node-level scale-in on path entry. |
| D4 Color | 9.0 | Janowiak D4 + Clubhouse design system | Dark teal-gray bg ✓; brass/amber selection ✓; legend floats without container chrome (post-M5.3) ✓; 6-color legend matches column tier identity. |
| D5 Editorial | 9.0 | Janowiak D5 + Linear empty states | Caveats compressed to `<details>` (post-M5.1); subtitle tightened to 1 sentence; floating legend no chrome. Gap: column subtitles still present (Janowiak doesn't have these). |

**Surface score: 8.8 / 10** (post-M5.3 + peer triangulation validated).

**Per-peer comparison observations:**
- vs **Janowiak** — PARBAUGHS matches D1/D4/D5 (composition + color + editorial); slightly under on D3 motion (Janowiak has continuous draw signature). Closest peer.
- vs **Stripe Atlas** — PARBAUGHS is denser; Stripe favors editorial whitespace + larger nodes. PARBAUGHS's 47-component grid would feel cramped on Stripe's page. Both are production-polished.
- vs **Eraser.io** — PARBAUGHS has comparable density (Eraser's Netflix example shows similar node count). PARBAUGHS has more motion + interactive flow selection; Eraser is static reference. PARBAUGHS scores higher on D2 interaction.
- vs **Excalidraw** — different aesthetic intent (hand-drawn whiteboard vs production polish). Useful for editorial restraint validation; PARBAUGHS aligns on minimal chrome.

**Triangulation verdict:** PARBAUGHS at 8.8 is comparable-to-Eraser, below Janowiak's signature motion, denser than Stripe. The remaining 0.7 gap to 9.5 is primarily D3 motion polish (node-level scale-in) + optional subtitle removal — small, well-scoped iterations.

**Founder-approval status:** PENDING. Below 9.5 by 0.7. Two paths:
- **Option A:** 1-2 more iterations (Approach B + Approach E from M4-M5-SCORE doc) — ~30-60 min next session
- **Option B:** Founder gap-approval for 8.8 as ship-quality, defer 9.5 as a follow-on polish ship after the goal closes

## Surface 2 — `docs/reports/dashboard.html`

**Peer references:** Vercel monitor dashboards (captured), Linear timeline, Datadog cost breakdown (post-T6 reference), Stripe billing.

**Latest capture:** `scripts/visual-audit/dashboard/dashboard-desktop.png` (post-Phase-B)

| Dimension | Score | Reference | Notes |
|---|---|---|---|
| D1 Composition | 9.0 | Vercel monitor + Linear timeline | Founder Review Queue at top; system health row; KPI grid; trend chart row; recent tables. Clean information hierarchy. |
| D2 Interaction | 9.0 | Datadog incidents + Linear status | 4 health banners clickable + expand detail panels (BUG-9 fix); KPI cards static (correct — no over-interaction). |
| D3 Motion | 8.5 | Vercel monitor | Subtle hover states + banner expand animations. Gap: chart transitions could be more polished. |
| D4 Color | 9.0 | Clubhouse design system | Status-driven color (green/yellow/red) on health banners + brass accent on KPIs ✓. Consistent with token-usage.html + main-flows.html. |
| D5 Editorial | 9.5 | Linear "We respect your time" | Page subtitle is 1 line; "READ THIS ARTIFACT CORRECTLY" caveat absent (this is the dashboard, not a runbook); recent tables show real data without disclaimer. Phase B token meter cards now show 4.10B (truthful) instead of 102k stale. P9 verdict: TRUTHFUL across 25+ cards. |

**Surface score: 9.0 / 10** (post-Phase-B). Below 9.5 target.

**Gap-to-9.5 plan:**
- Chart motion polish (D3): consider animated bar-grow on the 7-day token consumption chart.
- More verification on the architecture-review intentional empty-state (currently "unknown" + "0 pending recommendations") — could be more elegant per Linear empty state pattern.

**Founder-approval status:** PENDING. 0.5 below 9.5 — small iteration or Founder gap-approval.

## Surface 3 — `docs/reports/token-usage.html`

**Peer references:** Anthropic console usage (captured), OpenAI usage (captured), Vercel billing, Stripe billing, GitHub Actions usage.

**Latest capture:** `scripts/visual-audit/T6-pie-final/token-usage-agent-role.png` (post-Phase-T6, default view)

| Dimension | Score | Reference | Notes |
|---|---|---|---|
| D1 Composition | 9.5 | Anthropic console + OpenAI usage | 3 KPI cards at top (METER / WEEKLY / ORG); single donut row with REAL/ESTIMATED/MANUAL breakdown; NEW Phase T6 "Where the tokens went" section with 3-view toggle + multi-slice donut + legend table. Clear information hierarchy. |
| D2 Interaction | 9.5 | Linear segmented control | 3-way toggle works smoothly (Agent role / Work category / Top sessions). Refresh now button. All 22 clickable elements verified via click-every-interactive (D38). |
| D3 Motion | 9.0 | Vercel chart transitions | 240ms opacity fade on view switch ✓. Existing donut transition unchanged (CSS). Could match with more refined entrance/exit. |
| D4 Color | 9.5 | Datadog cost breakdown | 10-color palette (brass/billiard/info/violet/error/success/rose/warning/chalk) for slices. Subtle, distinguishable. |
| D5 Editorial | 9.5 | OpenAI usage | "Where the tokens went" + "RAW tokens (primary) · USD cost at Opus 4.7 rates (secondary)" subtitle. Methodology footer surfaced honestly. Honest disclosure of approximate-vs-exact cost computation. |

**Surface score: 9.4 / 10** (post-Phase-T6). At threshold — 0.1 below 9.5.

**Gap-to-9.5 plan:**
- D3 motion polish: smoother arc-grow animation on view switch (currently opacity fade only).
- Per Phase T6 deferred work: slice colors are positional → pin by label so adding a new agent doesn't shift colors. This is a stability concern, not visual.

**Founder-approval status:** PENDING. 0.1 below 9.5 — likely the smallest iteration would close.

## Surfaces 4-10 — Other dashboards

**Surfaces:** activity.html, amendments.html, proposals.html, escalations.html, discussion-bubbles.html, design-system.html, index.html

**Latest captures:** `scripts/visual-audit/2026-05-18/*-desktop.png` (Phase A baseline, no Phase B/T6 changes)

These surfaces were not materially changed in session 2. They remain at the **session-1 baseline scoring** which has not been per-dimension-detailed in TASTE-AUDIT format yet. The per-surface taste audit for these 7 surfaces is **DEFERRED to a follow-up Phase G/I ship** that addresses:

| Surface | Known issue (session 1 INVENTORY) | Phase to address |
|---|---|---|
| activity.html | (closed session 2) handoffs counter parity now correct | Done — Phase B |
| amendments.html | AMD-001..025 frontmatter scan ok | Phase G (per-AMD render polish) |
| proposals.html | PROP shipped/deferred lists ok | Phase G |
| discussion-bubbles.html | (closed session 2) wiring/dropdown JS-population now verified | Done — Phase B |
| escalations.html | escalation records render ok | Phase G |
| design-system.html | static token reference; no live data | Phase G visual audit |
| index.html | filesystem directory listing | Phase G |

**Acceptance:** These 7 surfaces have NOT failed any P9 trace this session. They're not flagged on dashboard.html cross-surface scan. They're rendering correctly per V1 captures at session 1 baseline.

**Founder-approval status:** Best read by per-surface visit (browser). Score not formally assigned per-dimension this session.

## Summary

| Surface | Score | Status |
|---|---|---|
| main-flows.html | 8.8 | Below 9.5 — iteration path documented |
| dashboard.html | 9.0 | Below 9.5 — iteration path documented |
| token-usage.html | 9.4 | Below 9.5 by 0.1 — small iteration would close |
| 7 other surfaces | n/a | Baseline — formal per-dimension audit deferred |

**Cross-cutting taste observations:**
- Header chrome ("PARBAUGHS ORCHESTRATION" + nav tabs) is consistent across all surfaces — strong (9.5+).
- Footer pattern ("Source: .claude/state/...") consistent + builds trust — strong (9.5+).
- Typography (display + monospace + mono numerals) consistent — strong (9.5+).
- Color palette dark-cool with brass accents — consistent with PARBAUGHS Clubhouse identity — strong (9.5+).
- Data fidelity (P9) across surfaces is uneven where Phase B/T6 hasn't shipped — but the three primary surfaces (dashboard, token-usage, main-flows) are now TRUTHFUL or actively-iterating.

## D41/D42 closure status

**D41 (Every UI surface ship-close has TASTE SCORE ≥ 9.5 OR Founder-approved gap note):**
- main-flows.html: 8.8 (gap noted, path to 9.5 documented)
- dashboard.html: 9.0 (gap noted, path to 9.5 documented)
- token-usage.html: 9.4 (smallest gap)

All 3 are below 9.5 — closure depends on either iteration OR Founder gap-approval. Founder Verification Packet refresh (session 2) surfaces this for decision.

**D42 (TASTE-AUDIT.md committed):** This file closes D42.

## Path to D41 closure

Option A — Iterate to ≥ 9.5 on all three surfaces this audit cycle:
- main-flows: +0.7 (peer captures + 1-2 polish iterations) = ~30-60 min next session
- dashboard: +0.5 (chart motion polish) = ~15 min next session
- token-usage: +0.1 (arc-grow on view switch) = ~10 min next session

Option B — Founder gap-approval:
- Accept current scores as ship-quality
- Document each gap as a known-deferred-polish item
- Continue with goal closure
