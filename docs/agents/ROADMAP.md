# PARBAUGHS Roadmap

Founder-authored. Two roadmaps separated by execution model. Founder edits anytime; Orchestrator re-reads at next phase boundary and captures revision acknowledgment to active ship report.

## Current state

- Latest shipped: v8.22.0 (Ship 5+7 — Rounds page consolidation + retroactive logging)
- Status: Phase 1 setup pending → Wave 1 fires next
- Ship 5+8 fires as first calibration ship under new orchestration

---

## BUILD ROADMAP

Agent-autonomous execution. Three-agent system (Orchestrator + Engineer + Critic) chains ships under Critical Feature Registry + Sanity Halt + Graduated Autonomy framework.

### Wave 1 — HQ Functional Completion

**Vision:** Every HQ page reaches functional completion. After Wave 1, HQ ready for design coherence pass.

**Ship count:** 19 ships (14 design + 5 infrastructure) per design bot Wave 2A ratification.

**Strict ship order:**

```
W1.S1 → W1.S2 → W1.S3 → W1.S4 → W1.S5 (W1.I3 parallel)
                                  │
W1.S6 → W1.S7 → W1.S8 → W1.S9 → W1.S10 → W1.S11 → W1.S12 → W1.S13 → W1.S14
                                                                       │
W1.I1, W1.I2, W1.I4, W1.I5 run parallel with design ships ─────────────┘
```

**Design ships (14):**
- W1.S1 — Design system codification (Wave 2A spec → consumable CSS variables + component classes + JS helpers)
- W1.S2 — HQ chrome refresh (masthead, nav rail, footer, scope band, plus Home page itself)
- W1.S3 — Members directory + Find Players (member card component family)
- W1.S4 — Round capture core (Sync Round, Scorecard, Round detail, Round History, Rounds page)
- W1.S5 — Spectator + Caddy Notes verify
- W1.S6 — Parcoin economy: Wagers + Bounties + Challenges
- W1.S7 — Multi-player formats: Scrambles + Scramble Live + Party Games (2-3 MVP, advanced library deferred)
- W1.S8 — Calendar + Tee Times + Trips
- W1.S9 — Trophy Room + Awards + Records + Aces
- W1.S10 — Season Recap + Range
- W1.S11 — Feed + Activity
- W1.S12 — Chat + DMs + League Chat (image attachments included per ratification)
- W1.S13 — Courses + Leagues + More
- W1.S14 — Admin + Onboarding (Critical Feature Registry trigger — Founder synchronous presence)

**Infrastructure ships (5):**
- W1.I1 — Member bug reporting surface
- W1.I2 — Smoke automation + B.47 sibling smoke account
- W1.I3 — Caddy Notes restructure (3 sections, universal content for all members)
- W1.I4 — Staging environment infrastructure (first ship under new orchestration)
- W1.I5 — Crisis banner (3-tier: NOTICE / ALERT / CRITICAL, remote-toggleable)

**Wave 1 → Wave 2 gate:**
- P8 visual smoke coverage chromium 100% across all HQ pages
- Active backlog cleared OR all remaining items explicitly deferred to later waves by Founder ruling
- Founder ratification

**Deployment:** Continuous to production.

### Wave 2 — Design Coherence Pass

**Vision:** Design bot review + refinement based on Wave 1 functional baseline. 1:1 pixel fidelity from mocks. Per-page Founder confirmation gate.

**Phase 2A — Design system spec:** Already produced (Pass 2 of design bot work). Committed at docs/CLUBHOUSE_SPEC.md Part 1.

**Phase 2B — Per-page mocks:** Already produced for mobile (22 screens across Pass 3a-3e). HQ per-page mocks generated during Phase 2B execution by design bot per-ship re-engagement.

**Phase 2C — Implementation ships:** Each ship implements one page or small batch per ratified brief. Engineer reproduces 1:1 from mocks. Critic verifies pixel-level match. Gap inference per Engineer audit protocol; ratification at retrospective.

**Wave 2 → Wave 3 gate:**
- Phase 2A design system spec committed and Founder-ratified (DONE for mobile)
- All Phase 2B per-page briefs delivered and approved
- All Phase 2C implementation ships shipped per ratified briefs
- Visual regression tests added per P8
- Founder retrospective review confirms HQ visually coherent
- Wave 2 staged content deploys to production (the "redesign reveal")

**Deployment:** Wave 2 ships stage. Wave 1 production continues unchanged until Wave 2 → Wave 3 transition.

### Wave 3 — Mobile Clubhouse Rebuild

**Vision:** iOS/Android Clubhouse mobile apps. TestFlight active for founding 20 by end of wave. No app store submission yet.

**Six milestones M1-M6** per design bot Pass 4 (docs/CLUBHOUSE_SPEC-4-Wave3-implementation.md):
- M1 — Capacitor harness + web emulation (foundation, no screens)
- M2 — Home tab (3 screens + shared chrome)
- M3 — Play tab (6 screens + GPS + authorship + offline queue) — highest complexity
- M4 — Stats tab (5 screens + Records cache + share-as-image)
- M5 — Feed tab (4 screens + image attachments + mentions + pin)
- M6 — More tab + TestFlight enrollment (4 screens + Settings + Admin + cost dashboard)

**Ship order:** M1 → M2, then M3/M4/M5 parallelizable after M2, then M6 requires all five prior merged.

**Wave 3 → Wave 4 gate:**
- M1-M6 all shipped
- TestFlight active for founding 20 (Founder-managed manual enrollment)
- Mobile design system from Phase 2A applied across all 6 tabs
- HQ ↔ Mobile data sync architecture verified
- Apple Developer Account active
- Founder retrospective review confirms mobile UX ready for identity changes

**Deployment:** Browser-emulation throughout development. TestFlight build for founding 20 by end of wave. No app store submission.

### Wave 4 — Identity Architecture (Part C) + Stats Expansion

**Vision:** Discord-style usernames as identity primitive. Earned titles display adjacent to username, never overwrite. Plus stats expansion ships to deepen the Stats tab capability.

**Identity Ships (I1-I5):**
- I1 — Discriminator generation infrastructure (stages)
- I2 — Founder-led migration of existing 20 members (production)
- I3 — UI rollout for `displayname#XXXX` + title separation
- I4 — Signup flow rewrite for new members
- I5 — Legacy username cleanup + final consistency pass

**Stats Expansion Ships:** Scope to be defined when Wave 4 fires. Folds within Wave 4 alongside identity work per Q&A lock.

**Deployment posture (mixed per ship):**
- I1 stages, I2 production (live data), I3 stages → batches, I4 stages → production, I5 stages → final production push

**Wave 4 → Build Roadmap complete gate:**
- Identity Ships I1-I5 all shipped
- All 20 founding members migrated to new identity primitive
- New signup flow uses identity primitive natively
- Legacy username code paths removed
- Stats expansion shipped
- Founder retrospective review confirms identity architecture stable
- **Founder explicit ratification: "Build Roadmap complete"**

### Build → Launch transition

Per Q57 lock:
1. Founder ratifies "Build Roadmap complete"
2. Interlude period (Founder-controlled length) — no agent work; Founder defines pricing model, monetization research, marketing prep, Phase C feature scope
3. Founder ratifies "Launch Phase A activated" when ready

---

## LAUNCH ROADMAP

Founder-led execution with synchronous Founder presence required per ship. Critical Feature Registry items inherent to Launch scope are acknowledged (not triggering halt+escalate). Sanity Halt + all hooks/skills/governance preserved per Launch Governance.

**Order: Phase C → Phase A → Phase B** (locked Q45).

### Phase C — Golf Features

**Vision:** Feature-rich product before monetization and public launch.

**Ships:**
- Swing analyzer (cost halt + scalability mandate applies — comparison matrix required for video upload + storage + analysis approach)
- Training drills with "dummy" animations

### Phase A — Monetization

**Vision:** Pricing model + payment infrastructure before public launch. Founder defines model during interlude period.

**Ships (Founder-defined model determines scope):**
- Pricing model decision
- Payment processor integration (Stripe or equivalent — comparison matrix required)
- Subscription lifecycle / billing UI / dunning / tax handling
- App store policy compliance consideration
- Grandfather logic for founding 20 if applicable

### Phase B — App Store Submission

**Ships:**
- AS1 — iOS submission (Apple Developer Account from Wave 3 carries forward)
- AS2 — Android submission (Google Play Account setup, $25 one-time)

---

## GOVERNANCE SUMMARY

**Three-agent system:** Orchestrator + Engineer + Critic per role definitions.

**Critical Feature Registry (11 categories):** feature additions, feature reworks requiring human testing, paid implementations + API additions, security risk vectors, data architecture, identity & permission, multi-league, mobile Clubhouse, onboarding, compliance & legal, cost-incurring implementations.

**Sanity Halt (9 categories):** smoke failures (app halt or specific UI), data loss, data exposure, security failures, bad app posture / drift, Founder protection, cost-incurring architecture, visual verification failures (per Correction 2).

**Cost halt + Scalability mandate:** 10x scaling required, free-tier first, migration paths documented per Ship Plan, comparison matrix for any cost-incurring choice.

**Graduated autonomy:** Phase 1 commit starts at **Tier 1** (autonomous-by-default). Tier 1 → Tier 2 (20 ships @ 95%) → Tier 3 (30 ships @ 95%). Permanent Founder approval for CFR triggers, Sanity Halt severity, Vision, Roadmap, cost-incurring architecture, wave gates, P0/P1 production rollback. **Push graduates: autonomous on green** (smoke + lint + visual verification pass). Founder push override available but no longer default.

**Visual verification (mandatory per P8):** Engineer + Critic capture Playwright screenshots per state per page per browser. Verify DOM, layout integrity, token rendering, cross-browser parity. Lint output and smoke-log text are not substitutes for screenshot verification.

**Bug severity (P0-P3):** P0/P1 interrupt sprints; P2 inter-wave sprints; P3 backlog opportunistic.

**Bug channels:** Founder (a), member in-app surface (b — W1.I1), smoke automation (c — W1.I2). No production error monitoring.

**Caddy Notes:** 3 sections (Recent updates, Roadmap, What's in the bag). **Universal content for all members.** No tiered differentiation ever. Orchestrator publishes without Founder approval.

**Backlog:** Hybrid (index + per-item files + closed archive). Structured per item. Severity at capture + retrospective. Never purged except Founder clearance or design obsolescence.

**Failure recovery:** Severity-tiered (single-ship rollback / roll-forward corrective / cumulative rollback / selective revert). Rollback ships streamlined template + Founder synchronous presence.

**Memory architecture:** Hybrid (persistent → committed markdown; session-internal → memory; Orchestrator clears at ship close).

**Inter-wave protocol:** Minimum checklist (retrospective + lessons-learned + backlog reconciliation + ratification) + wave-specific additions per `INTER_WAVE_PROTOCOL.md`.

**Production deployment:** Wave 1 → production. Wave 2 stages, transitions reveal. Wave 3 TestFlight only. Wave 4 mixed per ship.

**Staging:** Setup as first work under new orchestration (W1.I4).

**Single-machine constraint:** Build Roadmap runs from desktop. Enables phone remote-control monitoring + work/weekend boundary.

## Roadmap revision

Founder edits this file anytime. Orchestrator re-reads at next phase boundary and captures revision acknowledgment to active ship report (per Q22 lock).
