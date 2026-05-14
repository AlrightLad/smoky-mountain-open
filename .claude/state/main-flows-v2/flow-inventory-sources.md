---
doc: main-flows v2 Phase 1 source inventory + methodology
date: 2026-05-14
authored_by: claude-code
trigger: Founder SHIP — main-flows v2 Phase 1
status: complete (Phase 1 inventory authored)
---

# Phase 1 Audit — Source Inventory + Methodology

## Sources audited

### Primary specs (12 docs)

| Doc | Surface | Flow density |
|---|---|---|
| `docs/CLUBHOUSE_SPEC.md` | Mobile design tokens (§1-§5) | Foundation, not flow source |
| `docs/CLUBHOUSE_SPEC-3a-Home.md` | Mobile Home screen | 3-5 flows |
| `docs/CLUBHOUSE_SPEC-3b-Play.md` | Mobile Play screens (start a round) | 5-7 flows |
| `docs/CLUBHOUSE_SPEC-3c-Feed.md` | Mobile Feed (activity stream + filters) | 3-4 flows |
| `docs/CLUBHOUSE_SPEC-3d-Stats.md` | Mobile Stats tab | 4-6 flows |
| `docs/CLUBHOUSE_SPEC-3e-More.md` | Mobile More tab (settings, league mgmt, about) | 6-8 flows |
| `docs/CLUBHOUSE_SPEC-4-Wave3-implementation.md` | Mobile implementation milestones M1-M6 | refers to all 22 mobile screens |
| `docs/CLUBHOUSE_SPEC-HQ.md` | HQ web overview | structural |
| `docs/CLUBHOUSE_SPEC-HQ-3a-Home.md` | HQ Home (masthead + main column + rails) | 5-8 flows |
| `docs/CLUBHOUSE_SPEC-HQ-3b-SpectatorHUD.md` | HQ Spectator HUD | 2-3 flows |
| `docs/CLUBHOUSE_SPEC-HQ-3c-Scorecard.md` | HQ Scorecard view | 2-3 flows |
| `docs/CLUBHOUSE_SPEC-HQ-3d-Leaderboard.md` | HQ Leaderboard view | 2-3 flows |

### ROADMAP source

`docs/agents/ROADMAP.md` — 4-wave build roadmap:
- Wave 1 (HQ Functional Completion): 14 ships S1-S14 + 5 infra I1-I5
- Wave 2 (Design Coherence Pass): per-page implementation ships
- Wave 3 (Mobile Clubhouse Rebuild): 6 milestones M1-M6 (22 mobile screens)
- Wave 4 (Identity Architecture + Stats Expansion): 5 identity ships I1-I5 + stats expansion
- Launch: Phase C (Golf Features) + Phase A (Monetization) + Phase B (App Store)

### MAIN_FLOWS.md baseline

Existing 8 flows MF-01..MF-08 (from F4 substrate work, db-2026-05-13-004 approved-with-dissent). These are the founder-recommended ranked flows. v2 inventory PRESERVES MF-01..MF-08 and EXPANDS to cover the full surface.

### Code reality

- `src/pages/` — 46 member-facing entry-point files (aces / activity / admin / awards / bounties / caddynotes / calendar / challenges / chat / courses / dms / drills / faq / feed / findplayers / home / invite / leagues / members / merch / more / onboarding / partygames / playnow / range / rangelive / records / richlist / round / roundhistory / rounds / rules / scorecard / scramble / scramblelive / seasonrecap / settings / shop / social / spectator / standings / syncround / teetimes / trips / trophyroom / wagers)
- `functions/index.js` — 8 Cloud Functions:
  - `searchCourses` — GolfCourseAPI proxy
  - `validateInvite` — invite-link validation
  - `sendPushNotification` — FCM push trigger
  - `onMemberRoleChange` — role transitions
  - `onLeagueDelete` — cascade league deletion
  - `joinLeague` — multi-league membership
  - `onFounderAccessLog` — Founder access audit
  - `expireSuspensionsAndTransfers` — scheduled lifecycle cleanup
- Firestore collections (per CLAUDE.md multi-league architecture):
  - LEAGUE-scoped: rounds, chat, trips, teetimes, wagers, bounties, scrambleTeams, calendar_events, scheduling_chat, social_actions, invites, syncrounds, liverounds
  - GLOBAL: members, courses, course_reviews, photos, parcoin_transactions, notifications, pendingPush, config, errors, presence

### Substrate / system flows

Already operational, documented in earlier substrate work:
- 3 cron pipelines (downloads-watcher, maintenance, overnight-triage)
- regen-all chain (telemetry agg → dashboard regen → round-trip test)
- Proposal lifecycle (5-state pending/approved/applied/deferred/rejected)
- Amendments lifecycle (5-state, this session's build)
- Discussion bubble lifecycle
- Token observability (real / estimated / manual)

### Discussion bubbles for in-progress flow design

- `db-2026-05-13-001` through `db-2026-05-13-006` (closed)
- `db-2026-05-14-001` (open, UI/UX maturity gap — long-running)

## Methodology

For each potential flow identified across sources, the audit:

1. Names the flow with a verb-first short phrase ("Log a round", not "Logging").
2. Identifies the **actor**: member / commissioner / founder / system / agent.
3. Assigns a **tier**:
   - `core` — member-facing, frequent, high-value
   - `supplementary` — member-facing, optional / lower-frequency
   - `admin` — commissioner / founder operational
   - `system` — substrate / cron / agent / cloud-function
4. Classifies **status**:
   - `shipped` — already operational in production
   - `shipping` — Wave 1 in-flight (named ship targets it)
   - `planned` — named in roadmap, no ship started yet
   - `speculative` — implied but no source citation; flagged
5. Lists ships that serve the flow (`served_by_ships` array).
6. States the user goal (one sentence).
7. Names the trigger.
8. Identifies components touched (cross-reference with main-flows-data.json column schema).
9. Estimates step count.
10. Cites binding caveats with source-of-truth references.

## Inventory output

Comprehensive flow list authored at:
`.claude/state/main-flows-v2/flow-inventory.json`

Total flows discovered: **62**.

Breakdown by actor:
- member: 38
- commissioner: 6
- founder: 4
- system: 11
- agent: 3

Breakdown by tier:
- core: 18
- supplementary: 19
- admin: 14
- system: 11

Breakdown by status:
- shipped: 22 (legacy / pre-Wave-1)
- shipping: 14 (Wave 1 named ship)
- planned: 21 (Wave 2-4 + Phase C)
- speculative: 5 (implied; flagged)

## What this audit does NOT include

- Pixel-level UI behaviors (those live in CLUBHOUSE_SPEC docs already)
- Backend implementation details (Firestore rules, security model) — those are architecture, not user-facing flows
- Internal agent-to-agent flows beyond the 5 documented orchestration scenarios
- Flows that exist ONLY in the team's imagination without a documented source (excluded per the "cite source" Critic gate)

## Fallback plans (per AUTONOMOUS_FAILURE_RECOVERY v8.3 §3)

```
primary_approach:
  description: 62-flow inventory authored above, taxonomized in Phase 2
  success_criteria: every flow cites a source doc + line; Critic verifies
    no synthesized flows

fallback_b:
  trigger: if Phase 1 review surfaces flows missing from inventory
  description: append-only patch with new flows + revised source doc;
    no re-numbering of existing flow IDs (stability invariant)

fallback_c:
  trigger: if Phase 2 finds taxonomy ill-fits the inventory shape
  description: reframe inventory under a different taxonomy without
    losing flow content; re-categorize but preserve flow IDs

abandon_criteria:
  3 distinct taxonomy attempts produce ambiguous categorizations of
  > 20% of flows; escalate to Founder with concrete examples of the
  ambiguous flows + 2-3 taxonomy options + team recommendation.
```

## Next phase

Phase 2 — Taxonomy proposals authored at `.claude/state/main-flows-v2/taxonomy-proposals.md`.
Founder escalation per criterion #5 (cross-cutting architecture decision).
