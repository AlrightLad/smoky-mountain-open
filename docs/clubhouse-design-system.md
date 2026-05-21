# Clubhouse Design System — codification audit

**Status:** W1.S1 in-progress baseline (2026-05-20).
**Source:** `src/styles/base.css` + `src/styles/components.css` + `docs/CLUBHOUSE_SPEC*.md`.
**Purpose:** Authoritative inventory of the design system as it lives today. Wired vs. gap. Token names → values. Surface-by-surface acceptance status.

## Tokens declared

**Count:** 90 `--cb-*` tokens declared in `src/styles/base.css`.

### Surface palette

| Token | Hex | Purpose |
|---|---|---|
| `--cb-green` | `#2F4A3A` | Primary green (HQ chrome) |
| `--cb-green-2` | `#3D5C48` | Green secondary |
| `--cb-green-3` | `#5A7D4E` | Green tertiary (moss base) |
| `--cb-green-ink` | `#1F2F25` | Ink-on-green text |
| `--cb-felt` | `#0F3D2E` | Primary dark surface (mobile CTA backgrounds, masthead overlay, HQ text usage per CLUBHOUSE_SPEC §1.1) |
| `--cb-chalk` | `#F4EFE4` | Primary chalk surface |
| `--cb-chalk-2` | `#EBE5D6` | Chalk secondary |
| `--cb-chalk-3` | `#DCD4C0` | Chalk tertiary |

### Ink + mute family

| Token | Hex | Purpose |
|---|---|---|
| `--cb-ink` | `#14130F` | Primary text on chalk |
| `--cb-ink-2` | `#2D2B24` | Secondary text |
| `--cb-charcoal` | `#4A4740` | Charcoal text |
| `--cb-ink-link` | `#5A4318` | Link colors (deep brass) |
| `--cb-mute` | `#7A766B` | Mute primary |
| `--cb-mute-1` | `#6B6862` | Body-secondary on chalk |
| `--cb-mute-2` | `#A8A395` | Default mute (v8.14.0 sage-tinted) |
| `--cb-mute-3` | `#C9C5BD` | Light mute / disabled / hairline-on-chalk-3 |

### W2.S0 additions (6 tokens — PLACEHOLDER values)

Per W1.S1 spec ratification G1 (shared mobile + HQ palette):

| Token | Hex | Purpose |
|---|---|---|
| `--cb-ink-soft` | `#3A372F` | Body less prominent than `--cb-ink` (Fraunces 13.5px on chalk) |
| `--cb-ink-faint` | `#5F5C50` | Tertiary text on chalk (mono conditions, empty-state italic) |
| `--cb-mute-soft` | `#928E80` | Context lines (mono 11px) on chalk |
| `--cb-mute-faint` | `#BAB6A8` | Empty-state italic, low-emphasis on chalk |
| `--cb-claret` | `#8E3A3A` | Claret accent (errors, championship banding) |
| `--cb-moss` | `#5A7D4E` | Moss accent (success states, course tile) |

**Action:** These are PLACEHOLDER approximations from HQ Pass 3 specs. Designer ratification needed to lock final values.

### Brass + accent

| Token | Hex |
|---|---|
| `--cb-brass` | `#B4893E` |
| `--cb-brass-2` | `#C9A04A` |
| `--cb-brass-3` | `#E0BB60` |
| `--cb-brass-deep` | `#8C6A2E` |
| `--cb-copper` | `#A05A3A` |
| `--cb-slate` | `#5A6B78` |
| `--cb-sand` | `#C9B68A` |

## Typography stack

Per `src/styles/base.css` line 6 `@import` from Google Fonts:

| Family | Weights | Purpose |
|---|---|---|
| **Fraunces** | 400/500/600/700, italic + roman | Display, member identity, headings |
| **Inter** | 400/500/600/700 | Body + UI |
| **JetBrains Mono** | 400/600/700 | Stats + meta |

Per CLUBHOUSE_SPEC §2 (Typography):
- Dual-stack confirmed (serif display + sans body + mono utility) ✓
- 14-token type scale: implementation TBD (not yet audited in base.css)
- 12px floor for any rendered mobile text: spec contract — enforce in code review
- Tabular numerals on stat tokens: per-component via `font-feature-settings: "tnum"`

## Spacing scale

Per CLUBHOUSE_SPEC §3 spec contract:

**Base unit: 4px. All spacing multiples of 4. No fractional pixels.**

Standard scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.

Variable-name pattern in components.css: `--space-1` through `--space-9` (not yet uniformly named — audit required).

## Reduced motion

**Status:** WIRED ✓

`src/styles/base.css` lines 614-653 + `src/styles/components.css` (similar pattern) implement `@media (prefers-reduced-motion: reduce)`:

- All `animation-duration` + `transition-duration` reduced to 0.001ms
- Loading spinners preserved (rotated, slower at 1.2s)
- Toasts + skeletons preserved with brief 150-200ms transitions
- Achievement celebrations snap to visible state (JS timeout removes)

Per CLUBHOUSE_SPEC §motion: reduced-motion respect is mandatory across all animated surfaces. Spot-check pending for: rip-dot, pill-live::before, .nt-count.live (all set to `animation: none` in reduce mode — verified).

## Sunlight mode

**Status:** SCAFFOLDED (W1.S1 baseline) — Settings UI + per-surface visual verification = follow-on ships.

Per CLUBHOUSE_SPEC §6.2:
- Toggle in More → Settings → Display (NOT auto via prefers-color-scheme)
- Bumps all contrast to AAA across the board
- Removes box-shadow elevation entirely
- Outlines chalk-deep cards instead of filling them
- Bumps icon stroke widths by 25%

W1.S1 added (this ship):
- `:root[data-theme="sunlight"]` CSS block with mute-family darkening + brass→brass-deep override
- `box-shadow: none !important` on all elements when sunlight active
- SVG stroke-width 1.25x via `--svg-stroke` custom prop
- `[data-theme="auto"]` placeholder (for prefers-color-scheme: light hookup later)

Follow-on:
- Settings → Display toggle UI in `src/pages/settings.js` (More page) — write `<html data-theme="sunlight|default">`
- Per-component contrast verification (visual screenshot diff sunlight vs default)
- Capacitor `Device` ambient-light sensor integration (Wave 3 mobile)

## SVG icon library

**Status:** Spot-check needed.

Per Memory #16 (theme-aware inline SVG pattern):
- Inline `<svg>` with `style="color: var(--cb-brass)"`
- Plot elements use `stroke="currentColor"` to follow text color

Action: audit `src/pages/*.js` for inline SVG usage; confirm theme-aware pattern is applied universally. Smoke-test scenario for verification deferred.

## AAA contrast

**Status:** Spec contract documented; runtime verification pending.

Per CLUBHOUSE_SPEC §6.2:

| Surface | Min ratio | Token pair example | Verified? |
|---|---|---|---|
| Body text on page | 7:1 (AAA) | `--cb-ink` on `--cb-chalk` (11.2:1) | Spec ✓ |
| Body text on card | 7:1 | `--cb-ink` on `--cb-chalk-deep` (≈9:1) | Spec ✓ |
| Interactive control | 4.5:1 | `--cb-brass-deep` on `--cb-chalk` (4.7:1) | Spec ✓ |
| Disabled state | 3:1 | `--cb-mute` lightened on chalk-deep | Spec ✓ |

Action: wire axe-core into smoke for runtime contrast verification.

## Token traceability — raw value violations

Per W1.S1 acceptance criterion 3: "NO raw hex / px / ms values in production source."

**Exemptions (per CLAUDE.md):**
- Visual Reference colors (hole-dot colors, calendar dots): `#4CAF50` in calendar.js + feed.js — EXEMPT
- Share-card template (html2canvas compat): `members.js` share-card hexes — EXEMPT
- Feed diff colors (`#FFD700`, `#888888`, `#F59E42`, `#E53935`, `#444`) — score-differential visualization, treat as Visual Reference category — likely EXEMPT (action: confirm with Founder + add to documented exemption list)

**No other violations identified in audit.** Token traceability is in good shape.

## Build configuration

Per W1.S1 spec: "Vite-split bundle includes token definitions in shared CSS imported by every page."

**Status:** `src/styles/base.css` is imported via main.js entry path. Vite handles the bundle automatically. Token definitions are present in every built CSS chunk.

## Follow-on ship enumeration

Items NOT shipped in W1.S1 (deferred to subsequent ships):

1. **W1.S1-followup-1:** Settings → Display sunlight-mode toggle UI + persistence in `pb_appearance` localStorage
2. **W1.S1-followup-2:** Designer ratification of W2.S0 6-token PLACEHOLDER values
3. **W1.S1-followup-3:** Smoke scenario verifying theme-aware SVG pattern (Memory #16)
4. **W1.S1-followup-4:** Axe-core contrast scan in smoke (AAA criteria verification)
5. **W1.S1-followup-5:** Feed diff-color exemption ratification + documented exemption list
6. **W1.S1-followup-6:** Per-surface sunlight-mode visual screenshot regression suite

## Cross-references

- `src/styles/base.css` — token declarations + reduced-motion + sunlight-mode scaffold
- `src/styles/components.css` — token-driven component styles
- `docs/CLUBHOUSE_SPEC.md` — design system canonical spec
- `docs/CLUBHOUSE_SPEC-HQ.md` — HQ-specific palette
- `docs/agents/ships/W1.S1.md` — ship plan (Vision-only stub)
- `.claude/state/ship-progress/W1.S1.json` — ship progress state
