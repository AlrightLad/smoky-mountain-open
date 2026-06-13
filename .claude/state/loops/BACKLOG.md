# PARBAUGHS marathon backlog — Stop-hook source of truth

The Stop hook (`.claude/hooks/stop-continue.sh`) reads THIS file. In marathon
mode it blocks the agent's turn-end while any `- [ ]` item below is open, so the
agent keeps draining the queue without the Founder re-poking it. Mark items
`- [x]` as they ship; when all open items are done the hook allows stopping
("no backlog, no need to prompt" — Founder 2026-06-12).

## Control flags (in this dir)
- **CONTINUE** — present = unattended marathon mode ON (hook active). Absent =
  inert (interactive sessions stop normally). Agent creates it when the Founder
  says "go / marathon / keep working unattended"; removes it when the backlog is
  truly clear or the Founder returns.
- **STOP** — present = hard stop, always allowed (overrides everything). Founder
  or agent drops this file to halt immediately.
- Circuit breaker: if HEAD doesn't advance (no commit) for 30 consecutive
  blocked turns, the hook allows a stop anyway (logged to `cb.log`) so a stuck
  loop can't spin forever.

## ONLY list agent-actionable items as `- [ ]`
Founder-gated items (need a secret / his taste / a classifier-walled deploy) go
under "Blocked on Founder" so the hook never traps the agent on work it cannot
finish.

## Open (agent-actionable) — full autonomy, no questions (Founder 2026-06-12)
(all non-gated agent-actionable items below are now [x]; remaining work is in
"Deferred with evidence" / "Genuinely blocked" — the hook may allow a stop.)
- [x] FINAL CAPSTONE — full EXPLOIT/abuse test of the whole app. DONE 2026-06-12, report at `.claude/state/exploit-test-2026-06-12.md`. Verdict GREEN: auth/rules layer strong (round-forge, impersonation, self-grant, league-isolation all blocked); injection covered (escHtml pervasive); every legit ParCoin earn-path durably gated (daily_login/rookie/achievement/per-id dedupKey); residual economy weakness (client-trusted balance + wager/bounty server-validation) is LOW severity in the cosmetic-only/trusted-20/no-cash context and correctly gated behind the cash-IAP milestone (Stage-2). Onboarding-replay farm fixed v8.25.33.
- [x] Scroll flicker — DONE v8.25.35: root-caused to backdrop-filter:blur on the fixed always-on-screen .bottom-nav (per-frame re-rasterization), swapped for .97-alpha near-opaque bg; visually verified clean.
- [x] Prod-error triage (maintenance loop) — DONE v8.25.36: the recurring scrambleTeams/Trip "insufficient permissions" rows were the self-healing cold-sign-in rules-context race; routed that transient to console-only (pbLog) so it stops spamming the prod errors collection. Bulk of the class (presence/DM/liverounds/course) already silenced in v8.25.x.
- [x] #41 per-page 9.5 critique — DONE for primary surfaces 2026-06-12: home, feed, rounds, shop, settings, courses, scramble, standings, wagers, trips/events, members, trophyroom, records, playnow — all 14 captured as a real member (verify-as-member), ALL verified healthy/~9.0, zero objective bugs; FatalBert round + rivalry 4-0 + scramble attribution confirmed LIVE on prod.
- [x] #32 store overhaul — store verified good as a member (shop capture); presentation + 2-click try-it-on already shipped. Deeper cosmetic-art expansion folded into parcoin stage-2.
- [x] Onboarding-replay ParCoin farm exploit — fixed v8.25.33 (durable rookieRewarded flag).
- [x] Kudos/Tee-Tap → one appreciation reaction app-wide — done v8.25.32 (feed) + v8.25.34 (League Pulse) + Caddy Notes v8.25.37.

## Founder batch 2026-06-13
- [x] SWING flow + scene rebuild — DONE v8.25.44: fairway tee scene (golfer tees DOWN a striped fairway to a distant green+flag, big dawn sky, inviting), "Tap to start your adventure", NO auto-advance (waits for the tap), plays to the follow-through + HOLDS (watching the shot down the fairway, never recenters) then the app opens. canvas renderer (flicker fix). Verified via tapped WITH_INTRO capture — finish pose nails the "staring down the fairway" note.
- [x] Profile "Recent play" → 3 rounds, show-all button removed — DONE v8.25.45 (full ledger still via the tappable Rounds-count stat).
- [x] Shop shelf order LOWEST→HIGHEST rarity + rarity legend — DONE v8.25.45.
- [x] Caddies in the SHOP matching Settings — DONE v8.25.46 (Caddies shelf renders from window.pbCaddies, the Settings source).
- [x] Season Recap alignment — DONE v8.25.47 (annual calendar-year; fixed the "_year" key in data.js so Wrapped is correct too).
- [x] Merch → "coming soon" poster page — DONE v8.25.48 (vintage clubhouse/course SVG poster; verified).
- [x] Shop cosmetic ITEMS — DONE v8.25.49 (+7 new items wired worn-render, retired The Sleeve).
- [x] Leaderboards / Season Recap entrance animations — DONE v8.25.50 (staggeredReveal + fadeInScale in animate.js, reduced-motion early-return + stagger cap + transform/opacity only; wired Standings rows + Season Recap stat-boxes/cards + count-up). V1-verified the board still renders (no blank-row regression).
- [x] Add course via PHOTO — T1 photo-as-reference DONE v8.25.51 (client-side scorecard photo in the add-course form; no upload/Storage = zero course-data risk). T2 (free-source fallback) + T3 (true OCR auto-fill, Anthropic key + CF deploy) remain — Founder sets up the key at his PC; T2/T3 build after.
- [x] SWING scene v3 + finish frame — DONE v8.25.53 (verified): richer dawn-course scene (L/R bunkers + trees + cart path + clubhouse + clouds + treeline, realistic blue→peach sky — no longer all-green) + FINISH_FRAME 74→58 (frame-verified clean follow-through, both legs match, ball at landed-downrange before respawn-walk-back + before recenter). Held-finish + ready-scene captured + confirmed.
- [x] SHOP 9.5 cosmetic quality leap — DONE v8.25.54 (LIVE on prod). 5 new premium
  pieces (pc52 Club Pin enamel/brass-bezel, pc53 Medallion struck-brass+gleam, pc54
  Calfskin Tag grain+stitch+enamel-rivet, pc55 Pairing Sheet committee-rule, pc56
  Sterling hammered-silver+sapphire) + brass material upgrade (.title-engraved +
  .plate-locker-brass → 7-stop struck metal + specular band, every brass title/plate
  inherits). Worn-render wired (playerRingClass pc52/53, _npCls pc54, pbMarkerGlyph
  pc56 w/ px-suffixed gradient id). pc46 Clubhouse Crest deliberately UNTOUCHED
  (shipped SKU — synth conflict #1 respected; regression-check clean). V1-verified all
  8 surfaces as a real member on staging (.claude/state/verify-shop95/). Smoke 33/33
  green (fixed 2 stale scenarios: intro hygiene + Wrapped pending-gate).
- [x] DISTANCE TO PIN — DONE v8.25.55 (LIVE on prod). GPS Front/Center/Back read in
  the live-play hole header via new src/core/distance.js (on-tap one-shot read,
  battery-safe; PB.native.gps helper). Crowdsourced green edges (2-tap front+back)
  merge-written to courses/{id}.greens[holeIdx] — member course writes already
  permitted, NO rules change. Static per-hole yardage was already in the header.
  P10-graceful (every denied/timeout/no-green/unsupported state explained).
  PRIVACY: member location never stored (transient client-side), privacy.html
  updated. V1-verified on staging: globals resolve live (tree-shake fix confirmed),
  all 3 strip states render, Haversine math exact (122/182/243 yds vs hand-calc).
  Smoke 33/33. Spec: task-queue/founder/hole-diagram-self-position-plan.md.
- [~] PLANNING ONLY (no code): hole diagram self-position + yardage — DONE: plan written to task-queue/founder/hole-diagram-self-position-plan.md (3 lanes + recommendation; Founder picks the lane).

## Founder batch 2026-06-13 (SECOND batch) — ALL PAGES ≥9.0, STRIVE 9.5
Founder mandate 2026-06-13 13:25 UTC: "all pages should strive for 9.5 but at
minimum be over a 9." + "send me a notification once all assigned work is
completed." Sole-driver confirmed (overnight cron stood down, STOP was its
self-halt). Full evidence: per-page ratings in WF2 output (verify-* + the table
in chat), diagnosis/e2e/design specs in WF1 output
(.claude/.../tasks/w6myyl5yi.output + w0u4t39i2.output). PushNotification ONLY
when every item below is [x].

### Quick-win fixes (Wave 1)
- [x] SWING LEFT LEG blends into grass — DONE v8.25.57 (LIVE+V1): left-leg stroke was
  felt-green (recolor MAP mapped light-blue→FELT); fixed → white [1,1,1] matching the
  right leg + regenerated golf-swing-pb.json. Verified on the held-finish frame.
- [x] NOTIFICATIONS answer + round_teetap — DONE v8.25.57: kudos ✓ + tee-time ✓ WORK;
  round_teetap type registered (was unregistered → generic icon/wrong link).
- [x] CHAT-POST notification — DONE v8.25.65 (LIVE, smoke 33/33): sendChat now
  broadcasts a coalesced 'chat_message' notification to active league members (each
  sender fires ≤1 per 20-min session via a module-var throttle — no spam). Mirrors
  the tee_posted broadcast guards. Closes the one real notification gap.

### Per-page lifts to ≥9.0 (worst-first; specs in WF2 output)
- [x] SCRAMBLE 5.8 → DONE v8.25.58 (LIVE+V1): editorial masthead ('The team room.'),
  felt team-crest cards w/ hero W-L + split bar, avatar-blob fixed (stockAvatar no
  longer counts as a photo → distinct brass initials). Verified via injected-team
  capture. (scramblelive token migration deferred to a polish pass.)
- [x] PROFILE 6.3 → DONE v8.25.74 (LIVE+V1): masthead/badges/chips/stat-grid were
  already pf-*/token-migrated + count-up wired; this closes the two remaining
  inline-style hero blocks (XP bar → .pf-xp__*, ParCoin wallet → .pf-wallet__*,
  balance/lifetime numerals now --font-display for one type scale) and adds the
  missing entrance cascade (staggeredReveal: XP → wallet → nemesis → stat grid →
  tabs; masthead instant as anchor). XP fill keeps its inline gradient+width
  (04-ui-layout-regression guard) and .stats-grid stays exactly 6 .stat-box.
  V1-verified own profile on staging (xpToken/walletToken render, 6 stat-boxes,
  5 reveal targets, xpFill preserved). (Tab/collapsible IA is already sensible —
  4 tabs + open-on-arrival overview sections; left as-is.)
- [x] RECORDS 6.3 → DONE v8.25.60 (LIVE+V1): editorial masthead ('The numbers.')
  leading on the league best round; Event Champions + All-time records open on
  arrival (records visible immediately), long tail stays collapsed. (Hero
  record-board + count-up + .hof-card→tr-* migration = follow-up polish.)
- [x] SEASON RECAP 6.3 → DONE v8.25.61 (LIVE+V1): editorial masthead ('The year in
  full.'), award tiles (brass icon chip — fixed the 28px-wrapper-on-14px-SVG dead
  box), brass/silver/bronze rank chips replacing flat '1st/2nd/3rd' text, '1 rds'
  grammar fixed. ALSO delivers the season-award gating below. (Wrapped token unify =
  follow-up.)
- [x] TRIPS/EVENTS 6.6 → DONE v8.25.62 (LIVE+V1): .ev-card "tee sheet" rows (Fraunces
  name, status-keyed left rule, clustered avatars, brass status/champion badge),
  "+ New Event" promoted into the masthead, entrance reveal. Verified.
- [x] PLAY NOW SETUP 7.0 → DONE v8.25.71 (LIVE): renderPlaySetup editorial masthead
  ('Play now.' + LIVE SCORING eyebrow), staggeredReveal on the setup cards' fields.
  (CTA pulse = follow-up polish if the convergence pass wants it.)
- [x] COURSES 7.2 → DONE v8.25.66 (LIVE+V1): editorial masthead ('The yardage book.'
  + live count), legible F9/B9/18 score line (brass 18 + ink F9/B9, was washed cream),
  stagger motion. (Sort chips + row hierarchy = follow-up.)
- [x] ROUNDS 7.4 → DONE v8.25.75 (LIVE+V1): list hero now the editorial
  .roster-masthead (mono 'THE SCORECARD' + Fraunces 'Rounds.'), unified with the
  round-detail masthead (which was already strong) + Courses/Members/Records.
  '+ Log a round' promoted into the masthead; scoped-player view leads with back +
  name. Entrance cascade (staggeredReveal) on the history-row cards; handicap-hero
  count-up rides the router post-nav hook. V1-verified as a member (THE SCORECARD
  eyebrow + Rounds. headline + handicap-index hero + 26 league rounds with ★ BEST /
  to-par deltas render clean). (Score-chip-row redesign = convergence-pass lever.)
- [x] WAGERS 7.4 → DONE v8.25.69 (LIVE): editorial masthead ('On the line.') + felt
  BANKROLL HERO band (44px brass numeral, count-up) replacing the 14px footnote.
  (Opponent call-out rail + per-card count-up = follow-up.)
- [x] STANDINGS 7.4 → DONE (already shipped, V1-confirmed 2026-06-13): the 7.4
  rating predated the v8.25.50 + The-Chase work. Live state verified as a member:
  editorial masthead ('The board so far.' Fraunces + brass accent + deck + dateline
  + IN-SEASON badge), SPRING/SUMMER/FALL scope tabs, The Chase band (title fight +
  viewer tug-of-war, renders at ≥2 golfers — this Summer season has 1 so it's
  correctly sparse, not bland), Trophy Watch gated ≥3 rounds w/ '1 rd' grammar,
  points count-up (data-count), row staggeredReveal, Season Archive + Courses.
  Rds/Avg cols are CSS-hidden on mobile (clean #/Member/Pts) so 'dead Avg col' is
  already a non-issue on the member-primary viewport. (Desktop Avg-suppression +
  1-golfer 'first on the board' framing = optional convergence-pass polish.)
- [x] HOME 7.8 → DONE v8.25.76 (LIVE+V1): added the missing entrance choreography
  (top-down staggeredReveal over the mobile-home blocks, greeting on the 0ms slot
  = instant). Assessed as a member first: the page already had its asymmetric peak
  (dark felt 'Ready when you are' hero), editorial greeting, the brass-double-rule
  'By the Numbers' stat band (round-count count-up via router hook), and League
  Pulse — so the lift was the motion, not a restructure. Nemesis chip kept LIGHT on
  purpose (a felt banner there would fight the dark hero for the single peak — a
  net hierarchy loss). (Pulse-row differentiation + HCP/BEST count-up = convergence
  -pass levers.)
- [x] SETTINGS 8.0 → DONE v8.25.77 (LIVE+V1): caddie picker rebuilt on the shared
  .theme-row component (was bespoke .pb-caddie-row w/ ~8 inline-style triplets) —
  circular per-caddie accent avatar chip, brass active ring + check + locked/PRO-SHOP
  treatment identical to the theme picker right above it, so Display reads as ONE
  radio language (V1-confirmed: The Caddy active w/ brass ring, Old Tom/Birdie/Bag
  Room Guy w/ lock all clean). Coin glyph + count-up on the ParCoin balance; section
  entrance cascade (staggeredReveal). (Location inline-style migration = minor
  convergence-pass cleanup; it already uses set-row tokens.)
- [x] PLAY NOW LIVE 8.2 → DONE v8.25.82 (LIVE, bundle-verified): FIR/GIR 'hit' active
  state moved off the bright --birdie green onto on-brand MOSS; the big Finish Round
  button moved off its --birdie→--cb-green-3 gradient onto the brass --gold→--gold3
  gradient (matches the already-brass .btn.green Next/Confirm) + dark ink. Birdie/
  eagle micro-celebration: a moss(birdie)/brass(eagle) label floats up off the score
  hero on a sub-par score — one-shot, NOT full PB confetti, reduced-motion gated in
  JS. Verified the 3 changes in the built bundle (CSS token swaps + burst). (Live-
  scorer visual capture needs an injected active-round state — quick follow-up;
  turn-summary/confirm-panel tokenize = convergence-pass.)
- [x] MEMBERS 8.2 → DONE v8.25.78 (LIVE+V1): roster was already strong (editorial
  'The roster.' masthead, All/Live-now tabs, search+sort, agate rail w/ handicap +
  most-active leaders, demoted invite slab at the foot). Added the two missing
  motion cues: live-presence dot now gently pulses (ring-only keyframe, reduced-
  motion off) on the row 'Live now' + the tab marker so online reads as live;
  roster rows cascade in on first render (staggeredReveal, fired in full render not
  filterRoster). V1-confirmed: FatalBert shows the pulsing ● LIVE NOW, rows reveal,
  invite demoted. (mobile restack-not-hide of Rounds/Last-seen cols + avatar leader
  strip = convergence-pass levers.)
- [x] FEED 8.4 → DONE v8.25.79 (LIVE+V1): feed was already strong (editorial 'What's
  happening.' masthead, League/Community scope w/ posts-today meta + truthful
  Community empty state, the Caddy's Weekly Report + oversize Lead story = one
  asymmetric hero, density-tiered cards, single-Caddy bot identity). Added the two
  missing motion cues: fade-up cascade over the stream blocks (report → lead → day
  eyebrows → cards) per full render; kudos HEART-POP (springy overshoot scale) on a
  FRESH like via a transient .feed-action--pop class. Both transform/opacity only +
  reduced-motion off. V1-confirmed feed renders fully (no blank-card regression).
- [x] TROPHY ROOM 8.4 → DONE v8.25.80 (LIVE): already well-polished (tabbed sections,
  standing-hero w/ level+XP count-up + progress bar, marquee, Roll of Honor, tab
  fade-in). Added the distinctive metallic touch the lift called for: a one-shot
  brass FOIL-SWEEP gleam across the standing hero on arrival (the trophy-case "catch
  the light" moment) — pointer-transparent, never loops, off under reduced-motion.
  (Per-emblem rarity tiers + foil on rare/championship cells = convergence-pass.)
- [x] SHOP 8.6 → DONE v8.25.83 (LIVE+V1): replaced all 3 ⛳ emoji placeholders (shop
  card header, surface stage, try-it-on stage) with one brass golf-flag SVG
  (_shopFlagSvg, sized per call site) — the no-emoji rule reserves ⛳ for The Caddy
  bot + the raw emoji rendered inconsistently iPhone/Android. V1: shop renders clean,
  no regression. (Sticky category rail + featured shimmer + locker/cabinet desc
  contrast + 'Arriving' dilution = convergence-pass + the shop EXPANSION below.)

### Named design redesigns (WF1 specs; some overlap the page lifts above)
- [x] SWING SCENE COHESION REBUILD — DONE v8.25.85 (LIVE+V1). Founder chose "FULLY
  ILLUSTRATED — fits brand" (2026-06-13 17:23). Built a purpose-made flat-vector
  illustrated dawn scene (subagent-authored SVG, COURSE_SVG_V2): realistic dawn
  colors (indigo→periwinkle→peach→gold sky, NOT green), soft sun+glow, clouds,
  treeline, 4 receding fairway bands + mowing stripes, green w/ brass pin + claret
  flag, tee box the golfer stands on — ONE cohesive illustrated style WITH the
  cartoon golfer. Replaced the clashing photo + the glitchy posterize interim
  (rainbow banding). No filters/anims → perf-safe. V1-verified ready + mid-swing.
- [ ] SWING FIGURE UPGRADE (optional — flicker ROOT-FIXED v8.25.94; this is the
  "comical figure" taste upgrade). CANDIDATE FOUND via browser: a DIFFERENT golfer
  figure (NOT the MJ Mograph one) at
  https://assets-v2.lottiefiles.com/a/9d26b8bc-2bcc-11f0-baa0-fbf653826c7f/n3LKHNPYvY.lottie
  — layers l-hand/l-arm/head/body/legs, 692×538, fr30, op180. PATH (fresh budget):
  download → unzip → render-VET (is it cleaner/more pro than the current cartoon?)
  → if yes, build a NEW recolor MAP for ITS source colors (the current MAP is
  MJ-Mograph-specific) OR use as-is if palette fits → integrate (swap LOTTIE_URL +
  dims) → V1 + Founder sign-off. CAVEAT: it's still a cartoon Lottie; "award-winning"
  may need a PREMIUM/commissioned animation beyond free LottieFiles (the free golfer-
  figure pool is just MJ-Mograph + this one). Tools: [[reference_design_tools_kit]].
- [x] SWING ANIMATION (knee flicker) — superseded note: flicker ROOT-FIXED v8.25.94
  after 3 fixes) — DEFINITIVE DIAGNOSIS via browser: the app's golf-swing animation
  IS the LottieFiles "golf swing by MJ Mograph" source (confirmed identical — same
  30 layers head/torso/right-leg/left-leg, 1920², fr24, op96; .lottie at
  assets-v2.lottiefiles.com/a/25f174b6-1167-11ee-8b81-f74d52af05dd/TjskuHeTBV.lottie).
  Its knee shimmer is INHERENT (coplanar same-color legs + overlapping WHITE strokes
  the fill-shade fix #3 didn't touch). No more surgery — Founder wants a tool-driven
  REPLACEMENT. PLAN (fresh budget): browse LottieFiles golf-swing CATEGORY via the
  Playwright browser (mcp__playwright; network-capture the .lottie → unzip → JSON
  works, proven this session), render-VET 5-6 golfer-swing candidates for a clean
  pro figure with NO coplanar-leg z-fight, recolor to brand (scripts/_recolor-swing
  MAP), integrate (swap LOTTIE_URL), V1 + Founder taste sign-off. Tools: [[reference_design_tools_kit]].
- [x] SWING KNEE FLICKER — ROOT CAUSE FIXED v8.25.94 (LIVE+V1). The 3 prior fixes
  (opacity-pin, torso z-reorder, fill-shade) all MISSED it: the two coplanar legs
  still had identical pure-WHITE strokes (w=141+65, [1,1,1]) — overlapping white
  outlines shimmer as the legs cross. Shaded the back (left) leg's strokes to
  CREAM_SHADE (matching its fill) so the back leg is uniformly shaded — no
  white-on-white seam. -pb.json + source sentinel + recolor MAP (regen-safe). V1:
  figure renders clean, legs read as one mass. (Nicer-figure replacement still
  optional/future — a clean free figure-swing Lottie is scarce, see above.) Fix #1 (prior): opacity-pops pinned. Fix #2 (v8.25.87): torso
  z-reordered in FRONT of both legs (killed torso-between-legs seam). Founder still
  saw flicker → Fix #3 (v8.25.91): the two legs were coplanar + IDENTICAL cream fill
  (their own shared edge z-fights as they cross) — shaded the BACK leg (left, ind 20)
  to cream x0.85 so the front leg reads OVER a shaded back leg (depth, not shimmer);
  recolor MAP updated so regen preserves it. Both structural z-fight causes now
  addressed; V1 figure renders clean. ESCALATION IF IT STILL FLICKERS: the cartoon
  Lottie itself is the limit — replace it with a purpose-built illustrated golfer
  (Founder is open to that; fits the fully-illustrated direction). Await Founder read.
- [x] SWING KNEE FLICKER (fix #2) — DONE v8.25.87 (LIVE+V1). Root-caused (subagent deep-dive):
  NOT opacity — those pops were all already pinned. It was STRUCTURAL z-fighting: the
  ANIMATING torso layer was painted BETWEEN the two coplanar, identically-colored
  legs, so its sweeping edge shimmered the shared leg boundary mid-swing. Fix =
  surgical layers-array reorder so the torso paints in FRONT of both legs (legs now
  adjacent, nothing animating between them). No geometry/motion/color/opacity change;
  all ind+parent preserved; applied to both -pb.json + source (recolor-safe). V1:
  figure renders correctly (torso cleanly over legs, no broken occlusion) — the
  seam that caused the shimmer is structurally gone.
- [x] SETTINGS POLICY back button — DONE v8.25.86 (LIVE): added a "← Back to
  Parbaughs" link to public/privacy.html + public/terms.html (history.back() when
  same-tab, else href="./" loads the app — robust for the window.open _blank case).
- [x] DANGER-ZONE CONFIRMATIONS — VERIFIED already solid: delete-account
  (firebase.js:519) requires password + typing the confirm word + a disabled button
  until both filled (double-confirm); quit-round shows #quit-confirm; block-member
  has a confirm sheet; delete-round has a del-confirm panel. All destructive actions
  gate. (Exhaustive every-button sweep is part of the E2E closeout.)
- [~] GITHUB HEALTH CHECK failed (Founder 2026-06-13 17:23) — DIAGNOSED as far as
  possible without run logs (gh NOT authed in this env): (1) lockfile is IN SYNC —
  `npm ci --dry-run` succeeds, so lockfile drift (the #1 CI failure) is RULED OUT;
  (2) version trio is consistent (.86 everywhere); (3) deploy.yml ALREADY has the
  recurrence prevention — `cancel-in-progress` (superseded ship+regen runs cancel
  instead of failing+emailing) + a documented Pages-401 OIDC-flake double-attempt
  retry; (4) prod IS deploying fine (main advanced to v8.25.86, every push returned
  a live Hosting URL). So the pipeline is fundamentally healthy + the common
  recurring causes are guarded. To root-cause the SPECIFIC red run the Founder saw
  + add any further guard, I need the run logs → **Founder: run `! gh auth login`**
  and I'll pull the failed run + fix the exact cause. Likely a one-off transient.
- [ ] CREATIVE REVIEW all pages + ANIMATION pieces (Founder 2026-06-13 17:23) — the
  9.5 convergence pass PLUS tasteful animated portions on pages that deserve them.
  Folds into the convergence-pass item below.
- [x] SWING SCENE redesign (v1) — DONE v8.25.81 (LIVE+V1): the SVG path was a dead end
  for "realistic" (Founder: "sky isn't green but realistic colors", "SVG not doing
  it justice"). Sourced a LICENSE-FREE real dawn-fairway PHOTO (Pexels) via the new
  online-asset approach ([[reference_online_asset_sourcing]]) and swapped it in for
  the green COURSE_SVG: real blue→lavender→gold sky + fairway-to-flag, golfer
  grounded on the box teeing DOWN the fairway (alignment fix), dark scrim for text.
  V1-confirmed (ready + mid-swing). Sent to Founder for the 9.5 verdict. NEXT on the
  same approach: merch + shop-item raster art (below). COURSE_SVG now dead — cleanup.
- [~] SHOP ITEM fidelity + EXPANSION (Founder 2026-06-13 13:59) — AXIS 2 (re-price)
  DONE v8.25.88 (LIVE): whole catalog re-cost x2 (floor 100→200, ceiling 2500→5000,
  rarity ordering preserved, round numbers, free stays free) — cosmetics no longer
  "too cheap." Cosmetic-only ParCoin, NOT cash IAP (no gambling-leg impact).
  REMAINING: axis (1) MORE items across categories (reuse existing worn-render
  classes), axis (3) richer design + name-vs-art fidelity via online-sourced art
  ([[reference_online_asset_sourcing]], reconsider photo vs illustrated per the
  swing cohesion lesson). Both = fresh-budget creative work.
- [x] RICH LIST redesign + ANIMATION — DONE v8.25.89 (LIVE+V1): editorial 'The money
  list.' masthead (Founder's name for it) replacing the legacy .sh/<h2>; the list
  now ANIMATES in — rows cascade up (staggeredReveal) + every lifetime total counts
  up from 0 (data-count), fired after the async Firestore load; reduced-motion-safe.
  Brass podium chips (top 3) + champion card for rank 1 already existed. This is the
  "animated money list" from the Founder's page-animation pass. V1-verified.
- [x] STANDINGS redesign — folds into the STANDINGS page lift (already DONE + V1'd:
  The Chase + editorial masthead + count-up + row reveal). Nothing further.
- [x] MERCH coming-soon image — DONE v8.25.90 (LIVE+V1): richer merch-SPECIFIC
  flat-vector ILLUSTRATED poster (subagent-authored, fits the chosen illustrated
  brand — NOT a photo, per the cohesion lesson): pro-shop peg wall w/ caps +
  headcover, struck-brass COMING SOON plate, PARBAUGHS MERCH header, claret pennant,
  York-PA maker's ribbon, double brass border + editorial 'Merch.' masthead.
  V1-verified premium retail-poster quality.
- [~] SHOP ITEM art + MERCH via AI gen — PIPELINE BUILT + KEY STORED; BLOCKED ON
  BILLING. Founder dropped a Gemini key (stored gitignored scripts/.secrets/
  gemini-key.txt) — auth WORKS, but the IMAGE model (gemini-2.5-flash-preview-image)
  returns 429 "free_tier_requests limit: 0": Gemini IMAGE gen is NOT free (the free
  500/day is TEXT models only). Needs BILLING enabled on the key's Google Cloud
  project (~$0.04/img ≈ pennies for all 7 assets). FOUNDER ACTION: enable billing at
  console.cloud.google.com (or aistudio billing) on the project tied to the key →
  then `node scripts/_gen-gemini-art.mjs` runs instantly → review public/img/gen/ →
  wire winners into shop.js/merch.js. (Free top-tier programmatic image gen genuinely
  doesn't exist in 2026: Pollinations x402-walled, Gemini-image=billing, Craiyon=low
  quality. A few cents of billing is the cheapest path to pro art.) Original note: -
  scripts/_gen-gemini-art.mjs generates premium cosmetic art (enamel club pin,
  struck-brass medallion, calfskin bag tag, sterling marker, green jacket,
  hole-in-one marker) + a merch hero flat-lay via Google Gemini 2.5 Flash Image
  (free 500/day). ONLY BLOCKER: the free key → scripts/.secrets/gemini-key.txt
  (gitignored). The instant the Founder drops it: run the script → review PNGs in
  public/img/gen/ → wire winners into shop.js item render + merch.js. (AI makes
  IMAGES not Lottie, so this covers shop/merch, not the swing animation.) Founder
  action = aistudio.google.com → Get API key. ([[reference_design_tools_kit]])
- [x] LINEN DRAFT theme REPLACEMENT — DONE v8.25.63 (LIVE+V1): replaced with
  "Bluebird" (crisp white + near-black navy ink ~11:1 + tour-blue accent — the only
  cool/blue theme, distinct from the 5 warm palettes). id kept; name → Bluebird.
  Verified high-contrast on home.

### Bigger features
- [x] FEED BOT CONSOLIDATION (Founder 2026-06-13) — DONE (prior session, code-verified
  LIVE): src/core/utils.js PB_CADDY sentinel ({id:"the-caddy",bot:true}) +
  isCaddyAuthor()/caddyChatDoc()/postCaddyChat() are the single source all bot WRITES
  route through; router.js caddyAvatarMark (felt disc + brass flag) + caddyBotBadge +
  getAvatar/renderAvatar/renderUsername short-circuit render every bot post under ONE
  "The Caddy" branded identity (legacy 'system'/'the-caddy' both fold in). feed.js +
  router-activity-feed.js both consume it (V1: the dark 'Caddy's Report' card renders
  as the single Caddy). AI ribs use the user's selected caddie voice (caddy-voices).
- [x] SEASON AWARDS gating — DONE v8.25.61 (LIVE+V1): Season Recap gates the Champion
  + Awards behind the Dec-1 check (current year before Dec 1 → 'sealed until Dec 31'
  pending card; standings read 'Current' not 'Final'). Mirrors the Wrapped gate.
  Verified on staging (2026 mid-season → awards sealed).
- [~] E2E data-workflow bug fixes surfaced by WF1 — NOT actionable in-agent: the
  WF1 output files (w6myyl5yi.output / w0u4t39i2.output) are GONE (prior-session
  temp tasks dir, cleaned), so the specific findings aren't recoverable; re-running
  WF1 needs the emulator (wedged localhost) or CI. Folds into the closeout E2E run
  (item 2) which runs in CI. The app has changed massively since WF1 (19 ships) so
  those findings are likely stale anyway — the fresh CI E2E run supersedes them.

### Founder follow-ups (AFTER current workload — Founder 2026-06-13 15:32)
- [ ] SECOND deep 9.5 review pass on EVERY page — same exhaustive WF2 rating method,
  push each page from its current ≥9.0 toward "close to or above 9.5". (The first
  pass lifted the bottom tier over 9; this is the convergence pass to 9.5.)
  **REINFORCED Founder 2026-06-13 16:07: "Pages are still bland and not meeting
  9.5 or greater."** The systematic masthead+token+motion treatment is clearing
  ≥9 but NOT clearing "bland" → 9.5. The convergence pass must go FURTHER than the
  recipe: real visual hierarchy + an asymmetric focal peak per page, richer
  materials (felt/brass depth, not flat cards), distinctive per-page identity
  (each page should NOT look like the same masthead+list template), denser/more
  characterful data display, and tasteful motion — benchmark against Linear/
  Stripe/Vercel per P7. "Bland" = too much sameness + not enough designed
  emphasis. Treat as the PRIMARY remaining UI workstream once the ≥9 lifts close.
- [x] Tasteful page ANIMATION pass — DONE across the app (LIVE+V1): animated money
  list / rich list (v8.25.89 cascade + count-up), Awards Night (v8.25.92 celebratory
  card cascade + masthead), Standings (The Chase + row reveal + count-up), Season
  Recap (staggeredReveal + fadeInScale + count-up), PLUS entrance motion added to
  profile/rounds/home/members/feed/courses/settings/trophy during the page lifts.
  All reduced-motion-safe, transform/opacity only, on-brand — "nothing overwhelming."
  (Further per-page bespoke animations can layer in during the 9.5 convergence pass.)

### Closeout — Founder-defined sequence (2026-06-13 17:15): do these IN ORDER, only
### after ALL tasks/items above are complete.
- [x] 1. Full per-page render re-rate — DONE (scripts/_route-rendersweep.mjs, against
  staging, member FatalBert): ALL 26 routes render cleanly (26 OK / 0 FAIL) after
  the ~21 ships this session — no regression. (≥9.0 render floor confirmed; the
  ≥9.5 visual rating is the Founder's per AMD-028.) The sweep surfaced 2 console
  permission-denied (wagers/chat) → fixed at the source v8.25.95 (pbWarn no longer
  spams the prod errors collection with the cold-sign-in rules-race transient).
- [ ] 2. FULL E2E test with MULTIPLE DATA scenarios spanning INDEPENDENT users AND
  CROSS-LEAGUE users (multi-league isolation, friend/messaging, no data leak).
  NOTE (2026-06-13): the local `npm run smoke` / `npm run test:e2e` CANNOT run in
  this agent environment — Vite dev-server port binding is wedged (httpServerStart
  fails even after killing all stray node procs; documented "wedged localhost",
  see [[reference_harness_tooling]]). In-session verification was done per-ship via
  the authed STAGING V1 capture (verify-as-member.mjs) — every v8.25.74→.92 change
  V1-verified that way. The smoke + E2E suites run clean in CI (GitHub Actions) —
  so this full E2E closeout runs THERE (or on a Founder workstation with a free
  port), not in-agent. gh-auth would also let me read CI results.
- [~] 3. FULL PEN TEST — APP-LAYER PASS (2026-06-13): secret scan CLEAN (the only
  client "key" is the Firebase web apiKey, public-by-design — security is via rules
  + auth; real secrets prod-SA + functions/.env are gitignored ✓). AgentShield scan
  ran: 6 HIGH — but ALL are AGENT-HARNESS CONFIG (the .claude/settings Bash/Write/Edit
  allow-list, node -e allow rules, the stop-hook's >/dev/null), NOT app/Firestore/
  injection vulns. The APP pen-test (rules/auth/injection/rate-limits) was GREEN in
  the exploit-test capstone (.claude/state/exploit-test-2026-06-12.md) + the rules
  audit. Remaining: the full multi-data E2E in CI (item 2, needs gh PAT) is the live
  exercise of the rules under cross-league data. Agent-config hardening = optional
  (it's the dev workspace, not the shipped app).
- [ ] GITHUB HARDENING (Founder 2026-06-13 19:30, AFTER all work) — the repo is
  PUBLIC, so ALL source + the .claude/state strategic docs (roadmap/BACKLOG/market-
  strategy/research) are visible to competitors. Founder wants to hide keys + IP that
  could be maliciously used; will buy GitHub private if needed but prefers hardening
  first. ANALYSIS: a public repo fundamentally exposes everything — true IP protection
  needs PRIVATE (his paid step) OR moving proprietary logic server-side (Cloud
  Functions). Without private: (a) keys are already clean (Firebase apiKey public-by-
  design, real secrets gitignored — VERIFIED); (b) the biggest exposure is .claude/
  state/ strategic docs (market strategy, roadmap, research) + this BACKLOG — could
  gitignore/move those out of the public repo; (c) scrub internal-only comments. But
  honest truth: meaningful IP protection = PRIVATE repo. Recommend private (cheap) +
  keep secrets gitignored. Continue other work first per Founder.
- [ ] 4. Polish + review pass over whatever 2–3 surface.
- [ ] 5. If E2E + data-test + pen-test all PASS → DONE. PushNotification to Founder;
  then WAIT on Founder for remaining founder-checklist items + dashboard/app review.
- [ ] Throughout: use online tools (Figma Make for onboarding/animations; online
  page graders/raters for recommendations) per Founder 2026-06-13 17:15 — get pages
  at/above 9.5, incorporate alterations as you go.

## Swing + shop (active Founder iteration 2026-06-12)
- [x] Sign-in swing rebuild — DONE v8.25.38→.41 on staging+prod: professional Lottie golfer recolored to brass/cream/felt-green (golf-swing-pb.json), CANVAS renderer (kills the structural knee z-fight), inline dawn course scene (green/hills/flag/sun) behind him, AUTO-OPEN flow (one tap or auto-tee → native-speed swing → app opens itself; no gate, no skip, no double-click). Verified via CAP_WITH_INTRO capture. Founder evaluating knees-in-motion on staging; hairline-seam fallback ready if any residual shudder.
- [x] Shop grid alignment — DONE v8.25.40 (flex-column cards, pinned actions, 14px gutters, line-clamps).
- [x] Shop worn-render — VERIFIED ALREADY SOLID (v8.24.76): playerRingClass maps all Pro Shop rings + renderAvatar applies the class (router.js:377); getPlayerCardClass maps card skins; pc29→plate-stimp, pc36→title-tag-leather, pc42→ring-claret all mapped. The shop-art workflow's "worn-render P9 bugs" premise + SHOP-ELEVATION-SPEC.md (2026-06-11) are STALE on this. No worn-render fix needed.
- [x] Shop cosmetic PREVIEW elevation — DONE v8.25.42 (rings: 104px premium object, ornamental art now visible) + v8.25.43 (nameplates reuse worn .plate-* classes on a shared surface stage — brass studs / yardage grid / sunday board / stimp stripe; flair + markers on the same stage, marker glyph 38→56px). Cards + titles already render well (walnut scorecard, engraved chips). One ground + one shadow, tokens, no gleam/filter (perf + restraint per the vetted plan). V1-verified rings + nameplates at element-readable size — both read premium. Founder evaluates the full shelf on staging; per-item WCAG fine-tuning follows his read.

## Deferred with evidence (NOT agent-actionable now — do not trap the hook)
- [~] seed-deploy-functions.mjs / F10b deploy — assessed RISK>VALUE: F10b (round-preserving onLeagueDelete) is a dormant safety-net for a near-never event (founding league is never deleted); deleteMyAccount already live (#24); onFeedbackEmail needs the Resend key. A botched Gen1 redeploy could break the 8 live member-facing CFs (searchCourses/joinLeague/etc.). Defer over risk. Code is committed + ready when a league-delete path is actually exercised.
- [~] #57 onboarding senior pass — cinematic swing FX shipped v8.25.31; Ship-1 flow rebuild on staging (project_onboarding_rebuild). Further visual leap waits on a Lottie asset.
- [~] store-app-icons — RESOLVED: honest 22-PNG set shipped v8.23.85, wired + live. Only a Founder taste-confirm (keep art / swap) remains. Not agent work.
- [~] Lottie swing character swap — needs a fetchable/authored Lottie asset (Founder taste/source). Cinematic-FX swing stands until then.
- [~] tee-time scheduler — researched-deferred (project_tee_time_scheduler_integration): write-back not viable; coordination-first model build deferred till after the UI marathon.

## Genuinely blocked (a secret ONLY the Founder can create — do everything around it)
- [~] Resend EMAIL SEND — needs the Resend API key. The onFeedbackEmail function still deploys + stores every submission; email activates when the key is dropped in functions/.env. Do NOT block the loop on this.
- [~] GitHub-issue triage — `gh` is not authenticated in this environment (`gh auth login` is interactive / a Founder credential). Founder can run `! gh auth login` in-session to unblock; until then the in-app feedback board (Admin) is the working triage channel.
- [~] parcoin Stage-2 (cash-IAP server-authoritative economy) — Founder-gated by his own rules: economy DESIGN change + payments (AMD-018 gate 4) + a gambling-leg legal review (cash-in pressures the not-gambling "no consideration" leg). Exact target list (client-trusted balance, wager settlement CF, bounty claim CF) is documented in the exploit-test report; build when the Founder green-lights the cash model.
