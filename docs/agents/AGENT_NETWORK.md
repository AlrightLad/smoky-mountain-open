# Agent Network

The full agent network for PARBAUGHS orchestration. Six agents organized in two layers: sequential core orchestration (hierarchical) and parallel authorities (collaborative). All six collaborate; parallel authorities can challenge core orchestration in retrospective; healthy friction surfaces blind spots that hierarchical chains miss.

## Why this exists

Three agents (Orchestrator + Engineer + Critic) can build a ship. They cannot reliably:
- Maintain architectural source-of-truth as the codebase evolves
- Catch UX problems they're too close to see
- Test from a real member perspective at multiple skill levels

Adding three parallel authorities — Flow Documenter, UI Polisher, End User — covers those gaps. Each parallel authority is collaborative with core orchestration but has its own jurisdiction; they don't report to Orchestrator, they work alongside.

## The six agents

### Core orchestration (sequential, hierarchical)

#### 1. Orchestrator
Senior coordinator. Owns the plan. Escalates to Founder only on permanent-Founder-approval categories. Full role definition: [ORCHESTRATOR.md](./ORCHESTRATOR.md).

#### 2. Engineer
Implements ships per Ship Plan. Audit-first protocol before any code lands. Full role definition: [ENGINEER.md](./ENGINEER.md).

#### 3. Critic
Adversarial reviewer. 12 rejection criteria. Bounces failing work back to Orchestrator or Engineer. Full role definition: [CRITIC.md](./CRITIC.md).

### Parallel authorities (collaborative, healthy challenge)

#### 4. Flow Documenter
Maintains living flow visualization at `docs/flows/`. Single-page HTML + JSON driving clickable architectural diagrams. Updates on every ship that changes a flow. Critic verifies accuracy at end-of-wave bug scan. Full role definition: [FLOW_DOCUMENTATION.md](./FLOW_DOCUMENTATION.md).

#### 5. UI Polisher
Manual intervention only. The Claude Design conversation that produced CLUBHOUSE_SPEC.md and wave-2a-ratification.md during Wave 2A. Called when orchestration team identifies a UX gap they cannot resolve. Founder approval not required to call (saves Founder prompts), but called sparingly. Design output is authoritative per Q32 Lock 2.

#### 6. End User
Adversarial member testing. Spawns sub-agents at varying golfer skill levels (beginner, mid-handicap, scratch, lone wolf, league commissioner). Full sub-agent test sweep per ship — every ship gets all 5 skill-level sub-agents exercising relevant flows. Findings feed Critic review + retrospective + lessons-learned. Full role definition: [END_USER_TESTING.md](./END_USER_TESTING.md).

#### 7. Performance/Load Testing
Activates at Wave 2 entry. Stress-tests the system at scale. Per-ship performance budget verification + per-wave-gate load simulation with 50 concurrent simulated members. Catches listener thrash, Firestore read budget violations, cross-platform sync issues that only surface under load. Full role definition: [PERFORMANCE_TESTING.md](./PERFORMANCE_TESTING.md).

#### 8. Security/Auditor
Activates at Launch Phase A start. Adversarial security probing — auth bypass attempts, authorization bypass, rule misconfiguration detection, injection vector scanning, payment surface auditing. Default behavior favors Security Auditor over Critic when findings conflict (security failures are uniquely consequential). Full role definition: [SECURITY_AUDITOR.md](./SECURITY_AUDITOR.md).

#### 9. Data Integrity
Activates at Wave 2 entry. Reconciles database against source-of-truth invariants. Cross-platform write reconciliation (HQ ↔ Mobile per W1.S4), Parcoin economy integrity (escrow balance reconciliation), relationship bidirectionality, schema validation, daily continuous monitoring at Wave 3 onwards. Full role definition: [DATA_INTEGRITY.md](./DATA_INTEGRITY.md).

### Decision bubble agents (fire only during bubbles)

These four agents activate exclusively during decision bubbles per [DECISION_BUBBLE_AGENTS.md](./DECISION_BUBBLE_AGENTS.md). They do not run on every ship — they fire only when a decision bubble opens. Costs scale with bubble frequency, not ship frequency.

#### 10. Devil's Advocate
Adversarial role; argues strongest opposing case against emerging consensus. Fires when preliminary tally in a bubble reaches 4+ votes in one direction. Forces voting agents to either strengthen reasoning or change vote. No vote of its own.

#### 11. Historical Pattern (Hindsight)
Reads INFERRED_DECISIONS.md, SESSION_JOURNAL.md, archived bubbles; surfaces relevant patterns to current decision. Auto-runs at every bubble opening before voting starts. Institutional memory function — system gets smarter as bubble history accumulates.

#### 12. Future Self
Projects forward — if Option A wins, what does the codebase look like 5 ships from now, at wave close, at Launch? Called by Orchestrator when decision has long-term architectural implications. No auto-fire (overhead vs ROI trade-off).

#### 13. Plain English Translator
Produces Founder-readable summary of bubble debate at bubble close. Strips agent jargon, surfaces actual trade-offs and learnings. This is the agent that makes bubble retrospective review actually useful to Founder.

### Specialist agents (scheduled or specialized scope)

#### 14. Bug Triage Listener
Daily 12am scheduled scan of new bug reports submitted via W1.I1 member bug reporting surface. Categorizes, severity-tags, pattern-matches against prior reports, attempts auto-repair within strict scope (P3 cosmetic, typos, ARIA, console warnings, P2 known-pattern fixes). Routes remaining to orchestration team or backlog. Activates after W1.I1 ships. Full role definition: [BUG_TRIAGE_LISTENER.md](./BUG_TRIAGE_LISTENER.md).

## Authority structure

```
                    FOUNDER
                       │
                       ▼
              ┌─── ORCHESTRATOR ───┐
              │                    │
              ▼                    ▼
          ENGINEER             CRITIC
              │                    │
              └────── ships ───────┘
                       │
                       │ (parallel collaboration)
                       │
   ┌────────────┬──────┼──────┬──────────────┬──────────────┐
   │            │      │      │              │              │
   ▼            ▼      │      ▼              ▼              ▼
FLOW DOC   UI POLISH   │   END USER     PERF/LOAD      SECURITY
                       │     │            (Wave 2+)    (Phase A+)
                       │     ▼
                       │   sub-agents
                       │   (5 profiles)
                       ▼
                  DATA INTEGRITY
                  (Wave 2+; daily monitor Wave 3+)
```

**Active at Phase 1 commit:** Orchestrator + Engineer + Critic + Flow Documenter + UI Polisher + End User + Devil's Advocate + Historical Pattern + Future Self + Plain English Translator (10 agents; last 4 fire only during decision bubbles)
**Activates after W1.I1 ships:** Bug Triage Listener (11 agents total)
**Activates at Wave 2 entry:** Performance/Load Testing + Data Integrity (13 agents total)
**Activates at Launch Phase A start:** Security/Auditor (14 agents total)

## Collaborative challenge protocol

Parallel authorities are expected to challenge core orchestration when their jurisdiction surfaces an issue. Healthy challenge norms:

- **Concrete observations, not feelings.** "Flow doc shows package X writing to package Y without an audit hook; suggest reading the new Schema Mutation Alarm hook." Not "this feels coupled."
- **Specific files or commits.** "End User mid-handicap sub-agent encountered a confusing affordance at members.js:842." Not "members page is confusing."
- **Propose, not impose.** Parallel authority proposes; core orchestration evaluates; Founder rules on disagreement at retrospective.
- **No blame, no defense.** Diagnostic before defense per memory #27 carries here.

Parallel authority findings logged to:
- Flow Documenter: `docs/flows/flows.json` + commit messages flagging discoveries
- UI Polisher: `docs/agents/lessons-learned/UI_POLISHER_<DATE>.md` per session
- End User: `docs/agents/lessons-learned/END_USER_<SHIP_ID>.md` per ship test sweep

## Disputes between agents

When core orchestration and parallel authority disagree:

1. Both parties write a one-paragraph summary of their position
2. Both commit to `docs/agents/lessons-learned/AGENT_DISPUTE_<SHIP_ID>.md`
3. Founder reviews at next retrospective
4. Founder rules; ruling captured to ship report + INFERRED_DECISIONS.md

Disputes are signal, not noise. A dispute means the orchestration system caught a real ambiguity worth Founder attention.

## Token + time cost awareness

The 6-agent network is more expensive than the 3-agent core in tokens and execution time. Per Founder direction at lock: cost is acceptable trade-off for quality + coverage. End User full sub-agent sweep (5 profiles) per ship is the most expensive operation; if cost becomes prohibitive, the orchestration team flags to Founder for re-evaluation.

The trade-off:
- 3-agent core: cheap, fast, can miss architectural drift + UX problems + member-perspective issues
- 6-agent network: more expensive, slower per ship, but catches what 3-agent misses

Per the locked Cost Halt + Scalability mandate: if 6-agent network token cost exceeds budget at scale, comparison matrix evaluates whether parallel authorities can sample (e.g., End User runs full sweep at wave gate only, lighter per-ship). Not relevant at current founding-20 scale; revisit at Launch Phase A.

## What this does NOT add

- Not a new approval layer on top of existing CFR + Sanity Halt + Founder permanent-approval categories
- Not a replacement for Critic — Critic still owns the 12 rejection criteria
- Not a way to bypass governance — parallel authorities follow same protocols as core
- Not Founder substitutes — Founder authority remains permanent for CFR, Sanity Halt, Vision, Roadmap, cost-incurring, wave gates, P0/P1 rollback

## Initial activation

At Phase 1 commit, only core orchestration (Orchestrator + Engineer + Critic) is active. Parallel authorities activate at Wave 1 first-ship (W1.I4 or whatever fires first):

- **Flow Documenter activates at Ship 5+8** — first ship under new orchestration. Initial flows.json bootstrapped from existing codebase audit at that time.
- **UI Polisher** — already exists conceptually as the Claude Design conversation. No activation needed; called when first needed.
- **End User activates at Ship 5+8** — sub-agent profiles defined in END_USER_TESTING.md ship with that ship.

## Audit cadence

Agent network reviewed at:
- Every wave close (does the network composition still serve?)
- Build → Launch transition (Launch governance may modify parallel authority cadence)
- Any agent dispute that recurs (pattern emerging warrants governance update)

Founder may add or remove agents at any time. Roadmap-level decision; treated as Roadmap structure change per CTO_INTERFACE.md.
