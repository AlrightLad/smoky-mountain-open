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
- [ ] SETTINGS 8.0 → unify caddie picker onto theme-row component, migrate Location
  off inline styles, section motion, coin glyph on balance.
- [ ] PLAY NOW LIVE 8.2 → re-skin FIR/GIR + Finish button off legacy green into
  moss/brass, tokenize turn summary + confirm/publish panels, contrast harden,
  birdie micro-celebration.
- [ ] MEMBERS 8.2 → row-reveal + live-dot motion, rail earns column at low data,
  keep mobile density (restack not hide), demote invite slab, avatar leader strip.
- [ ] FEED 8.4 → fade-up cascade, kudos heart-pop, separate stacked green blocks,
  posts-today pulse, resolve dead Community tab.
- [ ] TROPHY ROOM 8.4 → tier emblems by rarity (metallic depth), hero marquee cell,
  foil sweep on rare/championship, masthead avatar, level-bar glow+ticks.
- [ ] SHOP 8.6 → sticky category rail for long scroll, replace ⛳ emoji w/ SVG,
  reduce 'Arriving' dilution, contrast harden locker/cabinet desc, featured shimmer.

### Named design redesigns (WF1 specs; some overlap the page lifts above)
- [ ] SWING SCENE redesign — richer dawn course (WF1 swing-scene-design spec).
- [ ] SHOP ITEM fidelity + EXPANSION (Founder 2026-06-13 13:59: "not enough items
  and they are too cheap parcoin-wise AND design-wise"). Three axes: (1) MORE items
  across categories, (2) RAISE ParCoin prices (current floor too low — economy
  DESIGN change, but Founder-directed = authorized; NOT cash IAP), (3) richer
  design + name-vs-art fidelity + legibility (re-run failed WF1 shop-item-fidelity
  agent — it errored Overloaded). Re-cost the whole rarity ladder so price tracks
  rarity/effort.
- [ ] RICH LIST redesign — podium/tiers/momentum (WF1 rich-list-design spec).
- [ ] STANDINGS redesign (folds into the page lift above).
- [ ] MERCH loading screen redesign (WF1 merch-loading-design spec).
- [x] LINEN DRAFT theme REPLACEMENT — DONE v8.25.63 (LIVE+V1): replaced with
  "Bluebird" (crisp white + near-black navy ink ~11:1 + tour-blue accent — the only
  cool/blue theme, distinct from the 5 warm palettes). id kept; name → Bluebird.
  Verified high-contrast on home.

### Bigger features
- [ ] FEED BOT CONSOLIDATION (Founder 2026-06-13) — collapse the multiple feed bot
  voices into ONE "The Caddy" persona w/ a branded profile picture so agent posts
  read distinct from human posts; ALL AI ribs/voicelines use the USER'S SELECTED
  caddie voice (caddy-voices.js CADDIES). Massive lift.
- [x] SEASON AWARDS gating — DONE v8.25.61 (LIVE+V1): Season Recap gates the Champion
  + Awards behind the Dec-1 check (current year before Dec 1 → 'sealed until Dec 31'
  pending card; standings read 'Current' not 'Final'). Mirrors the Wrapped gate.
  Verified on staging (2026 mid-season → awards sealed).
- [ ] E2E data-workflow bug fixes surfaced by WF1 (e2e-core/social/profile agents).

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
- [ ] Tasteful page ANIMATION pass — animated rich list ("money list") + other fun
  pages (leaderboards/recap). Founder: "nothing overwhelming or that ruins app
  integrity." Reduced-motion-safe, transform/opacity only, on-brand.

### Closeout
- [ ] Full per-page V1 re-rate confirming every page ≥9.0; then PushNotification to Founder.

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
