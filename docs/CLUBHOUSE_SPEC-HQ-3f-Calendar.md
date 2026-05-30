# CLUBHOUSE_SPEC-HQ — Part 2, View 3f: Calendar

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Tier 1 fill-in-the-gaps deliverable. Awaiting Founder ratification.
> **Canonical mock:** No dedicated HTML mock yet — frame inherits chrome from `Parbaughs HQ Final v2.html`. Month-grid + tee-time list components are net-new.
> **Ship:** W1.S8 — Calendar / events / trips.
> **Scope:** One view, two presentation modes (month grid + list), all states.

---

## 0 — View scope

Calendar is the league's scheduling surface: tee times, multi-day trips, annual events, and spontaneous tournaments. RSVPs have **no Parcoin economic stakes** (per locked Vision) — they are commitments, not bets. Composer integration: tee-time creation lives in this surface (not in a separate composer view).

States covered:
- **3f.1** — Default month-grid (signed-in member, ≥1 event in current month)
- **3f.2** — List view (toggle from grid; reverse-chrono of upcoming events)
- **3f.3** — Empty month (no events scheduled — common in off-season)
- **3f.4** — Tee-time create modal (overlay)
- **3f.5** — Trip detail (multi-day event drill-in)

---

# § 3f.1 — Default month-grid state

## 3f.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per HQ Part 1 § 4 |
| Tab switcher | `--tabs-h` | "Calendar" tab active |
| Masthead | ~160px | Smaller editorial — see 3f.1.3 |
| Scope rail | `--scope-h` | Month nav + view toggle + create CTA |
| Single column body | flex | Month grid full-width with agate sidebar inline |
| Footer | per Part 1 § 14 |

## 3f.1.2 Banner

If viewer has an upcoming tee time within 24h: banner per Part 1 § 11.1 — `LIVE` eyebrow swaps to `UPCOMING` (mono 11px brass), text `<b>{TimeToday}</b> at {Course} · {N} confirmed · {N} pending`. CTA: `View →`.

## 3f.1.3 Masthead

- **Eyebrow:** `{LeagueName} · {SeasonName}` — e.g. `The Parbaughs · Spring '26`
- **H1:** `{MonthName} {Year}.` (Fraunces 64px italic — e.g. `April 2026.`)
- **Sub-deck:** `{N} events scheduled · {N} confirmed Parbaughs`
- **Date line:** Omit.

## 3f.1.4 Scope rail

Three controls inline:

| Control | Spec |
|---|---|
| Month nav | `← {PrevMonth}` brass link, `Today` mono pill in center (highlights current month), `{NextMonth} →` brass link |
| View toggle | Two-button segmented: `Grid` (default) · `List`. Mono 11px. Active = brass underline 2px. |
| Create CTA | Right-aligned: `+ New tee time` pill, brass background, ink text. Click → 3f.4 modal. |

Meta string right-aligned (below controls): `{N} this month · {N} next 7 days · {N} upcoming`.

## 3f.1.5 Main column — month grid

Standard 7-column × 5–6-row grid (depending on month). No agate rail in grid view — the grid wants full width.

### Grid header

| Column | Content |
|---|---|
| Day labels | Mon · Tue · Wed · Thu · Fri · Sat · Sun (mono 10.5px 1.5px tracking `--cb-mute`) |

Week starts on Sunday by default (US-centric to match founding 20 location baseline). Member preference toggle in Settings → Display → Week start (Sunday / Monday) persists across cold launch via `--cb-prefs` member-scoped preference. Grid renders week-start choice without code change at viewer level.

### Cell spec

| Element | Token | Notes |
|---|---|---|
| Cell frame | `min-height: 120px`, 1px `--cb-line` borders all sides | Cells share borders (collapse) |
| Background — current month | `--cb-chalk` | |
| Background — prev/next month overflow | `--cb-chalk-deep` | Date number `--cb-mute-faint` |
| Background — today | `--cb-chalk-deep` + 2px `--cb-brass` top border | Mono "TODAY" eyebrow in top-right |
| Date number | Fraunces 600 22px `--cb-ink` top-left, padding 8px | Tabular nums |
| Event chips | Stacked below date, max 3 visible | Each chip 100% width |
| Overflow | "+N more →" mono link bottom of cell if >3 events | |

### Event chip spec

```
[● BRASS] 8:30am · Honey Run · 4/4
```

| Element | Token | Notes |
|---|---|---|
| Container | `padding: 4px 8px`, `--cb-chalk-deep` background, 2px `--cb-brass` left border | |
| Leading dot | 6px `--cb-brass` circle | Hides for past events (no dot) |
| Time | Fraunces 600 12px `--cb-ink` tabular-nums | e.g. `8:30am` |
| Course | Mono 10.5px `--cb-mute-soft` | Truncates with ellipsis if needed |
| RSVP count | Mono 10.5px `--cb-mute-soft` right-aligned | `4/4` confirmed/capacity. Brass when at capacity. |

**Trip chip variant:** spans multiple cells horizontally — `[●● 3 days · Smoky Mountain Open]` — brass left border continues across cells, body label only in start cell.

Click on chip → tee-time detail modal (for single-day) or trip detail view (3f.5).

## 3f.1.6 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `events/{leagueId}/*` filtered by month | `events/{leagueId}/{eventId}` on create (via 3f.4 modal) |
| `events/{eventId}/rsvps[]` for RSVP counts | `events/{eventId}/rsvps/{memberId}` on RSVP |
| `members/{viewerId}.events-confirmed[]` for personal status | |
| `trips/{leagueId}/*` for multi-day events | |

---

# § 3f.2 — List view

Toggle from 3f.1 grid. Same frame; main column changes to a chronological list.

## 3f.2.1 List layout

Reverse-chrono of upcoming events; past events available via "← Past events" pagination at top.

```
[Eyebrow] APR 13 · MONDAY
[Card] 8:30 AM at Honey Run · 4/4 confirmed · Hosted by Zach
       Brian, Kayvan, Nick, Kiyan confirmed. Tee-off in 2 days.
[Eyebrow] APR 16 · THURSDAY
[Card] Smoky Mountain Open · 3 days · 8/12 confirmed
       ...
```

| Element | Token | Notes |
|---|---|---|
| Day eyebrow | Mono 11px 1.5px tracking `--cb-mute` `MMM DD · DAY` | Sticky on scroll |
| Event card | Same `.card` token as Home feed cards (HQ Part 1 § 9.3) | |
| Card eyebrow | Mono 10.5px brass | `TEE TIME` / `TRIP` / `TOURNAMENT` |
| Time + course | Fraunces italic 20px `--cb-ink` | `8:30 AM at Honey Run` |
| RSVP summary | Mono 11px `--cb-mute-soft` | `4/4 confirmed · Hosted by Zach` |
| Body | Fraunces 15.5px | Member list + context note |
| Action row | Right of body | Per viewer state: `RSVP →`, `Confirmed ✓`, `Decline →` |

Cards group by day; one day-eyebrow per day with ≥1 event.

---

# § 3f.3 — Empty month

When current month has 0 events:

- Grid still renders (all cells empty).
- Below the grid, centered editorial block:
  - Eyebrow: `NO EVENTS THIS MONTH`
  - H2 (Fraunces 30px): `The course is quiet.`
  - Body (Fraunces 15.5px mute): `Schedule a tee time and the league will see it on the day.`
  - CTA: `+ New tee time` (brass link)

If next month has events but current doesn't, append: `Next month: {N} events scheduled. {NextMonth} →`

---

# § 3f.4 — Tee-time create modal

Overlay per Part 1 § 11 modal pattern. Triggered from scope-rail `+ New tee time` CTA or from cell-empty `+` quick-add on hover.

## 3f.4.1 Frame

Bottom-anchored modal at `--cb-chalk` background, max-width 560px, 4px `--cb-brass` top border. Modal scrim is `--cb-felt` at 40% opacity.

## 3f.4.2 Fields

| Field | Type | Required | Default |
|---|---|---|---|
| Course | Autocomplete dropdown (sources `courses/*`) | Y | Empty |
| Date | Date picker | Y | Today |
| Time | Time picker, 15-min increments | Y | Empty |
| Tee box | Select from course's available tees | N | Course default |
| Players limit | Number 2–8 | Y | 4 |
| Note | Textarea, 280 char | N | Empty |
| Visibility | Radio: `League only` / `Friends + league` | Y | `League only` |
| Pre-invite | Multi-select member chips (sources `members/*`) | N | None |

`Public` tee-time visibility deferred to Launch Phase B per Founder ratification 2026-05-12. W1.S8 supports `League only` and `Friends + league` scopes; cross-league/public visibility introduces league-of-leagues federation complexity that defers to a Launch Phase B feature. Visibility radio remains a 2-option choice for Wave 1.

## 3f.4.3 Footer

| Element | Spec |
|---|---|
| Cancel | Text link `--cb-mute-soft` left |
| Save | Pill button brass background, ink text, right. Disabled until required fields valid. |

On save: writes `events/{leagueId}/{eventId}`, RSVPs the creator automatically, and sends invitations per `Pre-invite` selection. Modal closes; grid re-renders with new chip.

---

# § 3f.5 — Trip detail view

Multi-day events open a dedicated detail view (not a modal — too much content). Frame inherits the standard chrome.

## 3f.5.1 Layout

- **Masthead:** trip name as H1, dates as sub-deck, event type as eyebrow.
- **Hero card:** large card with date range, location, host, total RSVPs.
- **Day-by-day breakdown:** vertical list, one card per day with that day's tee times and confirmed members.
- **Members confirmed:** grid of avatars + names, sorted by confirmation date.
- **Discussion thread:** comment surface (uses W1.S11 League Chat infrastructure — see CLUBHOUSE_SPEC-3c-Feed.md for component reuse).

---

# § 3f.6 — Accessibility

- Grid: `<table role="grid">` with `<th scope="col">` for day labels and `<td role="gridcell">` for cells.
- Event chips: `<button>` inside cells, with `aria-label` synthesizing `Tee time at Honey Run, 8:30 AM, 4 of 4 confirmed`.
- Keyboard nav: arrow keys move between grid cells; Enter opens chip detail.
- Month nav: `aria-label` `Previous month, March 2026` / `Next month, May 2026`.
- Modal: focus trap, ESC to close, `aria-modal="true"`.
- List view "Skip to today" link lands focus on today's first event.

---

# § 3f.7 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (modal scrim)
- Text: `--cb-ink`, `--cb-ink-soft`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Lines: `--cb-line`
- Type: `--type-mast-hq` (scaled to 64px), `--type-sec-hq`, `--type-display-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3f.8 — Ratification block

Accepted:
- Calendar surface owns tee times + trips + events; no economic stakes on RSVP.
- Two presentation modes: grid (default) + list (toggle).
- Trip chips span multiple cells in grid; trip detail opens dedicated view.
- Tee-time create modal lives in this surface (not separate composer).
- Visibility radio defaults to `League only`; `Public` field exists pending Founder ratification.

All 3 gaps resolved by Founder ratification 2026-05-12:
1. Week start: Sunday default + Settings preference (3f.1.5).
2. Public visibility: deferred to Launch Phase B (3f.4.2).
3. Cross-league trip visibility: league-scoped only in W1.S8; defer cross-league trips to Launch Phase B.
