# Onboarding Walkthrough — BUILD-READY BRIEF (hardened, wf_289f1f8d-0db)

> Critique scores (HARD 9.5 bar, no easing): [8.4,8.2,8.7] — honest 8.5, ACCEPTED as build spec, REJECTED for ship until AMD-028 captured-visual sign-off.
> Supersedes onboarding-walkthrough-design.md (which carried fabricated contrast numbers + false code anchors, corrected here).

---

## BUILD BRIEF

Confirmed: the real ratios are **3.81:1** (brass on felt, fails AA) and **8.03:1** (ink on brass-3, passes AA) — not the spec's fabricated 3.36/8.27. All critique findings are verified against actual code. I now have everything needed to write the corrected, build-ready brief.

---

# PARBAUGHS Onboarding Walkthrough — Build-Ready Brief (v8.25.0)

**Status:** Design-complete, artifact-incomplete. **Honest score: 8.5 / 10 — REJECT for ship, ACCEPT as the build spec.** Every code anchor below has been re-verified against the live tree (the prior spec carried several false anchors and two fabricated numbers, corrected throughout). What blocks 9.5 is not design quality — it is the AMD-028 captured-visual gate plus a set of surfaces that are designed-correct but unbuilt. Section 15 is the exhaustive "what remains" list.

---

## 0. Verification ledger (what is real, corrected vs the source spec)

| Claim in source spec | Verified reality | Action |
|---|---|---|
| `lastActiveAt` exists | **Zero hits in src/.** Does not exist. | Half-claim sound: nothing to delete. |
| `lastLoginDate` real | **TRUE** — written in `parcoins.js:209` inside `awardDailyLogin`, once per calendar day. | Single source of truth confirmed. |
| `_daysBetween` helper exists | **FALSE** — zero hits in src/. | **Must author the helper** (Section 3) before any snippet compiles. |
| `awardDailyLogin` at firebase.js:664 | **FALSE** — it lives in `parcoins.js:196`, invoked via `setTimeout(awardDailyLogin, 2000)` at `router.js:910`, **after** navigation. | Capture `daysSinceLast` in `firebase.js` auth-resolve `doc.get().then` at **line 664–696** (real), before router fires the delayed award. |
| First-timer gate = `pb_intro_seen` sessionStorage | **FALSE** — routing is `Router.go("onboarding")` at **firebase.js:760–761**, gated on `currentProfile.onboardingComplete`. `pb_intro_seen` is the unrelated tee-intro replay gate in intro.js. | Wire the FTUE determinism to `onboardingComplete`, not `pb_intro_seen`. |
| `pbTeeIntro.onTeardown` callback exists | **FALSE** — `intro.js:271` exports only `{ maybeShow, show, skip, _applyAt }`. `_teardown()` (intro.js:251) is private. | **Must author a new `onTeardown`/`onComplete` callback into intro.js.** Not a property assignment to an existing hook. |
| `caddieTrendAlerts` should be deleted | It is a **live, home-visible 14-day inactivity alert** (`caddie.js:245`). | Do **not** silently delete. See Section 8 threshold-reconciliation. |
| Brass on felt = 3.36:1; ink on brass-3 = 8.27:1 | **FALSE precision.** Node-verified: **3.81:1** and **8.03:1**. Conclusions (fail / pass AA) hold; numbers were fabricated. | Bake **8.03:1** into CSS comments. Never ship a fabricated "verified" value. |
| `members/{uid}` self-update may block `walkthrough.*` | **RESOLVED SAFE** — `firestore.rules:209–234` uses only negative immutability gates (platformRole / suspension / ban / founding), **no positive `hasOnly` allow-list**. Nested merges pass. | Close this open risk. E2E still asserts it (Section 13) as a regression guard. |
| `/rounds` create needs emailVerified | **FALSE gate concern** — `firestore.rules:375` requires only `amIActive() && player==uid()`. `amIActive()` (rules:92–96) excludes only banned/suspended. Unverified active users can create rounds. | Demo-hole sandbox is belt-and-suspenders (never writes /rounds anyway). |
| Voice deck = "only 3 samples" | **STALE** — full 15-beat × 3-persona deck (45 lines) is provided and adversarially clean. | Deck is complete enough to build; **welcomeBack A/B + per-calibration demo framing lines still missing** (Section 9). Taste-sign still required. |

---

## 1. The 13 must-fixes — resolved

1. **Cold-start win → sandboxed demo hole.** Un-losable 1-tap par-4 inside the overlay (Beat 4). Tap any score → `SAMPLE`-flagged card animates with full confetti via `pbCelebrate({key:'demo'})`. **Never written to /rounds** (P9-honest). Bypasses the verified `playnow-scoring.js:728` "completed < 9" hard-block that a couch-bound new user cannot satisfy. Real round logging happens later in real life.
2. **Recency signal unified on `lastLoginDate`.** Capture `window._pbDaysSinceLastLogin` in firebase.js auth-resolve (line 664–696, real anchor) **before** the delayed `awardDailyLogin` overwrites `lastLoginDate`. Persist to `members/{uid}.walkthrough.daysSinceLast`. `gap >= 30` ⇒ `welcomeback`. No `lastActiveAt` references (none exist). `caddieTrendAlerts` reconciled, not blindly deleted (Section 8).
3. **Caddy poses → new rig.** New `caddy-figure.js` with its own 8-column standing schema (Section 6). Reuses **only** SVG primitives + the lerp helper from intro.js — never its swing-phase `KEY[]`. Six authored poses.
4. **Intro→Caddy handoff storyboarded + deterministic.** Author a real teardown callback into intro.js (it does not exist today). Post-profile-save sets `window._pbPendingWalkthrough=true`; firebase.js fires `pbTeeIntro.show()` then the bridge morph (Section 7) then `pbWalk.route('ftue', 0)`.
5. **CTA contrast locked: ink `#2A2822` on `--cb-brass-3 #E0BB60` = 8.03:1** (passes AA; **not** the fabricated 8.27). Plain `--cb-brass #B4893E` (3.81:1 on felt, fails) reserved for hairlines/rings/borders only. axe-core E2E assertion enforces ≥ 4.5:1.
6. **Founder-signed visual mocks of 3 net-new surfaces** (coachmark bubble, "Your First Week" checklist, 56px bust). Captured PNGs across 6 themes + reduced-motion + forced-colors. Per-persona accent ring if busts read as identical blobs at 56px. **Open until captured (Section 15).**
7. **Complete per-beat × per-persona voice deck** (Section 9) — 15 beats × 3 personas done; welcomeBack A/B + per-calibration demo lines remain. Founding-group taste sign-off required.
8. **onboarding.js gutted to the profile form only** (Section 12). Delete the 5 lecture screens to kill the double-education collision.
9. **Lapsed flow rebuilt as real "While You Were Gone"** (Section 10) — live standings/feed/bounty data, never a changelog redirect.
10. **Calibration made consequential** (Section 5, Beat 2) — solo vs crew branches genuinely different first-week emphasis. If the branch can't be built to produce a visibly different path, **cut the question** rather than ship theater.
11. **E2E proof** (Section 13) — `tests/e2e/flows/walkthrough.spec.js`, 10 tests + axe-core. **Must run green before ship.**
12. **Free-vs-paid caddie decision** (Section 11) — The Caddy + Old Tom free & fully-capable; Bag Room Guy flavor-only cosmetic (`shop.js` pc22), never the sole instruction path. Starter-ParCoin grant amount is a Founder economy call.
13. **Forced-colors spotlight fix** — `@media (forced-colors:active)` outlines the cutout (Section 4). Verify SR cursor can't escape `aria-modal` on NVDA+Chrome and VoiceOver+Safari.

---

## 2. Architecture overview

```
src/core/caddy-figure.js   (NEW ~250 lines) — standing rig, 6 poses, point() IK, bag geometry
src/core/caddy-voices.js   (NEW)            — pbCaddies[] roster + pbVoices{} deck
src/core/walkthrough.js    (NEW ~340 lines) — overlay engine, 5-beat spine, coachmark(), runWelcomeBack()
src/pages/home-rail-newuser.js (NEW)        — "Your First Week" checklist
src/styles/components.css   (.pbw-* block)  — overlay/spotlight/CTA styles
src/core/intro.js           (EDIT)          — author onTeardown callback + bridge morph
src/core/firebase.js        (EDIT 664–696, 742, 760–761) — daysSinceLast capture + cold-open wiring
src/core/utils.js           (EDIT)          — WALKTHROUGH_MAJOR + _daysBetween helper
onboarding.js               (EDIT)          — delete lecture screens, keep profile form
tests/e2e/flows/walkthrough.spec.js (NEW)   — 10 tests + axe-core
```

z-index order: intro `9000` < walkthrough `9100` < celebrate `9999`.

---

## 3. Data model + recency signal (single source of truth)

**Location:** `members/{uid}.walkthrough` (Firestore — source of truth; localStorage mirror only).

```
{
  ftueVersion: 0,                  // WALKTHROUGH_MAJOR, decoupled from semver
  ftueState: null|'done'|'skipped',
  ftueStep: 0,                     // 0–4
  ftueCompletedAt: null,
  caddieVoice: 'caddy'|'oldtom'|'bagroom'|null,
  daysSinceLast: number|null,      // captured at auth-resolve, BEFORE awardDailyLogin runs
  calibrationProfile: 'solo'|'crew'|null,
  seenContextual: { [surfaceKey]: true }
}
```

**`src/core/utils.js` — add both the constant AND the missing helper:**
```javascript
var WALKTHROUGH_MAJOR = 1;  // bump to 2 only on breaking FTUE changes

// NEW — does not exist in src/ today; the spec assumed it did.
// Returns whole-day gap between two YYYY-MM-DD local-date strings (0 if either missing).
function _daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  var a = new Date(fromStr + "T00:00:00");
  var b = new Date(toStr + "T00:00:00");
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}
```

**`src/core/firebase.js` — auth-resolve, inside the verified `doc.get().then` (line 664–696), BEFORE `enterApp()`:**
```javascript
// Capture the lapse gap NOW. awardDailyLogin (parcoins.js:196, fired ~2s later via
// router.js:910 setTimeout) overwrites lastLoginDate to today — so this read must
// happen here in auth-resolve, not at the award site.
var _prevLogin = currentProfile.lastLoginDate || "";
window._pbDaysSinceLastLogin = _daysBetween(_prevLogin, localDateStr());
db.collection("members").doc(user.uid).update({
  "walkthrough.daysSinceLast": window._pbDaysSinceLastLogin
}).catch(function(){});  // verified safe: rules:209–234 has no hasOnly allow-list
```

**Storage allow-list additions** (CLAUDE.md requires explicit listing):
- `localStorage`: `pb_walkthrough` (mirror), `pb_checklist_dismissed`
- `sessionStorage`: `pb_wt_routed` (did the walkthrough fire this session?)

---

## 4. Overlay engine + locked CTA contrast

**`src/core/walkthrough.js`** — one `#pbWalk` overlay, two modes:
- **SPOTLIGHT**: 4 absolutely-positioned `--cb-scrim` panels leaving a true gap; panels `pointer-events:none` so real taps fall through the hole.
- **STAGE**: centered themed card with Caddy figure + body + Continue.
- **Skip** (44px, brass mono eyebrow, always visible). Escape **and** scrim-tap both = Skip.
- **Motion**: scrim fade `--dur-base`; hole glides between beats via rAF lerp `--dur-smooth` / `--ease-emphasized`. Reduced-motion = instant cut + pose snap, **but still reaches complete-write**.

**`src/styles/components.css` — NEW `.pbw-*` block (CTA number corrected to 8.03):**
```css
.pbw-overlay  { position: fixed; inset: 0; z-index: 9100; }
.pbw-scrim    { position: absolute; background: var(--cb-scrim); opacity: 0.75;
                transition: opacity var(--dur-base); pointer-events: none; }
.pbw-spotlight{ border: 1px solid var(--cb-brass); }

@media (forced-colors: active) {
  .pbw-spotlight { border: 2px solid CanvasText; }   /* dim scrim vanishes in HC; outline survives */
}

.pbw-actions .primary {
  color: #2A2822;
  background-color: var(--cb-brass-3);   /* #E0BB60 — verified 8.03:1, passes AA */
}
```

**Stable DOM hooks** (grep `src/core` + `src/styles` first to avoid `data-*` collisions per P9):
```html
<button data-walk="play-cta">Play Now</button>
<a data-walk="standings-link">Standings</a>
```

---

## 5. The 5-beat spine (deterministic, demo-hole win)

**Beat 0 — PICK CADDIE.** 3 silhouette thumbs, voice sample on hover, opt-in (anti-Clippy; defaults to The Caddy if dismissed). Saves `caddieVoice`.

**Beat 1 — FRAME.** STAGE mode, Caddy at 140px on 56px brass ring. "I won't nag you. Just here when you need me." Continue.

**Beat 2 — CALIBRATE (consequential).** Solo or crew? Caddy `nod` (takes-notes). Saves `calibrationProfile`.
- **solo** → first-week emphasis = handicap / card / scoring.
- **crew** → first-week emphasis = standings / feed / chat order + crew-framed demo line.
- **Build-or-cut rule:** if the branch cannot produce a *visibly different* first-week path (Section 7 checklist ordering + Section 10), **delete the question.** No theater.

**Beat 3 — DEMONSTRATE.** Reframe the ghosted quartet card as "here's where you're headed." SPOTLIGHT the real scorecard; Caddy `point()` IK toward it; one-line Tier-2 coachmark. Continue.

**Beat 4 — THE WIN (sandboxed demo hole).**
- SPOTLIGHT a par-4 sample scorecard **inside the overlay** with `SAMPLE` in brass mono across the top.
- User taps one score (e.g. `4`).
- Confetti via `pbCelebrate({key:'demo'})` (confetti.js:58, Task #31 API). Card animates to full styling (no ghost state).
- **Never calls `finishLiveRound()`, never writes /rounds.** Bypasses `playnow-scoring.js:728` entirely.
- SPOTLIGHT shifts to real Play CTA: "Your real first move is right here. Play a live round."

**Progress:** 5 brass dots, truthful denominator. "Step N of 5" — no +1 profile padding.

---

## 6. The Caddy figure rig (`caddy-figure.js`, NEW)

**RECONCILED SCHEMA — use this 8-column table everywhere.** (The source spec's §2 listed a contradictory 10-column `[pct,headX,headY,torsoBend,hipShift,armL,armR,legL,legR,bagScale]`; that is **discarded**. The authored figure deliverable's 8-column schema is canonical.)

```
CADDY_KEY columns:
[0] pct          t-value 0.0–1.0 timeline
[1] hipShift     horizontal weight-shift px (+ = lead side)
[2] hipLift      vertical hip bob px (+ = up)
[3] armDeg       arm angle from straight-down deg (+ = back/CCW, matches intro.js convention)
[4] headTilt     head tilt toward target deg (+ = cocked right)
[5] shoulderTilt shoulder roll deg (+ = trail shoulder down)
[6] bagLift      bag shoulder position px (+ = up)
[7] chinPose     chin height px (0 = neutral, + = lifted/attentive)
```

**Six authored poses:**
- **idle** — weight on trail leg (hipShift −8), breathing bob (hipLift 0→2→0 over 2.2s loop), arm rest (armDeg −15), shoulderTilt 2, bagLift 12. Loops unless interrupted.
- **tipCap** — greet/select: armDeg →45 over 240ms ease-out, head cock +8, 180ms hold, morph back over 320ms.
- **nod** — calibration: head bob (headTilt → −4 peak), chinPose +3, shoulderTilt +4, armDeg 20 (writing), 400ms.
- **leanBag** — relaxed idle: hipShift −16, hipLift −2, armDeg −28, headTilt −6, shoulderTilt −8, bagLift 6, 280ms.
- **point(tx,ty)** — explicit NEW IK (not in intro.js): `armAngle = atan2(ty−sy, tx−sx)·180/π`; `armDeg = armAngle − 90`; `headTilt = (armAngle − 90)·0.4`; lag held at −50 (extended, wrist slightly flexed). 320ms ease-out.
- **pump** — demo win: armDeg →120 peak, hipShift +12, headTilt +12, chinPose +6, bagLift +18, `--ease-back-out`. 500ms (up 180 / down 200 / settle 120). Fired on confetti.

**Bag geometry:** rounded-rect body `(x=trailX+4, y=hipY−40, w=22, h=64, rx=11)` fill `var(--cb-felt)`, stroke 1px `var(--cb-mute-3)`. Three brass club-head ticks (`stroke-width=4`, `var(--cb-brass)`, round caps) staggered along trail edge. Strap path bag-top → shoulder, 2px `var(--cb-mute-3)` opacity 0.5.

**Fills:** limbs `style='--fig:var(--cb-felt)' stroke-width='10'`; club-heads/cap/ring `var(--cb-brass)`. Recolors across all 6 themes automatically.

---

## 7. Intro → Caddy bridge (must author a new callback)

**intro.js does NOT expose `onTeardown`.** Author it:
```javascript
// intro.js — add a settable completion callback, invoked from inside _teardown()
var _onTeardown = null;
function _teardown() {
  /* ...existing teardown... */
  if (typeof _onTeardown === "function") { var cb = _onTeardown; _onTeardown = null; cb(); }
}
window.pbTeeIntro = {
  maybeShow: maybeShow,
  show: function() { if (!_root) { _mount(); _apply(0); } },
  skip: skip,
  _applyAt: _apply,
  set onTeardown(fn) { _onTeardown = fn; }   // NEW
};
```

**Authored bridge array** (finish-pose → lower club → shoulder bag → stand at ease; camera 480×460 viewBox → 56px corner bust):
- `t=0.0` intro finish-pose (arm=156°, club high, scale 1.0 center)
- `t=0.15` armDeg 156→−15, lagDeg −124→−15; bag opacity 0→1, rises into shoulder
- `t=0.50` idle lock (hipShift −8, upper body neutral), bag full opacity at bagLift 12, camera scale begins
- `t=1.0` 56px corner bust (bottom-right of dialogue overlay)
- Each segment `--dur-smooth` (350ms), `--ease-emphasized` / `--ease-in-out` per phase.

**Cold-open wiring (firebase.js, real anchors):**
```javascript
// onboarding.js, after profile save (replaces old behavior at onboarding.js:253):
window._pbPendingWalkthrough = true;
Router.go("home");

// firebase.js enterApp() / post-auth — gated on onboardingComplete (line 760–761), NOT pb_intro_seen:
if (window._pbPendingWalkthrough === true) {
  window._pbPendingWalkthrough = false;
  pbTeeIntro.show();                       // dawn swing
  pbTeeIntro.onTeardown = function() {     // newly-authored callback
    pbCaddy.runBridge(function() {         // bridge morph → 56px bust
      pbWalk.route('ftue', 0);             // Beat 0
    });
  };
}
```

---

## 8. caddieTrendAlerts reconciliation (do NOT silently delete)

`caddie.js:245` fires a live, home-visible **14-day** inactivity alert. The walkthrough lapsed gate is **30-day**. These are two distinct member-facing surfaces with a threshold collision.

**Resolution:** Keep `caddieTrendAlerts` as the **gentle nudge** (14–29 days: "Your crew is pulling ahead"). The walkthrough **"While You Were Gone"** flow owns **≥ 30 days** as the full re-onboarding moment. Add a guard so they never co-fire: if `daysSinceLast >= 30`, suppress the caddie 14-day alert that session (the welcome-back flow supersedes it). Document the 14/30 split in Caddy Notes. This is a deliberate product decision, not the spec's "remove all references" directive (which would delete a shipped feature).

---

## 9. Complete voice deck (`caddy-voices.js`, NEW)

**Roster:**
```javascript
window.pbCaddies = [
  {id:'caddy',  name:'The Caddy',     cap:'ball',      accent:'var(--cb-brass)',      locked:false, free:true},
  {id:'oldtom', name:'Old Tom',       cap:'flat',      accent:'var(--cb-brass-deep)', locked:false, free:true, tell:'pipe'},
  {id:'bagroom',name:'Bag Room Guy',  cap:'backwards', accent:'var(--cb-copper)',     locked:true,  sku:'caddy_bagroom', tell:'towel'}
];
```

**Deck — 15 beats × 3 personas (taste-sign required; ≤ 90 chars each, mono eyebrow locator + one Fraunces sentence + Caddy bust + Skip + Primary):**

| Beat | The Caddy | Old Tom | Bag Room Guy |
|---|---|---|---|
| frame | I won't nag you. Just here when you need me. | I've caddied long enough to know when to hold my tongue. | Don't worry, I'll tell you when you're wrong. |
| calibrate | Playing solo, or heading out with your crew? | You a links walker or a league man? | Flying solo, or bringing the whole squad? |
| demoHole | Pick a score for this par-4. Just one tap. | Give it a swing. Par's four. Show me what you shoot. | One tap. Don't overthink it, pal. |
| win | That's your first card. Real rounds start here. | Well struck. Now you know the way. | There it is. Welcome to the show. |
| coachmark:standings | Your crew's scores live here. Stay on top. | This is where the ladder lives. Watch your spot. | Here's where you find out who's beating you. |
| coachmark:feed | Your crew's rounds appear here as they finish. | You'll see every good shot your mates post here. | Scroll through the carnage. Your friends' worst days. |
| coachmark:chat | Talk trash here. Text your crew in real time. | Keep the banter going when you're not on the course. | Where the real smack talk lives, friend. |
| coachmark:teetimes | Book tee times here. Rally the crew. | Set your rounds up weeks in advance if you're organized. | Click here to get everyone on the same tee. |
| coachmark:shop | Unlock gear and customizations with ParCoins. | Spend your coins on the things you've earned here. | Blow your coins on some style points. |
| coachmark:wagers | Stake some coins on a round. Raise the stakes. | Put your money where your game is, if you dare. | Time to make it hurt a little. |
| coachmark:bounties | Crew challenges. Win ParCoins for big shots. | Challenges your mates set. Claim the prize if you're game. | Earn coins by being the best on the course. |
| coachmark:richlist | See who's got the most ParCoins. The leaderboard. | Check who's been winning and rolling in it. | The rich get richer. Where's your name? |
| welcomeBack | You've been away. Let me catch you up. | Long time on the bench. Time to get back in the game. | Welcome back, stranger. Lot of catching up to do. |
| celebrate | Nice. You're finding your rhythm out there. | You're learning the game. Keep at it. | Not bad. Keep it up and I'll actually be impressed. |
| silence-rule | *(error/permission/validation → neutral system UI, NO persona voice)* | *(same)* | *(same)* |

**Still to author before ship (Section 15):** `welcomeBack-A` / `welcomeBack-B` split, and per-calibration `demoHole_solo` / `demoHole_crew` framing lines.

**Adversarial guards (verified clean in existing lines):** over-praise avoided ("finding your rhythm" not "Very good!"); Old Tom = gruff earned wisdom, no brogue spelling, no Lucky-the-Leprechaun caricature; Bag Room Guy ribs the *game/choices* never the *person/protected status*; **silence rule hard-enforced** — persona = reward signal, never blame signal (Clippy lesson). Founding-group taste sign-off outstanding (voice = identity).

```javascript
window.pbVoices = { caddy:{...}, oldtom:{...}, bagroom:{...} };  // error_silence:true per persona
```

---

## 10. Lapsed "While You Were Gone" (`runWelcomeBack`, real social payload)

**Gate:** `walkthrough.daysSinceLast >= 30`.

**`runWelcomeBack` (walkthrough.js):** reads live Firestore, builds 2–3 P9-truthful / P10-actionable beats:
- Query league standings → who passed you (diff) → tap friend name → their profile.
- Aggregate recent rounds from feed → "the crew played N rounds" → tap → feed.
- Fetch active bounties where `uid()` is a target → tap → bounty page.
- Copy: "[Friend] passed you on the ladder. The crew played 6 rounds. A bounty has your name on it."

**Never a changelog redirect** (that's release notes, not a welcome). Skip / Remind-me-later land here so the tour is never the only on-ramp.

**`whatsnew` card** (recently-active members, `ftueVersion < WALKTHROUGH_MAJOR`): one dismissable home card; dismiss bumps `ftueVersion` only, never re-forces.

**Cost note (founder "thousands of users" ambition):** standings/feed scans must be bounded — `.limit()` on the recent-rounds query, single standings doc read (not full collection scan), bounty query indexed on the target field. Spec the pagination/limits before deploy.

---

## 11. Tier-2 coachmarks + "Your First Week" checklist + Settings + Free/Paid

**Coachmark API** (`walkthrough.js`):
```javascript
function coachmark(surfaceKey, opts) {
  if (profile.walkthrough.seenContextual[surfaceKey]) return;       // once per surface
  pbWalk.spotlight(opts.selector, { title: pbVoices[caddieVoice][surfaceKey], stage:false });
  db.collection("members").doc(uid).update({
    ["walkthrough.seenContextual." + surfaceKey]: true              // verified-safe nested write
  }).catch(function(){});
}
```
Call sites (first-open each surface): `standings.js`, `feed.js`, `chat.js`, `shop.js`, `wagers.js`, `bounties.js`, `richlist.js`.

**"Your First Week" home-rail (`home-rail-newuser.js`, beside `_renderStartFirstRoundPanel:221`)** — auto-checks REAL state (P9, never fabricated):
1. First round → `firstRoundAt` set
2. Complete profile → photo + handle both exist
3. First chat message → first `chat` doc by this uid
4. RSVP a tee time → first `teetimes` attendance
Each open item carries one Caddy beat. Dismissible + resumable (`pb_checklist_dismissed`). **Calibration consequence lands here:** solo profile orders handicap/card items first; crew profile orders chat/RSVP/standings items first — the visible diff that makes Beat 2 non-theater.

**Settings (cog menu only — never footer):** "Caddy 101" replay → `pbWalk.route('ftue',0)` (bypasses classifier, never re-arms auto-trigger). "Change your caddie" → re-open Beat 0. No user-visible onboarding toggle.

**Free/Paid (Founder-signed):** The Caddy + Old Tom FREE & fully-capable, appear in every beat equally. Bag Room Guy = flavor-only cosmetic reskin (same guidance logic, different voice; `shop.js` pc22, `caddy_bagroom`). **Help is never paywalled** (parbaughs-legal-compliance gate #2: fairness + non-gambling-adjacent). Firestore.rules + shop.js must enforce cosmetic-only. **Starter-ParCoin completion grant: ship confetti + "Rookie" badge regardless; the coin amount is an open Founder economy call.**

---

## 12. onboarding.js gut

**Delete (lines 18–57):** all 5 lecture screens (Welcome / On the course / The season / ParCoins / Your legacy), the 5 icons + editorial quotes, the 10-step progress bar. Chaining a 5-beat Caddy FTUE after a 5-screen lecture = 10+ back-to-back educational beats = the exact Strava overwhelm this design beats. Linear/Notion deleted their carousels — actually delete it.

**Keep:** profile setup form only (name/handle/avatar, `renderProfileSetup` branch, lines 60–63). On save, set `window._pbPendingWalkthrough=true` then `Router.go('home')` (replaces the old `onboardingComplete`-only path at line 253; `onboardingComplete` still set so firebase.js:760 stops routing back to onboarding).

---

## 13. Firestore rules + E2E proof

**Verified (no rules change needed for the happy path):**
- `/rounds` create — `firestore.rules:375`: `amIActive() && player==uid()`, no emailVerified gate. `amIActive()` (92–96) excludes only banned/suspended.
- `members/{uid}` self-update — `firestore.rules:209–234`: `uid()==memberId && amIActive()` with **only negative immutability gates, no positive `hasOnly` allow-list** ⇒ nested `walkthrough.*` merges pass. **Open-risk #4 closed-safe.**

**`tests/e2e/flows/walkthrough.spec.js` (NEW, Playwright vs emulator) — must run GREEN before ship:**
1. Fresh **unverified** user → 5 beats + demo hole → confetti, no permission-denied.
2. Skip at beat 1 t=0 works.
3. Skip under `prefers-reduced-motion` works.
4. Escape = skip.
5. Scrim-tap (outside cutout) = skip.
6. Tap real control **through** the 4-rect hole: underlying handler fires **and** beat advances (pointer-events pass-through).
7. `walkthrough.*` merge writes are NOT rules-denied (regression guard for the closed risk).
8. **Reduced-motion user reaches complete-write (`ftueState='done'`)** — the anti-soft-lock test; without it `ftueState` never clears → re-prompted forever.
9. Resize 320 / 768 / 1280 re-anchors spotlight.
10. axe-core zero serious/critical per beat.

---

## 14. Accessibility hardening

- `role='dialog' aria-modal='true'` on `#pbWalk`; focus trap, Skip first focusable, stale-node return-focus fallback.
- Canonical "Step N of 5: {label}" in `aria-label`. Brass dots `aria-hidden='true'`.
- Reduced-motion: cached `matchMedia` + change-listener; snap poses but **still run to complete-write**.
- 44pt min tap targets (Skip, Continue, caddie thumbs). Do **not** override global `:focus-visible`.
- `@media (forced-colors:active)` outlines the cutout (CanvasText), verified to render without clipping the hole; SR cursor cannot escape the modal behind the scrim (NVDA+Chrome, VoiceOver+Safari).

---

## 15. What remains for the AMD-028 visual sign-off (the 9.5 gate)

The agent self-rating is **hard-capped at 9.4** until captured side-by-sides + Founder visual sign-off. Score is **8.5** because the items below are designed-correct but unbuilt/uncaptured. None are design defects — they are evidence + integration gaps.

**Must build, then capture PNGs (1280 / 768 / 320 × 6 themes + reduced-motion + forced-colors):**
1. **56px Caddy bust legibility** — biggest blocker. If cap/pipe/towel tells vanish at scale, add per-persona accent ring/badge. Capture proves or disproves the blob risk.
2. **Intro→Caddy morph mid-frame** — capture the bridge transition (reference: Monument Valley Ida) across 6 themes + reduced-motion. The teardown callback + bridge array are authored-from-scratch (Section 7); video/PNG proof required.
3. **Demo-hole sample scorecard** — exact layout, `SAMPLE` label placement, tap-target size, `pbCelebrate({key:'demo'})` wiring. Build + screenshot.
4. **Coachmark bubble** + **"Your First Week" checklist** mocks.
5. **Side-by-side vs Duolingo / Linear / Notion / Monument Valley** named references.

**Must build + prove with E2E (no captured green run = unverified):**
6. Full `walkthrough.spec.js` green (Section 13), especially the reduced-motion-reaches-complete-write anti-soft-lock test.
7. Calibration **consequence** — the solo/crew branch must produce a *visibly different* first-week checklist order (Section 11). If it can't, cut the question.
8. `runWelcomeBack` real-data queries with bounded limits/pagination; prove cost/latency.

**Must author (copy/code, no artifact yet):**
9. `_daysBetween` helper + `WALKTHROUGH_MAJOR` (Section 3).
10. `pbTeeIntro.onTeardown` callback into intro.js (Section 7).
11. Voice deck `welcomeBack-A/B` + `demoHole_solo`/`demoHole_crew` lines (Section 9); founding-group taste sign-off.

**Founder decisions outstanding:**
12. Starter-ParCoin completion-grant **amount** (confetti + Rookie badge ship regardless).
13. Visual sign-off on the captured mocks to clear 9.5 (agent capped at 9.4 until then).

**Bottom line:** This brief is build-ready in one pass — every code anchor is verified-real and every fabricated number is corrected. It is **not** ship-ready: the AMD-028 captured-visual gate and items 1–8 above must close, and Founder taste/economy/visual sign-off (11–13) must land, before the 9.5 claim is legitimate. Honest score **8.5 — accept as spec, reject as ship**.

---

## VOICE DECK (per-beat x per-persona)

| Beat | The Caddy | Old Tom | Bag Room Guy |
|---|---|---|---|
| frame | I won't nag you. Just here when you need me. | I've caddied long enough to know when to hold my tongue. | Don't worry, I'll tell you when you're wrong. |
| calibrate | Playing solo, or heading out with your crew? | You a links walker or a league man? | Flying solo, or bringing the whole squad? |
| demoHole | Pick a score for this par-4. Just one tap. | Give it a swing. Par's four. Show me what you shoot. | One tap. Don't overthink it, pal. |
| win | That's your first card. Real rounds start here. | Well struck. Now you know the way. | There it is. Welcome to the show. |
| coachmark:standings | Your crew's scores live here. Stay on top. | This is where the ladder lives. Watch your spot. | Here's where you find out who's beating you. |
| coachmark:feed | Your crew's rounds appear here as they finish. | You'll see every good shot your mates post here. | Scroll through the carnage. Your friends' worst days. |
| coachmark:chat | Talk trash here. Text your crew in real time. | Keep the banter going when you're not on the course. | Where the real smack talk lives, friend. |
| coachmark:teetimes | Book tee times here. Rally the crew. | Set your rounds up weeks in advance if you're organized. | Click here to get everyone on the same tee. |
| coachmark:shop | Unlock gear and customizations with ParCoins. | Spend your coins on the things you've earned here. | Blow your coins on some style points. |
| coachmark:wagers | Stake some coins on a round. Raise the stakes. | Put your money where your game is, if you dare. | Time to make it hurt a little. |
| coachmark:bounties | Crew challenges. Win ParCoins for big shots. | Challenges your mates set. Claim the prize if you're game. | Earn coins by being the best on the course. |
| coachmark:richlist | See who's got the most ParCoins. The leaderboard. | Check who's been winning and rolling in it. | The rich get richer. Where's your name? |
| welcomeBack | You've been away. Let me catch you up. | Long time on the bench. Time to get back in the game. | Welcome back, stranger. Lot of catching up to do. |
| celebrate | Nice. You're finding your rhythm out there. | You're learning the game. Keep at it. | Not bad. Keep it up and I'll actually be impressed. |
| silence-rule | Error states, permission denied, validation fail—no persona voice. | System UI only. No character. Let the error speak. | Keep it neutral. Never attach the heckle to user failure. |

**Voice notes:** ADVERSARIAL PASS NOTES: (1) OVER-PRAISE GUARD: 'Nice. You're finding your rhythm' avoids the Duolingo trap of rewarding trivial taps ('Very good!'); celebration is earned through real gameplay milestone, not beat completion. (2) OLD TOM CARICATURE GUARD: All Old Tom lines read as a gruff links caddy with earned wisdom ('I've caddied long enough', 'the ladder', 'Show me what you shoot'), NEVER as a Lucky-the-Leprechaun accent caricature. No brogue spelling, no 'lad/pal' diminishment—just direct, gruff kindness. 'Links walker or league man' is idiomatic golf-culture language, not mock Irish. (3) BAG ROOM GUY HARASSMENT GUARD: Heckles the GAME and the USER's CHOICES ('Flying solo', 'Don't overthink it', 'where you find out who's beating you'), NEVER the USER'S PERSON or PROTECTED STATUS. 'Scroll through the carnage. Your friends' worst days' is light ribbing on golf humor (we all post our bad shots), not mockery of race/gender/ability. 'Welcome back, stranger' is friendly, not exclusionary. (4) SILENCE RULE HARD-ENFORCE: The Caddy persona (bust + character voice) attaches ONLY to positive beats (frame/greeting, coaching, celebration, milestone). NEVER appears on error states, permission-denied, validation failure, punitive economy states—those render as neutral system UI. Clippy lesson locked: persona = reward signal, not blame signal. (5) CONTEXT LEGIBILITY: Each beat pairs a mono eyebrow locator (e.g., 'STANDINGS · LEAGUE TAB') in brass, then the one-sentence body. Caddy bust + Skip + Primary action CTA. All lines <=90 chars. (6) FREE-VS-PAID FAIRNESS: The Caddy + Old Tom are fully-capable standalone guides and appear across EVERY beat equally; Bag Room Guy is flavor-only cosmetic reskin (different voice, same guidance logic, shop.js pc22 gated). Help is NEVER paywalled. (7) BOUNCE-BACK TRUTHFULNESS (P9, P10): 'Your crew's scores live here', '[friend] passed you on ladder' etc. drive off real Firestore standings/feed/bounty data, not fabricated celebratory copy. The walkthrough claims no false wins."

---

## FIGURE RIG SPEC (caddy-figure.js)

**CADDY_KEY schema:** CADDY_KEY column schema (NEW — standing figure, NOT swing data):
[0] pct: t-value (0.0–1.0) for animation timeline
[1] hipShift: horizontal weight-shift (px, positive toward lead side)
[2] hipLift: vertical hip bob (px, positive = up)
[3] armDeg: arm angle from straight-down (deg, positive = back/CCW)
[4] headTilt: head tilt toward target (deg, positive = cocked right)
[5] shoulderTilt: shoulder roll (deg, positive = trail shoulder down)
[6] bagLift: bag shouldering position (px, positive = up)
[7] chinPose: chin height (px, 0 = neutral, positive = lifted/attentive)

**Poses:**
- **idle**: weight on trail leg (hipShift -8px), subtle breathing bob (hipLift ramps 0→2→0 over 2.2s), arm at rest (armDeg -15°), head neutral (headTilt 0°), shoulder relaxed (shoulderTilt 2°), bag shouldered (bagLift 12px), chin natural (chinPose 0px) — the standing-at-ease posture with bag shouldered at trail side; runs on loop unless interrupted
- **tipCap**: greeting gesture — arm rotates up (armDeg 45° over 240ms ease-out), forearm flexes to tip visor (lagDeg +28°), head cocks right (headTilt 8°, maintains friendly eye contact), bagLift unchanged, quick 180ms hold, then morphs back to idle over 320ms ease-in-out
- **nod**: affirmation + taking notes — head bobs forward (headTilt ramps -4° at peak), chin lifts slightly (chinPose +3px during descent), torso leans forward (shoulderTilt +4°), arm lifts to gesture (armDeg 20°) as if writing, 400ms total; paired with voice line for Beat2 calibration
- **leanBag**: relaxed waiting idle — weight fully to trail leg (hipShift -16px), slight hip drop (hipLift -2px), arm dangles (armDeg -28°), head tilts back slightly (headTilt -6°), shoulder leans into bag (shoulderTilt -8°), bag descends slightly lower (bagLift 6px) — reads as 'making himself comfortable while you think'; 280ms morphs from idle, holds until next beat
- **point**: explicit IK gesture — arm-angle = atan2(ty-shoulderY, tx-shoulderX) computed from screen coordinate (tx,ty); forearm extends (lagDeg -50°), head follows arm direction (headTilt interpolates toward target), chin lifts (chinPose +2px), torso straightens (shoulderTilt 0°) — the whole figure faces/leans toward the spotlit control; 320ms ease-out morph
- **pump**: celebration — arm pumps up (armDeg 120° at peak), hip shift bounces lead-ward (hipShift +12px), head tilts up (headTilt 12°), chin lifts (chinPose +6px), bagLift rises (bagLift 18px) with elastic ease-back-out curve; 500ms total (up 180ms, down 200ms ease-back-out, settle 120ms); fired on demo-hole win confetti

**Bag geometry:** Golf bag SVG (rounded-rect body + brass club-head ticks):
- Body: rounded-rect (x=trailX+4, y=hipY-40, w=22, h=64, rx=11 radius-md) filled with var(--cb-felt), stroke 1px var(--cb-mute-3) for subtle depth
- Club heads (3 ticks, staggered along trail edge):
  * Top tick: line (x1=trailX+26, y1=hipY-52, x2=trailX+32, y2=hipY-58, stroke-width=4, stroke=var(--cb-brass), stroke-linecap=round)
  * Mid tick: line (x1=trailX+26, y1=hipY-28, x2=trailX+32, y2=hipY-32, stroke-width=4, stroke=var(--cb-brass), stroke-linecap=round)
  * Lower tick: line (x1=trailX+26, y1=hipY-8, x2=trailX+32, y2=hipY-4, stroke-width=4, stroke=var(--cb-brass), stroke-linecap=round)
- Bag strap (shoulder support): path from bag top-right → shoulder joint, stroke=2px var(--cb-mute-3), opacity=0.5, reads as depth cue

**point() IK:** Point-to-screen-coordinate inverse kinematics (explicit NEW, not in intro.js):
Given shoulder-joint (sx, sy) and target screen-coordinate (tx, ty):
- armAngle = atan2(ty - sy, tx - sx) × 180 / π [converts radians to degrees]
- armDeg = armAngle - 90 [so 0° is straight-down; positive = back/CCW, matching intro.js convention]
- forearm/club resolve via existing lag-hinge logic: lagDeg held at -50° during point (extended but not locked), so the wrist stays slightly flexed and the figure's hand points toward the target naturally
- head follows: headTilt = (armAngle - 90) × 0.4 [soften the gesture; head doesn't track as sharply as the arm]
- The lerp helper blends armDeg + headTilt + lagDeg over --duration-med (or snap under reduced-motion)

**intro->caddy bridge:** Authored t-value bridge array: finish-pose → lower club → shoulder bag → stand at ease; camera scales full-stage (480×460 viewBox) → 56px corner bust.
- t=0.0: intro finish-pose (arm=156°, club wrapped high, scale=1.0 at center, opacity=1.0)
- t=0.15: club descends (armDeg lerps 156→-15°, lagDeg lerps -124→-15°), bag opacity fades in (0→1.0), bag position rises into shouldering pose
- t=0.50: caddy stance locks to idle (hipShift -8px, all upper-body angles neutral), bag is full-opacity at bagLift=12px, camera begins scale transition
- t=1.0: full corner bust (56px on 56px canvas, positioned in bottom-right of dialogue overlay, caddy centered in frame, opacity=1.0)
- Each segment uses --duration-smooth (350ms) easing (--ease-emphasized or --ease-in-out per phase)
- The morph is watched; intro teardown chains to walkthrough.route(0) on bridge completion

---

## OPEN RISKS (block 9.5 until cleared)

- 56px Caddy bust legibility across 6 themes: if cap/pipe/towel tells vanish at scale, per-persona accent ring/badge solution unproven (needs captured PNG, amendment per screenshot)
- Intro→Caddy morph mid-frame: exact t-values and bridge array timing unproven (needs Playwright video capture of the transition across 6 themes + reduced-motion before ship, AMD-028 gate)
- Voice deck completeness: only 3 sample lines exist; full per-beat × per-persona table (20+ beats × 3 personas = 60+ lines) unwritten and untaste-signed; caricature/harassment guardrails not verified against actual copy
- Firestore rules nested walkthrough.* update gate: whether members/{uid} self-update at rules:209-214 permits walkthrough.* field paths unconfirmed (needs rules audit before deploy, AMD-018 gate #2)
- Calibration branch consequence: solo-vs-crew answer affects first-week path ordering; actual UI diff (solo = card/handicap emphasis vs crew = feed/standings order) unimplemented (needs proof in Tier-2 landing pages)
- Demo-hole sample scorecard styling inside overlay: exact layout (par/yardage/score tap target size), styling (SAMPLE label placement), and confetti trigger (pbCelebrate key) unintegrated (needs code + screenshot)
- Lapsed 'while you were gone' payload: real-data queries (standings diffs, recent rounds, active bounties) unwritten; query cost and latency unproven (needs implementation + E2E before ship)
- Reduced-motion end-to-end: walkthrough must STILL reach complete-write (ftueState='done') under prefers-reduced-motion even if poses snap; E2E assertion missing (needs test + verified pass before ship)

