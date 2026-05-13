# CLUBHOUSE_SPEC-HQ — Part 2, View 3a: HQ Home

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Awaiting Founder ratification.
> **Canonical mock:** `Parbaughs HQ Final v2.html` — `#v-home` section.
> **Scope:** One view, all states.

---

## 0 — View scope

The HQ Home view is the daily landing surface for any signed-in member on desktop. It opens with a masthead, surfaces any live rounds via a banner, shows league stats for the week, and lists recent activity — agate rail carries the live-now ticker, weather, season standings, tee sheet, and a pull quote.

States covered here:
- **3a.1** — Default (≥1 live round, populated feed, ≥1 round this week)
- **3a.2** — Quiet (no live rounds, no rounds this week — early-season or off-season)
- **3a.3** — First-time / empty-league (league created, no rounds posted yet)
- **3a.4** — Crisis banner override (admin-pushed urgent message)

---

# § 3a.1 — Default state

## 3a.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` (~70px) | See HQ Part 1 § 4 |
| Sticky tab switcher | `--tabs-h` (~42px) | See HQ Part 1 § 5 |
| Banner (conditional) | ~52px when active, 0 when inactive | LIVE banner per HQ Part 1 § 11.1 |
| Masthead | ~180px | HQ Part 1 § 6 |
| Scope rail | ~58px | HQ Part 1 § 7 |
| Two-column body | flex | Main + agate |
| Footer | ~84px | HQ Part 1 § 14 |

## 3a.1.2 Banner

**Condition:** Banner renders if any league member has a `RoundDoc.status === 'in_progress'`.

| Element | Content |
|---|---|
| Eyebrow | `LIVE` |
| Text | `<b>{Member name}</b> is on hole {N} at {Course} · {±N} thru {N}` |
| CTA | `Watch →` — links to that member's Spectator HUD (`/hq/hud/{roundId}`) |

If multiple rounds live: banner shows the most-recently-updated round. Agate Live Now module lists all live rounds (3a.1.6).

## 3a.1.3 Masthead

Per HQ Part 1 § 6.

- **Eyebrow:** `{LeagueName} · {LocationCity, State} · {SeasonName}` — e.g. `The Parbaughs · York, PA · Spring '26`
- **H1:** Editorial Founder-approved copy. Default Saturday afternoon: `Saturday <em>at the course.</em>` Variants exist per day; Founder maintains a copy library or agent generates per day.
- **Sub-deck:** One-sentence summary of the league week. Auto-generated from week-summary aggregator (Wave 4) or Founder-curated (Wave 3).
- **Date line:** `{DayShort} · {MonShort} {Day} · No. {IssueNumber}` — issue number increments by 1 per week of league history.

`[GAP]` Founder confirms: agent-generated masthead copy in Wave 3, or Founder-curated copy library?

## 3a.1.4 Scope rail

Per HQ Part 1 § 7.1. Three tabs: **League · Network · All** (default League).

Meta string: `{N} active · 14 day window` where N = count of distinct members with ≥1 round in the last 14 days.

## 3a.1.5 Main column

The main column has **three stacked sections**, in this order:

### Section A — On the course (live round card)

**Condition:** Renders only when the viewing member has their own live round.

```
[Card eyebrow with pulse: "● LIVE · YOUR ROUND"]
[Avatar 64×64] [Member name (italic Fraunces)]  [Score numeral 54px −3thru11]
              [Course · hole · elapsed · pace]
─────────────────────────────────────
[Spectator count + last update]   [Open round on phone →]
```

| Element | Token | Notes |
|---|---|---|
| Card frame | `.card.live` | `border-left: 3px solid var(--cb-brass)` |
| Eyebrow | Mono 700 10.5px brass + pulse dot | Animated per HQ Part 1 § 12 |
| Avatar | 64×64 circle | `--cb-felt` bg, 1px `--cb-brass` ring, Fraunces italic 26px `--cb-chalk` initial |
| Name | Fraunces italic 500 20px `--cb-ink` | Full display name |
| Context line | Mono 11px 1.5px tracking `--cb-mute-soft` | `{Course} · Hole {N} · {H}h {M}m elapsed · {pace}` |
| Score numeral | Fraunces 600 54px `--cb-ink` | Tabular nums; `<sup>` "thru N" mono 16px mute |
| Footer | Top: 1px line | "{N} Parbaughs watching · last hole {time} ago" + "Open round on phone →" CTA |

The CTA links to the mobile Spectator HUD via a deep-link / QR / device handoff (Wave 4). In Wave 3 it links to the desktop HUD view (`/hq/hud/{roundId}`).

If no own live round: this section omits entirely (no placeholder).

### Section B — The league this week (stat strip)

Always present. Title row + 4-column stat strip.

| Stat | Source | Format |
|---|---|---|
| Rounds | Count of posted rounds, last 7 days | `{N}` + delta vs prior 7d (`↑ {N} vs last week`) |
| Avg Score | Mean of posted round totals, last 7 days | `{NN.N}` + delta (`↓ N.N stronger` or `↑ N.N off`) |
| Low Round | Min of posted round totals, last 7 days | `{N}` + member + course (`{Member} · {CourseShort}`) |
| Coins Earned | Sum of parcoin grants, last 7 days | `{N,NNN}` + "across the room" |

Section header: `The league this week` (H2 Fraunces 30px), meta right-aligned: `{StartDate} — {EndDate}` (mono 10.5px mute).

### Section C — Activity (feed)

Reverse-chron feed of league-scoped round posts + reactions. Default shows the 3 most recent. "Load more" extends.

Feed card per HQ Part 1 § 9.3.

Sort: most recent first, except live rounds always pin to top.

Per-card content:
- **Live card:** member name + `<span class="live-dot">` + `<span class="chip live">Live</span>`. Body = `RoundDoc.status_note` (e.g. "On the back nine and still −2..."). Meta = `{N} watching · last hole · {time} ago`.
- **Posted round card:** member name. When = `{DayLabel} · {Time} · {Course}`. Body = `RoundDoc.recap` (member-authored prose). Meta = `{N} likes · {N} comments · round #{N}`.

The body text is **Fraunces 15.5px**, line-height 1.55. Engineering hard-rule: do not switch this to Inter "for readability". The Fraunces body is the editorial voice. If a post exceeds 4 lines, truncate with `...` and add "Read more →" — do NOT expand inline.

`[GAP]` Founder confirms: comment thread surfaces on click-through to round detail, or inline expansion?

## 3a.1.6 Agate rail (right column)

Modules in order, top → bottom:

| # | Module | Content rule | Hides when |
|---|---|---|---|
| 1 | **Live Now · {N}** | List of all live rounds with name + score | No live rounds → entire module hides |
| 2 | **Weather · {City, State}** | Current temp + conditions + tomorrow preview | Weather API down → module shows skeleton, no error |
| 3 | **Standings · {SeasonName}** | Top 5 of season leaderboard with rank, name, total | Season has no completed rounds → module hides |
| 4 | **Tee Sheet · This Week** | Upcoming tee times this week with day, time, course, fill (`2/4`, `4/4`, etc.) | No upcoming tees → module hides |
| 5 | **Pull Quote** | Editorial pull from member content + attribution | No pull-quote-worthy content → module hides |

### Module 1 — Live Now

```
LIVE NOW · {N}
─────────────
● {Member}        {±N} thru {N}
● {Member}        {±N} thru {N}
```

- Pulse dot before each name.
- Right-side numeral is mono 11px tabular tracking 0.8px uppercase mute-soft.
- Tapping a row navigates to that member's HUD.

### Module 2 — Weather

```
WEATHER · YORK, PA
──────────────────
74°
WSW 8 · partly cloudy
Tomorrow 71° · scattered showers PM
```

- Temp: Fraunces 600 32px `--cb-ink`, `opsz` 72.
- Conditions: mono 11.5px `--cb-ink-faint` uppercase.
- Tomorrow line: mono 11px `--cb-mute-soft`.

`[INFERENCE]` Weather source = OpenWeatherMap or equivalent. League location (city/state) is on `LeagueDoc.location`. If member has overridden home location, use that.

### Module 3 — Standings

Top 5 of current-season standings. Format: `{rank} · {Member}` left, `{±NN}` right.

Score color rule: `--cb-ink` for the left, `--cb-mute-soft` for the right (HQ Part 1 § 9.6 — over/under coloring is reserved for the full leaderboard view, not the agate condensed list).

Tap row → opens Leaderboard view.

### Module 4 — Tee Sheet

```
TEE SHEET · THIS WEEK
─────────────────────
Sat · 7:42 AM    Honors · 2/4
Sun · 8:00 AM    Heritage · 4/4
Wed · 5:30 PM    Ocean · 1/4
```

- Left: day + time, Fraunces 500 13px `--cb-ink`.
- Right: course + fill, mono 11px `--cb-mute-soft` tabular.
- "4/4" = full; "1/4" = open. Color the fill `--cb-brass-deep` when full, mute otherwise.
- Tap row → opens Calendar view with that slot focused.

### Module 5 — Pull Quote

Smaller pull than the in-section `.pull` block:

```
PULL QUOTE
──────────
"The 12th finally gave me a par."
— Drew, Apr 25
```

- Body: Fraunces 13.5px, no curly quote rule (just plain straight quotes), `--cb-ink-soft`.
- Attribution: `<em>` mono 11px mute uppercase 1px tracking.
- Source: pulled from a recent feed-body sentence or comment. Wave 3: Founder-curated. Wave 4: editorial-aggregator picks most-quoted sentence of the week.

## 3a.1.7 Cross-surface dependencies

| Element | Reads | Writes |
|---|---|---|
| Live banner | `RoundDoc` status, `MemberDoc` display name | — |
| Live card | `RoundDoc` current score, hole, pace; viewing member's session | — |
| Stat strip | Aggregator: `RoundDoc[]` last 7d | — |
| Feed cards | `FeedItemDoc` (which wraps `RoundDoc` and `ReactionDoc`) | Reaction (like) on click → writes `ReactionDoc` |
| Agate Live Now | Same as live banner | — |
| Agate Weather | Weather API (OpenWeatherMap, cached 30min) | — |
| Agate Standings | Aggregator: season standings | — |
| Agate Tee Sheet | `TeeTimeDoc[]` next 7d | — |
| Agate Pull Quote | Curated `FeaturedQuoteDoc` (Wave 3) | — |

## 3a.1.8 Ratification block — § 3a.1

Accepted:
- Default state composition: nav → tabs → banner → masthead → scope → main (live card + stats + feed) + agate (live now + weather + standings + tee sheet + pull) → footer.
- Live card omits entirely (not placeholders) when no own live round.
- Feed shows 3 cards default + load more; no inline expansion of post bodies.
- Agate modules hide cleanly when their data source is empty.

---

# § 3a.2 — Quiet state

**When:** No live rounds, no rounds this week, no upcoming tee times this week.

**What changes:**

- Banner: hides.
- Section A (live card): hides.
- Section B (stat strip): renders with zeros. Stats show `—` instead of `0` for low-round and coins-earned (italic mute em-dash, not a hard zero).
- Section C (feed): shows last 3 rounds regardless of how far back. Meta on each card shows the date prominently.
- Masthead H1 shifts to a quiet variant. Examples Founder may stock: `Quiet <em>at the course.</em>` / `A slow week, <em>still scored.</em>` / `Between rounds.`
- Agate modules:
  - Live Now: hidden
  - Weather: shown
  - Standings: shown if any season activity exists
  - Tee Sheet: shown with "No tee times posted" placeholder if zero (`--cb-mute-soft` italic Fraunces 13px)
  - Pull Quote: shown if a curated quote exists

## 3a.2.1 Ratification block — § 3a.2

Accepted: quiet state collapses live elements, shifts copy to acknowledge the quiet, but does NOT degrade visually — same density, same agate.

---

# § 3a.3 — First-time / empty-league state

**When:** League was created in the last 7 days AND has zero posted rounds.

**What changes:**

- Banner: hides.
- Section A: hides.
- Section B: replaced with an **empty-state block** — Fraunces italic 22px `--cb-ink-faint` centered: `No rounds yet. The first one starts the paper.` + CTA below in `--cta-fill` styled button: `Post a round →`.
- Section C: replaced with an **invite-cluster** — Fraunces 18px headline `Bring the league in.` + 3 short copy lines on what posting a round produces (a feed item, an agate entry, a comment thread) + secondary CTA `Invite members →`.
- Masthead H1: `Day <em>one.</em>`
- Agate:
  - Live Now: hidden
  - Weather: shown
  - Standings: hidden (no data)
  - Tee Sheet: shows with placeholder
  - Pull Quote: replaced with a single brass-rule editorial block: `The Parbaughs is what you make of it. Post the first round.`

## 3a.3.1 Ratification block — § 3a.3

Accepted: first-time state is its own designed layout, not a stripped default. Engineering renders it as a distinct composition.

---

# § 3a.4 — Crisis banner override

**When:** A league admin or platform admin has pushed a `CrisisMessageDoc` with `severity === 'critical'`.

**What changes:**

- An additional banner renders **above** the LIVE banner (or in its place if no live rounds).
- Visual: same shape as the LIVE banner, but with `border-left: 3px solid var(--cb-alert)` and eyebrow `CRISIS` in `--cb-alert` color.
- Text: `CrisisMessageDoc.body` (Fraunces italic 15px).
- CTA: `Read →` linking to the full crisis message.
- Auto-dismissible: no. Stays until admin clears or its `expiresAt` passes.
- Stacks: only ONE crisis banner shown at a time (most recent). Other crisis messages queued in Notifications.

## 3a.4.1 Ratification block — § 3a.4

Accepted: crisis banner is a structural addition, not a swap. Always visually distinct from LIVE via alert color. Never dismissible by member.

---

# § 3a.5 — Token consumption summary

Every token used in HQ Home, declared up front so engineering can grep the spec:

```
--cb-felt, --cb-felt-deep
--cb-chalk, --cb-chalk-deep, --cb-line
--cb-ink, --cb-ink-soft, --cb-ink-faint
--cb-mute, --cb-mute-soft, --cb-mute-faint
--cb-brass, --cb-brass-deep, --cb-brass-soft, --cb-brass-faint
--cb-claret (over-par individual hole only — NOT used on Home)
--cb-moss (under-par totals in stat-delta)
--cb-alert (crisis banner only)

--type-mast-hq (masthead H1)
--type-sec-hq (section H2)
--type-display-hq (live card name, agate quotes)
--type-stat (stat numerals)
--type-stat-large (live card score)
--type-body-hq (feed body)
--type-agate (agate body)
--type-eyebrow-hq (all eyebrows)
--type-label-hq (stat labels, agate labels)
--type-num-hq (agate right numerals)
--type-ui-hq (feed meta)
```

No tokens outside this list may be used on the HQ Home view without amendment to this spec.

---

**End of Part 2 · View 3a.**
