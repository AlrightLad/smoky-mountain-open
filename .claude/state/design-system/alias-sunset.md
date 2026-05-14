---
doc: alias-layer sunset checklist
date: 2026-05-13 (created) / 2026-05-14 (DC-8 recount)
authored_by: claude-code
trigger: Phase 0 of Dashboard Consolidation; DC-8 update
---

# Alias Layer — Sunset Checklist

The legacy alias `:root` block in `docs/reports/_assets/dashboard-shell.css`
maps Theme A token names (`--bg-page`, `--accent-brass`, `--text-tertiary`,
etc.) to their PARBAUGHS Theme B equivalents (`--pb-billiard-green-900`,
`--pb-brass-500`, `--pb-chalk-400`).

**Status after DC-8:** alias layer **NOT yet sunset**. Three dashboards
(proposals, discussion-bubbles, main-flows) still consume legacy tokens
inside protected-layout body CSS where migration risks visual regression
without proportionate gain. Alias layer **stays in place**; sunset
deferred to a future cleanup ship that focuses specifically on per-page
inline-CSS migration to `--pb-*` direct.

## Per-dashboard alias-token reference count (DC-8 recount, 2026-05-14)

Counts measured by:
```
grep -oE 'var\(--(bg-(page|card|elevated|input|raised)|accent-(brass|moss|claret|teal|amber|violet|achievement)|text-(primary|secondary|tertiary|muted|faint|inverse)|border-(subtle|strong)|success|warning|danger|info|font-sans|duration-default|ease-default|shadow-card)\)' <file>
```

| Dashboard | Pre DC-5 | Post DC-8 | Trend | Migration status |
|---|---:|---:|---|---|
| `dashboard.html` | 0 | **0** | flat | **Fully migrated** (DC-3 rewrite) |
| `token-usage.html` | 2 | **2** | flat | Nearly migrated (DC-4 rewrite); 2 leftover in inline-style attrs — DC-8 deferred |
| `activity.html` | 26 | **5** | ↓ -21 | Mostly migrated (DC-5 rewrite ditched scenario-dot variables); 5 leftover in styled empty-state JS strings |
| `index.html` | 41 | **25** | ↓ -16 | Partially migrated (DC-6 chrome migration); .dashboard-card + .quick-link page-specific CSS still on alias tokens |
| `main-flows.html` | 59 | **57** | ↓ -2 | Protected-layout body CSS uses alias tokens; migration would touch ~100 lines of working architecture-grid code. Risk/value unfavorable. |
| `proposals.html` | 59 | **60** | flat | DC-5 chrome migration + DC-FIX1 added .pb-select; proposal-card body CSS still references --bg-card / --accent-brass via alias. Same risk/value calc as main-flows. |
| `discussion-bubbles.html` | 82 | **82** | flat | Protected-layout (.db-app + .db-rail + transcript) — explicitly carved out from migration per Phase 6.5 |
| `design-system.html` | 48 | **48** | flat | The 48 refs are SEMANTIC aliases (`--text-primary`, `--bg-surface`, etc.) that resolve to the same hex via design-tokens.css's own semantic-alias layer. Not blocking sunset. |

## Sunset decision (DC-8)

The alias `:root` block in `dashboard-shell.css` **stays**. Reasoning:

1. **Protected layouts** (discussion-bubbles + main-flows + design-system showcase) contain the bulk of remaining alias refs. Founder spec explicitly carved these out from migration. Their inline CSS can't be touched without breaking the structural contract.
2. **Risk/value** for proposals.html + index.html page-specific CSS: migrating the proposal-card / dashboard-card / quick-link body styles would touch ~50-100 lines per page of working code. The visual outcome is identical (alias resolves to same hex). The migration value is purely hygienic — no member impact, no agent-rendering impact.
3. **Design-system.html's 48 refs** are semantic aliases already aligned with PARBAUGHS palette. They never blocked sunset; they're just counted by the grep.

Effective count blocking sunset: ~150 refs across activity (5), token-usage (2), proposals (60), index (25), main-flows (57) — most concentrated in protected-layout pages or page-specific bodies where migration risk outweighs gain.

## Sunset path (revised)

A future cleanup ship would target ONLY the non-protected page-specific CSS:
- `proposals.html` `.proposal-card` + `.help-banner` + `.summary-bar` legacy → `--pb-*` direct
- `index.html` `.dashboard-card` + `.quick-link` + `.index-footer` → `--pb-*` direct
- `activity.html` 5 leftover refs in JS-emitted empty-state strings → simple search/replace
- `token-usage.html` 2 leftover refs → small Edit

This would drop the non-protected count to ~0 while leaving main-flows + discussion-bubbles + design-system protected-layout body CSS alone. At that point the alias `:root` block could be scoped down to ONLY the protected pages, or kept as-is for forward-compatibility.

## What this checklist does NOT cover

- Tokens that are **canonical** in both layers (e.g., `--text-primary`,
  `--bg-page`) are already declared in `design-tokens.css` as semantic
  aliases pointing to `--pb-*`. Those resolve correctly with OR without
  the alias `:root` block in dashboard-shell.css.
- The grep does not catch `--pb-*` direct references — those are the
  canonical layer and accumulate as migration progresses.

## Sunset criterion (revised, DC-8)

The alias `:root` block in `dashboard-shell.css` is deleted when:

- [ ] Non-protected dashboards (dashboard, activity, proposals, index, token-usage) all report alias-ref count == 0
- [ ] Protected dashboards (discussion-bubbles, main-flows, design-system) are explicitly opted into the alias layer's continued life
- [ ] Round-trip `[theme]` check still passes (no raw hex regression)
- [ ] Visual regression vs the DC-VA baseline shows no detectable change post-deletion

Current status: 3 of 5 non-protected dashboards still have alias refs (activity 5, proposals 60, index 25). Cleanup ship not authored.
