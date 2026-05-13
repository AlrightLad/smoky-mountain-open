# Vision Authoring Protocol

How Founder authors Vision sections for ships. Vision is permanent-Founder-approval territory per GRADUATED_AUTONOMY.md — never graduates regardless of tier. This document codifies the authoring process.

## What a Vision is

Vision is the intent statement for a ship. It answers:

1. **What is the goal of this ship in plain English?**
2. **What does success look like for members?** (or "infrastructure, not member-facing" for infra ships)
3. **Why is this worth doing now?**

Vision is NOT scope, not architecture, not implementation plan, not acceptance criteria. Those sections of the Ship Plan are agent-authored. Vision is the "why" that anchors every other section.

## Format

**Freeform 3-8 sentences.** No required structure beyond the three core questions being answered somewhere in the text.

Visions can be longer when the ship is high-stakes or has nuance that the agents need to understand. Visions can be shorter (3-4 sentences) when the ship is straightforward.

Visions are written in Founder voice. Conversational. Direct. No corporate hedging. No "we are pleased to announce" language.

## When Visions get authored

**Batch authoring at session start.** Per Q29 lock + locked Vision authoring session 2026-05-12: Founder authors Visions for all wave ships in single focused sittings. The full Build Roadmap is authored before Phase 1 ship execution begins.

This unlocks autonomous run windows — agents can fire ships sequentially without halting at Vision gates. Founder still reviews ship-by-ship at retrospective, but the synchronous Vision-authoring bottleneck per ship is gone.

**Mid-stream amendment.** Founder can amend any Vision at any time. Orchestrator re-reads the Vision before next phase boundary of that ship and captures the revision in the ship report.

**New ships discovered mid-roadmap.** If a new ship is identified during execution (e.g., interrupt sprint, P0/P1 corrective, new feature surfaced), Founder authors Vision before that ship fires. No "Vision required" gate is ever skipped.

## Authoring with Claude.ai

The Vision Authoring Session pattern:

1. Founder opens a Claude.ai conversation specifically for Vision authoring
2. Claude.ai prompts Founder with structured questions per ship (3 questions: goal / member experience / why now)
3. Founder answers in short fragments, bullets, or natural language
4. Claude.ai synthesizes Vision in Founder voice
5. Founder ratifies, red-lines, or rewrites
6. Vision committed to Ship Plan file at `docs/agents/ships/<ship-id>.md` line 11 (Vision section)

Claude.ai serves as the Vision authoring assistant — prompting, drafting, refining. Founder is the authority on intent; Claude.ai is scribe + structurer.

## Question structure per ship

The three core questions:

1. **Goal:** "What does this ship deliver? In plain English, what's done when this ship closes?"
2. **Member experience:** "What does success look like to members? What do they feel, see, or do differently after this ships? (Or: is this purely infrastructure that members don't see directly?)"
3. **Why now:** "Why is this the right moment for this ship in the roadmap? What goes wrong if we ship anything else before this?"

For ships with specific decisions baked into the Vision (e.g., "which staging approach"), a 4th question surfaces that decision.

## Vision examples

### Example 1 — Infrastructure ship (W1.S1 Design system codification)

> Wave 1 cannot succeed without a design system that actually works. This ship turns the Pass 2 design system foundation into living CSS variables, component classes, and JS helpers that every subsequent Wave 1 ship consumes by name. Every button works. Every state renders. Every token resolves. The Engineer and Critic confirm functionality via Playwright screenshots showing the system behaves as specified across all four browsers — not just lint output. Token burn and effort are not constraints; correctness and zero rework are. Massive cleanup is in scope if it serves the Vision. After this ship lands, every Wave 1 design ship cites this system by name; raw hex/px/ms values in any subsequent ship are rejection-grade. Members don't see this ship directly — they see it in every ship that follows.

(Captures: infrastructure framing, success criteria, scope authority for cleanup, member experience answer for infra-only ship.)

### Example 2 — Member-facing ship template

> [Ship name] delivers [specific member capability]. After this ship, members can [concrete action they couldn't do before, or do better than before]. Success looks like [observable member behavior or outcome]. This ship matters now because [roadmap dependency or member value reason]. Optional: any specific direction or constraint the orchestration team needs to know.

### Example 3 — Launch Phase ship template

> Phase [C/A/B] requires [specific deliverable]. This ship delivers [the deliverable] so that [Launch goal it serves]. Members [experience the change in this way]. This ship matters now because [Launch phase ordering reason]. Founder direction on [specific Founder decision baked into Vision].

## What Vision authoring does NOT include

- **Implementation specifics.** "Use Vite for build" doesn't belong in Vision.
- **Acceptance criteria.** "Smoke must pass on chromium" belongs in acceptance criteria, not Vision.
- **Architectural decisions.** "Use leagueQuery wrapper" belongs in Architecture section.
- **Caddy Notes content.** Caddy Notes are member-facing; Vision is agent-facing (authoring intent).
- **Cross-surface dependencies.** Per Criterion 12, those go in dedicated section.

## Vision quality checklist (Founder self-review)

Before committing a Vision, Founder asks:

- [ ] Three core questions answered?
- [ ] Freeform 3-8 sentences (not over-engineered structure)?
- [ ] Member-experience answered (or explicitly noted as infra)?
- [ ] Why-now answered (not just "because it's next on the roadmap")?
- [ ] Voice matches Founder, not corporate-template?
- [ ] No implementation specifics that constrain agent autonomy unnecessarily?
- [ ] Any specific decisions Founder is making baked in (cleanup scope, design direction, etc.)?

If any answer is no, refine before committing.

## Vision amendment process

Founder can amend any Vision at any time:

1. Edit the Vision section in `docs/agents/ships/<ship-id>.md`
2. Commit with message `vision: <ship-id> amended — <reason>`
3. Orchestrator detects amendment at next phase boundary of the ship
4. Orchestrator captures revision acknowledgment to active ship report
5. If amendment changes scope, Critic re-reviews Ship Plan against amended Vision

Amendment AFTER ship close: handled via lessons-learned, not Vision amendment. Closed ships don't get Vision revisions; future ships can carry corrections forward.

## Vision authoring session output

Each Vision authoring session produces:

1. **Per-ship Vision text** — committed to each Ship Plan file
2. **Session lessons-learned** — patterns observed during authoring (e.g., "Visions for infrastructure ships are harder to write because member-experience question is awkward")
3. **Protocol refinements** — if the session surfaces a pattern that this protocol doesn't capture, this document is amended

## Initial session

The 2026-05-12 Vision Authoring Session is the founding session. It produces Visions for all Build Roadmap ships (~37 ships across Waves 1-4). Launch Roadmap Visions authored at Build → Launch interlude per Q57 lock.

Per Founder direction at session start: app store accounts, LLC formation, and other external setup defer to Launch Phase B (final phase). Build Roadmap Vision authoring covers Wave 1 → Wave 4. Launch Phase A authoring happens after Founder defines monetization model during interlude.

## What this document is NOT

- Not a template that constrains Vision authoring. The freeform principle is intentional.
- Not a substitute for Founder authority. Visions remain Founder-only forever.
- Not a one-time setup. Future ships authored mid-roadmap follow this protocol.

## Audit cadence

This protocol reviewed:
- At every wave close (does the authoring approach still serve?)
- At Build → Launch transition (Launch governance may need different Vision style)
- When a Vision is reversed (was the authoring process the root cause?)
