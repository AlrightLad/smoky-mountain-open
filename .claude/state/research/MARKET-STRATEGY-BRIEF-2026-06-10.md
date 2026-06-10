# Parbaughs market + business strategy brief — 2026-06-10

Distilled from the 21-agent research workflow (6 deep sweeps, 14 load-bearing
claims adversarially fact-checked, 361 sources fetched). Full cited dataset:
`market-business-research-2026-06-10.json` (same folder). Every number below
survived independent second-source verification or carries its caveat inline.

## The market (verified numbers)

- **48.1M Americans played golf in 2025** (29.1M on-course — first time above
  29M since 2003); NGF projects 50M+ total by end of 2026. 8th straight growth year.
- **Rounds at all-time records** (~551M in 2025) with ~2,000 FEWER courses than
  the 2000s peak → tee-sheet scarcity and group coordination friction are
  structural and worsening (a coordination app's tailwind).
- **18-34 is the LARGEST on-course cohort** (~6.3-6.8M) and the fastest-growing
  pipeline; 57% of on-course golfers are now under 50. Parbaughs' demo is the
  market's center of gravity, not a niche.
- **Only ~12% of US golfers hold an official handicap** (~3.35M of ~29M) — but
  the base is +30% since 2020 and 94.5% of posted rounds are recreational:
  casual golfers DO adopt score-tracking when friction is low. ~25M untracked
  golfers are the open space.
- **9-hole scores set records two years running** (+46% since 2020); new women
  golfers play nine over 50% of the time → 9-hole/scramble/casual formats must
  be first-class, not edge cases.

## Competitors (what users actually say, June 2026 sampling)

Headline ratings are inflated by rating prompts; the latest WRITTEN reviews run
12-32% at 1-2 stars across 18Birdies / TheGrint / SwingU. Four universal
complaint clusters — each one is a Parbaughs design principle inverted:
1. **Subscription aggression** (upsells mid-round) → we never interrupt a round.
2. **In-round reliability** (crashes, battery, watch) → boring reliability wins.
3. **UI complexity** (feature-pile) → editorial clarity wins.
4. **Data quality** (wrong course data) → the verified community-course flow wins.

League mechanics are commoditized at $0 (18Birdies leagues free; TheGrint Tours
free; Squabbit donation-ware). **Nobody owns "private clubhouse for groups who
actually know each other"** — incumbents are open-network GPS utilities with
social bolted on. That's the lane.

**Positioning statement:** *Parbaughs is the private digital clubhouse for golf
groups who actually know each other — rounds, season standings, banter, and
season-long stakes in one place, free forever at the core — against a field of
open-network GPS utilities that interrupt your round with upsells.*

## Business model (recommendation)

- **Free-forever core, monetize identity + organizers — never access.** Every
  community-first winner studied (Sleeper, Discord, Spond, GameChanger) refuses
  to paywall the social loop; TheGrint's serial paywalling produced three
  documented churn waves. RevenueCat 2026: median freemium converts 2.1% —
  at 2-10k users a $40/yr tier is ~$1.7-8.4k/yr (cost-recovery, not income).
- **Don't charge before ~1,000 users / 10+ active leagues.** ParCoin cosmetics
  can ship FIRST (identity spend, not access spend) — aligns with the deferred
  one-way cash→coins / no-cash-out / cosmetics-only model already decided.
- Verified unserved demand: casual golfers explicitly ask for **one-time
  purchases** that no mainstream golf app offers — a differentiation option.

## Growth playbook (the engine)

**The atomic network is the LEAGUE, not the user** (Sleeper model: every league
creation pulls 8-20 friends at near-100% invite acceptance). North-star metric:
league funnel — created → 8+ joined → first event scored → season 2 renewed.

Top 3 growth features to build (ranked, evidence-backed):
1. **Public read-only no-auth share pages** for leaderboards/recaps — the
  no-account artifact is what converts guests into members (Partiful proof).
  Currently EVERYTHING is auth-gated = strongest acquisition surface blocked.
2. **"Parbaughs Wrapped"** — story-format season recap per member + league
  superlatives (Spotify Wrapped: +21% downloads in release week). Must land
  before the founding league's season ends.
3. **Commissioner league-creation kit** — self-serve league in <10 min. This IS
  the growth engine; one converted commissioner = a whole pod.

**Timing:** league formation is seasonal — the Feb–April window. Wrapped
artifacts + commissioner kit + share surfaces must all be live BEFORE spring.

## Distribution

**PWA-first is correct, not a compromise.** iOS Web Push has been functionally
equivalent to native since 16.4 (lock screen, watch); the "7-day wipe" scare
doesn't apply to installed home-screen apps. Sequencing: harden iOS PWA
reliability now → Google Play TWA wrap as the cheap store beachhead (founding
20 as closed test) → native iOS only if/when scale demands it.

## Top 10 actions (full list in JSON, ranked)

1. Public share links for leaderboards/recaps (point existing share cards at them)
2. Parbaughs Wrapped before season end
3. Commissioner league-creation kit + league-funnel instrumentation
4. Codify "free-forever core" as written governance before any monetization work
5. Deepen banter: rounds auto-post to chat, richer reactions, Caddy commentary
6. Written legal opinion on member-vs-member ParCoin wagers + safe-harbor ToS
7. Package PWA as Play Store TWA (founding 20 = closed test)
8. 9-hole / scramble / casual rounds as first-class citizens
9. Plan the Feb–April league-formation campaign now
10. iOS PWA hardening: push re-subscription, A2HS walkthrough, wake lock in-round
