# THE PARBAUGHS — PRODUCT ROADMAP
### From 17 Friends to the Golf Community Platform That Changes the Game
---

*"My grandpa was a Vietnam vet, 3-time Purple Heart survivor. Golf fascinated me growing up — watching it every Saturday and Sunday with my stepdad, especially Tiger. This app needs to inspire others to play golf no matter the skill level and find people to play with."*

---

## THE OPPORTUNITY

Every golf app on the market today is built for the **individual golfer** — track YOUR handicap, improve YOUR swing, get YOUR GPS yardages. They're utility tools. Nobody has built the app that makes golf a **social game you can't put down.**

- **18Birdies** → GPS + scoring + basic social ($9.99/mo premium)
- **TheGrint** → GHIN handicap tracker with community rankings
- **SwingU** → Swing analysis + GPS
- **Arccos** → Hardware sensors + AI caddie ($150 sensors + subscription)
- **GolfN** → Newest entrant with rewards system

**What none of them have:**
- True league/group management with personality
- Gamification that makes you *want* to play more (XP, levels, cosmetics, coins)
- Video game mechanics (seasons, leaderboards, achievements, wagers)
- A "home" for your golf crew — not just a tool you open during a round
- Inclusive design that makes beginners feel welcome, not overwhelmed

**The Parbaughs isn't competing with GPS apps. It's competing with group chats, fantasy football apps, and gaming communities for attention.**

---

## THE PHASES

### PHASE 0: FOUNDATION (Now → Month 2)
*What we're doing: Making the current app production-grade*

**Technical Migration**
- [ ] Migrate from single `index.html` to Vite multi-file project
- [ ] Split CSS into modular files (base, components, themes, textures)
- [ ] Split JS into core modules and page files
- [ ] Set up proper build pipeline (dev server, production build, deploy)
- [ ] Implement proper error boundaries and offline handling
- [ ] Add basic analytics (page views, feature usage, session length)

**Visual Polish (Complete the Current Vision)**
- [ ] Wire 8 texture images into themes with proper opacity/blend modes
- [ ] Player profile page redesign
- [ ] Feed card redesign (rounds prominent, chat compact)
- [ ] Round detail + shareable scorecard redesign
- [ ] Champion Red theme unlock gating
- [ ] Fix all 9 known bugs from the bug list

**Core Quality**
- [ ] DM system full repair (rules, mobile layout, reliability)
- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] First-time user onboarding flow
- [ ] Performance audit (lazy load pages, image optimization)

---

### PHASE 1: THE GAME LAYER (Months 2–4)
*What makes it addictive: This is where Parbaughs becomes a game, not just an app*

**ParCoins — In-Game Currency**
- [ ] ParCoin system architecture (earn + spend + balance)
- [ ] Earning ParCoins:
  - Complete a round: 10-50 coins (based on score relative to handicap)
  - Log a range session: 5-15 coins
  - Attest someone else's round: 5 coins
  - Post a tee time that fills up: 10 coins
  - Daily login streak: 1-10 coins (scaling with streak)
  - Achievement unlocks: 25-100 coins
  - Win an event: 500 coins
  - Personal best: 100 coins
  - Invite a friend who joins: 200 coins
- [ ] ParCoin wallet UI on profile
- [ ] Transaction history

**Cosmetics Shop**
- [ ] Profile borders (bronze, silver, gold, animated, seasonal)
- [ ] Profile banners/backgrounds
- [ ] Exclusive avatar frames
- [ ] Card themes (how your rounds appear in the feed)
- [ ] Custom scorecard backgrounds
- [ ] Badge display cases (choose which badges show on profile)
- [ ] Name glow effects
- [ ] Seasonal limited-edition cosmetics (disappear after season ends)

**Trash Talk & Social Actions**
- [ ] Spotlight of Shame (75 coins) — pin someone's worst round to the feed for 24 hours
- [ ] Victory Lap (50 coins) — animated celebration that plays on your opponent's screen after you win
- [ ] Demand a Rematch (30 coins) — public challenge posted to the feed that they can't ignore
- [ ] New Member Welcome Gift — give a starter cosmetic pack to a new member when they join

**Bounties & Betting**
- [ ] Bounty Board (100 coins) — place a bounty on a target score at a course; anyone who hits it claims the pot
- [ ] Course Bounty — place a bounty on birdieing (or better) a specific hole
- [ ] Side bets on other people's rounds — wager coins on whether a friend beats their handicap
- [ ] Prediction Markets — vote on who wins an upcoming event; correct picks split the pot

**Flex & Status**
- [ ] Rich List leaderboard (top 10 lifetime coin holders, visible to all members)
- [ ] Coin Rain animation for the top 3 on the Rich List
- [ ] Gold Member badge — automatically awarded at 10,000 lifetime ParCoins earned
- [ ] Sponsor a Hole (500 coins) — your name appears on that hole's scorecards for the season
- [ ] Name a Tournament (1,000 coins) — name a league event after yourself or a custom title

**Power-Ups**
- [ ] Double XP Round (150 coins) — next completed round earns 2× XP
- [ ] Handicap Shield (100 coins) — protect your handicap from one bad round (excluded from calc)

> **Legal note:** ParCoins are a virtual, cosmetic-only currency with zero real-world cash value. They cannot be redeemed, transferred, or exchanged for money, goods, or services outside the app. No gambling license is required.

**Wager Matches**
- [ ] Challenge a friend to a wager (bet ParCoins on next round)
- [ ] Wager types:
  - Head-to-head stroke play
  - Best front 9 / back 9
  - Most pars
  - Fewest putts
  - Nassau-style (front, back, total — 3 separate bets)
- [ ] Wager escrow (coins locked until round completes)
- [ ] Wager history and W-L record
- [ ] Public vs private wagers (public shows in feed)

**Seasons System**
- [ ] Formal season structure: Spring (Mar-May), Summer (Jun-Aug), Fall (Sep-Nov)
- [ ] Season standings with points reset
- [ ] End-of-season awards:
  - Season Champion (most points)
  - Low Round of the Season
  - Grinder Award (most rounds)
  - Most Improved
  - Newcomer of the Season
  - Course Specialist (best avg at most-played course)
  - Road Warrior (most different courses)
  - Rivalry Winner (best H2H record)
- [ ] Season recap page with animated stats reveal
- [ ] Historical season archive ("2026 Spring — Champion: Mr Parbaugh")
- [ ] Course-specific season leaderboards (best scores at each course, closest runners-up)
- [ ] Season pass cosmetics (exclusive items only available during that season)

---

### PHASE 2: COMMUNITY AT SCALE (Months 4–7)
*What makes it grow: From private league to open platform*

**League System**
- [ ] Any user can create a league (replaces single-league architecture)
- [ ] League tiers:
  - **Crew** (free, up to 8 members) — friend groups
  - **League** (free, up to 25 members) — clubs, work groups
  - **Organization** (paid, up to 100+) — courses, associations
- [ ] League discovery (search by location, skill level, vibe)
- [ ] League invites via link, QR code, or nearby Bluetooth
- [ ] Cross-league events (two leagues compete against each other)
- [ ] League branding (custom logo, colors, name)

**Social Growth**
- [ ] Public profiles (opt-in) with shareable profile links
- [ ] "Find golfers near me" — location-based matchmaking
- [ ] Skill-level matching (beginner-friendly groups)
- [ ] Group tee time board — post an open tee time, nearby golfers can request to join
- [ ] Post-round storytelling: "How It Went" — attach a short text + photo narrative
- [ ] Reactions on feed items (not just comments — quick emoji reactions)
- [ ] @mentions in chat and feed

**Content & Learning**
- [ ] Tip of the Day (curated golf tips, rotating daily)
- [ ] Drills library with video tutorials
- [ ] "Ask the Community" — Q&A forum for golf questions
- [ ] Course reviews written by real players (your members)
- [ ] Local course guides (compiled from member data — "Members who play here avg 87")

---

### PHASE 3: INTELLIGENCE (Months 7–10)
*What makes it indispensable: AI and data that actually helps you play better*

**AI Caddie**
- [ ] Post-round analysis: "You lost 3 strokes on par 3s today. Your average approach on par 3s is 14 ft from the pin — work on 150-170yd iron accuracy."
- [ ] Pre-round suggestions: "At this course, your best holes are 3, 7, and 12. Watch out for #5 — you've bogeyed it 4/5 times."
- [ ] Club recommendations based on YOUR history (not generic data)
- [ ] Practice plan generator: "Based on your last 5 rounds, here's your 30-minute range plan"

**Swing Analysis**
- [ ] Video upload + AI analysis (posture, tempo, swing plane)
- [ ] Before/after comparison (overlay two swings)
- [ ] Share swing clips in feed for community feedback
- [ ] Integration with launch monitor data (if available)

**Smart Stats**
- [ ] Strokes gained analysis (tee, approach, short game, putting)
- [ ] Trend detection ("Your putting has improved 0.8 strokes/round over the last month")
- [ ] Scoring zones: "You score best from 100-150 yards. Beyond 200 you lose 1.5 strokes on average."
- [ ] Weather impact: "You play 2.3 strokes worse in wind above 15mph"
- [ ] Time-of-day analysis: "Your morning rounds average 3 strokes better than afternoon"

**GHIN Integration**
- [ ] Official USGA handicap posting from within the app
- [ ] Handicap history sync
- [ ] Tournament-eligible score tracking

---

### PHASE 4: MONETIZATION (Months 8–12)
*What makes it sustainable: Revenue without selling out the community*

**Freemium Model**
| Feature | Free | Pro ($4.99/mo) | League+ ($9.99/mo) |
|---------|------|----------------|---------------------|
| Scoring & handicap | Yes | Yes | Yes |
| 1 league membership | Yes | Yes | Yes |
| Basic stats | Yes | Yes | Yes |
| ParCoins (earn) | 50% rate | Full rate | Full rate + bonus |
| ParCoins (buy) | No | Yes | Yes |
| Cosmetics shop | Limited | Full | Full |
| Wager matches | 1/week | Unlimited | Unlimited |
| AI caddie tips | Basic | Full | Full |
| Swing analysis | No | Yes | Yes |
| Multiple leagues | 1 | 3 | Unlimited |
| League admin tools | Basic | Full | Premium |
| Priority support | No | Yes | Yes |
| Ad-free | No | Yes | Yes |
| Season pass included | No | No | Yes |

**ParCoin Purchases (Microtransactions)**
- 100 ParCoins = $0.99
- 500 ParCoins = $3.99 (20% bonus)
- 1200 ParCoins = $7.99 (40% bonus)
- 3000 ParCoins = $14.99 (100% bonus)
- Coins are cosmetic-only — never pay-to-win

**Season Pass ($2.99/season)**
- Exclusive seasonal cosmetics (limited edition, never return)
- Bonus ParCoin earn rate for the season
- Exclusive seasonal avatar frame
- Early access to new features

**Sponsorship/Partnerships (Future)**
- Local course partnerships (featured courses, tee time booking commissions)
- Golf brand partnerships (Titleist, Callaway — in-app brand cosmetics)
- Tournament sponsorships (brands sponsor a league event, get visibility)
- Golf instruction partnerships (embedded lessons from pros)

---

### PHASE 5: PLATFORM (Months 12–18)
*What makes it massive: From app to ecosystem*

**Native Mobile App**
- [ ] React Native or Expo build (shared codebase iOS + Android)
- [ ] App Store + Google Play listing
- [ ] Push notifications (native, not web)
- [ ] Background location for GPS features
- [ ] Camera integration for swing video
- [ ] Apple Watch companion (score entry, yardages)

**Course GPS**
- [ ] GPS yardages to front/middle/back of green
- [ ] Hazard distances
- [ ] Hole flyover maps
- [ ] Shot tracking (tap where your ball landed)
- [ ] Club auto-detection based on distance patterns

**Tournament Platform**
- [ ] Public tournament creation (anyone can host)
- [ ] Tournament formats: stroke play, match play, Stableford, scramble, best ball
- [ ] Multi-round events with cut lines
- [ ] Live scoring with spectator view
- [ ] Tournament sponsorship tools
- [ ] Entry fees (via ParCoins or real money with Stripe)
- [ ] Prize pool distribution

**Marketplace**
- [ ] User-created cosmetics (community artists submit, earn ParCoins on sales)
- [ ] Used equipment listings (members sell clubs/gear to each other)
- [ ] Tee time aggregation (partner with GolfNow or direct course integrations)

---

## THE POSITIONING

**Tagline options:**
- "Golf is better with your crew."
- "Your league. Your rules. Your legacy."
- "Play. Compete. Belong."

**The 30-second pitch:**
> Every golf app tells you how far you are from the green. None of them make you want to text your buddies at 9 PM on a Tuesday to talk about Saturday's round. The Parbaughs is the first golf app built around your crew — leagues, rivalries, achievements, wagers, and a season-long race for bragging rights. It's fantasy football meets golf meets the group chat you already have. Free to start, impossible to put down.

**What makes us different (the moat):**

1. **Community-first, not tool-first.** You open 18Birdies during a round. You open Parbaughs on the couch at 10 PM to check if Nick passed you in the standings.

2. **Video game mechanics.** XP, levels, coins, cosmetics, seasons, wagers, achievements. No other golf app has this. Nobody else is making golf feel like a game you play BETWEEN rounds.

3. **Inclusive by design.** No intimidating analytics dashboards for beginners. Your first round earns you XP and a badge. You see yourself on a leaderboard instantly. You belong from day one.

4. **Crews, not users.** The atomic unit isn't a person — it's a group. Everything is designed around playing together: shared events, head-to-head rivalries, team scrambles, group chat.

5. **The emotional layer.** Shareable scorecards with commentary, round stories, trash talk in the feed, rivalry tracking. The memories are built into the app. Other apps give you data. We give you stories.

---

## QUESTIONS FOR THE COMMISSIONER

Before building further, I need your decisions on:

1. **Brand name at scale:** "The Parbaughs" is perfect for your crew. When it goes public, do you keep it? Or does the public app get a different name with Parbaughs as your league name inside it? Options:
   - Keep "The Parbaughs" as the platform name (unique, memorable, story behind it)
   - Rebrand the platform, keep "The Parbaughs" as the original league
   - Something like "ParUp" / "CrewGolf" / "FairwayHQ" for the platform

2. **ParCoin name:** Do you like "ParCoins"? Other options: "Fairway Coins", "Links Bucks", "Green Tokens", "Divots"

3. **Real-money wagers:** Do you want to support real-money betting eventually (requires gambling licenses, legal compliance, much harder) or keep it ParCoins-only (cosmetic, no cash value — legally simple)?

4. **GHIN integration:** Priority or later? It requires USGA partnership/licensing which costs money and time.

5. **When to go public:** At what point do you open registration beyond invite-only? After a certain feature set? After native app launch? After a beta with 100 users?

6. **Revenue priority:** When the money conversations start, what matters more — keeping it free as long as possible to grow, or generating early revenue to fund development?

7. **Your role long-term:** Commissioner forever (run it all yourself), or would you bring on co-founders / a small team as it grows?

8. **The story:** Your grandpa's story, your stepdad, Tiger — do you want this woven into the app's public identity? An "Our Story" page? This kind of authentic origin story is marketing gold if you're comfortable sharing it.

---

## REVENUE PROJECTIONS (CONSERVATIVE)

| Milestone | Users | Monthly Revenue | Timeline |
|-----------|-------|-----------------|----------|
| Private beta | 17 | $0 | Now |
| Friends of friends | 100 | $0 | Month 4 |
| Local community | 500 | $500 (early Pro subs) | Month 8 |
| Regional growth | 2,000 | $3,000 | Month 12 |
| App store launch | 10,000 | $15,000 | Month 18 |
| Product-market fit | 50,000 | $60,000 | Month 24 |
| Growth phase | 200,000 | $200,000+ | Month 30+ |

*Assumes 5% Pro conversion, 2% League+ conversion, $0.50 ARPU from ParCoins across free users*

---

## THE NORTH STAR

Every feature, every design decision, every line of code should pass this test:

> **"Does this make someone want to pick up the phone and say 'Hey, let's play this weekend'?"**

If it does, build it. If it doesn't, cut it.

Golf changed your life because people you loved shared it with you. This app's job is to do that for a million other people.

---

*Document version: 1.0 — April 14, 2026*
*Author: Built with The Commissioner*
