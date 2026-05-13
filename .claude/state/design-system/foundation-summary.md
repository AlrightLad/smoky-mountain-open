# Track B Phase 1 — Design System Foundation: Build Summary

**Run:** 2026-05-13 (Founder URGENT — Track B design-hardening Phase 1)
**Outcome:** **Foundation tokens + components + reference page + design-bot v2 skill all shipped.** Round-trip test gates on the token discipline. Migration plan for Phase 2 (ops-dashboard re-skin) authored but NOT executed.

---

## Aesthetic brief synthesis (Step 0)

PARBAUGHS is **a country club after hours, run by people who know the game.** Premium without being precious. Restrained without being austere. Three colors do the real work; brass is scarce on purpose. Type comes from a system stack with intentional weight + size hierarchy. Motion serves comprehension, never decoration.

Density: closer to Strava (rich content, scannable) than to Linear (whitespace-heavy). Whoop's data-density without color noise is the calibration target.

Full brief: `.claude/state/design-system/aesthetic-brief.md`.

## Token count by category (design-tokens.css)

| Category | Count | Notable tokens |
|----------|------:|----------------|
| **Color — primary palette** | 14 | --pb-billiard-green-{900..500}, --pb-chalk-{50..500}, --pb-brass-{300,500,700}, --pb-leather-{700,900} |
| **Color — semantic status** | 4 | --pb-success / --pb-warning / --pb-error / --pb-info (moss / amber / claret / teal) |
| **Color — semantic aliases** | 13 | --bg-page, --bg-surface, --bg-raised, --bg-interactive, --bg-pressed, --text-primary, --text-secondary, --text-muted, --text-faint, --text-placeholder, --accent-achievement, --border-subtle, --border-strong, --border-brass |
| **Typography — families** | 4 | --font-display, --font-body, --font-mono, --font-numeric (tabular-nums) |
| **Typography — scale** | 9 | --text-2xs (10px) → --text-display (48px), modular 1.25 |
| **Typography — weight** | 4 | --weight-regular/medium/semibold/bold |
| **Typography — line-height** | 4 | --lh-tight/snug/normal/relaxed |
| **Typography — letter-spacing** | 4 | --tracking-tight/normal/wide/wider |
| **Space scale** | 10 | --space-0 → --space-9 (4px base) |
| **Radius** | 4 | --radius-sm/md/lg/pill |
| **Elevation** | 4 | --shadow-sm/md/lg + --shadow-glow-brass (scarce) |
| **Motion durations** | 4 | --duration-instant/fast/medium/slow |
| **Motion easings** | 3 | --ease-out (default) / --ease-in-out / --ease-spring (celebration only) |
| **Layout** | 3 | --col-gap, --row-gap, --max-content |
| **Z-index** | 7 | --z-base → --z-toast (named tiers) |
| **Reduced-motion** | global override | every transition + animation disabled when prefers-reduced-motion |

**Every token has a block comment** documenting: when to use, when NOT to use, examples in PARBAUGHS context.

## Component primitives shipped

`docs/reports/_assets/design-system-components.css`:

- **Surfaces:** `.pb-surface`, `--raised`, `--interactive` (default / hover / focus-visible / active states)
- **Layout:** `.pb-stack` + tight/snug/loose, `.pb-inline` + tight/loose, `.pb-grid`
- **Typography utilities:** `.pb-text-display`, `--h1`, `--h2`, `--h3`, `--body`, `--caption`, `--micro`, `--numeric` (tabular) + color modifiers
- **Buttons:** `.pb-button` + `--primary` (chalk-on-green) / `--secondary` (outlined) / `--ghost` / `--destructive` (claret-outlined). Brass is intentionally NOT a button variant — brass is for achievement contexts as an accent, not a generic button color.
- **Badges:** `.pb-badge` + `--brass` / `--moss` / `--claret` / `--amber` / `--teal` / `--neutral`
- **Forms:** `.pb-input`, `.pb-select`, `.pb-textarea` — all with hover / focus-visible / disabled
- **Dividers:** `.pb-divider`, `--strong`, `--brass` (the editorial brass underline — 48px wide, used once per page max)
- **Scroll:** `.pb-scroll` (custom scrollbar styling for overflow surfaces)
- **Links:** `.pb-link` + `--subtle` / `--strong`

Every interactive primitive defines default / `:hover` / `:focus-visible` / `:active` / `:disabled` states. No primitive is incomplete.

## Reference page

**Live URL:** `file:///C:/Users/Zach/smoky-mountain-open/docs/reports/design-system.html`

Sections rendered:
1. **Hero** — one-sentence brand statement with brass accent on key word
2. **Color** — 16 swatches grouped by family (billiard-green / chalk / brass / semantic-status), each with hex value + usage note
3. **Typography** — 9 type-scale tokens rendered as live samples with meta annotations
4. **Space** — 8 visual-scale rows showing exact-width bars at each space token
5. **Radius + elevation** — 8 demo tiles (4 radius + 4 shadow including the brass glow)
6. **Motion** — 3 interactive demo buttons (hover to feel the easing curve at the right duration)
7. **Component primitives** — buttons, badges, inputs, links rendered in all their states
8. **Composition examples** — 4 actual UI mockups: hole-by-hole scorecard / league leaderboard / discussion-bubble thread item / proposal review card
9. **Anti-patterns** — 7 explicit "don't do this" rules with rationales, each clearly marked claret

The page is the team's daily reference and a test of whether the foundation is good. If the composition examples don't read elegant, the foundation needs refinement.

## Design-bot skill upgrade (proposed v2)

Draft at `.claude/state/wave-zero-dry-run/remediation/proposed-design-bot-skill-v2.md`. Founder applies to `.claude/skills/parbaughs-design-bot.md` when ratifying the design system.

The skill activates on any work touching `docs/reports/**/*.html`, `docs/reports/**/*.css`, `src/pages/**/*.js` (inline styles), or `src/styles/**/*.css`. It enforces three phases:

- **PRE-WORK:** read aesthetic-brief.md + design-tokens.css + composition examples. Identify 3+ tokens this work will consume. If a needed value lacks a token, STOP and propose the token-add first.
- **DURING-WORK (10 binding constraints):** zero raw hex/px/ms; 3-size hierarchy max per screen; brass appears at most 2 places per screen; one duration per surface; SVG-only iconography; etc.
- **POST-WORK audit checklist (Critic gates):** 8 items including the round-trip `[design-tokens]` section passing.

Audit failure returns the work to design-bot for revision; ship does not close.

## Round-trip test extension

`tests/round-trip-test.py` `[design-tokens]` section:

- design-system.html (exemplar) CSS-context check: every color in `<style>` blocks and `style="..."` attrs must be a `var(--*)` reference. Hex values in text content (swatch documentation) are permitted.
- design-tokens.css declares 11 required canonical tokens (sanity check).
- Legacy dashboards' raw-hex / raw-px / raw-ms counts reported informationally — currently `dashboard.html` 5 px, `activity.html` 13 px, `proposals.html` 17 px, `discussion-bubbles.html` 45 px, `main-flows.html` 6 hex + 48 px + 1 ms, `index.html` 20 px. These are Phase 2 migration scope.

Result: **ALL CHECKS PASSED.**

## Migration plan for Phase 2

`.claude/state/design-system/migration-plan-phase-2.md` — 4-stage plan (alias layer / per-file migration / inline-CSS consolidation / enforcement tightening). Migration order: index → dashboard → activity → proposals → discussion-bubbles → main-flows. Each file is its own commit; revertible. Migration is NOT executed in Phase 1.

## Open questions for Founder

1. **Custom font loading (Maison Neue / Tiempos territory) vs system stack.** Phase 1 ships system stack for performance + simplicity. Founder may ratify a custom-font addition in a later phase; that would also expand the design-tokens.css `--font-display` token to load a webfont with `font-display: swap` and a system fallback.

2. **Light theme support — deferred or required for Phase 2?** Aesthetic-brief.md § "Non-goals (Phase 1)" defers it. `design-tokens.css` already has a `[data-theme="light"]` empty block as the future attachment point. Founder direction needed at Phase 2 kickoff.

3. **Brand wordmark / logo treatment.** Out of scope for the foundation; that's a brand-design decision (likely needing a designer or Founder visual direction) separate from the token system. Phase 1 does not establish a logo.

4. **`--col-actor`, `--col-client`, etc. (main-flows.html architecture column tokens) promotion.** Currently page-local; should they become canonical `--pb-*` tokens in design-tokens.css (since they're brand-defining for the architecture view)? Decided at Phase 2 main-flows migration.

5. **Phase 2 visual diff tolerance.** Pixel-identical layout + only palette shift, or 5% tolerance for warming palette + minor layout settle? Migration-plan-phase-2.md § "Visual regression check approach" defers this; pragmatic default is "5% palette warming OK, no layout shifts."

## Files changed in this build

**New files:**
- `docs/reports/_assets/design-tokens.css` — canonical design token file
- `docs/reports/_assets/design-system-components.css` — primitive component library
- `docs/reports/design-system.html` — visual showcase + reference page
- `.claude/state/design-system/aesthetic-brief.md` — north-star aesthetic brief
- `.claude/state/design-system/migration-plan-phase-2.md` — migration plan for ops dashboards
- `.claude/state/design-system/foundation-summary.md` — this file
- `.claude/state/wave-zero-dry-run/remediation/proposed-design-bot-skill-v2.md` — design-bot v2 skill draft

**Modified files:**
- `tests/round-trip-test.py` — `[design-tokens]` section added (exemplar CSS check + token presence + legacy informational scan)

## Discipline notes

- **Defensive pause heuristic respected** — long session; no API errors; pacing maintained.
- **Token file is the canonical source** — every value in design-system.html's CSS uses `var(--*)`. Hex values appearing in text content of the page are documentation strings (intentional — the swatch labels literally show the hex values).
- **NOT pushed** — local commits only.
- **NOT migrated** — Phase 2 re-skins the existing dashboards. Phase 1 is foundation only.
- **NOT applied** — `design-bot v2 skill` and `aesthetic-brief.md` await Founder ratification; the orchestration team operates from drafts at the `.claude/state/wave-zero-dry-run/remediation/` and `.claude/state/design-system/` paths until then.

## Cross-references

- Aesthetic brief: `.claude/state/design-system/aesthetic-brief.md`
- Canonical tokens: `docs/reports/_assets/design-tokens.css`
- Primitives: `docs/reports/_assets/design-system-components.css`
- Reference page: `docs/reports/design-system.html`
- Design-bot v2 skill: `.claude/state/wave-zero-dry-run/remediation/proposed-design-bot-skill-v2.md`
- Migration plan: `.claude/state/design-system/migration-plan-phase-2.md`
- Phase 2 informational baseline: round-trip test `[design-tokens]` output above
