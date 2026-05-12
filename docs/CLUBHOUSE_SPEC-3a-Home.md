# CLUBHOUSE_SPEC — Part 2, Sub-pass 3a: Home Tab

> **Status:** Awaiting Founder ratification. Subordinate to Part 1 (`docs/CLUBHOUSE_SPEC.md`).
> **Folded into final CLUBHOUSE_SPEC.md at Part 2 § 3a after ratification.**
> **Pass:** 3a of 4 (3a Home → 3b Play → 3c Feed → 3d Stats → 3e More → Part 3 implementation).
> **Scope:** 3 Home-tab screens, all states. No other tabs.

---

## 0 — Sub-pass scope

Three screens spec'd here:

- **3a.1 — Home (Today) default**
- **3a.2 — Home — Empty / first-time / new-member states**
- **3a.3 — Home — Active-round override state**

Every screen below clears all 12 rejection criteria. Token names cite Part 1; no new tokens introduced. Cross-surface dependencies declared per Criterion 12.

---

# Screen 3a.1 — Home (Today) — Default

## 3a.1.1 Purpose

The launch surface. Members open the app and land here. Anchors identity (greeting + masthead), surfaces the next action (start round / continue / view active), shows headline stats at a glance, and previews League Pulse + League Chat as social anchors.

## 3a.1.2 Frame composition (top to bottom)

| Slot | Token / Spec | Notes |
|---|---|---|
| Safe-area top | `env(safe-area-inset-top)` | iOS notch / dynamic island |
| Masthead | `--masthead-h` (76px incl. safe-area) | Persistent across Home + most screens |
| Banner slot | 0px when inactive; `--shadow-3` when CRISIS active | Renders below masthead; pushes content down |
| Scroll container | flex 1 | Holds page content |
| Tab bar | `--tabbar-h` (84px incl. safe-area) | Persistent |
| Safe-area bottom | `env(safe-area-inset-bottom)` | Home indicator |

Scroll behavior: vertical scroll only. Pull-to-refresh enabled (motion per § 4.4). Edge-swipe-back disabled (Home is root).

## 3a.1.3 Masthead component

| Element | Position | Token | Content |
|---|---|---|---|
| Avatar (member) | Left, 36×36, `--radius-pill` | Background `--cb-brass-soft`; ring 1px `--cb-brass-faint`; XP-pip overlay bottom-right | Tap → opens Profile bottom sheet (You surface; replaces "You" tab) |
| Avatar pip | Bottom-right of avatar, 14×14 | `--cb-felt` fill, `--cb-chalk` numeral, `--type-label` size 9px override | XP level number |
| Greeting line | Left of icons | `--type-body` size 15px sans, `--cb-mute` for "Hi," + `--cb-ink` for member name | "Hi, **Mr Parbaugh**" — name is the tappable target (same as avatar) |
| Greeting underline | Under member name, 1px | `--cb-brass-soft` | Quiet emphasis on identity tap target |
| Notification icon | Icon row right, 28×28 hit padded to 48 | Stroke `--cb-ink`, fill on press `--cb-brass-soft` | Bell glyph. Badge: 16×16 pill `--cb-brass`, `--cb-chalk` numeral. |
| Messages icon | Right of notification | Same spec | Chat glyph. Badge shared between DMs + League Chat (per Pass 1 § 4.3). |
| Calendar icon | Right of messages | Same spec | Tap → Calendar screen (in More for Wave 3 mobile, until Events surfaces). |
| Settings icon | Right of calendar | Same spec | Tap → Settings (in More). |

Masthead background: `--bg` with 1px bottom border `--cb-line`. Under scroll, border becomes `--cb-brass-faint` when scrollTop > 0 (200ms fade per `--motion-quick`).

### Masthead a11y

- Greeting and avatar: same focusable target, `role="button"`, `aria-label="Open profile, Mr Parbaugh"`.
- Each icon: `aria-label`; badge has `aria-live="polite"` for count changes.
- Focus order: avatar → notification → messages → calendar → settings → first page element.

## 3a.1.4 Page header block

Vertical stack, `--space-5` page gutter, `--space-5` from masthead.

| Row | Spec |
|---|---|
| Date eyebrow | `--type-label` (11px, uppercase, 0.08em tracking), `--cb-mute`, content: `TUESDAY · MAY 12` |
| Greeting headline | `--type-display` (36px serif 600), `--cb-ink`, two-line cap, content: `Good morning, Mr Parbaugh.` |

Greeting copy varies by local time:

| Local hour | Copy |
|---|---|
| 04:00 – 11:59 | `Good morning, {firstName}.` |
| 12:00 – 16:59 | `Good afternoon, {firstName}.` |
| 17:00 – 21:59 | `Good evening, {firstName}.` |
| 22:00 – 03:59 | `Late one, {firstName}.` |

`{firstName}` is the member's display first name from `fbMemberCache`. If not set, falls back to display name. If display name missing, `Hi.` (period, no comma — terminal).

## 3a.1.5 Today's call-to-action card

The single most-important module on Home. Resolves to one of three states (own subsection in § 3a.1.9 state matrix). Default state ("no round today") spec'd here.

### Card frame

| Property | Value |
|---|---|
| Margin | `--space-5` left/right page gutter, `--space-5` above, `--space-6` below |
| Padding | `--space-5` all sides |
| Background | None (transparent) |
| Border | 1.5px dashed `--cb-felt-soft` |
| Radius | `--radius-lg` (14px) |
| Min-height | 200px |

The dashed border signals "potential" — nothing has happened yet. This is intentional visual vocabulary distinct from filled cards (which signal "this has content").

### Card contents

| Element | Token | Content |
|---|---|---|
| Eyebrow label | `--type-label`, `--cb-brass-deep` | `NO ROUND TODAY` |
| Headline | `--type-h2` (22px serif 600), `--cb-ink` | `Ready when you are.` |
| Body | `--type-body-lg` (17px sans), `--cb-mute`, max 2 lines | `Start a round and the scorecard, skins pot and your caddie will wake up.` |
| Spacing between body and CTA | `--space-5` |  |
| Primary CTA | `--cta-fill` background, `--cta-text` label, `--type-cta` (17px 600 sans), 56px height, `--radius-lg`, full width minus card padding | `▸ Start a round` |
| Flag glyph in CTA | 18×18, `currentColor` stroke 2px, position 12px left of label | Theme-aware per memory #18 |

### CTA tap behavior

- Tap → navigate to Play tab → Start Round screen (Pass 3b).
- Press feedback: scale 0.97 over 100ms `--ease-standard`, haptic light tap.
- Released: scale back to 1.0 over 150ms.

### Cross-surface consumers (Criterion 12)

- **Play tab Start Round screen** receives navigation.
- **`fbMemberCache`** consumed for greeting `{firstName}`.
- **Active round detection** queries `rounds` collection scoped to current member; if any with `status='active'` exists, this card is replaced by the active-round state (§ 3a.3).

## 3a.1.6 Headline stats row

Three equal cards, horizontal row, below CTA card.

### Row frame

| Property | Value |
|---|---|
| Margin | `--space-5` page gutter; `--space-6` below |
| Card gap | `--space-3` (12px) |
| Card flex | 1 each (equal thirds) |
| Card padding | `--space-4` (16px) |
| Card background | `--bg-sunk` (`--cb-chalk-deep`) |
| Card radius | `--radius-md` (10px) |
| Card min-height | 96px |

### Card contents (each)

| Element | Token | Notes |
|---|---|---|
| Label | `--type-label` (11px uppercase), `--cb-mute`, top-aligned | `ROUNDS` / `HCP` / `BEST` |
| Value | `--type-stat-lg` (32px serif 700, tabular-nums), `--cb-ink`, bottom-aligned | `7` / `20.9` / `94` |

### Empty / missing data

- If `value` is `null` or `0` for `BEST`: render `—` (em-dash) in `--cb-mute`.
- If `HCP` is provisional (fewer than 3 rounds logged): append a small `*` glyph after the numeral in `--cb-brass-deep`. Tap on the card opens a bottom sheet explaining provisional handicap.

### Tap behavior

- Each card is tappable: navigates to Stats tab → specific surface (`Rounds`, `Handicap detail`, `Best round detail`).
- Press feedback: scale 0.97 + `--motion-instant`, haptic light.

### Cross-surface consumers

- `rounds` collection count (rounds card).
- Member's `handicapIndex` field (HCP card).
- `bestScore` derived stat (BEST card).
- Tap navigates to **Stats tab — Round History / Handicap / Best Round** (Pass 3d).

## 3a.1.7 League Pulse module

Below the stats row. Read-only activity preview surface.

### Module frame

| Property | Value |
|---|---|
| Margin | `--space-5` page gutter; `--space-7` (32px) below |
| Header padding | `--space-4` bottom, `--space-1` top |
| List padding | 0 (rows have own padding) |

### Header row

| Element | Token | Notes |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-mute`, prefixed with league name | `THE PARBAUGHS · LEAGUE PULSE` (matches HQ pattern from prior design specs) |
| Title | `--type-h3` (18px sans 600), `--cb-ink` | `League pulse` |
| Action link right | `--type-body-sm`, `--cb-brass-deep`, with → glyph | `Full feed →` — tap to Feed tab |

### Activity card (each, repeated up to 3)

| Element | Spec | Notes |
|---|---|---|
| Card container | `--space-3` vertical padding, no horizontal padding | Border-top 1px `--cb-line` except first card |
| Avatar | 32×32, `--radius-pill`, `--cb-brass-soft` ring | Tap → that member's Activity surface |
| Type chip | `--type-label`, `--cb-brass-deep`, brass-faint background, `--radius-sm`, 4px y-pad / 8px x-pad | `ROUND` / `KUDOS` / `AWARD` / `ACE` |
| Headline | `--type-body` (15px sans), `--cb-ink`, max 2 lines wrap-pretty | `Mr Parbaugh logged 98 at Ocean Pines Golf & Country Club` |
| Sub-line | `--type-body-sm`, `--cb-mute` | `18 holes · Stroke` |
| Timestamp right | `--type-body-sm`, `--cb-mute` | `1w` |
| Action row | Tap targets `KUDOS` + `COMMENT` icon buttons, 48×48 hit area | Same spec as HQ from prior work |

### List behavior

- Up to 3 rows shown by default.
- "Full feed →" navigates to Feed tab → Pulse sub-view (Pass 3c).
- Tap any row → Activity detail screen.
- No infinite scroll; that's Feed's job.

### Cross-surface consumers

- `activity` collection, league-scoped, ordered by `createdAt desc`, limit 3.
- `fbMemberCache` for avatar + display name.
- Navigates to **Feed tab Pulse sub-view** (Pass 3c) and **Activity detail** (Pass 3c).

## 3a.1.8 League Chat preview module

Below League Pulse. Symmetric with Pulse — same component family, different content.

### Header row

| Element | Token | Notes |
|---|---|---|
| Eyebrow | `--type-label`, `--cb-mute` | `THE PARBAUGHS · CHAT` |
| Title | `--type-h3`, `--cb-ink` | `League chat` |
| Action link | `--type-body-sm`, `--cb-brass-deep` | `Open chat →` |

### Message row (each, up to 3 latest)

| Element | Spec | Notes |
|---|---|---|
| Avatar | 28×28, `--radius-pill` | Smaller than Pulse — chat is denser |
| Sender name | `--type-body` 15px 600 sans, `--cb-ink` | First name only |
| Timestamp | `--type-body-sm`, `--cb-mute`, inline after name | `· 12m` |
| Message preview | `--type-body` 15px 400 sans, `--cb-ink`, max 2 lines, `text-overflow: ellipsis` | If image-only message: render `📎 Photo` in `--cb-mute` italic |
| Reactions cluster | `--type-body-sm`, with kudos glyph | Optional; renders if count > 0 |

### Tap behavior

- Tap row → open chat at that message position.
- Tap "Open chat →" → /league-chat full surface.

### Cross-surface consumers

- `leagues/{leagueId}/chat` collection, ordered by `createdAt desc`, limit 3 — uses **Firestore composite index** declared in Pass 1 § 4.4.
- `fbMemberCache` for sender avatars.
- Navigates to **Feed tab → Chat sub-view** (Pass 3c).

## 3a.1.9 State matrix

The default Home state is shown. Other states swap specific blocks:

| State | Trigger | What changes |
|---|---|---|
| **Default (no round today)** | No round with `scheduledFor` in today's window AND no active round | As spec'd above |
| **Active round** | Any round with `status='active'` for this member | CTA card replaced by Active Round card (§ 3a.3) |
| **Loading** | First app open, data not yet hydrated | All cards render as skeleton (see § 3a.1.10) |
| **Error — network** | Firestore listener fails on init | Banner-tier NOTICE in banner slot: "Couldn't load latest. Pull to refresh." League Pulse + Chat show empty-state placeholders. Stats fall back to cached values from Preferences. |
| **Error — auth** | Member not signed in | Redirect to Onboarding (W1.S14). Home is never rendered without auth. |
| **Empty league (no activity)** | League has 0 activity entries | Pulse module renders empty state (§ 3a.2) |
| **Empty chat** | League chat has 0 messages | Chat module renders empty state (§ 3a.2) |
| **First-time member** | Member's `createdAt` < 24h AND 0 rounds logged | Default state + onboarding nudge overlay (§ 3a.2) |
| **Permission: Spectator-tier member** | Member is a league spectator (read-only) | CTA card: "Start a round" replaced with "Watch active rounds" if any active rounds exist in league |

## 3a.1.10 Loading state — skeletons

Each module has a skeleton variant:

| Module | Skeleton spec |
|---|---|
| Page header | Two stacked bars: 80×11 (`--cb-chalk-deep`) + 280×36 (`--cb-chalk-deep`), `--radius-sm`, shimmer animation 1200ms infinite linear |
| CTA card | Dashed border identical to loaded; inside: 100×11 bar + 220×22 bar + 280×17 bar × 2 + 200×56 filled bar (matches CTA shape) |
| Stats row | Three matching cards; each card has 60×11 bar + 80×32 bar |
| Pulse / Chat | Three row skeletons each; avatar circle + two text bars per row |

Skeleton shimmer: linear-gradient sweep `--cb-chalk-deep` → `--cb-chalk-soft` → `--cb-chalk-deep`, 1200ms infinite. **Under `prefers-reduced-motion: reduce`**: shimmer removed; skeletons render as static `--cb-chalk-deep` fills.

## 3a.1.11 Accessibility checklist

- [ ] Every interactive element has `aria-label` or visible label.
- [ ] Focus order: masthead avatar → masthead icons → CTA → stats row (L→R) → Pulse "Full feed" → first Pulse row → ... → Chat "Open chat" → first Chat row.
- [ ] Body text passes AAA against background (verified by axe per P2-I2).
- [ ] All motion respects `prefers-reduced-motion`.
- [ ] Skeletons set `aria-busy="true"` on the scroll container; removed when loaded.
- [ ] Pull-to-refresh announces "Refreshed" via `aria-live="polite"` on completion.
- [ ] Stat numerals read by VoiceOver as "Rounds, 7" not "Rounds 7" (paired ARIA).
- [ ] Touch targets ≥ 48px including masthead icons.
- [ ] Dynamic Type tested at 150% + 200%.

## 3a.1.12 Sunlight mode behavior

- Card fills (`--cb-chalk-deep`) become outlined: 1px `--cb-line` border, transparent background.
- All shadows removed (only the elevated banner uses shadow; remains).
- Stat numerals shift from `--cb-ink` to `--cb-felt-deep` for higher contrast.
- Brass-deep replaces brass on all interactive accents per § 6.2.
- Icon strokes increase from 2px to 2.5px.

## 3a.1.13 HQ counterpart (Criterion 9)

HQ Home (`/` route in production v8.22.0) renders the same conceptual content with desktop layout: left nav rail + right rail with League Pulse, masthead at top. Mobile Home is the same content collapsed into vertical stack. Component family is shared via Pass 1 tokens; the **divergence point** is the right rail (HQ has it; mobile inlines Pulse + Chat into the main scroll).

## 3a.1.14 Architectural feasibility (Criterion 4 + 5)

- Renders inside Page Shell `content` slot. Mobile shell has no `leftRail` / `rightRail` slots — Pulse + Chat live in main `content`.
- All Firestore queries route through `leagueCollection()` / `leagueDoc()` wrappers (Criterion 5).
- Member visibility per `PB.isMemberVisibleToViewer` enforced before rendering any Pulse / Chat entry.
- Firestore indexes required: composite `(leagueId, createdAt desc)` on `chat`; composite `(leagueId, createdAt desc)` on `activity`. Both flagged in Pass 1; reaffirmed here.

## 3a.1.15 Cross-surface consumers (Criterion 12)

| Surface | Read | Write |
|---|---|---|
| `fbMemberCache` | Greeting name, avatar | None |
| `members/{id}` | `handicapIndex`, `bestScore`, `roundsCount` | None |
| `rounds` (member-scoped) | Active round detection | None |
| `leagues/{leagueId}/activity` | Latest 3 entries | None |
| `leagues/{leagueId}/chat` | Latest 3 messages | None |
| `members/{id}/notifications` (counter) | Unread count → masthead badge | None |
| `system/banner` | Crisis banner state | None |

**Downstream impact:** Home is read-only. Changes to underlying schemas (member shape, round shape, activity shape, chat shape) must update this screen's renderers. List shipping: W1.S2 (HQ chrome / Home), W1.S3 (member shape), W1.S4 (round shape), W1.S11 (activity shape), W1.S12 (chat shape), W1.I5 (banner shape).

---

# Screen 3a.2 — Home — Empty / First-Time / New-Member States

Three distinct empty states for the same screen frame. Component frame from § 3a.1 is reused; only contents within modules change.

## 3a.2.1 First-time member (createdAt < 24h, 0 rounds)

### Page header

- Eyebrow: `TUESDAY · MAY 12 · DAY ONE`
- Headline: `Welcome, Mr Parbaugh.` — display serif, italic on the name.

### CTA card

- Dashed border same as default.
- Eyebrow: `START HERE`, `--cb-brass-deep`
- Headline: `Log your first round.`
- Body: `Your handicap, stats, and league pulse all wake up when you log a round.`
- Primary CTA: `▸ Start a round` (same spec as default)
- Secondary text link below CTA, `--type-body-sm`, `--cb-mute`: `Or browse the league first →` — tap goes to Feed tab.

### Stats row

- All three cards show `—` em-dash in `--cb-mute` for value.
- Tap on any card opens a bottom sheet: "Log a round to see your numbers."

### Pulse module

- If league has activity: same as default.
- If league has no activity: empty state with `--cb-mute` italic copy: `The first activity here will be yours.`

### Chat module

- If league has chat history: same as default.
- If empty: empty state copy: `Say hi to the league.` + small ghost-style CTA `Open chat →`.

## 3a.2.2 Returning member with no league activity

For members in a brand-new league or after activity is empty.

- Default CTA card unchanged.
- Pulse module empty state: `Nothing happening in the league yet.` + small action: `Be the first to log a round →`
- Chat module empty state: `Quiet here.` + small action: `Start the conversation →`

## 3a.2.3 Member-as-spectator-tier

For members with read-only access to a league.

- CTA card transforms:
  - Eyebrow: `SPECTATING`
  - Headline: depends on active rounds — if any: `Live rounds in the league.` ; else: `No rounds in progress.`
  - CTA: `Watch active rounds` (if applicable) or `Browse the league →` (else).
- Stats row hides member-specific cards (HCP, BEST). Instead: a single full-width card showing aggregated league stats: `LEAGUE AVERAGE 92 · 7 ACTIVE MEMBERS · 4 ROUNDS THIS WEEK`.
- Pulse + Chat modules unchanged (read access).

## 3a.2.4 Error state (network failure on init)

- Banner slot renders NOTICE-tier message (per Pass 1 § 3.3 + § 6 banner spec): `Couldn't load latest. Pull to refresh.` Dismissible.
- CTA card shows default content but with greyscale brass (`--cb-mute` replaces `--cb-brass-deep` on accents) until network returns.
- Stats row: cached values from Preferences if available; else `—`.
- Pulse + Chat: empty placeholders with retry button.
- Pull-to-refresh re-attempts hydration.

## 3a.2.5 Loading state

Already specified in § 3a.1.10.

## 3a.2.6 Accessibility (additional for empty states)

- Empty-state copy uses `--cb-mute` italic — verify 4.5:1 contrast minimum against `--bg`. Italic body must remain readable; if degraded by italic rendering, fall back to non-italic.
- "First-time member" eyebrow `DAY ONE` is celebratory; ensure it doesn't read as warning. No icon prefix.

## 3a.2.7 Cross-surface consumers

- `members/{id}.createdAt` (first-time detection).
- `members/{id}.role` (spectator detection — `[INFERENCE]` confirm field name during W1.S3).
- `leagues/{leagueId}/activity.count` (empty league detection — derived; engineering may compute server-side).
- `leagues/{leagueId}/chat.count` (empty chat detection).
- `leagues/{leagueId}` aggregate stats for spectator-tier card.

---

# Screen 3a.3 — Home — Active-Round Override

When the member has an active round, the CTA card is replaced by the Active Round card. All other Home modules stay.

## 3a.3.1 Active round card

### Frame

| Property | Value |
|---|---|
| Margin | `--space-5` left/right, `--space-5` top, `--space-6` bottom |
| Padding | `--space-5` all sides |
| Background | `--cb-felt` (the billiard green primary surface) |
| Border | None |
| Radius | `--radius-lg` |
| Shadow | `--shadow-1` |
| Min-height | 220px |

The fill swap (felt vs. dashed) signals: *something is happening right now.* This is the most-prominent state Home ever shows.

### Contents

| Element | Token override | Content |
|---|---|---|
| Pulse indicator | 10×10 dot, `--cb-brass`, animated pulse (scale 1.0 ↔ 1.15, 1200ms `--ease-in-out` infinite) | Position: top-left of card |
| Eyebrow | `--type-label`, `--cb-brass` | `ROUND IN PROGRESS · HOLE 7 OF 18` |
| Course name | `--type-h2` (22px serif 600), `--cb-chalk` | `Ocean Pines G&CC` |
| Sub-line | `--type-body-sm`, `--cb-chalk` at 0.7 opacity | `Started 9:42 AM · Mr Parbaugh, Nick, Kayvan` |
| Score row | Horizontal: 3 numerals separated by hairlines | `THRU 6` (label `--type-label`) · `+4` (`--type-stat-md`) · `est. 92` (`--type-body-sm` opacity 0.7) |
| Primary CTA | `--cb-brass` background, `--cb-felt-deep` text, `--type-cta`, 56px, full-width, `--radius-lg` | `▸ Open scorecard` |
| Secondary action | Below CTA, text link `--cb-brass-soft`, `--type-body-sm` | `Hand off scoring →` (for handoff per Pass 1 § 8.4) |

### Pulse animation reduced-motion

Under `prefers-reduced-motion: reduce`, the pulsing dot becomes a static `--cb-brass` dot with 1px ring `--cb-brass-faint`. No animation.

### Sunlight mode behavior

- `--cb-felt` background increases saturation slightly: `oklch(28% 0.06 155)`.
- `--cb-chalk` text stays.
- Brass accents shift to `--cb-brass` (already high enough contrast on felt).
- Shadow removed.

### Tap behavior

- Card tap (anywhere except secondary link) → Scorecard live screen (Pass 3b).
- Secondary "Hand off" → handoff bottom sheet (Pass 3b).

## 3a.3.2 Stats row behavior under active round

Stats row continues to render. Values reflect persisted state, not the in-progress round.

- An additional subtle text appears below the row: `Live round score not counted until finalized.` — `--type-caption`, `--cb-mute`, centered. Builds trust that the active round won't pollute historical stats prematurely.

## 3a.3.3 Pulse + Chat modules under active round

Unchanged from default. Members may want to read pulse / chat while between holes.

## 3a.3.4 Multi-author edge case

If the member is currently the **author** of an active round and also a **spectator** of another active round in the same league (rare, but possible):

- Active Round card shows the **authored** round (priority — actionable).
- A small `+1 spectating →` link appears below the card, linking to the spectated round.

## 3a.3.5 Round just-completed transition

When a round transitions from `active` → `complete`:

- Active Round card transforms via 600ms `--ease-spring` to a "Round complete" celebration state:
  - Background flash brass-soft → felt over 400ms.
  - Flag-raise glyph (per Pass 2 P2-I4 ratification) appears centered, 64×64, scale 0 → 1 + rotate -10° → 0° over 600ms.
  - Haptic medium tap synchronized.
  - Eyebrow text: `ROUND COMPLETE`.
  - Headline: `{score} at {course}.`
  - Sub-line: `Saved to your history. League's been told.`
  - CTA: `View round details →` (`--cb-brass-soft` on `--cb-felt-deep`).
- Card persists in this celebration state until the member taps the CTA or scrolls past it. After view, next app-open returns Home to default state.

Reduced-motion: no scale/rotate/flash. Card transitions via instant fade between states.

## 3a.3.6 Accessibility (additional for active state)

- Pulse indicator: `aria-hidden="true"` (decorative).
- Card has `role="region"`, `aria-label="Active round at Ocean Pines, hole 7 of 18"`.
- `aria-live="polite"` on the hole-number portion of the eyebrow — updates announce as the round progresses.
- Live score region: `aria-live="off"` (would announce too often). Updates polled by VoiceOver on user request only.
- Celebration state: `aria-live="assertive"` with full sentence: "Round complete. 98 at Ocean Pines."

## 3a.3.7 Cross-surface consumers

- `rounds/{activeRoundId}` listener — real-time updates on `holesPlayed`, `currentScore`, `estimatedFinal`.
- Same `fbMemberCache` for participant avatars.
- Tap targets navigate to **Scorecard live** (Pass 3b) and **Round detail** (Pass 3b → finalized view).
- Listener is one of the three sanctioned real-time categories per Pass 1 § 8.2.

---

# § Pass 3a — Open Inferences

| # | Inference | Where | Founder action |
|---|---|---|---|
| 3a-I1 | Member role field name `members/{id}.role` for spectator detection | § 3a.2.7 | Confirm field name |
| 3a-I2 | Display first-name source — `firstName` field vs. parsed from `displayName` | § 3a.1.4 | Confirm canonical field |
| 3a-I3 | Provisional handicap threshold (fewer than 3 rounds) | § 3a.1.6 | Confirm threshold |
| 3a-I4 | Late-night greeting copy (`Late one, {firstName}.` for 22:00–03:59) | § 3a.1.4 | Confirm tone / propose alt |
| 3a-I5 | Spectator-tier aggregate league stats card content | § 3a.2.3 | Confirm or amend metrics |
| 3a-I6 | `+1 spectating →` link presentation under multi-author edge case | § 3a.3.4 | Confirm or simplify |
| 3a-I7 | Celebration state copy "League's been told" — tone fit for founding crew? | § 3a.3.5 | Confirm tone |

---

# § Pass 3a — Ratification block

You are accepting:

1. **Screen 3a.1** — Home default with masthead + page header + dashed CTA + stats row + Pulse + Chat modules; specific tokens for every element.
2. **Screen 3a.2** — Four empty-state variants (first-time, no league activity, spectator-tier, error) with module-level overrides.
3. **Screen 3a.3** — Active-round override card on felt fill, pulse indicator, multi-author edge case, round-complete celebration.
4. **All states** clear 12 rejection criteria, reference reduced-motion + Sunlight handling, declare cross-surface consumers.
5. **7 inferences** require resolution before sub-pass 3b begins.

✏️ **Founder action:** Ratify, red-line, or amend per screen. Once ratified, sub-pass **3b — Play tab** is next (~6 screens: Start Round, Scorecard live, Sync Round, Scramble Live, Party Games active, formats).

**End of sub-pass 3a.** Standing by.
