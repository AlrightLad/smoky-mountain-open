# Design spec manifest — what we actually have

**Authored:** 2026-05-21 after Founder correction ("These mock files are also in the repo"). Earlier session reports incorrectly said mocks didn't exist. **They do — as markdown specs, not HTML mocks.** This manifest is the corrected inventory.

## What's in `docs/`

| File | Lines | Covers | Maps to ship |
|---|---:|---|---|
| `CLUBHOUSE_SPEC.md` | 819 | Mobile master (Part 1) — palette, type, spacing, motion, elevation | All mobile ships M1-M6 + Wave 1 design system |
| `CLUBHOUSE_SPEC-3a-Home.md` | 521 | Mobile Home view (all states) | M2 |
| `CLUBHOUSE_SPEC-3b-Play.md` | 666 | Mobile Play view | M3 |
| `CLUBHOUSE_SPEC-3c-Feed.md` | 513 | Mobile Feed view | M5 |
| `CLUBHOUSE_SPEC-3d-Stats.md` | 528 | Mobile Stats view | M4 |
| `CLUBHOUSE_SPEC-3e-More.md` | 490 | Mobile More view | M6 |
| `CLUBHOUSE_SPEC-4-Wave3-implementation.md` | 578 | Wave 3 implementation overview | M1-M6 |
| `CLUBHOUSE_SPEC-HQ.md` | 750 | HQ master (Part 1) — chrome, masthead, nav, scope rail | **W1.S2** |
| `CLUBHOUSE_SPEC-HQ-3a-Home.md` | 324 | HQ Home view (all 4 states) | **W1.S2** |
| `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` | 312 | HQ Spectator HUD | **W1.S5** |
| `CLUBHOUSE_SPEC-HQ-3c-Scorecard.md` | 278 | HQ Scorecard | **W1.S4** (Round capture core) |
| `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` | 301 | HQ Leaderboard | **W1.S9** (Trophy Room + Awards + Records) |
| `wave-2a-ratification.md` | — | Wave 2A design ratification (palette + components consumed by Wave 2) | All Wave 2 ships |
| `clubhouse-rollout-plan.md` | — | Rollout sequencing | Wave 2 + Wave 3 transition |
| `clubhouse-design-system.md` | — | This session's design system codification audit (W1.S1 baseline) | W1.S1 |

**Total:** 12 CLUBHOUSE_SPEC files = **6080 lines of design spec**. Plus wave-2a-ratification, rollout-plan, etc.

## What the specs name as "canonical mock"

Several specs reference HTML mock files that I cannot find in the repo:

| Spec | Names | Status |
|---|---|---|
| `CLUBHOUSE_SPEC-HQ-3a-Home.md` | `Parbaughs HQ Final v2.html` (`#v-home`) | **Mock HTML not in repo.** But the markdown spec itself is the implementation contract. |
| `docs/agents/ships/W1.S2.md` | `Parbaughs HQ Home v1.html` | Same. |
| `docs/HANDOFF_README.md` | `Parbaughs HQ Final v2.html`, `Parbaughs Mobile Final v2.html`, `Parbaughs HQ Home v1.html`, `Spotlight Mock Handoff.md`, `Parbaughs_CTO_Mock_Inventory.md` | All referenced but none present on disk. |

**Reality:** The markdown specs are the canonical contract. The HTML mocks were planned but never landed in the repo. The markdown specs include slot dimensions, content patterns, states, behaviors, fonts — enough to implement against.

## Ship × spec coverage matrix

| Ship | Member-visible? | Spec coverage | Ready to implement? |
|---|---|---|---|
| W1.S1 | No (foundation) | `clubhouse-design-system.md` (this session) | ✓ Shipped baseline |
| **W1.S2** HQ chrome + Home | Yes | `CLUBHOUSE_SPEC-HQ.md` + `CLUBHOUSE_SPEC-HQ-3a-Home.md` | **YES — spec is 1074 lines combined** |
| W1.S3 Members + Find Players | Yes | Partial — Members in CLUBHOUSE_SPEC-3e + W4.I1 identity coupling | Partial — Wave 4 identity dependency |
| **W1.S4** Round capture core | Yes | `CLUBHOUSE_SPEC-HQ-3c-Scorecard.md` | **YES — 278 lines** |
| **W1.S5** Spectator + Caddy verify | Yes | `CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` | **YES — 312 lines** |
| W1.S6 Parcoin economy | Yes | No dedicated spec; existing app pages | Partial — implementation exists, polish-only |
| W1.S7 Multi-player formats | Yes | No dedicated spec | Partial |
| W1.S8 Calendar + Tee Times + Trips | Yes | No dedicated spec | Partial — existing pages |
| **W1.S9** Trophy Room + Awards + Records | Yes | `CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` | **YES — 301 lines** |
| W1.S10 Season Recap + Range | Yes | No dedicated spec | Partial |
| W1.S11 Feed + Activity | Yes | `CLUBHOUSE_SPEC-3c-Feed.md` (mobile-leaning, applicable) | Partial — mobile-tilted spec |
| W1.S12 Chat + DMs + League Chat | Yes | No dedicated spec | Partial — existing pages |
| W1.S13 Courses + Leagues + More | Yes | `CLUBHOUSE_SPEC-3e-More.md` (mobile-leaning) | Partial |
| W1.S14 Admin + Onboarding | Yes | No dedicated spec | Critical Feature — Founder synchronous |
| W1.I1 ✓ | Yes | Implementation against governance | Shipped |
| W1.I2 Smoke automation | No | N/A | Blocked on W1.I4 |
| W1.I3 ✓ | Yes | Implementation against Writing Standard | Shipped |
| W1.I4 SCAFFOLDED | No | N/A | Founder action pending |
| W1.I5 ✓ | Yes | Implementation against governance | Shipped |
| M1 Capacitor harness | No | `CLUBHOUSE_SPEC-4-Wave3-implementation.md` § 1 | YES |
| **M2** Home tab | Yes | `CLUBHOUSE_SPEC-3a-Home.md` (521 lines) | **YES** |
| **M3** Play tab | Yes | `CLUBHOUSE_SPEC-3b-Play.md` (666 lines) | **YES** |
| **M4** Stats tab | Yes | `CLUBHOUSE_SPEC-3d-Stats.md` (528 lines) | **YES** |
| **M5** Feed tab | Yes | `CLUBHOUSE_SPEC-3c-Feed.md` (513 lines) | **YES** |
| **M6** More tab + TestFlight | Yes | `CLUBHOUSE_SPEC-3e-More.md` (490 lines) + W4 identity | Partial — TestFlight needs Apple Dev Account |
| W2.S0-S5 | Yes | `wave-2a-ratification.md` + per-page briefs (to be generated) | Blocked on Wave 1 baseline |
| W4.I1-I5 | Yes | `v9.1-handle-system-design.md` for identity | Blocked on staging env (W1.I4) |

## Corrected blocked-vs-ready list

**READY TO IMPLEMENT (spec-complete, agent-confident):**
- W1.S2 HQ chrome + Home — 1074-line spec
- W1.S4 Round capture core — 278-line spec
- W1.S5 Spectator HUD — 312-line spec
- W1.S9 Trophy Room + Leaderboard — 301-line spec
- M1 Capacitor harness — 578-line wave-3 spec
- M2 Mobile Home — 521-line spec
- M3 Mobile Play — 666-line spec
- M4 Mobile Stats — 528-line spec
- M5 Mobile Feed — 513-line spec

**Each of these is genuinely shippable. I incorrectly said "blocked on mock missing" earlier — should have been "spec exists in CLUBHOUSE_SPEC-*.md".**

**TRULY BLOCKED (need Founder/external action):**
- W1.S14 Admin + Onboarding — Critical Feature, requires Founder synchronous presence
- W1.I4 staging — Firebase project creation needs Founder console
- W4.I1-I5 — needs staging env + identity migration plan
- M6 TestFlight — Apple Developer Account
- W2.S0-S5 — needs Wave 1 functional baseline complete first

## What I missed earlier + why

**Missed:** I scanned ships/W1.S2.md and read "Parbaughs HQ Home v1.html (needed)" — interpreted as "mock missing" and stopped. I should have followed the reference TO the CLUBHOUSE_SPEC-HQ-3a-Home.md which IS in docs/ and IS the canonical spec for that ship.

**Pattern to fix:** when a ship spec references a "canonical mock" filename, ALWAYS check the corresponding CLUBHOUSE_SPEC for the markdown contract before declaring blocked. The HTML mocks were never produced (or never landed) but the markdown specs are authoritative.

**Next:** I can actually start W1.S2, W1.S4, W1.S5, W1.S9, M1-M5 with high confidence given the markdown specs.
