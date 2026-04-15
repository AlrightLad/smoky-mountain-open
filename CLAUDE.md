# Parbaughs — Golf League Platform

## Brand

- **Platform name:** Parbaughs (not PlayThru — that name is taken by PlayThru LLC at playthru.golf)
- **The founding league:** "The Parbaughs" — the original 17-member crew from York, PA
- **At scale:** Other users create their own leagues inside Parbaughs. "Start a league on Parbaughs." "Download Parbaughs and join my crew."
- **Merch/branding:** PARBAUGHS
- **Social handles:** @PlayThru_ was claimed but may conflict. Commissioner decision needed: switch to @Parbaughs or @ParbaughsGolf
- **Domain:** Need to secure parbaughs.com or parbaughs.golf (flagged for commissioner)

## The Vision

Parbaughs is an invite-only golf league app for a tight friend group of 17 members based in York, PA. It's not trying to be 18Birdies or GHIN — it's trying to be the app that makes this group of friends play more golf, talk more trash, and build memories together. Every feature should strengthen community over competition. Think country club meets group chat meets fantasy sports.

This app is a labor of love. Treat it with extreme care and pride. It's a core piece of who the commissioner (Zach) is. Quality is non-negotiable.

## Project State

- **Version:** v5.23.2 (as of April 2026)
- **Lines:** ~18,200 (currently single-file `index.html`, migration to Vite multi-file planned)
- **Stack:** Vanilla JS, Firebase Auth + Firestore + Cloud Functions, GitHub Pages
- **Budget:** Zero. No paid services beyond Firebase Blaze plan.
- **Users:** 17 members, mixed iPhone/Android
- **Repo:** `AlrightLad/smoky-mountain-open`
- **Live:** https://alrightlad.github.io/smoky-mountain-open

## Architecture

### Current (Single File)
```
smoky-mountain-open/
├── index.html          ← entire app (~18K lines: CSS + HTML + JS)
├── textures/           ← theme texture images (8 files)
├── watermark.jpg       ← app logo/icon
├── logo.jpg            ← alternate logo
└── CLAUDE.md           ← this file
```

### Target (Vite Multi-File)
```
smoky-mountain-open/
├── index.html              ← HTML shell only
├── vite.config.js
├── public/
│   ├── textures/           ← 8 theme texture images
│   ├── watermark.jpg
│   └── logo.jpg
├── src/
│   ├── main.js             ← entry point
│   ├── core/
│   │   ├── firebase.js     ← auth, firestore, cloud functions
│   │   ├── router.js       ← SPA router system
│   │   ├── data.js         ← PB object (all data access)
│   │   ├── theme.js        ← 8 themes + texture loading + champion unlock
│   │   ├── sync.js         ← firestore sync, presence, connection status
│   │   └── utils.js        ← escHtml, feedTimeAgo, localDateStr, etc.
│   ├── pages/
│   │   ├── home.js
│   │   ├── profile.js
│   │   ├── scorecard.js
│   │   ├── standings.js
│   │   ├── feed.js
│   │   ├── settings.js
│   │   ├── dms.js
│   │   ├── playnow.js
│   │   ├── range.js
│   │   ├── calendar.js
│   │   ├── trophyroom.js
│   │   ├── courses.js
│   │   ├── teetimes.js
│   │   ├── chat.js
│   │   ├── members.js
│   │   ├── scramble.js
│   │   └── records.js
│   ├── components/
│   │   ├── cards.js        ← card, stat-box, feed-row renderers
│   │   ├── nav.js          ← bottom nav + profile bar
│   │   ├── modals.js       ← toasts, share cards, confirmations
│   │   └── skeletons.js    ← loading states
│   └── styles/
│       ├── base.css        ← tokens, global resets
│       ├── components.css  ← cards, buttons, pills, forms
│       ├── themes.css      ← 8 theme color blocks
│       ├── textures.css    ← texture overlays per theme
│       ├── masters.css     ← Masters scorecard special styling
│       └── responsive.css  ← tablet/desktop breakpoints
├── firebase/
│   ├── firestore.rules
│   └── functions/
│       └── index.js        ← searchCourses Cloud Function
└── CLAUDE.md
```

### Firebase Configuration
- **Project ID:** parbaughs
- **Auth:** Email/password, email verification on registration
- **Firestore:** Primary data store, offline persistence DISABLED (caused duplicate entries)
- **Cloud Functions:** Gen1, Node20, us-central1
  - `searchCourses` — GolfCourseAPI proxy (origin-locked CORS — do NOT change runtime or CORS)
  - `sendPushNotification` — triggers on `pendingPush` doc creation, sends FCM push to member's `fcmToken`, deletes doc after. Source: `functions/index.js`
- **Plan:** Blaze (pay-as-you-go)

### Push Notification Deployment
```bash
cd functions && npm install && cd ..
firebase deploy --only functions:sendPushNotification
```
Do NOT redeploy `searchCourses` unless explicitly modifying it — it has CORS and runtime settings that must not change.

### GolfCourseAPI
- **Correct endpoint:** `/v1/search?search_query=`
- **Auth header:** `Authorization: Key [key]`
- **Key stored in:** Firestore `config/api_keys`
- **WRONG endpoint:** `/v1/courses?search=` (non-functional, do not use)
- **CRITICAL:** Zero guessing or padding of par arrays. Only use verified API data.

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function isCommissioner() { return isAuth() && get(/databases/$(database)/documents/members/$(uid())).data.role == "commissioner"; }

    match /members/{memberId} { allow read: if true; allow create: if isAuth() && uid() == memberId; allow update: if isAuth() && (uid() == memberId || isCommissioner()); allow delete: if isCommissioner(); }
    match /rounds/{roundId} { allow read: if isAuth(); allow create: if isAuth() && (request.resource.data.player == uid() || isCommissioner()); allow update, delete: if isAuth() && (resource.data.player == uid() || isCommissioner()); }
    match /dms/{dmId} { allow read, write: if isAuth(); match /messages/{messageId} { allow read, write: if isAuth(); } }
    match /chat/{msgId} { allow read: if isAuth(); allow create: if isAuth(); allow update, delete: if isAuth() && (resource.data.authorId == uid() || isCommissioner()); }
    match /notifications/{notifId} { allow read: if isAuth() && resource.data.toUid == uid(); allow create: if isAuth(); allow update, delete: if isAuth() && resource.data.toUid == uid(); }
    match /invites/{inviteId} { allow read: if isAuth(); allow create: if isAuth(); allow update, delete: if isCommissioner(); }
    match /config/{docId} { allow read: if isAuth(); allow write: if isCommissioner(); }
    match /parcoin_transactions/{txnId} { allow read: if isAuth() && resource.data.uid == uid(); allow create: if isAuth(); allow update, delete: if false; }
    match /pendingPush/{pushId} { allow create: if isAuth(); allow read, update, delete: if false; }
    // Catch-all for other collections
    match /{collection}/{docId} { allow read: if isAuth(); allow write: if isAuth(); }
  }
}
```

## Theme System

8 themes, each with CSS color tokens + texture image + visual identity:

| Theme | Texture | Accent | Unlock |
|-------|---------|--------|--------|
| Classic | `classic-tile.jpg` (gold weave) | Gold `#c9a84c` | Default |
| Camo | `camo-tile.jpg` (woodland leaves) | Flame `#d4943c` | Default |
| Masters | `masters-tile.jpg` (green leather) | Yellow `#fdd835` | Default |
| Azalea | `azalea-tile.jpg` (pink flowers) | Pink `#e8729a` | Default |
| USGA | `usga-tile.jpg` (navy stripes) | Red `#c41e3a` | Default |
| Champion Red | `champion-tile.jpg` (red leather) | Crimson `#d4243c` | **Champions only** |
| Dark | `dark-tile.jpg` (carbon fiber) | Gold `#b89a3e` | Default |
| Light | `light-tile.jpg` (linen) | Gold `#8a6d1e` | Default |

- Themes persist to Firestore `members/{uid}.theme` and localStorage `pb_theme`
- `[data-theme="xxx"]` CSS attribute system overrides `:root` tokens
- `cssVar()` and `cssRgba()` helpers resolve CSS vars for Canvas 2D API
- Champion Red: gated behind `trip.champion` field — only users who have won an event can select it

### CSS Token Architecture
- RGB channel variables: `--gold-rgb: 201,168,76` enabling `rgba(var(--gold-rgb), .1)`
- Semantic colors: `--blue`, `--pink`, `--purple`, `--live`, `--alert`, `--orange`
- Calendar dots: `--cal-event`, `--cal-range`, `--cal-tee`
- Gradient stops: `--grad-hero`, `--grad-deep`, `--grad-card`, `--grad-trophy`
- Spacing: 4px base, 12 stops (`--sp-1` through `--sp-12`)
- Typography: 11 stops (`--text-2xs` through `--text-5xl`)
- Elevation: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`
- Radius: `--radius-sm` through `--radius-full`

### Hole Dot Colors (Static — Never Changes Per Theme)
Hole-by-hole performance dots rendered on Round History, feed cards, and share cards:

| Result | Color | Hex |
|--------|-------|-----|
| Eagle or better (score <= par-2) | Gold | `#FFD700` |
| Birdie (score = par-1) | Green | `#4CAF50` |
| Par (score = par) | Gray | `#888888` |
| Bogey (score = par+1) | Orange | `#F59E42` |
| Double bogey+ (score >= par+2) | Red | `#E53935` |

These are hardcoded hex values, NOT CSS variables. They must be identical everywhere dots appear.

### Calendar Dot Colors
- Gold `var(--gold)` = Event/Trip
- Green `#4CAF50` = Round
- Blue `var(--blue)` = Range Session
- Pink `var(--pink)` = Tee Time
- Green `var(--live)` = Today indicator

## ParCoin Economy Design

ParCoins have ZERO real-world cash value. Purely cosmetic and social. No gambling license required.

### Design Principles
- PLAYING GOLF is the primary earning method. Period.
- Range sessions count — a guy hitting balls before work is engaged
- A new player with 0 rounds should have almost nothing
- After 1 year of active play, a player should NOT have been able to buy everything. There must always be something to aspire to.
- The economy must support 3+ years of engagement without hyperinflation
- Earning should feel incentivizing, not unobtainable

### Player Tiers (Realistic)
- Casual: 1-2 rounds/month, maybe 1 range session
- Active: 2 rounds/month + 1-2 range sessions/week
- Dedicated: 4 rounds/month + 2-3 range sessions/week

### Earning Sources (coins IN)
| Action | Coins | Frequency Cap |
|--------|-------|---------------|
| Complete a round (18H) | 50 base, +25 if attested | No cap |
| Complete a round (9H) | 25 base, +10 if attested | No cap |
| Range session (30+ min) | 10 | 1 per day |
| Attest someone's round | 5 | No cap |
| Daily login | 1 | 1 per day, no streak bonus |
| Post tee time that fills (3+) | 15 | No cap |
| Personal best (18H) | 100 | When achieved |
| Personal best (9H) | 50 | When achieved |
| Win an event/tournament | 500 | When achieved |
| Season champion | 1000 | Once per season |
| Achievement unlock (play-based) | 25-50 | When achieved |
| Achievement unlock (social/misc) | 10 | When achieved |
| Invite friend who joins | 200 | Per invite |
| New member welcome bonus | 25 | Once ever |

### Earning Targets
- Casual (~2 rounds, 1 range/month): ~175 coins/month — Can afford 1 basic cosmetic per month
- Active (~2 rounds, 4-6 range sessions/month): ~300 coins/month — Can afford 1 mid-tier item every 1-2 months
- Dedicated (~4 rounds, 10 range sessions/month): ~550 coins/month — Can afford 1 premium item every 2-3 months

### The Feel (Progression Timeline)
- After your first round ever: ~75 coins (round + achievements) — browse the shop
- After 1 month active play: ~300 coins — first real cosmetic
- After 3 months: ~900 coins — eyeing animated rings
- After 6 months: ~1800 coins — premium item + coins for trash talk
- After 1 year: ~3600 coins lifetime — collection built, still stuff to want. Gold Member (10,000 lifetime) is 2+ years away.

### Spending Sinks (coins OUT)
| Category | Price Range | Examples |
|----------|-------------|---------|
| Basic cosmetics | 100-200 | Static rings, simple banners |
| Mid-tier cosmetics | 300-500 | Card themes, name effects, titles |
| Premium cosmetics | 750-1500 | Animated rings, premium banners |
| Ultra-premium | 2000-3000 | Diamond Sparkle, legendary items |
| Trash talk actions | 30-75 | Victory Lap, Spotlight of Shame |
| Bounties | 50-200 | Course bounties, score bounties |
| Wagers | 25-500 | Player-set amounts |
| Power-ups | 150-200 | Double XP, Handicap Shield |
| Flex items | 500-1000 | Sponsor a Hole, Name a Tournament |
| Seasonal exclusives | 300-750 | Limited edition, never return |

### Price Tier Ladder
| Tier | Price | Active Player Time to Earn |
|------|-------|---------------------------|
| Basic | 100-200 coins | ~1 month |
| Mid-tier | 300-500 coins | 1-2 months |
| Premium | 750-1500 coins | 3-4 months |
| Ultra-premium | 2000-3000 coins | 6-8 months |

### Coin Flow Rules (CRITICAL)
The ONLY way new coins enter the economy is through the earning sources table above. Every other transaction is a transfer or a sink.

- **Wagers:** Players can ONLY wager coins they currently have. Coins escrowed on acceptance, winner takes both. Cancelled = refund both. Zero new coins created.
- **Bounties:** Poster must have the coins. Deducted when posted. Claimer receives them on fulfillment. Zero new coins created.
- **Trash talk (Spotlight of Shame, Victory Lap, etc):** Coins deducted from spender's balance. Pure sink.
- **Shop purchases:** Coins deducted. Pure sink.

### Known TODOs
- **Bounty expiry refund**: When a bounty expires without being claimed, poster's coins should be refunded. Requires a scheduled Cloud Function or client-side check on page load. Not yet implemented.

### Anti-Inflation Rules
- NO signup bonus above 25 coins
- NO daily login streak multipliers
- NO bulk coin giveaways
- NO earning coins from purely passive actions
- Social/misc achievement coins capped at 10 each
- If average player balance exceeds 2000 coins, introduce new high-value sinks before adding new earn sources

## Key Members

| Name | Role | Notes |
|------|------|-------|
| Zach (TheCommissioner) | Commissioner/Developer | `zboogher@gmail.com`, 6'4", 18.8 handicap, engaged to Jordyn |
| Jordyn (flossonthefairway) | Member | Username: flossonthefairway, badge: "The Boss's Wife" |
| Nick | Founding Four | `nick.blades1@gmail.com` |
| Kayvan | Founding Four | Manually-created profile, `claimedFrom` links to Auth |
| Kiyan | Founding Four | Manually-created profile, `claimedFrom` links to Auth |

Founding four have `claimedFrom` fields linking seed profiles to Firebase Auth accounts.

## Mandatory Rules

### Every Build
1. **Caddy Notes:** Update The Caddy Notes changelog with proper semver (X.Y.Z). X = major, Y = features, Z = bugfixes. Public-facing language only — no Firestore, Firebase, CORS, or internal references. Only current version displays.
2. **Syntax check:** Run acorn/Function parse before every commit
3. **No emojis** in place of SVG icons (exception: ⛳ for The Caddy bot)
4. **Firestore is source of truth** — not localStorage (localStorage only for theme fast-load and DM read timestamps)
5. **Output to `/mnt/user-data/outputs/`** when working in Claude chat

### Before Making Changes
- **Ask before architectural decisions** or feature removal
- **Zero guessing on course/par data** — API data or nothing
- **No hardcoded colors** — everything uses CSS variables
- **48px minimum touch targets** on all interactive elements
- **Test on mobile Safari + Chrome** — mixed iPhone/Android user base

### Code Style
- Targeted `str_replace` edits preferred over full rewrites
- Python/Node scripts for bulk changes
- `var` (not `let`/`const`) for compatibility with the current vanilla JS setup
- Explicit `_navStack` array for navigation (not hash router)
- Settings only in top bar cog, never in footer nav

## Design Skills

Before doing ANY visual or UI work, read the relevant skill files. These contain best practices that are mandatory for this project:

### Frontend Design (REQUIRED for all UI changes)
Read: /mnt/skills/public/frontend-design/SKILL.md
- Bold aesthetic direction, not generic AI slop
- Typography: distinctive font choices, clear hierarchy
- Color: dominant colors with sharp accents, CSS variables
- Motion: meaningful animations, staggered reveals, hover states
- Spatial: unexpected layouts, generous negative space
- Backgrounds: atmosphere and depth, textures, gradients, grain
- NEVER use generic aesthetics (Inter as body font is our one exception since it's already our brand)

### Canvas Design (REQUIRED for share cards and generated images)
Read: /mnt/skills/examples/canvas-design/SKILL.md
- Share cards, scorecard images, trophy graphics, event banners
- Design philosophy first, then express visually
- Meticulously crafted, master-level execution
- Custom fonts available in canvas-design/canvas-fonts/

### Theme Factory (REFERENCE for theme system work)
Read: /mnt/skills/examples/theme-factory/SKILL.md
- Color palette cohesion and font pairing principles
- Each theme needs distinct visual identity, not just color swaps
- Our 8 themes each have texture images — use them boldly

### MCP Builder (FUTURE — for integrations)
Read: /mnt/skills/examples/mcp-builder/SKILL.md
- For building GHIN integration, GolfNow tee time booking, course data APIs, and other external service connections
- Not needed until Phase 3+ of the roadmap

**RULE:** If you're about to write CSS, redesign a page, generate a share card, or touch the theme system — read the relevant skill file FIRST. No exceptions.

## Built Features

- Home dashboard (compact hero, personal stat bar, live spotlight, mini leaderboard)
- Activity feed with rounds, range sessions, chat messages
- Play Now with live scoring, GPS-less hole-by-hole entry
- Range session timer with drill tracking, focus areas, feel rating
- Season standings with Stableford-style points, handicap-adjusted
- Trophy room with XP system, 50+ achievements, level titles
- Scorekeeper for multi-round events (trip scoring)
- Calendar with rich event cards, scheduling chat
- Course directory with GolfCourseAPI search
- DM system with unread indicators
- Tee time posting with RSVP
- Scramble team management (2v2, 3v3, 4v4)
- Shareable scorecard images (html2canvas)
- Canvas share cards for range sessions, scrambles, event leaderboards
- Photo gallery with self-only delete
- Invite system with shareable links
- Commissioner admin panel
- 8 premium themes with texture images
- Masters-styled scorecard (Augusta National on-course board treatment)
- Component polish: card shadows, status pills, page transitions, number animations

## Known Bugs (Diagnosed, Not Yet Fixed)

1. Course directory average display — derive front/back/18-hole from `holesMode` field
2. Clubhouse calendar missing in-progress events — filter uses startDate only, needs end-date check
3. Sequoyah National finalization bar tap — missing iOS tap CSS properties
4. All-time records best rounds — split into 9-hole and 18-hole columns
5. Shareable scorecards for 9-hole rounds — render only played holes
6. Courses button on season standings — navigate to 2026 courses with rounds
7. Courses button on player profiles — show all courses with best round
8. Scorecard logo — reference `logo.jpg` from repo, not base64
9. Parbaugh Round — joined players not appearing on scorecard (host-only display)

## Roadmap (Priority Order)

### Immediate (Visual Polish)
- Wire 8 texture images into theme CSS with opacity layers and blend modes
- Champion Red unlock gating (check `trip.champion` fields)
- Player profile page redesign
- Feed card redesign (rounds prominent, chat compact)
- Round detail + shareable scorecard redesign

### Near-Term (Features)
- Push notifications
- Hole-by-hole scoring in Log a Round (score, GIR, FIR, putts per hole)
- Badge cosmetic selector UI + profile border/banner system
- Course Directory API-first dedup
- DM full repair (mobile layout, rules verification)
- Scramble live scoring mode
- Inline scramble team creation on Play Now
- Activity feed filtering
- First-time user onboarding

### Future
- AI tournament generator (proper backend, not client-side)
- Seasonal recap and yearly awards ceremony
- Range UI three-state redesign
- Course maps/GPS integration (if API supports it)
- Swing analysis integration

## Agent Team Configuration

When using Claude Code agent teams, use this structure:

### Team: Full Stack Polish
```
Agent 1 (Frontend Lead): Owns src/styles/ and src/pages/. Handles all visual work — themes, textures, component CSS, page layouts. Tests in Chrome + Safari.

Agent 2 (Core Engineer): Owns src/core/ and firebase/. Handles data layer, Firestore rules, Cloud Functions, sync logic, auth flows. Never touches CSS.

Agent 3 (QA + Polish): Runs after agents 1 & 2 complete. Syntax checks with acorn, verifies touch targets, tests all 8 themes, checks mobile rendering, updates Caddy Notes, bumps version.
```

### Team: Feature Build
```
Agent 1 (Architect): Reads the full codebase, plans the feature, writes the spec with file-level task breakdown. Does NOT write code.

Agent 2 (Builder): Implements the spec from Agent 1. Writes all code changes.

Agent 3 (Reviewer): Reviews Agent 2's code for bugs, edge cases, missing error handling, and consistency with existing patterns. Requests changes if needed.
```

### Ground Rules for All Agents
- Read CLAUDE.md before starting any work
- Never remove features without commissioner approval
- Never guess course/par data
- Always update Caddy Notes on every build
- Always syntax check before committing
- Use CSS variables, never hardcoded colors
- Firestore is source of truth
- The app should feel premium — country club, not startup
- Community over competition in every design decision
