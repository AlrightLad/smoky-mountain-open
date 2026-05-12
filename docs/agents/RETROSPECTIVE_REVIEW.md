# Retrospective Review

Post-ship and post-wave review process. The structured moment for Founder + orchestration team to learn from what just happened and adjust forward.

## When retrospectives happen

### Per ship
After every shipped ship, before status advances to Closed.

### Per wave
After all wave ships shipped, before wave gate ratification.

### Ad hoc
After any Sanity Halt resolution, rollback, or significant inferred-decision divergence.

---

## Per-ship retrospective structure

### 1. Status check

Orchestrator confirms:
- All Ship Plan acceptance criteria met
- Critic approved
- Caddy Notes entry published
- Version triple bump applied
- Smoke green
- Production deploy verified (if applicable)

If anything incomplete, retrospective pauses until resolved.

### 2. Inferred decision review

Orchestrator walks Founder through inferred decisions made during ship:

For each entry in the ship's Inferred Decisions section + INFERRED_DECISIONS.md:
- **Decision** — what was inferred
- **Tier** — graduated autonomy tier (T1, T2, T3)
- **Rationale** — which prior Founder-pattern this matched
- **Founder ruling:**
  - **Ratify** — inference becomes ratified decision; INFERRED marker removed; pattern reinforced for future
  - **Reverse** — inference reverted; correct in next ship; pattern recognition adjusts
  - **Defer** — keep marker; revisit at next retrospective

### 3. What went well

- Concrete observations only
- Capture specifics (file paths, decision points, smoke coverage)
- Pattern recognition for skill or hook proposals

### 4. What didn't

- Concrete observations only
- Capture specifics
- Identify root cause (technical, process, decision)
- No blame; focus on systemic improvement

### 5. Lessons to capture

For each lesson:
- **What happened** — concrete observation
- **Why it happened** — root cause
- **What we'll do differently** — concrete change to skill, hook, protocol, or governance doc

Lessons are committed to:
- `docs/agents/lessons-learned/SHIP_<ID>_LESSONS.md` if ship-specific
- `docs/agents/lessons-learned/WAVE_N_LESSONS.md` at wave close (aggregated)

### 6. Skill or hook proposals

If ship surfaced a pattern that warrants automation:
- Orchestrator drafts proposal to `docs/agents/proposed-skills/`
- Founder reviews; ratifies for promotion to `.claude/skills/` or rejects
- Approved skills require `SKILL_APPROVAL.md` token per hook 5

### 7. Backlog updates

- Items added during ship → confirm severity tag
- Items resolved during ship → move to `backlog/closed/`
- Items deferred or rescoped → update INDEX.md

### 8. Graduated autonomy progression

Orchestrator presents decision-match accuracy:
- Recent ships: how many decisions matched Founder ratification?
- Tier eligibility: any category eligible for graduation?
- Founder ratifies graduation or defers

### 9. Next ship implications

- What does this ship teach about the next ship?
- Should next ship's Vision change?
- Should next ship's Ship Plan template differ?

### 10. Status advance

After all 9 items complete, ship status advances from Shipped to Closed. Ship file moves from `docs/agents/ships/` to `docs/agents/ship-reports/`.

---

## Per-wave retrospective structure

### 1. Wave gate verification

Orchestrator confirms all wave gate criteria met per ROADMAP.md. If any gate criterion not met, retrospective pauses or specific criterion is explicitly waived by Founder with documented rationale.

### 2. Aggregate inferred decision review

All inferred decisions from the wave's ships, reviewed in batch:
- Trends in inference type
- Categories that consistently matched (graduation candidates)
- Categories that consistently reversed (pattern recognition needs adjustment)

### 3. Lessons aggregation

Per-ship lessons aggregated into `docs/agents/lessons-learned/WAVE_N_LESSONS.md`. Themes identified:
- Process improvements
- Skill / hook proposals
- Governance doc adjustments
- Roadmap implications

### 4. Backlog reconciliation

- Items added during wave
- Items resolved during wave
- Items rescoped or deferred
- Items that should reshape next wave's plan

### 5. Inter-wave activities

Per INTER_WAVE_PROTOCOL.md, wave-specific transition activities executed:

- **Wave 1 → 2:** Design bot per-page mock generation for HQ, file packages prepared
- **Wave 2 → 3:** Wave 2 staged content production deploy (redesign reveal), mobile design system handoff, Apple Developer Account activation planning
- **Wave 3 → 4:** TestFlight enrollment of founding 20, identity architecture pre-work, founder-led migration communication
- **Wave 4 → Build complete:** Final migration confirmation, legacy cleanup verification, Build Roadmap close ratification

### 6. Caddy Notes wave-cadence update

Roadmap section of Caddy Notes updated at wave transition. Orchestrator drafts; publishes universal content for all members. No audience differentiation.

### 7. Graduated autonomy wave review

Cumulative tier accuracy over the wave. Founder ratifies category graduations or defers. Updated tier table reflects current autonomy state going into next wave.

### 8. Next wave Vision authoring

Founder authors Wave N+1 Visions for all ships in single focused sitting. Orchestrator then drafts Ship Plans per Vision; ships fire in order.

### 9. Wave gate ratification

Founder explicit ratification: "Wave N closed, Wave N+1 fires."

---

## Ad hoc retrospectives

### Sanity Halt resolution retrospective

After P3 resolution executed:
1. What triggered the Sanity Halt
2. Was detection timely?
3. Did resolution path work?
4. Pattern emerging? Capture to lessons-learned.
5. Skill or hook proposal to catch earlier next time?

### Rollback retrospective

After P5 rollback executed:
1. What failed in production
2. Did smoke catch it? If not, why not?
3. Did the rollback go smoothly?
4. Pattern emerging? Capture lessons.
5. Should Ship Plan template change to prevent this category?

### Inferred decision reversal retrospective

After Founder reverses an inferred decision:
1. What was the inference
2. What pattern did the Orchestrator/Engineer think it matched
3. Why was it wrong
4. Pattern recognition adjustment: how does the team learn from this?

---

## What retrospectives are NOT

- Blame sessions
- Status reports (those happen continuously, not at retrospective)
- Re-litigation of decisions that have been ratified
- Founder feedback on agent personality

## Retrospective discipline

- Orchestrator runs the retrospective; Founder rules
- Concrete observations only — "smoke failed on chromium at hole 5" not "smoke was problematic"
- Lessons must be actionable — "add SKILL.md for round-state-machine validation" not "be more careful"
- No retrospective ends without at least one captured lesson if anything didn't go perfectly
- Status advance gates on retrospective completion

## Where lessons live

- Per-ship lessons → `lessons-learned/SHIP_<ID>_LESSONS.md` (if ship-specific)
- Per-wave lessons → `lessons-learned/WAVE_N_LESSONS.md` (aggregated)
- Cross-wave patterns → may warrant skill commit to `.claude/skills/` or hook addition to `.claude/settings.json`
- Architectural patterns → may warrant governance doc update in `docs/agents/`
