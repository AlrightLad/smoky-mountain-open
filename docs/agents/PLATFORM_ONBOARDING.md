# Platform Onboarding

Start-here entry point for a Founder returning after a break OR a new agent joining the network. Single document covering what PARBAUGHS is, current Build Roadmap status, the agent network, governance hierarchy, and the discipline patterns.

## What PARBAUGHS is

PARBAUGHS is a social golf league platform for friend groups to create leagues, track scores, compete in seasons, earn virtual currency (Parcoins), and customize profiles. The founding league is "The Parbaughs" (~20 members).

**Platform branding:**
- Platform name: PARBAUGHS
- Domain: parbaughs.com
- Founder: Zach Boogher (Mr Parbaugh)
- Founding crew: ~20 members at platform launch

**Architecture split:**
- **HQ Web** (parbaughs.com) — universal surface for all features at all bands (desktop + mobile band)
- **Clubhouse Mobile App** — enhanced active-play experience (iOS first per memory #29; Android Launch Phase B)
- Shared Firebase backend (project ID `parbaughs`, Blaze plan)

**Tone:**
- Country-club editorial voice — Fraunces typography, plenty of whitespace, no cluttered social-media aesthetic
- "Worthwhile reading not addictive scroll" per locked Vision discipline
- No emojis (SVG icons / high-class emblems only)

## Where to find what

### Visions (40 ratified ship Visions)
- `docs/agents/ships/<ship-id>.md` — each Wave 1 / Wave 2 / Wave 3 / Wave 4 ship has a Vision file
- Ship plans live in same directory (Vision = ratified intent; Ship Plan = execution detail per SHIP_PLAN_TEMPLATE.md)

### Design specs
- `docs/CLUBHOUSE_SPEC*.md` — mobile (Wave 3) and HQ (Wave 2) specs
- `docs/Parbaughs_CTO_Mock_Inventory.md` — every authored mock catalog
- `docs/*.html` — canonical HTML mocks (visual source of truth)

### Governance docs
- `docs/agents/AGENT_NETWORK.md` — agent roster + role + activation status
- `docs/agents/HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md` — when agents halt vs continue
- `docs/agents/PROTOCOLS.md` — P0 through P10 protocols (audit-first, severity tiers, push protection, loop-and-verify)
- `docs/agents/CROSS_WAVE_DEPENDENCIES.md` — ship-to-ship dependencies
- `docs/agents/MIGRATION_PROTOCOL.md` — migration discipline
- `docs/agents/FEATURE_FLAG_DISCIPLINE.md` — feature flag governance
- `docs/agents/POST_PUSH_RETROSPECTIVE.md` — 5-component retrospective output
- `docs/agents/RATE_LIMIT_DISCIPLINE.md` — 90% threshold pause discipline
- `docs/agents/DOC_FRESHNESS_REVIEW.md` — periodic freshness audit
- Per-agent files: ORCHESTRATOR.md, ENGINEER.md, CRITIC.md, FLOW_DOCUMENTER.md, UI_POLISHER.md, END_USER.md, DEVILS_ADVOCATE.md, HISTORICAL_PATTERN.md, FUTURE_SELF.md, PLAIN_ENGLISH_TRANSLATOR.md, BUG_TRIAGE_LISTENER.md, PERFORMANCE_LOAD_TESTING.md, SECURITY_AUDITOR.md, DATA_INTEGRITY.md

### Skills
- `.claude/skills/` — operational skills
- `docs/agents/SKILL_CATALOG_OVERVIEW.md` — every skill's purpose at-a-glance
- `docs/agents/SKILL_PERFORMANCE_REVIEW.md` — graduation / retirement protocol

### Lessons + retrospectives
- `docs/agents/lessons-learned/` — per-wave lessons
- `docs/agents/retrospectives/` — per-push 5-component retrospectives
- `docs/agents/decision-bubbles/` — per-bubble files (open) + archived to lessons-learned (closed)

### Code conventions
- Vite-split vanilla JS, Firebase, GitHub Pages, Capacitor
- Repo: AlrightLad/smoky-mountain-open
- Live: https://alrightlad.github.io/smoky-mountain-open/
- Bundle ID for mobile: `com.parbaughs.app`
- Working directory (Founder local): `C:\Users\Zach\smoky-mountain-open`

## Build Roadmap status

### Wave 1 (20 ships) — Foundation + Member-facing core
- W1.S1-S14 design ships
- W1.I1-I6 infrastructure ships (incl W1.I6 Course Capture from Photo)

### Wave 2 (6 ships) — HQ desktop redesign
- W2.S0-S5

### Wave 3 (6 ships) — Mobile Clubhouse rebuild
- M1-M6 (M6 holds on LLC + D-U-N-S + Apple Developer Organization tier per memory #29)

### Wave 4 (8 ships) — Identity Refresh + Stats expansion
- W4.I1-I5 Identity (Discord-style usernames + titles + migration)
- W4.S1-S3 Stats expansion (heat maps + advanced stats + custom league trophies)

### Current status
[TBD — Founder fills in or Orchestrator captures at session start]

## Agent network (14 agents)

### Always active (3 core hierarchical)
- **Orchestrator** — senior coordinator, owns plan, escalates to Founder
- **Engineer** — implementation + acceptance criteria evidence
- **Critic** — verifies Engineer's work, stamps completion

### Always active (3 parallel authorities — contribute, do NOT vote)
- **Flow Documenter** — maintains flows.json + flows.html
- **UI Polisher** — owns visual coherence, country-club tone, design system fidelity
- **End User** — 5 sub-agent profiles (Beginner, Mid-handicap, Scratch, Lone Wolf, Commissioner) provide multi-perspective feedback

### Always active (4 bubble-only structural — no vote)
- **Devil's Advocate** — fires at 4+ consensus to ensure dissent is voiced
- **Historical Pattern** — surfaces prior decisions / lessons-learned relevant to current bubble
- **Future Self** — projects implications if decision proves wrong
- **Plain English Translator** — generates Founder-readable summary at bubble close

### Activates conditionally
- **Bug Triage Listener** — activates after W1.I1 ships; daily 12am scan of member bug reports
- **Performance/Load Testing** — activates at Wave 2 entry (votes in bubbles thereafter)
- **Data Integrity** — activates at Wave 2 entry (votes in bubbles thereafter)
- **Security/Auditor** — activates at Launch Phase A (votes in bubbles thereafter)

## Discipline patterns (the things that matter)

### Audit-first (P1)
Every ship begins with pre-flight audit of cross-surface dependencies, CFR triggers, Sanity Halt risk, scalability concerns. No code lands before audit completes.

### Loop-and-verify (P10)
Engineer uses `/loop` pattern during implementation, iterating until acceptance criteria demonstrably met. `parbaughs-goal-completion-verify` skill fires on completion declarations forcing structured walkthrough table with evidence per criterion. No completion valid without skill output.

### Diagnostic before defense
When user reports problem and points blame, gather data before refuting. Per memory #25.

### Validator strictness on legacy docs
When introducing strict validators, accept missing fields during migration window, catch wrong types only. Per memory #18.

### State re-assignment audits
When adding fields to mutable state, grep every assignment pattern across file. Per memory #8.

### CSS token alias scope
Grep `var(--*)` across pages + core when writing token alias specs. Per memory #6.

### Legacy field consumer audit
When deleting personalization system, grep field name across pages + core + cloud functions for READERS, not just WRITERS. Per memory #7.

### Theme-aware inline SVG
`<svg style="color: var(--cb-brass)">` + `stroke="currentColor"` pattern for theme-aware accents. Per memory #16.

### Decision bubble protocol (Interpretation B)
Engineering minds vote (Engineer + Critic + Performance + Security + Data Integrity). Contributing agents provide findings. Bubble-only roles structure debate. Per memory #26.

### Post-push retrospective (5 components)
Every push produces: (1) what changed, (2) roadmap %, (3) Plain English bubble transcripts, (4) workflow doc test confirmation, (5) growth report. Critic verifies all 5. Per memory #27.

### Rate-limit halt at 90%
Agents pause at 90% usage threshold, write state checkpoint, resume on reset. Per memory #28.

## Sanity Halt criteria

Per HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md, halt criteria:

1. Production data modification without revert path
2. Auth / security / Firestore rules changes
3. Member data visibility changes
4. Architectural divergence from Vision
5. Cost-impact decisions exceeding thresholds
6. Anything affecting Mr Parbaugh's identity / Founder authority
7. New external dependencies (npm packages, APIs, services)
8. Anything modifying production data without revert path (re-stated as hard guardrail)
9. Anything affecting auth/security/Firestore rules (re-stated as hard guardrail)
10. Anything exposing member data beyond intended visibility
11. Vendor billing within 30 days without prior approval
12. Trial setups of any kind
13. Rate limit threshold breach (90% usage) — pause, not halt-and-escalate

## How to start a session

Returning Founder or new agent:

1. **Read this file** (PLATFORM_ONBOARDING.md) for foundational context
2. **Read SESSION_JOURNAL.md** last 5-10 entries for current state
3. **Read `.claude/state/last-verify.json`** if it exists (resume from pause if applicable)
4. **Check active ship** in `docs/agents/ships/` — is something mid-execution?
5. **Check active decision bubbles** in `docs/agents/decision-bubbles/` — are votes pending?
6. **Verify rate limit status** before resuming work
7. **Identify scope** for this session (specific ship work, retrospective review, Founder check-in)
8. **Proceed** per locked workflow

## Cross-references

- AGENT_NETWORK.md (agent roster detail)
- PROTOCOLS.md (P0-P10 governance)
- All memory entries (current-state locks)
- CTO_INTERFACE.md (Founder ↔ orchestration team communication)
- POST_PUSH_RETROSPECTIVE.md (visibility surface between sessions)

## Activation

This document activates at Phase 1 commit. Reviewed for accuracy at every doc-freshness audit (per DOC_FRESHNESS_REVIEW.md per-quarter cadence). Founder amends as platform evolves.
