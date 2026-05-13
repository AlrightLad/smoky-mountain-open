# Cross-Wave Dependencies

Tracks ship-to-ship dependencies across the 40-ship Build Roadmap. Prevents orchestration team from firing ships in wrong order and hitting blocking conditions mid-implementation.

## Why this exists

Per Vision authoring session 2026-05-12: explicit dependencies surfaced across waves but were captured in individual ship Visions, not in a single referenceable artifact. Without consolidated dependency tracking, orchestration team risks executing ships in an order that blocks itself.

## How to read this document

Each ship has:
- **Hard dependencies** — ship CANNOT execute until dependency complete
- **Soft dependencies** — ship benefits from dependency complete but can execute independently
- **Downstream consumers** — ships that depend on this one

If a hard dependency isn't met, ship execution halts until it is.

## Wave 1 dependencies

### W1.S1 — Design system codification
- Hard dependencies: none (foundation ship)
- Soft dependencies: none
- Downstream consumers: ALL Wave 1 + Wave 2 ships (tokens consumed everywhere)

### W1.S2 — HQ chrome refresh + Home
- Hard dependencies: W1.S1
- Soft dependencies: W1.S11 (Feed integration), W1.S12 (Chat preview integration)
- Downstream consumers: W2.S0 (HQ Foundation continues this work), all HQ surfaces

### W1.S3 — Members + Find Players
- Hard dependencies: W1.S1
- Soft dependencies: W1.S9 (championship badges integration)
- Downstream consumers: W1.S11 (mention autocomplete from fbMemberCache), W1.S12 (mention autocomplete), W2.S5 (search), W4.I5 (profile integration)

### W1.S4 — Round capture core
- Hard dependencies: W1.S1
- Soft dependencies: W1.I6 (course capture for new-course flow)
- Downstream consumers: W1.S5 (spectator), W1.S6 (Parcoin economy in-round), W1.S7 (multi-player formats), W1.S9 (records from rounds), M3 (mobile Play tab), M4 (mobile Stats), W4.S2 (heat maps)

### W1.S5 — Spectator + Caddy Notes verify
- Hard dependencies: W1.S1, W1.S4, W1.I3 (Caddy Notes restructure)
- Soft dependencies: none
- Downstream consumers: W2.S4 (HQ Spectator HUD)

### W1.S6 — Parcoin economy (Wagers/Bounties/Challenges)
- Hard dependencies: W1.S1, W1.S4
- Soft dependencies: W1.S7 (Challenges inside multi-player formats)
- Downstream consumers: W2.S2 (earnings leaderboard), W4.S3 (custom trophies may award Parcoins)

### W1.S7 — Multi-player formats (Scrambles + Party Games)
- Hard dependencies: W1.S1, W1.S4
- Soft dependencies: W1.S6 (Parcoin stakes in challenges)
- Downstream consumers: M3 (mobile Scramble Live + Party Games active)

### W1.S8 — Calendar + Tee Times + Trips
- Hard dependencies: W1.S1
- Soft dependencies: W1.S2 (HQ chrome Tee Sheet agate)
- Downstream consumers: M2 (mobile Home Tee Sheet preview), W2.S1 (HQ Home Tee Sheet agate)

### W1.S9 — Trophy Room + Awards + Records + Aces
- Hard dependencies: W1.S1, W1.S4
- Soft dependencies: W1.S3 (championship badges on member cards), W2.S2 (Trophy Watch agate on Leaderboard)
- Downstream consumers: W4.I2 (Champion titles from championships), W4.S3 (custom league trophies extend this system)

### W1.S10 — Season Recap + Range
- Hard dependencies: W1.S1, W1.S4, W1.S9
- Soft dependencies: M4 (mobile share-as-image flow)
- Downstream consumers: M4 (Season Recap surface)

### W1.S11 — Feed + Activity (amended for Chip integration)
- Hard dependencies: W1.S1, W1.S3
- Soft dependencies: W1.I1 (image upload pipeline from bug reporting)
- Downstream consumers: W2.S1 (Home feed), M5 (mobile Feed tab), W4.I5 (Chip history on profile)

### W1.S12 — Chat + DMs + League Chat
- Hard dependencies: W1.S1, W1.S3, W1.I1 (image upload pipeline)
- Soft dependencies: W1.S11 (Chip composer pattern reused)
- Downstream consumers: M5 (mobile Feed tab with full chat), W2.S5 (notifications popover unified counter)

### W1.S13 — Courses + Leagues + More
- Hard dependencies: W1.S1
- Soft dependencies: W1.I6 (course capture creates course entries)
- Downstream consumers: M6 (mobile More tab), W2.S5 (search includes courses)

### W1.S14 — Admin + Onboarding
- Hard dependencies: W1.S1, W1.S2
- Soft dependencies: W1.S3 (friend system suggestions in onboarding), W1.I5 (Crisis banner controller)
- Downstream consumers: M6 (mobile Admin entry consumes permission tier field shape)

### W1.I1 — Member bug reporting
- Hard dependencies: W1.S1
- Soft dependencies: none
- Downstream consumers: W1.S11 (image upload pipeline), W1.S12 (image upload pipeline), M5 (image upload), Bug Triage Listener agent (consumes bug reports)

### W1.I2 — Smoke automation + sibling smoke account
- Hard dependencies: W1.I4 (staging environment)
- Soft dependencies: none
- Downstream consumers: ALL subsequent ships (smoke coverage extends per ship)

### W1.I3 — Caddy Notes restructure
- Hard dependencies: W1.S1
- Soft dependencies: none
- Downstream consumers: ALL ships (Caddy Notes entry mandatory per locked governance)

### W1.I4 — Staging environment (Option B locked)
- Hard dependencies: W1.S1
- Soft dependencies: none — Founder workstream creates `parbaughs-staging` Firebase project
- Downstream consumers: ALL Wave 2 + Wave 3 + Wave 4 ships (stage before production reveal)

### W1.I5 — Crisis banner system
- Hard dependencies: W1.S1, W1.S2
- Soft dependencies: none
- Downstream consumers: W2.S1 (HQ Home crisis banner override), M2 (mobile crisis banner), W4.I3 (migration uses Crisis Banner for maintenance window)

### W1.I6 — Course capture from photo
- Hard dependencies: W1.S1
- Soft dependencies: W1.S13 (courses page surface integrates new courses)
- Downstream consumers: W1.S4 (round capture consumes course data), M3 (mobile Play tab Start Round flow)

## Wave 2 dependencies

### W2.S0 — HQ Foundation
- Hard dependencies: W1.S1, W1.S2
- Soft dependencies: W1.I4 (deploys to staging)
- Downstream consumers: W2.S1, W2.S2, W2.S3, W2.S4, W2.S5

### W2.S1 — HQ Home
- Hard dependencies: W2.S0, W1.S2, W1.S11 (amended), W1.I5
- Soft dependencies: W1.S8 (Tee Sheet agate data)
- Downstream consumers: W2.S5 (Polish + a11y pass)

### W2.S2 — Leaderboard
- Hard dependencies: W2.S0
- Soft dependencies: W1.S6 (earnings leaderboard data), W1.S9 (Trophy Watch data)
- Downstream consumers: W2.S3 (reusable table component), W2.S4 (per-hole strip pattern), W2.S5

### W2.S3 — Scorecard
- Hard dependencies: W2.S0, W2.S2 (reusable table), W1.S4
- Soft dependencies: W1.S11 (Post recap Chip composer)
- Downstream consumers: W2.S4 (round detail consumed), W2.S5

### W2.S4 — Spectator HUD
- Hard dependencies: W2.S0, W2.S2 (reusable table), W1.S5
- Soft dependencies: none
- Downstream consumers: W2.S5

### W2.S5 — Polish + a11y + global chrome
- Hard dependencies: W2.S0 through W2.S4 (all Wave 2 design ships complete)
- Soft dependencies: W1.S3 (member search), W1.S13 (course search), W1.S12 (notifications popover content)
- Downstream consumers: production reveal at Wave 2 → Wave 3 transition

## Wave 3 dependencies

### M1 — Capacitor harness
- Hard dependencies: W1.S1
- Soft dependencies: none
- Downstream consumers: M2, M3, M4, M5, M6

### M2 — Home tab
- Hard dependencies: M1, W1.S2, W1.S3
- Soft dependencies: W1.S11, W1.S12, W1.I5
- Downstream consumers: M3, M4, M5, M6 (consume shared chrome)

### M3 — Play tab (highest complexity)
- Hard dependencies: M1, M2, W1.S4, W1.S5, W1.I6 (course capture for Start Round new-course flow)
- Soft dependencies: W1.S7 (Scramble Live + Party Games active)
- Downstream consumers: M4 (Stats reads from rounds)

### M4 — Stats tab
- Hard dependencies: M1, M2, M3, W1.S9, W1.S10, W1.S4
- Soft dependencies: none
- Downstream consumers: M5 (share-to-chat coupling), W4.S2 (heat maps integrate), W4.S1 (advanced stats integrate)

### M5 — Feed tab
- Hard dependencies: M1, M2, W1.S12, W1.I1, W1.S11
- Soft dependencies: M3, M4 (can ship parallel after M2 per spec M5.2)
- Downstream consumers: M6 (notifications consume Feed events)

### M6 — More tab + TestFlight enrollment
- Hard dependencies: M1, M2, M3, M4, M5, W1.S13, W1.S14
- Hard dependencies (Founder workstream): LLC formation + D-U-N-S Number + Apple Developer Program Organization tier active
- Soft dependencies: none
- Downstream consumers: Launch Phase A + B (TestFlight membership extension)

## Wave 4 dependencies

### W4.I1 — Username + discriminator schema + signup
- Hard dependencies: W1.S1, W1.S14
- Soft dependencies: none
- Downstream consumers: W4.I2, W4.I3, W4.I4, W4.I5

### W4.I2 — Title system
- Hard dependencies: W4.I1, W1.S9 (championship sources), W1.S14 (Commissioner role source)
- Soft dependencies: none
- Downstream consumers: W4.I3 (titles light up post-migration), W4.I5 (profile display), W4.S3 (custom trophies generate Champion titles)

### W4.I4 — Username uniqueness + collision handling
- Hard dependencies: W4.I1
- Soft dependencies: W4.I2 (titles preserved across username changes)
- Downstream consumers: W4.I3 (migration uses collision handling), W4.I5 (profile URL stability)

### W4.I3 — Member migration (founding 20)
- Hard dependencies: W4.I1, W4.I2, W4.I4 (schema + titles + collision handling stable BEFORE migration touches existing members per locked sequencing)
- Soft dependencies: W1.I5 (Crisis Banner for maintenance window communication)
- Downstream consumers: W4.I5 (post-migration profile redesign consumes migrated data)

### W4.I5 — Profile redesign + identity surface integration
- Hard dependencies: W4.I1, W4.I2, W4.I4, W4.I3
- Soft dependencies: W1.S3 (member directory integration), W1.S11 (Chip post history)
- Downstream consumers: none (closing Identity ship)

### W4.S2 — Heat maps + drill-downs (priority ii first per locked decision)
- Hard dependencies: W1.S1, W1.S4, M4 (extends Stats surfaces)
- Soft dependencies: W1.I6 (multi-tee-box data from course capture)
- Downstream consumers: W4.S1 (advanced stats may use heat maps)

### W4.S1 — Advanced putting + approach stats (scope-delegated to orchestration team)
- Hard dependencies: W1.S4, M4, W4.S2
- Soft dependencies: M3 (may require amendment for shot-by-shot data capture)
- Downstream consumers: W4.S3 (custom trophies may consume advanced stats)

### W4.S3 — Custom league trophies (final Build Roadmap ship)
- Hard dependencies: W1.S9, W2.S2 (extends Trophy Watch), W4.I2 (Champion titles), W4.S2 (filter architecture)
- Soft dependencies: W4.S1 (custom trophies may consume advanced stats)
- Downstream consumers: none (final Build Roadmap ship)

## Dependency violation behavior

If orchestration team attempts to execute a ship before its hard dependency is complete:

1. Pre-flight audit catches the violation per P1 protocol
2. Ship execution halts
3. Orchestrator surfaces dependency gap via decision-bubble (or escalates to Founder if outside graduated autonomy)
4. Resolution: complete dependency first, then resume blocked ship

## Audit cadence

- Per-ship pre-flight: dependencies verified against this document
- Per-retrospective: any dependency surprises during the period logged for governance refinement
- Per-wave close: full dependency review; new dependencies surfaced for next wave updated here

## Updates to this document

Founder amends at any time. New ships added to dependencies as scope evolves. Removed dependencies (e.g., feature deferred to later) updated here.
