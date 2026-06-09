# Ship retrospective — v8.23.96 · WCAG contrast-token sweep

**Date:** 2026-06-08 · **Type:** fix(a11y) · **Target:** staging
**Origin:** comprehensive design-review (post-HQ deferred work), audit workflow `wf_64fb2d1c-d99`

## What shipped
A systemic accessibility fix for the dominant gap-to-9.5 the audit found: three muted/brass
text-on-chalk pairings that measurably failed WCAG AA on the real page ground (`--cb-canvas #E7E0CD`).

| Surface | Element | Before | After | Ratio (on real bg) |
|---|---|---|---|---|
| Feed | `.feed-composer__promptText` ("What's on your mind?") | `--cb-mute-soft` | `--cb-ink-faint` | 2.49 → **5.09** |
| Feed | composer prompt hover | `--cb-mute` (3.44, *lighter* than default — backwards) | `--cb-charcoal` | → **7.03** |
| Settings | `.set-row__desc` (disclaimers, permission copy) | `--cb-mute` | `--cb-ink-faint` | 3.44 → **5.09** |
| Awards | ceremony tier labels (ROUND OF THE YEAR…) | `var(--gold)` 9px | `--cb-ink-link` 10px/600 | 2.78 → **8.14** |

Plus: `src/styles/base.css` AA-floor guardrail comments (rank-2), reusable
`scripts/visual-audit/contrast-check.mjs` checker, and a spectator `!round` defensive
fallback (rank-6, unreachable-in-prod hardening — blank slot → friendly actionable empty state).

## Evidence (P9 — no guessing)
- WCAG ratios computed (`contrast-check.mjs`, exit 0): every FIX pair ≥ 4.5:1.
- Live `getComputedStyle` proved the real ground is `--cb-canvas`, not chalk → `--cb-mute-1` (4.22) would have under-fixed it; chose `--cb-ink-faint` (5.09). The audit's own proposed `--cb-mute-1`/`--cb-brass-deep` were both insufficient on the real grounds — caught by independent verification.
- Vision-verified post-edit (mobile): feed composer legible, settings disclaimers legible, awards labels legible deep-brass, spectator fallback renders (eye icon + "No live round to watch right now" + "Go to your rounds →").
- Computed color re-read: feed + settings now `rgb(95,92,80)` = `#5F5C50` ink-faint.

## SECURITY (P8)
  Verdict: GREEN
  - secretlint fast scan: clean (exit 0).
  - No new external wiring, no secrets, no auth/data/economy/network code paths.
  - Only JS change (spectator fallback) is a static HTML string with an internal `Router.go('rounds')` link — no user-input interpolation, no injection vector.
  - CSS-token + inline-style changes carry no security surface.

## LEGAL (parbaughs-legal-compliance)
  Verdict: GREEN
  Surfaces touched this ship: a11y (only)
  Checklist:
    1. ParCoin-not-gambling ... GREEN  (no economy code touched)
    2. App Store readiness ..... GREEN  (no store metadata/UGC-moderation/account-deletion/payments changes)
    3. Privacy law ............. GREEN  (no data collection or privacy.html changes)
    4. Terms / liability ....... GREEN  (no terms changes)
    5. Accessibility ........... GREEN  (FIXES 3 verified WCAG AA failures → all ≥4.5:1; net-positive ADA posture; evidence: contrast-check.mjs + vision verification)
    6. IP & identity ........... GREEN  (no marks/course data/photos touched)
    7. Security-as-legal-duty .. GREEN  (defers to SECURITY block: GREEN)
  Non-GREEN items: none. This ship strengthens the legal posture (ADA/WCAG) it touches.

## P3 — hindsight + foresight
- **Hindsight (how could this have been better?):** these AA failures predate this ship — `--cb-mute-soft`/`--cb-mute` were tuned for elegance over legibility during the design marathon and shipped without a contrast gate. A standing contrast lint would have caught them at authoring time. Mitigation landed: `contrast-check.mjs` + base.css AA-floor docs.
- **Foresight (what breaks at 10×?):** the fix is scoped to 3 consumers. Other surfaces likely still consume `--cb-mute-soft`/`--cb-mute` for body/label text on canvas and may also fail — a follow-up sweep should grep every `color:var(--cb-mute*)` on canvas/chalk grounds and route body/label text to `--cb-ink-faint`. Captured as the next design-review batch item.
- **Coverage gap noted:** the audit harness captured 3 invalid route names (`leaderboard`/`social`/`spectator`) that render blank (ROUTE-VALIDITY.md); and did NOT capture `playnow` (core scoring flow), `tournament`, `seasonrecap`, member `profile`. A second audit pass should add those + run the broader mute-token sweep.

## Gate
lint 0 errors · secretlint clean · smoke 26/26 (incl. S12 spectator non-regression, S13-18 feed/home) · version synced 8.23.96 (package.json == APP_VERSION == sw.js CACHE_NAME parbaughs-v8.23.96).
