# CTO Interface

How Founder interacts with the agent network. The Founder is the CTO; this document defines what Founder owns, what Founder hands off, and how interactions flow.

The orchestration network consists of three core agents (Orchestrator + Engineer + Critic, hierarchical) plus parallel authorities that activate at different milestones:
- **Phase 1 active:** Flow Documenter + UI Polisher + End User (6 agents total)
- **Wave 2 entry adds:** Performance/Load Testing + Data Integrity (8 agents total)
- **Launch Phase A adds:** Security/Auditor (9 agents total)

See [AGENT_NETWORK.md](./AGENT_NETWORK.md) for full structure.

## Founder authority — permanent

These decisions never graduate to agent autonomy. They are Founder-only forever:

- **Vision authoring** — every ship's Vision section is Founder-authored before agent work begins
- **Critical Feature Registry triggers** — all 11 categories require Founder approval
- **Sanity Halt severity calls** — all 9 categories require Founder ratification
- **Roadmap structure changes** — Founder edits ROADMAP.md; agents acknowledge
- **Cost-incurring architecture** — per refined cost-halt thresholds in HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md
- **Wave-to-wave gate ratifications** — Founder ratifies wave gates
- **P0/P1 production rollback decisions** — Founder synchronous presence required for P0 (production down / data loss) and P1 (significant member impact). P2/P3 corrective autonomous, ratified at retrospective.

**Push graduates** (not on permanent-Founder-approval list). Autonomous push authorized when smoke + lint + visual verification all green. See "Autonomous push protocol" below.

## What is NOT escalated to Founder

Per HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md, the following decisions are explicitly outside Founder escalation territory. Agents handle these via decision bubble (collaborative vote) or inferred decision (within graduated autonomy tier):

- **Operational decisions within current Tier** — skill modifications, hook adjustments, ship plan phase breakdowns, Caddy Notes copy, backlog severity tagging
- **Implementation choices** — file paths, naming, code style, test organization, helper extraction, smoke spec organization
- **Free-tier dependencies and tools** — NPM dependencies, free third-party APIs within free tier, free Firebase services within Blaze free quota, Playwright browsers
- **Internal coordination** — inter-agent disputes within graduated autonomy, decision bubble opening/closing, retrospective preparation, skill performance review
- **Backlog and lessons-learned activities** — adding/closing backlog items, capturing lessons, updating SESSION_JOURNAL.md, INFERRED_DECISIONS.md, DEVELOPMENT_GRADE_LOG.md

If a decision is ambiguous about whether to escalate, agents run the 5-question pre-halt self-check before bringing to Founder. Most ambiguous decisions resolve via decision bubble.

## Decision bubble protocol — Founder perspective

When agents open a decision bubble (collaborative vote on an ambiguous decision):

- Founder is NOT pinged in real-time
- The bubble file at `docs/agents/decision-bubbles/` documents the vote
- Founder reviews at next retrospective
- Founder ratifies or reverses the executed decision
- Reversal patterns adjust pattern recognition for future bubbles

This is the explicit anti-halt mechanism. Agents collaborate among themselves; Founder reviews aggregated outcomes; bandwidth scales.

## Founder authority — graduates per Tier system

Per GRADUATED_AUTONOMY.md, decisions graduate from Founder approval to agent autonomy as decision-match accuracy is proven:

- **Tier 1** (10 ships @ 95% match): skill triggering false-positive fixes, skill content drafting, backlog severity tagging, phase report formatting, member-relevance classification for Caddy Notes
- **Tier 2** (20 ships @ 95% match): skill modifications, hook false-positive adjustments, ship plan phase-breakdown decisions, member-facing Caddy Notes copy, member-facing roadmap section drafting
- **Tier 3** (30 ships @ 95% match): hook scope additions, new skill drafting + commit, Engineer-Critic dispute resolution, ship plan CTO Ruling decisions for non-CFR items

## How Founder interacts with each agent

### With Orchestrator

The Orchestrator is the primary Founder interface. All cross-team coordination flows through Orchestrator.

**Founder provides:**
- Vision sections for ships
- Ratifications of Ship Plans
- Resolutions for escalations
- Roadmap edits
- Retrospective review feedback

**Orchestrator provides:**
- Ship Plans for Vision authoring + ratification
- Status updates on active ships
- Escalations per protocols
- Retrospective review prep
- Caddy Notes drafts (Orchestrator publishes universal content without approval; Founder reviews at retrospective if desired)

### With Engineer

Founder generally does NOT interact with Engineer directly. Engineer routes through Orchestrator.

**Exceptions:**
- Founder synchronous presence required for Critical Feature Registry trigger ships (e.g., onboarding rewrite, identity architecture)
- Founder synchronous presence required for rollback ships
- Founder synchronous presence required for Launch Phase ships
- Founder may inspect Engineer's diff before merge if desired (but does not edit)

### With Critic

Founder generally does NOT interact with Critic directly. Critic routes through Orchestrator.

**Exceptions:**
- Sanity Halt conditions escalated by Critic come directly to Founder
- CFR triggers identified by Critic escalate to Founder via Orchestrator
- Critic-Engineer disputes outside graduated autonomy tier escalate to Founder

### With Flow Documenter

Founder rarely interacts directly. Flow Documenter is a parallel authority that maintains `docs/flows/` and surfaces architectural findings at retrospective. Founder reviews findings; ratifies any skill/hook amendments proposed.

**Founder action triggers:**
- Flow Documenter discovers coupling that Ship Plan template should catch — Founder rules on template amendment
- Flow Documenter disputes core orchestration finding — Founder rules at retrospective

### With UI Polisher

UI Polisher = the Claude Design conversation. Manual intervention only. Founder is the human in the loop for this agent specifically; Founder participates in the design conversation when it's called.

**Founder action triggers:**
- Orchestration team identifies UX gap requiring UI Polisher — Founder participates in the design session
- Design output requires Founder ratification before implementation (per Q31b 1:1 fidelity confirmation lock)

### With End User

Founder reviews End User findings at retrospective; does not direct sub-agent testing in real-time.

**Founder action triggers:**
- End User-Critic dispute over whether ship friction is acceptable — Founder rules
- Sub-agent profile drift surfaces (real members behave differently than profile assumed) — Founder approves profile refinement
- End User finds member-trust issue Critic missed — Founder rules on severity

### With Performance/Load Testing (Wave 2 entry onwards)

Founder reviews performance findings at retrospective. Performance Agent autonomously blocks push when critical failures detected.

**Founder action triggers:**
- Performance Agent finding requires tooling investment (load runner, custom instrumentation) — Founder ratifies cost-incurring infrastructure per CFR category 11
- Performance Agent dispute with Critic over whether budget violation blocks ship — Founder rules
- Sustained budget violations across multiple ships — Founder reviews architectural implications

### With Security/Auditor (Launch Phase A onwards)

Founder reviews security findings at retrospective. Security Auditor autonomously blocks push when critical or high failures detected; default behavior favors security finding over Critic.

**Founder action triggers:**
- Security risk acceptance — Founder may explicitly accept documented risk, captured to `lessons-learned/SECURITY_RISK_ACCEPTED_<SHIP_ID>.md`
- External security review recommendation — Security Auditor recommends; Founder decides
- Compliance-affecting finding (PCI, GDPR, CCPA) — Founder rules per CFR category 10
- Tooling investment for security testing — Founder ratifies

### With Data Integrity (Wave 2 entry onwards)

Founder reviews integrity findings at retrospective. Data Integrity Agent autonomously blocks push when critical failures detected (data corruption, escrow imbalance, member document corruption).

**Founder action triggers:**
- Schema migration plan ratification — Founder approves migration path before execution
- Daily continuous monitoring escalation (Wave 3 onwards) — critical drift surfaced via Cloud Function alerts requires Founder ruling
- Cross-platform sync invariant violation — Founder rules on architectural response
- Tooling investment for integrity validators — Founder ratifies per CFR category 5

## Founder communication style

The agents have a defined communication protocol with Founder:

- Direct, specific, no hedging
- Pushback explicitly welcomed when Founder's strategic thinking has gaps
- High-candor framing preferred over validation
- Skip preamble ("Great question") and postamble ("Let me know if you need anything else")
- Don't restate Founder's question before answering
- Acknowledge corrections briefly; do not over-apologize
- Execute work as assigned; do not flag fatigue, suggest stopping, or recommend breaks
- Accept Founder timeline estimates as given; do not push back on timelines
- Flag only genuine technical blockers (production risk, breaking changes, security issues)

## Founder workflow

### Daily

Founder direction:
- Open Claude Code in repo
- Read overnight ship reports if any
- Direct Orchestrator on next ship or backlog item
- Ratify or red-line as agents surface decisions
- Push completed ships when ready (push is Founder-only)

### Per ship

1. Founder authors Vision section for next ship
2. Orchestrator drafts Ship Plan against Vision
3. Founder ratifies Ship Plan
4. Engineering work proceeds
5. Founder available for escalations per protocols
6. Critic approves implementation
7. Founder reviews + ratifies final ship before close
8. Founder pushes to remote
9. Retrospective with Orchestrator
10. Inferred decisions ratified or reversed

### Per wave

1. Founder authors Wave 1-style Visions for all wave ships in single focused sitting
2. Orchestrator drafts Ship Plans per Vision
3. Ships fire in order
4. At wave gate: Founder reviews gate criteria; agents verify
5. Founder ratifies wave close
6. Inter-wave protocol activities per INTER_WAVE_PROTOCOL.md
7. Founder ratifies wave open for next wave

## Graduated autonomy tracking

The Orchestrator tracks decision-match accuracy automatically:

- Every Orchestrator recommendation logged to INFERRED_DECISIONS.md at retrospective
- Founder rules (ratify or reverse) logged against each
- Match accuracy computed per decision category
- When accuracy threshold met, category graduates to next tier
- Founder is notified at retrospective when a category becomes eligible for graduation
- Founder can defer graduation, accept it, or reverse a prior graduation

## Founder push discipline

Per locked decision: push is Founder-only. The PreToolUse hook in `.claude/settings.json` blocks `git push` for agents.

Founder push checklist:
1. Ship Plan ratified, Critic approved, status Shipped
2. Caddy Notes entry published (or staged for publication)
3. Version triple bump verified (utils.js APP_VERSION + package.json + sw.js CACHE_NAME)
4. Smoke green on staging or local
5. Push to main
6. Verify production deploy succeeded via GitHub Pages
7. Verify smoke green on production
8. Ship status advances to Closed; file moves to `docs/agents/ship-reports/`

## What Founder does NOT do

- Does not write Ship Plan body sections (only Vision)
- Does not modify governance files in `docs/agents/` (these are committed; if needed, edit via standard Git workflow)
- Does not write file contents at the orchestration team's direction (agents do file work)
- Does not act as Engineer or Critic
- Does not micro-manage ship implementation

## Single-machine constraint

Founder runs from desktop. Phone for remote-control monitoring of active agent sessions. Work/weekend boundary established by physical machine boundary.

## Apple Developer Program

Founder workstream. Not agent-blocking. M6 TestFlight build depends on it. Founder enrolls at developer.apple.com when ready; $99/year.

## Memory architecture

Founder benefits from hybrid memory:

- **Persistent state in `docs/agents/`** — Founder reads or edits via Git workflow
- **In-conversation memory** — Claude.ai chat retains short-term context within a conversation
- **Cross-conversation memory** — Claude.ai memories carry across conversations

Persistent governance lives in this directory. Session-internal context lives in chat. Long-term memory carries Founder context across all Claude.ai conversations.
