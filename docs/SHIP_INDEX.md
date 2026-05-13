# Ship Index — PARBAUGHS Build Roadmap

> Single-page navigation for the 40-ship Build Roadmap. All Visions ratified. Orchestration team executes per locked dependency order.

## Wave 1 — Foundation + Member-facing core (20 ships)

| # | Ship ID | Title | Member-visible | Mock status |
|---|---|---|---|---|
| 1 | [W1.S1](ships/W1.S1.md) | Design system codification | No | N/A (foundation) |
| 2 | [W1.S2](ships/W1.S2.md) | HQ chrome refresh + Home | Yes | Locked |
| 3 | [W1.S3](ships/W1.S3.md) | Members + Find Players | Yes | Awaiting design bot |
| 4 | [W1.S4](ships/W1.S4.md) | Round capture core | Yes | Awaiting design bot |
| 5 | [W1.S5](ships/W1.S5.md) | Spectator + Caddy Notes verify | Yes | Locked |
| 6 | [W1.S6](ships/W1.S6.md) | Parcoin economy (Wagers/Bounties/Challenges) | Yes | Awaiting design bot |
| 7 | [W1.S7](ships/W1.S7.md) | Multi-player formats (Scrambles + Party Games) | Yes | Awaiting design bot |
| 8 | [W1.S8](ships/W1.S8.md) | Calendar + Tee Times + Trips | Yes | Awaiting design bot |
| 9 | [W1.S9](ships/W1.S9.md) | Trophy Room + Awards + Records + Aces | Yes | Partial (CHAMPIONS_MARK_SPEC) |
| 10 | [W1.S10](ships/W1.S10.md) | Season Recap + Range | Yes | Awaiting design bot |
| 11 | [W1.S11](ships/W1.S11.md) | Feed + Activity (Chip amended) | Yes | Awaiting design bot |
| 12 | [W1.S12](ships/W1.S12.md) | Chat + DMs + League Chat | Yes | Mobile locked; HQ awaiting |
| 13 | [W1.S13](ships/W1.S13.md) | Courses + Leagues + More | Yes | Awaiting design bot |
| 14 | [W1.S14](ships/W1.S14.md) | Admin + Onboarding | Yes | Awaiting design bot upload |
| 15 | [W1.I1](ships/W1.I1.md) | Member bug reporting | Yes | Awaiting design bot |
| 16 | [W1.I2](ships/W1.I2.md) | Smoke automation + sibling | No | N/A (infrastructure) |
| 17 | [W1.I3](ships/W1.I3.md) | Caddy Notes restructure (3-section) | Yes | N/A (implementation against governance) |
| 18 | [W1.I4](ships/W1.I4.md) | Staging environment (Option B) | No | N/A (infrastructure) |
| 19 | [W1.I5](ships/W1.I5.md) | Crisis banner system (3-tier) | Yes | N/A (implementation against governance) |
| 20 | [W1.I6](ships/W1.I6.md) | Course Capture from Photo | Yes | Awaiting design bot |

## Wave 2 — HQ desktop redesign (6 ships)

| # | Ship ID | Title | Member-visible | Mock status |
|---|---|---|---|---|
| 21 | [W2.S0](ships/W2.S0.md) | HQ Foundation (skeleton on staging) | No | Locked |
| 22 | [W2.S1](ships/W2.S1.md) | HQ Home (banded grid + Tee Sheet agate) | Yes | Locked |
| 23 | [W2.S2](ships/W2.S2.md) | Leaderboard (reusable table + Trophy Watch) | Yes | Locked |
| 24 | [W2.S3](ships/W2.S3.md) | Scorecard (3 share actions) | Yes | Locked |
| 25 | [W2.S4](ships/W2.S4.md) | Spectator HUD | Yes | Locked |
| 26 | [W2.S5](ships/W2.S5.md) | Polish + a11y + global chrome | Yes | Locked |

## Wave 3 — Mobile Clubhouse (6 ships)

| # | Ship ID | Title | Member-visible | Mock status |
|---|---|---|---|---|
| 27 | [M1](ships/M1.md) | Capacitor harness (iOS only) | No | N/A (infrastructure) |
| 28 | [M2](ships/M2.md) | Home tab + shared chrome | Yes | Locked |
| 29 | [M3](ships/M3.md) | Play tab (highest complexity) | Yes | Locked |
| 30 | [M4](ships/M4.md) | Stats tab | Yes | Locked |
| 31 | [M5](ships/M5.md) | Feed tab | Yes | Locked |
| 32 | [M6](ships/M6.md) | More tab + TestFlight (HOLDS on Founder workstreams) | Yes | Locked |

## Wave 4 — Identity Refresh + Stats expansion (8 ships)

| # | Ship ID | Title | Member-visible | Mock status |
|---|---|---|---|---|
| 33 | [W4.I1](ships/W4.I1.md) | Username + discriminator schema + signup | Yes | Awaiting design bot |
| 34 | [W4.I2](ships/W4.I2.md) | Title system (extensible) | Yes | Awaiting design bot + CHAMPIONS_MARK_SPEC |
| 35 | [W4.I4](ships/W4.I4.md) | Username uniqueness + collision handling | Yes | Awaiting design bot |
| 36 | [W4.I3](ships/W4.I3.md) | Member migration (founding 20) — LAST in Identity | Yes | Awaiting design bot |
| 37 | [W4.I5](ships/W4.I5.md) | Profile redesign + identity integration | Yes | Awaiting design bot |
| 38 | [W4.S2](ships/W4.S2.md) | Heat maps + drill-downs (priority ii first) | Yes | Awaiting design bot |
| 39 | [W4.S1](ships/W4.S1.md) | Advanced putting + approach stats (scope-delegated) | Yes | Defers to catalog research |
| 40 | [W4.S3](ships/W4.S3.md) | Custom league trophies (FINAL Build Roadmap ship) | Yes | Awaiting design bot |

## Mock coverage summary

- **Locked mocks:** 14 ships
- **Partial mocks:** 2 ships
- **Awaiting design bot fill-in:** 16 ships
- **N/A (infrastructure / implementation against governance):** 8 ships

## Execution order (high-level)

1. **Phase 1 commit** — governance lands, Wave Zero Dry-Run executes
2. **Wave 1 design ships** in dependency order (W1.S1 → W1.S2 → W1.S3 → W1.S4 → ...)
3. **Wave 1 infrastructure ships** parallel with design ships where dependencies allow (W1.I1-I6)
4. **Wave 2 reveal sequence** — W2.S0 to staging → W2.S1 through W2.S5 → reveal flag removed at production
5. **Wave 3 mobile** — M1 (infrastructure) → M2-M5 web emulation → M6 HOLDS on Founder workstreams
6. **Wave 4 Identity** — W4.I1 → W4.I2 → W4.I4 → W4.I3 (migration LAST) → W4.I5
7. **Wave 4 Stats** — W4.S2 (priority ii first) → W4.S1 (scope-delegated catalog) → W4.S3 (FINAL ship)
8. **Build → Launch interlude** — Launch Phase A + B Visions authored

## Cross-references

- [CROSS_WAVE_DEPENDENCIES.md](CROSS_WAVE_DEPENDENCIES.md) — full ship-to-ship dependency map
- [PLATFORM_ONBOARDING.md](PLATFORM_ONBOARDING.md) — start-here entry point
- [SHIP_PLAN_TEMPLATE.md](SHIP_PLAN_TEMPLATE.md) — orchestration team fills per ship
- [POST_PUSH_RETROSPECTIVE.md](POST_PUSH_RETROSPECTIVE.md) — 5-component output format
- [HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md](HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md) — 13 halt criteria including rate limit

## Founder workstreams (parallel — do NOT block ship execution)

These workstreams run alongside Build Roadmap execution. They gate M6 and Launch Phase B specifically.

1. **LLC formation in Pennsylvania** — legal entity name TBD (Parbaughs LLC or equivalent)
2. **D-U-N-S Number registration** via Dun & Bradstreet — free path 5-30 business days OR expedited paid
3. **Apple Developer Program enrollment** — Organization tier ($99/yr), 1-2 week Apple review after D-U-N-S available

**Total realistic prerequisite window: 4-8 weeks from LLC start.**

Wave 3 M1-M5 execute without these complete. **M6 explicitly holds until all three active.**
