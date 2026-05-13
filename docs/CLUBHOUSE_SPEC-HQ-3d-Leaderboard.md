# CLUBHOUSE_SPEC-HQ — Part 2, View 3d: Leaderboard

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Awaiting Founder ratification.
> **Canonical mock:** `Parbaughs HQ Final v2.html` — `#v-leaderboard` section.
> **Scope:** One view, all states. The season-standings surface.

---

## 0 — View scope

The Leaderboard view is the **season standings page**. Members come here to see where the league stands across the current season. Three scoring modes (Stableford / Stroke / Net) reflect the three official league scoring conventions. Movers strip surfaces week-over-week deltas. Agate carries the closest race, trophy watch, schedule, and a pull quote.

States covered:
- **3d.1** — Mid-season (default — ≥1 round posted, season in progress)
- **3d.2** — Early-season (≤3 weeks since season start, sparse data)
- **3d.3** — Final week / season-ending (last week of the season, trophy callouts elevated)
- **3d.4** — Off-season / between-seasons (no active season — viewer chooses an archived season)

---

# § 3d.1 — Mid-season state (default)

## 3d.1.1 Frame composition

| Slot | Spec |
|---|---|
| Top nav | HQ Part 1 § 4 |
| Sticky tab switcher | HQ Part 1 § 5 |
| Masthead | HQ Part 1 § 6 — eyebrow `Standings · {SeasonName}`, H1 `The board <em>so far.</em>`, sub-deck week-summary one-liner, date line `{DayShort} · {MonShort} {Day} · Week {N} / {Total}` |
| Scope rail | HQ Part 1 § 7 — Stableford / Stroke / Net (default Stableford) |
| Two-column body | Main + agate |
| Footer | HQ Part 1 § 14 |

## 3d.1.2 Masthead — Leaderboard rules

- **Eyebrow:** `Standings · {SeasonName}` — e.g. `Standings · Spring '26 Season`
- **H1:** Editorial. Defaults stocked:
  - Mid-season: `The board <em>so far.</em>`
  - Tight race: `Three strokes <em>separate first.</em>`
  - Runaway leader: `{LeaderFirstName}'s <em>to lose.</em>`
- **Sub-deck:** One-sentence week summary. Examples: `Eight weeks in. Will leads by five. Mike's last round narrowed it.` / `Drew jumped two spots Sunday. Pat fell one.`
- **Date line:** `{DayShort} · {MonShort} {Day} · Week {N} / {Total}` — current week + season length.

## 3d.1.3 Scope rail

Per HQ Part 1 § 7.1. Three tabs:
- **Stableford** (default) — points-based scoring, the canonical league mode
- **Stroke** — raw stroke-play totals
- **Net** — handicap-adjusted stroke

Meta string: `Counting best {N} of {N}` — the season's drop-the-worst rule.

Switching scope re-orders the leaderboard rows but the structure stays identical.

## 3d.1.4 Main column

### Section A — League standings

Section H2 `League standings`, meta `{N} of {N} members posted this season`.

The leaderboard table per HQ Part 1 § 9.6.

**Columns:** `#` | `Member` | `Rounds` | `Avg` | `Score`

**Per-row composition:**

| Cell | Content | Spec |
|---|---|---|
| Rank | `1`, `2`, ... | Fraunces 600 22px tabular, `--cb-ink-faint`. Rank 1 is `--cb-brass` (`.top` class). |
| Member | Avatar (36×36 brass-ringed circle) + name + detail line | Name: Fraunces 600 15px ink. Detail: Mono 10.5px mute-soft uppercase — `Hcp {N.N} · {N} rds · last {N}` or `live now` if live. |
| Rounds | `{N}` | Mono 600 14px mute-soft tabular |
| Avg | `{NN.N}` | Mono 600 14px mute-soft tabular |
| Score | `{±NN}` | Fraunces 600 22px tabular. Under-par = `--cb-moss`. Over-par = `--cb-ink-faint` (charcoal, NOT claret — see HQ Part 1 § 9.6). |

**Viewer row tint:** The row where `MemberDoc.id === viewer.id` gets `.you` class — `rgba(180,137,62,.06)` background, `--cb-brass` rank numeral, `<span class="chip">You</span>` chip next to the name.

**Live indicator:** If any listed member has a round live, their name gets a pulsing brass `.live-dot` prefix.

**Row tap behavior:** Tapping a row opens the member's profile sheet/page.

**Row count:** Default shows the full league. No pagination unless league exceeds 24 members — then add "Show all →" expand.

### Section B — Movers · this week

Section H2 `Movers · this week`, meta `{StartDate} — {EndDate}`.

4-column stat strip (HQ Part 1 § 9.2).

| Stat | Source | Format |
|---|---|---|
| Climber | Member who moved up most spots this week | `{FirstName}` + delta (`↑ {N} spots · {N}` last score) |
| Faller | Member who moved down most spots | `{FirstName}` + delta (`↓ {N} · {context}`) |
| Hot Streak | Member with longest active rounds-under-N streak | `{FirstName}` + descriptor (`{N} rounds <80`) |
| Most Rounds | Member with most rounds posted this season | `{N}` + member name |

Stat-num cell shows the member's first name in Fraunces 600 38px (not a number — this strip uses names because the story is who, not how many).

## 3d.1.5 Agate rail

| # | Module | Notes |
|---|---|---|
| 1 | **Closest Race** | Featured matchup between two close contenders |
| 2 | **Trophy Watch** | Per-trophy leaders across the season |
| 3 | **Schedule** | Upcoming weeks + the season finale |
| 4 | **Pull Quote** | Pulled from member content |

### Module 1 — Closest Race

```
CLOSEST RACE
────────────
Mike vs Drew
3 strokes apart · 8 weeks remaining · same course Sunday.
```

- Headline: Fraunces 600 15px `--cb-ink`, two member names with `vs` in middle (lowercase, Mono 11px mute-soft).
- Body: Fraunces 13.5px `--cb-ink-soft` body, line-height 1.5.

Aggregator picks the closest matchup between any two ranked members where:
1. Score gap ≤ 5 strokes
2. Both have ≥ 5 rounds posted
3. Both have an upcoming round in the next 14 days (preferred — adds "same course {Day}")

If no qualifying matchup: module hides.

### Module 2 — Trophy Watch

```
TROPHY WATCH
────────────
Stroke title       Will
Net title          TBD
Most birdies       Will (38)
Best round         74 · Will
Iron Will          Mike (14)
```

Per-trophy leader. Each row: trophy name left (Fraunces 500 13px ink), leader right (Mono 11px mute-soft uppercase). "TBD" when no leader has emerged.

Trophies stocked Wave 3:
- **Stroke title** — best season stroke avg
- **Net title** — best season net avg
- **Most birdies** — most birdies posted
- **Best round** — single lowest round
- **Iron Will** — most rounds posted (named after Will Parsons' nickname in the mock; rename per league)

Wave 4 unlocks Founder-defined custom trophies.

### Module 3 — Schedule

```
SCHEDULE
────────
Wk 9 · Honors        May 2
Wk 10 · Heritage     May 9
Wk 11 · Ocean        May 16
Spring Final         Jun 27
```

Upcoming weeks left in season + the season finale always pinned. Format: week label + course (left), date (right). Tapping a row opens that week's Calendar view.

### Module 4 — Pull Quote

Same format as Home agate Pull Quote. Pulled from the closest-race matchup's smack-talk comments, the leader's most-quoted post, or Founder-curated.

```
PULL QUOTE
──────────
"Watch your back, B."
— Will, Apr 25
```

## 3d.1.6 Cross-surface dependencies

| Element | Reads | Writes |
|---|---|---|
| Leaderboard rows | Aggregator: season standings by current scope (Stableford/Stroke/Net) | — |
| Live dot | `RoundDoc.status === 'in_progress'` for listed members | — |
| Movers strip | Aggregator: week-over-week deltas | — |
| Closest Race | Aggregator: pairwise score gaps | — |
| Trophy Watch | Aggregator: per-trophy leaders | — |
| Schedule | `WeekDoc[]` for current season | — |
| Pull Quote | Curated or aggregator from comments + posts | — |

## 3d.1.7 Ratification block — § 3d.1

Accepted:
- Mid-season layout: masthead → scope → standings + movers in main; closest race + trophies + schedule + pull in agate.
- Over-par scores use `--cb-ink-faint`, not `--cb-claret` (HQ Part 1 § 9.6).
- Movers strip uses names not numbers in the stat-num cell.
- Scope swap re-sorts rows, does not change structure.

---

# § 3d.2 — Early-season state

**When:** ≤3 weeks since `SeasonDoc.startDate` AND fewer than 50% of league members have posted any round.

**What changes:**

- **Standings rows** still render, but only for members who have posted. Members with 0 rounds collapse into a single "Not yet posted · {N} members" row at the bottom — Fraunces italic 14px `--cb-mute-soft`, no rank, no score.
- **Movers strip** replaces "Faller" and "Hot Streak" with `First Post` (first member to post this season) and `Most Active Day` (day of the week with most rounds posted).
- **Closest Race** module hides (not enough data).
- **Trophy Watch** shows "TBD" for most trophies.
- **Masthead H1:** `The season <em>opens.</em>` or `Three rounds in.`
- **Sub-deck:** Acknowledges the early state — e.g. `The board is forming. {LeaderFirst} leads early.`

## 3d.2.1 Ratification block — § 3d.2

Accepted:
- Early-season state collapses non-posters into a single row.
- Movers strip swaps two cells for early-relevant stats.
- Closest Race hides; Trophy Watch shows TBD.

---

# § 3d.3 — Final-week state

**When:** Current week ≥ `SeasonDoc.totalWeeks` OR within 14 days of `SeasonDoc.endDate`.

**What changes:**

- **Banner** (HQ Part 1 § 11.1 styling, but text not LIVE-eyebrow): `SEASON FINALE · {FinaleEvent} · {Date}` with CTA `Open finale →` linking to the Calendar.
- **Standings rows** unchanged, but top 3 rows get **trophy callouts** — small brass chips next to the names: `🏆` (or text `STROKE LEADER`) for #1, `🥈` for #2, `🥉` for #3. `[GAP]` Founder picks emoji vs text-pip.
- **Masthead H1:** `The board <em>closes Sunday.</em>` or similar.
- **Movers strip** replaced with **"This season's story"** strip — 4 stats: lowest round of season, most rounds posted, biggest jump, longest streak.
- **Trophy Watch** module **elevates** — moves to position 1 in the agate (above Closest Race). Visual: same module, but with a brass top-border `border-top: 6px double var(--cb-brass)` instead of the standard 2px solid `--cb-ink`.

## 3d.3.1 Ratification block — § 3d.3

Accepted:
- Final-week introduces a SEASON FINALE banner.
- Top-3 rows get trophy chips.
- Trophy Watch elevates in agate with brass double-rule top.
- Movers strip replaced with season-story strip.

---

# § 3d.4 — Off-season / archived state

**When:** No active season AND viewer has selected an archived season via a season-picker dropdown.

**What changes:**

- **Scope rail** prepends a **Season picker** before the scoring tabs — a fourth dropdown labeled `Season:` with the current selection (`Spring '25`, `Fall '25`, etc.).
- **All data is read-only** — no live dots, no live banner, no Movers strip.
- **Banner:** `Viewing archived season · {SeasonName} · Completed {EndDate}`.
- **Trophy Watch** shows the final trophy holders for that archived season, frozen.
- **Closest Race** hides (no future races).
- **Schedule** module replaced with **Season Summary** — a 5-row recap: weeks played, rounds posted, low round, most active member, champion.
- **Pull Quote** pulls from the season's most-liked comment, frozen at season-end.

## 3d.4.1 Ratification block — § 3d.4

Accepted:
- Off-season state is the "archived season view" — read-only, with a season-picker dropdown prepended to the scope rail.
- Closest Race + Schedule swap out for static recap modules.

---

# § 3d.5 — Token consumption summary

```
--cb-felt, --cb-chalk, --cb-chalk-deep, --cb-line
--cb-ink, --cb-ink-soft, --cb-ink-faint
--cb-mute, --cb-mute-soft
--cb-brass, --cb-brass-deep, --cb-brass-soft
--cb-moss (under-par scores)
--cb-ink-faint (over-par scores — NOT claret)

--type-mast-hq, --type-sec-hq
--type-stat (Movers strip)
--type-agate (Closest Race body)
--type-body-hq (sub-deck, pull)
--type-eyebrow-hq, --type-label-hq, --type-num-hq, --type-ui-hq
```

---

**End of Part 2 · View 3d.**

---

# Appendix — Spec hierarchy summary

The full HQ desktop spec set, engineering reads in this order:

1. **`docs/CLUBHOUSE_SPEC-HQ.md`** — Part 1 foundation (tokens, layout, masthead, nav, agate, motion, a11y, footer, implementation order).
2. **`docs/CLUBHOUSE_SPEC-HQ-3a-Home.md`** — Part 2 View 3a · HQ Home.
3. **`docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md`** — Part 2 View 3b · Spectator HUD.
4. **`docs/CLUBHOUSE_SPEC-HQ-3c-Scorecard.md`** — Part 2 View 3c · Scorecard.
5. **`docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md`** — Part 2 View 3d · Leaderboard (this file).

Sibling mobile spec hierarchy (already shipped):
- `docs/CLUBHOUSE_SPEC.md` — Part 1 mobile foundation
- `docs/CLUBHOUSE_SPEC-3a-Home.md` through `-3e-More.md` — Part 2 mobile screens
- `docs/CLUBHOUSE_SPEC-4-Wave3-implementation.md` — Part 3 Wave 3 implementation

Canonical mocks:
- `Parbaughs HQ Final v2.html` — HQ desktop visual source of truth
- `Parbaughs Mobile Final v2.html` — Mobile visual source of truth
