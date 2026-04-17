# Clubhouse Visual Redesign — Rollout Plan

**Status:** Parked. Execution sequenced AFTER v8.2.0 ship.
**Captured:** 2026-04-19
**Source:** Design session output via Zach

## Executive summary

Full app visual redesign to "Clubhouse" direction — deep billiard green + warm chalk + brass, editorial typography (Fraunces serif + Inter UI + JetBrains Mono), data-gated feature surfaces, iOS island-row headers, ParCoin wallet and shop refresh, desktop HQ dashboard, redesigned 10-step onboarding.

## Subscription gate (Phase 4 context)

Zach noted during brief review: "end goal is only premium subscribers can host leagues but for now anyone can make one." This is Phase 4 monetization scope. When Clubhouse Part D (Wallet + Shop) executes, ensure the design doesn't foreclose a future "host a league" paywall mechanic.

## Brief (verbatim)

# Parbaughs — Clubhouse end-to-end rollout

## Context

Design has picked the "Clubhouse" visual direction (deep billiard green
+ warm chalk + brass) and has delivered a full mock set: 12 mobile
screens, a desktop HQ dashboard, a 10-step onboarding, a redesigned
wallet + cosmetics shop flow, an island-row pattern for iOS headers,
and a prioritized list of ten UX ideas.

Token source of truth: `clubhouse-tokens.jsx`.
Screen references: `clubhouse-screens-1.jsx`, `clubhouse-screens-2.jsx`,
`clubhouse-screens-3.jsx`, `hq-dashboard.jsx`, `hq-shell.jsx`,
`split-header.jsx`, `ideas-ux.jsx`.
Design docs: `Parbaughs Clubhouse Full App.html`,
`Parbaughs Desktop HQ.html`, `Parbaughs Onboarding Mobile.html`,
`Parbaughs Onboarding Desktop.html`,
`Parbaughs Parcoin Shop Refresh.html`,
`Parbaughs Island Row Pattern.html`, `Parbaughs UX Ideas Showcase.html`,
`Parbaughs Pages x Themes.html`.

Governance / technical background:
`v8.0-governance-design.md`, `v8.0-technical-design.md`,
`v9.0-social-system-design.md`, `v9.1-handle-system-design.md`,
`v8-decisions-log.md`.

Work happens in six parts — A through F. One PR per part. Merge in
order. Do not combine parts; review must stay reviewable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART A — Clubhouse palette rollout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### A.1 Add the Clubhouse theme to the token system

In `themes.css`, add `[data-theme="clubhouse"]` overriding base tokens
with the following values (sourced from `clubhouse-tokens.jsx`):

  --surface-dark:   #0f3d2e;   /* billiard green — primary dark */
  --surface-dark-2: #164a38;
  --surface-dark-3: #1d5a44;
  --surface-darker: #0a2a20;   /* embossed panels */
  --surface-light:  #f4efe4;   /* warm chalk — primary light */
  --surface-light-2:#e9e2d1;
  --surface-light-3:#dcd3bd;
  --ink:            #14130f;
  --ink-2:          #2d2b24;
  --charcoal:       #4a4740;
  --mute:           #7a766b;
  --mute-2:         #a8a395;
  --accent-primary: #b4893e;   /* brass — hero accent */
  --accent-primary-2:#9a7434;
  --accent-primary-3:#d4a957;
  --accent-warm:    #a05a3a;   /* copper */
  --accent-cool:    #5a6b78;   /* slate */
  --positive:       #5a7d4e;   /* moss — birdie / gain */
  --negative:       #8e3a3a;   /* claret — bogey / loss */
  --neutral-warm:   #c9b68a;   /* sand */

  --font-display:'Fraunces', 'Playfair Display', Georgia, serif;
  --font-ui:     'Inter', -apple-system, system-ui, sans-serif;
  --font-mono:   'JetBrains Mono', ui-monospace, monospace;

Set `clubhouse` as the default theme in the app shell.

### A.2 Normalize hardcoded typography

Search the codebase for `'Playfair Display'` in inline styles and
component files. Replace every instance with `var(--font-display)`.
Same for `'Inter'` → `var(--font-ui)` and any hardcoded
`ui-monospace` → `var(--font-mono)`.

### A.3 Kill the orange era

Search for `#f97316`, `#ea580c`, `#ff6b35`, `#f59e0b`, `'orange'`, and
any gradient using them. Replace every instance with
`var(--accent-primary)` (brass). Remove the gradient entirely — use
flat brass. If something was relying on an orange gradient for
hierarchy, flatten it and increase type weight or size instead.

### A.4 Swap default surface pairs

Screens currently using `#000` / `#111` / `#0a0a0a` as dominant
background → `var(--surface-dark)` (billiard green).
Screens using `#fff` / `#fafafa` as dominant background →
`var(--surface-light)` (warm chalk).
This is the single biggest visual shift — expect ~60 files touched.

### A.5 Pages to touch, in order

Work top to bottom. Each depends on the previous being correct.
Items marked ◀ are also subject to PART C gating.

   1. App shell + bottom nav (base.css consumers)
   2. Home
   3. Live Round HUD          ◀
   4. Scorecard entry
   5. Round recap / share card
   6. Handicap / stats trend
   7. Leagues + standings
   8. Wagers / skins tracker
   9. AI Caddie               ◀
  10. Wallet / ParCoins       (see PART D)
  11. Shop                    (see PART D)
  12. Profile / Trophy room
  13. Course yardage book     ◀
  14. Clubhouse feed
  15. Settings, auth, notifications, empty states

No feature additions in PART A. Only visuals and tokens.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART B — iOS island-row header pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### B.1 Why

Every top-of-screen header today draws over the iPhone Dynamic Island
on 14 Pro+ devices. Buttons get clipped, timestamps get eaten, and
status icons overlap the 124×37 island zone. We're standardizing on a
three-zone header.

### B.2 The pattern

Fixed 54px-tall row, three zones:

  LEFT ZONE (0–126px):    time + optional brand/back pill
  CENTER ZONE (126–267px): RESERVED for the Dynamic Island — never
                           place anything here. Pad 8px on either
                           side of the 124×37 island rect.
  RIGHT ZONE (267–393px):  status indicators + up to 2 utility pills

### B.3 Rules

  - Pill height 30–36px (row is 54px; leaves ~10px breathing).
  - Max 2 pills per side. More → move to a subheader.
  - No destructive actions in the island row. Delete / leave / kick
    always live in sheets or context menus.
  - Background is transparent by default. Add a blurred scroll-tint
    only once content scrolls underneath (iOS standard).
  - Use `env(safe-area-inset-top)` padding on every page body so the
    row never overlaps content.

### B.4 Componentize

Build a single ``
component (reference: `clubhouse-tokens.jsx` → `IslandRow`). Every
page in PART A.5 uses it. Delete hand-rolled header markup.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART C — data-gating Live Round + Course + Caddie
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### C.1 Principle

Placeholder data is worse than no feature. Showing a confident
"213y to pin" when we're guessing — or reading a stat nobody entered
— is how trust dies. Every GPS, course-data, weather, or personal-
history display gates on a real predicate. Default FALSE when
unknown. Never "reasonable guess."

### C.2 Predicates (add to round-session object)

  hasLocation     geolocation granted AND fix <30s old
  hasCourseGeo    course has tee + green center coords loaded
  hasHoleMap      hasCourseGeo AND hazard polygons for this hole
  hasPinToday     daily pin feed present (false today — gate anyway)
  hasWind         weather provider wind <10min old
  hasElevation    course elevation profile present
  hasHoleHistory  user has ≥3 scored rounds on this course + hole
  hasCaddieModel  ≥20 scored approaches in this distance bucket

### C.3 Section-by-section gates

**Live Round HUD:**
  - Hole #, par, SI, hole strip, score CTA → always show
  - Yardage trio (F/C/B) → hasLocation && hasCourseGeo
      fallback: subtle CTA "Enable location to see live distances"
  - "To pin" → hasLocation && hasCourseGeo && hasPinToday
      fallback: show CENTER only, labeled "to green center"
  - Hole map SVG → hasHoleMap
      fallback: hide entirely. No generic silhouette.
  - "You · 213 out" marker → hasLocation && hasHoleMap

**Course yardage book:**
  - Hole #, par, yards, SI → always show
  - Map → hasHoleMap; else small muted "No hole diagram"
  - Tip text → only if course record has a curated string; else hide
  - Avg / best / plays trio → hasHoleHistory
      fallback: "Play this hole 3 times to see your averages."

**AI Caddie:**
  - TO PIN tile → hasLocation && hasCourseGeo
  - WIND tile → hasWind
  - ELEV tile → hasElevation
  - LIE tile → only if user tapped a lie in pre-shot flow
  - Any tile without data is hidden, not "—/—". Row rebalances.
  - Pick card ("Lay up. 7-iron · 155y") → hasCaddieModel
      fallback: conversational reply, no bolded pick
  - "Based on your last N approaches…" receipt → only if N is real

**Home "Live round" card:**
  - Score + leader pills → active session exists; else hide entire
    card (no ghost). Use tee-times block or Start Round CTA.

### C.4 Empty-state spec

Every fallback follows this pattern:

  - Warm chalk bg (var(--surface-light-2))
  - No icon, no emoji
  - One-line explanation in var(--charcoal), 12px mono
  - One CTA link underlined in var(--green) — only if real action
    exists

Bad: grayed-out silhouette that implies "loading"
Good: "Enable location to see live distances. → Enable"

### C.5 Telemetry

Emit on every fallback so we can prioritize data investments:

  parbaughs.gate.fallback { gate:'yardage_trio', reason:'no_course_geo' }
  parbaughs.gate.fallback { gate:'hole_map',      reason:'no_course_geo' }
  parbaughs.gate.fallback { gate:'hole_history',  reason:'under_3_rounds' }
  parbaughs.gate.cta_click  { cta:'enable_location' }

Use the existing `track()` helper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART D — Wallet + Shop redesign (ParCoin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### D.1 Scope clarification — READ THIS FIRST

ParCoin is an in-app currency. The Shop sells:

  ✔ Cosmetics  (bag tags, club skins, marker skins, profile frames,
                emotes, course-pin styles, avatar crests)
  ✔ Power-ups  (Double-XP, Handicap Shield, Mulligan token,
                Streak Freeze)
  ✔ League / course perks  (priority tee, cart, range bucket —
                redeemable only at leagues that opt in)
  ✔ Badge unlocks  (cosmetic-only, no gameplay advantage)

The Shop does NOT sell physical merchandise. No Pro-V1 sleeves, no
gloves, no shipping addresses, no real-world fulfillment in v1. The
"Pro shop / gear rack" concept in the design mocks is parked for a
future real-merch storefront — do not build the ship-to flow now.

### D.2 Wallet hero

Reference: `Parbaughs Parcoin Shop Refresh.html` → `ScreenWallet`.
Replaces today's gradient card.

  - Engraved brass banknote on billiard-green surface
  - Fields: balance (₡ big), serial number (fake, stable per user),
    lifetime, rank, ▲ +N this 7d
  - No emoji, no gold-tier gradient pill, no crypto vibe
  - Primary CTA: "Shop the clubhouse" (brass block)
  - Secondary trio: EARN · SEND · WAGER

Balance-after clarity: every spend surface must show
`Leaves ₡N balance` in mono at 9px under the CTA.

### D.3 Shop index

  - Editorial hero (serif italic title)
  - Featured product block (rotating weekly)
  - Two-column category grid: Cosmetics · Power-ups ·
    Perks · Badges · Emotes · Mystery drop
  - No emoji tiles. Category color dots only.

### D.4 Category list (cosmetics example)

  - Newspaper-style row list (NOT card grid)
  - Filter chips: All · Bag tags · Club skins · Markers · Frames
  - Each row: swatch preview · name · sub · price · + ADD
  - Stock labels ("2 LEFT") apply only to limited-run cosmetics
    that we actually gate in the backend. No fake scarcity.

### D.5 Product detail

  - Editorial product page (serif italic title)
  - Large preview — render the cosmetic itself (bag tag SVG, club
    skin preview, frame preview) inside a green card
  - Stats trio (rarity / set / drop date) — only if real
  - Sticky CTA at bottom with Leaves ₡N

### D.6 Checkout

  - Dashed-edge receipt style (reference: `ScreenCheckout`)
  - No shipping address field (cosmetic-only)
  - Line items: cosmetic name, member discount (if applicable),
    total, balance-after
  - Confirm CTA debits ParCoin immediately. No "payment method"
    step — ParCoin is the only currency.

### D.7 Success

  - Wax-stamp certificate (reference: `ScreenSuccess`)
  - "Redeemed" stamp, item applied immediately to user's profile
  - Upsell block shows one related cosmetic, optional
  - Primary CTA: "See it on your profile" (jumps to trophy room
    with the new item pre-focused)

### D.8 ParCoin economy rules (unchanged from v8 tech doc)

  - `parcoins` = current balance
  - `parcoinsLifetime` = ledger for Gold Member tier
  - `parcoin_transactions` write rule must validate
    `request.resource.data.uid == uid()` (see v8 technical 1.8 #7)
  - No client-side balance mutation. All spends go through a cloud
    function that writes the txn and decrements the balance atomic.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART E — Desktop HQ + Onboarding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### E.1 Desktop HQ dashboard

Reference: `Parbaughs Desktop HQ.html`, `hq-dashboard.jsx`,
`hq-shell.jsx`. Activates at viewport ≥1024px.

  - Left sidebar nav (Your career, Your league, League HQ)
  - Editorial event hero at top
  - Card grid below: handicap trend, rounds 30d, ParCoin,
    win rate, active wagers, next tee time
  - Uses Clubhouse tokens; no rework of logic

### E.2 Onboarding (mobile + desktop)

References: `Parbaughs Onboarding Mobile.html`,
`Parbaughs Onboarding Desktop.html`. 10 steps:

  1. Welcome
  2. Handle (per v9.1-handle-system-design.md rules)
  3. Home course
  4. Handicap (known / estimate / unknown)
  5. Invite code OR solo
  6. Permissions (location → explain WHY, tied to PART C)
  7. Notification prefs
  8. Connect friends (optional)
  9. First round prompt
 10. Done → home

Mobile: full-bleed steps with step-pills.
Desktop: split-screen editorial layout with rotating left-panel
concept images.

Gating: the onboarding LOCATION step must explain that live
distances and hole maps depend on it (PART C context). If the user
skips, the Live HUD will correctly fall back — but the CTA language
should make clear what they're opting out of.

Leagueless path (per v8 governance resolution): users can finish
onboarding without an invite code and still use solo round logging,
analytics, Caddie. Leagues are additive, not gating.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## PART F — prioritized UX ideas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference: `Parbaughs UX Ideas Showcase.html`, `ideas-ux.jsx`.
Ten ideas, three bets. Build in this priority order. Each is its
own sub-PR.

**This quarter (build now):**
  F.1  Home v2 — action-first hero (start-round CTA top)
  F.2  Swipe scorecard — horizontal hole swipe
  F.3  Round recap — shareable story card
  F.4  ParCoin wallet redesign — covered in PART D
  F.5  Desktop dashboard — covered in PART E.1

**Bigger bets (plan now, build next quarter):**
  F.6  Live wager / skins tracker — auto-settles using ParCoin
  F.7  Watch Live spectator mode — friends tap a live round
  F.8  Course GPS + hole preview — depends on PART C.2 hasCourseGeo
  F.9  AI Caddie chat surface — existing `caddie.js`; gated per C.3

**Polish (opportunistic):**
  F.10 Season recap — year-in-review share card

For each: one sub-PR, screenshots before/after, telemetry on the
new surfaces using existing `track()` helper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Deliverables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Post in #parbaughs-design per part:

  1. PR link (one per part)
  2. Before/after screenshots:
       - PART A: Home, Feed, Profile
       - PART B: 3 screens showing island clearance
       - PART C: Live HUD (with + without data), Course (with +
         without map), Caddie (with + without model)
       - PART D: Wallet, Shop index, Product, Checkout, Success
       - PART E: Desktop HQ, onboarding steps 1/5/10
       - PART F: one before/after per sub-PR
  3. Telemetry dashboard link (gates + cta_clicks)
  4. A list of production data we DO have that wasn't being
     surfaced — tell design; we want to know
  5. Any questions or calls you had to make — list them

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## Do NOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  - Add new features beyond PART F
  - Re-architect the theme system (extend, don't replace)
  - Sell physical goods in the Shop (cosmetics + power-ups + perks
    only; physical-merch storefront is v-future)
  - Invent data for gated sections (PART C is non-negotiable)
  - Touch scorecard math or handicap calc
  - Change copy on production strings except:
      • "to pin" → "to green center" when hasPinToday is false
      • orange-branded CTA copy that references the old accent
  - Ship emoji in UI chrome; emoji allowed only in user-authored
    content (chat, posts)
  - Use gradients anywhere. Flat tokens only.

Start with PART A.1. Work top to bottom. Ping design on any call
you're not sure about.

## Relationship to v8.x ships

- v8.0.1 Founder visual treatment (opal ring, prismatic name) should align with Clubhouse brass/editorial direction — execute forward-compatible with Clubhouse
- v8.2.0 Leagueless UX onboarding retrofits to Clubhouse Part E.2 later; v8.2.0 ships with simpler onboarding now
- v8.1.1 Ban/Appeal — no conflict

## Open questions for execution time

- "Kill the orange era" — does this include Classic Gold theme's gold/yellow accents, or only #f97316 orange?
- Default theme change — existing members with selected themes should retain choice; default applies to new signups only
- Part C telemetry — verify `track()` helper is wired to real analytics destination before Part C execution
- Part D physical goods — audit current cosmetics shop before restricting to "cosmetics + power-ups + perks"
- Part F.7 Watch Live — depends on v9.0 social graph
