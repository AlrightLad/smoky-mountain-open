# Secondary-text ramp WCAG AA — default theme FIXED (v8.23.98); follow-up remains

**Status:** DEFAULT-theme core SHIPPED v8.23.98 (`--cb-mute` #7A766B→#656259 4.63:1, `--cb-mute-1`
#6B6862→#5F5C50 5.09:1 — verified contrast-check.mjs + vision across More/Members/Home/etc.).
Remaining = (a) the 5 unlock themes' `--cb-mute`, (b) the `--cb-mute-soft` faintest-tier decision +
per-consumer reclassification. · **Severity:** medium (ADA/WCAG) · **Type:** app-wide palette

## REMAINING follow-up (each needs per-theme vision verification → a focused ship)
1. **5 unlock-theme `--cb-mute` darkening** — computed AA-safe values (verified ≥4.6 on each theme's
   canvas via contrast-check method), pending a per-theme visual pass (switch theme, re-capture):
   | theme | mute now | → AA-safe |
   |---|---|---|
   | twilight_links | #74798A (2.80) | **#545763** (4.65) |
   | linen_draft | #8A8974 (2.65) | **#626152** (4.68) |
   | champion_sunday | #8A7264 (3.03) | **#69574C** (4.62) |
   | bourbon_room | #8C6B4A (3.02) | **#695037** (4.65) |
   | course_record | #7A8078 (2.86) | **#5A5F59** (4.61) |
2. **`--cb-mute-soft` (#928E80, 2.49)** — the faintest tier. Darkening it to AA collapses it into mute
   (tier-vs-AA conflict below). DECISION needed: keep mute-soft decorative-only and **reclassify its 28+
   essential-text consumers** (calendar metas/eyebrows/empty-bodies, settings-nav links, admin-nav,
   onboarding counter/detail/link, chip-composer) to `--cb-mute`/`--cb-mute-1` (now AA-safe) — OR retune.

---

(original analysis below — note the default-theme mute/mute-1 portion is now resolved)

## The finding
v8.23.96 fixed the 3 audit-sampled WCAG AA failures (feed composer, settings desc, awards labels). But the
root token `--cb-mute` (#7A766B) is the app's **default secondary-text color**, used as `color:` **122× in
components.css + 49× via the `--muted` alias + hundreds of inline uses across ~45 page files** — and it
**fails AA on the page ground** (`--cb-canvas #E7E0CD`): **3.44:1** (need 4.5:1). So secondary text is
under-contrast app-wide, not just on the 3 fixed surfaces.

Usage is overwhelmingly text: `--cb-mute` appears 122× as `color:`, **1×** border, **0×** background/fill,
and is **never** text on a dark ground (verified) — so darkening it is safe (a text-legibility change, not a
structural one).

## Why it's NOT a one-line fix (ramp coherence)
The secondary-text family is a designed ramp. Darkening only `--cb-mute` inverts it:
`--cb-mute-1` (#6B6862, "body-secondary") is **4.22:1** on canvas (also FAILS) and would become *lighter*
than a darkened `--cb-mute`. A correct fix re-tunes the readable-text tokens **coherently** so they all clear
AA while preserving order, and does so for **all 6 themes** (each has its own `--cb-mute` hue: clubhouse
warm-gray, twilight cool-blue, bourbon brown, etc. — verified per-theme below).

## Proposed coherent fix (default `clubhouse` theme; replicate per-theme)
Lightest hue-preserving values clearing AA on canvas (verified via `scripts/visual-audit/contrast-check.mjs`):
| Token | now | now ratio (canvas) | → proposed | proposed ratio |
|---|---|---|---|---|
| `--cb-mute` (readable secondary) | #7A766B | 3.44 ❌ | **#646158** | 4.70 ✅ |
| `--cb-mute-1` (body-secondary) | #6B6862 | 4.22 ❌ | **#5F5C50** (= ink-faint) or darker | 5.09 ✅ |
| `--cb-mute-soft` (faint readable) | #928E80 | 2.49 ❌ | darken to ≥4.5 **or** formally restrict to non-text | — |
| `--cb-mute-2/-3` (decorative/disabled/hairline) | — | — | leave (non-essential, exempt) | — |

Per-theme `--cb-mute` darkening factor ≈ 0.82–0.84 of current brightness clears AA on each theme's canvas
(twilight #74798A, linen #8A8974, champion #8A7264, bourbon #8C6B4A, course-record #7A8078 each need their
own computed value — same method).

## Key constraint — the tier-vs-AA conflict (this is a DESIGN decision, not a mechanical darkening)
The family is designed as 3 *faint readable* tiers (mute-soft faintest → mute → mute-1). But the lightest
value clearing AA on canvas is ~#66635A (4.56:1). To make all three AA-safe, all three must sit in a narrow
dark band → they become **visually indistinguishable**, collapsing the 3-tier hierarchy. **You cannot have
three distinct faint readable tiers that are all AA-compliant on the canvas ground.** So the real decision is
a design-architecture call: reduce to fewer readable secondary tiers (one AA-safe secondary + decorative-only
faints), and explicitly designate which tokens are text vs decorative-only. That is the Founder/design-lead's
call — exactly why this is surfaced, not auto-shipped.

## Blast radius — `--cb-mute-soft` (#928E80, 2.49:1, the worst) is widely used for essential + interactive text
28+ `color:var(--cb-mute-soft)` uses in components.css alone span: calendar (subdecks, metas, eyebrows,
empty-state bodies, day-card meta, legend, list separators), settings-nav links (`.set-nav__link` — an
interactive nav control), admin-nav links, onboarding (counter/detail/link), and the chip composer
(close button, counter, placeholder). Many are essential body text (`.cal-empty__b` 14px, `.cal-dcard__meta`
13px, `.cal-sec-sub` 13px) or interactive controls (nav links, view toggles, close buttons) — all at 2.49:1.
These are not isolated nits; they are the same systemic root and must be resolved as part of the tier decision
above (essential text → AA-safe token; decorative → explicitly restricted), not patched one-by-one.

## Why surfaced, not auto-shipped
This darkens **every** secondary-text line across the marathon-tuned palette in all 6 themes — an app-wide
aesthetic shift the Founder tuned + approved. It's legally motivated (AA = Legal RED) so it WILL be fixed,
but the *visual* call (how dark) is taste-adjacent → propose-first per AMD-015, ship to staging for Founder
review per the staging-first loop. The change is subtle (modest darkening, hue + hierarchy preserved) and
trivially reversible (token values). Recommend doing it as one coherent ship across all 6 themes with a broad
multi-surface + multi-theme vision verification, not piecemeal.
