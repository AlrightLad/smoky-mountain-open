---
name: parbaughs-ship-planner
description: Orchestrator's Ship Plan drafting flow. Use SHIP_PLAN_TEMPLATE.md verbatim, fill every section, leave Vision blank for Founder. CFR + Sanity Halt audit BEFORE Critic review, not after.
trigger: New ship opens; Vision authored or pending; engineering work not yet begun
owner: Orchestrator
tier: T1 (skill content drafted at Phase 1)
---

# Skill: parbaughs-ship-planner

Encodes the Orchestrator workflow for drafting a Ship Plan that survives Critic review.

## When to invoke

- A new ship opens (next per ROADMAP.md sequence, or a rollback ship under P5)
- Founder has authored Vision (or is about to; you can draft against placeholder)
- Engineering work has NOT yet begun

## When NOT to invoke

- Mid-implementation (the plan is locked; deviations log as inferred decisions per P6)
- Retrospective work (different skill — RETROSPECTIVE_REVIEW.md)
- Rollback urgency P0 (use streamlined template + Founder synchronous)

## Procedure

1. **Create the file.** Path: `docs/agents/ships/<ship-id>.md`. ID format: `W<wave>.S<num>` (design ships) / `W<wave>.I<num>` (infra ships) / `M<num>` (Wave 3 mobile) / `I<num>` (Wave 4 identity) / `AS<num>` (Phase B app store).

2. **Copy template verbatim.** From `docs/agents/SHIP_PLAN_TEMPLATE.md`. Don't omit sections. Don't reorder.

3. **Leave Vision blank.** Put a single line: `<Vision — Founder authors before engineering begins>`. Do NOT pre-fill Vision with your guess; that violates "Vision = Founder permanent authority" per CTO_INTERFACE.md.

4. **Fill every other section with concrete content:**
   - **Scope** — bullet specifics + cross-surface dependencies. Cite the 30-file member-data fanout pattern (or whatever the actual fanout is per audit) where relevant.
   - **Prerequisites** — prior ships merged, design spec section IDs, external dependencies (Apple Developer, etc.).
   - **Architecture** — files touched (path: purpose), Firestore reads/writes via `leagueQuery`/`leagueDoc` (or `db.collection()` for global), required composite indexes.
   - **Scalability Architecture** — free-tier-first justification, 10x scaling plan (20 → 200 → 2000), cost projection. Q44 Lock 3 mandatory.
   - **CFR triggers** — table; cite category. State "No Critical Feature Registry triggers identified" if none.
   - **Sanity Halt risk areas** — table; cite category. State "No Sanity Halt risk areas identified" if none.
   - **Implementation plan** — phases, not "build the feature".
   - **Acceptance criteria** — concrete; "Avg score renders as Birdie token color when avg < 72" not "page looks good".
   - **Caddy Notes entry** — draft now, not retrofitted at ship close. Member-facing copy; no internal jargon.

5. **CFR + Sanity Halt audit BEFORE handoff to Critic.** Walk both lists. Surface every trigger explicitly. Critic's brief review is faster when the audit is in the Ship Plan, not extracted from it.

6. **Inferred Decisions section.** Start empty. Engineer + Orchestrator append entries as inferences fire.

7. **Status: Drafting.** When Vision lands, advance to Ratified (or escalate if Vision contradicts plan).

## Anti-patterns

- Pre-filling Vision because "I know what Founder wants" — Vision is permanent Founder authority
- "Acceptance criteria: ship looks polished" — that's not measurable. Use concrete state + token + selector.
- Skipping Scalability section because "ship is cheap" — every ship gets the section (state "no cost impact" explicitly if so)
- Phase 1 "build the feature" — phases should be testable, separable units of work

## References

- `docs/agents/SHIP_PLAN_TEMPLATE.md` (canonical)
- `docs/agents/ORCHESTRATOR.md` "Per ship"
- `docs/agents/CRITICAL_FEATURE_REGISTRY.md` (audit against this)
- `docs/agents/SANITY_HALT.md` (audit against this)
- `docs/agents/PROTOCOLS.md` § P1, § P4 (cost halt)
