# PARBAUGHS Orchestration Team Handoff

> Master index covering all 6 governance zips (v2 through v5.5) plus 40 ship Vision files plus operational onboarding for the orchestration team to begin Wave Zero Dry-Run and Build Roadmap execution.

---

## What this is

The complete handoff package from Founder + CTO authoring to orchestration team execution. Everything below has been ratified across the Vision authoring session 2026-05-12 plus 6 governance bundles. The orchestration team executes from here forward; Founder reviews at retrospectives.

---

## Repo destination paths

All files below live under the `parbaughs` GitHub repository (AlrightLad/smoky-mountain-open). Working directory: `C:\Users\Zach\smoky-mountain-open`.

### Governance docs

All governance files go to `docs/agents/`:

```
docs/agents/
├── AGENT_NETWORK.md
├── ORCHESTRATOR.md
├── ENGINEER.md
├── CRITIC.md
├── FLOW_DOCUMENTER.md
├── UI_POLISHER.md
├── END_USER.md
├── DEVILS_ADVOCATE.md
├── HISTORICAL_PATTERN.md
├── FUTURE_SELF.md
├── PLAIN_ENGLISH_TRANSLATOR.md
├── BUG_TRIAGE_LISTENER.md
├── PERFORMANCE_LOAD_TESTING.md
├── SECURITY_AUDITOR.md
├── DATA_INTEGRITY.md
├── PROTOCOLS.md
├── HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md
├── CTO_INTERFACE.md
├── FLOW_DOCUMENTATION.md
├── SHIP_PLAN_TEMPLATE.md
├── SKILL_PERFORMANCE_REVIEW.md
├── SKILL_CATALOG_OVERVIEW.md
├── PLATFORM_ONBOARDING.md
├── SHIP_INDEX.md
├── CROSS_WAVE_DEPENDENCIES.md
├── POST_PUSH_RETROSPECTIVE.md
├── RATE_LIMIT_DISCIPLINE.md
├── MIGRATION_PROTOCOL.md
├── FEATURE_FLAG_DISCIPLINE.md
├── DOC_FRESHNESS_REVIEW.md
├── MEMBER_FEEDBACK_SYNTHESIS.md
├── DECISION_BUBBLE_AGENTS.md
├── WAVE_ZERO_DRY_RUN.md
├── SESSION_JOURNAL.md
├── SHIP_5_VISIONS.md          (Wave 1 Vision pack — pre-authored from prior session, if applicable)
├── INFERRED_DECISIONS.md
├── BACKLOG.md
├── DEVELOPMENT_GRADE_LOG.md
├── ships/                     ← 40 ship Vision files (see Ship Index)
├── ship-reports/              ← populated after ships close
├── retrospectives/            ← populated after every push (5-component output)
├── decision-bubbles/          ← populated when bubbles fire
├── lessons-learned/           ← populated at wave-close
├── migrations/                ← populated at first migration ship (W4.I3)
└── freshness-reviews/         ← populated at quarterly cadence
```

### Skills

All skills go to `.claude/skills/`:

```
.claude/skills/
├── parbaughs-goal-completion-verify.md
├── parbaughs-rate-limit-aware-pause.md
├── parbaughs-firestore-writer-audit.md
├── parbaughs-cross-surface-dependency-audit.md
├── parbaughs-css-token-usage-audit.md
├── parbaughs-legacy-field-consumer-audit.md
├── parbaughs-state-reassignment-audit.md
├── parbaughs-validator-strictness-audit.md
├── parbaughs-caddy-notes-update.md
├── parbaughs-semver-triple-bump.md
└── parbaughs-decision-bubble-write.md
```

### Operational state

```
.claude/state/
├── last-verify.json           ← state checkpoint for /loop + pause discipline
```

### Design specs (from your docs/ folder + design bot pass output)

```
docs/
├── CLUBHOUSE_SPEC.md
├── CLUBHOUSE_SPEC-3a-Home.md  through  -3e-More.md
├── CLUBHOUSE_SPEC-4-Wave3-implementation.md
├── CLUBHOUSE_SPEC-HQ.md
├── CLUBHOUSE_SPEC-HQ-3a-Home.md  through  -3d-Leaderboard.md
├── Parbaughs_CTO_Mock_Inventory.md
├── Parbaughs_Spotlight_Round_v2.html
├── B_32_-_Custom_Scrollbar_Spec.md
├── [DESIGN BOT FILL-IN OUTPUT — see DESIGN_BOT_GAP_FILL_BRIEF.md]
├── Parbaughs HQ Final v2.html         ← needed (visual source of truth)
├── Parbaughs Mobile Final v2.html     ← needed (visual source of truth)
├── Parbaughs HQ Home v1.html          ← needed (canonical mock per §01)
├── HQ Home v1 (web-only).html         ← needed (authoring split)
├── Spotlight Mock Handoff.md          ← needed (sub-spec)
├── §9.02 Mobile Band Spec.md          ← needed (mobile band reflow contract)
└── CHAMPIONS_MARK_SPEC.md             ← needed (trophy emblem spec)
```

---

## Commit order

Each governance zip has commit message convention:

| Zip | Commit message |
|---|---|
| v4 | `chore(governance): v4 — 3 new agents (Performance/Security/Data Integrity) + Wave Zero Dry-Run` |
| v5 | `chore(governance): v5 — HALT_CRITERIA master + autonomy discipline + session journal` |
| v5.1 | `chore(governance): v5.1 — decision bubble structural agents (4 new) + trial setup hard rule` |
| v5.2 | `chore(governance): v5.2 — bug triage listener agent (14th agent) + autonomous repair` |
| v5.3 | `chore(governance): v5.3 — post-push retrospective protocol (5-component output)` |
| v5.4 | `chore(governance): v5.4 — P10 loop-and-verify discipline + goal completion verify skill` |
| v5.5 | `chore(governance): v5.5 — rate limit + cross-wave deps + migration + feature flags + freshness + onboarding + skill catalog + member feedback + W1.S11 amendment` |

Order: v4 → v5 → v5.1 → v5.2 → v5.3 → v5.4 → v5.5. If you commit in this order, each addendum's references resolve cleanly to prior commits.

### Ship Vision files commit

Separate commit after all 6 governance zips land:

```
chore(governance): 40 ship Vision files + SHIP_INDEX + SHIP_PLAN_TEMPLATE
```

This commits everything from `docs/agents/ships/` (40 files) + `docs/agents/SHIP_INDEX.md` + `docs/agents/SHIP_PLAN_TEMPLATE.md`.

---

## Memory status

Founder memory at 30/30 entries. All Vision authoring session locks captured:

- 40-ship Build Roadmap structure
- Decision bubble voting (Interpretation B)
- Post-push retrospective discipline
- Rate-limit halt at 90%
- Mobile native architecture (`com.parbaughs.app`, iOS 16, parallel Founder workstreams)
- W1.S11 Chip canonical + 2-tab scope structure

Plus all prior critical locks. Memory is canonical reference for orchestration team during work.

---

## Design spec gap status

### Specs uploaded and locked

13 design specs successfully uploaded to docs/:

- Mobile foundation + 5 per-screen specs (CLUBHOUSE_SPEC + 3a-3e)
- HQ Foundation + 4 per-view specs (CLUBHOUSE_SPEC-HQ + 3a-3d)
- Wave 3 implementation roadmap (CLUBHOUSE_SPEC-4)
- Custom scrollbar spec (B_32)
- Spotlight Round v2 HTML mock
- CTO Mock Inventory

### Specs pending design bot fill-in pass

See `DESIGN_BOT_GAP_FILL_BRIEF.md` (in v5.5 zip) for the complete Tier 1-4 gap list. Founder runs design bot pass BEFORE orchestration team begins ship execution per locked path (b) decision.

Tier 1 critical mocks (15+): Members directory, Calendar, Live Scorecard, Settings, Admin, League v1, Feed v2, Composer flows, Parcoin Shop, Onboarding, Profile redesign, Trophy Room, Wallet, Heat map, Custom trophy creator, Advanced stats catalog (after orchestration research)

Plus canonical HTML mocks: `Parbaughs HQ Final v2.html`, `Parbaughs Mobile Final v2.html`, `Parbaughs HQ Home v1.html`, sub-spec files.

---

## How orchestration team begins

### Pre-execution checklist

1. **Read [PLATFORM_ONBOARDING.md](agents/PLATFORM_ONBOARDING.md)** — foundational context for new agent OR returning Founder
2. **Read [SHIP_INDEX.md](agents/SHIP_INDEX.md)** — single-page navigation of 40 ships
3. **Read [CROSS_WAVE_DEPENDENCIES.md](agents/CROSS_WAVE_DEPENDENCIES.md)** — ship-to-ship dependency map
4. **Read [PROTOCOLS.md](agents/PROTOCOLS.md)** — P0 through P10 protocols (audit-first, severity tiers, push protection, loop-and-verify, etc.)
5. **Read [HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md](agents/HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md)** — 13 halt criteria including rate limit
6. **Read [POST_PUSH_RETROSPECTIVE.md](agents/POST_PUSH_RETROSPECTIVE.md)** — 5-component output format required after every push
7. **Read [DECISION_BUBBLE_AGENTS.md](agents/DECISION_BUBBLE_AGENTS.md)** — voting (Interpretation B), contributing, bubble-only roles
8. **Read [AGENT_NETWORK.md](agents/AGENT_NETWORK.md)** — 14-agent roster + activation status

### First execution

**Wave Zero Dry-Run** per [WAVE_ZERO_DRY_RUN.md](agents/WAVE_ZERO_DRY_RUN.md). Trivial Caddy Notes update that exercises:

1. /loop pattern (P10)
2. `parbaughs-goal-completion-verify` skill output
3. Post-push retrospective 5-component generation
4. SESSION_JOURNAL.md logging
5. Caddy Notes update per Writing Standard
6. Semver triple-bump
7. Rate limit awareness

Dry-Run produces the first retrospective. Critic verifies all 5 components. If clean, orchestration team proceeds to W1.S1 (Design system codification) — the actual first ship.

---

## Active state tracking

### Open ships

[Orchestration team updates at session start — currently empty per pre-execution state]

### Current wave

**Build Roadmap not yet begun.** Founder workstreams parallel:
- LLC formation (open)
- D-U-N-S Number (open)
- Apple Developer Program enrollment (open)
- Design bot fill-in pass (in progress per locked path b)

### Founder workstream status

[Founder updates as workstreams complete]

| Workstream | Status | Notes |
|---|---|---|
| LLC formation (Pennsylvania) | Open | Gates M6 + Launch Phase B |
| D-U-N-S Number via D&B | Open | Gates M6 + Launch Phase B |
| Apple Developer Program (Organization tier) | Open | Gates M6 + Launch Phase B; depends on LLC + D-U-N-S |
| Design bot fill-in pass | In progress | Tier 1-4 mocks per DESIGN_BOT_GAP_FILL_BRIEF.md |

---

## Critical operational rules summary

Per locked governance, orchestration team operates under these mandatory rules:

1. **Audit-first** (P1) — no code without pre-flight audit
2. **Loop-and-verify** (P10) — Engineer uses /loop; `parbaughs-goal-completion-verify` skill output required for any completion declaration
3. **Post-push retrospective** (5 components) — every push, before ship close
4. **Rate limit halt at 90%** — pause cleanly, write state checkpoint, resume on reset
5. **Caddy Notes mandatory** every ship per Writing Standard (member-visible description, not internal implementation)
6. **Semver triple-bump** for every push (utils.js APP_VERSION + package.json + sw.js CACHE_NAME)
7. **Decision bubbles** for any decision that affects member-visible behavior OR cost projection OR architectural pattern — voting agents are Engineer + Critic + Performance/Security/Data Integrity per Interpretation B; contributing agents provide findings; bubble-only roles structure debate
8. **NEVER reproduce copyrighted content** — applies to design specs, mock attributions, etc.
9. **Never modify Vision text** in ship files — Founder-ratified, orchestration team scaffolds the rest
10. **Surface to Founder via retrospective** — primary communication channel; synchronous escalation only for genuine Sanity Halts

---

## Cross-references to v5.5 governance additions

- [RATE_LIMIT_DISCIPLINE.md](agents/RATE_LIMIT_DISCIPLINE.md) — 90% pause discipline
- [HALT_CRITERIA_ITEM_13_ADDENDUM.md](agents/HALT_CRITERIA_ITEM_13_ADDENDUM.md) — apply to existing HALT_CRITERIA
- [W1.S11_VISION_AMENDMENT.md](agents/W1.S11_VISION_AMENDMENT.md) — supersedes original W1.S11 Vision
- [CROSS_WAVE_DEPENDENCIES.md](agents/CROSS_WAVE_DEPENDENCIES.md) — dependency graph
- [MIGRATION_PROTOCOL.md](agents/MIGRATION_PROTOCOL.md) — discipline for W4.I3 + future migrations
- [FEATURE_FLAG_DISCIPLINE.md](agents/FEATURE_FLAG_DISCIPLINE.md) — flag lifecycle
- [DOC_FRESHNESS_REVIEW.md](agents/DOC_FRESHNESS_REVIEW.md) — periodic governance audit
- [PLATFORM_ONBOARDING.md](agents/PLATFORM_ONBOARDING.md) — start-here entry point
- [SKILL_CATALOG_OVERVIEW.md](agents/SKILL_CATALOG_OVERVIEW.md) — 11 skills at-a-glance
- [MEMBER_FEEDBACK_SYNTHESIS.md](agents/MEMBER_FEEDBACK_SYNTHESIS.md) — bug reports / Chips / feature requests synthesis

---

## What comes after Build Roadmap completes

Per locked governance:

1. **Build → Launch interlude** — Launch Phase A + B Visions authored
2. **Launch Phase A** — Parcoin pricing tier activation, Security/Auditor agent activates, monetization goes live
3. **Launch Phase B** — App Store submission (Apple Developer required), public mobile launch, Android workstream begins

Future ships from Launch Phase A + B not yet ratified — defer authoring to Build → Launch interlude session.

---

## Final notes

**This handoff package is complete for Build Roadmap execution.** The orchestration team has:

- 40 ratified ship Visions
- 14-agent network with locked activation criteria
- 11 operational skills
- All P0-P10 protocols
- Decision bubble voting structure (Interpretation B)
- Post-push retrospective discipline
- Rate-limit pause discipline
- Migration protocol
- Feature flag governance
- Cross-wave dependency graph
- Doc freshness review cadence
- Platform onboarding for continuity

**Pending Founder action:** design bot fill-in pass complete before W1 design ships requiring mocks fire. Per dependency graph, W1.S1 (design system codification) + W1.S2 (HQ chrome) + W1.S5 (spectator) + W1.I3 (Caddy Notes) + W1.I4 (staging) can fire BEFORE design bot pass complete because they don't depend on member-facing surface mocks.

**The orchestration team has authority to begin Wave Zero Dry-Run + early infrastructure ships at any time. Mock-dependent ships hold until design bot pass complete.**

---

*Last updated: Vision authoring session 2026-05-12*
*Build Roadmap: 40 ships, 4 waves, all Visions ratified*
*Status: Ready for orchestration team execution*
