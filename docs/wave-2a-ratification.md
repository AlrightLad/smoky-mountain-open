# Wave 2A Ratification Pack — Pass 1

**Owner:** Design authority (Parbaughs)
**Date:** May 12, 2026
**Status:** Awaiting Founder section-by-section ratification
**Pass:** 1 of 4 (Pass 1 = this doc · Pass 2 = `CLUBHOUSE_SPEC.md` foundation · Pass 3 = per-tab screen specs · Pass 4 = Wave 3 implementation guidance)

---

## How to read this doc

Each major section ends with a **Ratification block** — short, plain-language statement of what you are accepting if you green-light the section. Red-line in place; I rev the doc per section, not the whole thing.

Inference tags used throughout:

- `[INFERENCE]` — derived from memory + brief + screenshots, not from a confirmed locked decision. Founder must validate.
- `[CONFIRMED]` — explicit in the brief, in attached screenshots, or in the 58 locked decisions referenced.
- `[GAP]` — I lack the information to be authoritative; flagged for Founder input.

No prose in this doc uses vague aesthetic terms. Every recommendation is concrete enough for an engineering agent to implement without follow-up.

---

# § 1 — Q2 Acknowledgment + 12 Rejection Criteria

## 1.1 Acknowledgment

I, acting as the design authority for Parbaughs, acknowledge that every per-page brief I produce must clear all twelve rejection criteria below before being handed to the Orchestrator/Engineer/Critic chain. Briefs failing any criterion are rejected back to me, not argued by the engineering agents. My authority is design judgment; the rejection criteria are completeness and implementability gates, not judgment gates.

## 1.2 The 12 Criteria

| # | Criterion | What it forces in every brief |
|---|---|---|
| 1 | **Component-level specs present** | Every UI element named, sized, and tokenized. No "a card" without dimensions + state list. |
| 2 | **All state coverage** | Empty, loading, error, and **permission-tiered** (Author / Founder / Spectator) states for every interactive surface. |
| 3 | **Design system spec compliance** | Brief cites tokens from the system spec by name. No new tokens introduced inside a per-page brief without amendment to the system spec first. |
| 4 | **Architectural feasibility within stated scope** | Brief acknowledges Vite-split vanilla JS, Firebase Blaze, GitHub Pages, Capacitor. Does not assume infrastructure outside this stack. |
| 5 | **CTO Ruling / memory'd architectural decision respect** | Brief cites every architectural rule it touches (page shell slots, `leagueCollection`/`leagueDoc` wrappers, member visibility model, version triple bump, etc.) and does not propose work that violates them. |
| 6 | **Concrete language** | No "modern," "clean," "delightful," "polished," "intuitive." Every adjective is replaced with measurable specifics. |
| 7 | **Wave scope discipline** | Brief states which Wave + ship it belongs to and does not silently expand into adjacent ship territory. Cross-ship dependencies are listed explicitly. |
| 8 | **Accessibility** | Keyboard navigation map, ARIA roles for every non-native control, AA contrast on every color pair, `prefers-reduced-motion` fallback for every motion. |
| 9 | **Mobile / Clubhouse forward-compatibility** | Every HQ brief states whether the surface has a mobile counterpart, and if so, references the screen spec in `CLUBHOUSE_SPEC.md` by ID. |
| 10 | **Brief rejection applies to completeness only** | The rejection chain checks the above; design choices themselves are not contestable by engineering agents (Q32 Lock 2). |
| 11 | **Token traceability** *(new — proposed)* | Every color, spacing, type-scale, radius, and motion value in a brief references a named token (`--cb-brass`, `--space-4`, `--motion-quick`). Raw hex / px / ms values are rejection-grade unless the brief simultaneously amends the system spec to introduce the new token. Enforces memory #7 (tokens enumerated by usage, not declaration). |
| 12 | **Cross-surface dependency declaration** *(new — proposed)* | Every brief touching shared data (member, round, league, coin, event) declares the cross-surface consumers it affects, citing the 30-file member-data fanout pattern. Prevents silent downstream breakage. |

## 1.3 Process notes

- A brief that fails ≥1 criterion is rejected as a whole. No "this is 90% there, ship it." Partial briefs are weaponized confusion for engineering agents.
- The Critic agent is the enforcement point. If the Critic surfaces a criterion failure, the brief returns to me, not to the Engineer.
- Engineer gap inference (Q31d Resolution A): when the Engineer encounters an underspecified detail mid-implementation, they may infer using Founder-pattern conventions; the inference is logged and reviewed retrospectively. This is NOT a rejection criterion violation — it's a sanctioned mid-flight pattern.

## 1.4 Ratification block — § 1

You are accepting:

1. The 12 criteria as the rejection gate for every per-page brief through Wave 4.
2. Criteria 11 and 12 are now permanently part of the locked criteria list (was 10, is now 12).
3. The Critic agent enforces; the Engineer infers gaps per Founder patterns; design authority owns rejected-back briefs.

✏️ **Founder action:** Ratify, red-line, or amend before § 2.

---

# § 2 — Q1 Restructured Wave 1 Ship Breakdown

## 2.1 Problem with the current 9-ship structure

The existing Wave 1 list (Members, Bounties, Wagers, Scrambles, Trips, Trophy Room, Range, Onboarding, Caddy Notes verify) treats each page as an independent ship. Three failure modes:

1. **Component-family fragmentation.** Members and Find Players use the same member card; shipping them in different ships means two different visual treatments that converge later. Same for Wagers/Bounties/Challenges (all Parcoin economy).
2. **Coverage gap.** 23–24 additional pages from the visible production (Home, Feed, Activity, Rounds, Calendar, etc.) aren't in the breakdown. Either they're deferred to Wave 2 by omission (unintentional debt) or never (unintentional drop).
3. **Wave gate ambiguity.** A 30-ship Wave 1 collapses the wave-gate cadence — every individual page becomes a gate, and the roadmap reads like a backlog rather than a wave.

`[INFERENCE]` Brief lists "23 additional HQ pages" but enumerates 24 (Home, Feed, Activity, Rounds, Calendar, Tee Times, Records, Aces, Challenges, Awards, Courses, Find Players, Chat, DMs, Leagues, More, Admin, Season Recap, Round History, Scorecard, Spectator, Sync Round, Party Games, Scramble Live). Treating as 24 below. Founder correct count if I miscounted.

## 2.2 Restructured Wave 1 — 14 design ships + 5 infrastructure ships, organized by tier

Ships are bundled when they share **all three** of: content domain, component family, permission tier. Where any of the three diverges, the surface gets its own ship.

### Foundation tier (must ship first; everything else consumes these)

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S1** | Design system codification | (Cross-cutting — no page) | The system spec from Wave 2A becomes consumable CSS variables, component classes, and JS helpers. Every subsequent ship cites tokens by name. No page surface; ships first. |
| **W1.S2** | HQ chrome refresh | Masthead, nav rail (left), footer, scope band, league chip, notifications icon, messages icon, calendar icon, settings icon, **Home (Today)** page itself | Every page renders inside this chrome. Shipping it after page ships forces double work. Bundles `Home` because Home is essentially "chrome + League Pulse + headline stats" — the same component family as the masthead it sits under. |

### Member-data tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S3** | Members directory + Find Players | Members list, Member detail, Find Players search, member card component | Single component family (member card). Same permission tier (visibility per `PB.isMemberVisibleToViewer`). Shipping together prevents card-shape divergence. |

### Round-data tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S4** | Round capture core | Sync Round flow, Scorecard (live + finalized views), Round detail, Round History list, Rounds page (the Rounds tab visible in screenshot) | These five surfaces all hydrate from the same round document shape. Shipping them apart forces five interpretations of the same data. Scorecard is the highest-fidelity surface in the bundle — it sets the visual contract. |
| **W1.S5** | Spectator + Caddy Notes verify | Spectator read-only view, Caddy Notes content compliance pass (per locked decisions on 15b-1 + wave-transition-cadenced roadmap + per-ship-cadenced what's-in-the-bag) | Spectator is a permission tier of Scorecard (read-only) but renders differently enough (no input controls, attribution chrome) to warrant its own brief. Bundled with Caddy Notes verify because both are content-discipline ships, not feature ships. |

### Game-format tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S6** | Parcoin economy: Wagers + Bounties + Challenges | Wagers list/detail/create, Bounty Board, Challenges H2H | All three are coin-denominated, head-to-head structures sharing the same balance/escrow/settlement model. Bundling forces a single economic UI vocabulary. |
| **W1.S7** | Multi-player formats: Scrambles + Scramble Live + Party Games | Scrambles list/create, Scramble Live (in-round view), Party Games library + active game | Bundled because all three are "multi-player session" formats with shared state-machine shape (lobby → live → resolution). `[INFERENCE]` Party Games may be scoped down here — recommend deferring "advanced party games" to Wave 2 if scope-pressed; ship the 2-3 most-used as MVP. |

### Scheduling tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S8** | Calendar + Tee Times + Trips | Calendar month/week, Tee Times list + RSVP, Trips list + detail (multi-day events) | All three are time-keyed event surfaces. Calendar is the canonical view; Tee Times and Trips are filtered/specialized views of the same event collection. `[INFERENCE]` Smoky Mountain Open–style multi-day events from past-events list in mobile Events screen confirms Trips ≈ multi-day Event. |

### Recognition tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S9** | Trophy Room + Awards + Records + Aces | Trophy Room (current page), Awards (achievement system), Records (best-of-X), Aces (hole-in-one log) | Single content domain: "what you've accomplished." Same component family (achievement card with timestamp + course + attribution). Permission tier is uniform (visible to league members). |
| **W1.S10** | Season Recap + Range | Season Recap (end-of-season summary), Range (practice tracking) | Both are lower-frequency surfaces; Season Recap is calendar-edge (renders only at season transitions); Range is `[INFERENCE]` low-frequency and could defer. Bundled because both are stat-aggregation surfaces sitting outside core round flow. |

### Social tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S11** | Feed + Activity | League Feed (full), Activity (per-member feed), kudos + comment interactions | These are consumption surfaces — read-heavy. Single component family (activity card). Feed is the league-scoped view; Activity is the member-scoped view of the same shape. |
| **W1.S12** | Chat + DMs + League Chat | League-scoped chat (see § 4), DMs (1:1), existing `chat.js` infrastructure consolidation | Communication surfaces. League Chat is new (recommended in § 4 below); bundling with DMs and existing Chat prevents three communication UIs. |

### Meta tier

| Ship ID | Name | Surfaces covered | Rationale |
|---|---|---|---|
| **W1.S13** | Courses + Leagues + More | Course directory, Course detail, My Leagues (multi-league wayfinding), More page (the junk drawer — gets explicit IA) | Reference / navigation surfaces. Permission tier uniform (all members). Bundling prevents "More" from staying a junk drawer; it gets a deliberate IA pass alongside the other meta surfaces. |
| **W1.S14** | Admin + Onboarding | Admin (Founder-only), Onboarding (new-member flow) | Both are first-impression / permission-edge surfaces. Admin is Founder-only; Onboarding is new-member-only. Bundled because both are "the surface a specific user role sees once or rarely" and share the gate-rendering pattern. |

### Infrastructure tier (engineering-led; design support only)

| Ship ID | Name | Design contribution |
|---|---|---|
| **W1.I1** | Member bug reporting | Reporting modal + entry point design |
| **W1.I2** | Smoke automation + B.47 sibling smoke account | None (engineering-only); design produces the smoke-failure UI states referenced by Wave 2A specs |
| **W1.I3** | Caddy Notes restructure | Content / IA restructure — design owns content shape, not feature work |
| **W1.I4** | Staging environment | Banner / scope indicator showing staging vs. production |
| **W1.I5** | Crisis banner | Visual + interaction spec (see § 3.3) |

## 2.3 What was bundled, deferred, or cut

- **Bundled:** Members + Find Players (W1.S3); Wagers + Bounties + Challenges (W1.S6); Scrambles + Scramble Live + Party Games (W1.S7); Calendar + Tee Times + Trips (W1.S8); Trophy Room + Awards + Records + Aces (W1.S9); Feed + Activity (W1.S11); Chat + DMs + League Chat (W1.S12); Courses + Leagues + More (W1.S13); Admin + Onboarding (W1.S14).
- **Deferred to Wave 2 (design coherence pass):** None explicitly — Wave 2 should be a *coherence* pass, not a *missed pages* pass. If any of the above slips, it stays Wave 1 and Wave 1 takes longer; we don't dump surfaces into Wave 2.
- **Cut from Wave 1, candidates for Wave 2 reconsideration:**
  - **Scramble Live as standalone surface** — consider folding into Scorecard as a mode, not a separate page. `[INFERENCE]` This may be controversial; flag for Founder.
  - **Range** — low frequency, niche surface. Could ship in Wave 2 if W1.S10 is descoped. `[INFERENCE]`.
  - **Party Games advanced library** — ship 2–3 most-used in Wave 1; defer the rest.

## 2.4 Ship order

Strict ordering. Foundation must precede everything; member + round data tiers precede game formats.

```
W1.S1  →  W1.S2  →  W1.S3  →  W1.S4  →  W1.S5  →  W1.I3 (Caddy Notes restructure, runs parallel to S5)
                                          │
                                          ↓
W1.S6  →  W1.S7  →  W1.S8  →  W1.S9  →  W1.S10  →  W1.S11  →  W1.S12  →  W1.S13  →  W1.S14
                                                                                          │
W1.I1, W1.I2, W1.I4, W1.I5 run in parallel with design ships    ──────────────────────────┘
```

## 2.5 Count summary

| Bucket | Count |
|---|---|
| Design ships | 14 |
| Infrastructure ships | 5 |
| **Wave 1 total** | **19** |
| Original count (per brief) | 14 (9 design + 5 infra) |
| Net delta | +5 design ships (covers the 24 unaddressed pages without dropping any) |

## 2.6 Ratification block — § 2

You are accepting:

1. Wave 1 expands from 14 to 19 ships to cover the 24 previously-unaddressed pages.
2. Ships are bundled by content domain + component family + permission tier; not by "we got tired."
3. Ship order is strict; Foundation → Member → Round → everything else.
4. Three surfaces are flagged for possible Wave 2 deferral (Scramble Live, Range, Party Games advanced library).

✏️ **Founder action:** Ratify, red-line, or propose alternate bundling before § 3.

---

# § 3 — Q4 Member Communication Strategy

## 3.1 Q4a — Caddy Notes audience differentiation

**Recommendation: Differentiate LATER, not now.**

### Reasoning

The founding 20 are a single, known audience. Current Caddy Notes copy (insider voice, ship-cadenced what's-in-the-bag, wave-transition-cadenced roadmap) is correctly calibrated for them. Differentiating *now* — before general members exist — creates:

- **Content debt:** Two copies to maintain, one of which has zero readers until post-launch.
- **Leak surface area:** A "general audience" version requires deciding what's safe to surface publicly; that decision is premature before pricing/feature-naming/architecture lock.
- **Voice fragmentation:** The founding 20 read the current voice as a feature, not a bug. A "neutered" general-audience version risks the founders perceiving the platform as having gone corporate.

### When to differentiate

Trigger: **First non-founding-20 member onboards into any league (including The Parbaughs).** At that point, Caddy Notes restructures into two layered surfaces.

### What differentiates

| Section | Founding-crew version | General-member version |
|---|---|---|
| Welcome / header | Insider voice ("The bag is heavier this week") | Plain ("This week in Parbaughs") |
| **Roadmap** | Wave-transition cadence, named ships, internal milestones | Public milestones only, no ship names, no architectural detail |
| **What's in the bag** | Per-ship cadence with internal commit-level detail | Per-wave cadence with member-facing feature summaries |
| Acknowledgments | Names Original Four + named founders | None |
| Voice | Conversational, occasional joke, founder-as-author | Plain, third-person, "the Parbaughs team" |

### Mechanism

`[INFERENCE]` `fbMemberCache` already exposes a `tier` or equivalent field; if not, the differentiation toggle is league-membership-based (Parbaughs → founding voice; any other league → general voice). Founder ratifies the trigger field on Wave 2 implementation review.

### Leak protection

Both versions respect the locked leak-protection rule: never leak unshipped pricing, feature names, or architectural details. Founding version may discuss *current* ships in detail; future ships referenced only by wave (e.g., "Wave 3 brings the Clubhouse to your pocket"), never by ship ID or internal name.

## 3.2 Q4b — External member communication

**Recommendation: Document a minimal external-channel protocol. Not strictly in-app; not unbounded.**

### The protocol

Five recognized external touchpoints:

| Touchpoint | Channel | Frequency | Discipline |
|---|---|---|---|
| **Ship deployment notes** | Group text to founding 20 | Per ship, founder discretion | One line per shipped feature. No screenshots. Leak protection applies retroactively (don't reference what shipped but hasn't been linked to). |
| **TestFlight enrollment** | Individual text or email | Wave 3 onset + as members join | Required for iOS deployment; cannot be in-app because users don't have the app yet. Includes link + 1-sentence what-this-is. |
| **Breaking-change heads-up** | Group text + in-app crisis banner (NOTICE tier — see § 3.3) | As needed | Specific change, time window, what to do. Same wording in both channels. |
| **Major launch announcements** | Group text + in-app banner (NOTICE tier) + Caddy Notes entry | Wave-gate cadence | Founding 20 may also get a 1:1 from Founder if they're an Original Four. |
| **Crisis communications** | In-app CRITICAL banner + group text | Production outage only | Group text mirrors the banner verbatim. No "additional context" in text that's not in app — single source of truth. |

### What does NOT happen externally

- Pricing discussion (leak protection).
- Unshipped feature names (leak protection).
- Architectural decisions (leak protection + not member-relevant).
- Member-to-member rumor / promise channels (avoid; route through in-app League Chat or DMs once shipped — see § 4).

### Founder-side discipline

The Founder is the sole external communicator on the platform's behalf. No agent (Orchestrator/Engineer/Critic/Design) sends external messages. The group text is a Founder utility, not an agent surface.

## 3.3 Q4c — Crisis banner UX

### Visual treatment

**Top-sticky banner**, full-bleed, slot above masthead. Renders inside the page shell's `banner` slot (per architecture doc). Three urgency tiers:

| Tier | Tone | Color treatment | Dismissibility | Use case |
|---|---|---|---|---|
| **NOTICE** | Informational, neutral | `--cb-chalk` background, `--cb-felt` text, no icon or subtle info glyph | Dismissible (per-session, not permanent) | "Maintenance window tonight 11pm ET." "Feature flag rollout in progress." |
| **ALERT** | Service degraded, accountable | Brass accent stripe (4px) on chalk background, `--cb-felt` text, warning glyph | Dismissible after acknowledgment click | "Round sync is delayed. Your scores are safe." |
| **CRITICAL** | Production crisis, direct | Red-felt background (`[INFERENCE]` — propose `oklch(35% 0.15 25)` to harmonize with felt), chalk text, alert glyph, **not dismissible** | Not dismissible until Founder toggles off | "Service is down. We're on it." |

### Tone for founding-crew audience

Direct, accountable, no corporate hedging. **Examples of correct tone:**

- ✅ "Round sync is broken. Working on it — fix within the hour."
- ✅ "If you logged a round in the last 30 min, please re-log. Data wasn't lost; the display was."
- ❌ "We're experiencing some technical difficulties and appreciate your patience."

### Tone for general-member audience (post-launch)

Same accountability, slightly less personal voice. Example: "Round sync is delayed. Your scores are safe. Updates here every 15 min."

### Mechanism

Remote-toggleable via Firestore document (e.g., `system/banner` with `tier`, `message`, `enabled`). Founder writes; clients listen. `[INFERENCE]` This is a 1-document read on app boot + a real-time listener; well within Blaze free tier.

### Accessibility

- ARIA: `role="alert"` for ALERT and CRITICAL; `role="status"` for NOTICE.
- `aria-live="assertive"` on CRITICAL; `polite` on others.
- Contrast: AA against background for all three.
- Reduced motion: no entrance animation under `prefers-reduced-motion: reduce`. Default entrance is a 200ms slide-from-top.
- Dismissibility: keyboard-accessible close button; `Esc` dismisses NOTICE and ALERT; CRITICAL has no close.

## 3.4 Q4d — Build Phase disclaimer

### Placement

Footer-level. The current footer already carries Merch · Rules · FAQ · Feature Request. Add a small disclaimer line below or beside this row, in the existing footer treatment.

### Wording (proposed; Founder edits in place)

> Parbaughs is in active development. New features ship most weeks. Your feedback shapes what's next.

### Why this wording

- **"Active development"** signals motion, not instability.
- **"Most weeks"** is honest (not "weekly," which is a commitment we don't want to make).
- **"Your feedback shapes what's next"** routes members to the Feature Request link in the same footer row — converts the disclaimer into a CTA.
- Avoids the word **"beta"** — carries connotations of broken/unfinished. Parbaughs is in production; v8.22.0 is shipped, not beta.
- Avoids **"early access"** — implies a future "normal access" that doesn't exist as a state for this product.

### Variant: Mobile-specific

For Wave 3 mobile (when members are TestFlight enrollees specifically), add to onboarding completion screen:

> You're using the early Clubhouse build. The HQ web app is the source of truth; the mobile app catches up most weeks.

### Visibility tiers

| Audience | Where they see the disclaimer |
|---|---|
| Founding 20 | Footer (HQ web). Optional: TestFlight onboarding screen (mobile). |
| Future general members during Wave 2 | Footer (HQ web). |
| Future general members during Wave 3 | Footer (HQ web) + onboarding screen (mobile). |
| Launch Phase A onwards | Disclaimer can be removed entirely or replaced with a generic "v8.x" version line. |

## 3.5 Ratification block — § 3

You are accepting:

1. Caddy Notes stays single-audience until first non-Parbaughs member onboards; then layers per the table in § 3.1.
2. Five external-channel touchpoints are recognized and disciplined; Founder is sole external communicator.
3. Crisis banner has three urgency tiers (NOTICE / ALERT / CRITICAL), top-sticky, remote-toggleable, accessibility-compliant.
4. Build Phase disclaimer goes in the footer with the proposed wording; mobile variant on onboarding completion in Wave 3.

✏️ **Founder action:** Ratify each of (1)–(4) independently — they're separable. Red-line tone, wording, or trigger conditions before § 4.

---

# § 4 — Q5 League Chat Surface

## 4.1 Recommendation: Yes, add league-scoped chat — as an embedded + linked surface, not a standalone primary tab

### The two-question collapse

The brief asks "should we add a league-scoped chat page?" The deeper question is: **what is the canonical member-to-member communication surface inside a league?** Today there are three partial answers (Feed kudos, DMs, existing `chat.js`), none of which is "talk to everyone in your league at once."

### Recommended structure

| Surface | What it is | Where it lives | Who can post |
|---|---|---|---|
| **League Chat (new)** | Linear thread, league-scoped, persists indefinitely | (a) Embedded preview on Home (replaces or augments League Pulse), (b) Dedicated `/league-chat` page accessible from masthead messages icon + More page | Any league member |
| **DMs (existing)** | 1:1 private threads | `/dms` (existing) | Two parties only |
| **`chat.js` infrastructure (existing)** | Underlying message persistence + listener wiring | Reused for both League Chat and DMs | N/A — infra |

### What this is NOT

- Not a standalone primary nav tab. Splitting attention from Home — which already has League Pulse as the social anchor — adds nav surface without proportional value.
- Not a per-channel structure (no `#general`, `#scrambles`, `#shit-talk`). The founding 20 is 20 people in one league; channels create empty rooms.
- Not threaded. 50-member ceiling is the natural cap; threading at that scale is theatre.

## 4.2 Interaction patterns

### Posting

- Single composer at the bottom of the chat surface. Text + optional attachment (image, round share — Wave 2 if scope-pressed).
- Send on Enter; Shift+Enter for newline.
- 1000 character soft limit (visual counter past 800); no hard limit.

### Reactions

Yes — reuse the existing kudos pattern (single primary reaction, brass-tinted heart-or-equivalent glyph). `[INFERENCE]` Kudos pattern exists on Feed activity cards from the screenshot showing "KUDOS · COMMENT" on League Pulse entries.

### Mentions

`@membername` autocomplete from `fbMemberCache`. Mentioned member receives a notification (badge on chat icon in masthead).

### Founder permissions

Founder can:

- Pin one message at a time (visible at top until unpinned).
- Delete any message (with audit log).
- Toggle league-wide notification mute (for trip planning sessions etc.).

Member permissions:

- Edit own messages within 5 minutes of posting.
- Delete own messages (no time limit).

### Threading vs. linear

**Linear.** No threading. Quoted-reply pattern is the threading substitute (member taps "reply" on a message → composer prefills with `> quoted text`).

### Attachments

- **Images:** Wave 1 if scope permits; Wave 2 otherwise. Compressed client-side before upload to control Firebase Storage spend (cost halt mandate).
- **Round shares:** A "share to chat" button on Round detail surfaces produces a rich-card embed (course + score + date + chip-style attribution). Wave 1.
- **Files / other:** Out of scope.

## 4.3 Notification + badge logic

| Event | Surface badge | Push (Wave 3+) |
|---|---|---|
| Any new message in league chat | Badge on masthead messages icon (count) | Silent (no push by default) |
| `@mention` of viewer | Badge + small accent dot on icon | Push enabled (Wave 3) |
| Reply to viewer's message | Badge | Push opt-in (Wave 3) |
| Founder pin | Badge + one-shot toast in app | Push opt-in (Wave 3) |
| DM to viewer | Same masthead messages badge (shared counter) | Push enabled (Wave 3) |

`[INFERENCE]` The existing masthead has a messages icon visible in the screenshot; this is the natural badge host.

## 4.4 Message persistence

- Indefinite by default. No auto-prune.
- Stored under `leagues/{leagueId}/chat/{messageId}` using the existing `leagueCollection` wrapper.
- `[INFERENCE]` Firestore composite index required: `(leagueId, createdAt desc)`. Add to required index list during W1.S12 implementation.
- Cost halt note: at 50 members × avg ~20 msgs/day × 365 days = ~365k docs/year/league. Well within Blaze free tier reads if listener is paginated (last 50 messages on initial load, infinite scroll backwards).

## 4.5 Relationship to existing DMs / `chat.js`

- `chat.js` is the infrastructure layer (message shape, listener wiring, send/edit/delete primitives). Reused.
- DMs are an existing surface and stay as-is for Wave 1.
- League Chat is a NEW surface built on `chat.js`.
- Both DMs and League Chat write to the **same** masthead messages badge counter (member doesn't need to track two badges).

## 4.6 Relationship to Feed / League Pulse

The current Home page has a "League Pulse" surface showing recent activity (rounds logged, etc.). This stays — it's an activity feed, not a chat surface. **The two surfaces complement each other:**

- **League Pulse** = system-generated activity (auto-posted: "Nick logged 56 at Honey Run").
- **League Chat** = member-authored conversation.

Home page IA proposal (refined in Pass 3): League Pulse + League Chat preview as two parallel modules in the right rail or stacked sections. Founder ratifies in Pass 3 screen specs.

## 4.7 Embedded preview on Home

A 3-message preview of the latest league chat activity, rendered as a module on Home. Tap → opens full chat page. Same component family as League Pulse module (visual parity).

`[INFERENCE]` This may compete for visual real estate with League Pulse. Pass 3 Home screen spec resolves the layout question definitively; for Pass 1, the recommendation is: both modules exist, both are visible on Home, exact arrangement deferred to screen spec.

## 4.8 Mobile counterpart (Wave 3 forward-compat)

Per Criterion 9, every HQ surface declares its mobile counterpart. League Chat mobile lives in the **Feed tab** (see § 5 below for tab structure) as a sub-view, accessed via segmented control: `League Pulse | League Chat | DMs`.

## 4.9 Ratification block — § 4

You are accepting:

1. League Chat is added as a NEW surface (not a primary nav tab).
2. Surface structure: embedded preview on Home + dedicated `/league-chat` page accessible from masthead messages icon.
3. Linear, not threaded; quoted-reply substitutes for threading.
4. Reactions reuse kudos pattern; founder permissions per § 4.2.
5. Notifications share masthead badge with DMs.
6. Persistence indefinite; Firestore index requirements documented.
7. Mobile counterpart lives in the Feed tab (Wave 3).

✏️ **Founder action:** Ratify, red-line, or descope before § 5.

---

# § 5 — Mobile Tab Structure (Pass 1 prerequisite for Pass 2)

## 5.1 Proposed synthesis

Five tabs:

| Position | Tab | Houses | Primary screens |
|---|---|---|---|
| 1 | **Home** | Today, League Pulse, headline stats, league chat preview, build-phase content | Home (Today), Crisis banner host |
| 2 | **Play** | Active play — start round, in-round scorecard, GPS, party games, scrambles live, formats | Start Round, Scorecard (live), Sync Round, Scramble Live, Party Games active |
| 3 | **Feed** | Member-to-member social — League Chat (default), League Pulse, DMs, kudos/comments | Feed (sub-segmented: Chat / Pulse / DMs), Activity (member-scoped sub-view) |
| 4 | **Stats** | Personal stats + recognition — handicap, rounds history, records, awards, aces, trophy room, season recap | Stats home, Round History, Records, Aces, Awards, Trophy Room, Season Recap |
| 5 | **More** | Everything else — settings, profile (You), courses, events, leagues, admin, cosmetics, parcoin shop, find players, members | More (IA'd, not junk drawer), Profile, Courses, Events, Trips, My Leagues, Admin, Cosmetics, Find Players, Members |

## 5.2 Rationale — addressing each requested concern

### Active play primary

**Play** tab is the GPS + real-time scoring + active session home. It's the second tab (after Home) because it's the most-used surface during the actual golf event. `[INFERENCE]` Members open the app on the first tee; Home is the launch, Play is the work.

### Member-to-member social (DMs, League Chat)

**Feed** tab. Segmented sub-nav: `League Chat | League Pulse | DMs`. Default view is League Chat (most-frequent conversation surface). This collapses the original spec's "Feed" with member-to-member communication into a single tab — DMs no longer requires a separate primary destination.

### Stats / Feed / You from original spec

- **Stats** — preserved as a dedicated tab. Justification: Wave 4 stats expansion is roadmapped `[INFERENCE]`; the tab capacity exists pre-emptively. Also: members care about their handicap trend, and burying it in More degrades a daily-glance value.
- **Feed** — preserved as a dedicated tab, expanded to include chat (above).
- **You** — does NOT get a tab. Profile is accessed via **avatar tap from the masthead** (pattern already established in HQ — "Hi, Mr Parbaugh" with avatar). Reduces tab count from 6 to 5; respects iOS HIG (5 tabs max ideal); preserves the member-familiar pattern of "tap your face to see your stuff."

### Member familiarity vs. intentional divergence

| Current production tab | Wave 3 disposition | Why |
|---|---|---|
| Home | Kept | High-frequency, anchor |
| Play | Kept | Highest-value tab; expanded scope |
| Courses | **Moved to More** | Low-frequency reference data; doesn't justify primary tab real estate |
| Events | **Moved to More** | Members visit events 1-2× / week peak; same justification as Courses |
| More | Kept but **IA'd, not junk drawer** | Settings + low-frequency surfaces with explicit categorization |

Two intentional divergences from current production (Courses + Events leave the primary nav). Justification: the screenshots show Courses and Events as primary tabs while Stats and Feed are buried — this is inverted from where member daily value actually is. Members log a round (Play) and check the league pulse / their handicap (Home, Stats, Feed) far more often than they browse courses or RSVP to events.

`[INFERENCE]` The decision to demote Courses + Events is the highest-friction proposal in this doc. If Founder disagrees, the alternative is a 6-tab structure (HIG-noncompliant on iOS) or merging Stats and Feed into a single tab (degrades both). Recommendation stands; flag for explicit Founder ratification.

## 5.3 Ratification block — § 5

You are accepting:

1. Wave 3 mobile uses a 5-tab structure: Home / Play / Feed / Stats / More.
2. Courses and Events demote from the current production primary nav to More-tab destinations.
3. Profile ("You") is accessed via masthead avatar tap, not via a primary tab.
4. Feed tab houses League Chat as default sub-view; DMs and League Pulse as siblings.
5. Stats tab earns dedicated real estate in anticipation of Wave 4 stats expansion.

✏️ **Founder action:** This is the most consequential ratification in Pass 1 — it shapes every Pass 3 screen spec. Ratify, red-line, or reject in favor of one of:
  - Keep current production tabs as-is (Home / Play / Courses / Events / More)
  - Original spec tabs (Home / Play / Stats / Feed / You)
  - A different synthesis you propose

---

# § 6 — Open inferences requiring Founder validation before Pass 2

Listed once for triage. Anything ratified here unblocks Pass 2.

| # | Inference | Where it appears | Founder action |
|---|---|---|---|
| I1 | "23 additional pages" enumerates as 24 in the brief | § 2.1 | Confirm count |
| I2 | Party Games scope: ship 2-3 most-used in W1.S7; defer advanced library to Wave 2 | § 2.2, 2.3 | Confirm or expand |
| I3 | Scramble Live as standalone vs. mode of Scorecard | § 2.3 | Confirm standalone or fold |
| I4 | Range deferral to Wave 2 if scope-pressed | § 2.3 | Confirm priority |
| I5 | Trigger for Caddy Notes differentiation = first non-founding-20 member onboards into any league | § 3.1 | Confirm trigger field |
| I6 | Crisis banner CRITICAL background color (`oklch(35% 0.15 25)`) | § 3.3 | Confirm or specify |
| I7 | Image attachments in League Chat: Wave 1 if scope permits, else Wave 2 | § 4.2 | Confirm scope priority |
| I8 | Wave 4 stats expansion exists in roadmap (justifies dedicated Stats tab in Wave 3) | § 5.2 | Confirm roadmap |
| I9 | Demoting Courses + Events from primary nav in Wave 3 | § 5.2 | **Highest-friction ratification** |

---

# § 7 — Pass 2 starting point

Once § 1–5 are ratified (red-lined or accepted), Pass 2 begins:

- **File:** `docs/CLUBHOUSE_SPEC.md` Part 1 of 3
- **Scope:** Mobile design system foundation only. No screen specs.
- **Contents:**
  - Final palette proposal (billiard green starting point harmonized with `--cb-felt`, with rationale)
  - Type scale (mobile-specific, distinct from HQ)
  - Spacing scale
  - Motion vocabulary (durations, easings, gesture-specific patterns)
  - Gesture pattern library (swipe, long-press, drag, edge-swipe-back, pull-to-refresh)
  - Accessibility framework (outdoor-use scenarios: sunlight, gloves, one-handed)
  - Capacitor API integration contract (camera, GPS, haptics, file system) + web-emulation fallback specs
  - HQ ↔ Mobile data sync architecture (active rounds, real-time scoring, spectator feed)
  - Push notification architecture (Wave 3 reads architecture; Launch Phase B implements)

Pass 2 produces no per-screen UI. It's the foundational layer Pass 3 cites by token name.

---

**End of Pass 1.** Standing by for section-by-section ratification.
