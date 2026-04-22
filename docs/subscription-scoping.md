# Parbaughs — Subscription Model Scoping

**Status:** Final (Draft 3). For Zach's review.
**Captured:** 2026-04-22 (Wednesday evening strategic session, final rewrite).
**Supersedes:** Draft 2 (earlier 2026-04-22 session).
**Author:** Claude (CTO role) with Zach (Founder) review.
**Purpose:** Lock the subscription model, pricing, tier structure, scorecard correction system, AI Swing Analyzer approach, and 44-week launch timeline before v8.1.0 (Clubhouse Part A) begins. All decisions in this doc become working assumptions that future Agent 3 specs reference. This is a living doc — revisit before any pricing or billing code ships.

---

## Executive summary

Parbaughs will ship with a **three-tier subscription model** — **CORE (free)**, **PRO ($6/mo, $60/yr)**, and **ULTRA ($9/mo, $90/yr)**. The subscription gates commissioner capability, AI scorecard parsing, advanced course features, and the AI Swing Analyzer; joining and playing are free forever. The **Original Four** (Zach, Kayvan, Kiyan, Nick) are grandfathered permanently on **ULTRA**. Other pre-launch commissioners are grandfathered permanently on **PRO** and can upgrade to ULTRA at standard pricing.

**The product shipping at launch has feature parity with 18Birdies paid tier** (course maps, GPS distance-to-pin, hazard distances, elevation-adjusted yardages, hole preview flyovers) at the PRO level **plus Parbaughs differentiators** — AI Scorecard Photo Parser at PRO and AI Swing Analyzer at ULTRA. This is a deliberate long-term build targeting **~10 months to App Store launch** (44 weeks). The strategic goal is to ship a product where new users have no feature-based argument against switching from competitors.

**AI philosophy locked:** Rule-based engines (caddie.js for stats, swing-coach.js for swing analysis) are preferred over Claude API calls for deterministic coaching. Claude API is used only where narrative synthesis or visual parsing has unique value (AI Scorecard Photo Parser in PRO). All swing analysis runs 100% on-device via Google's MediaPipe framework plus Parbaughs' own swing-coach.js engine — zero per-swing API cost, full offline support, no provider dependency.

Eight strategic commitments this doc locks:

1. **Commissioner-gated paid tier + free-to-play member experience.** Free members drive social growth; paid commissioners + golf-serious users drive revenue.
2. **Three tiers: CORE / PRO / ULTRA.** $6/mo PRO gets commissioner capability + AI Scorecard Parser + advanced course features. $9/mo ULTRA adds AI Swing Analyzer.
3. **Full feature parity with 18Birdies paid tier at PRO level, plus differentiators.** No excuses on baseline.
4. **Rule-based engines preferred over LLM calls for deterministic coaching.** Claude API used only where it earns its place (vision parsing of scorecards).
5. **MediaPipe + swing-coach.js for swing analysis.** On-device, zero API cost, offline-capable.
6. **RevenueCat over roll-your-own billing.** 1% fee after $2,500 MTR. Apple Small Business Program enrollment saves ~15% commission.
7. **Founding Four on ULTRA free forever.** Pre-launch commissioners on PRO free forever.
8. **44-week build to App Store launch.** Target: late February / early March 2027 for public launch. No scope creep between now and submission.

---

## Section 1 — Strategic framing

### 1.1 Why monetize commissioners + serious golfers, not all members

Parbaughs' core value is the social layer — the crew, the trash talk, the friendly competition, the permanent badges. Charging members to participate kills the network effect before it starts. A free member using Parbaughs with their four friends is worth more to the platform than a paying member who's churned because their friends wouldn't pay.

But hosting a league is different work, and playing seriously requires different features. A commissioner manages 3–48 members, resolves disputes, configures league rules, customizes branding, owns moderation responsibility. A serious golfer wants swing analysis, advanced course data, and precision yardages beyond what 18Birdies gives away free.

Charging the people who get outsized value while keeping baseline experience free for everyone they invite aligns revenue with value delivery. The three-tier structure lets each kind of user pay for what they specifically care about.

### 1.2 The three-tier structure

**CORE (free) — any user:**

Baseline experience, no subscription required. Competitive with 18Birdies free tier + hazard distances.

Included:
- Unlimited joining of any league
- Playing rounds, logging scores, viewing scorecards
- Course maps with GPS distance to center of green
- Hazard distances (water, bunkers, OB visible as labels)
- Static hole preview (overhead view)
- Member-to-member DMs, chat, feed interaction
- Personal stats, handicap tracking, trophy room, XP, ParCoins
- Rule-based caddie.js analytics (stats dashboard, pattern detection, practice focus areas)
- All cosmetics purchasable via ParCoins
- Shareable round recaps
- Trust-first scorecard corrections (read and submit, standard reward)

**PRO ($6/mo, $60/yr) — any user:**

Commissioner capability + advanced course features + AI scorecard parsing. Matches 18Birdies paid tier on course data, adds commissioner capability that 18Birdies doesn't have at all.

Included (everything in CORE, plus):
- **Advanced course features** (matching 18Birdies paid tier):
  - Front/back green distances
  - Elevation-adjusted Plays Like Distances
  - Wind-adjusted distances
  - Animated hole preview flyovers
  - Distance arcs overlay
- **Commissioner capability:**
  - Unlimited league creation (up to 48 members per league)
  - All league formats: bracket, stroke play, scramble, ryder, skins
  - Full moderation tools: kick, ban, unban, transfer commissioner
  - Audit log and moderation history
  - Custom league branding (Phase 4 addition; stub at launch)
- **AI Scorecard Photo Parser** — snap a photo of any course's physical scorecard, Claude vision API parses it into structured course data. Authoritative update path for course records. Commissioner onboarding magic-moment.
- **1.5x ParCoin rewards** on scorecard corrections
- **Priority support** (email / in-app ticket)

**ULTRA ($9/mo, $90/yr) — any user:**

PRO features + AI Swing Analyzer. The "improve your game" tier.

Included (everything in PRO, plus):
- **AI Swing Analyzer** — video-based swing analysis using MediaPipe (Google's on-device pose detection) + swing-coach.js (Parbaughs' rule-based coaching engine). Captures swing, extracts 33 body landmarks, segments into 8 swing phases, analyzes biomechanical metrics, delivers prioritized coaching feedback. 100% on-device, zero API cost, works offline.
- **Personal swing history** — track all analyzed swings over time
- **Swing trend analysis** — see how your swing is evolving (rule-based comparison)
- **Personalized drill recommendations** — swing-coach.js generates specific drills based on identified swing flaws

### 1.3 Why advanced course features are at PRO (not free, not ULTRA)

This is a deliberate strategic decision and runs contrary to how 18Birdies/GolfShot structure their tiers.

**CORE gets enough to beat 18Birdies free:** center-of-green distance + hazard distances + basic maps. That's the baseline that prevents bounce on day 1.

**PRO matches 18Birdies paid tier:** front/back green distances, elevation, wind, flyovers, distance arcs. At $6/mo, Parbaughs PRO is cheaper than 18Birdies paid ($70/yr = $5.83/mo annualized, so nearly the same) and adds commissioner capability + AI Scorecard Parser.

**ULTRA differentiates further:** AI Swing Analyzer is something neither 18Birdies nor GolfShot offer natively. This is Parbaughs' "and then some" moment.

**Why not at CORE (free)?** Advanced features have real infrastructure costs (weather APIs, elevation data). Gating them behind PRO makes the subscription tangibly valuable to the golfer playing, not just the commissioner administering.

**Why not reserved for ULTRA?** ULTRA's differentiator is the swing analyzer, not more course data. Keeping advanced course features at PRO makes PRO a complete "I'm a serious golfer" tier without forcing ULTRA on anyone who doesn't want swing analysis.

Zach's stated rationale for the parity approach: *"If we don't meet the baseline of what is expected how will we win new users... they want personalized stats, course info, ai caddie, etc."* — and later: *"I want to be what the competition is AND THEN SOME so there is no argument as to why users don't feel comfortable switching over."*

### 1.4 Rule-based vs LLM coaching philosophy

A core product decision: **rule-based engines are preferred for deterministic coaching.**

**caddie.js (existing, rule-based):** Analyzes your round stats, identifies patterns, recommends practice focus areas. Free for all users. Powers the Stats / Analysis tab.

**swing-coach.js (new, rule-based):** Analyzes MediaPipe pose data from swing videos, measures biomechanical angles, segments swing phases, delivers prioritized coaching feedback. ULTRA tier.

**Why rule-based is preferred:**
1. Deterministic — same input always produces same output. Users can trust the metrics.
2. Zero marginal cost — no per-action API billing.
3. Works offline — no internet required at the range or remote courses.
4. Faster — no round-trip latency to external API.
5. Auditable — you can tell users exactly why a recommendation was made.
6. No provider risk — doesn't break when a provider changes pricing or deprecates models.
7. Privacy — swing video and pose data never leave the device.
8. More trustworthy for biomechanical advice — built on established coaching standards, not LLM extrapolation.

**Where Claude API earns its place:**
- **AI Scorecard Photo Parser (PRO):** Vision parsing of physical scorecards into structured JSON. Claude vision does this reliably; building a custom CV pipeline for this one job would take months. Low-frequency, high-value, ~$0.05-$0.20 per parse. Worth it.

**Where Claude API does NOT appear:**
- Per-round caddie chat (rule-based caddie.js is sufficient)
- Per-swing coaching (rule-based swing-coach.js is sufficient)
- Weekly summaries, round recaps, trend narratives (could be added post-launch if users ask; rule-based templates work fine at launch)

**Future direction:** If Parbaughs grows and users request more natural-language "personality" in coaching, Claude API can be layered on top of rule-based engines as a narrative synthesis layer. This is a v9.x or later conversation. At launch, rule-based is sufficient and structurally better.

### 1.5 What Parbaughs does NOT offer at launch

Explicitly out of scope for v1:

- **AI chat / conversational coaching.** No Claude API chat interface. Rule-based swing-coach.js and caddie.js provide structured feedback.
- **Narrative synthesis features.** Weekly AI recaps, round narratives, trend stories — deferred to v9.x.
- **GHIN/USGA integration.** Post-launch conversation at 1,000+ users when partnership becomes viable.
- **Shot tracking.** Post-launch v9.x feature.
- **Tournament brackets beyond league formats.** Core league formats only; expanded tournaments in v9.x.
- **Commissioner-traced course overlays.** Re-evaluated at 1,000+ active commissioners.
- **Multi-band GPS precision tuning beyond baseline.** Launch GPS hits 5-10 yard precision.
- **Self-hosted Overpass infrastructure.** Re-evaluated at 10,000+ DAU.
- **Family / shared plans.** Apple Family Sharing handles this automatically.
- **Gift subscriptions.** v9.x if inbound interest.
- **Web billing via Stripe.** Deferred to v9.x.
- **Alternative billing or discount codes.** v9.x.

---

## Section 2 — Pricing rationale

### 2.1 The $6/mo PRO anchor

Pressure-tested against indie subscription benchmarks. $6/mo holds as the right anchor.

**Market positioning.** Competitor pricing (early 2026):
- **18Birdies** — $69.99/year (premium, ~$5.83/mo annualized)
- **GolfShot** — $99.99/year
- **Arccos Caddie** — $99.99/year
- **GolfLogix** — $59.99/year
- **Hole19** — $49.99/year

$60/year Parbaughs PRO sits at the low end of competitive set. Slightly cheaper than 18Birdies paid tier while adding commissioner capability and AI Scorecard Parser that 18Birdies doesn't have.

**Indie subscription data.** RevenueCat's State of Subscription Apps 2026: median conversion rate for mid-priced subscription apps is 2.0%, top quartile 4.4%. $6/mo puts Parbaughs in the mid tier with reasonable conversion expectations.

**Annual discount math.** $6/mo × 12 = $72/year. Annual at $60 = 17% discount (two months free). Standard SaaS pattern.

**Free trial: 7 days.** One-time on first subscription (monthly or annual). Auto-converts to paid at trial end.

### 2.2 The $9/mo ULTRA tier

**Why the upsell exists.** AI Swing Analyzer is a genuine differentiator — neither 18Birdies nor GolfShot offers native swing analysis. Serious golfers who want to improve will pay for this specifically.

**Cost model.** With MediaPipe on-device and swing-coach.js rule-based, variable cost per ULTRA subscriber is effectively **$0**. No API fees, no infrastructure scaling with users. Pure margin over PRO.

**Margin math:**
- $9/mo ULTRA with 15% Apple cut = $7.65 net
- $6/mo PRO with 15% Apple cut = $5.10 net
- ULTRA premium: $2.55/month over PRO
- Variable cost of ULTRA premium: $0
- Net margin on ULTRA: ~100% of the premium

**Decision: $9/mo ULTRA at launch with pricing experiment authority to test $10-12/mo post-launch.**

**Annual pricing:** $9/mo × 12 = $108/year. Annual at $90 = 17% discount.

### 2.3 Rejected pricing alternatives

- **$4.99/mo PRO floor:** too low for commissioner value signal. "Hobby app" territory.
- **$7/mo ULTRA (thin premium):** doesn't differentiate tiers meaningfully; AI Swing Analyzer is a legitimate $3/mo-over-PRO value.
- **$14.99/mo ULTRA ceiling:** triggers objection threshold for mid-tier indie apps.
- **Free tier commissioner:** adds complexity, dilutes value. If needed later, easy to add; hard to remove.
- **Usage-based pricing:** punishes successful commissioners with growing leagues.
- **Multi-league tiering:** 99% of commissioners have one league. Premature.

### 2.4 Tier upgrade mechanics

**CORE → PRO:** One-tap upgrade. Trial starts. Commissioner capability and advanced features unlock immediately.

**PRO → ULTRA:** One-tap upgrade. Prorated on monthly; full credit on annual. AI Swing Analyzer unlocks immediately.

**Downgrades (ULTRA → PRO, PRO → CORE):** Effective at next renewal. Features remain live until period end.

**No forced upgrades.** PRO users are never nagged to upgrade to ULTRA. AI Swing Analyzer is marketed in-app via the Stats tab ("Analyze your swing with ULTRA") but respectfully, not aggressively.

---

## Section 3 — Payment flow architecture

### 3.1 The constraint: iOS + Android + Web

Parbaughs runs in three contexts:
- **iOS native** (via Capacitor) — must use Apple IAP
- **Android native** (via Capacitor) — must use Google Play Billing
- **Web** (GitHub Pages) — no store requirement; deferred to v9.x

### 3.2 RevenueCat as entitlement layer — locked

**Option A — Raw StoreKit 2 + Google Play Billing + Stripe, self-hosted entitlement:** 2-4 weeks solo-dev work, ongoing maintenance. Opportunity cost outweighs fee savings. Don't.

**Option B — RevenueCat as entitlement layer, native IAP underneath (LOCKED):** One SDK for iOS + Android, dashboard for subscriber status, webhooks handled, free up to $2,500 MTR, 1% over that. Industry-standard for indie solo devs.

**Option C — Native IAP for mobile, Stripe for web, no unification:** Three separate billing codebases. Not worth it pre-launch.

### 3.3 RevenueCat fee math

- Free tier: up to $2,500 MTR
- Paid tier: 1% of gross revenue above $2,500 MTR

**Projected scale (30% ULTRA mix assumption):**

| Subscribers | Revenue Mix | Monthly Gross | Apple/Google (15%) | RevenueCat | Net |
|---|---|---|---|---|---|
| 10 | 7 PRO + 3 ULTRA | $69 | $10 | $0 | $59 |
| 100 | 70 PRO + 30 ULTRA | $690 | $104 | $0 | $586 |
| 400 | 280 PRO + 120 ULTRA | $2,760 | $414 | $3 | $2,343 |
| 1,000 | 700 PRO + 300 ULTRA | $6,900 | $1,035 | $44 | $5,821 |
| 5,000 | 3,500 PRO + 1,500 ULTRA | $34,500 | $5,175 | $320 | $29,005 |

For first 1-2 years, RevenueCat costs $0. Even at 1,000 subscribers, fee is ~0.6% of net. Negligible.

### 3.4 Apple Small Business Program — critical enrollment

Apple's Small Business Program reduces commission from **30% to 15%** for developers earning under $1M/year. **As a new developer, Parbaughs automatically qualifies.**

**Action item:** Enroll immediately after Apple Developer account approval. Free, 15 minutes, saves ~$10,800/year at 1K subscribers.

Google Play offers the same 15% rate automatically on subscriptions — no enrollment.

Single highest-leverage founder-paperwork action in the launch sequence.

### 3.5 Sales tax — handled by Apple/Google

Apple and Google are merchant of record. They calculate, collect, and remit sales tax automatically. Bundled into standard commission. Parbaughs configures one Tax Category in App Store Connect (~2 min, one-time) and takes no action.

Income tax on proceeds remains Parbaughs' responsibility via quarterly estimated taxes and annual 1099-K.

### 3.6 Web billing — deferred to v9.x

Mobile-only at launch. RevenueCat's A/B data shows web purchase flows reduce initial conversion 5-10%. Adding second purchase path on day 1 dilutes native funnel.

Revisit at 6-12 months post-launch based on user requests.

### 3.7 Subscription state machine

Five states:
- **none** — never subscribed
- **trial** — in 7-day free trial
- **active** — paying, full features
- **grace** — payment failed or canceled; 30-day grace period
- **canceled** — grace expired; frozen leagues (read-only for commissioners)

State transitions:
- none → trial → active (auto) OR trial → none (manual)
- active → grace (cancel or failure) → active (reinstate) OR grace → canceled (expiry)
- canceled → active (re-subscribe, any time)

Firestore: `users/{uid}.subscription.status`. RevenueCat = source of truth; Firestore = cached read model updated via webhooks.

### 3.8 Frozen leagues UX

When commissioner hits `canceled`, leagues enter read-only:
- Members see all historical data
- New scores cannot be posted
- New events cannot be created
- Chat is read-only
- Banner: *"This league is paused. Ask @commissioner_handle to renew, or transfer ownership to another member."*

**Two unfreeze paths:**
1. Commissioner re-subscribes to PRO or ULTRA
2. Commissioner transfers ownership to another active PRO/ULTRA subscriber

Transfer requires recipient to be active (or trial) PRO or ULTRA subscriber.

---

## Section 4 — Grandfathering

### 4.1 Founding Four = ULTRA free forever

The **Original Four** (Zach, Kayvan, Kiyan, Nick) get permanent ULTRA tier access at no cost. No trial, no expiration, no AI tier upgrade fee.

**Why ULTRA (not just PRO):** ULTRA includes AI Swing Analyzer. With MediaPipe on-device and swing-coach.js rule-based, ULTRA has zero variable cost to Parbaughs. Grandfathering Founding Four to ULTRA costs the platform literally nothing.

**Why only the Original Four:** There's a brand distinction between the Original Four (who built Parbaughs with Zach) and later pre-launch commissioners. Expanding ULTRA grandfathering beyond the four creates scope creep.

### 4.2 Pre-launch commissioners (non-Founding Four) = PRO free forever

Any user who was a commissioner of a league before the subscription launch date (excluding Original Four) gets permanent PRO access at no cost. They can upgrade to ULTRA at standard $9/mo pricing.

**Why this exists:** People who used Parbaughs as commissioners during the build phase helped stress-test the platform. Grandfathering their commissioner capability is fair recognition.

**Why not ULTRA:** ULTRA grandfathering is reserved for the Original Four by design. Pre-launch commissioners get PRO for commissioner capability + advanced course features + AI Scorecard Parser. That's generous.

### 4.3 Founding Commissioner badge

Both grandfathered cohorts carry a visible "Founding Commissioner" badge on profile. Brand integrity — these are the people who ran leagues before Parbaughs charged.

Original Four additionally carry the pre-existing "Parbaugh Classic" theme access and other visible founder treatments (per governance decision 4.2.a).

### 4.4 Implementation

Firestore schema on `users/{uid}`:

```
subscription: {
  tier: 'core' | 'pro' | 'ultra',
  status: 'none' | 'trial' | 'active' | 'grace' | 'canceled',
  plan: 'monthly' | 'annual' | null,
  grandfathered: 'none' | 'founding_four' | 'pre_launch_commissioner',
  currentPeriodEnd: timestamp | null,
  graceUntil: timestamp | null,
  providerId: string | null,
  trialStarted: timestamp | null,
  trialEndsAt: timestamp | null,
}
```

Rules check:
- If `grandfathered === 'founding_four'`, treat as `tier: ultra`, `status: active`, regardless of other fields. Billing infrastructure never touches.
- If `grandfathered === 'pre_launch_commissioner'`, treat as `tier: pro`, `status: active`. If user separately subscribes to ULTRA, that payment uses normal billing for the ULTRA delta ($3/mo or $30/yr).

Migration script runs once at subscription launch, reading all leagues and flagging their commissioners. Original Four hardcoded by UID. Script follows Cutover Playbook pattern from v8.0.3 (human gate before execution).

### 4.5 Non-grandfathered future commissioners

Everyone who creates a league post-launch pays. No exceptions, no "friends with Zach" carve-outs. Critical for brand integrity.

---

## Section 5 — Trust-first scorecard correction system

### 5.1 Design principles

Four commitments:

1. **Global course data.** One canonical record per course, shared across all leagues. Stats between leagues must be comparable.
2. **Instant corrections.** Any user can correct any scorecard field in-round or post-round. No approval queue.
3. **Public transparency.** Every correction logs to a public history subcollection. Every correction posts to the relevant league's activity feed.
4. **One-tap reversal.** Any user can undo any correction. Reward clawback if reverted within 7 days.

### 5.2 Why no peer review / approval queue

Considered and rejected:
- **2-of-N peer verification:** At 20-user scale, takes weeks for second verifier. Corrections rot.
- **Commissioner approval:** Admin burden, scales poorly, bureaucratic.
- **Instant without history:** No accountability.

Trust-first with history beats all three: public accountability, easy reversal, reward clawback, commissioner flag for contested courses (Phase 1), small user base at launch means bad actors are socially visible.

Zach's rationale: *"trust-first across the board for v1. Reputation economics in a small community work. Add commissioner gating for Course Rating / Slope Rating if abuse becomes a real problem post-launch."*

### 5.3 Edit flow

**On scorecard, tap field → "Edit this value"**
→ Modal: "Change par from 4 to ___. Why?" (required free-text, 5 char minimum)
→ Submit → field updates globally, ParCoins credited immediately, feed post generated

**Course info page → "Correction history"**
→ Chronological list of every correction to this course
→ Each entry: who, what, when, reason
→ One-tap revert on any entry (itself logged as a new correction)

### 5.4 ParCoin reward structure

Rewards pay out immediately. Anti-abuse via public accountability + clawback.

**Per-correction rewards:**
- Hole par change: 5 ParCoins
- Hole handicap index change: 5 ParCoins
- Tee yardage change: 5 ParCoins
- Course Rating correction: 25 ParCoins (affects handicap math)
- Slope Rating correction: 25 ParCoins (affects handicap math)
- Tee box name/color (cosmetic): 0 ParCoins (allowed but unrewarded)

**PRO commissioner multiplier:** 1.5x on courses their league has played at least once.

**Anti-farming caps:**
- Max 3 rewarded corrections per user per course per 30 days
- Max 10 rewarded corrections per user per 30 days platform-wide
- Clawback if reverted within 7 days

### 5.5 Round-scoped immutability

Current round in progress is NOT retroactively modified when a correction fires. Correction updates the course template for FUTURE rounds only. Round history remains immutable.

Aligns with existing rule: "scorecards cannot be edited after submission; XP rolls back dynamically on deletion."

### 5.6 Global propagation

- Corrections apply globally, not per-league
- Changes visible to ALL leagues immediately
- Feed notification goes to correcting user's league first, then platform-wide "recent course corrections" feed
- No cross-league gating

Deliberate platform-consistency choice.

### 5.7 AI Scorecard Parser (PRO feature)

PRO tier users can snap a photo of a physical scorecard; Claude vision API parses it into structured course data. Photo parse produces a "correction" like any manual edit, with `source: "photo_parse"` and `source_asset: "gs://bucket/scorecard_photo_xxx.jpg"`.

**Magic moment:** When a commissioner creates a new league and adds their home course for the first time, they snap a photo of the scorecard. Parbaughs populates the entire course record — par, yardages, Slope Rating, Course Rating, all 18 holes, every tee color. First-run magic moment. No setup friction.

**Parse flow:**
1. User snaps photo on `/add-course` or `/edit-course` screen
2. Photo uploaded to Firebase Storage
3. Cloud Function invokes Claude vision API (Haiku 4.5) with structured JSON extraction prompt
4. Parse result returned to client for review/confirmation
5. User confirms → course record updated, feed post generated, ParCoin reward (25 for "new course from photo")
6. Photo retained as audit reference

**Parse reliability:** 90-95% on clean photos, gracefully degrades on messy photos. Never silently populates wrong data.

**Parse cost:** ~$0.05-$0.20 per parse via Claude Haiku 4.5 vision. At 1,000 PRO subscribers averaging 2 parses/month = $100-$400/month total. Sustainable.

### 5.8 Edit wars and dispute resolution

At 20-user launch scale, edit wars are theoretical. If they emerge:

**Phase 1 (launch):** Commissioners can flag a course as "contested." Corrections on contested courses require commissioner approval. Expires after 30 days of stability.

**Phase 2 (if warranted):** "Founding league commissioner" tiebreaker — commissioner whose league has played most rounds at a course gets "home course" flag.

Both deferred until real edit war pattern emerges.

### 5.9 Future paid data upgrade path

At ~200 active commissioners (~$14,400/year ARR), evaluate paid scorecard API providers (golfapi.io, golf-course-database.com, SportsFirst) to supplement community-verified data. Budget $50-300/month justifiable at that scale.

Until then: community corrections + AI scorecard parser + free API baseline is sufficient.

---

## Section 6 — AI Swing Analyzer (ULTRA feature)

### 6.1 Technology stack

**MediaPipe** — Google's open-source ML framework. Free. Commercial use OK (Apache 2.0 license). On-device pose detection. 33 3D body landmarks per frame. Real-time performance on modern phones. Cross-platform iOS + Android SDKs.

**BlazePose** — MediaPipe's pose estimation model. State-of-the-art for single-person pose tracking. Used by multiple production sports apps.

**swing-coach.js (new)** — Parbaughs' rule-based coaching engine. Written in vanilla JavaScript (matching platform architecture). Takes MediaPipe pose data as input, outputs prioritized coaching feedback.

**No Claude API.** Swing analysis runs 100% on-device. Zero per-swing cost. Works offline.

### 6.2 Capture flow

1. User opens "Analyze Swing" tab (ULTRA gated)
2. Capacitor Camera API records video (user positions phone, records swing)
3. Typical swing video: 1-2 seconds, ~30-60 frames at 30fps
4. MediaPipe SDK extracts pose landmarks for each frame
5. swing-coach.js processes landmark data
6. Results displayed: video with pose overlay + structured feedback

### 6.3 swing-coach.js analysis pipeline

**Phase 1: Swing phase segmentation.** Algorithm detects 8 standard phases (Address, Toe-Up, Mid-Backswing, Top, Mid-Downswing, Impact, Mid-Follow-Through, Finish) by tracking wrist trajectory extrema. Well-documented in research literature.

**Phase 2: Biomechanical metric extraction.** Calculate key angles at each phase:
- Shoulder rotation (degrees from address)
- Hip rotation (degrees from address)
- Spine angle (degrees from vertical, tracked through swing)
- Weight distribution (hip position over feet)
- Swing plane consistency
- Tempo ratio (backswing duration vs downswing duration)
- Club path (inferred from hand position trajectory)

**Phase 3: Rule-based evaluation.** Each metric compared to acceptable ranges:
- Hip rotation at top: target 45-55°
- Shoulder rotation at top: target 90-100°
- Spine angle consistency: target <5° variance
- Tempo ratio: target 3:1 backswing:downswing (acceptable 2.5:1-3.5:1)
- [full rule set defined in swing-coach.js spec, spec'd by Agent 3]

**Phase 4: Prioritized feedback.** Rules produce ranked list of issues. Top 2-3 presented to user as actionable feedback with coaching templates:
- "Your hip rotation at the top is 38° — target 45-55°. Focus on a fuller hip coil during your backswing."
- "Your spine angle varies by 12° through the swing — target under 5°. Maintain your posture through impact."
- "Your tempo ratio is 1.8:1 — target 3:1. Slow your takeaway."

**Phase 5: Personal history comparison.** Compare current swing to user's last 10 swings. Trend detection:
- "Your hip rotation improved 8° since last month."
- "Your tempo has been consistent over the past 5 swings."

### 6.4 User-facing UX

**Swing analysis screen:**
- Video playback with skeletal overlay
- Scrubber to step through swing phase-by-phase
- Side panel showing metrics (hip rotation, shoulder rotation, spine angle, tempo)
- Coaching feedback cards (top 2-3 prioritized issues)
- "Save to swing history" action

**Swing history screen:**
- Chronological list of analyzed swings
- Per-swing: thumbnail, date, top metrics
- Trend charts: metric-over-time graphs
- Filter by date range, club type (when captured)

**Drill recommendations:**
- Rule-based: each identified swing flaw maps to 1-2 specific drill recommendations
- Drill library curated in swing-coach.js (free, no external content licensing)
- "Practice focus for this week: improve hip coil. Drill: Step-out drill (explanation + link to YouTube reference)."

### 6.5 Build effort

| Component | Time |
|---|---|
| MediaPipe iOS SDK integration via Capacitor | 1 week |
| MediaPipe Android SDK integration via Capacitor | 1 week |
| Video recording UI + pose overlay rendering | 1 week |
| Swing phase segmentation algorithm | 1 week |
| Biomechanical metric extraction | 1 week |
| swing-coach.js rule engine + coaching templates | 2 weeks |
| Personal history + trend analysis | 1 week |
| UX polish, error handling, empty states | 1 week |
| **Total** | **~9 weeks** |

Ships as v8.4.x across weeks 10-18 of launch timeline.

### 6.6 Limitations and honest framing

**What AI Swing Analyzer does well:**
- Detects gross biomechanical issues (hip rotation deficit, spine angle variance, tempo problems)
- Tracks improvement over time objectively
- Provides deterministic, trustworthy metrics

**What it doesn't do:**
- Replace a human coach
- Analyze ball flight (no radar / launch monitor)
- Detect subtle equipment issues (club fitting, lie angle)
- Provide in-real-time feedback during a swing (analysis is post-swing)

**Framing in-app:** "AI Swing Analyzer helps you track your swing mechanics over time. Not a replacement for professional coaching."

**Edge cases:**
- Poor lighting → pose detection degrades → show "low confidence" indicator
- Camera angle issues → feedback: "Position camera perpendicular to swing plane"
- Non-single-person in frame → MediaPipe handles multiple people (reject if ambiguous)

### 6.7 Why not Claude API for swing coaching

Considered and rejected. Reasons:

1. **Rule-based is more trustworthy for biomechanics.** Claude is trained broadly; could hallucinate advice that sounds good but isn't mechanically correct. swing-coach.js built on established coaching standards.

2. **Zero cost vs $0.02-$0.15 per swing.** MediaPipe is free, swing-coach.js is your code. Claude API scales with users; rule-based doesn't.

3. **Deterministic output.** Same swing produces same feedback. Users can trust the metrics. Claude would produce slightly different phrasing each time.

4. **Offline capability.** Rule-based works at courses with poor cell coverage. Claude requires internet.

5. **No provider dependency.** Claude API pricing changes or model deprecation don't break Parbaughs' swing analyzer.

6. **Privacy.** Swing video and pose data never leave the device. Some users care.

7. **Natural language "personality" is not critical.** Users opening a swing analyzer want clear, actionable feedback, not conversational warmth. Structured feedback feels more authoritative.

**Future consideration:** If post-launch users demand more natural-language "personality" in coaching prose, Claude API can be layered as a narrative synthesis layer on top of rule-based output. This is a v9.x or later conversation.

---

## Section 7 — Launch sequencing (44 weeks)

### 7.1 The dependency chain

Subscription billing depends on:
- App Store approval + Apple Developer account
- Google Play Developer account
- Small Business Program enrollment
- RevenueCat account setup
- Privacy Policy + Terms of Service
- Business entity + EIN + bank account (D-U-N-S for Organization enrollment)
- Subscription infrastructure code
- Grandfathering migration script

### 7.2 The 44-week ship sequence

| Week | Ship | Deliverable |
|---|---|---|
| 1 | v8.0.4 | Node 22 runtime bump (deadline April 30), SVG NaN fix, safe-area audit, 44pt hit target audit |
| 2–4 | v8.1.x (Clubhouse Part A) | Design tokens, Fraunces typography, billiard green + brass palette applied to base.css |
| 5–7 | v8.2.x (Clubhouse Part B) | Screen-by-screen Clubhouse application across all 15+ screens. IslandRow header pattern. |
| 8–9 | v8.3.0 | AI Scorecard Parser (PRO). Claude API Cloud Function, photo upload flow, parse validation, commissioner onboarding magic-moment. |
| 10–18 | v8.4.x | **AI Swing Analyzer (ULTRA).** MediaPipe iOS + Android SDK integration. Video capture + pose overlay. swing-coach.js rule engine. Biomechanical metrics. Swing history + trend analysis. |
| 19 | v8.5.0 | ParCoin store revamp + trust-first scorecard correction system. |
| 20–26 | v8.6.x | OSM pipeline baseline: course outline, hole paths, GPS-based distance-to-green. Location permission flows. Battery optimization. Privacy policy updates. |
| 27–34 | v8.7.x | Advanced course features: hazard distances, front/back green distances, elevation-adjusted yardages, hole preview flyovers, distance arcs overlay. Full 18Birdies paid-tier parity. |
| 35–36 | v8.8.0 | Subscription infrastructure: RevenueCat integration, Firestore schema, subscription state machine, Cloud Functions, grandfathering migration (HUMAN GATE per Cutover Playbook). |
| 37 | v8.9.0 | Clubhouse Part C: wallet + shop + subscription UI surfaces. |
| 38–40 | Pre-launch QA | Extensive smoke + manual testing. Founding crew beta. Full regression suite. |
| 33 (parallel) | Paperwork start | Request D-U-N-S number (2-4 week wait). LLC filing, EIN. |
| 41 | Paperwork sprint | Apple + Google Developer accounts. Small Business Program enrollment. RevenueCat account setup. Privacy Policy + ToS finalized. |
| 42–43 | App Store submission | iOS + Android submissions. 1–2 week review cycle. |
| 44 | Soft launch | Founding league only. Monitor for issues. |
| 45+ | Public launch | Remove invite-only, full App Store visibility. |

**Total: ~44 weeks = ~10 months to public launch.** Target: late February / early March 2027.

### 7.3 D-U-N-S timing critical path

D-U-N-S number takes 2-4 weeks from request to receipt. **Request must start no later than Week 33** to avoid blocking Apple Developer Organization enrollment at Week 41.

### 7.4 Sprint opportunities

Zach noted "we may sprint and excel past this" — parallelization possibilities:
- Clubhouse Parts A/B can overlap with AI Scorecard Parser if Agent 3 runs parallel tracks (cautiously — rules-freeze protocols from Cutover Playbook apply)
- Founder paperwork (Week 41) can start earlier (Week 35-36) to eliminate end-of-timeline pressure
- Pre-launch QA can compress to 2 weeks if no major bugs emerge during testing
- MediaPipe integration (Weeks 10-11) might compress if iOS and Android SDK integration share more code than expected

**But no scope creep.** Sprints happen by executing faster, not by adding features.

### 7.5 Burnout mitigation

Weeks 10-34 (AI Swing Analyzer + OSM pipeline + advanced features) are the highest-risk period for momentum collapse:
- 25 weeks of heavy engineering
- Launch still feels distant
- Technical depth increases

**Three-agent workflow discipline matters most here.** If burnout approaches, the answer is NOT to drop features. It's to pause, regroup, hold scope, resume. Post-launch feedback is the only legitimate source of scope change between now and submission.

### 7.6 Launch-with-subscription strategy (Path A)

**LOCKED: Path A — launch with subscription on day 1.** Revenue from hour zero. Users evaluate Parbaughs with complete commercial model visible. No awkward "we added billing later" pivot.

Path B (launch free, monetize in v9.x) rejected. Launching free then adding billing later is the "hidden tax pivot" users complain about.

---

## Section 8 — Founder paperwork checklist

### 8.1 Tier 1 — Pre-submission (starts Week 33 for D-U-N-S, Week 41 for rest)

- [ ] **File PA LLC ("Parbaughs LLC")** — PA Dept of State, $125, 1 hour online
- [ ] **EIN from IRS** — 15 min, free, post-LLC
- [ ] **Business bank account** — Chase, local PA credit union, or Mercury online
- [ ] **Request D-U-N-S number** — Dun & Bradstreet, 5 min application, 2-4 week wait. **Start Week 33.**
- [ ] **Apple Developer Program enrollment as Organization** — $99/year. Post-D-U-N-S.
- [ ] **Apple Small Business Program enrollment** — free, 15 min. Critical.
- [ ] **Google Play Developer account** — $25 one-time
- [ ] **Privacy Policy** — Iubenda ($10-30/mo) or Termly. Required by Apple/Google.
- [ ] **Terms of Service** — same tool

### 8.2 Tier 2 — Before subscription goes live

- [ ] **Tax adviser consultation** — PA CPA familiar with indie app developers. $200-500 one-time.
- [ ] **Bookkeeping setup** — QuickBooks Self-Employed or Wave
- [ ] **Sales tax awareness** — Apple/Google handle as merchant of record
- [ ] **Accounting software connected to business bank**

### 8.3 Tier 3 — Post-launch hygiene

- [ ] **Quarterly estimated taxes** — if net income hits ~$4K/quarter
- [ ] **Year-end 1099s** — if contractors paid $600+
- [ ] **Refund / dispute policy** documented
- [ ] **Customer support workflow** — at 100+ subscribers

### 8.4 What NOT to do pre-launch

- Don't incorporate in Delaware or Nevada (no benefit at scale, PA is correct)
- Don't hire full-time accountant (quarterly consult is plenty)
- Don't register trademarks ($250-750/class, wait for traction)
- Don't buy general liability insurance (wait for sustained revenue)

---

## Section 9 — Open questions (parked)

1. **Refund policy.** Align with store policy at launch.
2. **Annual-to-monthly downgrade.** Apple/Google handle automatically.
3. **Gift subscriptions.** v9.x if inbound interest.
4. **League size cap enforcement.** Soft-error recommended.
5. **Family / shared plans.** Apple Family Sharing + Play Pass defaults fine.
6. **Discount codes.** RevenueCat supports. Low priority for launch.
7. **Tax form generation.** Founder concern, not platform concern.
8. **ULTRA pricing experiment.** $9 vs $10 vs $12 post-launch.
9. **Sprint acceleration.** If Weeks 1-18 ship faster, advance OSM pipeline. No added scope.
10. **Paid scorecard API upgrade path.** Evaluate at ~200 active commissioners.
11. **Claude API for narrative synthesis.** Post-launch v9.x conversation if users demand.
12. **MediaPipe SDK version management.** MediaPipe is in active development; track breaking changes.
13. **Swing-coach.js rule refinement.** Post-launch usage data will inform threshold tuning.

---

## Section 10 — Final locks

By end of Wednesday evening session, Zach has confirmed and locked:

**LOCK:** Three-tier structure. CORE (free) / PRO ($6/mo, $60/yr) / ULTRA ($9/mo, $90/yr). 7-day free trial on first subscription.

**LOCK:** Advanced course features (hazard distances, front/back distances, elevation, wind, flyovers) at PRO, NOT CORE. CORE gets center-of-green distance + hazard distances only.

**LOCK:** AI Scorecard Photo Parser at PRO tier (Claude Haiku 4.5 vision).

**LOCK:** AI Swing Analyzer at ULTRA tier. MediaPipe + swing-coach.js rule-based. Zero per-swing API cost. 100% on-device.

**LOCK:** Rule-based engines preferred over Claude API for deterministic coaching. Claude API used only for AI Scorecard Parser (vision parsing of physical scorecards).

**LOCK:** Founding Four (Zach, Kayvan, Kiyan, Nick) = ULTRA free forever.

**LOCK:** Pre-launch commissioners (non-Founding Four) = PRO free forever, can upgrade to ULTRA at $9/mo.

**LOCK:** RevenueCat as entitlement layer over native Apple IAP + Google Play Billing. No web billing at launch.

**LOCK:** Apple Small Business Program enrollment as priority-1 founder-paperwork action.

**LOCK:** Launch with subscription on day 1 (Path A). 44-week timeline. Target: late February / early March 2027 for public launch.

**LOCK:** Trust-first scorecard correction system. Global course data, public history, instant ParCoin rewards, one-tap reversal, no peer review queues.

**LOCK:** Brand direction is Clubhouse (editorial Fraunces + billiard green + brass).

**LOCK:** No scope creep between now and App Store submission. All new feature ideas go to v9.x parked list.

**DEFER to v9.x:** Web billing, gift subscriptions, discount codes, GHIN integration, shot tracking, commissioner-traced overlays, self-hosted Overpass, expanded tournament brackets, Claude API narrative synthesis features (weekly summaries, round recaps), AR/3D swing visualization, live in-swing feedback, shot-to-shot analysis.

---

## Section 11 — Living doc

This doc captures decisions as of April 22, 2026 (Wednesday evening strategic session, final). Revisit before any pricing or billing code ships. If any LOCK item changes, update this doc before Agent 3 writes an implementation spec against it.

Next update triggers:
- Week 8 (pre-AI Scorecard Parser ship) — verify PRO tier value prop holds
- Week 10 (pre-AI Swing Analyzer build) — verify MediaPipe integration plan still correct
- Week 20 (pre-OSM pipeline start) — verify technical approach still makes sense
- Week 27 (pre-advanced features start) — verify parity targets still correct
- Week 35 (pre-subscription infra ship) — verify pricing still right
- Week 41 (paperwork sprint) — verify everything
- Post-launch Week 13 (90 days post-launch) — first real data review

---

## Appendix A — Tier comparison summary

| Feature | CORE (Free) | PRO ($6/mo) | ULTRA ($9/mo) |
|---|---|---|---|
| Join leagues | ✅ | ✅ | ✅ |
| Score rounds | ✅ | ✅ | ✅ |
| Handicap tracking | ✅ | ✅ | ✅ |
| Rule-based stats (caddie.js) | ✅ | ✅ | ✅ |
| Member DMs + feed | ✅ | ✅ | ✅ |
| ParCoins + Shop | ✅ | ✅ | ✅ |
| Trophies, XP, trophy room | ✅ | ✅ | ✅ |
| Course maps | ✅ | ✅ | ✅ |
| GPS distance to center of green | ✅ | ✅ | ✅ |
| Hazard distances | ✅ | ✅ | ✅ |
| Static hole preview | ✅ | ✅ | ✅ |
| Scorecard corrections (submit + earn) | ✅ | ✅ 1.5x rewards | ✅ 1.5x rewards |
| **Front/back green distances** | ❌ | ✅ | ✅ |
| **Elevation-adjusted (Plays Like)** | ❌ | ✅ | ✅ |
| **Wind-adjusted distances** | ❌ | ✅ | ✅ |
| **Animated hole preview flyovers** | ❌ | ✅ | ✅ |
| **Distance arcs overlay** | ❌ | ✅ | ✅ |
| **Create leagues** | ❌ | ✅ | ✅ |
| **Moderation tools** | ❌ | ✅ | ✅ |
| **Custom league branding** | ❌ | ✅ (Phase 4) | ✅ (Phase 4) |
| **AI Scorecard Photo Parser** | ❌ | ✅ | ✅ |
| **Priority support** | ❌ | ✅ | ✅ |
| **AI Swing Analyzer (MediaPipe + swing-coach.js)** | ❌ | ❌ | ✅ |
| **Personal swing history** | ❌ | ❌ | ✅ |
| **Swing trend analysis** | ❌ | ❌ | ✅ |
| **Personalized drill recommendations** | ❌ | ❌ | ✅ |

**Grandfathering:**
- Founding Four (Zach, Kayvan, Kiyan, Nick): ULTRA free forever
- Pre-launch commissioners (non-Founding Four): PRO free forever, upgrade to ULTRA at $9/mo

---

## Appendix B — Open pricing experiment authority

Zach retains authority to A/B test post-launch without doc revision:
- ULTRA price between $9, $10, $11, $12/month
- Annual discount structure between 15-20%
- Trial length between 5-14 days
- Intro promotional pricing (first month $0.99, etc.)

All other pricing or tier structure changes require doc revision and session approval.

---

## Appendix C — Tech stack additions

New dependencies introduced by this launch scope:

- **MediaPipe iOS SDK** — via CocoaPods, `MediaPipeTasksVision` pod
- **MediaPipe Android SDK** — via Gradle, `com.google.mediapipe:tasks-vision`
- **Capacitor Camera plugin** — for swing video capture
- **Capacitor Geolocation plugin** — for GPS distance calculations (OSM pipeline)
- **MapLibre GL JS** — for course map rendering (free, no API key)
- **RevenueCat SDK** — for subscription management
- **Anthropic Claude API** — for AI Scorecard Photo Parser only

All additions are free at Parbaughs' launch scale. No infrastructure scaling concerns for first 1-2 years.

---

*End of doc.*
