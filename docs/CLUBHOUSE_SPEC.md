# CLUBHOUSE_SPEC.md — Parbaughs Mobile Design System

> **This document is Part 1 of 3.**
> **Part 1 (this file):** Foundation — tokens, motion, gestures, accessibility, integration contracts.
> **Part 2 (forthcoming):** Per-screen specs, 20+ screens, subdivided by tab with Founder confirmation gates per tab.
> **Part 3 (forthcoming):** Wave 3 ship-by-ship implementation guidance (M1 Capacitor harness → M6 You + TestFlight).

**Status:** Awaiting Founder ratification of Part 1 before Part 2 begins.
**Pass:** 2 of 4. Pass 1 ratification at `docs/wave-2a-ratification.md`.
**Authority:** Design system canonical source for Wave 3. Engineering agents implement to 1:1 fidelity. Tokens defined here are the only tokens any mobile screen may consume — additions require amendment to this doc, not per-screen invention (Criterion 11).

---

## How to read this doc

Each major section ends with a **Ratification block** stating what is being accepted. Red-line in place. Inference tags carry from Pass 1: `[CONFIRMED]`, `[INFERENCE]`, `[GAP]`.

All token names follow the existing HQ `--cb-*` convention so the system is one system across surfaces — not "HQ tokens" and "mobile tokens" sharing a coincidental palette. Where a token's mobile expression differs from HQ, a `-mobile` suffix is **avoided** in favor of a shared token with documented surface notes.

---

# § 1 — Final Palette

## 1.1 Position

The starting point — billiard green `#0f3d2e` + chalk + brass — is preserved in spirit but tuned through OKLCH so every accent harmonizes against the same lightness and chroma axes. The result is a **single palette** that serves HQ and mobile equally; mobile-specific *usage* differs (felt becomes a primary surface; on HQ it's a text color) but the values do not.

`[INFERENCE]` HQ values for `--cb-felt`, `--cb-chalk`, `--cb-brass` are inferred from production screenshots and prior memory. If your authoritative HQ tokens differ, treat the values below as starting proposals and reconcile in implementation.

## 1.2 Token Table

All values in OKLCH for perceptual uniformity. Hex equivalents provided for legacy compatibility only — OKLCH is canonical.

### Surfaces & Ink (the structural palette)

| Token | OKLCH | Hex ≈ | Role |
|---|---|---|---|
| `--cb-felt` | `oklch(28% 0.04 155)` | `#0f3d2e` | Primary dark surface. CTA backgrounds, in-round states, masthead overlay. The billiard green starting point, preserved. |
| `--cb-felt-deep` | `oklch(20% 0.05 155)` | `#082619` | Elevated felt — pressed states, modal scrim background, deep elevation. |
| `--cb-felt-soft` | `oklch(40% 0.03 155)` | `#2a5847` | Muted felt for secondary text on chalk, low-emphasis felt borders. |
| `--cb-chalk` | `oklch(94% 0.012 80)` | `#f3ede1` | Primary light surface. Page background. The warm off-white. |
| `--cb-chalk-deep` | `oklch(88% 0.015 80)` | `#e3dac8` | Card backgrounds, input fills, secondary surface. |
| `--cb-chalk-soft` | `oklch(96% 0.008 80)` | `#f8f4ea` | Softest off-white. Sheet/modal interiors that need to read as elevated above page. |
| `--cb-ink` | `oklch(20% 0.01 80)` | `#2a2620` | Primary text on chalk surfaces. Warm near-black; never pure black. |
| `--cb-mute` | `oklch(50% 0.012 80)` | `#7a7166` | Secondary text, metadata, captions. |
| `--cb-line` | `oklch(85% 0.01 80)` | `#d4cdbf` | Hairlines, dividers, low-contrast borders. |

### Brass (the accent palette)

| Token | OKLCH | Hex ≈ | Role |
|---|---|---|---|
| `--cb-brass` | `oklch(70% 0.12 80)` | `#c89a4b` | Primary accent. Active tab icon, active state, primary link color, key numerals (HCP, BEST). |
| `--cb-brass-deep` | `oklch(58% 0.13 75)` | `#a17532` | Pressed/active state, focused brass accents. |
| `--cb-brass-soft` | `oklch(82% 0.07 82)` | `#dec593` | Brass-tinted backgrounds (active pill, kudos heart fill). |
| `--cb-brass-faint` | `oklch(91% 0.04 82)` | `#ece0c6` | Brass-tinted hairline + ghost states. |

### Status palette (used sparingly)

| Token | OKLCH | Hex ≈ | Role |
|---|---|---|---|
| `--cb-success` | `oklch(45% 0.12 155)` | `#2d7a4f` | Round complete, save confirmed, score logged. Distinct from felt by chroma. |
| `--cb-warn` | `oklch(70% 0.15 60)` | `#d4a13d` | Cautions. Differentiated from brass by hue shift toward orange. |
| `--cb-alert` | `oklch(35% 0.15 25)` | `#7e2a1f` | CRITICAL crisis banner background, destructive confirmation. Locked in § 3.3 of Pass 1. |
| `--cb-info` | `oklch(55% 0.08 230)` | `#5c87ab` | Informational NOTICE banner accent. Used rarely. |

### Functional aliases (semantic — what to reach for first)

| Alias | Resolves to | Use |
|---|---|---|
| `--bg` | `var(--cb-chalk)` | Page background |
| `--bg-elevated` | `var(--cb-chalk-soft)` | Sheets, modals, elevated cards |
| `--bg-sunk` | `var(--cb-chalk-deep)` | Inputs, sunken cards |
| `--text` | `var(--cb-ink)` | Body text |
| `--text-muted` | `var(--cb-mute)` | Captions, metadata |
| `--text-inverse` | `var(--cb-chalk)` | Text on `--cb-felt` surfaces |
| `--accent` | `var(--cb-brass)` | Primary accent |
| `--accent-press` | `var(--cb-brass-deep)` | Pressed brass |
| `--line` | `var(--cb-line)` | Borders, dividers |
| `--cta-fill` | `var(--cb-felt)` | Primary CTA buttons |
| `--cta-fill-press` | `var(--cb-felt-deep)` | Pressed CTA |
| `--cta-text` | `var(--cb-chalk)` | CTA label color |

Engineering agents reach for aliases first, raw tokens second. Raw tokens are for spec authors and unusual cases.

## 1.3 Contrast verification

| Pair | Ratio | AA pass | AAA pass |
|---|---|---|---|
| `--cb-ink` on `--cb-chalk` | 11.2 : 1 | ✅ | ✅ |
| `--cb-mute` on `--cb-chalk` | 4.9 : 1 | ✅ body | ✗ large only |
| `--cb-chalk` on `--cb-felt` | 10.8 : 1 | ✅ | ✅ |
| `--cb-brass` on `--cb-chalk` | 3.1 : 1 | Large only | ✗ |
| `--cb-brass-deep` on `--cb-chalk` | 4.7 : 1 | ✅ body | ✗ |
| `--cb-chalk` on `--cb-alert` | 7.4 : 1 | ✅ | ✅ |

`[INFERENCE]` Ratios computed from OKLCH-derived luminance approximations; engineering agents must verify against the actual rendered output using axe or equivalent during W1.S1 implementation.

**Brass usage rule:** `--cb-brass` is large-text-only on chalk surfaces. For body-sized brass text, use `--cb-brass-deep`. Engineering enforcement: a lint rule on the design tokens catches small-text uses of `--cb-brass` and flags them.

## 1.4 Ratification block — § 1

You are accepting:

1. The single OKLCH-defined palette above as canonical for both HQ and mobile.
2. Token names follow `--cb-*` convention; aliases are the preferred consumption path.
3. Brass small-text rule: `--cb-brass` only on large text; body text uses `--cb-brass-deep`.
4. CRITICAL background `oklch(35% 0.15 25)` carries forward from Pass 1.

✏️ **Founder action:** Ratify, red-line a value, or flag mismatch against your authoritative HQ token list before § 2.

---

# § 2 — Type Scale

## 2.1 Position

HQ uses a strong serif for display + identity moments and a clean sans for body and labels. Mobile inherits this dual-stack but tightens the scale for thumb-zone reading and viewport economy.

`[INFERENCE]` HQ display serif is **Cardinal Fruit** or similar high-contrast modern serif based on screenshot reading; body sans appears to be a neutral grotesque (`Inter`-family-shaped but possibly something more specific). If your authoritative HQ stack differs, swap font families in the variables — the SCALE below stays.

## 2.2 Font stacks

```css
--font-serif: "Cardinal Fruit", "Tiempos Headline", Georgia, serif;
--font-sans:  "Söhne", "Inter", system-ui, -apple-system, "Helvetica Neue", sans-serif;
--font-mono:  "JetBrains Mono", "SF Mono", ui-monospace, monospace;
```

`[GAP]` Confirm authoritative HQ font stack — swap families in token definitions if mine inferred wrong. Scale (sizes, weights, line heights) below is independent of family choice.

## 2.3 Type scale tokens

| Token | Size | Line height | Weight | Family | Use |
|---|---|---|---|---|---|
| `--type-display` | 36px | 1.05 | 600 | serif | Greeting headline ("Good morning, Mr Parbaugh.") |
| `--type-h1` | 28px | 1.1 | 600 | serif | Page titles ("Parbaughs," "Rounds," "Events") |
| `--type-h2` | 22px | 1.2 | 600 | serif | Section heads ("League pulse," "Standings") |
| `--type-h3` | 18px | 1.3 | 600 | sans | Card titles, list-row primary |
| `--type-stat-xl` | 44px | 1.0 | 700 | serif | Hero stat numerals (HCP 20.9, BEST 94) |
| `--type-stat-lg` | 32px | 1.0 | 700 | serif | Card stat numerals (ROUNDS 7) |
| `--type-stat-md` | 24px | 1.0 | 600 | serif | Inline stat values, score numerals |
| `--type-body-lg` | 17px | 1.5 | 400 | sans | Lead body, primary CTA labels |
| `--type-body` | 15px | 1.5 | 400 | sans | Default body |
| `--type-body-sm` | 13px | 1.45 | 400 | sans | Metadata, captions |
| `--type-label` | 11px | 1.2 | 600 | sans | Uppercase labels (`HCP`, `ROUNDS`, `NO ROUND TODAY`). Letter-spacing 0.08em. |
| `--type-caption` | 12px | 1.4 | 400 | sans | Hint text, helper copy |
| `--type-cta` | 17px | 1.0 | 600 | sans | Button labels |

## 2.4 Composition rules

- **Greeting + page-title pairs:** display + h2 on Home / Today only. Other pages start at h1.
- **Stat composition:** numeral always uses a `--type-stat-*` token; the accompanying label uses `--type-label`. Pairing example: `BEST` (label) above `94` (stat-lg).
- **Numerals:** use OpenType tabular figures (`font-variant-numeric: tabular-nums`) on all stat tokens so columns align.
- **Serif italics:** display serif italic is reserved for member name appearances inside greeting ("Mr *Parbaugh*"). Not used elsewhere.
- **All-caps:** reserved for `--type-label`. Body text never sets all-caps.

## 2.5 Minimum legible size

12px. Below 12px is rejection-grade for any rendered mobile text per Criterion 8 (accessibility — sunlight readability scenario). Caption (12px) is the floor.

## 2.6 Ratification block — § 2

You are accepting:

1. Dual-stack typography (serif display + sans body + mono utility), font families to be confirmed against HQ stack.
2. 14-token type scale with explicit weights and line heights.
3. 12px floor for any rendered mobile text.
4. Tabular numerals on all stat tokens.

✏️ **Founder action:** Confirm font family stack or flag `[GAP]`; ratify the scale before § 3.

---

# § 3 — Spacing & Layout

## 3.1 Base unit

4px. All spacing tokens are multiples of 4. No fractional pixels.

## 3.2 Spacing scale

| Token | Value | Use |
|---|---|---|
| `--space-0` | 0 | Reset |
| `--space-1` | 4px | Inline elements, icon-to-text gap |
| `--space-2` | 8px | Tight stack, related elements |
| `--space-3` | 12px | Card internal padding (compact) |
| `--space-4` | 16px | Default card padding, list-row vertical |
| `--space-5` | 20px | Page horizontal gutter |
| `--space-6` | 24px | Section vertical spacing |
| `--space-7` | 32px | Large section breaks |
| `--space-8` | 48px | Page-level vertical rhythm |
| `--space-9` | 64px | Hero spacing, terminal page padding |

## 3.3 Layout tokens

| Token | Value | Use |
|---|---|---|
| `--gutter` | 20px | Page horizontal padding (left + right). Confirmed against mobile screenshots. |
| `--tabbar-h` | 84px | Bottom tab bar height including safe-area inset |
| `--tabbar-h-base` | 64px | Bottom tab bar height excluding safe-area |
| `--masthead-h` | 76px | Top masthead height including safe-area |
| `--masthead-h-base` | 56px | Top masthead height excluding safe-area |
| `--touch-min` | 48px | Minimum touch target. Above iOS HIG 44pt; sized for gloved use. |
| `--touch-gap` | 8px | Minimum gap between adjacent touch targets |
| `--radius-sm` | 6px | Inline chips, small pills |
| `--radius-md` | 10px | Cards, inputs |
| `--radius-lg` | 14px | Primary CTAs, large sheets |
| `--radius-xl` | 20px | Hero containers, modals |
| `--radius-pill` | 999px | Pill buttons, tabs |
| `--max-content` | 720px | Max width on tablet; ignored on phone |

## 3.4 Safe-area handling

```css
padding-top: max(env(safe-area-inset-top), var(--space-4));
padding-bottom: max(env(safe-area-inset-bottom), var(--space-4));
```

Tab bar + masthead always render edge-to-edge with safe-area insets respected internally.

## 3.5 Elevation (mobile-specific; HQ rarely uses shadows)

Mobile uses shadows sparingly — for sheets, modals, and floating action surfaces only. Cards on the page surface rely on `--cb-chalk-deep` fills, not shadows.

| Token | Value | Use |
|---|---|---|
| `--shadow-0` | none | Page-level cards. Fill-based separation. |
| `--shadow-1` | `0 2px 8px oklch(20% 0.01 80 / 0.06)` | Floating buttons, segmented control active |
| `--shadow-2` | `0 8px 24px oklch(20% 0.01 80 / 0.12)` | Sheets, modals |
| `--shadow-3` | `0 16px 48px oklch(20% 0.01 80 / 0.18)` | Crisis banner, full-screen alerts |

Shadows use felt-ink tint (warm dark), not pure black.

## 3.6 Ratification block — § 3

You are accepting:

1. 4px base spacing scale with 10 tokens.
2. 20px page gutter; 48px touch minimum (above iOS HIG for gloved use).
3. Fill-based card separation; shadows reserved for elevated surfaces only.
4. Safe-area handling pattern as specified.

✏️ **Founder action:** Ratify or red-line specific values before § 4.

---

# § 4 — Motion Vocabulary

## 4.1 Position

Mobile motion exists to communicate spatial relationships and confirm interactions — not to perform. Every animation has a purpose; "delightful" motion (Criterion 6 — concrete language) is rejection-grade.

## 4.2 Duration tokens

| Token | Value | Use |
|---|---|---|
| `--motion-instant` | 100ms | Tap feedback, ripple, scale-down on press |
| `--motion-quick` | 200ms | Tab transitions, segmented control swap, sheet entrance |
| `--motion-standard` | 280ms | Page push/pop, modal entrance |
| `--motion-emphasized` | 420ms | Hero animations, splash, success confirmations |
| `--motion-deliberate` | 600ms | Round-complete celebration, season-recap reveal |

## 4.3 Easing tokens

| Token | Bezier | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default — entrances |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)` | Hero motion |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exits — slightly accelerated out |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Bidirectional state changes |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Paired with haptic — overshoots subtly |

## 4.4 Composite motion patterns

| Pattern | Spec |
|---|---|
| **Tab transition** | Old tab fade-out 100ms `--ease-exit`, new tab fade-in 200ms `--ease-standard`, slight Y-translate (8px) on entrance |
| **Sheet entrance (bottom)** | Translate Y from 100% to 0%, 280ms `--ease-emphasized`, scrim fade 200ms in parallel |
| **Sheet dismiss** | Translate Y to 100%, 220ms `--ease-exit`, scrim fade 180ms in parallel |
| **Modal entrance** | Scale 0.94 → 1.0 + opacity 0 → 1, 280ms `--ease-emphasized` |
| **Push navigation** | Old screen slides 20% left + fades to 0.6 opacity, new screen slides from 100% right, 280ms `--ease-standard` |
| **Pop navigation** | Reverse of push, 240ms `--ease-exit` |
| **Tap feedback (button)** | Scale to 0.97, 100ms `--ease-standard`, release back over 150ms |
| **Score entry confirm** | Stat numeral scales 1.0 → 1.08 → 1.0 over 280ms `--ease-spring`, haptic light tap synchronized |
| **Kudos tap** | Heart fills + scales 1.0 → 1.2 → 1.0 over 320ms `--ease-spring`, haptic light tap |
| **Pull-to-refresh** | Brass loading spinner appears after 60px pull; spin while data fetches; dismiss with 200ms fade |
| **Round complete celebration** | Confetti `[INFERENCE]` may exceed appetite — propose a single golden-flag-raise glyph instead: 600ms scale + rotate from 0 to settled position, haptic medium |

## 4.5 Reduced motion

Under `@media (prefers-reduced-motion: reduce)`:

- All transitions capped at 100ms.
- Translate-based motion (slides, sheets) becomes fade-only.
- Scale animations become opacity-only.
- Spring easings become `--ease-standard`.
- Haptics remain (haptic ≠ visual motion).

This is rejection-grade per Criterion 8. Every screen spec in Part 2 must reference reduced-motion handling.

## 4.6 Ratification block — § 4

You are accepting:

1. Five-token duration + five-token easing vocabulary.
2. Composite patterns spec'd above — these are the only animation patterns mobile uses without explicit screen-spec amendment.
3. Reduced-motion handling rules are mandatory on every screen.
4. Round-complete celebration uses flag-raise glyph, not confetti (proposed; founder may reject).

✏️ **Founder action:** Ratify, red-line a duration, or override the celebration recommendation before § 5.

---

# § 5 — Gesture Pattern Library

## 5.1 Position

Mobile relies on gestures the platform already teaches the user (iOS HIG + Material). No invented gestures. Every gesture has a non-gesture fallback for one-handed-gloved scenarios.

## 5.2 Gesture catalogue

| Gesture | Trigger | Action | Fallback (non-gesture) | Used on |
|---|---|---|---|---|
| **Tap** | Single touch ≤ 200ms | Primary interaction | N/A | Everything |
| **Long press** | Single touch ≥ 600ms (longer than iOS default to tolerate gloves) | Contextual menu | Three-dot button | Message in chat, round in history, member in list |
| **Edge-swipe-back** | Swipe from left edge ≥ 24px | Back navigation | Top-left back chevron | Every push-navigated screen |
| **Swipe-to-action** | Horizontal swipe on list row ≥ 80px | Reveal row actions (delete, archive) | Long-press for menu | DM list, message rows, round history |
| **Pull-to-refresh** | Vertical pull ≥ 60px on scrollable list | Refresh data | Manual refresh button in masthead | Feed, Pulse, DMs, Rounds |
| **Double-tap** | Two taps ≤ 300ms apart | Kudos / heart toggle | Tap kudos icon | Feed cards, Pulse entries |
| **Pinch** | Two-finger pinch | NOT USED in v1 | N/A | — |
| **Drag (long-press → drag)** | Long press ≥ 400ms, then move | Reorder list / move item | Edit-mode reorder handles | Custom scorecard player order, party-games queue |
| **Vertical swipe down (modal)** | Swipe down on sheet handle | Dismiss sheet | Tap outside or close button | All bottom sheets |
| **Horizontal swipe (tabs)** | Swipe across tab content | Swap to adjacent tab | Tab bar tap | NOT USED on primary 5-tab bar; only on segmented sub-tabs (Feed: Chat / Pulse / DMs) |
| **3-finger swipe** | NOT USED | N/A | N/A | Reserved for system gestures |

## 5.3 Gesture conflicts

- **Edge-swipe-back vs. horizontal swipe in lists.** Resolved by giving edge-swipe-back priority in the first 24px of the screen edge; list swipes initiate beyond that band.
- **Pull-to-refresh vs. vertical scroll.** Pull-to-refresh activates only when scrollTop = 0 and the initial gesture direction is downward. Cancels if user reverses direction.
- **Long-press vs. drag.** Long-press is contextual menu by default; drag is opt-in (must be in an explicitly drag-enabled list, signaled by visible reorder handles in edit mode).

## 5.4 Glove tolerance

Capacitive touch through golf gloves is reduced but functional with modern gloves. Compensation:

- **48px minimum touch target** (above iOS HIG 44pt baseline).
- **Long-press timing extended to 600ms** (vs. iOS default 500ms) to reduce accidental triggers.
- **Double-tap window extended to 300ms** (vs. typical 250ms).
- **Edge-swipe-back accepts a wider initial threshold** (24px vs. 20px).

## 5.5 Ratification block — § 5

You are accepting:

1. Gesture catalogue per § 5.2; no invented gestures.
2. Every gesture has a non-gesture fallback for accessibility / glove failure.
3. Conflict resolutions per § 5.3.
4. Glove-tolerance timing compensations per § 5.4.

✏️ **Founder action:** Ratify or red-line; flag any gesture you want added or removed.

---

# § 6 — Accessibility Framework — Outdoor-Use Scenarios

## 6.1 The three scenarios

Outdoor-use accessibility is a Wave 3 differentiator. Three scenarios drive every screen spec:

1. **Sunlight readability** — high glare, eyes adapted to bright environment
2. **Glove operation** — reduced tactile precision, capacitive touch through fabric
3. **One-handed operation** — phone in dominant hand while other hand holds club, cart wheel, or beverage

## 6.2 Sunlight readability

### Contrast targets

| Surface | Minimum ratio | Token pair example |
|---|---|---|
| Body text on page | 7:1 (AAA body) | `--cb-ink` on `--cb-chalk` (11.2:1 ✅) |
| Body text on card | 7:1 | `--cb-ink` on `--cb-chalk-deep` (≈9:1 ✅) |
| Large text / heading | 4.5:1 | All combinations clear |
| Interactive control | 4.5:1 | `--cb-brass-deep` on `--cb-chalk` (4.7:1 ✅) |
| Iconography | 4.5:1 against background | Same |
| Disabled state | 3:1 (visibly distinct) | `--cb-mute` lightened on `--cb-chalk-deep` |

### Sunlight mode (optional, opt-in)

Toggle in More → Settings → Display.

- **Bumps all contrast to AAA** across the board: `--cb-mute` darkens to `oklch(40% 0.012 80)`, brass-on-chalk shifts to `--cb-brass-deep` everywhere automatically.
- **Removes elevation shadows** entirely (glare washes them out anyway).
- **Disables subtle backgrounds** — `--cb-chalk-deep` cards become outlined instead of filled.
- **Increases stroke widths** by 25% on icons.

`[INFERENCE]` Sunlight mode could be tied to ambient light sensor automatically (Capacitor `Device` plugin) — propose: surface a "Auto" option in addition to On/Off.

### Anti-glare design rules

- No pure white. `--cb-chalk` is `oklch(94% ...)`, not 100%.
- No pure black. `--cb-ink` is `oklch(20% ...)`.
- Avoid large fields of `--cb-brass`. Brass at scale = glare amplifier.
- Iconography uses 2px strokes minimum (3px in Sunlight mode).

## 6.3 Glove operation

### Touch targets

- **48px minimum** for any interactive element (already specified in § 3).
- **8px minimum gap** between adjacent targets (already specified).
- Critical actions (Start Round, Save Score) target **64px** for confidence.

### Gesture compensation (already in § 5.4)

- Long-press 600ms
- Double-tap 300ms window
- Edge-swipe-back 24px threshold

### Avoid

- **Small text inputs.** Score entry uses large numpad-style input with 64px digit targets, not a numeric text field.
- **Adjacent destructive + confirm buttons.** "Cancel" and "Delete" are never within 16px of each other.
- **Edge-only primary actions.** Top-right "Done" button has a parallel CTA in lower thumb zone.

## 6.4 One-handed operation

### Thumb zones (right-handed primary; mirror for left)

```
┌─────────────────────┐
│   HARD REACH        │  ← Top 30% — masthead, status only
│                     │
├─────────────────────┤
│   NATURAL REACH     │  ← Middle 40% — content
│                     │
├─────────────────────┤
│   THUMB ZONE        │  ← Bottom 30% — primary CTAs, tab bar
│                     │
└─────────────────────┘
```

### Rules

- **Primary CTAs in bottom 40%.** "Start a round," "Save score," "Send message" — all anchor near thumb zone.
- **Destructive actions in hard-reach area.** "Delete round," "Leave league" lives in upper third or behind a confirmation sheet, not in the thumb zone.
- **Tab bar at bottom.** Already specified.
- **Reachability sheets.** Long forms become bottom sheets that scroll within the thumb zone rather than pushing content into the hard-reach area.

### Reachability for hard-reach content

- iOS Reachability (double-tap home indicator) is supported by the platform; we don't reimplement.
- Internally: where content must live in the top 30% (e.g., page title), pair it with a duplicate scroll-to-top tap target in the masthead.

## 6.5 Other accessibility

### VoiceOver / TalkBack

- Every interactive element has an accessible label.
- Stat composition (`HCP 20.9`) reads as "Handicap, 20.9" — explicit ARIA pairing.
- Custom controls (segmented, drag-to-reorder) declare role + state.

### Dynamic Type / font scaling

- Mobile respects platform font scaling up to 200% size.
- Layouts test at 150% and 200%; container overflow handled by wrap, not truncation.
- `--type-display` and `--type-stat-xl` are exempt — they scale to 130% max to preserve layout.

### Reduced transparency

- `prefers-reduced-transparency` honored. Modal scrims become solid `--cb-felt-deep` instead of translucent.

### Reduced motion

- Already specified in § 4.5.

### Color blindness

- No information conveyed by color alone. Score states (under par, over par, par) pair color with glyph or position.
- Brass/felt distinction is hue + lightness — distinguishable in protanopia and deuteranopia simulations.

## 6.6 Ratification block — § 6

You are accepting:

1. AAA body contrast as the standard, not AA.
2. Sunlight mode as an opt-in display setting (`[INFERENCE]` consider auto-detect via ambient light).
3. Glove compensations across touch targets and gestures.
4. Thumb-zone rules for primary CTA placement.
5. VoiceOver / Dynamic Type / reduced-motion / reduced-transparency support is non-negotiable.

✏️ **Founder action:** Ratify, red-line, or specify auto vs. manual Sunlight mode before § 7.

---

# § 7 — Capacitor API Integration Contract

## 7.1 Position

Mobile is built with Capacitor over a Vite-split vanilla JS shared core with HQ. The same code paths run in: (a) HQ web browser, (b) Capacitor iOS, (c) Capacitor Android. The integration contract below makes browser-emulation a first-class development target — engineering does not need a device or native build to develop most screens.

## 7.2 Plugin matrix

| Capability | Capacitor plugin | Web fallback | Use cases |
|---|---|---|---|
| **Camera** | `@capacitor/camera` | `<input type="file" accept="image/*" capture="environment">` | Round photo capture, profile photo, league chat image attachment, ace verification |
| **Geolocation** | `@capacitor/geolocation` | `navigator.geolocation` | Course GPS, shot-distance tracking, weather pull, course detect on round start |
| **Haptics** | `@capacitor/haptics` | No-op (`console.debug('haptic:', impact)`) | Score entry confirm, kudos tap, mention notification, round complete |
| **File system** | `@capacitor/filesystem` | `IndexedDB` + browser download | Round export (PDF/JSON), scorecard image cache, offline round queue |
| **Push notifications** | `@capacitor/push-notifications` | Browser `Notification` API (limited) | Wave 3 reads; Launch Phase B implements (see § 9) |
| **Status bar** | `@capacitor/status-bar` | CSS-only (no JS) | Theme integration, color match to masthead |
| **Splash screen** | `@capacitor/splash-screen` | Static HTML splash | Launch screen, brass + felt identity |
| **Network** | `@capacitor/network` | `navigator.onLine` + listeners | Offline banner, queue indicator |
| **Device** | `@capacitor/device` | `navigator.userAgent` parse (limited) | Ambient light → Sunlight mode auto, platform detect, app version |
| **Share** | `@capacitor/share` | `navigator.share` (where available, else fallback to copy-link sheet) | Share round, share trophy, invite link |
| **Preferences** | `@capacitor/preferences` | `localStorage` | User settings, last-viewed slide, tweak state |
| **Local notifications** | `@capacitor/local-notifications` | `Notification` (foreground only) | Tee-time reminders, round-handoff prompt |

## 7.3 Contract pattern

Every Capacitor integration is wrapped in a helper that selects native vs. web at runtime:

```js
// src/core/native/camera.js
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';

export async function capturePhoto(opts = {}) {
  if (Capacitor.isNativePlatform()) {
    return Camera.getPhoto({ quality: 80, ...opts });
  }
  return await webCameraFallback(opts);  // file input fallback
}
```

`[INFERENCE]` File layout proposed: `src/core/native/*.js` per capability. Engineering ratifies during W1.I-like setup.

**Contract guarantee:** Screen specs in Part 2 cite native helpers by name (e.g., `capturePhoto()`), never by Capacitor plugin name directly. This means the same screen code runs unchanged on web and native; switching backends is a helper-level change, not a screen-level change.

## 7.4 Web emulation fidelity

Development without a native build must achieve **functional parity** for the following:

| Capability | Web emulation fidelity |
|---|---|
| Camera | ✅ File picker covers capture flow; preview indistinguishable |
| Geolocation | ✅ Same browser API; permission flow differs but UX is identical |
| Haptics | ⚠️ Silent no-op; visual feedback substitutes during web dev |
| File system | ✅ IDB-backed; export becomes download |
| Push | ⚠️ Limited — foreground-only in browser; native is full |
| Status bar | ⚠️ Web has no API; document title + theme-color meta is the closest |
| Splash | ✅ Static splash HTML works identically |
| Network | ✅ Equivalent |
| Device | ⚠️ Ambient light unavailable on web; Sunlight mode auto disabled |
| Share | ✅ Native share API on supporting browsers; copy-link sheet fallback |
| Preferences | ✅ localStorage |
| Local notifications | ⚠️ Foreground only on web |

**Rule:** ⚠️ items require an in-app indicator during web emulation ("Haptic feedback unavailable in browser") that's gated behind a `__DEV__` flag, not shown to production users.

## 7.5 Permissions UX

Every permission request is preceded by a **pre-prompt** explaining why, with a clear non-permission path:

| Permission | Pre-prompt copy | Non-permission path |
|---|---|---|
| Camera | "Add a photo to your round? Parbaughs uses your camera only when you tap to add one." | Skip — round saves without photo |
| Geolocation | "Parbaughs uses location to auto-detect your course and track shot distances. Tap allow to enable." | Manual course selection from directory |
| Push notifications | "Heads-up on tee times, mentions, and round invites?" | Disabled; can enable later in Settings |
| Microphone | NOT REQUESTED in v1 | — |
| Contacts | NOT REQUESTED in v1 | — |

Pre-prompts shown via bottom sheet with two clear actions: "Allow" (triggers native prompt) and "Not now" (dismisses with no permission ask).

## 7.6 Ratification block — § 7

You are accepting:

1. The Capacitor plugin matrix in § 7.2 as the full v1 native-capability set.
2. Helper-wrapped contract pattern: screen code does not import Capacitor directly.
3. Web emulation fidelity per § 7.4 with `__DEV__`-gated indicators on degraded paths.
4. Pre-prompt UX pattern for every permission request.

✏️ **Founder action:** Ratify, red-line, or add/remove a capability before § 8.

---

# § 8 — HQ ↔ Mobile Sync Architecture

## 8.1 Position

**Single Firestore truth.** There is no separate mobile database. HQ web and Capacitor mobile read from the same Firestore project (`parbaughs`), through the same `leagueCollection` / `leagueDoc` wrappers, with the same security rules. Sync is a UI concern, not a data concern.

## 8.2 Real-time surfaces

Real-time Firestore listeners power three categories of UX:

| Category | Surfaces | Listener lifetime | Notes |
|---|---|---|---|
| **Active round** | Scorecard (live), Spectator, Scramble Live | While round is active + 5 min grace | Highest-frequency writes; budget reads accordingly |
| **League social** | Feed, League Chat, League Pulse | While surface is foregrounded | Pagination from latest 50 messages |
| **Notifications** | Masthead badge, push prep | App-foreground lifetime | Counter document per member |

Off-screen surfaces use one-shot fetches, not listeners. Listener-everywhere is rejection-grade — cost halt mandate per Critical Feature Registry category 11.

## 8.3 Offline writes

### Round score offline queue

The Scorecard surface accepts writes while offline:

1. Write to local IndexedDB queue with monotonic `localSeq`.
2. Optimistic UI update — score displays immediately.
3. Network listener watches for reconnection.
4. On reconnect, flush queue to Firestore in `localSeq` order.
5. Conflict resolution: last-write-wins by `localSeq` (single author per round invariant — see § 8.4).

Indicator: small `OFFLINE — N pending` chip in the Scorecard top bar when queue is non-empty.

### Other surfaces

Non-round writes (post a chat message, log a round retroactively, edit profile) require connectivity. If offline, the action is rejected with: "Saved locally; will send when you're back online." `[INFERENCE]` Implementation deferred to W1.S12 for chat; round retroactive logging follows W1.S4.

## 8.4 Authorship invariants

- **One author per active round.** Round scorecards are owned by exactly one member at a time. Spectator views are read-only; they cannot write scores. This invariant is enforced by Firestore security rules (`request.auth.uid == round.authorUid`).
- **Author handoff:** A round author can hand authorship to another member via a "Pass the card" sheet (e.g., during a scramble where one member volunteers to score). Handoff updates `authorUid` atomically and revokes the previous author's write access.
- **Author multi-device:** Same authenticated account can write from multiple devices; conflicts resolved by `localSeq`. Different accounts cannot write to the same round simultaneously.

## 8.5 Active-round handoff between devices

Common scenario: member starts a round on HQ web (planning), then opens mobile at the course.

- **Auto-handoff via auth account.** Mobile app detects an active round on the authenticated account; offers "Continue round?" sheet on app open.
- **QR handoff for spectator → author conversion.** A spectator scans a QR shown on the author's device to request authorship transfer; author confirms in-app.

`[INFERENCE]` QR handoff may be out-of-scope for Wave 3 MVP; could defer to Wave 4. Founder ratifies in Part 3.

## 8.6 Sync conflict matrix

| Scenario | Resolution |
|---|---|
| Same member writes score from web + mobile within seconds | Last write wins by `localSeq`; UI on losing device updates to reflect winning value |
| Two members both attempt to author the same round | Firestore rule rejects second writer; UI shows "Round is being scored by [name]; spectate or request handoff" |
| Member edits a chat message while offline; another member also edits before sync | Last-write-wins; lost edit is recoverable via 5-min edit grace window |
| Member deletes a chat message; another member reacts before sync sees deletion | Reaction is dropped on sync; member sees "message no longer available" briefly |
| Active round listener disconnects mid-round | Reconnect with exponential backoff (200ms, 400ms, 800ms, max 5s); offline queue absorbs writes during gap |

## 8.7 Read budget

Per active member per session, target read budget:

| Surface | Reads on open | Per minute (active) |
|---|---|---|
| Home | ~15 (League Pulse latest 10 + headline stats + chat preview 3) | 0 (cached) |
| Play / active scorecard | ~5 (round + members + course) | ~12 (listener-driven, score events) |
| Feed (chat default) | ~50 (latest 50 messages) | ~5 (new messages) |
| Stats | ~10 (computed cache + latest rounds) | 0 |
| More | ~3 (settings doc + version) | 0 |

`[INFERENCE]` Numbers are budgets, not measurements. Engineering instruments actuals during W1.S1/S2 and validates against budget. Overshoots are rejection-grade per cost halt mandate.

## 8.8 Ratification block — § 8

You are accepting:

1. Single Firestore truth; no separate mobile DB.
2. Real-time listeners gated to three categories; off-screen surfaces use one-shot reads.
3. Offline writes for scores only; other surfaces require connectivity.
4. One-author-per-round invariant + handoff pattern.
5. Sync conflict matrix as canonical resolution.
6. Read budgets as instrumentation targets.

✏️ **Founder action:** Ratify, red-line, or expand offline-write surface set before § 9.

---

# § 9 — Push Notification Architecture

## 9.1 Position

Wave 3 **architects** push but does not **request permission**. Permission is requested only at Launch Phase B. This means Wave 3 ships:

- The native push registration code path (Capacitor `PushNotifications` plugin).
- The Firestore topic / token storage schema.
- The notification category set with handlers.
- The notification UI (banner content, deep-link routing).

It does **NOT** ship:

- The permission pre-prompt UI (built but unrouted).
- Any push send from the server.

This lets Launch Phase B flip a single switch to go live, with the architecture battle-tested.

## 9.2 Transport

| Platform | Service |
|---|---|
| iOS | APNs via Firebase Cloud Messaging |
| Android | FCM direct |
| Web (HQ) | Out of scope for Wave 3; defer to Wave 4 if added |

## 9.3 Token / topic model

- **Per-member tokens** stored at `members/{memberId}/devices/{deviceId}` with `fcmToken`, `platform`, `appVersion`, `lastSeen`.
- **Per-league topic subscription** for league-wide announcements.
- **Topic naming convention:** `league_{leagueId}_announcements`, `league_{leagueId}_chat`, `member_{memberId}_dms`.

## 9.4 Notification categories

| Category | Triggers | Payload contents | Deep-link target |
|---|---|---|---|
| `round_complete` | Member finishes a round | Course, score, member name | Round detail |
| `round_invited` | Member added to a round | Round host, course, time | Round join sheet |
| `league_chat_mention` | `@member` in league chat | Message preview, sender | Feed tab → Chat sub-tab → message |
| `league_chat_message` | New league chat message (opt-in, silent default) | Sender, preview | Feed tab → Chat |
| `dm_received` | New DM | Sender, preview | Feed tab → DMs |
| `kudos_received` | Member's round receives kudos | Sender, round context | Activity → that round |
| `mention_in_activity` | `@member` in feed comment | Comment preview, sender | Activity item |
| `tee_time_reminder` | Configurable reminder before tee time | Course, time, members | Tee time detail |
| `wager_offered` | Member receives wager offer | Sender, terms | Wager detail |
| `bounty_claimed` | Bounty member posted is claimed | Claimer, bounty title | Bounty detail |
| `challenge_received` | H2H challenge issued | Sender, terms | Challenge detail |
| `founder_announcement` | League-wide founder announcement | Title, preview | League Pulse or Caddy Notes |
| `crisis` | CRITICAL banner activation | Title, single line | Home (banner is visible) |

## 9.5 Notification preferences

Per-member, per-category opt-in/out. Default state (Launch Phase B):

| Category | Default |
|---|---|
| `round_invited` | On |
| `round_complete` (own rounds only) | On |
| `league_chat_mention` | On |
| `league_chat_message` | Off |
| `dm_received` | On |
| `kudos_received` | Off |
| `mention_in_activity` | On |
| `tee_time_reminder` | On |
| `wager_offered` | On |
| `bounty_claimed` | On |
| `challenge_received` | On |
| `founder_announcement` | On (cannot disable) |
| `crisis` | On (cannot disable) |

`[INFERENCE]` Defaults are best-guesses; Founder ratifies during Launch Phase B prep.

## 9.6 Quiet hours

User-configurable. Defaults to 9pm–8am local time. Suppresses all non-`crisis` notifications. Crisis pierces quiet hours by design.

## 9.7 Deep-link handler contract

Every notification carries a `route` field consumed by a single mobile router:

```js
// src/core/native/push-handler.js
function handlePushTap(payload) {
  const { route, ...params } = payload.data;
  PB.navigate(route, params);
}
```

Routes match HQ URL conventions (`/round/{id}`, `/league/{id}/chat`, `/dms/{id}`). One mobile router, one HQ router, same surface vocabulary.

## 9.8 Ratification block — § 9

You are accepting:

1. Push is architected in Wave 3 but not activated until Launch Phase B.
2. APNs via FCM (iOS) + FCM direct (Android); web push deferred.
3. Token storage schema and topic naming as specified.
4. Notification category set per § 9.4 with opt-in/out defaults.
5. Quiet hours default 9pm–8am, crisis-pierces.
6. Deep-link route vocabulary matches HQ URLs.

✏️ **Founder action:** Ratify or red-line; flag any missing categories before § 10.

---

# § 10 — Open Inferences for Pass 2 Ratification

Listed once for triage; resolution unblocks Pass 3 screen specs.

| # | Inference | Where | Founder action |
|---|---|---|---|
| P2-I1 | HQ font stack inferred (Cardinal Fruit serif + Söhne/Inter sans) | § 2.2 | Confirm or supply authoritative stack |
| P2-I2 | Contrast ratios computed from OKLCH luminance approximations | § 1.3 | Engineering must verify with axe during W1.S1 |
| P2-I3 | Sunlight mode auto-detect via ambient light | § 6.2 | Confirm: Manual only, On/Off/Auto, or other |
| P2-I4 | Round-complete celebration = single golden-flag-raise glyph, not confetti | § 4.4 | Confirm or override |
| P2-I5 | `src/core/native/*.js` file layout for Capacitor helpers | § 7.3 | Confirm or amend |
| P2-I6 | QR handoff for spectator → author conversion deferred to Wave 4 | § 8.5 | Confirm or pull into Wave 3 |
| P2-I7 | Read budgets in § 8.7 are guesses; engineering instruments actuals | § 8.7 | Confirm budget enforcement gate |
| P2-I8 | Push category defaults | § 9.5 | Confirm or amend per-category default |

---

# § 11 — Pass 3 Starting Point

Once Pass 2 (this doc) is ratified or red-lined, Pass 3 begins:

- **File:** `docs/CLUBHOUSE_SPEC.md` Part 2 of 3 — appended to this file.
- **Scope:** 20+ screen specs, organized by tab, with confirmation gates per tab.
- **Subdivision proposal:**
  - **Pass 3a — Home tab.** ~3 screens.
  - **Pass 3b — Play tab.** ~6 screens (Start Round, Scorecard live, Sync Round, Scramble Live, Party Games active, formats).
  - **Pass 3c — Feed tab.** ~4 screens (Chat, Pulse, DMs, Activity).
  - **Pass 3d — Stats tab.** ~6 screens (Stats home, Round History, Records, Aces, Awards, Trophy Room, Season Recap).
  - **Pass 3e — More tab.** ~8 screens (Settings, Profile, Courses, Events, Trips, My Leagues, Admin, Cosmetics, Find Players, Members).

Each sub-pass is independently ratified before the next begins. Total ~27 screens including secondary states.

Every screen spec in Pass 3 cites Part 1 tokens by name. No new tokens introduced in Pass 3 without amendment to this file.

---

**End of Pass 2.** Standing by for section-by-section ratification of § 1–§ 9.
