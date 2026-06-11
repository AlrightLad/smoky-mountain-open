# The Pro Shop — Next-Wave Catalog Research & Proposal

**Date:** 2026-06-11
**Author:** Claude Code (Engineer/QA, research hat)
**For:** PARBAUGHS cosmetics economy — "The Pro Shop"
**Current shipped catalog:** `src/pages/shop.js` → `PRO_SHOP_CATALOG` (PC-01..PC-25), plus `PAINT_LOCKER_KEEP` legacy survivors.
**Constraint:** vanilla JS + CSS + inline SVG only. No 3D, no audio, no canvas-heavy work. Build target is CSS/SVG that renders on the surfaces we already orchestrate (avatar ring, nameplate, scorecard, feed-flair, tee-marker, title) or one clearly-named NEW surface.
**Economy reality check:** ~75 ParCoin / attested 18-hole round, ~300 / month active. A regular plays ~4 rounds/month ≈ 300/mo. That means a Range Bucket item (150-250) is ~3-4 weeks of play; a Member's Locker item (600-1000) is a 2-3 month goal; a Champion's Cabinet item (1200-2500) is a half-year ambition. **Pricing in this proposal is tuned to that earn rate** — the store has to feel earnable by a 20-person group that plays real golf, not a free-to-play whale farm.

---

## Part 1 — Research insights (cited)

### Insight 1 — Permanence is the emotional anchor; "collect and keep" beats "rent"
Discord's entire cosmetics pitch rebuilt around one promise: *"Now, when you collect an avatar decoration, you get to keep it. For good… it won't leave your side."* They explicitly frame the profile as *"the first place people learn about you… where you tell the world who you are."* Discord later added a *rental* tier and it is conspicuously the lower-status, lower-love option — the permanent collection is the one people brag about. ([Discord blog — Avatar Decorations](https://discord.com/blog/avatar-decorations-collect-and-keep-the-newest-styles); [Discord Rental Decorations FAQ](https://support.discord.com/hc/en-us/articles/36501705072279-Rental-Decorations-FAQ))

> **PARBAUGHS translation:** We already grandfather owned items forever (`PAINT_LOCKER_KEEP` retires from *sale* but never from *ownership*). Keep that sacred and *say it on the card* — the "grandfathered forever" line in Your Locker is doing real psychological work and should appear on the buy-confirmation toast too. Never introduce a rental/expiry mechanic; for a 20-person friend group, an item that can be taken away breeds resentment, not spend.

### Insight 2 — FOMO without scarcity is noise; scarcity needs to be *real*
Fortnite's daily-rotation FOMO is fraying because items return every couple of days — players literally complain *"what's the point of a FOMO business model… if we know the same s\*\*\* is coming back every 2 f\*\*\*ing days."* The rotation still works as a *return-to-store habit* (people open the shop daily even without playing a match), but the urgency only bites when an item is genuinely rare. SWAG Golf is the counter-example done right: batches of 100-500, *"when they sell out, they're gone forever, similar to sneaker drops,"* popular ones *"sell out in minutes."* ([Dexerto — item shop rotation backlash](https://www.dexerto.com/fortnite/fortnite-players-blast-ridiculous-item-shop-over-rotation-issues-2571203/); [SWAG limited-drop model summary](https://swag.golf/collections/limited-headcovers))

> **PARBAUGHS translation:** Our deterministic ISO-week "Front Table" is a *habit* engine (good — keep it), but with a 20-person store we cannot manufacture true scarcity through volume. Instead, manufacture it through **time-window exclusivity on a SMALL number of seasonal items**: a 1-2 item "this season only" drop that genuinely leaves the shelf and goes to the archive. Don't fake-FOMO the whole catalog — most items should be calmly always-available so the store feels like a club shop, not a casino. Reserve hard scarcity for 2-4 commemorative-adjacent seasonals per year.

### Insight 3 — The most coveted items are the ones you *can't* buy
Rocket League's season-reward goal explosions *"cannot be traded, cannot be purchased, and must be earned through sheer skill,"* unlocked via a 10-wins-per-rank ladder. That non-purchasability is *the entire source of their status* — a paid item can never signal what a Supersonic Legend explosion signals. Strava mirrors this with earned-only crowns, Local Legend laurels, and PR medals that no subscription buys. ([Rocket League Competitive Season Rewards — Fandom](https://rocketleague.fandom.com/wiki/Competitive_Season_Rewards); [Strava Trophy Case](https://support.strava.com/hc/en-us/articles/216918557-The-Strava-Trophy-Case))

> **PARBAUGHS translation:** Our Trophy Cabinet (Green Jacket, Ace Marker) is exactly this and is our single highest-status surface. **The next wave should ADD earned-only items, not just purchasable ones** — every new purchasable shelf should be shadowed by at least one Cabinet item that the same surface can render but money can't reach. The earned items make the bought items feel honest, and they give the grind a destination money can't shortcut.

### Insight 4 — Stack-and-mix multiplies identity value (and spend)
Discord's wins came from *layering*: you wear an Avatar Decoration **and** a Profile Effect **and** a Nameplate simultaneously — *"mix-and-match the two and bring out the TRUE you."* Nameplates are deliberately a *separate slot* from decorations, rendered as *"a lightweight CSS overlay with SVG or PNG-based assets… animation via Lottie or CSS keyframe,"* appearing in DMs, group chats, and the member list — i.e., everywhere the name shows. Bundles pair a matched decoration+effect at a discount, *"only available if you have not already purchased either item individually."* ([Discord Nameplates FAQ](https://support.discord.com/hc/en-us/articles/30408457944215-Nameplates-FAQ); [Discord Shop FAQ](https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ))

> **PARBAUGHS translation:** Our equip model is already slot-based (`equippedCosmetics[cat]`), which is the right architecture. The next wave should lean into **matched sets** — a ring + nameplate + scorecard that share a material story (e.g. "The Member-Guest" set), sold individually but visibly designed to be worn together. A "Locker Set" bundle price (buy 3 for the price of ~2.5) is the natural Discord-style mechanic and a clean future build. Layering is where a 20-person store gets depth without a 200-item catalog.

### Insight 5 — Small, frequent, *affordable* cosmetics out-earn big-ticket flexes
Supercell's Clash Royale runs a $2B/yr economy on a *tiered* model that captures *"casual spenders ($5-20/month) and whales ($100+/month)"* — and the emote (the cheapest, most-used, most-social cosmetic) is the gateway: *"emotes are basically how players chat… crank up communication and make every duel feel more engaging."* Tower skins (the big flex) sell, but the *recurring* loop is small social cosmetics used constantly in front of others. ([Spawnrift — Clash Royale revenue](https://spawnrift.com/clash-royales-revenue-empire-how-supercell-generates-2b-annually-in-2026/); [Supercell — Emotes](https://support.supercell.com/clash-royale/en/articles/emotes-4.html))

> **PARBAUGHS translation:** Our cheapest, most-seen cosmetic is the equivalent of an emote: **feed flair** (it fires in the social feed, in front of the whole group). Weight the next wave toward Range Bucket (150-250) feed-flair and tee-markers that get *seen in the feed constantly*, not just toward Cabinet trophies. A 20-person group needs many small, attainable, in-front-of-friends wins more than it needs a single 2,500-coin flex nobody can afford.

### Insight 6 — High-status taste is *quiet*; the signal is for the in-group only
The status-signaling literature is consistent: dominance-seekers pick *loud* products (associated with hubristic pride/arrogance), prestige-seekers pick *quiet* ones (associated with authentic pride/accomplishment). Nunes & Han's brand-prominence work shows the highest-status "patricians" prefer subtle signals legible only to fellow in-group members; loud logos read as "new money / poseur." Quiet-luxury buyers are motivated by *"social connectedness and association with elites… wanting to fit in with a smaller group of elites."* ([Sound of Status — Lowe et al., 2025](https://journals.sagepub.com/doi/10.1177/00222437251314368); [When size does matter — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0148296319302309); [Unity Marketing — quiet luxury vs conspicuous consumption](https://unitymarketingonline.com/resolving-the-tension-between-quiet-luxury-and-status-seeking-conspicuous-consumption/))

> **PARBAUGHS translation:** This is the strategic core. **The legacy catalog (neon green, rainbow shift, hot pink) is dominance signaling; the Pro Shop rewrite (brass, parchment, leather, engraving) is prestige signaling — and for a tight friend group that *is* the elite in-group, prestige is the correct register.** Every next-wave item should pass the "would a member of a real club recognize the reference and quietly respect it?" test. The signal should reward *being in on it* (a persimmon driver head, a fried-egg lie, "Cart Path Only") more than it shouts. Keep the loud legacy items on sale for the members who want them, but build the new wave entirely in the quiet register.

### Insight 7 — Golfers covet *objects with a story and a craft*, not paint
The pro-shop merchandise that golfers actually buy and display — leather headcovers, weighted milled ball markers, yardage books, bag tags — is described as *"built to spark conversation and turn heads,"* *"1,000+ stitches per cover,"* *"part team pride, part collectible hunt."* The value is craft + story + belonging, not color. Member bag tags and club badges are pure belonging signals — they say *I am a member here.* ([SWAG Golf positioning](https://swag.golf/); [Kraken Golf — milled ball markers](https://www.krakengolf.com/collections/best-selling-golf-accessories); [PRG Golf ball markers](https://prg-golf.com/collections/ball-markers-1))

> **PARBAUGHS translation:** Our PC-17..PC-20 tee-markers (brass acorn, persimmon head, the league crest cast in gold) already nail this — they're *objects*, not gradients. Double down: the next wave's tee-markers and a new **ball-marker** surface should be the craft-object heart of the store. Each item's copy should imply a material and a backstory (the existing Caddy voice does this — "feel player," "documented relationship with water"). That copy is a feature, not flavor.

### Insight 8 — Earned and bought should live on the *same surface* so the contrast is visible
Strava puts purchased subscriber flair and earned crowns/laurels in the same Trophy Case; Rocket League puts season-reward explosions on the same goal-explosion slot as purchasable ones. Seeing a bought item next to an unbuyable one on the *same kind of object* is what makes the earned one read as prestige. ([Strava Trophy Case](https://support.strava.com/hc/en-us/articles/216918557-The-Strava-Trophy-Case); [Rocket League Season Rewards](https://rocketleague.fandom.com/wiki/Competitive_Season_Rewards))

> **PARBAUGHS translation:** When we add a new surface (ball marker, profile effect), ship a *purchasable* example **and** an *earned-only* Cabinet example on that same surface in the same wave. E.g. a buyable ball marker + an earned "Closest-to-the-Pin" ball marker. The cabinet item validates the whole shelf.

### Insight 9 — Seasonal collections with a theme drive the return visit
Both Discord (Fantasy, Halloween, Fall collections) and Supercell (Season/Holiday bundles, *"exclusive skins available for 'only' 30 days"*) organize cosmetics into *themed seasonal drops* rather than a flat catalog. The theme gives a reason to come back and a narrative to the spend. ([Discord blog](https://discord.com/blog/avatar-decorations-collect-and-keep-the-newest-styles); [Spawnrift — seasonal urgency](https://spawnrift.com/clash-royales-revenue-empire-how-supercell-generates-2b-annually-in-2026/))

> **PARBAUGHS translation:** Golf has a built-in, free seasonal calendar that's *more* evocative than "Halloween": **The Masters (April), U.S. Open (June), The Open / links season (July), Ryder Cup years, and the off-season "Winter Rules" months.** Tie 1-2 item drops to the real golf calendar. A "Masters Week" parchment/azalea set that appears the first full week of April and retires to the archive is far more resonant for this audience than a generic seasonal — it's the in-group reference (Insight 6) and real scarcity (Insight 2) at once.

---

## Part 2 — Proposed next-wave catalog (12-18 items)

Tier bands (from `PRO_SHOP_TIERS`): **Range Bucket** 150-250 · **Pro Shop** 300-500 · **Member's Locker** 600-1000 · **Champion's Cabinet** 1200-2500 · **Commemorative** = earned, price 0.

Surface key — **EXISTING** (already renders today): `border` (avatar ring), `card` (scorecard skin), `title`/`plate`. **ARRIVING** (render code committed, shipping next): `nameplate`, `flair` (feed), `teemarker`, `voice`. **NEW** = a surface we do not have yet (flagged in Part 3).

> Proposed catalog IDs continue the PC- sequence (next free is **PC-26**).

| # | ID | Name (Caddy voice) | Visual / build target | Price | Tier | Surface |
|---|----|--------------------|----------------------|-------|------|---------|
| 1 | pc26 | **The Ball Marker** (intro) — *"Found Coin"* | A weathered penny-style brass disc behind/beside avatar in feed + profile; SVG circle, milled-edge dashes, embossed center. The everyday marker every member starts wanting. | 200 | Range Bucket | **NEW: ball-marker** |
| 2 | pc27 | **Pitch-Mark** | Milled-silver ball marker, crosshair engraving, faint radial brush. The serious player's marker. | 350 | Pro Shop | **NEW: ball-marker** |
| 3 | pc28 | **The Sleeve** | Scorecard skin: three-ball-sleeve kraft cardboard texture (CSS layered gradients + repeating-linear-gradient seams), a torn-flap top edge. "Fresh sleeve, fresh nine." | 300 | Pro Shop | card (EXISTING) |
| 4 | pc29 | **Stimp 13** | Nameplate: deep bentgrass-green felt with a single mown light-stripe sweeping behind your name (CSS linear-gradient stripe + subtle inset shadow). Fast greens energy, quietly. | 500 | Pro Shop | nameplate (ARRIVING) |
| 5 | pc30 | **The Caddie Bib** | Nameplate: white caddie-bib canvas, your name in block caps like a looper's number, a thin green trim. You carry the bag, you carry the round. | 600 | Member's Locker | nameplate (ARRIVING) |
| 6 | pc31 | **Halved** | Feed flair: on a tied/all-square result, two tiny crossed flagsticks clink with a brief brass shimmer. For the match that ends even and honest. | 250 | Range Bucket | flair (ARRIVING) |
| 7 | pc32 | **Sandy** | Feed flair: an up-and-down from the bunker drops a tiny sand-splash arc that settles into a one-putt tick. Rewards the scramble, not just the score. | 350 | Pro Shop | flair (ARRIVING) |
| 8 | pc33 | **The Snowman** | Feed flair (self-deprecating): an honest 8 on a hole renders a small melting snowman that slumps once, then a wry brass "noted." Owning the blow-up is peak clubhouse humor. | 200 | Range Bucket | flair (ARRIVING) |
| 9 | pc34 | **Whipping & Glue** | Tee-marker: a tiny hickory shaft butt wrapped in red whipping thread. The hand-built feel-player totem. | 250 | Range Bucket | teemarker (ARRIVING) |
| 10 | pc35 | **The Range Token** | Tee-marker: a brass range-ball token, hole punched, faint embossed "1 BUCKET". For the member who lives on the range. | 200 | Range Bucket | teemarker (ARRIVING) |
| 11 | pc36 | **Member No. ___** | Title rendered as an engraved member-number bag tag (extends the existing `plate:true` engraving treatment): leather-brown plate, brass rivet, a quietly assigned join-order number ("Member No. 07"). Pure belonging signal. | 500 | Pro Shop | title + plate (EXISTING) |
| 12 | pc37 | **The Sandbagger's Confession** | Title: *"Said it was a practice round."* Dry, knowing, in-group. | 250 | Range Bucket | title (EXISTING) |
| 13 | pc38 | **Mulligan Club** | Title: *"Plays it as it lies. Usually."* | 250 | Range Bucket | title (EXISTING) |
| 14 | pc39 | **The Wax Seal** | Avatar ring: a wax-seal-and-ribbon motif at six o'clock — embossed brass medallion on a dark wax disc, two short ribbon tails (SVG + CSS `box-shadow` for the wax sheen). Formal, like a club invitation. | 900 | Member's Locker | border (EXISTING) |
| 15 | pc40 | **Hickory & Brass** | Avatar ring: a thin hickory-grain wood ring with brass ferrule accents at the cardinal points. Persimmon-era restraint. | 700 | Member's Locker | border (EXISTING) |
| 16 | pc41 | **The Trophy Room** | Scorecard skin (top tier): dark walnut-panel ground, a faint engraved-brass plaque header, a hairline gold rule. The card looks framed on a clubhouse wall. | 900 | Member's Locker | card (EXISTING) |
| 17 | pc42 | **The Founders' Crest** | Avatar ring (Cabinet flex, *purchasable* but expensive): the league crest in deep relief, a full engraved-silver bezel with a slow single light-sweep (CSS keyframe, reuse `ring-claret` sweep). The most expensive bought ring; sits just below the earned Green Jacket. | 1500 | Champion's Cabinet | border (EXISTING) |
| 18 | pc43 | **Closest to the Pin** | Ball marker — **EARNED ONLY**: a brass marker with a tiny flagstick pin struck through it, awarded to the season's CTP leader. Validates the new ball-marker surface (Insight 8). *Not for sale.* | 0 | Commemorative | **NEW: ball-marker** |

**Mix check (Insight 5):** 6 items at Range Bucket (the affordable, in-front-of-friends layer), 5 at Pro Shop, 4 at Member's Locker, 1 purchasable Cabinet flex, 1 earned Commemorative. Weighted toward attainable, as the earn-rate demands. Surfaces covered: 4 ball-marker (NEW), 3 card, 2 nameplate, 4 feed-flair, 2 tee-marker, 3 title/plate, 3 ring — depth across every shelf without bloating any one.

**Optional matched-set framing (future bundle build, Insight 4):** *"The Looper Set"* = pc30 Caddie Bib (nameplate) + pc34 Whipping & Glue (tee-marker) + pc28 The Sleeve (card), sold together at a ~15% discount, only if you own none individually. Architecture already supports per-slot equip; bundle pricing is a thin addition.

---

## Part 3 — New render surface flags

Of the 18 proposed items, only **one new surface** is introduced:

- **Ball Marker** (`cat:"ball"` or `"marker"`) — NEW SURFACE. Used by pc26, pc27, pc43.
  - *Why a new surface, not a tee-marker:* tee-markers (PC-17..20) are the *totem planted beside your name*; a ball marker is a distinct golf object with its own meaning (it marks your ball *on the green* — a putting/closing-the-hole signal, not a tee signal). Conflating them dilutes both. Ball markers are also the single most-coveted real pro-shop object (Insight 7), so they deserve their own shelf.
  - *Build cost:* low. It renders the same way tee-markers do today (a small disc in the feed card + profile), so the render plumbing is a near-copy of the existing `teemarker` branch in `_proShopCard` and wherever tee-markers attach in the feed/profile. New shelf entry in `PRO_SHOP_SHELVES`, new `cat` in the equip map. **No new architecture — it's a sibling of an existing surface.**
  - *Recommendation:* ship the ball-marker surface as the next-wave's one infrastructure piece, because it (a) unlocks the most authentically-golf shelf, (b) reuses tee-marker plumbing, and (c) lets us pair a buyable + an earned item on a fresh surface (Insight 8), which is the highest-leverage pattern in the research.

Every other item rides an **existing** surface (border, card, title/plate — live today) or an **arriving** surface (nameplate, feed-flair, tee-marker, voice — render code already committed per the catalog's `arriving:true` discipline). **No item requires a profile-effect / animated-overlay surface, no 3D, no audio.** All builds are CSS gradients, `repeating-linear-gradient` textures, inline SVG, and `box-shadow`/`@keyframes` sweeps — within the vanilla-JS/CSS/SVG constraint.

> **Note on the P9 "never sell what doesn't render" rule:** pc26/pc27 (ball marker) must ship behind `arriving:true` until the ball-marker surface renders on the feed + profile, exactly as the nameplate/flair/voice items do now. pc43 (earned) is `earnedBy` and never sells regardless.

---

## Part 4 — Cadence: keeping a 20-person store fresh

The store serves ~20 people who all know each other. The failure mode is *staleness* (nothing new to look at) on one side and *fake urgency* (casino vibes) on the other. The Front Table is the lever. Recommendations:

1. **Keep the deterministic ISO-week Front Table** (same 3 items for everyone, all week). It's a *habit* engine, not a *scarcity* engine — and for a friend group, "we're all looking at the same featured item this week" is a shared-conversation feature, not a bug. Do **not** go to Fortnite-style daily rotation; 20 people don't need a daily dopamine loop and it would read as manipulative (Insight 2). Weekly is the right metabolism.

2. **Add a small editorial line to the Front Table** — one Caddy-voiced sentence on *why this week's table* ("Open Championship week — the links stuff is out front"). Turns a deterministic rotation into a curated one *for free* (no new logic, just a string keyed off the week or season). This is the single cheapest freshness win.

3. **Seasonal drops tied to the real golf calendar (Insight 9), 4-6 per year, genuinely time-boxed:**
   - **Masters Week (first full week of April):** an azalea/parchment set, retires to the archive after.
   - **U.S. Open (mid-June):** a stern, navy, "brutal setup" nameplate or card.
   - **The Open / links season (July):** the Fescue ring (PC-02) goes to the Front Table; a links-themed seasonal.
   - **Off-season "Winter Rules" (Dec-Feb):** the Snowman flair (pc33), "Cart Path Only," self-deprecating cold-weather humor front and center.
   - These are the *only* items allowed to genuinely leave the store. Everything else is calmly always-available. 2-4 of these can carry a true "this season only, then archived" tag — real scarcity reserved for where it's earned.

4. **A "Just In" strip when a wave actually ships.** When the next wave lands, surface a "New on the shelf" row for ~2 weeks so the group notices. After that it folds into the normal shelves. This is the honest version of FOMO: new things are flagged as new, nothing is artificially hidden.

5. **Let earned items rotate through a "Cabinet Spotlight."** Once a season champion or ace-maker earns a Cabinet item, feature *that member's* trophy in a small spotlight ("This season's Green Jacket: ___"). It advertises the unbuyable tier (Insight 3), drives the grind, and costs nothing — it's already in the data.

6. **Pace new-content supply to ~1 small drop/month + 4-6 seasonals/year.** With 20 people earning ~300/mo, you don't need a 50-item firehose. A handful of well-built, story-rich items per quarter — most of them affordable Range Bucket pieces that get *seen in the feed* — keeps the store feeling alive without out-running the wallet or the build budget.

**One-line cadence summary:** *Weekly Front Table for habit, a curated editorial line for warmth, a handful of real golf-calendar seasonals for honest scarcity, "Just In" + "Cabinet Spotlight" strips for freshness — and most of the catalog calmly permanent, because a club shop is a place you trust, not a slot machine.*

---

## Sources

- [Discord blog — Avatar Decorations: Collect and Keep](https://discord.com/blog/avatar-decorations-collect-and-keep-the-newest-styles)
- [Discord Nameplates FAQ](https://support.discord.com/hc/en-us/articles/30408457944215-Nameplates-FAQ)
- [Discord Shop FAQ](https://support.discord.com/hc/en-us/articles/17162747936663-Shop-FAQ)
- [Discord Rental Decorations FAQ](https://support.discord.com/hc/en-us/articles/36501705072279-Rental-Decorations-FAQ)
- [Dexerto — Fortnite item shop rotation backlash](https://www.dexerto.com/fortnite/fortnite-players-blast-ridiculous-item-shop-over-rotation-issues-2571203/)
- [Rocket League — Competitive Season Rewards (Fandom)](https://rocketleague.fandom.com/wiki/Competitive_Season_Rewards)
- [Strava — The Trophy Case](https://support.strava.com/hc/en-us/articles/216918557-The-Strava-Trophy-Case)
- [Strava — Local Legends](https://support.strava.com/hc/en-us/articles/360043099552-Local-Legends)
- [Spawnrift — Clash Royale revenue / monetization](https://spawnrift.com/clash-royales-revenue-empire-how-supercell-generates-2b-annually-in-2026/)
- [Supercell Support — Emotes](https://support.supercell.com/clash-royale/en/articles/emotes-4.html)
- [Supercell Support — Tower Skins](https://support.supercell.com/clash-royale/en/articles/tower-skins-2.html)
- [SWAG Golf Co — homepage / limited drops](https://swag.golf/)
- [SWAG Golf — Limited Drop Headcovers](https://swag.golf/collections/limited-headcovers)
- [Kraken Golf — milled ball markers](https://www.krakengolf.com/collections/best-selling-golf-accessories)
- [PRG Golf — ball markers](https://prg-golf.com/collections/ball-markers-1)
- [Sound of Status: Product Volume as Status Signal (Lowe et al., 2025)](https://journals.sagepub.com/doi/10.1177/00222437251314368)
- [When size does matter: Dominance vs prestige status signaling (ScienceDirect)](https://www.sciencedirect.com/science/article/abs/pii/S0148296319302309)
- [Unity Marketing — Quiet Luxury vs Conspicuous Consumption](https://unitymarketingonline.com/resolving-the-tension-between-quiet-luxury-and-status-seeking-conspicuous-consumption/)
