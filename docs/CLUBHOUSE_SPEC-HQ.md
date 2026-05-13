# CLUBHOUSE_SPEC-HQ.md — Parbaughs Desktop HQ Design System

> **This document is Part 1 of 5 for HQ (desktop).**
> **Part 1 (this file):** Foundation — tokens, layout, masthead, navigation, scope rail, agate rail, shared components, motion, accessibility.
> **Part 2:** Per-view specs (4 views, one file each):
> - `CLUBHOUSE_SPEC-HQ-3a-Home.md` — HQ Home
> - `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` — Spectator HUD (live round)
> - `CLUBHOUSE_SPEC-HQ-3c-Scorecard.md` — Scorecard (round detail)
> - `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` — Leaderboard (standings)
>
> **Canonical mock:** `Parbaughs HQ Final v2.html` — the visual source of truth. This spec set is the prose layer; the mock is the pixel layer. Where they disagree, the mock wins on layout and the spec wins on behavior/tokens.
>
> **Authority:** Design system canonical source for HQ desktop. Engineering agents implement to 1:1 fidelity against `Parbaughs HQ Final v2.html`. Tokens defined here are the only tokens HQ may consume; additions require amendment to this doc, not per-view invention.
>
> **Sibling:** mobile spec hierarchy at `docs/CLUBHOUSE_SPEC.md` + `CLUBHOUSE_SPEC-3a..3e.md`. HQ and mobile share **one token palette** (the `--cb-*` tokens defined in mobile § 1); HQ extends with layout/grid/density tokens unique to desktop. Cross-references in this doc to mobile § N are to that file.

---

## How to read this doc

Each major section ends with a **Ratification block** stating what is being accepted. Inference tags: `[CONFIRMED]` (live in the mock), `[INFERENCE]` (derived from mock + mobile sibling), `[GAP]` (open question for Founder).

Engineering reads §-numbered sections to understand intent and tokens, then matches the mock for layout. Tokens (font names, hex codes, spacing) come from this doc; visual rhythm comes from the mock.

---

# § 1 — Palette

HQ uses the **same palette** as mobile (`docs/CLUBHOUSE_SPEC.md` § 1). One palette, two surfaces. The token names, OKLCH values, and contrast ratings transfer 1:1. Re-read mobile § 1 — do not duplicate values here.

## 1.1 Surface-specific usage differences

| Token | Mobile role | HQ role |
|---|---|---|
| `--cb-felt` | Primary dark surface (in-round states, modal scrims) | Top nav background, footer background, masthead overlay only. Felt does NOT cover full screens on HQ. |
| `--cb-chalk` | Page background | Page background AND card background (HQ uses chalk + chalk-deep for two-tier elevation, not chalk + felt). |
| `--cb-chalk-deep` | Inputs, sunken cards | Tab bar background, table header stripes, sidebar module wells. |
| `--cb-brass` | Accent (icons, links, key numerals) | Accent + **brass double-rule** as masthead/footer signature flourish (6px double border, top of footer + bottom of nav). |
| `--cb-line` | Hairlines | Hairlines + table cell borders + agate module dividers. |

The HQ "newspaper" identity comes from heavier use of hairlines, the brass double-rule signature, and the two-column (main + agate) layout — not from a different palette.

## 1.2 Mock CSS variable shim

The mock uses local variable names with `--cb-` prefix already aligned to mobile. The mapping is 1:1 — no renames needed during engineering.

| Mock var | Spec token | Notes |
|---|---|---|
| `--cb-green` | `--cb-felt` | `#0F3D2E` |
| `--cb-green-2` | `--cb-felt-deep` | `#0A2D22` |
| `--cb-chalk` | `--cb-chalk` | `#F4EFE4` |
| `--cb-chalk-2` | `--cb-chalk-deep` | `#E9E2D1` |
| `--cb-chalk-3` | `--cb-line` | `#DCD3BD` (HQ uses chalk-3 as the line color; mobile uses a dedicated `--cb-line`) |
| `--cb-ink` | `--cb-ink` | `#14130F` |
| `--cb-ink-2` | (no alias) | `#2D2B24` — secondary ink, slightly warmer than `--cb-ink`. **Engineering action:** add `--cb-ink-soft` to the mobile token table to match. |
| `--cb-charcoal` | (no alias) | `#4A4740` — tertiary ink. **Engineering action:** add `--cb-ink-faint`. |
| `--cb-mute` | `--cb-mute` | `#7A766B` |
| `--cb-mute-2` | (alias) | `#8A8478` — second mute step. Used heavily on HQ for agate body text. **Engineering action:** add `--cb-mute-soft`. |
| `--cb-mute-2-dec` | (alias) | `#A8A395` — decorative mute, only used inside dark surfaces (nav, footer). Acceptable on `--cb-felt`; never on `--cb-chalk`. |
| `--cb-brass` | `--cb-brass` | `#B4893E` |
| `--cb-brass-2` | (no alias) | `#C9A04A` — used once in mock for hover/pressed states. Folds into `--cb-brass`. |
| `--cb-brass-3` | (alias) | `#D4A957` — folds into `--cb-brass-soft`. |
| `--cb-brass-deep` | `--cb-brass-deep` | `#8C6A2E` |
| `--cb-claret` | `--cb-alert` (lighter expression) | `#8E3A3A` — used for over-par scores. **Engineering action:** add `--cb-claret` as separate semantic token (status: over-par), distinct from `--cb-alert` (status: destructive). |
| `--cb-moss` | `--cb-success` (alternate expression) | `#5A7D4E` — used for under-par scores. **Engineering action:** add `--cb-moss` as separate semantic token (status: under-par). |

**Engineering action consolidated:** add these to mobile § 1 token table as an amendment so HQ + mobile share one source:

```css
--cb-ink-soft:    #2D2B24;  /* body text where --cb-ink is too heavy */
--cb-ink-faint:   #4A4740;  /* tertiary text */
--cb-mute-soft:   #8A8478;  /* second mute step */
--cb-mute-faint:  #A8A395;  /* decorative mute on dark surfaces only */
--cb-claret:      #8E3A3A;  /* over-par scores; NOT destructive */
--cb-moss:        #5A7D4E;  /* under-par scores; NOT generic success */
```

`[GAP]` Founder ratifies whether these are added to mobile or kept HQ-local.

## 1.3 Ratification block — § 1

Accepted:
- Single palette across mobile + HQ (mobile § 1 is canonical).
- HQ-specific usage notes (1.1) — felt is a chrome surface on HQ, not a content surface.
- Six new tokens (1.2) added to the shared palette to capture HQ's denser typographic hierarchy.

---

# § 2 — Typography

HQ uses the same three families as mobile (Fraunces / Inter / JetBrains Mono — mobile § 2). The **scale** is larger and the **rhythm** is denser because HQ has 1380px of width to work with and a newspaper-density information goal.

## 2.1 Scale (HQ-specific)

| Token | Family | Size | Weight | Use | Mock class |
|---|---|---|---|---|---|
| `--type-mast-hq` | Fraunces | 88px | 600 | Masthead H1 ("Saturday at the course.") | `.mast-h1` |
| `--type-mast-hud` | Fraunces | 96px | 600 | Spectator HUD score numeral | `.hud-score` |
| `--type-sec-hq` | Fraunces | 30px | 600 | Section H2 ("On the course") | `.sec-h2` |
| `--type-display-hq` | Fraunces | 22px–24px | 500–600 italic | Hero names, course names | `.lr-name`, `.hud-name` |
| `--type-pull` | Fraunces | 32px | 500 italic | Pull quotes | `.pull p` |
| `--type-stat` | Fraunces | 38px | 600 | Stat numerals | `.stat-num` |
| `--type-stat-large` | Fraunces | 54px | 600 | Live-round score | `.lr-score` |
| `--type-body-hq` | Fraunces | 15.5px | 400 | Feed body, shot narrative | `.feed-body`, `.shot-body` |
| `--type-agate` | Fraunces | 13.5px | 400 | Agate rail body | `.agate-body` |
| `--type-eyebrow-hq` | JetBrains Mono | 10.5–11px | 700 | Eyebrows above headlines | `.mast-eye`, `.sec-meta`, `.card-eye` |
| `--type-label-hq` | JetBrains Mono | 10–11px | 600 | Labels, table headers, agate item labels | `.lb-h`, `.stat-label` |
| `--type-num-hq` | JetBrains Mono | 11px | 600 | Agate item-right numerals, dates | `.agate-item-r` |
| `--type-ui-hq` | Inter | 13–14px | 400–600 | Inline UI text, feed meta | `.feed-meta` |

`--type-mast-hq` and `--type-mast-hud` use `font-variation-settings:'opsz' 144` — Fraunces opens up at large sizes via optical-size axis. Engineering must preserve this; it is not visual seasoning, it is what makes the headline feel like a paper.

## 2.2 Rhythm rules

- Eyebrows (mono 10.5–11px, 1.5–2.5px tracking, uppercase) sit **above** every major content block. Brass color for live/active, mute for default.
- Section H2 (`--type-sec-hq`) has a solid 1px `--cb-ink` bottom border with the section-meta floated right in mono 10.5px mute. This is the newspaper section header pattern.
- Pull quotes use **6px double `--cb-brass`** borders top and bottom, italic Fraunces 32px, max-width 780px, centered. Italic curly quotes (the CSS `::before` / `::after` rendering) are brass.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every score, stat, table cell, leaderboard total. No exceptions.

## 2.3 Ratification block — § 2

Accepted:
- HQ-specific size scale (2.1) — distinct from mobile because the surface is 4× wider.
- Optical-size axis usage on display sizes (`opsz` 96 / 144).
- Eyebrow → section-header → body rhythm as the newspaper signature.
- Tabular numerals enforced wherever digits sit in a vertical column.

---

# § 3 — Layout grid

## 3.1 Frame width and gutters

- **Max content width:** `1380px`, centered (`.nav-inner`, `.tabs-inner`, `.page`, `.foot` all share this).
- **Page gutter:** `32px` left and right inside the 1380 frame.
- **Vertical rhythm unit:** `8px` base — all paddings/margins are multiples (8, 12, 14, 16, 18, 22, 24, 28, 30, 32, 36, 48).
- **Section break:** 30px below each `.sec` block. Section-header bottom border is 1px `--cb-ink` (solid, the same heavy rule the masthead uses).

## 3.2 Two-column layout

The body of every HQ view is a two-column grid:

```css
.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 32px;
  padding: 28px 0 48px;
}
@media (max-width: 1080px) {
  .layout { grid-template-columns: 1fr; gap: 18px }
  .agate { display: none }
}
```

- **Main column (left, fluid):** primary content — cards, feed, scorecard table, leaderboard rows.
- **Agate rail (right, 320px fixed):** modules with mono labels and condensed lists (Live Now, Weather, Standings, Tee Sheet, Pull Quote). The newspaper agate column.
- **Collapse:** below 1080px viewport the agate **disappears entirely** — does not stack below main. HQ is desktop-only by design; if a user is on a narrower viewport, the mobile experience should be the path. The agate hiding is a signal, not a graceful degradation.

`[CONFIRMED]` Tablet/narrow-desktop hides the agate. Founder ratified this in earlier conversation: HQ is the desktop surface, mobile is the small-screen surface, and HQ in its compact form is a degraded HQ — not the canonical product. The mobile app is.

## 3.3 Sticky regions

| Element | Sticky? | Notes |
|---|---|---|
| Top nav (`.nav`) | No (scrolls with page) | Newspaper masthead behavior — appears once, page scrolls past. |
| Tab switcher (`.tabs`) | **Yes** — `position: sticky; top: 0; z-index: 30;` | View switcher remains accessible while scrolling. This is mock-only on the canonical file; in production this is the HQ section nav for the four views. |
| Banner strip (CRISIS/LIVE) | No | Below masthead, scrolls with page. |
| Footer | No | Bottom of document. |

`[INFERENCE]` In production the `.tabs` row becomes the view-router for HQ (Home / HUD / Scorecard / Leaderboard). The mock represents these as siblings; the implementation may route them as four routes — the spec does not require either approach as long as the sticky-tab UX is preserved or replaced with equivalent persistent navigation.

## 3.4 Ratification block — § 3

Accepted:
- 1380px max, 32px gutters, 8px rhythm unit.
- Two-column grid: fluid main + 320px agate, 32px gap.
- Agate hides at <1080px (not stacks).
- Tab switcher is sticky.

---

# § 4 — Top nav

## 4.1 Composition

```
[Brand mark + name]        [HQ · Activity · Members · Calendar · Wallet]        [Search · Notifications · Avatar]
```

| Element | Spec |
|---|---|
| Wrapper | `background: var(--cb-felt); color: var(--cb-chalk); border-bottom: 6px double var(--cb-brass);` |
| Inner | `max-width: 1380px; padding: 18px 32px;` flex row, gap 32px |
| Brand mark | 32×32 circle, `--cb-brass` background, `--cb-felt` letter "P", Fraunces italic 18/700. Mirrors the masthead-overlay avatar pattern. |
| Brand name | Fraunces italic 600 20px, `--cb-chalk`, letter-spacing −0.01em |
| Nav link | JetBrains Mono 600 11px, uppercase, 1.8px tracking, `--cb-mute-faint` default, `--cb-chalk` active. Active link gets 1px `--cb-brass` bottom border (6px below baseline). |
| Nav icons (search, notifications) | 32×32 circles, `rgba(255,255,255,.06)` fill, `--cb-chalk` glyph, Mono 13px |
| Avatar | 32×32 circle, `--cb-brass` fill, `--cb-chalk` 1.5px ring, Fraunces italic 700 13px initials in `--cb-felt` |

## 4.2 Brass double-rule

The **6px double `--cb-brass` border-bottom** on the nav is the HQ signature flourish — repeats on the footer top, the pull-quote frame, and (in mobile sibling) the masthead. This is the visual mark that says "you are looking at a Parbaughs surface." Engineering must preserve `border: 6px double` (not `solid`, not `border-image` — the double-rule rendering is what carries the period flavor).

## 4.3 Behavior

- Nav links route to top-level surfaces. Order matters: **HQ · Activity · Members · Calendar · Wallet**. HQ first because it is the daily landing. Activity = the global feed. Members = roster. Calendar = league schedule + tee sheet. Wallet = parcoins + shop.
- Search icon opens a global command-K palette. `[GAP]` Command-K spec not authored — Wave 4.
- Notifications icon opens a popover anchored bottom-right of the icon. `[GAP]` Popover spec not authored — Wave 4.
- Avatar opens a menu (profile / settings / sign out). `[GAP]` Menu spec not authored — Wave 4.

## 4.4 Ratification block — § 4

Accepted:
- Five top-level nav targets (HQ · Activity · Members · Calendar · Wallet) in fixed order.
- 6px double-brass under-rule as signature flourish.
- Search / notifications / avatar trigger surfaces that are GAPPED until Wave 4.

---

# § 5 — Tab switcher (sub-navigation)

The row beneath the top nav, on every HQ surface, holds **scope tabs** that swap content within the current view. In the mock these are flat HTML buttons; in production they are React-rendered persistent sub-nav.

## 5.1 Composition

```
[View →]   [Tab · Tab · Tab · Tab]                                        [Meta string]
```

| Element | Spec |
|---|---|
| Wrapper | `background: var(--cb-chalk-deep); border-bottom: 1px solid var(--cb-line); position: sticky; top: 0; z-index: 30;` |
| Inner | `max-width: 1380px; padding: 10px 32px;` flex row, gap 4px |
| "View" eyebrow | Mono 600 10px, `--cb-mute`, 1.8px tracking, uppercase, margin-right 14px |
| Tab (default) | Mono 600 10.5px, uppercase, 1.5px tracking, `--cb-ink-faint`, padding 8px 16px, transparent background |
| Tab (active) | Background `--cb-ink`, color `--cb-chalk`, border 1px `--cb-ink`, radius 2px |
| Meta string | Right-aligned, Mono 10px, `--cb-mute`, uppercase, 1.5px tracking — e.g. "Band D · 1380px · Clubhouse" |

## 5.2 Two patterns

The tab row appears in **two patterns** across HQ:

**Pattern A — View switcher (top of frame, sticky).** Used to switch between the 4 HQ views (Home / HUD / Scorecard / Leaderboard). The mock uses this for the demo. In production, may be replaced by routes — but if routes are used, a persistent breadcrumb or section-nav must preserve the same affordance.

**Pattern B — Scope rail (inside a view, not sticky).** Used to scope the content of the current view. Examples:
- HQ Home: League / Network / All
- Spectator HUD: Live / Stats / Course
- Scorecard: Round / Season / All time
- Leaderboard: Stableford / Stroke / Net

Pattern B has the same visual spec but lives inside `.scope` (light chalk background, 14px vertical padding, 1px line bottom border, not sticky). It is **always present** on HQ views — every view has a scope.

## 5.3 Ratification block — § 5

Accepted:
- Two tab patterns: sticky view-switcher (top) + non-sticky scope rail (per view).
- Every HQ view has a scope rail; scope-rail content varies by view.
- Active tab uses `--cb-ink` fill + `--cb-chalk` text (not brass) — brass is reserved for **content** accents (live, stats, links).

---

# § 6 — Masthead

Every HQ view opens with a masthead block. This is the editorial signature of the surface and the primary place Fraunces gets to be Fraunces.

## 6.1 Composition

```
[Eyebrow — mono brass]
[H1 — Fraunces 88px, with one italic brass clause]
[Sub-deck (italic Fraunces 18px) ····················· Date (mono mute)]
```

| Element | Token | Spec |
|---|---|---|
| Wrapper | — | `padding: 36px 0 24px; border-bottom: 1px solid var(--cb-ink);` |
| Eyebrow | `--type-eyebrow-hq` | Mono 700 11px, uppercase, 2.5px tracking, `--cb-brass`. Content varies per view ("The Parbaughs · York, PA · Spring '26"). |
| H1 | `--type-mast-hq` | Fraunces 600 88px, line-height 0.92, letter-spacing −0.03em, `--cb-ink`, `opsz` 144. **One clause is italic + brass** — the editorial flourish. Pattern: `Saturday <em>at the course.</em>` |
| Sub-deck | `--type-display-hq` (italic) | Fraunces italic 400 18px, `--cb-ink-faint`, `opsz` 24. One sentence; the deck. |
| Date | `--type-label-hq` | Mono 600 11px, uppercase, 1.5px tracking, `--cb-mute`. Format: `Sat · Apr 25 · No. 0427` (day · date · issue number, OR day · date · time, OR similar). |

## 6.2 The italic-brass clause pattern

Every masthead H1 in HQ has the form `[plain text] <em>[italic brass clause].</em>`. Examples from the four views:

- HQ Home: `Saturday at the course.`
- Spectator HUD: `Will, thru eleven.`
- Scorecard: `Ocean Pines, 76.`
- Leaderboard: `The board so far.`

This is the **strongest visual rule on HQ** after the brass double-rule. The italic clause is the editorial voice; the plain clause is the headline. Engineering rules:

1. The italic clause is always color `--cb-brass`, weight 500 (lighter than the surrounding 600), font-style italic.
2. The italic clause is always terminal — it ends with a period inside the `<em>`.
3. The italic clause is short — 2-5 words. Never a full sentence.

Copywriting note: writing these is craft, not template. Founder approves H1 copy for each view; agent does not invent.

## 6.3 Ratification block — § 6

Accepted:
- Masthead is mandatory on every HQ view.
- The italic-brass-clause pattern is the editorial signature; engineering preserves the `<em>` markup as-is.
- Founder writes/approves masthead copy per view.

---

# § 7 — Scope rail

(See § 5.2 Pattern B for visual spec.) This section documents the **content rules** for the scope rail per view.

## 7.1 Scope content per view

| View | Scope tabs (left → right, default first) | Meta string (right) |
|---|---|---|
| HQ Home | League · Network · All | "{N} active · 14 day window" |
| Spectator HUD | Live · Stats · Course | "{N} watching · updates in real time" |
| Scorecard | Round · Season · All time | "Posted {date} · {N} likes · {N} comments" |
| Leaderboard | Stableford · Stroke · Net | "Counting best {N} of {N}" |

## 7.2 Scope semantics

- **League** scope = members of the current league only. The default for league-anchored users (most users).
- **Network** scope = members of the user's network across leagues (Wave 4+). Greyed out in Wave 3 if the network feature is not yet live.
- **All** scope = the global feed, public to all Parbaughs users.

For HUD scope:
- **Live** = real-time round view (default while round is in progress).
- **Stats** = round-in-progress numbers (front 9, GIR, putts, etc.) — same data as Live but stat-prominent.
- **Course** = course-anchored view (yardage book, hole-by-hole context, weather).

For Scorecard scope:
- **Round** = this single round.
- **Season** = comparison to the season-to-date.
- **All time** = comparison to the member's all-time history.

For Leaderboard scope:
- **Stableford / Stroke / Net** = the three official league scoring modes. Default is Stableford (per Founder rule: Stableford is the canonical league mode for handicap-mixed groups).

## 7.3 Ratification block — § 7

Accepted:
- Scope rail content fixed per view as above.
- Default scope is the first option in each tuple.
- Wave 4 unlocks Network scope; until then it is visible but greyed.

---

# § 8 — Agate rail

The 320px right column. Newspaper agate is dense, list-heavy, low-decoration. HQ agate is the same.

## 8.1 Module structure

Each agate module is a vertical stack:

| Element | Token | Spec |
|---|---|---|
| Wrapper | — | `padding-top: 14px; border-top: 2px solid var(--cb-ink);` First module has no top border/padding. |
| Title | `--type-eyebrow-hq` | Mono 700 10px, uppercase, 2px tracking, `--cb-brass`, margin-bottom 10px. e.g. `LIVE NOW · 2` |
| Body | varies | Either a list of `.agate-item` rows OR a paragraph in `--type-agate` (Fraunces 13.5px). |
| Item | — | Flex row `justify-content: space-between`. Left: Fraunces 500 13px `--cb-ink`. Right: Mono 600 11px `--cb-mute-soft`, uppercase, 0.8px tracking, tabular nums. |

## 8.2 Module inventory per view

The agate rail's modules differ per view but all draw from a fixed inventory:

| Module | Used on | Notes |
|---|---|---|
| Live Now | HQ Home | List of live members + their thru-score |
| Weather | HQ Home, HUD | Temp + conditions + tomorrow preview |
| Standings | HQ Home | Top 5 of current season standings |
| Tee Sheet | HQ Home | Upcoming tee times this week |
| Pull Quote | HQ Home, Scorecard, Leaderboard | Editorial pull from member quotes/comments |
| Watching | HUD | List of members currently spectating this round |
| vs. Last 5 | HUD | Comparison to member's last 5 rounds on this course |
| Streaks | HUD | Active streaks (pars in a row, fairways, birdies) |
| Course panel | HUD | Photo card + course meta (tees, yardage, weather) — different shape, see § 8.3 |
| Card Details | Scorecard | Course / tees / conditions / start / finish / pace |
| Records This Round | Scorecard | Notable round records (season low, longest streak, first eagle) |
| Comments | Scorecard | First 2-3 comments on the round post |
| Share | Scorecard | Share actions (card image, link, post to feed) |
| Closest Race | Leaderboard | Highlighted matchup between top contenders |
| Trophy Watch | Leaderboard | Per-trophy standings (stroke, net, most birdies, etc.) |
| Schedule | Leaderboard | Upcoming weeks |

## 8.3 Course panel (HUD-specific)

The HUD agate opens with a non-standard module — a course photo card:

| Element | Spec |
|---|---|
| Wrapper | `border: 1px solid var(--cb-line); border-radius: 3px; overflow: hidden; background: var(--cb-chalk);` |
| Photo | 140px tall, radial-gradient placeholder (green tones) with course name text-overlay bottom-left in Fraunces italic 24px `--cb-chalk` |
| Meta block 1 | Course name + tees + yardage + par, mono 10.5px |
| Meta block 2 | Weather chip, divided by top border | 

`[INFERENCE]` Photo is rendered as a CSS gradient placeholder in the mock; production replaces with a real course photo per CourseRef.

## 8.4 Ratification block — § 8

Accepted:
- Agate rail inventory locked to the modules in 8.2.
- Each view's agate stack is a specific ordered subset (see per-view specs).
- Course panel (HUD only) is the one structural exception.

---

# § 9 — Cards and tables

## 9.1 Generic card

```css
.card {
  background: var(--cb-chalk);
  border: 1px solid var(--cb-line);
  border-radius: 3px;
  padding: 20px;
  margin-bottom: 14px;
}
.card.live {
  border-left: 3px solid var(--cb-brass);
}
```

- Card eyebrow (`.card-eye`) is the same eyebrow spec as elsewhere — Mono 700 10.5px, uppercase, 2px tracking, `--cb-brass`. With `.pulse` (7×7 brass dot) for live cards.
- Card border-radius is **3px**, not larger. HQ does not use round corners; the small radius is a printerly nod, not a rounded-card system.

## 9.2 Stat strip

```css
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--cb-line);
  border-bottom: 1px solid var(--cb-line);
}
.stat {
  padding: 18px 16px;
  border-right: 1px solid var(--cb-line);
}
.stat:last-child { border-right: none }
```

- 4 columns on HQ Home and Leaderboard/Movers.
- 3 columns on HUD ("Round in numbers").
- Stat label (mono 10px), stat numeral (Fraunces 38px tabular), stat delta (mono 11px, color-coded: `--cb-moss` up, `--cb-claret` dn, `--cb-ink-faint` neutral).

## 9.3 Feed card

```css
.feed-card {
  background: var(--cb-chalk);
  border: 1px solid var(--cb-line);
  border-radius: 3px;
  padding: 18px 20px;
  margin-bottom: 12px;
}
```

- Row 1: `.feed-name` (Fraunces 600 18px) + optional live-dot + `.chip.live` chip · right-aligned `.feed-when` (mono 11px mute).
- Row 2: `.feed-body` (Fraunces 15.5px, line-height 1.55).
- Row 3: `.feed-meta` (Inter 13px mute, with bold counts in `--cb-ink-faint`).

## 9.4 Per-hole strip (HUD)

A horizontal 9+gap+9 grid representing front nine + back nine hole-by-hole.

```css
.strip {
  display: grid;
  grid-template-columns: repeat(9, 1fr) 12px repeat(9, 1fr);
  gap: 6px;
}
.strip-cell {
  background: var(--cb-chalk-deep);
  border: 1px solid var(--cb-line);
  border-radius: 2px;
  padding: 8px 4px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}
.strip-cell.bogey  { background: rgba(142,58,58,.10) }   /* claret tint */
.strip-cell.birdie { background: rgba(90,125,78,.16) }   /* moss tint */
.strip-cell.eagle  { background: rgba(180,137,62,.32) }  /* brass tint */
.strip-cell.cur    { border-left: 3px solid var(--cb-brass); }
.strip-cell.cur .h-score { color: var(--cb-brass); animation: pulse 1.6s ease-in-out infinite }
.strip-cell.empty  { background: transparent }
```

The 12px gap between hole 9 and hole 10 is a meaningful split — it visually separates the front and back nines. Engineering preserves the gap; do not collapse it.

## 9.5 Scorecard table

```css
.sc-table {
  border: 1px solid var(--cb-line);
  border-radius: 3px;
  overflow: hidden;
  background: var(--cb-chalk);
}
.sc-table table { width: 100%; border-collapse: collapse; font-family: var(--fm); font-size: 12px; }
.sc-table th, .sc-table td {
  padding: 11px 8px;
  border-bottom: 1px solid var(--cb-line);
  border-right: 1px solid var(--cb-line);
  text-align: center;
}
.sc-table .total      { background: var(--cb-chalk-deep); font-weight: 700; }
.sc-table .tot-grand  { background: var(--cb-ink); color: var(--cb-chalk); font-weight: 700; }
.sc-table .par-row td { background: var(--cb-chalk-deep); color: var(--cb-mute); font-size: 11px; }
.sc-table .bogey      { color: var(--cb-claret); font-weight: 600 }
.sc-table .birdie     { color: var(--cb-moss); font-weight: 600 }
.sc-table .eagle      { color: var(--cb-brass); font-weight: 700 }
.sc-table .par        { color: var(--cb-ink); font-weight: 500 }
```

- Hole columns 1–9, **Out**, 10–18, **In**, **Tot**.
- Par row + Yardage row + member rows.
- Grand total cell (`.tot-grand`) is the only fully-inked cell — `--cb-ink` fill, `--cb-chalk` text. The "the number that matters" cell.

## 9.6 Leaderboard rows

```css
.lb {
  border: 1px solid var(--cb-line);
  border-radius: 3px;
  overflow: hidden;
  background: var(--cb-chalk);
}
.lb-h, .lb-r {
  display: grid;
  grid-template-columns: 48px 1fr 90px 90px 90px;
  padding: 14px 16px;
  align-items: center;
  border-bottom: 1px solid var(--cb-line);
}
.lb-r.you { background: rgba(180,137,62,.06) }  /* brass-tint for the current user */
.lb-rank.top { color: var(--cb-brass) }
.lb-num.score.under { color: var(--cb-moss) }
.lb-num.score.over  { color: var(--cb-charcoal) }  /* NOT claret on the board — only on scorecard cells */
```

`[CONFIRMED]` Over-par scores on the leaderboard are `--cb-ink-faint` (charcoal), not `--cb-claret`. Claret is only used inside the scorecard table per-hole to highlight bogeys. The board uses claret for negative momentum but not for season totals — that distinction is intentional editorial restraint.

## 9.7 Ratification block — § 9

Accepted:
- Card / stat / feed-card / hole-strip / scorecard-table / leaderboard-row are the six structural components.
- Score color semantics: claret = per-hole bogey, moss = per-hole birdie or under-par total, brass = per-hole eagle.
- Charcoal (`--cb-ink-faint`) for over-par leaderboard totals.

---

# § 10 — Pull quote

```css
.pull {
  border-top: 6px double var(--cb-brass);
  border-bottom: 6px double var(--cb-brass);
  padding: 36px 0;
  margin: 32px 0;
  text-align: center;
}
.pull p {
  font-family: var(--fd);
  font-size: 32px;
  font-weight: 500;
  font-style: italic;
  line-height: 1.3;
  letter-spacing: -0.02em;
  max-width: 780px;
  margin: 0 auto;
}
.pull p::before, .pull p::after {
  content: '"';
  color: var(--cb-brass);
  font-weight: 600;
  margin: 0 4px;
}
```

- The pull quote is the **most editorial element** on HQ. One per view at most.
- Quotes are pulled from member content — round notes, comments, masthead copy. Founder approves which pulls are surfaced.
- Brass double-rule top + bottom (matches nav signature).

## 10.1 Ratification block — § 10

Accepted: pull quote spec, ≤1 per view, Founder-approved content.

---

# § 11 — Banner strips

Two banner patterns:

## 11.1 LIVE banner (HQ Home only)

Appears below masthead when at least one league member has a live round in progress.

```css
.banner {
  margin: 18px 0 0;
  padding: 14px 18px;
  border: 1px solid var(--cb-line);
  border-left: 3px solid var(--cb-brass);
  background: var(--cb-chalk-deep);
  border-radius: 2px;
}
```

| Element | Spec |
|---|---|
| Eyebrow | Mono 700 10px, uppercase, 2px tracking, `--cb-brass`, label: `LIVE` |
| Text | Fraunces italic 15px `--cb-ink-soft`, with the member name in `<b>` Fraunces 600 non-italic |
| CTA | Mono 700 10.5px, uppercase, 1.8px tracking, `--cb-brass`, 1.5px brass underline — label: `Watch →` |

Hides when no live rounds. If multiple live rounds, banner text rotates (Wave 4) or shows the most recent (Wave 3).

## 11.2 NOTICE strip (in-section)

A thin notice that sits inside a section (used in Scorecard).

```css
.notice {
  padding: 8px 14px;
  background: rgba(180,137,62,.08);
  border-left: 2px solid var(--cb-brass);
  font-family: var(--fm);
  font-size: 10.5px;
  color: var(--cb-ink-faint);
  letter-spacing: 1.2px;
  text-transform: uppercase;
  font-weight: 600;
}
```

For round summary lines, fine-print notes, scoring caveats.

## 11.3 Ratification block — § 11

Accepted: two banner patterns, one at view level (LIVE on Home), one inline (NOTICE inside sections).

---

# § 12 — Motion

HQ motion is **restrained**. The newspaper analogy: a paper doesn't animate. The only motion on HQ is the live-pulse signal.

| Motion | Token | Use |
|---|---|---|
| `pulse` keyframe | 1.6s ease-in-out infinite, opacity 0.55→1, scale 0.85→1.15 | Live dots, live numerals (current-hole score in HUD strip) |
| Hover transitions | 150ms ease | Nav link underline, button background fades |
| Page transitions | None | Tabs swap content instantly (`scroll-behavior: instant`) |
| Number rolls | None | Scores update by replacement, not by ticker. The newspaper does not animate numerals. |

The pulse keyframe is the **only ambient animation** on the entire HQ surface. Engineering must not add page-load animations, parallax, marquees, or auto-scrolling tickers. The agate is static.

## 12.1 Ratification block — § 12

Accepted:
- One ambient animation (pulse) for live signal only.
- No page transitions, no auto-scroll, no animated counters.
- All other motion is hover/press feedback at 150ms.

---

# § 13 — Accessibility

| Requirement | Standard |
|---|---|
| Contrast | All body text passes AA. `--cb-brass` on `--cb-chalk` is large-text-only (3.1:1); use `--cb-brass-deep` for body. |
| Focus | All interactive elements show 2px `--cb-brass` outline + 2px offset. |
| Keyboard | Tab order: nav → sub-tabs → scope tabs → main column linearly → agate column linearly → footer. |
| Tabular numerals | All score/stat/table cells use `font-variant-numeric: tabular-nums` to prevent column shift. |
| Live regions | LIVE banner + agate "Live Now" list have `aria-live="polite"`. The HUD score numeral has `aria-live="polite"`. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables the pulse animation; live dots become solid brass dots. |
| Skip link | "Skip to main" link, visually hidden until focused, jumps past the nav to `<main>`. |

## 13.1 Ratification block — § 13

Accepted: AA contrast minimum, pulse honors reduced-motion, focus rings on all interactive elements, skip link present.

---

# § 14 — Footer

```css
footer {
  background: var(--cb-felt);
  color: var(--cb-chalk);
  padding: 28px 0;
  border-top: 6px double var(--cb-brass);
  margin-top: 36px;
}
```

| Slot | Content |
|---|---|
| Left | Fraunces italic 500 18px `--cb-chalk` — "Parbaughs" wordmark |
| Center | Mono 10px 2.5px tracking `--cb-mute-faint` — "HQ · v9.0 · Clubhouse · York, PA · Est. 2026" |
| Right | Mono 10px `--cb-mute-faint` — Tagline "Saturday Sports Section, every week." |

The footer is the visual bookend to the top nav — same felt, same brass double-rule (flipped, top this time), same restraint.

## 14.1 Ratification block — § 14

Accepted: 3-column footer; brass double-rule top; felt background; wordmark + meta + tagline.

---

# § 15 — Implementation order

Recommended order for engineering agents implementing HQ desktop (Wave 4 — comes **after** mobile Wave 3 ships):

1. **HQ.S0 — Foundation:** tokens, type, layout grid, top nav, footer. Build a single empty page that loads with the right chrome.
2. **HQ.S1 — HQ Home:** the most-used view. Masthead → banner → scope → main (live card + stat strip + feed) + agate (live now + weather + standings + tee sheet + pull). See `CLUBHOUSE_SPEC-HQ-3a-Home.md`.
3. **HQ.S2 — Leaderboard:** static data, no live state. Build the table component reusable across views. See `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md`.
4. **HQ.S3 — Scorecard:** introduces the table component for hole-by-hole. Static when complete; live mode in HUD reuses pieces. See `CLUBHOUSE_SPEC-HQ-3c-Scorecard.md`.
5. **HQ.S4 — Spectator HUD:** the live view. Reuses scope rail, hole strip, agate. The most data-dense and the only view with real-time updates. See `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md`.
6. **HQ.S5 — Polish + a11y pass:** focus rings, reduced motion, axe audit, RTL/i18n review (English-only Wave 4, but text expansion testing).

## 15.1 Ratification block — § 15

Accepted: implementation order Home → Leaderboard → Scorecard → HUD → polish. HUD is last because it has the most real-time complexity and benefits from reusing components built in prior ships.

---

# § 16 — Open gaps for Founder

| Gap | What |
|---|---|
| G1 | Token additions (`--cb-ink-soft`, `--cb-ink-faint`, `--cb-mute-soft`, `--cb-mute-faint`, `--cb-claret`, `--cb-moss`) — fold into mobile § 1 or keep HQ-local? |
| G2 | Search command-K palette — defer to Wave 4 polish ship? |
| G3 | Notifications popover — same? |
| G4 | Avatar menu — same? |
| G5 | Network scope content — Wave 4 unlock or grey-out in Wave 3? |
| G6 | Tab switcher in production: routes or in-page tabs? Spec accepts either; Founder picks. |
| G7 | Course photo source — Pexels API, course-club provided, or hand-curated for the 5 starter courses? |

`[GAP]` Each of these is a hold-for-Founder decision before the Part 2 per-view specs are fully implementable. Per-view specs proceed with reasonable defaults and `[GAP]` markers where Founder input is pending.

---

**End of Part 1.**
Continue to per-view specs: 3a Home → 3b HUD → 3c Scorecard → 3d Leaderboard.
