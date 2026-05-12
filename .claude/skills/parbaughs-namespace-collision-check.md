---
name: parbaughs-namespace-collision-check
description: Cross-surface grep for data-* attribute collisions + global helper name conflicts. Encodes Founder memory P9 — grep src/core + src/styles before adding data-* attrs; semantic prefixes (data-likes-count, etc.) for feature state.
trigger: Adding any new data-* attribute, global window.* state, or global helper function
owner: Engineer (before write), Critic (audit at review)
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-namespace-collision-check

Avoid namespace collisions with platform conventions. Encodes Founder feedback memory P9.

## When to invoke

- Adding a new `data-*` HTML attribute (rendered into the DOM)
- Adding a global `window.*` or top-level helper function
- Adding a CSS class name that could conflict with an existing component
- Renaming any of the above

## When NOT to invoke

- Local variables inside a function (no namespace concern)
- Inline styles or scoped CSS-in-JS (different scope)
- Documentation file edits

## Procedure

1. **Identify the proposed name.** Write it down before running greps.

2. **Grep `src/core/` first.** This is platform infrastructure; collisions here propagate widely.
   - `Grep -rn "data-<your-attr>" src/core/`
   - `Grep -rn "<helperName>" src/core/`

3. **Grep `src/styles/` for CSS-class collisions.** Both base.css and components.css.
   - `Grep -rn ".<className>" src/styles/`
   - Check for selector overlap (e.g., `.member-card` vs `.member-row` — adjacent surfaces use adjacent names)

4. **Grep `src/pages/` for prior use.** May reveal a feature-specific name already taken.
   - `Grep -rn "data-<your-attr>" src/pages/`

5. **Use semantic prefixes for feature state.** Per Founder P9 feedback memory:
   - Feature state attrs: `data-likes-count`, `data-comments-count`, `data-rsvp-status`
   - NOT generic: `data-count`, `data-state` (these collide with `initCountAnimations` `[data-count]` attribute used by the animate.js module)
   - The animate.js module DOES claim `data-count` as a platform attribute — never use it for feature state

6. **Document the chosen name + 3-result grep evidence** in the Ship Plan's Architecture section.

## Known platform-claimed names

| Name | Owner | Notes |
|---|---|---|
| `data-count` | `src/core/animate.js` `initCountAnimations` | Number animation target; do NOT reuse for feature state |
| `data-page` | `src/core/router.js` | Router page container; selectors like `[data-page="members"]` |
| `data-ptab` | `src/pages/members.js` | Profile tab dispatch attr |
| `data-chart-id` + `data-pid` | Chart range toggles | Per `src/pages/members.js` `_renderChartRangeToggle` |
| `data-stat` | Stat box pattern | `data-stat="round-count"` member profile |
| `data-render-path`, `-band`, `-width`, `-page` | `src/core/page-shell.js` | Debug stamps |
| `data-weather-site` | Weather pill | Page shell masthead slot |
| `data-name` | Member card filter | Members list search |
| `data-render-error` | Page shell fallback | Stamps on try/catch path |

## Anti-patterns

- "I'll just use `data-state`" — collides with multiple existing patterns; use feature-prefix instead
- Grep only `src/pages/` and miss `src/core/` — platform pattern collisions are worse than page-level
- Skipping CSS class grep because "I'm adding a data attr" — CSS may select on data attrs
- Renaming without sweeping callsites — symbol references break silently

## References

- `feedback_p9_namespace_collisions.md` (Founder memory)
- `src/core/animate.js` (claims `data-count`)
- `src/core/router.js` (claims `data-page`)
- `src/core/page-shell.js` (claims `data-render-*`)
- PHASE_1_GOVERNANCE_CRITIQUE.md GAP-2 (this skill encodes the audit pattern)
