# CLUBHOUSE_SPEC-HQ — Part 2, View 3j: League v1

> **Status:** Tier 2 deliverable. All [GAP] questions pre-answered by Founder ratification 2026-05-12 (TIER2-4_DESIGN_BOT_BRIEF.md).
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. League hero + roster table + Leaderboard section are net-new compositions reusing the Members table (W1.S3) + scorecard-table component (W2.S3).
> **Ship:** W1.S13 — Courses + Leagues + More.
> **Scope:** League page (single league context), My Leagues directory, multi-league scope switcher, Lone Wolf empty-league state. Standalone Leaderboard COLLAPSES into League page per inventory recommendation.

---

## 0 — View scope

Three related surfaces, ratified as a bundle in W1.S13:

- **3j.1** — League page (`/league/<leagueId>`) — the "homepage" for a single league
- **3j.2** — My Leagues (`/my-leagues`) — card grid of leagues the viewer belongs to (renders only when N ≥ 2)
- **3j.3** — League scope switcher — dropdown overlay from masthead league chip

States covered:
- 3j.1.A — Default League page (Commissioner OR member viewing, ≥1 round posted)
- 3j.1.B — Empty league (Commissioner-only state, no rounds posted yet)
- 3j.1.C — Public viewer (unauthenticated, public-league surface)
- 3j.1.D — Lone Wolf (member with 0 leagues — landing surface)
- 3j.2.A — Multi-league member (≥2 leagues)
- 3j.3.A — Switcher dropdown (any viewer with ≥1 league)

---

# § 3j.1 — League page

## 3j.1.A Default state

### Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Tab switcher | `--tabs-h` | "League" tab active when viewing inside league context |
| Masthead | ~180px (editorial — league IS a publication) | See 3j.1.A.3 |
| Scope rail | `--scope-h` | League-specific filters + Commissioner Settings affordance |
| Two-column body | flex | Main = stacked sections; agate = league-specific rail modules |
| Footer | per Part 1 § 14 |

### 3j.1.A.1 Banner

Same banner pattern as HQ Home (3a) but scoped to this league only — `LIVE` eyebrow + name + score + course, links to that member's Spectator HUD. Hides when no live round in this league.

### 3j.1.A.2 Masthead

- **Eyebrow:** `LEAGUE · {LocationCity, State} · {FoundedYear}` — e.g. `League · York, PA · Founded 2024`
- **H1:** Fraunces 64px italic — `{LeagueName}.` — e.g. `The Parbaughs.`
- **Sub-deck:** Fraunces 18px italic mute-soft — Founder-curated tagline (locked at League creation in W1.S14 onboarding) or default `{N} members · {N} rounds posted · {SeasonName} season`
- **Commissioner Settings affordance:** brass pill `Settings →` right-aligned next to H1, visible **only to Commissioner**. Routes to Admin → League settings panel (3i).

### 3j.1.A.3 Scope rail

| Control | Spec |
|---|---|
| Section anchors | `Roster · Standings · Activity · Trophies · About` — mono 11px 1.5px tracking. Smooth-scroll to anchor on tap. |
| Meta string right | `{N} members · {N} rounds this season` mono 10.5px mute-soft |

### 3j.1.A.4 Main column — stacked sections

**Section A — League hero card** (top of main column)

| Element | Spec |
|---|---|
| Card | Brass-double-rule top + bottom borders per HQ Part 1 § 6, `--cb-chalk-deep` background, full-width |
| Content | Commissioner name + avatar (small), Season name, Member count, Rounds-this-season count, Average handicap, Founded date |
| Layout | 5-column stat strip per Part 1 § 9.2; brass eyebrows above each stat |

**Section B — Roster** (anchor `#roster`)

Reuses Members table component from 3e Members directory. Filtered to this league. Same row composition. Search/sort controls inline in section header rather than scope rail (since this is a section, not a full directory view).

**Section C — Standings** (anchor `#standings`) — the Leaderboard collapse

Reuses the Leaderboard table component from `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` per Tier 2 brief — Standings is one of the League page's sections, NOT a separate route.

Section header: `Season standings` Fraunces 30px + meta right `As of {Date}`. Body: full Leaderboard table with movers strip per 3d.

**Section D — Activity** (anchor `#activity`)

Reverse-chrono feed of posted rounds + chips scoped to this league. Reuses Feed v2 cards (3k). Shows last 10 + `View all activity →` link to Feed (Feed scope auto-locks to this league).

**Section E — Trophies** (anchor `#trophies`)

Trophy showcase: brass-bordered grid of league-scoped trophy emblems per CHAMPIONS_MARK_SPEC.md, with earned-by attribution per trophy. Sorts by most-recently-earned. Tap any trophy → Trophy Room (3p) scoped to that trophy.

**Section F — About** (anchor `#about`)

Founder-curated copy block (set at league creation in W1.S14, editable from Admin). Fraunces 15.5px ink. League description, founding story, rules, courses played.

### 3j.1.A.5 Agate rail

| # | Module | Content |
|---|---|---|
| 1 | **Live Now** | Per HQ Part 1 § 8 — scoped to this league |
| 2 | **Tee sheet** | Upcoming events from Calendar (3f) scoped to this league, next 5 |
| 3 | **Recent trophies** | 3 most-recently-earned trophies in this league |
| 4 | **Pull quote** | Founder-curated copy — league motto or season message |

### 3j.1.A.6 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `leagues/{leagueId}` (full doc) | None — League page is read-only display |
| `members/{leagueId}/*` (roster) | |
| `rounds/{leagueId}/*` (activity) | |
| `events/{leagueId}/*` (tee sheet) | |
| `trophies/{leagueId}/*` | |
| `members/{viewerId}.role-in-leagues[{leagueId}]` (Commissioner affordance) | |

## 3j.1.B Empty league state

Commissioner has created the league but no rounds posted yet.

Sections B, C, D, E render empty-state editorial copy:

- **Roster:** Just the Commissioner. Editorial nudge: `Invite a member →` (brass) routes to Admin → Members → Invite.
- **Standings:** Empty editorial — `Season hasn't started talking yet. Standings appear after the first round.`
- **Activity:** Centered empty per HQ Part 1 § 13 — `Quiet on the course.` + `Be the first → Log a round` brass CTA.
- **Trophies:** Empty — `Trophies appear as members earn them.` No CTA (trophies are earned, not authored).

Agate rail hides Live Now + Recent trophies; keeps Tee sheet + Pull quote.

## 3j.1.C Public viewer state

Unauthenticated visitor to a public league page (per locked monetization — leagues with `privacy: public` setting from 3i.1.6 are crawlable).

| Change vs default |
|---|
| Top nav shows `Sign up →` brass pill instead of avatar cluster |
| Commissioner Settings affordance hidden |
| Roster section: same member table BUT action column hidden (no friend-add for unauthenticated) |
| Activity section: posted round summaries visible; tap-through to round detail prompts sign-in |
| Trophies fully visible |
| Above League hero card: signup CTA strip — `Join the platform to follow this league and post your own rounds. Sign up →` — chalk-deep background, dismissible per-session |

## 3j.1.D Lone Wolf state

Member has 0 leagues. Visits `/league/...` (e.g. browsing a public league) OR lands on a default state where league context is empty.

Rendered as a takeover surface (no scope rail — viewer has nothing to scope):

- **Masthead:** `LONE WOLF` eyebrow + `Find your league.` H1 (Fraunces 64px)
- **Three equal-weight cards** (NOT subtle UX nudge toward any one):
  - Card 1: `Create your league` — H3 brass + body copy + `Continue →` CTA
  - Card 2: `Join a league` — H3 + body + CTA
  - Card 3: `Browse public leagues` — H3 + body + CTA
- Per locked W1.S14 Vision: lone wolf path equal fidelity to league-joining

---

# § 3j.2 — My Leagues page

Renders only when viewer has ≥2 leagues. Route: `/my-leagues`.

## 3j.2.A Default state

### Frame

Standard masthead chrome. Main column = card grid (no agate rail).

### Masthead

- Eyebrow: `YOUR LEAGUES · {N} active`
- H1: `My leagues.` (Fraunces 56px italic)

### Card grid

Responsive grid: 2 cols at standard band, 3 cols at cinema band.

| Element | Spec |
|---|---|
| Card | `--cb-chalk-deep` background, `--radius-md` (14px), `--space-5` padding, 1px `--cb-line` border |
| Active-league indicator | 4px `--cb-brass` top border on the currently-active scope league |
| Header | League name (Fraunces 24px italic ink) + role pill (`Commissioner` brass outline / `Member` mute outline) |
| Stats | 3-stat strip: member count, rounds this season, viewer's standing |
| Footer | `Last activity {time} ago` mono 11px mute + `Open →` brass link |

Below card grid: `+ Browse public leagues →` brass link.

### 3j.2.A Cross-surface dependencies

Reads: `members/{viewerId}.leagues[]`, `leagues/{leagueId}` for each (basic info + member's role + viewer's standing).

---

# § 3j.3 — League scope switcher

Triggered from masthead league chip (with chevron) when viewer has ≥1 league. The chip OPENS a dropdown — it does NOT navigate to League page (that's a separate affordance via tapping the league name inside the switcher).

### 3j.3.A Switcher dropdown

| Element | Spec |
|---|---|
| Trigger | Masthead league chip (HQ Part 1 § 4.3) + chevron when N ≥ 1 |
| Overlay | Absolute-positioned dropdown below chip, 320px wide, `--cb-chalk-deep` background, `--shadow-md`, `--radius-md`, 1px `--cb-line` border |
| Header | `YOUR SCOPE` mono 10.5px brass, `--space-3` padding |
| League rows | One per league member belongs to. Active league: brass left-border 3px. Hover: chalk-deep tint. Row content: name + member count + role pill + chevron right. |
| Footer items | `Browse public leagues →` brass link + `Create a new league →` brass link |
| `My Leagues` link | Bottom of dropdown, visible only when N ≥ 2: `My Leagues →` (routes to 3j.2) |

Tap behavior:

- Tap a league row → switches scope across platform (Feed filters, Calendar filters, Stats scope all reset) AND navigates to that League page (3j.1)
- Tap `Browse public leagues` → public leagues directory
- Tap `Create a new league` → opens new-league flow per W1.S14
- Tap `My Leagues` → routes to 3j.2

Dropdown dismisses on: click outside, ESC, scope-change-completed.

---

# § 3j.4 — Accessibility

- Section anchors: real `<a href="#anchor">` links with smooth-scroll honoring `prefers-reduced-motion`.
- Commissioner Settings affordance: `role="button"`, `aria-label="League settings (Commissioner only)"`.
- League hero card: `role="region"`, `aria-labelledby` pointing to league name.
- Switcher dropdown: `role="menu"`, escape-key dismisses + focus returns to trigger.
- My Leagues card grid: `<ul role="list">` with `<li role="listitem">`; each card is `<a>` for keyboard nav.
- Active-league indicator: `aria-current="page"` on the matching card OR switcher row.

---

# § 3j.5 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (avatars + masthead overlay only)
- Text: `--cb-ink`, `--cb-ink-soft`, `--cb-mute`, `--cb-mute-soft`, `--cb-mute-faint`
- Accent: `--cb-brass`, `--cb-brass-deep`
- Lines: `--cb-line`
- Type: `--type-mast-hq` (scaled to 64px), `--type-sec-hq`, `--type-display-hq`, `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3j.6 — Ratification block

Accepted:
- League page bundles 6 sections (Hero + Roster + Standings + Activity + Trophies + About) at `/league/<leagueId>`.
- Standalone Leaderboard collapses into League page Standings section; W2.S2 ship focuses on reusable table component consumed by League page + Scorecard (3c) + Spectator HUD (3b).
- League chip opens switcher dropdown (NOT direct navigation to League page).
- Lone Wolf surface has 3 equal-weight path cards (Create / Join / Browse).
- My Leagues page renders only when N ≥ 2; card grid layout.
- Public viewer surface respects monetization model — public-league pages are crawlable with signup CTA.
- All [GAP] questions pre-answered in TIER2-4_DESIGN_BOT_BRIEF.md.
