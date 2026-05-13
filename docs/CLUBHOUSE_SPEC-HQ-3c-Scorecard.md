# CLUBHOUSE_SPEC-HQ — Part 2, View 3c: Scorecard

> **Status:** Subordinate to `docs/CLUBHOUSE_SPEC-HQ.md` (Part 1). Awaiting Founder ratification.
> **Canonical mock:** `Parbaughs HQ Final v2.html` — `#v-scorecard` section.
> **Scope:** One view, all states. The completed-round detail surface.

---

## 0 — View scope

The Scorecard view is the **round detail page**. It opens when a member or spectator clicks through from a feed card, a leaderboard row, or the HUD finished-state banner. It shows the full hole-by-hole card, by-the-numbers stats, a pulled quote from the round, and agate modules carrying card details, records, comments, and share actions.

States covered:
- **3c.1** — Final (completed round, default — the canonical state)
- **3c.2** — Own vs. spectator (the viewing member is either the round's author or a spectator; minor copy/CTA differences)
- **3c.3** — Multi-card (a foursome posted together — table shows all 4 members)
- **3c.4** — Disputed / under review (a round flagged for handicap dispute or scoring correction)

---

# § 3c.1 — Final state (default)

## 3c.1.1 Frame composition

| Slot | Spec |
|---|---|
| Top nav | HQ Part 1 § 4 |
| Sticky tab switcher | HQ Part 1 § 5 |
| Masthead | HQ Part 1 § 6 — eyebrow `Round · Final · Round No. {N}`, H1 `{Course}, <em>{Score}.</em>`, sub-deck round-narrative, date line `{DayShort} · {MonShort} {Day} · {elapsed}` |
| Scope rail | HQ Part 1 § 7 — Round / Season / All time (default Round) |
| Two-column body | Main + agate |
| Footer | HQ Part 1 § 14 |

## 3c.1.2 Masthead — Scorecard rules

- **Eyebrow:** `Round · Final · Round No. {N}` where N = `MemberDoc.totalRounds` index for the playing member at time of post.
- **H1:** Course short name + the score, comma-separated, italic-brass score. Examples:
  - `Ocean Pines, <em>76.</em>`
  - `Heritage Hills, <em>79.</em>`
  - `Honors Course, <em>signed for 81.</em>` (when over-par; longer clause)
- **Sub-deck:** Single sentence; the round's editorial summary. Auto-aggregated from round events + member-authored recap. Wave 3: member writes; Wave 4: aggregator drafts and member edits.
- **Date line:** `{DayShort} · {MonShort} {Day} · {elapsed}` — date and elapsed time of the round.

## 3c.1.3 Scope rail

Per HQ Part 1 § 7.1. Three tabs:
- **Round** (default) — this single round in isolation
- **Season** — round compared to season-to-date averages
- **All time** — round compared to all-time bests/averages

Switching scope changes only Section B (by-the-numbers); Section A (the card), the pull, and the agate are scope-invariant.

Meta string: `Posted {date} · {N} likes · {N} comments`.

## 3c.1.4 Main column

### Section A — The card (scorecard table)

Section H2 `The card`, meta `Stroke play · {tee color} tees`.

The scorecard table per HQ Part 1 § 9.5.

**Columns:** Hole | 1-9 | Out | 10-18 | In | Tot

**Rows:**
1. **Par** (`.par-row`) — par for each hole, total for each nine, grand total = course par
2. **Yds** (`.par-row`) — yardage per hole, sum totals
3. **{Member name}** — score per hole, color-coded per HQ Part 1 § 9.5 (claret=bogey, moss=birdie, brass=eagle, ink=par)
4. (Multi-card: additional member rows — see § 3c.3)

**Grand-total cell** (`.tot-grand`) — `--cb-ink` background, `--cb-chalk` text, Mono 700 13px tabular. The one fully-inked cell.

**Notice strip** below the table — HQ Part 1 § 11.2:
> `{N} net · +{N} to par · {N} birdies / {N} pars / {N} bogeys · 2-putt avg {N.N}`

Single line of summary stats in mono uppercase brass-tinted notice strip.

### Pull quote (between sections)

A `.pull` block (HQ Part 1 § 10) sits between Section A and Section B. Content = one sentence pulled from the round narrative or from the most-liked comment.

Founder approves Wave 3; aggregator picks Wave 4. If no pull-worthy quote: omit entirely (the pull is optional).

### Section B — By the numbers (stat strip)

Section H2 `By the numbers`, meta `Round vs season avg` (or scope-equivalent).

4-column stat strip per HQ Part 1 § 9.2.

| Stat | Source | Format |
|---|---|---|
| Score | Round total | `{N}` + delta vs scope baseline (`−5 vs season`) |
| FIR | Fairways in regulation | `{N}/{N}` + delta (`↑ {N}% vs season`) |
| GIR | Greens in regulation | `{N}/{N}` + delta or notable-record callout (`↑ best of season`) |
| Putts | Total putts | `{N}` + delta (`↓ {N} vs season`) |

Stat delta colors:
- Improvement (lower score, higher FIR/GIR, lower putts): `--cb-moss`
- Regression: `--cb-claret`
- Even / notable: `--cb-ink-faint`

Scope swap (Round → Season → All time) replaces the delta baselines but keeps the same 4 stats.

## 3c.1.5 Agate rail

| # | Module | Notes |
|---|---|---|
| 1 | **Card Details** | Course / tees / conditions / start / finish / pace |
| 2 | **Records This Round** | Notable records achieved (new season low, longest streak, first eagle) |
| 3 | **Comments · {N}** | First 2–3 comments; full thread on click-through |
| 4 | **Share** | Share actions (card image, link, post recap to feed) |

### Module 1 — Card Details

```
CARD DETAILS
────────────
Course             Ocean Pines
Tees               Blue · 6,842
Conditions         68° · Calm
Started            7:14 AM
Finished           11:42 AM
Pace               4h 28m
```

All values pulled from `RoundDoc.metadata`.

### Module 2 — Records This Round

Free-form Fraunces 13.5px body listing records broken or notable round events:

> `New season low · longest GIR streak (5) · first eagle-2 of the year on 2.`

Aggregator computes against member history. If no records broken: module shows `Solid round. Numbers consistent with the season.` or omits entirely.

`[GAP]` Founder confirms: empty-record placeholder or hide the module?

### Module 3 — Comments

First 2-3 comments inline, each as Fraunces 13px lines:

```
COMMENTS · 2
────────────
Drew: Numbers don't lie. Heater incoming.
Will: Watch your back, B.
```

Comment author in Fraunces 600 (slightly bolder), body in Fraunces 400. Click anywhere in the module → opens the comment thread modal/sheet.

If 0 comments: module shows `No comments yet. Be the first.` with a `Comment →` CTA.

### Module 4 — Share

```
SHARE
─────
Card image          PNG · 1080
Round link          Copy
Post recap          → Feed
```

Three actions:
- **Card image** — generate a 1080×1080 PNG of the round summary (Wave 4); Wave 3 = static "coming soon" or hide.
- **Round link** — copy a deep link to this round to clipboard.
- **Post recap** — open the feed composer prefilled with the round summary; member edits and posts.

`[GAP]` Founder confirms: Wave 3 ships with which of the 3 share actions live?

## 3c.1.6 Cross-surface dependencies

| Element | Reads | Writes |
|---|---|---|
| Scorecard table | `RoundDoc.holes[]`, `CourseDoc.holes[]` | — |
| Notice strip | Aggregator over `RoundDoc.holes[]` | — |
| Pull quote | Curated or aggregator from round events + comments | — |
| Stat strip | Aggregator over current scope (Round / Season / All time) | — |
| Card Details | `RoundDoc.metadata`, `CourseDoc` | — |
| Records | Aggregator over `RoundDoc[]` history | — |
| Comments | `CommentDoc[]` filtered by roundId | — |
| Share — link | Generate `/r/{roundId}` URL | — |
| Share — recap | Open composer prefilled | Writes new `FeedItemDoc` on post |
| Share — card image | Image generator service | — |

## 3c.1.7 Ratification block — § 3c.1

Accepted:
- Final state layout: masthead → scope → card + notice + pull + stats in main; details + records + comments + share in agate.
- Grand-total cell is the one inked-fully cell in the table.
- Pull quote is optional; omits when no pull-worthy content exists.
- Stat-strip baselines swap with scope; stats themselves do not change.

---

# § 3c.2 — Own vs. spectator

Two viewer cases of the same scorecard:

**Own (the playing member is viewing their own scorecard):**
- Share module is fully live (all 3 actions).
- A small `Edit recap →` link appears below the sub-deck if `RoundDoc.recap` is editable (≤24h since post).
- Notification CTA in agate: `{N} new likes since you last viewed` (Wave 4).

**Spectator (anyone else viewing):**
- Share module shows the link + image options; "Post recap" replaced with `Comment →` deep-link to the comment composer.
- A `Like` action surfaces beneath the notice strip — small brass-pill button, Mono 11px `LIKE` or `❤ LIKED` (filled state).
- If the spectator and playing member are in the same league: scope rail's `Season` and `All time` baselines use the **playing member's** season/all-time (not the viewer's). If they're not in the same league (cross-league view via deep link): scope rail collapses to `Round` only.

## 3c.2.1 Ratification block — § 3c.2

Accepted:
- Own and spectator share the same layout; only the agate Share + Like CTA differ.
- Recap edit window is 24 hours from post.
- Cross-league deep-link views show Round scope only.

---

# § 3c.3 — Multi-card state

**When:** A foursome (or any group ≥2) posts the round together — `RoundDoc.groupId` set, multiple `RoundDoc[]` share the same group.

**What changes:**

- **Scorecard table** gains additional rows — one per member. The viewing member's row gets a `.you` background tint (`rgba(180,137,62,.06)`) matching the leaderboard.
- **Notice strip** is per-row — each member's row has its own notice line beneath, OR a single combined notice with member-comparison stats. `[GAP]` Founder picks.
- **Grand-total column** still shows each member's grand total, color-coded by under/over par.
- **Pull quote** pulls from the group's collective narrative — most-liked comment from any of the foursome.
- **Stat strip (Section B)** stays focused on the viewing member's stats. The other members' stats are not surfaced here — they have their own Scorecard view at `/r/{roundId}` for each member.
- **Agate** — Records This Round shifts to a group-leaderboard mini-module: `Low round · Will · 74` + `Most birdies · Mike · 6` etc.

## 3c.3.1 Ratification block — § 3c.3

Accepted:
- Multi-card adds member rows to the table; rest of the page focuses on the viewing member.
- Group-leaderboard mini surfaces in the agate Records module.

---

# § 3c.4 — Disputed / under-review state

**When:** `RoundDoc.disputeStatus === 'under_review'` (e.g. handicap dispute, scoring correction request).

**What changes:**

- A NOTICE strip (HQ Part 1 § 11.2) renders above the masthead: `THIS ROUND IS UNDER REVIEW · {reason} · POSTED COUNTS PAUSED.`
- Stats in Section B show frozen values with an em-dash overlay on deltas: `{N}  — pending review`.
- Records module hides (records are paused while under review).
- Share module hides Post-recap (no posting from a disputed round); link + image stay.
- A `Resolve →` CTA in agate, visible only to league admins or the playing member, opens the dispute resolution flow.

## 3c.4.1 Ratification block — § 3c.4

Accepted:
- Disputed state is a structural change visible above the masthead.
- Records + recap-share hide; link + image stay.
- Resolve CTA is admin-and-author scoped.

---

# § 3c.5 — Token consumption summary

```
--cb-felt, --cb-chalk, --cb-chalk-deep, --cb-line
--cb-ink, --cb-ink-soft, --cb-ink-faint
--cb-mute, --cb-mute-soft
--cb-brass, --cb-brass-deep, --cb-brass-soft
--cb-claret (per-hole bogey + delta regression)
--cb-moss (per-hole birdie + delta improvement)

--type-mast-hq, --type-sec-hq, --type-display-hq
--type-pull (pull quote)
--type-stat, --type-body-hq, --type-agate
--type-eyebrow-hq, --type-label-hq, --type-num-hq, --type-ui-hq
```

---

**End of Part 2 · View 3c.**
