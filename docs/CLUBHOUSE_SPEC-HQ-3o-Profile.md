# CLUBHOUSE_SPEC-HQ — Part 2, View 3o: Profile Redesign

> **Status:** Tier 3 deliverable. All [GAP] questions pre-answered by Founder ratification (TIER2-4_DESIGN_BOT_BRIEF.md).
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. Profile composition is net-new; reuses member-row primitives from 3e Members and round-card primitives from 3c Scorecard.
> **Ship:** W4.I5 — Profile redesign + identity surface integration.
> **Scope:** Member profile page, public + authenticated viewer modes, own-profile edit affordances.

---

## 0 — View scope

The profile is the member's identity surface — country-club portrait feel. Title badge above name (if earned), championship badges below, stats and history stacked. Public-by-default per locked monetization model (memory #28); URL stable across username changes via UUID-canonical routing per W4.I4.

States covered:
- **3o.1** — Default (authenticated viewer, other member's profile, populated history)
- **3o.2** — Own profile (authenticated viewer, self)
- **3o.3** — Public viewer (unauthenticated visitor to a public profile)
- **3o.4** — Empty profile (member's first 24h post-onboarding, no rounds/Chips)
- **3o.5** — Profile sheet edit flow (in-sheet edit from M6 mobile pattern + side-panel-edit desktop equivalent)

---

# § 3o.1 — Default state

## 3o.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Tab switcher | `--tabs-h` | (No tab — profile is a deep destination, not a primary nav) |
| Masthead | ~220px (hero scaled larger — profile IS the portrait) | See 3o.1.3 |
| Two-column body | flex | Main = stacked sections; agate = mini-card "what they're playing" + mutual friends |
| Footer | per Part 1 § 14 |

## 3o.1.2 URL / route

Primary: `/m/<uuid>` per W4.I4 lock — UUID is stable across username changes.

Short-link redirect: `parbaughs.com/@<username>#<discriminator>` → Cloud Function lookup → redirect to `/m/<uuid>`. Share targets get the UUID-based URL.

## 3o.1.3 Masthead — the portrait

| Element | Spec |
|---|---|
| Title badge (if earned) | Above name, mono 11px brass uppercase 1.8px tracking — e.g. `IRON SCHEDULE CHAMPION` or `THE PARBAUGHS · COMMISSIONER` |
| H1 — username | Fraunces 80px italic ink — e.g. `Mr Parbaugh.` (display name from `members/{id}.display-name`) |
| Sub — handle | Fraunces 18px mute-soft mono italic — `@parbaugh#0001` |
| Championship badges | Below sub, inline SVG row per CHAMPIONS_MARK_SPEC.md — 24px height each, max 6 visible + `+N` mono chip |
| Member-since | Mono 11px mute-soft 1.5px tracking — `MEMBER SINCE APR 2024` |
| Action row | Right-aligned cluster of CTAs — varies by viewer mode (see 3o.1.4) |

Masthead background: `--cb-chalk-deep` with hairline `--cb-line` bottom border. NOT `--cb-felt` — felt is reserved for chrome (top nav, footer) not for content surfaces.

## 3o.1.4 Action row (right-aligned in masthead)

Cluster of action buttons. Varies by viewer:

| Viewer | Buttons |
|---|---|
| Other member, no friend relationship | `Add friend +` brass pill + `Follow →` mute outline + `Send DM →` mute outline + `⋮` overflow (Share profile, Mention, Block, Report) |
| Other member, friends | `Friends ✓` mute chip + `Following ✓` mute chip + `Send DM →` brass + `⋮` overflow |
| Other member, friend request sent | `Request sent` mute chip + `Following`/`Follow` + `Send DM` + overflow |
| Other member, friend request received | `Accept →` brass + `Decline` mute text-link + `Send DM` + overflow |
| Own profile | `Edit profile →` brass pill + `Share profile →` mute outline + `Settings →` mute outline |

## 3o.1.5 Scope rail

| Control | Spec |
|---|---|
| Section anchors | `Stats · Chips · Rounds · Trophies · About` mono 11px 1.5px tracking. Smooth-scroll to anchor. |
| Right-aligned meta | `Last active {time} ago` mono 10.5px mute-soft (privacy-aware — hidden if viewer is not friend + member's privacy setting is `League only`) |

## 3o.1.6 Main column — stacked sections

### Section A — Stats summary (anchor `#stats`)

5-column stat strip per HQ Part 1 § 9.2:

| Stat | Format | Source |
|---|---|---|
| Handicap | `12.4` Fraunces 38px tabular | `members/{id}.handicap-index` |
| Rounds (season) | `47` | `rounds/*` count filtered to current season |
| Best round | `74` + course footnote | `rounds/*` lowest gross |
| Season standing | `T-3` + league name footnote | Computed from Leaderboard |
| Wins | `8` Parcoin wagers + footnote | `wagers/*` won-by this member |

### Section B — Chip post history (anchor `#chips`)

Reverse-chrono Chip feed scoped to this member. Reuses Chip card from 3k Feed.

Pagination: 10 initial + `Show more →` paginated 10 at a time.

Per-card: tap → opens that Chip with reply chain inline.

### Section C — Round history (anchor `#rounds`)

Last 5 finalized rounds — reuses Round summary card from 3c Scorecard at compact density.

Each card: course + date + score + score-to-par + format. Tap → full Scorecard (3c).

Footer: `View all {N} rounds →` brass link routes to Round History (M4 mobile equivalent / extended URL `/m/<uuid>/rounds` on HQ desktop).

### Section D — Championships (anchor `#trophies`)

Grid of earned trophies per CHAMPIONS_MARK_SPEC.md emblems. Each: SVG emblem + trophy name + earned-date.

Empty state: editorial — `No trophies yet. Plenty of season left.` mute italic Fraunces 18px.

Sort: most-recently-earned first. Tap any trophy → Trophy Room (3p) scoped to that trophy + member.

### Section E — Friends + Following count (anchor implicit, no dedicated anchor)

Inline 2-stat row below trophies:

| Stat | Format |
|---|---|
| Friends | `{N} friends` brass link → opens friends modal with searchable list |
| Following | `{N} following · {N} followers` mute link → opens followers/following modal |

### Section F — About

Bio text (Fraunces italic 17px ink). Empty state: italic mute `No bio yet.` (own profile shows `Add a bio →` brass link inline).

## 3o.1.7 Agate rail (right column)

| # | Module | Content |
|---|---|---|
| 1 | **What they're playing** | Mini-card: current handicap + most-recent course + last round score + date. Updates when member finalizes a round. |
| 2 | **Mutual friends** | If viewer is authenticated and has overlap with this member: list of 3-5 mutual friends with avatars. Hidden if no mutuals OR viewer is unauthenticated. |
| 3 | **Pull quote** | Member's most-kudoed Chip body in italic — gag highlight (`[ORCHESTRATION TEAM DECISION]` — quote-selection algorithm picked via decision-bubble at W4.I5 retrospective; industry-standard pattern locked at that point) |

## 3o.1.8 Cross-surface dependencies

| Reads | Writes |
|---|---|
| `members/{id}` (full doc) | None on view (read-only display) |
| `rounds/{*}` filtered to member | |
| `feed-posts/{*}` filtered to member | |
| `trophies/{id}` | |
| `friendships/{*}` for mutual count + status | |
| `following/{*}` for following relationships (Wave 4) | |

---

# § 3o.2 — Own profile state

Same frame; action row swaps per 3o.1.4. `Edit profile →` brass pill in masthead opens Profile sheet edit flow (3o.5).

Additional own-profile affordances:

- Inline `Add a bio →` on empty Bio section
- Inline `Set a home course →` brass link in Stats summary if `home-course` field empty
- Stats section shows additional "Earnings" stat (lifetime Parcoin earned — gag highlight)

Privacy: own profile renders all fields regardless of `activity-visibility` privacy setting (viewer sees their own private state too).

---

# § 3o.3 — Public viewer state

Unauthenticated visitor.

| Change vs 3o.1 |
|---|
| Top nav shows `Sign up →` brass pill instead of avatar cluster |
| Action row: only `Sign up to connect` text-link + `Share profile →` |
| Sections render but cross-surface drill-ins (round detail, Chip thread, trophy detail) prompt sign-in modal on tap |
| Agate `Mutual friends` module hides entirely |
| `Last active` meta hides if member's privacy is `League only` (default) |
| Activity surfaces respect `activity-visibility: League only` (default per 3h.1.5) — Chip post history and round history hide if member has `League only` set; visible only if member opted to `Public` |
| Above Masthead: signup CTA strip — `Sign up to follow {memberName} and post your own rounds.` chalk-deep background, dismissible per-session |

Privacy boundary (what's always public per locked monetization model):
- Title badge, username, discriminator
- Championship badges
- Handicap
- Bio
- Member-since date
- Friends count (not the list — count only)

Privacy boundary (authenticated-only):
- Detailed round scorecards (links to W2.S3 Scorecard view)
- DM affordance
- Mention affordance
- "What they're playing" agate module
- Mutual friends list

---

# § 3o.4 — Empty profile state

Member's first 24h post-onboarding with 0 rounds + 0 Chips.

| Section | State |
|---|---|
| Masthead | Renders normally; no title badge (none earned); no championship badges |
| Stats summary | Numerals render as `—` em-dash; "Handicap pending — 5 more rounds" footnote on Handicap stat |
| Chip post history | Empty editorial — `No Chips yet.` mute italic + `Post first Chip →` brass link (own profile only) |
| Round history | Empty editorial — `No rounds logged.` mute italic + `Log first round →` brass link (own profile only) |
| Championships | Empty editorial — `Trophies appear when earned.` mute italic |
| Friends/Following | Renders 0 counts |
| About / Bio | Empty + `Add a bio →` brass link (own profile only) |

Agate rail: `What they're playing` shows empty editorial `Hasn't played yet`; `Mutual friends` hides; pull quote module hides.

---

# § 3o.5 — Edit flow

Triggered from own-profile `Edit profile →` CTA in masthead.

Mobile: Profile sheet pattern from M6 (88% viewport bottom sheet with drag-to-dismiss).

Desktop: Side-panel-edit — slides in from right, 480px wide, brass 4px left border, `--cb-chalk` background. Overlays masthead and main column; agate rail dimmed via `--cb-felt` 30% scrim.

## 3o.5.1 Edit fields

| Field | Type | Notes |
|---|---|---|
| Username | Text + discriminator | Subject to 7-day cooldown per W4.I4. See 3h.3 username change flow. |
| Display name | Text 60 char | Editable anytime |
| Bio | Textarea 280 char | Fraunces italic preview below field |
| Avatar | Upload + preview | Same as 3n.2 onboarding upload spec |
| Home course | Autocomplete dropdown | Sources `courses/*` |
| Tee preference | Per-course preferred tee box | Multi-row table |
| Title display preferences | Multi-select toggle | Which earned titles surface in condensed contexts (e.g., username + title display in Chip cards) |

## 3o.5.2 Save behavior

- Save button: brass pill bottom-right of panel — `Save changes →`
- Disabled until any field is dirty (changed from initial state)
- On save: writes affected fields, panel closes with success haptic + toast, profile re-renders with new values
- Cancel: text-link top-left + ESC + click-outside — confirm dialog if dirty

---

# § 3o.6 — Accessibility

- Masthead: `<header role="banner">` with `aria-label="Profile of {displayName}, @{username}#{discriminator}"`.
- Title badge: `aria-label="Earned title: {titleName}"`.
- Championship badges: each `aria-label` describing the championship.
- Action row buttons: clear `aria-label` per state (e.g., `aria-label="Add Mr Parbaugh as a friend"`).
- Sections: each `<section role="region" aria-labelledby>`.
- Stats: `<dl>` with `<dt>` (label) + `<dd>` (value) for semantic stat grouping.
- Edit panel: focus trap + ESC dismisses + focus restores to trigger.
- Privacy-gated fields: not in DOM when hidden (no `aria-hidden` masking — fully omitted).

---

# § 3o.7 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (avatar background + edit-panel scrim)
- Text: full ink + mute family
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft`
- Status: `--cb-claret` (rare — destructive confirm), `--cb-moss` (alternate for stat highlights)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (scaled to 80px), `--type-sec-hq`, `--type-display-hq`, `--type-body-hq`, `--type-stat`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`, `--type-ui-hq`

No new tokens.

---

# § 3o.8 — Ratification block

Accepted:
- Profile is `/m/<uuid>` URL with short-link redirect from `parbaughs.com/@<username>#<discriminator>`.
- 6 main sections + 3 agate modules + masthead portrait.
- Title badge above name (when earned); championship badges below; Fraunces 80px username — country-club portrait feel.
- Public viewer respects per-locked privacy boundary (handicap + championships always public; rounds + Chips per member's `activity-visibility`).
- Edit flow uses Profile sheet on mobile + side-panel-edit on desktop.
- Following toggle distinct from friend system (Wave 4 feature).
- All [GAP] questions pre-answered.

`[ORCHESTRATION TEAM DECISION]` Pull-quote selection algorithm: orchestration team selects industry-standard pattern via decision-bubble at W4.I5 implementation retrospective. Not a design-bot decision; cost and behavior tradeoffs belong at orchestration layer.
