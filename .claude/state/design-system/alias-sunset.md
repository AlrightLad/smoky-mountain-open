---
doc: alias-layer sunset checklist
date: 2026-05-13
authored_by: claude-code
trigger: Phase 0 of Dashboard Consolidation
---

# Alias Layer — Sunset Checklist

The legacy alias `:root` block in `docs/reports/_assets/dashboard-shell.css`
maps Theme A token names (`--bg-page`, `--accent-brass`, `--text-tertiary`,
etc.) to their PARBAUGHS Theme B equivalents (`--pb-billiard-green-900`,
`--pb-brass-500`, `--pb-chalk-400`).

The alias layer is **temporary**. It lets dashboards adopt the canonical
theme without immediate HTML edits. As each dashboard migrates its inline
styles to consume `--pb-*` directly, its alias-token count drops to zero.
When **all** dashboards are at zero, the alias block can be deleted.

## Per-dashboard alias-token reference count (2026-05-13)

Counts measured by:
```
grep -oE 'var\(--(bg-(page|card|elevated|input|raised)|accent-(brass|moss|claret|teal|amber|violet|achievement)|text-(primary|secondary|tertiary|muted|faint|inverse)|border-(subtle|strong)|success|warning|danger|info|font-sans|duration-default|ease-default|shadow-card)\)' <file>
```

| Dashboard | Alias refs | Migration status |
|---|---:|---|
| `dashboard.html` | 0 | **Fully migrated** (DC-3 rewrite consumes `--pb-*` directly) |
| `token-usage.html` | 2 | Nearly migrated (DC-4 rewrite mostly on `--pb-*`; 2 leftover references in inline style attrs — sweep in DC-8) |
| `activity.html` | 26 | Pending DC-5 |
| `proposals.html` | 59 | Pending DC-5 |
| `discussion-bubbles.html` | 82 | Pending DC-5 (protected 2-panel keeps own page-specific CSS — alias refs may persist past DC-5 in legacy class names) |
| `main-flows.html` | 59 | Pending DC-6 (protected grid keeps own page-specific CSS — alias refs may persist past DC-6 inside the protected block) |
| `design-system.html` | 48 | Apparent contradiction: design-system.html should be `--pb-*`-native. Most of the 48 are aliased semantic names (`--text-primary`, `--text-secondary`) that happen to also live in design-tokens.css's semantic alias block. These resolve to the SAME hex even without the alias-shell layer, so they're not blocking sunset. Will validate in DC-6. |
| `index.html` | 41 | Pending DC-6 |

## Sunset path

1. **DC-5** — activity / proposals / bubbles inline styles migrated to
   `var(--pb-*)` directly where they're not protected-layout content.
   Bubbles 2-panel page-specific CSS may keep alias references inside
   the protected block; that's acceptable.
2. **DC-6** — index / main-flows / design-system inline styles migrated
   the same way. Design-system clarifies which 48 refs are "actually
   `--pb-*` semantic aliases" vs "actually legacy aliases needing
   migration".
3. **DC-8** — token-usage.html 2 leftover refs swept. Final count
   measured. If everything reads zero, the alias `:root` block in
   `dashboard-shell.css` is **deleted** in the DC-8 cleanup commit.
4. **DC-8 cleanup also**: `docs/reports/_assets/dashboard.css` itself
   becomes a candidate for deletion (it only matters when alias tokens
   resolve to dashboard.css's hex declarations; once aliases are gone,
   the file's only purpose is component classes `.metric`, `.card`, etc.
   that are also no longer referenced).

## How to verify a dashboard is fully migrated

```
grep -oE 'var\(--(bg-(page|card|elevated|input|raised)|accent-(brass|moss|claret|teal|amber|violet|achievement)|text-(primary|secondary|tertiary|muted|faint|inverse)|border-(subtle|strong)|success|warning|danger|info|font-sans|duration-default|ease-default|shadow-card)\)' docs/reports/<NAME>.html | wc -l
```

Expect `0`. If non-zero, the dashboard still has alias-layer references
in its inline styles. Continue migration.

## What this checklist does NOT cover

- Tokens that are **canonical** in both layers (e.g., `--text-primary`,
  `--bg-page`) are already declared in `design-tokens.css` as semantic
  aliases pointing to `--pb-*`. Those resolve correctly with OR without
  the alias `:root` block in dashboard-shell.css. They count toward
  alias-ref totals here for visibility but their removal is cosmetic.
- The grep above does not catch `--pb-*` direct references — those are
  the canonical layer and should accumulate as migration progresses.

## Sunset criterion (locked)

The alias `:root` block in `dashboard-shell.css` is deleted when:

- [ ] Every dashboard HTML's alias-ref count == 0
- [ ] No `--font-sans` / `--duration-default` / `--ease-default` /
      `--shadow-card` references remain in any dashboard or `_assets/*.css`
- [ ] `dashboard.css` is either deleted or contains no legacy token
      declarations (only component classes if any remain)
- [ ] Round-trip `[theme]` check still passes (no raw hex regression)
