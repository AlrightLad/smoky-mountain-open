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
- [ ] DISTANCE TO PIN (Founder-greenlit 2026-06-13, Lane A) — GPS Front/Center/Back-of-green read in playnow + static per-hole yardage; crowdsourced green pins ($0, no gate). Spec in task-queue/founder/hole-diagram-self-position-plan.md. Substantial GPS build — fresh context, V1-verify the geolocation + per-hole coord path.
- [~] PLANNING ONLY (no code): hole diagram self-position + yardage — DONE: plan written to task-queue/founder/hole-diagram-self-position-plan.md (3 lanes + recommendation; Founder picks the lane).

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
