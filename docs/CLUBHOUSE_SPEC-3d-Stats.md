# CLUBHOUSE_SPEC — Part 2, Sub-pass 3d: Stats Tab

> **Status:** Awaiting Founder ratification. Subordinate to Part 1 (`docs/CLUBHOUSE_SPEC.md`), Sub-passes 3a–3c.
> **Pass:** 3d of 4. Folded into final CLUBHOUSE_SPEC.md at Part 2 § 3d after ratification.
> **Scope:** 5 Stats-tab screens.

---

## 0 — Sub-pass scope

- **3d.1 — Stats home**
- **3d.2 — Round History**
- **3d.3 — Records**
- **3d.4 — Aces + Awards (combined surface)**
- **3d.5 — Trophy Room + Season Recap (combined surface)**

Every screen clears 12 rejection criteria, cites Part 1 tokens, declares cross-surface consumers, references reduced-motion + Sunlight, lists a11y.

---

# Screen 3d.1 — Stats Home

## 3d.1.1 Purpose

Landing screen for the Stats tab. Headline numbers + handicap trend + drill-ins to all sub-surfaces. Daily-glance value per Pass 1 § 5.2 justification.

## 3d.1.2 Frame

Standard masthead + tab bar. Content scrolls. No bottom-anchored CTA.

## 3d.1.3 Page header

| Element | Token | Content |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-mute` | `YOUR PLAY · ALL TIME` |
| Headline | `--type-display`, `--cb-ink` | `The book on Mr Parbaugh.` |

## 3d.1.4 Headline KPI row

Three large stat cards, vertical stack on mobile (full-width each), `--space-3` gap.

| Card | Eyebrow | Value | Sub-line |
|---|---|---|---|
| Handicap | `HANDICAP INDEX` (`--type-label`, `--cb-brass-deep`) | `20.9` `--type-display` 64px serif 700 tabular-nums `--cb-ink` | `Down 0.4 in the last 30 days` (`--type-body-sm`, `--cb-felt-deep` for improvement / `--cb-brass-deep` for worsening) |
| Best | `LOW ROUND` | `88` 64px | `At Ocean Pines on May 3` |
| Rounds | `ROUNDS LOGGED` | `47` 64px | `4 this month · 18 this year` |

Each card:

- `--bg-sunk` fill, `--radius-lg`, `--space-5` padding.
- Tap → drill-in: Handicap card → handicap detail (a focus view within Stats), Best → Round detail in Play (3b round detail), Rounds → Round History (3d.2).
- **Provisional handicap pattern** per Pass 3a § 3a.1.6: `*` after value in `--cb-brass-deep` if <3 rounds; tap card opens explainer bottom sheet.

## 3d.1.5 Handicap trend chart

Below KPI row. Sparkline-style trend chart of handicap over last 12 weeks.

| Element | Token | Notes |
|---|---|---|
| Container | `--space-5` page gutter, `--space-6` below |  |
| Header row | Title `Handicap trend` `--type-h3`, `--cb-ink`; right-side range pills `12W · 6M · 1Y · ALL` `--type-label`, brass-underline active per HQ chart polish pattern from Ship 5+6 |  |
| Chart canvas | 100% × 140px |  |
| Line stroke | 1.5px `--cb-ink` |  |
| Area fill | `--cb-brass` at 12% opacity (per Ship 5+6 polish lock) |  |
| Last-point dot | 6×6, `--cb-ink` fill, `--cb-chalk` halo 2px |  |
| Y-axis labels | `--type-label` tabular-nums `--cb-mute`, mono | 3 ticks max |
| X-axis labels | `--type-label` `--cb-mute` | First/last/today |
| Delta sub-stat | Header line right of title: `↘ −0.4 vs. last month` `--type-label`, `--cb-felt-deep` for down (improving) / `--cb-brass-deep` for up | Per Ship 5+6 polish lock |

Empty state (fewer than 3 rounds): dashed line in same chrome with `N OF 3 ROUNDS LOGGED` progress copy. No layout shift when data arrives.

## 3d.1.6 Drill-in section list

Below trend chart. Vertical list of drill-ins:

| Row | Headline | Sub-line | Target |
|---|---|---|---|
| Round History | `--type-body-lg` `--cb-ink` | `47 rounds · last played Tuesday` | 3d.2 |
| Records | | `Best scores at courses you play` | 3d.3 |
| Aces & Awards | | `1 ace · 4 awards earned` | 3d.4 |
| Trophy Room | | `2 trophies · Last season's recap available` | 3d.5 |

Each row: 56px height, `--space-5` page gutter, chevron right `--cb-mute`, divider 1px `--cb-line` between rows.

## 3d.1.7 States

| State | Behavior |
|---|---|
| **Loading** | KPI cards skeleton + trend chart skeleton (dashed-line variant) + drill-in skeleton rows |
| **First-time member (0 rounds)** | KPI cards all `—` em-dash; trend chart empty-state copy; drill-in rows show counts `0`; nudge banner top: `Log your first round to wake your stats up.` → Start Round (3b.2) |
| **Spectator tier** | All-personal cards replaced by single full-width card: `LEAGUE STATS` summarizing league aggregates; drill-ins link to league-scoped versions |
| **Error / network** | Cached values + retry banner |

## 3d.1.8 Reduced motion + Sunlight

- Trend chart: no animated line-draw on load; renders static.
- Sunlight: KPI card fills become outlined (1px `--cb-line` border, transparent bg); chart line thickens to 2px; area fill removed.

## 3d.1.9 A11y

- KPI cards: `role="link"`, `aria-label` includes value + sub-line + drill-in target.
- Trend chart: `role="img"`, `aria-label="Handicap trend, currently 20.9, down 0.4 from 30 days ago"`; data table fallback on long-press.
- Range pills: `role="tablist"`; each pill `role="tab"`.
- Drill-in rows: `role="link"`, chevron decorative.

## 3d.1.10 Cross-surface consumers

| Surface | Operation |
|---|---|
| `members/{id}.handicapIndex` + history | Read |
| `members/{id}.bestScore` | Read |
| `rounds` collection (member-scoped) | Read (count + last-played) |
| `awards/{id}` (member-scoped count) | Read |
| `aces/{id}` (member-scoped count) | Read |
| `trophies/{id}` (member-scoped count) | Read |
| Navigates to **3d.2 / 3d.3 / 3d.4 / 3d.5** plus **Round detail (3b)** + **Start Round (3b.2)** for first-time |

---

# Screen 3d.2 — Round History

## 3d.2.1 Purpose

Reverse-chronological list of every finalized round, with filter + drill-in to round detail.

## 3d.2.2 Frame

Standard chrome. Adds:

| Slot | Spec |
|---|---|
| Filter bar | Below masthead, 48px, horizontal-scroll chip row |
| Round list | Vertical scroll |

## 3d.2.3 Filter bar

| Element | Token | Notes |
|---|---|---|
| Container | `--space-5` x-pad, `--space-2` y-pad, no border |  |
| Chip (each) | `--type-label`, `--bg-sunk` fill / `--cb-mute` text inactive; `--cb-brass` fill / `--cb-felt-deep` text active; `--radius-pill`; `--space-2` y-pad, `--space-3` x-pad | `ALL · 18 HOLES · 9 FRONT · 9 BACK · BY COURSE · BY FORMAT` |

`BY COURSE` and `BY FORMAT` are dropdowns — tap opens bottom sheet of options. Other chips toggle.

## 3d.2.4 Round row

| Element | Token | Notes |
|---|---|---|
| Container | `--space-4` y-pad, `--space-5` x-gutter; divider 1px `--cb-line` between |  |
| Score numeral | `--type-stat-md` (24px serif 600 tabular-nums) `--cb-ink`, left | `98` |
| Plus-minus pip | `--type-body-sm` `--cb-brass-deep` (over) / `--cb-felt-deep` (under) / `--cb-mute` (par), below or beside numeral | `+26` |
| Course name | `--type-body` 15px sans `--cb-ink` 600 | `Ocean Pines G&CC` |
| Date + format sub | `--type-body-sm` `--cb-mute` | `May 6 · Stroke · 18 holes` |
| Format chip | Small chip, `--type-label`, brass-faint bg | `STROKE` |
| Chevron | Right, `--cb-mute` | Tap → Round detail (3b) |

Long-press on a row → action sheet: `View details` / `Request edit` (author-only, opens edit flow per ratified P3b-I2) / `Share to chat` (round-share flow).

## 3d.2.5 Pagination

- Initial load: last 30 rounds.
- Scroll to bottom → loads previous 30.
- Date separators every 30 days for context.

## 3d.2.6 States

| State | Behavior |
|---|---|
| **Empty (0 rounds)** | Centered: `No rounds yet.` `--type-h3` `--cb-mute` + CTA `Start a round →` to 3b.2 |
| **No matches with filter** | `No rounds match your filter.` + `Clear filters` brass link |
| **Loading** | Skeleton rows × 8 |
| **Network error** | Cached list + retry banner |
| **Spectator tier** | History scoped to league members; spectator can browse any member's history via name picker chip in filter bar |

## 3d.2.7 Reduced motion + Sunlight

- Filter chip toggle: instant color swap, no fade.
- Sunlight: chips' active state shifts brass → felt fill; numerals shift to pure black.

## 3d.2.8 A11y

- Filter chips: `role="tablist"` for toggles, `role="button"` `aria-haspopup="dialog"` for dropdowns.
- Round rows: `role="link"`, `aria-label="98 at Ocean Pines, May 6, Stroke 18 holes"`.
- Pagination: announces loaded count via `aria-live="polite"`.

## 3d.2.9 Cross-surface consumers

| Surface | Operation |
|---|---|
| `rounds` (member-scoped) | Read, filtered |
| `courses/{id}` | Read (names) |
| Navigates to **Round detail (3b)** |

---

# Screen 3d.3 — Records

## 3d.3.1 Purpose

Best-of-X aggregations. Personal records member has set or could set.

## 3d.3.2 Frame

Standard chrome. Sections stack vertically.

## 3d.3.3 Page header

| Eyebrow | `RECORDS · YOUR BESTS` |
| Headline | `Your high-water marks.` |

## 3d.3.4 Record card sections

Each section is a card grouping related records.

### Section A — Scoring

| Record | Value | Context |
|---|---|---|
| Low 18 | `88` | Ocean Pines · May 3 |
| Low 9 (front) | `41` | Honey Run · April 18 |
| Low 9 (back) | `43` | Ocean Pines · May 3 |
| Most birdies in a round | `5` | Honey Run · April 18 |
| Most pars in a round | `9` | Ocean Pines · May 3 |
| Longest streak under 100 | `4 rounds` | April 25 – May 6 |

### Section B — Course-specific

For each course the member has played 3+ times:

| Element | Notes |
|---|---|
| Course name header | `--type-h3` `--cb-ink` |
| Best score | `--type-stat-md`, with tap → that Round detail |
| Average score | `--type-body-sm` `--cb-mute` |
| Times played | `--type-body-sm` `--cb-mute` |

### Section C — Format-specific

For each format member has played:

| Element | Notes |
|---|---|
| Format name | `--type-h3` |
| Best result | Stroke: low score · Scramble: low team score · Match play: most holes won · etc. |
| Rounds in this format | Sub-line |

### Section D — Streaks

| Streak | Value |
|---|---|
| Current sub-100 streak | `2 rounds` |
| Current under-handicap streak | `1 round` |
| Longest sub-100 streak | `4 rounds` |

## 3d.3.5 Card layout

Each section is `--bg-sunk` card, `--radius-lg`, `--space-5` padding, `--space-5` gap between cards. Records within a section are a 2-column grid (1-col on narrow viewports).

| Record cell | Spec |
|---|---|
| Label | `--type-label` `--cb-mute` |
| Value | `--type-stat-md` `--cb-ink` tabular-nums |
| Context | `--type-body-sm` `--cb-mute` |

## 3d.3.6 States

| State | Behavior |
|---|---|
| **Empty section** | Section hides entirely if no qualifying data (e.g., no streaks established yet) |
| **First-time member** | Page shows centered nudge: `Log 3 rounds to see your records.` |
| **Spectator** | Read-only; can scope by member via picker at top |
| **Loading** | Skeleton sections × 3 |

## 3d.3.7 Reduced motion + Sunlight

- No motion on this screen by default beyond skeleton shimmer.
- Sunlight: card fills outlined; numerals shift to pure black.

## 3d.3.8 A11y

- Each record cell: `role="group"`, `aria-label="Low 18, 88, at Ocean Pines on May 3"`.
- Cells linking to rounds: `role="link"`.
- Sections: `role="region"`, `aria-labelledby="…"`.

## 3d.3.9 Cross-surface consumers

| Surface | Operation |
|---|---|
| `members/{id}.records` (derived, server-computed) | Read |
| `rounds/{id}` | Read (drill-in to round detail) |
| `courses/{id}` | Read (course-specific section) |

`[INFERENCE]` Records aggregate computed via Cloud Function on round finalize; cached on member doc. Confirm aggregation strategy during W1.S9 implementation.

---

# Screen 3d.4 — Aces + Awards (Combined Surface)

## 3d.4.1 Purpose

Two related collections rendered as a single screen with internal tabs. Aces are rare-event log; Awards are achievement system. Combined because both are "recognition surfaces" sharing card vocabulary.

## 3d.4.2 Frame

Standard chrome. Sub-segment header (matches Feed root pattern from 3c.1) with two tabs: `ACES` · `AWARDS`. Default lands on the tab with the most-recent earned item (Award if recent, else Ace, else Awards).

## 3d.4.3 Aces sub-view

### Header

| Eyebrow | `ACES · YOUR ONE-SHOTS` |
| Headline | `1 ace.` (or `No aces yet.`) |

### Ace card (each, reverse chrono)

| Element | Token | Notes |
|---|---|---|
| Container | `--cb-felt` fill (celebration), `--radius-lg`, `--space-5` padding | High-emphasis treatment |
| Big number | `1` centered, `--type-display` 96px serif 700 `--cb-brass` | The defining numeral |
| Eyebrow | `--type-label` `--cb-chalk` at 0.7 | `MAY 12 · OCEAN PINES` |
| Details row | `--type-body-lg` `--cb-chalk` | `Hole 7 · Par 3 · 165 yards` |
| Witness chips | `--type-label` chips inline, `--cb-brass-soft` fill `--cb-felt-deep` text | `WITNESSED · Nick · Kayvan` |
| Drill | `View round →`, `--cb-brass-soft` link | Tap → Round detail (3b) |

### Empty state

Centered card with dashed border: `No aces yet.` (`--type-h3` `--cb-mute`) + sub `Make one and we'll know.`

## 3d.4.4 Awards sub-view

### Header

| Eyebrow | `AWARDS · WHAT YOU'VE EARNED` |
| Headline | `4 awards.` |

### Award card (each, reverse chrono earned)

| Element | Token | Notes |
|---|---|---|
| Container | `--bg-sunk` fill, `--radius-lg`, `--space-5` padding |  |
| Award glyph | 56×56, `--cb-brass-soft` background, `--cb-brass-deep` glyph centered, `--radius-md` |  |
| Title | `--type-body-lg` `--cb-ink` 600 | `Hot Hand` |
| Description | `--type-body-sm` `--cb-mute` | `3 sub-90 rounds in 30 days.` |
| Earned-at sub | `--type-label` `--cb-brass-deep` | `EARNED MAY 6 · 88 AT HONEY RUN` |
| Drill | Chevron right | Tap → Activity detail Variant B (3c.4) |

### Locked-award visibility

`[INFERENCE]` — confirm during W1.S9: do we show unearned awards as locked silhouettes for goal-setting? Two options:

- **A:** show all awards (earned + locked); locked appear greyscale with `LOCKED` chip.
- **B:** show earned only; awards are surprises.

Recommendation A for founding crew (motivational); confirm.

### Empty state

Centered: `No awards yet.` + `Keep playing — they'll find you.`

## 3d.4.5 States

| State | Behavior |
|---|---|
| **Tab switch** | Cross-fade `--motion-quick`; sub-segment indicator slides |
| **Loading** | Skeleton cards × 3 per sub-view |
| **Just-earned (within 5 min)** | New card slides in from top with brass-soft glow halo (1200ms) on first view; flag-raise glyph subtle bottom-right |
| **Spectator** | Read access to any league member's aces/awards via picker top of page |

## 3d.4.6 Reduced motion + Sunlight

- Just-earned slide-in + glow: removed; card appears static with subtle `NEW` brass pip top-right instead.
- Sunlight: ace card felt fill increases saturation; award card outlined; brass glyph shifts to felt-deep.

## 3d.4.7 A11y

- Sub-segment: `role="tablist"`, identical pattern to Feed root.
- Ace cards: `role="article"`, `aria-label="Ace on hole 7 at Ocean Pines, May 12, par 3, 165 yards, witnessed by Nick and Kayvan"`.
- Award cards: `role="link"`, `aria-label="Hot Hand award, earned May 6 — 3 sub-90 rounds in 30 days"`.
- Just-earned `NEW` pip: `aria-label="New"`.

## 3d.4.8 Cross-surface consumers

| Surface | Operation |
|---|---|
| `aces` collection (member-scoped) | Read |
| `awards` collection (member-scoped earned + system-defined catalog) | Read |
| `rounds/{id}` | Read (drill-in for ace context) |
| Navigates to **Round detail (3b)**, **Activity detail (3c.4)** |

---

# Screen 3d.5 — Trophy Room + Season Recap (Combined Surface)

## 3d.5.1 Purpose

**Trophy Room:** Persistent display of league-tier accomplishments (season champion, match-play winner, scramble champ, etc.) — rarer than awards.

**Season Recap:** Calendar-edge surface rendering at season transitions; year-end summary of personal + league activity.

Combined because both are "legacy/looking-back" surfaces with shared card vocabulary.

## 3d.5.2 Frame

Sub-segment with two tabs: `TROPHIES` · `SEASON RECAP`. Default lands on Trophies year-round; defaults to Season Recap during the 30-day window after season-end (`[INFERENCE]` — confirm window during W1.S10).

## 3d.5.3 Trophies sub-view

### Header

| Eyebrow | `TROPHY ROOM · YOUR HARDWARE` |
| Headline | `2 trophies.` |

### Trophy card (each)

| Element | Token | Notes |
|---|---|---|
| Container | `--cb-felt-deep` background, `--radius-lg`, `--space-6` padding |  |
| Trophy glyph | 88×88, `--cb-brass` fill, centered top |  |
| Title | `--type-h2` (22px serif 600) `--cb-chalk`, centered | `2024 Season Champion` |
| Eyebrow | `--type-label` `--cb-brass`, centered | `THE PARBAUGHS · OCT 12, 2024` |
| Stats row | Three small stats inline, `--type-label` labels + `--type-stat-md` values, `--cb-chalk` | `47 ROUNDS · 92.4 AVG · +0.8 HCP IMPROVE` |
| Drill | Centered link `View season →` `--cb-brass-soft` | Opens that season's Recap retrospectively |

Cards stack vertically with `--space-5` between.

### Empty state

Centered with dashed border: `Your trophy case is waiting.` + sub `Win a season, a scramble, or a match.` Sub-link `See current season standings →` → Leagues surface.

## 3d.5.4 Season Recap sub-view

The retrospective. Rendered as a vertical narrative of stat blocks.

### Header

| Eyebrow | `2024 SEASON · 47 ROUNDS` |
| Headline | `Your year.` |
| Sub-line | `Played from Apr 14 to Oct 11. Here's the book.` |

### Stat narrative blocks (vertical stack)

| Block | Content |
|---|---|
| **By the numbers** | 4-col grid: ROUNDS · BEST · AVG · HCP CHANGE — `--type-stat-md` values, tabular-nums |
| **Your trend** | Sparkline-style chart of handicap across the season; same chart vocabulary as 3d.1.5 |
| **Where you played** | Top 3 courses played, with count + best score at each. Inline avatar-style chips with course names. |
| **What you played** | Format breakdown: stroke X% · scramble Y% · etc. Horizontal stacked bar with `--cb-brass`, `--cb-felt`, `--cb-chalk-deep` tints. |
| **Your highs** | 3 best moments: lowest round, ace (if any), award earned. Each as a mini-card linking to the source. |
| **Your lows** | 1 honest moment: highest round + course. Optional toggle to hide via Settings. |
| **League standing** | Rank in league + delta from start of season. |

### Share + save

Bottom-anchored two-button row:

| Button | Spec |
|---|---|
| `Save as image` | `--cta-fill` brass, `--type-cta` | Generates a shareable image (Capacitor file-system per Pass 2 § 7) |
| `Share to chat` | `--bg-sunk`, `--type-cta` `--cb-ink` | Opens League Chat composer with recap card prefilled |

### Empty / first-time season

If member has <10 rounds in current season: `Your season recap unlocks at 10 rounds.` with progress bar.

## 3d.5.5 States

| State | Behavior |
|---|---|
| **Loading** | Skeleton stat blocks; chart skeleton dashed |
| **Spectator** | Read-only; member picker top of page |
| **Off-season Trophy Room** | Trophies sub-view default; Season Recap tab shows year-selector header (last 5 seasons) |
| **First-ever season-end** | Celebration variant — slight brass-soft halo on whole recap; flag-raise glyph in header |

## 3d.5.6 Reduced motion + Sunlight

- First-ever season-end halo: removed; replaced with static `FIRST SEASON` brass pip in header.
- Chart: no draw animation.
- Sunlight: trophy card felt-deep background increases saturation; chart line thickens; share image generated with Sunlight-tuned palette (`[INFERENCE]` — confirm).

## 3d.5.7 A11y

- Sub-segment: `role="tablist"`.
- Trophy card: `role="article"`, `aria-label="2024 Season Champion trophy, The Parbaughs, won October 12 2024, 47 rounds, 92.4 average, plus 0.8 handicap improvement"`.
- Season Recap: stat blocks `role="region"`, each labeled.
- `Save as image`: announces "Generating image…" via `aria-live="polite"` during generation.

## 3d.5.8 Cross-surface consumers

| Surface | Operation |
|---|---|
| `trophies` (member-scoped) | Read |
| `seasonRecaps/{memberId}/{seasonId}` | Read |
| `rounds` (season-scoped) | Read (chart + by-the-numbers) |
| `courses` | Read (where-you-played) |
| `awards`, `aces` | Read (highs section) |
| Capacitor file-system + share | Write (image export) |
| Navigates to **League Chat composer (3c.2)** with prefilled card, **Round detail (3b)** for high/low moments, **Award detail (3c.4)** for award high |

---

# § Pass 3d — Open Inferences

| # | Inference | Where | Founder action |
|---|---|---|---|
| 3d-I1 | Records aggregation strategy — Cloud Function on round finalize, cached on member doc | § 3d.3.9 | Confirm strategy or amend |
| 3d-I2 | Locked-award visibility — show all (locked silhouettes) vs. earned-only | § 3d.4.4 | Confirm A or B |
| 3d-I3 | Season Recap default-tab window after season-end (proposed 30 days) | § 3d.5.2 | Confirm window |
| 3d-I4 | "Your lows" block in Season Recap — opt-out via Settings; default on | § 3d.5.4 | Confirm default tone |
| 3d-I5 | Share-as-image palette in Sunlight mode | § 3d.5.6 | Confirm or specify |
| 3d-I6 | Witness chip surface for aces — currently rendered; confirm witness data model | § 3d.4.3 | Confirm field shape |
| 3d-I7 | Spectator-tier handicap card visibility — currently scoped to picked member | § 3d.1.7 | Confirm |

---

# § Pass 3d — Ratification block

You are accepting:

1. **Screen 3d.1** — Stats home with three KPI cards (Handicap / Best / Rounds), handicap trend chart matching Ship 5+6 polish vocabulary, drill-in list to all sub-surfaces.
2. **Screen 3d.2** — Round History with filter bar (toggles + dropdowns), reverse-chrono rows, 30-round pagination, long-press actions.
3. **Screen 3d.3** — Records with four sections (Scoring / Course-specific / Format-specific / Streaks), 2-col grid card layout, course/format sections gated by play threshold.
4. **Screen 3d.4** — Aces + Awards combined with sub-segment, ace cards on felt fill (celebration), award cards on sunk fill, just-earned new-pip pattern, locked-award visibility decision pending.
5. **Screen 3d.5** — Trophy Room + Season Recap combined with sub-segment, trophy cards on felt-deep (legacy), season recap as vertical narrative with stat blocks + share-as-image + share-to-chat.
6. All 5 screens cite Part 1 tokens, declare cross-surface consumers, respect reduced-motion + Sunlight, list a11y treatment.
7. **7 inferences** require resolution before sub-pass 3e begins.

✏️ **Founder action:** Ratify, red-line, or amend per screen. Once ratified, sub-pass **3e — More tab** is final (~3-4 screens: More root with IA'd categories, Profile sheet, Settings, Admin entry).

**End of sub-pass 3d.** Standing by.
