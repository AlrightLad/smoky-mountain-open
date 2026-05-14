---
name: design-bot-v2
description: PARBAUGHS design-bot — Phase 1 hardening. Enforces design-tokens.css consumption + brass scarcity + 3-size hierarchy + anti-pattern catalog on every UI work touching .html / .css / .jsx. Critic gates on this skill's audit checklist for any commit changing those file types.
trigger: ANY ship work that modifies a file under docs/reports/, src/styles/, src/pages/, or that adds inline styles to any HTML file
owner: design-bot (orchestration team subagent)
tier: T1 (skill content drafted at Phase 1)
status: Draft — governance hook blocks orchestration-team writes to .claude/skills/. Founder applies when ratifying the design system. Until applied, design-bot operates from this draft.
---

# design-bot Skill v2 — Phase 1 Hardening

> **Apply path:** Founder applies this to `.claude/skills/parbaughs-design-bot.md` when ratifying the design system foundation. Until then, design-bot subagent (when dispatched) reads this draft directly.

## When this skill fires

The skill activates BEFORE any UI work (pre-work checklist), DURING the work (binding constraints), and at completion (audit checklist). Critic gates on the audit checklist for any commit touching:

- `docs/reports/**/*.html`
- `docs/reports/**/*.css`
- `src/pages/**/*.js` (if introducing inline styles or color/spacing values)
- `src/styles/**/*.css`
- Any other file that consumes design tokens

## Source of truth (read these on every fire)

1. `.claude/state/design-system/aesthetic-brief.md` — what PARBAUGHS looks like in concrete terms
2. `docs/reports/_assets/design-tokens.css` — the canonical token file
3. `docs/reports/_assets/design-system-components.css` — the primitive component library
4. `docs/reports/design-system.html` — visual reference, composition examples, anti-patterns

## PRE-WORK checklist (before any code is written)

```
- [ ] Read design-tokens.css fully — confirm which tokens apply to this work
- [ ] Read the composition examples in design-system.html for the closest matching UI pattern
- [ ] Identify 3+ specific tokens this work will consume; document them in the
      ship plan / PR notes
- [ ] If a needed value DOES NOT have a token, the work STOPS here. Author a
      token-add proposal at .claude/state/proposals/pending/ FIRST. Do NOT
      write raw values "for now."
```

## DURING-WORK binding constraints

These are not suggestions. The round-trip test fails on every violation.

```
1. ZERO hardcoded color values (raw #RRGGBB, rgb(), hsl(), oklch() literal).
   Every color comes from a token via var(--*).

2. ZERO hardcoded font-size or padding/margin values (raw 16px, 1.25rem
   literal). Every dimension comes from a --text-* / --space-* token.

3. ZERO hardcoded duration values (raw 200ms, 0.3s literal). Every duration
   comes from a --duration-* token.

4. Type hierarchy on any single screen has AT MOST 3 distinct sizes
   (display + heading + body usually; sometimes + caption — never 5+).

5. Brass (--accent-achievement / --pb-brass-*) appears on AT MOST 2 elements
   per screen. If you reach for brass on a third element, fix the hierarchy
   with weight/size first.

6. Motion durations use ONE primary duration per surface. Mixing --duration-fast
   on hover and --duration-slow on the same element's transition feels broken.

7. Component composition uses .pb-* primitives where they exist. If a primitive
   doesn't exist and you need it, author the primitive in
   design-system-components.css FIRST, then consume it.

8. Every interactive element MUST have :hover, :focus-visible, :active, AND
   :disabled states defined. Default-state-only components are incomplete.

9. SVG icons only — no emojis (W1.S1 LB1, locked). One exception: ⛳ on the
   Caddy bot.

10. Reduced-motion users get instant transitions on everything except
    accessibility focus rings. The token file's @media (prefers-reduced-motion)
    rule covers this globally; don't fight it.
```

## POST-WORK audit checklist (Critic gates on this)

```
- [ ] grep '#[0-9a-fA-F]\{3,8\}' <changed-files> | grep -v design-tokens.css
      returns EMPTY (no raw hex outside the token file)
- [ ] grep -E '[0-9]+px' <changed-files> | grep -v design-tokens.css | grep -v 'token comment'
      returns EMPTY (no raw px outside the token file)
- [ ] grep -E '[0-9]+ms' <changed-files> | grep -v design-tokens.css
      returns EMPTY (no raw ms outside the token file)
- [ ] All interactive elements have :hover state defined
- [ ] All keyboard-accessible elements have :focus-visible state defined
- [ ] Text contrast meets WCAG AA against background (verify visually; future
      automation: contrast-checker script in scripts/)
- [ ] The closest composition example from design-system.html is cited in the
      ship report (e.g., "this row composes pattern from § Composition examples
      / Leaderboard")
- [ ] Brass scarcity holds: at most 2 brass elements per screen
- [ ] No anti-patterns from design-system.html § Anti-patterns
- [ ] Round-trip test [design-tokens] section passes post-regen
```

## AUDIT FAILURE

Any unchecked item returns the work to design-bot for revision. Critic does NOT advance the ship to close. A handoff is written for the next cycle citing the specific items failed.

## What design-bot does NOT do

- design-bot does NOT write code. It dispatches an audit and either passes the
  work forward or returns it. Engineer writes code.
- design-bot does NOT amend the token file unilaterally. Token additions require
  a token-add proposal at `.claude/state/proposals/pending/` for Founder review.
- design-bot does NOT override Founder-ratified design decisions. If aesthetic-
  brief.md and the design request conflict, the brief wins until Founder
  ratifies an amendment.

## Cross-references

- `docs/reports/_assets/design-tokens.css` (token file — Founder applies; tokens
  themselves were drafted at this path during Phase 1 build)
- `docs/reports/_assets/design-system-components.css` (component library)
- `docs/reports/design-system.html` (visual reference, ANTI-PATTERN catalog)
- `.claude/state/design-system/aesthetic-brief.md` (north star)
- `.claude/state/wave-zero-dry-run/remediation/proposed-METRIC_INTEGRITY_PROTOCOL.md`
  § 3.1 (Critic pre-close audit; design-bot v2 audit checklist becomes a new
  block in that section)

---

*Skill draft authored 2026-05-13 by orchestration-team during Track B Phase 1.
Awaiting Founder review + ratification + move to `.claude/skills/parbaughs-design-bot.md`.*


# Proposed: DASHBOARD PR CHECKLIST appended to design-bot skill

Add the following block to `.claude/skills/parbaughs-design-bot.md`
immediately after the existing "## POST-WORK audit checklist" section.

The block codifies the canonical dashboard contract established across
DC-1 through DC-9. Critic uses this as the gate for every future
dashboard PR.

---

## DASHBOARD PR CHECKLIST (Phase 6 / DC-7)

Critic MUST gate on this checklist for any PR that creates or modifies
a dashboard under `docs/reports/*.html`. No exceptions.

```
- [ ] No new charts. <canvas>, Chart.js, D3, chart.umd references absent
      from the dashboard HTML.
      EXCEPTIONS (carved out by directive):
        - token-usage.html SVG donut (pure SVG, not canvas)
        - main-flows.html SVG arrow overlay (functional documentation)
- [ ] Dashboard imports `_assets/dashboard-shell.css`. No other dashboard
      chrome import. Legacy `_assets/dashboard.css` removed unless the
      page is on the alias-sunset deferral list.
- [ ] Chrome uses canonical shell classes:
        .pb-page-header / .pb-page-nav / .pb-page-brand / .pb-page-nav-links
        .pb-page-main (or .pb-page-main.is-wide for main-flows)
        .pb-page-title-row / .pb-page-title / .pb-page-subtitle / .pb-page-meta
        .pb-section / .pb-section-title (no .section-header legacy)
        .pb-kpi-grid / .pb-kpi-card (no .metric / .status-tile / .summary-count)
        .pb-table / .pb-table-wrap (no .data-table)
        .pb-page-footer (no .report-footer)
- [ ] Form controls (if any) use .pb-select / .pb-input / .pb-textarea /
      .pb-filter-bar / .pb-filter-label, never native <select> + browser-
      default styling.
- [ ] Page renders cleanly at 4 viewports: 375 / 768 / 1280 / 1920px.
      Tables horizontal-scroll inside .pb-table-wrap, not text-wrap.
      KPI grid stacks 1 column at <600px, 2 columns at <1024px.
- [ ] Page-specific inline <style> block under 30 lines. Beyond budget,
      extract to its own _assets/*.css (e.g., proposals-page.css). The
      30-line budget excludes scoped data tokens (e.g., main-flows.html
      --col-* column-color tokens) which round-trip [theme] exempts.
- [ ] PROTECTED LAYOUTS not modified:
        discussion-bubbles.html .db-app 2-panel master/detail
        main-flows.html .mf-workspace + SVG arrows + flow rail + steps panel
        design-system.html showcase (swatches + type ladder + composition)
      HTML comments marking these protected sections preserved.
- [ ] Round-trip test passes:
        [theme] no raw hex in <style> blocks
        [no-charts] no canvas/Chart.js/D3 references
        [protected-layouts] sentinels for the three protected pages
        [pause-discipline] no fictional 3.5M / weekly_budget_cap / budget_pct
        Plus all other existing checks (nav, transcript, lifecycle, etc.)
- [ ] If this is a NEW dashboard, it's listed in:
        - scripts/inject-page-nav.py (NAV_LINKS + TARGETS)
        - scripts/regen-all.{ps1,sh} (if it needs regen)
        - tests/round-trip-test.py [theme] + [no-charts] scope
        - .claude/state/design-system/alias-sunset.md (alias-ref baseline)
        - scripts/visual-audit/capture-dashboards.mjs PAGES array
- [ ] No fictional cap constants added (per Phase 6.6). Pause discipline
      stays op-count-based until PROP-003 ships real metering.
```

Any unchecked item returns the work to the implementing agent. Critic
does NOT advance the ship to close on a dashboard PR until every box
is checked.

---

## How to apply

1. Copy the block above into `.claude/skills/parbaughs-design-bot.md`
   after the existing POST-WORK audit checklist (before AUDIT FAILURE).
2. Bump the `.APPROVAL.md` sidecar's version timestamp.
3. Round-trip + visual audit unchanged (this is a Critic-side protocol
   amendment; no code or HTML changes).
