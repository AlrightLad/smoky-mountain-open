# CLUBHOUSE_SPEC-HQ — Part 2, View 3m: Parcoin Shop + Wallet Ledger

> **Status:** Tier 2 deliverable. All [GAP] questions pre-answered by Founder ratification 2026-05-12.
> **Canonical mock:** Frame inherits chrome from `Parbaughs HQ Final v2.html`. Shop item cards draw from existing `Parbaughs Parcoin Shop Refresh.html` Draft.
> **Ship:** W1.S6 — Parcoin economy (Wagers + Bounties + Challenges + cosmetics + shame items).
> **Scope:** Single Shop page split into 4 horizontal swimlanes; Wallet Ledger view absorbed as the Hero section.

---

## 0 — View scope

Editorial pro-shop aesthetic — country-club shop feel. Member's balance is prominent at top; cosmetics, community shame items, and wager/bounty/challenge entry points stack below.

Sections covered as one view:
- **3m.A** — Wallet hero (balance + recent transactions)
- **3m.B** — Cosmetics swimlane (avatar frames, Chip backgrounds, course flair)
- **3m.C** — Community items swimlane (gift-to-friend shame items)
- **3m.D** — Wagers + Bounties + Challenges swimlane (entry points)
- **3m.E** — Earnings leaderboard (gag feature)

States covered:
- 3m.1 — Default (authenticated member, balance visible)
- 3m.2 — New member (low balance, no purchase history)
- 3m.3 — Cosmetic item detail modal
- 3m.4 — Gift flow (community item)
- 3m.5 — Wager / Bounty / Challenge entry detail

---

# § 3m.1 — Default state

## 3m.1.1 Frame composition

| Slot | Token / Spec | Notes |
|---|---|---|
| Top nav | `--nav-h` | Per Part 1 § 4 |
| Tab switcher | `--tabs-h` | "Shop" / "Wallet" tab combined |
| Masthead | ~120px (working surface) | See 3m.1.3 |
| Single column body | flex, `--space-7` between sections | NO agate rail — Shop is full-width swimlanes |
| Footer | per Part 1 § 14 |

## 3m.1.2 Banner

No banner on Shop view by default. If recent wager win/loss within last 30 min: banner-tier toast slides in from top (Part 1 § 11.2).

## 3m.1.3 Masthead

- **Eyebrow:** `THE SHOP · {LeagueName} or PLATFORM scope`
- **H1:** `What you've got.` (Fraunces 56px italic — emphasizes balance ownership)
- Sub-deck and date line: omit.

## 3m.1.4 Scope rail

| Control | Spec |
|---|---|
| Section anchors | `Wallet · Cosmetics · Community · Wagers · Leaderboard` mono 11px |
| Right-aligned meta | `Last transaction {time} ago` mono 10.5px mute-soft |

---

# § 3m.A — Wallet hero

Top of main column. Prominent balance display.

## 3m.A.1 Balance card

| Element | Spec |
|---|---|
| Card frame | Brass-double-rule top + bottom per HQ Part 1 § 6, `--cb-chalk-deep` background, `--space-7` padding |
| Eyebrow | `YOUR BALANCE` mono 11px brass |
| Balance numeral | Fraunces 600 96px ink tabular-nums, `--space-4` top margin | e.g. `2,847` |
| Sub | Mono 11px mute-soft `Parcoin · USD equivalent ${X.XX}` — USD ghost text architected but disabled until Launch Phase A pricing locked |
| Purchase CTA | `Purchase Parcoin →` brass pill — **disabled** until Launch Phase A; renders with `[Coming soon]` mute-soft label below |

## 3m.A.2 Recent transactions table

Below balance card, full-width.

| Column | Spec |
|---|---|
| Type chip | Mono 10.5px chip — `EARNED` brass-soft / `SPENT` mute-soft / `WON` brass / `LOST` claret-soft / `GIFTED` brass-soft / `PURCHASED` (architected, no records yet at W1.S6) |
| Description | Fraunces 15.5px ink — e.g. `Won 25 from wager · vs Kayvan · Apr 14` |
| Counterparty | Mono 11px mute-soft — e.g. `Kayvan Kanani` (if applicable) |
| Amount | Fraunces 600 18px tabular — `+25` (brass for earned/won) or `-10` (claret for spent/lost) |
| Date | Mono 11px mute-soft |

Pagination: 20 rows initial + `View full ledger →` link to dedicated `/wallet/ledger` route. Ledger view extends this table with filter chips (type, date range, counterparty).

## 3m.A.3 Earnings/Spending breakdown chart

Below transactions. Simple horizontal stacked bar:

- Earned (brass): wager wins + bounty earnings + championship grants + gifted-to-you
- Spent (claret-soft): cosmetic purchases + gifted-away + bounty offers paid out
- Net delta indicator: `+1,247 net this season` or `-203 net this season` mono 11px

---

# § 3m.B — Cosmetics swimlane

## 3m.B.1 Eyebrow + header

- Eyebrow: `COSMETICS · {N} items available` mono 11px brass
- H2: `Make your shelf yours.` Fraunces 30px italic

## 3m.B.2 Item grid

Wave 1 cosmetic catalog (Founder picks final aesthetics — these are starter proposals):

| Category | Items | Price range |
|---|---|---|
| Avatar frames | brass-circle, hairline-double, country-club-stamp, fairway-laurel, championship-cross | 100-500 Parcoin |
| Chip backgrounds | chalk-on-felt, subtle pinstripe, vintage-paper-texture | 50-200 Parcoin |
| Course flair | per-course "Honors Course: 12 rounds" style display | 100 Parcoin per course |

### Item card

| Element | Spec |
|---|---|
| Card frame | 240×280, `--cb-chalk-deep` background, `--radius-md`, 1px `--cb-line` border, `--space-4` padding |
| Preview | Top 60% of card — renders the cosmetic applied to a sample avatar or Chip background |
| Item name | Fraunces 600 18px ink |
| Description | Fraunces 13px mute-soft, 2-line max |
| Footer | Per ownership state |

### Ownership states per item

| State | Footer rendering |
|---|---|
| Not owned | `100 Parcoin` mono 11px brass + `Buy →` text-link |
| Owned, not equipped | `Owned ✓` mono 11px mute + `Equip →` brass text-link |
| Owned, equipped | `Owned ✓ Equipped` mono 11px brass |
| Insufficient balance | `100 Parcoin · Need {N} more` mono 11px claret |

Tap on `Buy →` opens 3m.3 cosmetic detail modal.

---

# § 3m.C — Community items swimlane (shame items)

## 3m.C.1 Eyebrow + header

- Eyebrow: `COMMUNITY · GIFT TO A FRIEND` mono 11px brass
- H2: `For the long-suffering.` Fraunces 30px italic

## 3m.C.2 Shame item catalog (Wave 1)

| Item | Display | Duration | Price |
|---|---|---|---|
| **Yips Pin** | "Currently afflicted with the yips" badge on giftee's profile | 24h | 50 Parcoin |
| **Slow Play Citation** | "Reported for pace of play" badge | 7d | 100 Parcoin |
| **Bunker Resident** | "Spent the round in the sand" badge | 48h | 75 Parcoin |
| **Three-Putt Champion** | "Celebrating 3+ three-putts in a round" badge | 24h | 50 Parcoin |
| **Lost Ball Award** | "Couldn't keep it in play" badge | 24h | 50 Parcoin |

## 3m.C.3 Item card

Same card chrome as 3m.B but with gift-specific footer:

| Element |
|---|
| `Gift →` brass text-link footer (not `Buy →`) |
| Tap opens 3m.4 gift flow modal |

---

# § 3m.D — Wagers + Bounties + Challenges swimlane

## 3m.D.1 Eyebrow + header

- Eyebrow: `THE ECONOMY · ACTIVE GAMES` mono 11px brass
- H2: `Put a Parcoin where your mouth is.` Fraunces 30px italic

## 3m.D.2 Three entry cards

| Card | Description | Entry CTA |
|---|---|---|
| **Wagers** | 1v1 / 2v2 / skins on rounds | `View active wagers →` |
| **Bounties** | Set a price head on a member's accomplishment | `Browse bounties →` |
| **Challenges** | H2H challenge during a multi-player round | `Issue a challenge →` (only enabled when viewer is in an active round) |

Each card opens its respective flow per W1.S6 implementation. Card chrome inherits from 3m.B item cards.

### Active wager / bounty / challenge sub-cards

If viewer has active wagers/bounties/challenges: a sub-list below the entry cards renders each active item.

| Row spec |
|---|
| Header: `Active: {N} wagers · {N} bounties · {N} challenges` mono 11px brass |
| Per-row: status pill (`IN PROGRESS` / `PENDING` / `SETTLED`) + members involved + stake + `View →` |

---

# § 3m.E — Earnings leaderboard

Per locked memory #28 — gag feature. Top 10 members by lifetime Parcoin earned.

## 3m.E.1 Eyebrow + header

- Eyebrow: `THE STANDINGS · BY THE PARCOIN` mono 11px brass
- H2: `Who's actually the best.` Fraunces 30px italic

## 3m.E.2 Sort segmented

`All-time · Season · Month` mono 11px segmented control. Active = brass underline 2px.

## 3m.E.3 Leaderboard table

Reuses standard Leaderboard table component from W2.S2 / 3d.

| Column | Content |
|---|---|
| Rank | Fraunces 600 18px tabular |
| Avatar | 32×32 |
| Member | Username + discriminator |
| Parcoin earned | Fraunces 600 18px tabular brass |
| Most lucrative win | Mono 11px mute-soft footnote (e.g. `Won 200 from Mike on Apr 7`) |

---

# § 3m.3 — Cosmetic item detail modal

Triggered from `Buy →` on a cosmetic item.

## 3m.3.1 Modal frame

- Modal-overlay per Part 1 § 11, max-width 480px, 4px `--cb-brass` top border
- Scrim `--cb-felt` at 40% opacity

## 3m.3.2 Content

| Element |
|---|
| Eyebrow: `CONFIRM PURCHASE` mono 11px brass |
| Item preview: large rendering of cosmetic applied |
| Item name + description |
| Cost row: `Cost: 100 Parcoin · Balance after: 2,747` mono 11px (balance-after pulled from 3m.A) |
| Confirm CTA: `Buy & equip →` brass pill (purchases AND equips simultaneously) |
| Decline link: `Cancel` text-link mute |

On success: modal closes; balance updates; item moves to "Owned, equipped" state; success haptic + toast.

---

# § 3m.4 — Gift flow modal

Triggered from `Gift →` on a community shame item.

## 3m.4.1 Step 1 — Recipient selection

| Element |
|---|
| Eyebrow: `STEP 1 OF 2 · PICK YOUR TARGET` mono 11px brass |
| Member search field with autocomplete from `members/*` |
| Recently-DM'd / friends prioritized in autocomplete |

## 3m.4.2 Step 2 — Message + confirmation

| Element |
|---|
| Eyebrow: `STEP 2 OF 2 · OPTIONAL MESSAGE` mono 11px brass |
| Recipient confirmation: `Gifting to {RecipientName}` Fraunces italic 18px ink |
| Optional message: 280-char textarea per §3l Composer chip variant pattern |
| Cost row: `Cost: 50 Parcoin · Balance after: 2,797` |
| Confirm CTA: `Send gift →` brass pill |
| Back link: `← Pick someone else` text-link |

On success: badge applied to recipient's profile for the duration window; auto-posted activity card appears in Feed (e.g. `Zach gifted Kayvan a Yips Pin · "for the 18th hole earlier"`); success haptic + toast.

### Anti-spam

`[INFERENCE]` per Founder ratification: rate limit gift sends per giver-per-recipient. Recommended: max 1 gift per 24h per recipient. Violations: friendly error `You've already gifted {RecipientName} today. Try someone else?`

---

# § 3m.5 — Wager / Bounty / Challenge entry detail

These flows extend beyond Shop scope; specced in detail in W1.S6 ship execution. Shop's role is **entry points only**.

| Entry | Routes to |
|---|---|
| `View active wagers →` | `/wagers` route — list view of viewer's wagers |
| `Browse bounties →` | `/bounties` route — bounty board cross-league |
| `Issue a challenge →` | In-round Scorecard challenge entry modal (W1.S4 + W1.S6) |
| `Add wager` from Round Detail | Wager creation modal — 1v1 / 2v2 / skins setup |
| `Set a bounty` from Profile | Bounty creation modal |

---

# § 3m.6 — New member state (low balance, no purchase history)

Variant of default. Member balance < 100 Parcoin AND no past transactions.

| Section | Variation |
|---|---|
| Wallet hero balance numeral | Renders normally (e.g. `0` or `25`) |
| Recent transactions | Empty state: `Your first wager, bounty, or championship will start the ledger.` mute italic |
| Earnings/spending chart | Hidden (no data) |
| Cosmetics swimlane | Items unaffected by balance — viewer sees all items with `Insufficient balance` footer for un-affordables |
| Community items swimlane | Same — items shown, affordability state per-item |
| Wagers + Bounties + Challenges | Empty (no active for new member) |
| Earnings leaderboard | Renders with platform-wide leaders (gag feature) |

Above Wallet hero (only for new members): editorial nudge card — `Earn Parcoins by posting rounds, winning wagers, and earning championships. Learn how it works →` brass link to How-It-Works page.

---

# § 3m.7 — Cross-surface dependencies

| Reads | Writes |
|---|---|
| `members/{viewerId}.parcoin-balance` | `transactions/{txId}` on every Parcoin operation |
| `members/{viewerId}.transactions[]` | `members/{viewerId}.parcoin-balance` (atomic update) |
| `cosmetics-catalog/*` | `members/{viewerId}.owned-cosmetics[]` on purchase |
| `community-items-catalog/*` | `members/{recipientId}.active-badges[]` on gift |
| `wagers/{leagueId}/*` for active counts | |
| `bounties/{leagueId}/*` for active counts | |
| Reads cross-platform leaderboard data for 3m.E |

---

# § 3m.8 — Accessibility

- Balance numeral: `aria-label="Your Parcoin balance, 2,847"`. `aria-live="polite"` on balance updates.
- Transaction table: `<table>` with `<th scope="col">`. Each row `aria-label` synthesizes type + description + amount.
- Item cards: `<article role="article">` with `aria-labelledby` to item name + `aria-describedby` to price + ownership state.
- Gift flow: step indicators `aria-current="step"`.
- Sort segmented control: `role="radiogroup"`, each option `role="radio"`.

---

# § 3m.9 — Token consumption summary

- Surfaces: `--cb-chalk`, `--cb-chalk-deep`, `--cb-felt` (modal scrim only)
- Text: full ink family
- Accent: `--cb-brass`, `--cb-brass-deep`, `--cb-brass-soft`
- Status: `--cb-claret` (lost/spent transactions), `--cb-moss` (gained transactions — alternate to brass for visual variety)
- Lines: `--cb-line`
- Type: `--type-mast-hq` (56px H1 override), `--type-sec-hq`, `--type-stat-large` (96px balance numeral), `--type-body-hq`, `--type-eyebrow-hq`, `--type-label-hq`, `--type-num-hq`

No new tokens.

---

# § 3m.10 — Ratification block

Accepted:
- Single Shop page splits into 5 vertical sections: Wallet hero + Cosmetics + Community items + Wagers/Bounties/Challenges + Earnings leaderboard.
- Wave 1 cosmetics: 5 avatar frames + 3 Chip backgrounds + course flair (Founder picks final aesthetics during ship execution).
- Wave 1 community items: 5 shame items (Yips Pin, Slow Play Citation, Bunker Resident, Three-Putt Champion, Lost Ball Award) — Founder picks final list.
- Wager / bounty / challenge details specced separately in W1.S6 ship execution; Shop is entry points only.
- Wallet ledger view absorbed into Shop spec as the Hero section + `/wallet/ledger` extended route.
- Earnings leaderboard renders top 10 by Parcoin earned (gag feature).
- All [GAP] questions pre-answered in TIER2-4_DESIGN_BOT_BRIEF.md.
