# CLUBHOUSE_SPEC — Part 2, Sub-pass 3b: Play Tab

> **Status:** Awaiting Founder ratification. Subordinate to Part 1 (`docs/CLUBHOUSE_SPEC.md`) and Sub-pass 3a.
> **Pass:** 3b of 4. Folded into final CLUBHOUSE_SPEC.md at Part 2 § 3b after ratification.
> **Scope:** 6 Play-tab screens, all states. No other tabs.

---

## 0 — Sub-pass scope

Six screens spec'd:

- **3b.1 — Play tab home / dispatcher**
- **3b.2 — Start Round (course + format + players + settings)**
- **3b.3 — Scorecard live (the round itself)**
- **3b.4 — Sync Round (post-round reconcile + finalize)**
- **3b.5 — Scramble Live (team format in-round)**
- **3b.6 — Party Games active (overlay layer during a round)**

Format library / browse is a sub-surface inside 3b.2; not a separate screen.

Every screen below clears 12 rejection criteria, cites Part 1 tokens, declares cross-surface consumers, and references Pass 1 § 8 authorship invariants on round-author surfaces.

---

# Screen 3b.1 — Play Tab Home / Dispatcher

## 3b.1.1 Purpose

When the member taps the **Play** tab, content depends on context — and the tab itself is the dispatcher.

| State | What Play tab shows |
|---|---|
| **No active round** | Start-Round entry screen (§ 3b.2) |
| **One active round, member is author** | Scorecard live (§ 3b.3) — direct, no dispatcher |
| **One active round, member is spectator** | Scorecard live in spectator mode (§ 3b.3 read-only variant) |
| **Multiple active rounds in league** | Picker: list of active rounds, member's own first if authoring |
| **Just-finalized round (within 5 min)** | Sync Round (§ 3b.4) |

**Authorship invariant (Pass 1 § 8.4):** A round has exactly one author at a time. The Play tab routes the author to Scorecard live; spectators get the read-only variant. Handoff (§ 8.4) is the only way authorship transfers.

## 3b.1.2 Multi-round picker (rare state)

| Element | Token | Notes |
|---|---|---|
| Page eyebrow | `--type-label`, `--cb-mute` | `ACTIVE IN THE LEAGUE` |
| Headline | `--type-h1`, `--cb-ink` | `Three rounds going.` (count is content) |
| Round card (each) | `--bg-sunk` fill, `--radius-md`, `--space-4` padding | Tap → that round's scorecard |
| Card eyebrow | `--type-label`, `--cb-brass-deep` for own round; `--cb-mute` for others | `YOUR ROUND` / `SPECTATING` |
| Card headline | `--type-body-lg`, `--cb-ink` | `Ocean Pines · Hole 7` |
| Card meta | `--type-body-sm`, `--cb-mute` | `Started 9:42 · 3 players` |

## 3b.1.3 Cross-surface consumers

- `rounds` collection, league-scoped, filter `status='active'`.
- Routes to **Start Round (3b.2)**, **Scorecard live (3b.3)**, **Sync Round (3b.4)**.

## 3b.1.4 A11y

Picker rows are `role="link"`; own round announced first in DOM and visual order.

---

# Screen 3b.2 — Start Round

## 3b.2.1 Frame

Same masthead + tab bar as Home. Content scrolls. Primary CTA is **anchored to bottom** above tab bar — does not scroll with content.

## 3b.2.2 Page header

| Element | Token | Content |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-brass-deep` | `NEW ROUND` |
| Headline | `--type-display`, `--cb-ink` | `Start a round.` |

## 3b.2.3 Step modules (vertical stack)

Each step is a tappable row. Tapping opens a bottom sheet for selection. Completed steps show the chosen value; incomplete show prompt copy.

### Course

| State | Display |
|---|---|
| Empty | Eyebrow `COURSE` (`--cb-brass-deep`), Headline `Pick a course.` (`--cb-mute`), chevron right |
| Picked | Eyebrow `COURSE`, Headline `Ocean Pines G&CC`, Sub-line `18 holes · Par 72`, chevron right |

Bottom sheet: search field at top (`--type-body-lg`, `--cb-mute` placeholder `Search courses…`), recently-played list, then alphabetical. Tap a course closes sheet and updates row.

### Format

| State | Display |
|---|---|
| Empty | Headline `Pick a format.` |
| Picked | Headline `Stroke play` (e.g.), Sub-line `Solo · Net + gross scoring` |

Bottom sheet contents: format library — grouped by category (`SOLO`, `TEAM`, `WAGERED`, `PARTY GAMES`). Each format card shows name + 1-line description + difficulty pip. Tap selects + closes.

### Players

| State | Display |
|---|---|
| Self only | Headline `Just you.`, Sub-line `Add players →` |
| Multiple | Headline `4 players.`, Sub-line shows avatars row inline (avatar specs from Pass 1 type tokens) |

Bottom sheet: search by name (queries `fbMemberCache`), recently-played-with at top, then alphabetical. Add by tap; remove by swipe-left on chip in confirmed row. Player count cap = format-defined (e.g., 4 for scramble, unlimited for casual).

### Settings (collapsed by default)

Disclosure row: `▸ Settings` collapsed, `▾ Settings` expanded. Contents when expanded:

- **Holes:** 18 / 9 front / 9 back — segmented control (`--cb-brass` active, `--cb-mute` inactive)
- **Tees:** dropdown (course-dependent)
- **Skins pot:** toggle + amount input if on (`Parcoin` unit)
- **GPS:** toggle (on by default; off if no permission granted)
- **Spectator broadcast:** toggle (on by default — anyone in league can spectate)

## 3b.2.4 Bottom-anchored primary CTA

| State | Spec |
|---|---|
| Incomplete (course or format unpicked) | `--cb-chalk-deep` fill, `--cb-mute` text, label `▸ Tee off` — disabled, `aria-disabled="true"` |
| Complete | `--cta-fill` (brass), `--cta-text`, label `▸ Tee off · Ocean Pines · Stroke`, 56px height, full-width minus `--space-5` gutters, `--shadow-2` |

Tap → creates round document (status `active`), navigates to Scorecard live (3b.3).

## 3b.2.5 States

| State | Behavior |
|---|---|
| **Loading (sheet content)** | Skeleton rows (3 rows for course list, 2 for players); shimmer per Pass 2 § 4.4; `aria-busy="true"` |
| **Error — course list fetch** | Empty sheet with `Couldn't load courses. Retry →` link; pull-to-refresh in sheet retries |
| **No GPS permission** | Settings row shows `GPS off · Tap to enable`; tapping triggers permission pre-prompt (Pass 2 § 7) |
| **Member not in any league** | Page redirects to Onboarding (W1.S14) — Start Round requires league context |

## 3b.2.6 Sunlight mode

- Step rows: dashed `--cb-line` border replaces `--bg-sunk` fill.
- Primary CTA stays brass (already high contrast).
- Disabled CTA: `--cb-chalk` background + 1px `--cb-mute` border + `--cb-mute` text.

## 3b.2.7 Reduced motion

- Bottom sheets: 250ms slide-up reduced to instant fade.
- Disclosure expand: height transition removed; instant.

## 3b.2.8 A11y

- Each step row: `role="button"`, `aria-haspopup="dialog"`, label describes step + state ("Course, not yet picked" / "Course, Ocean Pines G&CC").
- Bottom-anchored CTA: `aria-disabled` reflects state; screen reader announces disabled reason ("Pick a course and format to tee off").
- Bottom sheet: focus trapped inside; `Esc` / swipe-down closes; first focusable element on open is the search field.
- Player chips: `aria-label="Nick, tap to remove"` for swipe / long-press to remove.

## 3b.2.9 Architectural feasibility (Criteria 4, 5)

- Round creation writes to `leagueCollection('rounds').add({...})` via wrapper.
- Authorship: `authorId = currentMember.id` per Pass 1 § 8.4.
- Created round seeds the listener chain that Scorecard live (3b.3) consumes.

## 3b.2.10 Cross-surface consumers

| Surface | Operation |
|---|---|
| `courses` collection | Read (course list + detail) |
| `fbMemberCache` | Read (player search) |
| `members/{id}.recentlyPlayedCourses` | Read (recently-played list) — `[INFERENCE]` field name; defer to W1.S4 |
| `rounds` collection | **Write** — new round doc on `Tee off` |
| Navigates to **Scorecard live (3b.3)** |

---

# Screen 3b.3 — Scorecard Live

The work surface. Members spend more time here than anywhere else in the app during a round.

## 3b.3.1 Frame

| Slot | Behavior |
|---|---|
| Masthead | **Hidden** by default while in-round (max focus). Pull-down from top edge reveals masthead for 6 seconds. |
| Banner slot | Hidden unless CRITICAL banner active. |
| Hole-header (new) | Persistent at top — replaces masthead role in-round. |
| Scroll container | Hole-by-hole content; vertically scrollable |
| Tab bar | Hidden by default while in-round. Pull-up from bottom edge reveals for 6 seconds. |

Reasoning: Scorecard live is **modal-equivalent in attention** even though it lives inside the Play tab. Members are on a tee box, gloves on, sun in eyes. Chrome competes with the score; chrome loses.

## 3b.3.2 Hole-header (persistent, replaces masthead)

Vertical stack, top of viewport, safe-area-aware.

| Row | Spec | Content |
|---|---|---|
| Status strip | 32px tall, `--cb-felt` background, `--cb-chalk` text, full-width | `THE PARBAUGHS · OCEAN PINES · ROUND IN PROGRESS` (eyebrow scale) |
| Hole row | 80px tall, `--bg`, divider 1px `--cb-line` below | Three-column: prev-hole arrow / hole number + par / next-hole arrow |
| Score band | 56px tall, `--bg-sunk`, divider 1px `--cb-line` below | Per-player score chips (see § 3b.3.4) |

### Hole row contents

| Element | Token | Notes |
|---|---|---|
| Prev arrow | 48×48 hit area, `--cb-mute` glyph, disabled on hole 1 | Tap → previous hole; long-press → hole picker bottom sheet |
| Hole numeral | `--type-stat-lg` (32px serif 700), `--cb-ink`, centered | `7` |
| Par + yardage sub | `--type-label`, `--cb-mute`, below numeral | `PAR 4 · 412Y` |
| Next arrow | 48×48, `--cb-brass-deep` glyph | Tap → next hole; disabled on hole 18 |

Edge-swipe horizontal also navigates holes (Pass 2 § 5.3); swipe-down on hole row opens hole picker.

## 3b.3.3 Hole picker bottom sheet

3-row × 6-column grid of hole numerals. Each: 56×56, `--cb-chalk` background, `--type-stat-md`, `--cb-ink`. Played holes show small dot below numeral (par/birdie/bogey color-coded). Current hole highlighted brass.

## 3b.3.4 Score band (per-player chips)

Horizontal scroll row of player chips — one per player in the round.

| Chip element | Token | Notes |
|---|---|---|
| Container | 64×40, `--radius-md`, `--bg`, 1px `--cb-line` | Active player chip: `--cb-brass` border, `--shadow-1` |
| Avatar | 24×24 left | `--radius-pill`, name initial fallback if no photo |
| Score numeral | `--type-stat-md` (24px serif 600, tabular-nums), `--cb-ink` | `4` |
| Score plus-minus pip | 4×4 dot below numeral | `--cb-felt` for under par, `--cb-mute` for par, `--cb-brass-deep` for over |

Tap a chip → makes that player the **active player** for input. The score-entry panel below updates.

## 3b.3.5 Score-entry panel (main work area)

Fills remaining viewport. Vertical stack.

### Stat layer (top)

| Element | Token | Content |
|---|---|---|
| Active player label | `--type-label`, `--cb-mute` | `MR PARBAUGH ON HOLE 7` |
| Strokes counter | Center, `--type-display` (72px serif 700, tabular-nums), `--cb-ink` | `4` |
| Plus-minus to par | `--type-body-lg`, `--cb-brass-deep` (under), `--cb-mute` (par), `--cb-felt-deep` (over) | `+0 TO PAR` |
| Round running total | `--type-body-sm`, `--cb-mute` | `THRU 6 · +3 OVERALL` |

### Input layer (middle)

Big `−` and `+` buttons either side of strokes counter:

| Element | Token | Notes |
|---|---|---|
| − button | 72×72, `--cb-chalk-deep` fill, `--cb-ink` glyph, `--radius-pill` | Tap → strokes − 1; haptic light tap; disabled at 1 |
| + button | 72×72, `--cb-brass` fill, `--cb-felt-deep` glyph, `--radius-pill`, `--shadow-1` | Tap → strokes + 1; haptic light tap; long-press shows quick-set sheet (1–10) |

Buttons sized for **gloved single-handed use** per Pass 2 § 6.3.

### Detail layer (bottom, collapsed by default)

`▸ More` disclosure expands to:

- **Putts:** −/+ stepper, smaller (48×48)
- **Penalties:** −/+ stepper
- **Fairway hit:** segmented Yes / No / N/A
- **GIR:** auto-derived but tappable to override
- **Sand save:** segmented Yes / No / N/A
- **Notes:** text field, `--type-body-sm`, `--cb-mute` placeholder `Add a note…`

## 3b.3.6 Next-hole gesture

When all players on the current hole have scores entered, a `▶ Next hole` chip slides up from bottom-edge (above tab-bar safe-area). Tap → advances. Swipe-left also advances (per Pass 2 § 5.3).

Auto-advance is **off by default** (member chooses pace). Setting in Settings → Play to enable.

## 3b.3.7 GPS layer (optional)

If GPS toggled on at start:

- Small floating chip top-right of hole row: `212Y TO PIN · 195 TO FRONT · 230 TO BACK`.
- `--type-body-sm`, `--cb-chalk` text on `--cb-felt` background, `--radius-pill`, 8px y-pad / 12px x-pad.
- Updates every 5 seconds while moving (Pass 2 § 7 GPS contract).
- Loading state: `Locating…` italic with single pulsing dot.
- Error state (no GPS lock after 30s): `GPS off · tap to retry`.

## 3b.3.8 Spectator-mode variant

When member is **spectating** (not authoring):

- Score-entry panel hides. Replaced by read-only stat block.
- All player chips render but none are tappable as "active for input."
- Banner-style strip top of score band: `SPECTATING — {author name} is scoring this round.`, `--type-body-sm`, `--cb-mute`.
- "Hand off scoring" affordance present **only on the author's device** per Pass 1 § 8.4.

## 3b.3.9 Handoff flow

`Hand off scoring →` (text link in score-entry panel footer for author):

1. Tap → bottom sheet: list of league members currently in round (have the app open with this round visible).
2. Tap a name → confirmation: "Hand off scoring to Nick? You'll become a spectator."
3. Confirm → atomic write: `authorId = nick.id`. Both devices re-render.

If no candidate member is "present" (no listener), sheet shows: `No one else has this round open. Ask them to open the round first.`

## 3b.3.10 States

| State | Behavior |
|---|---|
| **Loading (round hydrating)** | Skeleton hole-header + 4 chip skeletons + skeleton strokes counter. `aria-busy`. |
| **Offline** | Tab bar shows persistent `OFFLINE — saving locally` strip per Pass 2 § 8.3. Score writes queue. UI fully functional. |
| **Sync conflict** | Score band shows brass underline beneath conflicting player. Tap → bottom sheet shows local vs. server values; member resolves. |
| **Round complete (all 18 played)** | `Finish round →` chip slides up replacing `Next hole`. Tap → Sync Round (3b.4). |
| **Permission: spectator** | See § 3b.3.8 |
| **Empty (round just created)** | Hole 1 selected, strokes counter at par (default editable) |

## 3b.3.11 Reduced motion

- Auto-advance chip slide: instant fade in.
- Hole swipe: cross-fade instead of slide.
- Strokes counter `+`/`−` press feedback: scale stays at 1.0; only color fades.
- Active-chip brass border appears instantly (no fade).

## 3b.3.12 Sunlight mode

- Strokes counter: shift from `--cb-ink` to pure black `oklch(15% 0 0)` for max contrast.
- Score band background: removed; chips float on `--bg` with 1.5px `--cb-line` border.
- `+` button: `--cb-felt` fill (replaces brass — higher saturation, AAA on chalk).
- GPS chip: increases to `--cb-felt-deep` background.

## 3b.3.13 A11y

- Hole header: `role="banner"` ; `aria-label="Hole 7, par 4, 412 yards"`.
- Player chips: `role="tab"`, `aria-selected` reflects active state; chip row is `role="tablist"`.
- Score-entry panel: `role="tabpanel"`.
- Strokes counter: `aria-live="polite"`; announces "4 strokes, par, plus 3 overall" on change.
- `+` / `−` buttons: `aria-label="Add stroke"` / `"Remove stroke"`.
- Pull-to-reveal chrome: announces via `aria-live` ("Showing navigation").
- Handoff confirmation: standard sheet a11y; first focusable is decline action (safer default).

## 3b.3.14 Authorship invariants (Pass 1 § 8.4)

- `authorId` is a single member ID. Server enforces single-writer via Firestore security rules during W1.S4.
- Score writes from non-author devices are **rejected** (client-side validated first; server-rules backstop).
- Handoff is the **only** mechanism to transfer; no automatic "first to write wins."
- Author leaving the app does NOT release authorship — they remain author until explicit handoff or round completion.
- If author's session dies (auth expiry, app uninstall mid-round), **founder-only escalation path** to reassign — out of scope for v1; mark as W1.S4 follow-up.

## 3b.3.15 Cross-surface consumers

| Surface | Operation |
|---|---|
| `rounds/{id}` | **Read + Write** — primary surface for this screen |
| `rounds/{id}/holes` (subcollection or array) | Read + Write |
| `fbMemberCache` | Read (player chips) |
| `courses/{id}` | Read (hole pars, yardages) |
| `members/{id}.preferences.autoAdvance` | Read |
| Navigates to **Sync Round (3b.4)** on completion |
| Navigates to **Scramble Live (3b.5)** if format is scramble |
| Navigates to **Party Games active (3b.6)** if party games active in round |

---

# Screen 3b.4 — Sync Round (Post-Round Reconcile)

## 3b.4.1 Purpose

Between "I tapped finish on the 18th" and "this round is in my history and the league knows," there is a reconciliation step. This screen is that step.

Why it exists as a separate screen rather than auto-finalization:

1. **Sync conflict resolution.** Offline writes from gloved-finger entry have errors. Members review before commit.
2. **Founding-crew trust.** Members must see "what I logged" before it propagates to handicap, league pulse, awards.
3. **Attribution chrome.** Photo, note, course conditions — added once, post-round, when the member has thumbs free.

## 3b.4.2 Frame

| Slot | Behavior |
|---|---|
| Masthead | Visible (round is over; focus returns) |
| Hole-header | Hidden |
| Tab bar | Visible |
| Content | Scrollable summary |
| Bottom CTA | `Finalize round` anchored — primary action |

## 3b.4.3 Hero block

| Element | Token | Content |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-brass-deep` | `ROUND COMPLETE · REVIEW & POST` |
| Headline | `--type-display`, `--cb-ink` | `98 at Ocean Pines.` |
| Sub-line | `--type-body-lg`, `--cb-mute` | `18 holes · Stroke · 3h 42m · Tuesday afternoon` |

## 3b.4.4 Score summary card

| Element | Token | Notes |
|---|---|---|
| Card | `--bg-sunk`, `--radius-lg`, `--space-5` padding |  |
| Front-9 / Back-9 split | Two columns, `--type-stat-md` (24px serif 600) numerals | `47 · 51` with `--cb-mute` labels `FRONT` / `BACK` |
| Hairline divider | 1px `--cb-line` between columns and totals row |  |
| Totals row | `--type-stat-lg`, `--cb-ink` | `98 · +26` (total / over par) |
| Drill-in link | `View hole-by-hole →`, `--cb-brass-deep`, `--type-body-sm` | Tap → full scorecard read-only |

## 3b.4.5 Multi-player summary

For each other player in the round:

| Row | Spec |
|---|---|
| Container | `--space-3` vertical padding, divider 1px `--cb-line` between |
| Avatar | 36×36 left |
| Name + score | `--type-body`, `--cb-ink` for name; `--type-stat-md` right-aligned for score |
| Sub-line | `--type-body-sm`, `--cb-mute` | `+24 to par · 47/51` |

## 3b.4.6 Attribution block

Three optional inputs:

- **Photo:** tap-to-add square 88×88 with `--cb-chalk-deep` fill + camera glyph. Triggers Capacitor camera per Pass 2 § 7. Multiple photos allowed (max 5).
- **Note:** text area, `--type-body`, placeholder `What was the round like? (optional)`. 280 char limit, counter at 240.
- **Conditions:** chip selector — `WINDY` / `WET` / `COLD` / `HOT` / `FOGGY` / `PERFECT`. Multi-select, max 3.

## 3b.4.7 Wager / coin section (conditional)

If round was wagered:

- Eyebrow `WAGER RESULT`, `--cb-brass-deep`.
- Headline shows outcome: `You won 25 Parcoin` / `You lost 10 Parcoin` / `Skin carries to next round`.
- Drill-in: `View breakdown →` → Wagers detail surface (W1.S6).

## 3b.4.8 Primary CTA — Finalize round

Bottom-anchored, full-width minus gutters, 56px height, brass fill.

| State | Label |
|---|---|
| Default | `Finalize round` |
| Pending edits to score | `Save edits & finalize` |
| Sync conflict unresolved | `Resolve conflicts to finalize` (disabled) |

On tap: writes `status='complete'` + attribution + photos. Triggers downstream: handicap recompute, activity feed entry, awards check, wager settlement. Navigates to Home (3a) which displays celebration state (3a.3.5).

## 3b.4.9 Secondary actions row

| Action | Token | Notes |
|---|---|---|
| `Discard round` | Text link, `--cb-mute`, italic | Tap → confirm sheet: "Discard? This round won't count toward your handicap or stats." Author only. |
| `Resume scoring` | Text link, `--cb-brass-deep` | Tap → returns to Scorecard live (3b.3). Useful if member finalized prematurely. |

## 3b.4.10 States

| State | Behavior |
|---|---|
| **Uploading photos** | Inline progress bar per photo; tab bar shows count `Uploading 2 of 3 photos…` |
| **Sync conflict** | Banner-tier message at top of content: `Some scores have offline conflicts. Resolve below →` (anchors to conflict rows in score summary, brass-underlined) |
| **Offline at finalize** | CTA writes locally + queues per Pass 2 § 8.3. Toast confirms `Saved. Posting when you're back online.` |
| **Permission: spectator** | This screen never shows for spectators — Sync Round is author-only. |

## 3b.4.11 Reduced motion + Sunlight

- Photo thumbnail expand: instant.
- Conditions chip select: no scale press feedback.
- Sunlight: card fills become outlined; brass-deep replaces brass on accents.

## 3b.4.12 A11y

- Hero headline: `aria-live="polite"`.
- Score summary: `role="table"` with column headers FRONT / BACK / TOTAL.
- Photo input: `aria-label="Add photo (optional)"`.
- Finalize CTA: `aria-disabled` reflects state; disabled reason in screen reader.

## 3b.4.13 Authorship invariants

- Only author can finalize.
- Finalize is a one-way commit. After finalize, score edits require league admin / founder per locked decisions on round amendments (`[INFERENCE]` — confirm during W1.S4).

## 3b.4.14 Cross-surface consumers

| Surface | Operation |
|---|---|
| `rounds/{id}` | Read + Write (status, attribution) |
| `rounds/{id}/photos` | Write (Firebase Storage refs) |
| Capacitor camera plugin | Read (per § 7 contract) |
| `members/{id}.handicapIndex` | **Indirect** — Cloud Function trigger on `status='complete'` |
| `leagues/{leagueId}/activity` | Indirect write via Cloud Function |
| `leagues/{leagueId}/awards` | Indirect check via Cloud Function |
| `wagers/{id}` | Indirect settlement if applicable |
| Navigates to **Home (3a)** on finalize |

---

# Screen 3b.5 — Scramble Live (Team Format In-Round)

## 3b.5.1 Purpose

Scramble is a **team format** with shared scoring per hole. The work surface differs from individual stroke play meaningfully — one score per team per hole, with attribution to whose ball was used.

## 3b.5.2 Frame

Identical chrome to Scorecard live (3b.3) — masthead hidden, hole-header persistent, tab bar hidden. Score-entry panel and score band differ.

## 3b.5.3 Score band — teams not players

Each chip = team. Two teams typical; up to 4. Chip spec:

| Element | Spec |
|---|---|
| Container | 96×52, `--radius-md`, larger than player chip — teams hold more identity |
| Team color stripe | 4px left edge, team color (assigned at round start from a 4-color palette: brass / felt / chalk-deep / `[INFERENCE]` propose a fourth — burgundy oklch tied to brass) |
| Team name | `--type-label`, `--cb-ink` | `EAGLES` |
| Score numeral | `--type-stat-md`, `--cb-ink`, tabular-nums | `4` |
| Member avatars (compressed) | Row of 16×16 avatars, `--radius-pill` | Up to 4; "+N" pill if more |

## 3b.5.4 Score-entry panel

### Active team / hole label

`EAGLES ON HOLE 7 · PAR 4` (`--type-label`, `--cb-mute`).

### Strokes counter

Same as 3b.3.5 — display 72px numeral, `+` / `−` buttons.

### Ball selection row (NEW for scramble)

After hole-score entered, prompt:

| Element | Spec |
|---|---|
| Eyebrow | `--type-label`, `--cb-brass-deep` | `WHOSE BALL?` |
| Chips | Row of player avatars, 48×48, `--cb-chalk-deep` border 2px (unselected) → `--cb-brass` border 2px (selected) | Tap one |
| Skip option | Text link `--cb-mute` | `Skip — don't track` |

This is core scramble metadata — "who hit the ball we played" for stats and rivalry tracking.

## 3b.5.5 Team-stats overlay

A `Team stats →` link below the strokes counter expands to:

- Drives used per player count
- Putts holed per player count
- Best-ball estimate (what each player would have scored solo)

## 3b.5.6 States

Identical state matrix to 3b.3, plus:

- **Team imbalance warning** — if drives-used counts diverge >3 between teammates: subtle nudge banner `Spread the love — Nick has driven 5x, Kayvan 0x.`, `--type-body-sm`, `--cb-mute`. Dismissible per round.

## 3b.5.7 Authorship invariants

Same single-author rule. Author scores for the whole team. Handoff transfers authority across all teams (not per-team — too complex for v1).

## 3b.5.8 Cross-surface consumers

Same as 3b.3 plus:

- `rounds/{id}.teams[]` (team structure)
- `rounds/{id}/holes[].ballOwner` (per-hole ball attribution)

## 3b.5.9 A11y + Reduced motion + Sunlight

- Team chips: `role="tab"`, color stripe is decorative (`aria-hidden`); name text carries identity.
- Ball selection: `role="radiogroup"`, `aria-label="Whose ball was used on this hole?"`.
- Skip option included in roving tabindex.
- Reduced motion: ball-selection brass-border transition instant.
- Sunlight: team color stripes thicken to 6px for visibility.

---

# Screen 3b.6 — Party Games Active (Overlay Layer)

## 3b.6.1 Purpose

Party games (closest-to-pin, longest drive, snake-eats, etc.) are **meta-games layered onto a round**. They don't replace scoring; they augment it. The screen is an overlay invokable from any hole during 3b.3 or 3b.5.

## 3b.6.2 Invocation

- Floating action button (FAB) bottom-right of Scorecard live, 56×56, `--cb-brass` fill, party-glyph icon. Hidden if no party games active in round.
- FAB shows tiny brass dot top-right if there's a pending decision (e.g., closest-to-pin still unclaimed on this hole).

## 3b.6.3 Sheet layout

Tap FAB → bottom sheet opens 70% viewport height (per Pass 2 § 5 gesture vocabulary).

| Section | Spec |
|---|---|
| Header | Eyebrow `PARTY GAMES · HOLE 7`, headline `Closest to pin.` |
| Active game card | Per active game on this hole — closest-to-pin / longest drive / nearest-water / etc. |
| Game roster | Players in the game, current claim displayed inline |
| Claim CTA | `Claim it →` brass; `Pass` `--cb-mute` text link |

## 3b.6.4 Closest-to-pin claim card example

| Element | Content |
|---|---|
| Eyebrow | `CLOSEST TO PIN · 200 PARCOIN POT` |
| Headline | `Who's on the dance floor?` |
| Current claimant | `Nick · 18 ft (claimed 12 min ago)` |
| Distance input | Tappable: `Your distance (ft)` opens numeric entry sheet |
| Submit | `▸ Claim — 12 ft` (auto-updates label based on entered distance) — disabled until input |

Once submitted, leaderboard re-sorts. Member with shortest distance at hole-completion wins the pot.

## 3b.6.5 Game-types library

The FAB also has a `+` affordance to add a new party game mid-round. Tap → list:

- Closest to pin (per hole)
- Longest drive (per hole)
- Snake / Wolf / Bingo-Bango-Bongo (round-long)
- Custom (text-input named game, manual scoring)

Each game shows config (pot size, eligible holes) before adding.

## 3b.6.6 States

| State | Behavior |
|---|---|
| **No active games** | FAB hidden. Tab in Settings on Start Round (3b.2) added party games at round start. |
| **All games settled for this hole** | FAB shows green dot top-right (decorative — settled state). |
| **Wager dispute** | If two members claim same distance: banner inside sheet `Two claims at 12 ft — tap to resolve` → resolution flow (founder arbitration or replay). `[INFERENCE]` — confirm dispute mechanism W1.S7. |
| **Spectator** | Sheet renders read-only — no claim CTA. |

## 3b.6.7 Authorship + Cross-surface consumers

- Party game state lives on `rounds/{id}/partyGames` (subcollection).
- **All round participants can write to party-game subcollection** (claims) — distinct from main round authorship. Pass 1 § 8.4 single-author rule applies only to hole scores.
- Settlement of party games happens at hole completion (closest-to-pin) or round completion (snake, wolf).
- Cross-surface: `coinTransactions` on settlement; activity feed entry per claim+settlement.

## 3b.6.8 A11y

- Sheet: standard a11y from § 7.
- FAB: `aria-label="Party games — 1 pending"` (announces pending count).
- Game cards: `role="region"`.
- Claim CTA: announces distance value before submit ("Claim closest to pin at 12 feet").

## 3b.6.9 Reduced motion + Sunlight

- FAB pulsing for pending decision: animation removed under reduced motion; static brass dot only.
- Sheet slide: instant fade.
- Sunlight: FAB grows to 64×64 + `--cb-felt-deep` fill for max visibility.

---

# § Pass 3b — Open Inferences

| # | Inference | Where | Founder action |
|---|---|---|---|
| 3b-I1 | `members/{id}.recentlyPlayedCourses` field name | § 3b.2.10 | Defer to engineering W1.S4 |
| 3b-I2 | Round amendment / post-finalize edit permission model | § 3b.4.13 | Confirm: admin-only? Founder-only? 24h grace window? |
| 3b-I3 | Founder escalation path when author session dies mid-round | § 3b.3.14 | Confirm scope — W1.S4 follow-up vs. v1 must-have |
| 3b-I4 | Fourth scramble team color (proposed: burgundy oklch tied to brass) | § 3b.5.3 | Confirm or specify |
| 3b-I5 | Party-game dispute resolution mechanism | § 3b.6.6 | Confirm: founder arbitration vs. replay vs. split pot |
| 3b-I6 | Auto-advance default (currently off) | § 3b.3.6 | Confirm default; possible "smart" mode that auto-advances only when all scores in |
| 3b-I7 | Wager/skin display in Sync Round when partial — single-skin carryover vs. full settlement | § 3b.4.7 | Confirm copy spec for partial wager outcomes |

---

# § Pass 3b — Ratification block

You are accepting:

1. **Screen 3b.1** — Play tab as dispatcher with five context-routed states + multi-round picker.
2. **Screen 3b.2** — Start Round with step modules (course / format / players / settings), bottom-anchored CTA, six listed empty/error/permission states.
3. **Screen 3b.3** — Scorecard live as modal-equivalent attention surface with masthead/tab-bar hidden by default, hole-header replacing chrome, player chip score band, large-target stroke entry, GPS layer, spectator-mode variant, handoff flow, single-author invariant.
4. **Screen 3b.4** — Sync Round as deliberate reconciliation step (not auto-finalize), with score summary, multi-player summary, attribution (photo/note/conditions), conditional wager block, finalize commit + downstream triggers.
5. **Screen 3b.5** — Scramble Live with team-based score band, ball-owner attribution, team-stats drill, team-imbalance nudge, single-author invariant applies team-wide.
6. **Screen 3b.6** — Party Games Active as overlay layer via FAB, sheet-based claim flow, distinct multi-writer rule (party game claims are not single-author).
7. All 6 screens cite Part 1 tokens, declare cross-surface consumers, respect reduced-motion + Sunlight mode, list a11y treatment.
8. **7 inferences** require resolution before sub-pass 3c begins.

✏️ **Founder action:** Ratify, red-line, or amend per screen. Once ratified, sub-pass **3c — Feed tab** is next (~4–5 screens: Feed root with sub-segmented Chat/Pulse/DMs, League Chat full, DMs list + thread, Activity detail).

**End of sub-pass 3b.** Standing by.
