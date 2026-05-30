# CLUBHOUSE_SPEC-HQ — Part 2, View 3g: Live Scorecard / Play Now

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Tier 1 fill-in-the-gaps deliverable. Awaiting Founder ratification.
> **Canonical mock:** No dedicated HTML mock — borrows scorecard table component from `Parbaughs HQ Final v2.html` Scorecard view. Active-scoring input layer is net-new.
> **Ship:** W1.S4 — Live Scorecard / Play Now.
> **Scope:** One view, two modes (active scoring vs review/spectator), all states. Per Vision: HQ desktop supports active scoring with touch-optimized buttons because members may use phone/tablet in the browser at the course.

---

## 0 — View scope

The active-scoring view is the in-round entry surface. It is the **only HQ view where touch optimization is mandatory** (a member on a tablet at the cart needs to tap, not click). All other HQ views can assume mouse + keyboard.

States covered:
- **3g.1** — Active scoring (viewer is the round author, in-progress round)
- **3g.2** — Resume in-progress (viewer returns to an unfinished round)
- **3g.3** — Spectator/review (read-only — viewer is not the author, or round is complete)
- **3g.4** — Round complete (post-final, transitions to W2.S3 Scorecard view)
- **3g.5** — Authorship conflict (another member is scoring this round — invariant enforcement)

---

# § 3g.1 — Active scoring state

## 3g.1.1 Frame composition

Layout differs from other HQ views. Two-panel split, no agate rail (every pixel serves entry).

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4; "Quit round" CTA in nav cluster right |
| Masthead | ~100px (compact — round context, no editorial) | See 3g.1.3 |
| Two-panel body | flex | Left 60% = scorecard table (read state); right 40% = active-hole entry pad |
| Footer | hidden | Active scoring suppresses footer to reduce vertical chrome |

No tab switcher on this view. The view IS the round.

## 3g.1.2 Banner

Hidden by default. Renders if a teammate (in multi-player scoring) is currently entering on a different device — `<b>Nick</b> is editing hole 7…` mono 11px brass eyebrow with pulse dot.

## 3g.1.3 Masthead (compact)

Single row, ~100px:

| Element | Content |
|---|---|
| Left | `LIVE · ROUND IN PROGRESS` mono 10.5px brass + pulse dot |
| Center | `{Course Name}` Fraunces italic 24px ink — primary identity |
| Center sub | `Tee: {TeeName} · Par {N} · {TotalYards} yds · {Format}` mono 11px mute-soft |
| Right | Score-to-date numeral: `+3 thru 6` Fraunces 600 32px brass tabular |

Bottom border: 1px `--cb-line`.

## 3g.1.4 Main column (left 60%) — scorecard table

Standard HQ scorecard table (matches W2.S3 component). Each hole row shows:

| Column | Width | Content |
|---|---|---|
| Hole | 60px | `1` … `18` Fraunces 600 18px tabular |
| Par | 60px | `4` mono 11px mute-faint |
| Yards | 80px | `412` mono 11px mute-faint |
| HCP | 60px | `7` mono 11px mute-faint |
| {Player 1} | flex | Score numeral + diff badge |
| {Player 2} | flex | Score numeral + diff badge |

Active hole row: `--cb-chalk-deep` background, 2px `--cb-brass` left border, sticky on scroll (always visible).

Past holes: read-only, click to edit (opens entry pad for that hole). Future holes: greyed (`--cb-mute-faint`), not interactive.

Diff badges per cell:
- `−1` (birdie) — small chip, `--cb-moss` background, ink text
- `−2` (eagle) — same with `--cb-moss` saturated
- `+1` (bogey) — `--cb-chalk-deep` background, `--cb-claret` text
- `+2` (double) — `--cb-claret` background, chalk text
- `0` (par) — no badge
- `−3+` (eagle/ace) — `--cb-brass` background, ink text

Hole boundaries: 1px `--cb-line` between rows. Front/back nine split: 2px `--cb-line` between hole 9 and hole 10. Out/In/Total summary rows in same table.

## 3g.1.5 Main column (right 40%) — active entry pad

The work surface. Optimized for thumb input on tablet (44px+ touch targets per HQ Part 1 a11y, but bumped to **56px** on this view specifically).

### Layout

```
HOLE 7
PAR 4 · 412 YARDS · HCP 7

       ┌─────────────────────────────┐
       │           5                  │ ← Score numeral, Fraunces 600 96px
       └─────────────────────────────┘

       [  −  ]                [  +  ]    ← 56×56 buttons, brass border

   FAIRWAY     GIR     PUTTS     PENALTIES
   [ ☐ Y ]   [ ☐ Y ]  [  2  ]   [   0  ]   ← 56×40 chips, 56×56 steppers
   [ ☐ N ]   [ ☐ N ]                       

   [    Notes (optional)            ]      ← text field, 56px tall

       ┌─────────────────────────────┐
       │     Save & next hole →      │ ← 56px tall, brass background
       └─────────────────────────────┘
```

| Element | Token | Notes |
|---|---|---|
| Hole eyebrow | Mono 11px brass, 1.5px tracking | `HOLE 7` |
| Hole sub | Mono 10.5px mute-soft | `PAR 4 · 412 YARDS · HCP 7` |
| Score numeral display | Fraunces 600 96px `--cb-ink` tabular, centered | Updates on `−`/`+` |
| Stepper buttons | 56×56 each, 1.5px `--cb-brass` border, transparent bg, brass on hover/press | Increment/decrement score |
| Optional stat row | 4 columns: Fairway (Y/N chips), GIR (Y/N), Putts (number stepper), Penalties (number stepper) | Each label mono 10.5px above the input. **All four fields optional — member can leave any blank without blocking save.** Save CTA enables on score numeral set; stat fields persist whatever values are entered or zero/blank for unset. |
| Notes | Single-line text input, 280 char | Mute placeholder `Anything to remember?` |
| Save CTA | Full-width 56px, brass bg, ink text, Fraunces 600 18px | Disabled if score not set |

The score numeral, par+yardage, and HCP are visible at a glance — the member doesn't have to look elsewhere to know what they're scoring.

### After Save & next hole →

- Animates score numeral down to its row in left-column scorecard (300ms, `cubic-bezier(0.4, 0.0, 0.2, 1)`).
- Right-column refreshes with hole N+1.
- If hole was 18: transitions to 3g.4 round-complete review.

### Pace tracker (top-right of entry pad)

| Element | Content |
|---|---|
| Eyebrow | Mono 10.5px brass `PACE` |
| Body | Mono 12px ink — `2:14 elapsed · 4:08 projected · 30m of pace` |
| Color | Green-text mute if under pace, brass if on pace, claret if over |

## 3g.1.6 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `rounds/{roundId}` for in-progress state | `rounds/{roundId}/holes/{holeNum}` on save |
| `members/{viewerId}` for author identity | `rounds/{roundId}/status` (in_progress → complete) |
| `courses/{courseId}` for hole metadata (par, yards, HCP) | |

Authorship invariant: only `rounds/{roundId}.authorId == viewerId` can write. See 3g.5 for conflict state.

---

# § 3g.2 — Resume in-progress state

When viewer opens this view and an `in_progress` round is associated with their member ID:

- Bypass any "start new round" flow.
- Resume modal appears: `Resume your round at Honey Run? · Last hole: 6 (par 4) · Last activity: 23 minutes ago.` with `Resume →` brass CTA and `Discard` mute text-link.
- On resume: lands on hole 7 (next unscored hole) of 3g.1 active scoring.

---

# § 3g.3 — Spectator / review state

Viewer is not the round author OR round is `complete`:

- Right column (entry pad) is hidden entirely.
- Left column expands to full width.
- Scorecard table renders read-only — past holes show actual scores, current hole (if `in_progress`) shows score-to-date and dash for unscored holes.
- Top of left column: spectator strip — `{AuthorName} is scoring · last update {time} ago` mono with pulse dot.
- If complete: transitions to W2.S3 Scorecard view (see CLUBHOUSE_SPEC-HQ-3c-Scorecard.md).

---

# § 3g.4 — Round complete state

Triggered when hole 18 is saved.

- Score numeral animates to top, scales to 120px.
- Confetti-free reveal — a brass hairline sweep across the screen, then:
  - Eyebrow: `ROUND COMPLETE`
  - H1 (Fraunces 64px): `{Score} at {Course}.`
  - Sub: `{TotalScore} total · {ScoreToPar} to par · {Time} elapsed`
- Action row: `Post to feed →` brass CTA · `Edit a hole →` text-link · `View full scorecard →` text-link

After 4 seconds or user dismiss: transitions to W2.S3 Scorecard view.

---

# § 3g.5 — Authorship conflict state

When viewer is the round author but **another device is currently writing**:

- Right column shows lockout strip: `Another device is scoring this round.` mono 11px claret + pulse dot.
- Entry pad disables (controls greyed).
- CTA: `Take over from {DeviceName} →` (brass link). On click: confirmation dialog — `This will lock out {DeviceName}. Continue?` Per ratified takeover spec (§ 3g.8): takeover is immediate at Firestore security rule layer; confirmation dialog still fires to prevent accidental override.

---

# § 3g.6 — Accessibility

- Score numeral: `aria-live="polite"` region, announces "Score: 5" on each change.
- Stepper buttons: `aria-label="Increase score, currently 5"`. Keyboard: Space/Enter to activate, arrow keys to ±1.
- Active hole row in left column: `aria-current="true"`.
- Tab order: stepper − → stepper + → fairway → GIR → putts − → putts + → penalties − → penalties + → notes → save CTA.
- Pace tracker: `aria-label="On pace, 30 minutes of pace remaining"`.
- Resume modal: focus trap, ESC discards (with confirm), Enter resumes.

---

# § 3g.7 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`
- Text: `--cb-ink`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Status: `--cb-moss` (under-par), `--cb-claret` (over-par)
- Type: `--type-mast-hq` (scaled to 96px on score numeral), `--type-stat-large`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3g.8 — Ratification block

Accepted:
- Active scoring on HQ desktop is touch-optimized (56px buttons) because tablet-at-the-cart is a real use case.
- Two-panel split: left = scorecard (read), right = entry pad (write). No agate rail.
- Save & next hole → animates score down to row, advances to next hole automatically.
- Round complete state: hairline sweep, editorial reveal, action row to Post / Edit / View.
- Authorship invariant enforced; conflict state offers explicit takeover with confirmation.

All 4 gaps resolved by Founder ratification 2026-05-12:
1. Pace projection algorithm: hole-based from member's own historical pace (per locked Founder ratification). Show elapsed time only when member has <10 rounds of pace history. Algorithm: average hole-completion time across member's last 20 rounds at this course (or platform-wide if course-specific data insufficient). Color: green/under, brass/on-pace (within 5 min), claret/over (5+ min behind).
2. Resumable round window: 7 days. After 7 days of no per-hole writes, auto-finalize-with-prompt fires per locked M3 CFR ('Did you finish this round? Finalize / Resume / Discard'). Three-option resolution per locked decision. Aligns with golf-week cadence — most members play weekly, app-open weekly minimum.
3. Authorship takeover: immediate at Firestore security rule layer. Confirmation dialog still fires before the takeover write to prevent accidental override. Stale-author writes (from the device being taken over) reject at rule layer with audit log entry. New author has immediate write authority post-confirmation.
4. Stat panel scope: all 4 fields visible during live play but all optional — member can leave any blank without blocking save. Full stats analysis displays post-round on M4 Stats tab. Reduces distraction during entry; analytical depth available after round complete.
