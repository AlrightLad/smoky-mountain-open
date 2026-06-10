---
status: open
severity: green
priority: HIGH
authored_at: 2026-06-10T16:00:00Z
authored_by: agent (parallel fleet)
founder_action_required: true
decision_type: taste-approval (item-by-item catalog)
cost: $0
execute_by: agent (after approval)
---

# ParCoin cosmetics catalog + store redesign — APPROVE ITEMS

## Decisions you need to make

1. Approve/cut each catalog item PC-01 through PC-25 individually (25 proposed: 4 rings, 3 nameplates, 3 scorecard skins, 3 feed flair, 3 title items, 4 tee markers, 2 Caddy voice packs, 1 league crest foundry, 2 earned-only Trophy Cabinet items).
2. Approve the page rename 'The Shop' → 'The Pro Shop' and the masthead line 'Spend it like you earned it.'
3. Approve the rarity-tier names and price bands: Range Bucket 150–250 / Pro Shop 300–500 / Member's Locker 600–1,000 / Champion's Cabinet 1,200–2,500 / Commemorative not-for-sale (grounded in 75/attested-18H-round, ~300/mo active earn rate).
4. Approve the legacy-catalog migration: grandfather all owned items forever, retire ~50 flat-color variants from sale, keep ~15 best under a small 'Paint Locker' rail, move the 3 reserved titles into the Trophy Cabinet.
5. Approve the two new render surfaces: Nameplates (behind your name in rosters/leaderboards/chat) and Tee Markers (personal totem beside your name on live rounds and scorecards).
6. Approve feed flair behavior: one-time, on-first-render moment effects (birdie drop, gallery roar) — confirm taste boundary that effects fire once and never loop.
7. Approve Caddy voice packs as text-tone variants only (no audio, ⛳ glyph unchanged) at 800 each — or cut the category.
8. Approve The Crest Foundry (league crest editor, 2,000, commissioner-purchased) and confirm who pays: commissioner's personal balance vs a future league treasury.
9. Approve earned-exclusive rules: The Green Jacket ring = season champion only; Ace Marker = hole-in-one only; optional Solstice scorecard as the first seasonal commemorative.
10. Approve the weekly 'Front Table' featured rotation cadence (1 hero + 3 picks per week) — or prefer a slower monthly rhythm for a 20-member league.
11. Confirm Sponsor-a-Hole remains league-based and out of the Pro Shop (this proposal does not touch it), and Name-a-Tournament stays removed.

---

# THE PRO SHOP — ParCoin Cosmetics Catalog Proposal (v1, for Founder approval)

**Status:** PROPOSAL — nothing here is built. Every item is individually approvable/cuttable.
**Scope notes honored:** Sponsor-a-Hole stays league-based (not moved into the shop). Name-a-Tournament stays removed (not reintroduced).

---

## 1. Why the current store reads "inadequate" (diagnosis)

The live catalog (`src/pages/shop.js`) is 74 items, but functionally it is **one item sold 74 times: a hex color.** 20 rings are colored circles. 22 banners are CSS gradients. 13 card themes are colored left-borders. 6 name effects are text-shadows. The names are adjectives ("Ice Blue", "Neon Green", "Royal Purple") — nothing a member would screenshot, defend, or covet.

What real cosmetic economies sell is not color. They sell **objects, moments, and proof**:

| Platform | What actually sells | PARBAUGHS translation |
|---|---|---|
| **Fortnite** | Identity-first lockers; sets/bundles; daily-rotating featured shop; the avatar IS the product | Featured "Front Table" rotation; items as objects with stories, not swatches |
| **Rocket League** | **Goal explosions** (the moment of glory gets a fanfare), player banners, titles; rarity ladder topped by Black Market; **season rewards you cannot buy** | Feed flair that fires on birdies/PBs; earned-only Trophy Cabinet items |
| **Discord** | **Avatar decorations** (ornamental frames — tiaras, flowers, auras — not flat rings), animated profile effects, **nameplates** (designed backgrounds behind your name in member lists) | Ornamental rings; nameplates that render in rosters/leaderboards — golf's natural habitat is the leaderboard row |
| **Sleeper** | **Mascots** that represent you per-league and taunt opponents; bought with "cookies" currency | Tee markers as your personal totem; Caddy voice packs as personality |
| **Strava** | Prestige path: verified/earned badges, subtle subscriber flair — understated > loud | Earned exclusives with engraved dates; quiet-luxury Member's tier |

Pricing-psychology research adds the two-path rule: players signal status via **dominance** (loud, attention-grabbing) or **prestige** (understated, earned, skill-anchored). The current catalog only sells dominance (neon, rainbow, fire). A country-club identity is overwhelmingly a **prestige** economy — brass, leather, parchment, engraving — with a couple of loud joke items for the group-chat energy.

**The core taste move: stop selling paint, start selling clubhouse objects.** Locker plates, ball markers, yardage books, head covers, wax seals, trophy silver. Nouns with stories.

---

## 2. Pricing framework — grounded in actual earn rates (`src/core/parcoins.js`)

Earn reality: attested 18H round = **75** (50+25) · 9H = 25–35 · range session = 10/day · PB-18H = 100 · event win = **500** · season champion = **1,000** · invite joined = 200 · achievements 10–50 · daily login = 1. Documented monthly income: casual ~175 · active ~300 · dedicated ~550.

Rarity tiers get golf-native names (replacing implicit Basic/Mid/Premium):

| Tier | Price band | Time-to-earn (active member, ~300/mo) | Feel |
|---|---|---|---|
| **Range Bucket** | 150–250 | ~2–3 rounds | Cheap fun, joke-friendly |
| **Pro Shop** | 300–500 | 1–2 weeks of play | Solid everyday identity |
| **Member's Locker** | 600–1,000 | ~1 month of regular play | Quiet luxury, the prestige core |
| **Champion's Cabinet** | 1,200–2,500 | A season's commitment — or one event win (+500) plus play | Anchor items; the flex |
| **Commemorative** | NOT FOR SALE | Earned only (season champ, ace, solstice…) | Proof. The Strava/Rocket-League prestige path |

This keeps the existing ceiling (current top item is 2,500) and makes the event-win (500) and season-champion (1,000) payouts feel like windfalls that unlock Cabinet purchases — the economy's loop closes.

---

## 3. THE CATALOG — 25 items for item-by-item approval

All names and descriptions are written in The Caddy's voice (dry, warm, clubby). "Visual" is the build target in one line. Every item renders through hooks that already exist (`playerFrameColor`/`playerRingClass`, `getPlayerBannerCss`, `getPlayerCardCss`, `getPlayerNameClass`, `equippedTitle`) or one new `equippedCosmetics` key per new category.

### A · AVATAR RINGS — ornamental, Discord-decoration style (not flat color)

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-01 | **The Gallery Rope** | 400 | Pro Shop | Braided cream rope rings your avatar, four tiny brass stanchion posts at the compass points. You're the one they came to watch. |
| PC-02 | **Fescue** | 600 | Member's Locker | Wispy golden fescue grows up around the bottom arc of your photo, swaying on a slow loop. Links golf, in a circle. |
| PC-03 | **Fried Egg** | 300 | Pro Shop | Your avatar sits half-buried in a ring of bunker sand, a little lip of splash frozen mid-blast. Own your lies. |
| PC-04 | **The Claret** | 1,500 | Champion's Cabinet | Engraved trophy-silver ring with a jug-handle flourish at 2 o'clock; a light sweep crosses the engraving every few seconds. |

### B · NAMEPLATES — new category; renders behind your name in rosters, leaderboards, chat (Discord-nameplate pattern, golf's natural habitat)

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-05 | **Locker Brass** | 500 | Member's Locker | Brushed-brass plate behind your name, engraved serif lettering, two screw heads. Your locker, everywhere you appear. |
| PC-06 | **The Yardage Book** | 350 | Pro Shop | Graph-paper strip with a hand-sketched green contour and a penciled carry number fading behind your name. |
| PC-07 | **Leaderboard Sunday** | 750 | Member's Locker | Manual-leaderboard tile: hand-set white letters on deep green; your score-to-par renders in red (under) or green (over), pulled live. |

### C · SCORECARD SKINS — replaces "card themes"; real materials, applied to your round/feed cards

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-08 | **Pencil & Parchment** | 400 | Pro Shop | Vintage paper stock, dot-grid rules, course name in a letterpress stamp, your numbers in pencil grey. |
| PC-09 | **The Member-Guest** | 500 | Member's Locker | Cream card, double brass rules top and bottom, your league crest as a pale watermark. |
| PC-10 | **Major Sunday** | 900 | Member's Locker | Broadcast lower-third styling: deep-green chyron bars, white type, a little score bug in the corner. Your 92 never looked so televised. |

### D · FEED FLAIR — the Rocket League goal-explosion, translated: moment-of-glory effects that fire ONCE when the feed card first renders

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-11 | **Tap-In Tip** | 300 | Pro Shop | Your reactions land as a brass ball-marker stamp (with a tiny press animation) instead of the stock icon. |
| PC-12 | **Birdie Drop** | 600 | Member's Locker | Under-par rounds: a ball drops into the cup on your feed card — one bounce, rattle, done. Tasteful. Once. |
| PC-13 | **The Gallery Roar** | 750 | Member's Locker | Personal bests: a hat-tip ripple and a short polite-applause burst sweep the card on first view. |

### E · TITLE PLATES — keep the title concept, upgrade the furniture + two new titles

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-14 | **The Engraving** | 400 | Pro Shop | Upgrade: your equipped title renders as a small engraved brass plate under your name instead of italic text. Applies to any title you own. |
| PC-15 | **Cart Path Only** (title) | 250 | Range Bucket | For the member whose ball has seen more concrete than fairway. Worn with pride or not at all. |
| PC-16 | **The Postman** (title) | 400 | Pro Shop | Posts every round. Rain, shame, or triple bogey — always delivers. |

### F · TEE MARKERS — new flagship category; your personal totem beside your name on live rounds, scorecards, and leaderboards (the Sleeper-mascot move, golf-sized)

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-17 | **Brass Acorn** | 200 | Range Bucket | The classic club tee marker, polished. Says you've been here a while. |
| PC-18 | **Rubber Duck** | 350 | Pro Shop | A small yellow duck. For the member with a documented relationship with water. |
| PC-19 | **Persimmon** | 350 | Pro Shop | A tiny persimmon driver head, brass sole plate, whipping and all. Feel player. |
| PC-20 | **The Parbaugh** | 500 | Member's Locker | The league crest cast as a founding-gold marker. Fly the flag. |

### G · CADDY VOICE PACKS — re-skins The Caddy bot's text tone (copy variants only, no audio; ⛳ stays)

| ID | Name | Price | Tier | Visual/Voice |
|---|---|---|---|---|
| PC-21 | **Old Tom** | 800 | Member's Locker | Gruff links wisdom. "Aye. Intae the wind, that's a three-club day. Swing easy." |
| PC-22 | **Bag Room Guy** | 800 | Member's Locker | The heckling friend. "Big number brewing on 14? Prove me wrong, I'd love that." |

### H · LEAGUE CREST — league-level customization (commissioner-purchased; complements league-based Sponsor-a-Hole, does not replace it)

| ID | Name | Price | Tier | Visual |
|---|---|---|---|---|
| PC-23 | **The Crest Foundry** | 2,000 | Champion's Cabinet | Unlocks the league crest editor for your league: shield shapes, two-tone fields, motto ribbon. Crest renders on league pages, Member-Guest cards, and The Parbaugh marker. |

### I · THE TROPHY CABINET — Commemorative, NOT FOR SALE (displayed in-store with the earn condition; P10-actionable)

| ID | Name | Earned by | Visual |
|---|---|---|---|
| PC-24 | **The Green Jacket** (ring) | Season champion only | Deep-green wool ring with three small brass buttons and your championship year engraved at 6 o'clock. |
| PC-25 | **Ace Marker** (tee marker) | Hole-in-one only | A gold ball on a brass pedestal, date engraved. There is no second way to get this, and everyone knows it. |
| *(bonus, free to build later)* | **Solstice Card** (scorecard skin) | Log a round on the summer solstice | That year's commemorative stock — long-shadow dusk gradient, dated. Gone till next June. |

---

## 4. Store-page redesign — "THE PRO SHOP" editorial Clubhouse shelf

Rename the page from "The Shop" to **The Pro Shop**. Masthead keeps the roster pattern: eyebrow `THE PRO SHOP · THE PARBAUGHS`, headline in Caddy voice — **"Spend it like you earned it."**

Layout, top to bottom:

1. **Wallet hero** — keep as-is (the brass double-rule balance card is already right).
2. **The Front Table** — weekly featured rotation: one hero item in a large framed vitrine with its story line + your live preview, three staff picks beside it. (Fortnite's featured-shop rhythm; gives the page a reason to be revisited.)
3. **Category shelves** — horizontal rails per category (Rings · Nameplates · Scorecards · Flair · Titles · Markers · The Caddy · Crest), each sitting on a thin wooden-shelf baseline rule with an editorial header. Live previews on YOUR avatar/name stay — that's the best thing the current page does. Keep it.
4. **Rarity = materials, not labels** — Range Bucket items on plain card stock; Pro Shop on linen; Member's Locker on leather with brass corners; Champion's Cabinet in a framed vitrine. Tier is felt before it's read.
5. **The Trophy Cabinet** — earned exclusives in a glass-front display: visible, desirable, with one line stating exactly how each is earned (never a buy button).
6. **Your Locker** — owned/equip management moves into a slide-in drawer, decluttering the buy grid. Equipped state shown as the item "hanging" in the locker.
7. **Ledger + economy entry cards** — keep at bottom, unchanged (recent-activity grouping and the Wagers/Bounties/Challenges/Rich List cards already work).
8. **Disclaimer** — the cosmetic-only/zero-cash-value line stays verbatim (legal posture, non-negotiable).

**Migration of the existing 74 items:** grandfather everything owned (no clawbacks, ever). Retire ~50 flat-color variants from sale; keep the best ~15 (animated rings, the theme-paired banners, Gold Foil, the reserved titles) shelved under a small "Paint Locker" rail. Reserved titles (The Ace, The Original Four, The Commissioner) move into the Trophy Cabinet where they belong.

**Engineering grounding (all hooks exist or are one key away):** `equippedCosmetics` map gains `nameplate`, `teemarker`, `flair`, `voice` keys; `reserved:true` flag already supported for not-for-sale items; add `earnedBy` + `availableUntil` fields for Cabinet/seasonal; rendering is already centralized through `renderAvatar`/`renderUsername`/`getPlayerCardCss` so new categories slot into known seams. Purchase/equip plumbing (`purchaseCosmetic`, `equipCosmetic`, Firestore increment + arrayUnion + transaction log) carries over unchanged.

---

## Sources

- [Fortnite Item Shop — Fortnite Wiki](https://fortnite.fandom.com/wiki/Item_Shop) · [Cosmetic Items — Fortnite Wiki](https://fortnite.fandom.com/wiki/Cosmetic_Items) · [All Fortnite Cosmetics — Fortnite.GG](https://fortnite.gg/cosmetics)
- [Goal Explosion — Rocket League Wiki](https://rocketleague.fandom.com/wiki/Goal_Explosion) · [Rocket League items overview](https://rocketleaguecars.wordpress.com/rocket-league-items/) · [Competitive season rewards](https://grokipedia.com/page/Competitive_season_rewards_Rocket_League) · [Rarest RL items](https://www.thespike.gg/rocket-league/rarest-items)
- [Discord: Nameplates Land in the Shop](https://discord.com/blog/nameplates-land-in-the-shop) · [Avatar Decorations FAQ](https://support.discord.com/hc/en-us/articles/13410113109911-Avatar-Decorations-FAQ) · [Shop FAQ](https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ)
- [CNBC on Sleeper's mascot economy](https://www.cnbc.com/2019/08/25/sleeper-casual-fantasy-football-start-up-battling-yahoo-and-espn.html) · [Sleeper team avatar support doc](https://support.sleeper.com/en/articles/4427480-how-do-i-change-my-team-name-and-photo)
- [Strava Verified Badge](https://www.strava.com/verifiedbadge) · [Strava Subscriber Perks](https://www.strava.com/subscription/perks) · [Strava badge community guide](https://communityhub.strava.com/welcome-tour-88/community-guide-to-badges-3285)
- [Cosmetic purchase-motivation research (Wiley, 2025)](https://onlinelibrary.wiley.com/doi/10.1002/cb.2490) · [Skin-pricing psychology](https://www.alibaba.com/product-insights/why-are-skins-in-games-so-expensive-the-psychology-of-microtransactions.html) · [Game-economy design handbook](https://medium.com/@wiserax2037/i-designed-economies-for-150m-games-heres-my-ultimate-handbook-de6212e95759)

**Codebase grounding:** `C:\Users\Zach\smoky-mountain-open\src\pages\shop.js` (current 74-item catalog + page) · `C:\Users\Zach\smoky-mountain-open\src\core\parcoins.js` (PARCOIN_RATES, awardCoins/deductCoins) · `C:\Users\Zach\smoky-mountain-open\src\core\router.js` (playerFrameColor / playerRingClass / getPlayerBannerCss / getPlayerCardCss / getPlayerNameClass / renderAvatar / renderUsername) · `src\pages\members-detail.js` (displayBadges, 3 slots).
