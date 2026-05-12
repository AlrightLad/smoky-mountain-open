# CTO Interface

How Founder interacts with the three-agent orchestration team. The Founder is the CTO; this document defines what Founder owns, what Founder hands off, and how interactions flow.

## Founder authority — permanent

These decisions never graduate to agent autonomy. They are Founder-only forever:

- **Vision authoring** — every ship's Vision section is Founder-authored before agent work begins
- **Critical Feature Registry triggers** — all 11 categories require Founder approval
- **Sanity Halt severity calls** — all 9 categories require Founder ratification
- **Roadmap structure changes** — Founder edits ROADMAP.md; agents acknowledge
- **Cost-incurring architecture** — per Q44 Lock 3
- **Wave-to-wave gate ratifications** — Founder ratifies wave gates
- **P0/P1 production rollback decisions** — Founder synchronous presence required for severity P0 (production down / data loss) and P1 (significant member impact). P2/P3 corrective work autonomous, ratified at retrospective.

**Push graduates** (not on permanent-Founder-approval list). Autonomous push authorized when smoke + lint + visual verification all green. See "Autonomous push protocol" below.

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
3. Founder ratifies Ship Plan (or agents proceed under Tier 1 ratification authority for non-CFR items)
4. Engineering work proceeds
5. Founder available for escalations on permanent-approval categories only
6. Critic approves implementation (including visual verification screenshots)
7. Autonomous push fires if smoke + lint + visual all green (Founder reviews via committed artifacts at retrospective)
8. Caddy Notes published by Orchestrator
9. Retrospective with Orchestrator — Founder reviews inferred decisions log + push artifacts
10. Inferred decisions ratified, reversed, or deferred

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

## Autonomous push protocol

Push is no longer permanent-Founder-only. Per Correction 1 (Phase 1 commit):

**Push is authorized autonomously when all of these are green:**
1. Smoke tests pass (cross-browser P8 coverage on chromium + firefox + webkit + msedge)
2. Lint tests pass (`npm run lint`)
3. Visual screenshot verification passes (per state per page per browser — see P8 expanded)
4. Critic approval recorded
5. Ship Plan acceptance criteria met
6. Version triple bump applied (utils.js APP_VERSION + package.json + sw.js CACHE_NAME)
7. Caddy Notes entry drafted

The PreToolUse "push protection" hook in `.claude/settings.json` enforces this: `git push` blocks only when smoke, lint, or visual verification has failed (last-run state checked via `.claude/state/last-verify.json`).

**Founder push override** remains available — Founder may push manually at any time, regardless of agent state. The override is not removed; it's no longer the default.

**Founder push checklist** (when Founder overrides or pushes manually):
1. Ship Plan ratified, Critic approved, status Shipped
2. Caddy Notes entry published
3. Version triple bump verified
4. Smoke green on staging or local
5. Push to main
6. Verify production deploy succeeded via GitHub Pages
7. Verify smoke green on production
8. Ship status advances to Closed; file moves to `docs/agents/ship-reports/`

**Autonomous push checklist** (Engineer/Orchestrator pushes after green-on-all-three):
1-3. As above
4. Visual verification artifacts (Playwright screenshots) committed to `tests/visual-verify/<ship-id>/`
5-8. As above

Production rollback after autonomous push: P0/P1 severities escalate to Founder synchronous; P2/P3 corrective stays autonomous (per P5 revised).

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
