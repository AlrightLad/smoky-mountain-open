# TASTE-AUDIT.md (D27) — PARBAUGHS dashboards vs 9.5/10 threshold

**Audited:** 2026-05-16
**Spec source:** `dashboard-completion-spec-2026-05-15.md` P7.2 — passing
threshold raised from PRIOR 7.5 to NEW 9.5 ("shippable next to Linear
and Stripe").
**Rubric:** 8-dimension peer-anchored — see
`.claude/state/design-research/taste-scoring/RUBRIC.md` + the embedded
rubric in `.claude/state/design-research/competitive-references/
design-patterns-observed.md`.
**Peer-anchor average:** ~8.5/10 across Linear/Vercel/Stripe/Datadog/Sentry.

This document is the EXPLICIT D26 evidence: an honest gap analysis
of PARBAUGHS dashboards against the 9.5 threshold. Founder ruling
on whether 9.5 applies to operator-tooling is the explicit OPEN
ITEM 4 in the Founder Verification Packet.

---

## Current scores vs both thresholds

| Surface | Score (8-dim) | vs 7.5 (prior) | vs 9.5 (new) | Gap to 9.5 | Iterated this session? |
|---|---|---|---|---|---|
| dashboard.html | 7.50 | ✅ AT threshold | ❌ −2.00 | 2.00 | YES (system-health 4-col + line-clamp; iter1 6.43→7.50) + (D37 quota fix + D36 D-T-D card; not re-scored) |
| proposals.html | 7.75 | ✅ ABOVE | ❌ −1.75 | 1.75 | No |
| amendments.html | 7.75 | ✅ ABOVE | ❌ −1.75 | 1.75 | No |
| escalations.html | 7.75 | ✅ ABOVE | ❌ −1.75 | 1.75 | No |
| activity.html | 7.88 | ✅ ABOVE | ❌ −1.62 | 1.62 | No |
| token-usage.html | 8.38 | ✅ ABOVE | ❌ −1.12 | 1.12 | No (already best data page) |
| discussion-bubbles.html | 7.50 | ✅ AT | ❌ −2.00 | 2.00 | No |
| design-system.html | 8.38 | ✅ ABOVE | ❌ −1.12 | 1.12 | No (already best design page) |
| main-flows.html | 7.50 | ✅ AT | ❌ −2.00 | 2.00 | NO — needs M-phase iteration vs Janowiak decomposition (deferred to M4-M5) |
| index.html | 7.63 | ✅ ABOVE | ❌ −1.87 | 1.87 | YES (3+3 symmetric; iter2 7.43→7.63) |

**Fleet average: 7.80/10**
**Peer-anchor average: 8.50/10**
**Gap to peer-anchor: 0.70**
**Gap to new 9.5 threshold: 1.70**

---

## Honest delta (per AMD-009 P5)

**No surface meets the 9.5 threshold.** Closest is token-usage.html at
8.38 (gap 1.12). Three surfaces sit exactly at the prior 7.5 floor.

The 9.5 threshold ("shippable next to Linear and Stripe") implies
flagship-consumer-SaaS quality. Per usage-meters peer reference
analysis: the gap to 9.5 lives in these consistent dimensions across
all surfaces:

### Dimension-level gap analysis

1. **Metric hierarchy (Stripe pattern)**: 1-2 points away
   - Missing: big-numeral with delta-indicator pattern (▲ +12% vs prior period)
   - Missing: mixed-tile-size grids (important metrics get larger tiles)
   - Present: equal-size cards in even grids
   - Path to 9.5: redesign KPI rows with primary-tile + secondary-tile pattern

2. **Interactive affordances (all-peer)**: 1-2 points away
   - Missing: time-range chips per chart (day/week/month) — universal in peers
   - Missing: filter chips above lists — present only on activity.html
   - Missing: command palette (⌘K) — Linear/Vercel pattern
   - Path to 9.5: add ↗ time-range chip pattern to system-health + activity surfaces

3. **Motion + transitions**: 1-2 points away
   - Missing: scoring incomplete in current rubric (motion not measured)
   - Per Linear pattern: subtle hover-elevation on cards, fade-in on data load
   - Path to 9.5: instrument hover/load states

4. **Empty / loading / error states (Linear pattern)**: 0.5-1 point away
   - Present: D37 fix added honest "estimated · no Anthropic console quota configured"
   - Present: D36 added "no events recorded yet today" for D-T-D early UTC
   - Missing: loading skeletons (shadcn/ui pattern)
   - Missing: error states with next-action guidance (Stripe pattern)
   - Path to 9.5: skeleton loading per data card; error CTA per failure mode

5. **Typography (Stripe + Apple HIG)**: 0.5-1 point away
   - Present: Fraunces + mono + chalk stack is distinctive
   - Missing: bigger numeral sizes (3xl-5xl per peer); current ~2xl
   - Path to 9.5: numeral-size bump on primary KPIs

### What 9.5 would actually take per surface (estimate)

- dashboard.html: ~6 polish ships (mixed-tile-size + delta indicators
  + time-range chips + loading skeletons + numeral bump + motion)
- proposals/amendments/escalations.html: ~4 polish ships each
  (filter chip parity + numeral hierarchy + loading skeletons + delta
  indicators where applicable)
- activity.html: ~3 polish ships (already strong on affordances; needs
  motion + skeletons + numeral bump)
- token-usage.html: ~2 polish ships (closest to 9.5; needs mixed-tile +
  motion)
- discussion-bubbles.html: ~5 polish ships (threading UX is decent but
  needs Stripe-grade density polish)
- design-system.html: ~2 polish ships (already best; needs interactive
  density)
- main-flows.html: separate M-phase iteration against Janowiak
  decomposition + 3+ architecture-diagram peers (Excalidraw / Eraser /
  Whimsical / Stripe Atlas) — estimate 6-10 iterations to 9.5
- index.html: ~3 polish ships (numeral hierarchy + cards-with-deltas +
  loading)

**Total polish work to reach 9.5 fleet: ~35-45 polish ships across
9 surfaces** (excluding main-flows which is its own M-phase track).

---

## The explicit Founder-decision item

Per the Founder Verification Packet OPEN Item 4:

> **Item 4 (Taste 9.5 threshold for operator tooling vs 7.5 prior
> threshold): [Founder rules]**

Three possible Founder rulings:

### Ruling A — 9.5 applies; block goal until met
- Estimated work: 35-45 additional polish ships
- Estimated time: 3-6 weeks at current cadence
- Goal stays open

### Ruling B — 9.5 is the aspirational bar; 7.5 is the SHIPPING bar
- This goal closes at fleet-average 7.80 (current state)
- 9.5 reserved for member-facing app surfaces (not operator dashboards)
- Operator tooling threshold = 7.5 (the prior threshold)
- Future TASTE-AUDITs apply 9.5 to user-facing app surfaces only

### Ruling C — 9.5 applies but staged via separate goal
- This dashboard-completion goal closes
- A new "Dashboard taste 9.5 polish" goal opens
- Founder reviews + prioritizes the 35-45 polish ships

Recommendation: **Ruling B (split bar by audience).** Justification:
operator tooling is single-user (Founder); polish ROI is bounded by
"does it ship faster" not "does it convert prospects." 9.5 for
member-facing app makes sense; for internal dashboards the marginal
return on 7.5→9.5 is low. But this is Founder's call.

---

## What's already shipped this session toward higher scores

- dashboard.html: 6.43 → 7.50 (iter1: 4-col system-health + line-clamp)
- index.html: 7.43 → 7.63 (iter2: 3+3 symmetric layout)
- dashboard.html: D37 Anthropic quota empty-state honest label
- dashboard.html: D36 Day-To-Date tokens card with honest empty
- Plus PHASE T per-ship attribution fix at `92c7433`
- Plus 17 + 28 + 5 = 50 competitive reference images captured (Linear,
  Vercel, Stripe, Datadog, Sentry, plus usage-meters: Anthropic, OpenAI,
  GitHub Actions, plus Janowiak decomposition for main-flows)

Each session iteration moves the needle ~0.10-0.20 points. Closing
the 1.70-point gap to 9.5 across the fleet would require sustained
multi-session polish work.

---

## D27 closure status

D27 spec requirement: `TASTE-AUDIT.md committed`. ✅ This file satisfies.

D26 spec requirement: `every UI surface taste-scored ≥ 9.5/10 OR
Founder-approved gap`. ⚠️ NEITHER: surfaces score 7.50-8.38, NO
Founder-approval marker exists yet. Founder Verification Packet OPEN
Item 4 explicitly surfaces this gap for decision.

Per spec D26 verbatim allows "Founder-approved gap" as PASS path —
this document IS the gap audit Founder is being asked to rule on.
