# PARBAUGHS Orchestration Governance

This directory is the canonical source for how PARBAUGHS work happens under the three-agent orchestration system.

## What this is

PARBAUGHS is a social golf league platform. Founder is Zach Boogher. Build work is executed by a three-agent orchestration team (Orchestrator + Engineer + Critic) under Founder direction, with graduated autonomy that expands as agent decision-match accuracy is proven over ships.

This directory contains the governance artifacts that define:

- What the agents do and don't do
- What requires Founder approval and what graduates to agent autonomy
- How ships are planned, executed, reviewed, and closed
- What halts agent work and escalates to Founder
- How design, engineering, and product decisions flow through the system

## Authority

Founder authority is the source of truth on all decisions. This documentation is the written record of decisions Founder has ratified. When this documentation is ambiguous or contradicts itself, Founder rules.

Agents do NOT modify this directory without Founder approval. The PreToolUse hook at `.claude/settings.json` enforces this.

## Navigation

### Strategic foundation
- **[ROADMAP.md](./ROADMAP.md)** — 4-wave Build Roadmap + 3-phase Launch Roadmap, gates, governance summary
- **[INTER_WAVE_PROTOCOL.md](./INTER_WAVE_PROTOCOL.md)** — what happens between waves
- **[LAUNCH_GOVERNANCE.md](./LAUNCH_GOVERNANCE.md)** — modified governance for Launch Phase

### Agent roles
- **[ORCHESTRATOR.md](./ORCHESTRATOR.md)** — senior coordinator, owns plan, escalates to Founder
- **[ENGINEER.md](./ENGINEER.md)** — implements ships, audit-first protocol, self-audits
- **[CRITIC.md](./CRITIC.md)** — adversarial review, 12 rejection criteria
- **[CTO_INTERFACE.md](./CTO_INTERFACE.md)** — how Founder interacts with the orchestration team

### Governance frameworks
- **[CRITICAL_FEATURE_REGISTRY.md](./CRITICAL_FEATURE_REGISTRY.md)** — 11 categories requiring Founder escalation
- **[SANITY_HALT.md](./SANITY_HALT.md)** — 8 categories that halt agent work
- **[GRADUATED_AUTONOMY.md](./GRADUATED_AUTONOMY.md)** — 3-tier graduation of agent autonomy
- **[RETROSPECTIVE_REVIEW.md](./RETROSPECTIVE_REVIEW.md)** — post-ship and post-wave review process
- **[INFERRED_DECISIONS.md](./INFERRED_DECISIONS.md)** — audit log of agent-inferred decisions

### Ship execution
- **[SHIP_PLAN_TEMPLATE.md](./SHIP_PLAN_TEMPLATE.md)** — required structure for every ship plan
- **[PROTOCOLS.md](./PROTOCOLS.md)** — P1-P9 operational protocols
- **[ships/](./ships/)** — active ship plans (one file per active ship)
- **[ship-reports/](./ship-reports/)** — closed ship reports (one file per shipped ship)
- **[lessons-learned/](./lessons-learned/)** — per-wave lessons committed at wave close

### Backlog
- **[backlog/INDEX.md](./backlog/INDEX.md)** — open items table
- **[backlog/](./backlog/)** — per-item backlog files
- **[backlog/closed/](./backlog/closed/)** — archived closed items

### Proposed skills
- **[proposed-skills/](./proposed-skills/)** — skill proposals pending Founder approval before commit to `.claude/skills/`

## Design system spec hierarchy

The design system spec is the authoritative source for all visual and interaction design across HQ and Mobile. Located at repo root, not in this directory:

- `docs/wave-2a-ratification.md` — Pass 1 ratification (rejection criteria, Wave 1 restructure, communication strategy, league chat, mobile tab synthesis)
- `docs/CLUBHOUSE_SPEC.md` — Part 1: Mobile design system foundation
- `docs/CLUBHOUSE_SPEC-3a-Home.md` through `-3e-More.md` — Part 2: 22 mobile screens specified
- `docs/CLUBHOUSE_SPEC-4-Wave3-implementation.md` — Part 3: Wave 3 implementation guidance

Engineering ships reference these spec sections by ID. Agents do not argue design choices — design bot output is authoritative.

## How to use this directory

**If you are Founder:**
- Author Vision sections for ships before they fire
- Ratify CFR triggers, Sanity Halt escalations at the moment they're raised
- Review inferred decisions at retrospective (agents acted; you review the log)
- Push override remains available; default is autonomous push on green

**If you are an orchestration agent:**
- Default mode is **autonomous-by-default at Tier 1**: act, learn, document; Founder reviews at retrospective
- Read role docs and protocols before acting
- Read CFR + Sanity Halt before any consequential action
- Use SHIP_PLAN_TEMPLATE for new ships
- Log inferred decisions per Graduated Autonomy framework
- Escalate ONLY for permanent-Founder-approval categories (CFR triggers, Sanity Halt severity, Vision, Roadmap, cost-incurring architecture, wave gates, P0/P1 rollback)
- Autonomous push authorized when smoke + lint + visual verification all green
- Pattern recognition + lessons-learned is the learning loop, not Founder approval per decision

**If you are a future maintainer:**
- Start with ROADMAP.md for strategic context
- Read CTO_INTERFACE.md for how Founder operates
- Read PROTOCOLS.md for operational specifics
