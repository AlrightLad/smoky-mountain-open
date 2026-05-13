---
audit: dashboards converge to a single canonical theme (Theme B / PARBAUGHS)
date: 2026-05-13
authored_by: claude-code
trigger: Phase 0 of Dashboard Consolidation directive
---

# Theme Migration Audit — Two Themes → One

Founder mandate: dashboards converge to one theme. Theme B (PARBAUGHS:
`--pb-billiard-green-*` + `--pb-chalk-*` + `--pb-brass-*`) is canonical;
Theme A (legacy ops palette in `dashboard.css`) is retired through an
alias layer in `dashboard-shell.css`.

## Two themes that currently coexist

### Theme A — legacy ops dashboards (`docs/reports/_assets/dashboard.css`)

Generic dark-tech aesthetic. Used by every dashboard except design-system.html.

| Token | Legacy hex | Maps to |
|---|---|---|
| `--bg-page` | `#0f1419` (cold slate) | `var(--pb-billiard-green-900)` |
| `--bg-card` | `#1a1f2e` | `var(--pb-billiard-green-800)` |
| `--bg-elevated` | `#232838` | `var(--pb-billiard-green-700)` |
| `--bg-input` | `#14181f` | `var(--pb-billiard-green-700)` |
| `--text-primary` | `#e8ebf0` (cool white) | `var(--pb-chalk-50)` (warm chalk) |
| `--text-secondary` | `#9ba4b5` | `var(--pb-chalk-200)` |
| `--text-tertiary` | `#5a6478` | `var(--pb-chalk-400)` |
| `--text-inverse` | `#0f1419` | `var(--pb-billiard-green-900)` |
| `--accent-brass` | `#c9a961` (already brass-500) | `var(--pb-brass-500)` |
| `--accent-moss` | `#4a8067` | `var(--pb-success)` |
| `--accent-claret` | `#9c4a4a` | `var(--pb-error)` |
| `--accent-teal` | `#4a8a9c` | `var(--pb-info)` |
| `--accent-amber` | `#d4a857` | `var(--pb-warning)` |
| `--accent-violet` | `#6b5b8c` | `var(--pb-leather-700)` (deferred — no direct canonical equivalent; closest distinct accent in PARBAUGHS) |
| `--border-subtle` | `#2a3142` | `rgba(216, 208, 192, 0.08)` |
| `--border-strong` | `#3a4256` | `rgba(216, 208, 192, 0.16)` |
| `--success/-warning/-danger/-info` | aliases to accent-* | aliases to `--pb-*` semantic |
| `--font-sans` | system stack | `var(--font-body)` |
| `--duration-default` | `200ms` | `var(--duration-medium)` (240ms) |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | `var(--ease-out)` (cubic-bezier(0.16, 1, 0.3, 1)) |
| `--shadow-card` | dark shadow | `var(--shadow-md)` |

### Theme B — PARBAUGHS (`docs/reports/_assets/design-tokens.css`)

Canonical product aesthetic. Already in full use by design-system.html.
Restrained palette: billiard green (felt) + chalk (ink) + brass (scarce accent).

Token namespace: `--pb-*` for canonical palette + semantic aliases
(`--bg-page`, `--text-primary`, etc.) already mapped to `--pb-*`.

## Token usage counts (pre-migration)

| File | Legacy token refs |
|---|---|
| `dashboard.css` | 78 declarations + many internal refs |
| `dashboard.html` | 0 (full Theme B after DC-3) |
| `token-usage.html` | 2 (mostly Theme B after DC-4) |
| `activity.html` | 23 |
| `proposals.html` | 47 |
| `discussion-bubbles.html` | 80 |
| `main-flows.html` | 39 |
| `index.html` | 31 |
| `design-system.html` | 39 (canonical `--pb-*` only) |
| `dashboard-shell.css` | 8 (aliases — designed to forward) |
| `design-system-components.css` | 28 (canonical `--pb-*`) |
| `template.html` | 2 (stale boilerplate — slated for delete in DC-8) |

## Strategy

**Add an alias `:root` block to `dashboard-shell.css`** mapping every
legacy Theme A token name to its `--pb-*` equivalent.

Cascade order:
1. dashboards import `dashboard.css` (legacy declarations: `--bg-page: #0f1419`, etc.)
2. dashboards import `dashboard-shell.css` (which `@import`s design-tokens.css + then re-declares the alias block, overriding dashboard.css's legacy hex values)

Result: every inline `var(--bg-page)` resolves to `var(--pb-billiard-green-900)` instead of `#0f1419`. The PARBAUGHS theme wins.

No dashboard HTML needs editing to flip themes. The shell forwards.

## Sunset criterion

The alias layer is **temporary**. It lets pre-migration inline styles
keep working while individual dashboards migrate to `var(--pb-*)` directly.

Tracked at `.claude/state/design-system/alias-sunset.md`:
- Each dashboard gets a per-page checklist
- A dashboard is "fully migrated" when its inline `<style>` blocks
  reference zero alias-layer tokens (legacy names)
- When all dashboards report fully migrated, the alias `:root` block is
  deleted from `dashboard-shell.css`

## What this audit does NOT change

- `dashboard.css` is **not deleted** in Phase 0 — it still provides
  component classes (`.metric`, `.card`, `.data-table`, etc.) consumed
  by legacy dashboards. Those go away as each dashboard normalizes to
  `.pb-kpi-card` / `.pb-table` / etc. in DC-5 and DC-6. Once no
  dashboard references those legacy classes, `dashboard.css` can be
  deleted (DC-8 cleanup).
- Light-theme `[data-theme="light"]` block in `dashboard.css` is dead
  code (every dashboard hard-codes `data-theme="dark"` and the theme
  toggle was dropped per Founder Q1). Slated for deletion in DC-8.
- No HTML file is edited in Phase 0 — only `dashboard-shell.css` gains
  the alias block, the round-trip test gains a theme guard, and two
  new docs document the migration.

## Phase 0 deliverables

1. `dashboard-shell.css` — add `@import url("design-tokens.css")` + alias `:root` block
2. `.claude/state/wave-zero-dry-run/theme-migration-audit.md` (this file)
3. `.claude/state/design-system/alias-sunset.md` (per-dashboard checklist)
4. `tests/round-trip-test.py` — `[theme]` block: no raw hex in `<style>` blocks of dashboards (design-system.html exempt as documentation)
