# Next design-system batch item — secondary-text ramp fails WCAG AA app-wide

**Status:** documented finding + proposed fix (NOT yet implemented) · **Severity:** medium (ADA/WCAG, ship-blocking under Legal charter) · **Type:** app-wide palette re-tune → Founder-visibility warranted (P7/AMD-028)

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

## Why surfaced, not auto-shipped
This darkens **every** secondary-text line across the marathon-tuned palette in all 6 themes — an app-wide
aesthetic shift the Founder tuned + approved. It's legally motivated (AA = Legal RED) so it WILL be fixed,
but the *visual* call (how dark) is taste-adjacent → propose-first per AMD-015, ship to staging for Founder
review per the staging-first loop. The change is subtle (modest darkening, hue + hierarchy preserved) and
trivially reversible (token values). Recommend doing it as one coherent ship across all 6 themes with a broad
multi-surface + multi-theme vision verification, not piecemeal.
