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
