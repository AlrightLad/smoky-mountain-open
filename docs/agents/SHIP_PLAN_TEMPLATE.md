# Ship Plan Template

Every ship requires a Ship Plan committed to `docs/agents/ships/<ship-id>.md` before engineering work begins.

The Ship Plan is the contract between Founder (Vision) and the orchestration team (everything else). The Critic reviews the Ship Plan against the 12 rejection criteria + this template structure before any code is written.

## Required structure

Copy the template below for new ships. All sections are mandatory unless marked optional.

---

```markdown
# Ship <ID>: <Name>

**Wave:** <W1 | W2 | W3 | W4 | Launch-C | Launch-A | Launch-B>
**Ship ID:** <e.g., W1.S3, M3, AS1>
**Status:** <Drafting | Ratified | In Progress | Critic Review | Shipped | Closed>
**Started:** <date>
**Target close:** <date>

## Vision (Founder-authored)

<What is the goal of this ship in plain English? What does success look like to members? Why is this worth doing now? Authored by Founder before agent work begins. Agents do not modify this section.>

## Scope

### In scope
- <Specific deliverables>
- <Reference design spec sections by ID>

### Out of scope
- <Things explicitly NOT in this ship>
- <Items deferred to later ships with reasoning>

### Cross-surface dependencies (Criterion 12)
- <Other surfaces affected by this ship's writes/reads>
- <Citing 30-file member-data fanout pattern where relevant>

## Prerequisites

- <Prior ships that must be merged>
- <External dependencies (Apple Developer Account, etc.)>
- <Required design spec sections in CLUBHOUSE_SPEC or wave-2a-ratification>

## Architecture

### Files touched
- <Path>: <Purpose>

### Firestore reads/writes
- <Collection>: <Operation> via `leagueQuery`/`leagueDoc` wrapper (league-scoped) or `db.collection()` (global, per `src/core/utils.js:13` LEAGUE_SCOPED list)
- <Required composite indexes>

### Cross-platform notes
- <HQ-only | Mobile-only | Both surfaces>
- <Capacitor plugins required from § 7.2 plugin matrix>

## Scalability Architecture (per Q44 Lock 3)

### Free-tier first
- <Does this ship introduce paid services? If yes, justification required.>
- <Alternative comparison: 3+ options considered>

### 10x scaling plan
- <Current load: 20 members. 10x = 200 members. 100x = 2000 members.>
- <What breaks at 200 members?>
- <What breaks at 2000 members?>
- <Migration path documented if approach is interim>

### Cost projection
- <Firestore reads/writes per active member per session>
- <Storage growth projection>
- <Cloud Function invocation frequency>

## Critical Feature Registry triggers

| Trigger | Category | Founder action required |
|---|---|---|
| <Specific decision> | <CFR category 1-11> | <Approve / Defer / Alternative> |

If no triggers, state: "No Critical Feature Registry triggers identified."

## Sanity Halt risk areas

| Risk | Category | Mitigation |
|---|---|---|
| <Specific risk> | <SH category 1-8> | <How risk is contained> |

If no risks, state: "No Sanity Halt risk areas identified."

## Implementation plan

### Phase 1: <Phase name>
- <Concrete steps>
- <Files modified>
- <Smoke coverage added>

### Phase 2: <Phase name>
- <Concrete steps>

### Phase N: <Phase name>
- <Concrete steps>

## Acceptance criteria

| Criterion | Pass condition |
|---|---|
| 1:1 fidelity to design spec | <Specific verification approach> |
| State coverage | All 12-criterion states implemented and smoke-tested |
| Token traceability | No raw hex/px/ms values; all tokens cite Part 1 by name |
| Smoke coverage | <Specific smoke specs added> |
| Accessibility | <Keyboard nav, ARIA, contrast, motion-reduce verification> |
| Cross-surface non-regression | <Prior ships unaffected; verified how> |
| Performance | <Specific budget if applicable> |

## Risk areas

- <Specific concern>: <Mitigation or escalation path>

## Caddy Notes entry

**Section:** <Recent updates | What's in the bag | Roadmap>

**Draft entry:**
> <Member-facing description of what this ship delivers. No internal jargon, no architectural detail, no unshipped feature names.>

**Version bump:** <X.Y.Z>
- X = major
- Y = feature/patch
- Z = bugfix

## Inferred decisions

<Decisions the orchestration team made under graduated autonomy without explicit Founder ratification. Logged here AND in docs/agents/INFERRED_DECISIONS.md. Founder reviews at retrospective.>

| Decision | Tier | Rationale (which prior decision pattern this matches) |
|---|---|---|
| <Decision> | <T1 | T2 | T3> | <Reasoning> |

If no inferred decisions, state: "No inferred decisions made in this ship."

## Retrospective hooks

To be completed at ship close:
- What went well:
- What didn't:
- Inferred decisions to ratify or reverse:
- Lessons for backlog or skill capture:
- Next ship implications:
```

---

## How the Ship Plan flows

1. **Drafting (Orchestrator)** — Orchestrator creates the file at `docs/agents/ships/<ship-id>.md`. Vision section left for Founder. All other sections drafted with `[GAP]` markers for items not yet known.

2. **Vision authoring (Founder)** — Founder authors Vision section. This is the only Founder-required input before agent work begins (other than prior ratifications already locked in roadmap and design spec).

3. **Pre-flight audit (Engineer + Critic)** — Engineer runs audit-first protocol on Ship Plan. Critic reviews against 12 rejection criteria + this template structure. Brief rejection bounces back to Orchestrator, not Engineer.

4. **Ratified status** — Founder ratifies the complete Ship Plan. Status updates to Ratified. Engineering work begins.

5. **In Progress** — Engineer implements per phases. Inferred decisions logged. Status updates to Critic Review when Engineer self-audit passes.

6. **Critic Review** — Critic verifies acceptance criteria. Failures bounce back to Engineer. Pass advances to Shipped status.

7. **Shipped** — Code merged to main. Caddy Notes entry published. Version bump applied. Status updates to Shipped.

8. **Closed** — Retrospective review complete. Ship file moves to `docs/agents/ship-reports/<ship-id>.md`. Inferred decisions ratified or reversed in INFERRED_DECISIONS.md.

## What this template enforces

- Founder-authored Vision before agent work
- Cross-surface dependency declaration (Criterion 12)
- Scalability architecture per Q44 Lock 3 cost halt mandate
- CFR + Sanity Halt risk surfaced upfront, not discovered mid-flight
- Phase-broken implementation plan (not "build the feature")
- Concrete acceptance criteria (not "looks good")
- Caddy Notes entry drafted upfront (not retrofitted)
- Inferred decisions logged for Founder ratification at retrospective

## What this template does NOT do

- Replace design spec sections (the spec hierarchy in `docs/` is authoritative for design)
- Replace protocols (P1-P9 in PROTOCOLS.md cover operational specifics)
- Replace CFR or Sanity Halt frameworks (those are their own documents)
