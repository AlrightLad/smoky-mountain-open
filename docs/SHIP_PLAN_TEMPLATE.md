# Ship Plan Template

> **Orchestration team fills in each section during pre-flight audit (P1) before ship execution begins.** Vision section is ratified by Founder and locked — orchestration team does NOT modify Vision text. All other sections are orchestration-team-authored, Founder-reviewed at retrospective.

## Vision (ratified — DO NOT MODIFY)

[Founder-authored Vision text — orchestration team locks this section]

## Cross-Wave Dependencies

[Pulled from CROSS_WAVE_DEPENDENCIES.md — Hard / Soft / Downstream Consumers]

**Hard dependencies** (ship CANNOT execute until these complete):
- [list]

**Soft dependencies** (benefits from but can execute independently):
- [list]

**Downstream consumers** (ships that depend on this):
- [list]

## Design spec status

**Mock available:** [Yes / No / Partial]
**Spec file(s):** [paths to design spec files in docs/]
**Visual source-of-truth file(s):** [paths to canonical HTML mocks if applicable]
**Coverage gaps:** [any sections of the ship that lack mock per design bot fill-in pass]

## Acceptance criteria

[Orchestration team enumerates ALL acceptance criteria per Vision intent. Each criterion becomes a row in parbaughs-goal-completion-verify skill output before ship close.]

1. [Criterion]
2. [Criterion]
3. [Criterion]
4. ...

## Pre-flight audit (per P1)

### Cross-surface dependency scan
[grep results: what other files reference modules this ship touches]

### CFR triggers
[List of CFR triggers from spec or Vision that fire during this ship]

### Sanity Halt risk assessment
[Identify any halt-criteria-triggering surfaces; mitigation plan]

### Scalability concerns at 10x scale
[Cost projection, performance projection, read budget at 200-member scale]

### Coupled bugs / regressions to watch for
[Historical pattern: similar ships caused regressions in X — verify X holds during this ship]

## Smoke coverage

[Smoke test scenarios required to demonstrate acceptance criteria met]

- [Scenario 1]: [test name + browsers covered]
- [Scenario 2]: [test name + browsers covered]
- ...

## Performance / cost / security / data integrity budgets

**Performance:** [budget per ship scope]
**Cost projection:** [30-day cost at current scale + 10x scale]
**Security check:** [auth / authorization / Firestore rules touched]
**Data integrity invariants:** [authorship, single-author, etc. — what must hold]

## End User sub-agent coverage

[Per Vision intent — which End User profiles need explicit verification]

- **Beginner profile:** [what verifies]
- **Mid-handicap profile:** [what verifies]
- **Scratch profile:** [what verifies]
- **Lone Wolf profile:** [what verifies]
- **Commissioner profile:** [what verifies]

## Decision bubbles expected

[Any CFR triggers OR cross-surface implications likely to require decision bubble during execution. Orchestrator opens these proactively rather than reactively.]

- [Bubble subject]: [voting agents + contributing agents per locked Interpretation B]

## Caddy Notes entry plan

[Member-visible description of what ships per locked Writing Standard. Drafted at pre-flight, refined at ship close.]

## Files affected (audit)

[Pre-flight grep results — every file this ship will modify]

- `<path>` — `<reason>`
- `<path>` — `<reason>`

## Ship retrospective placeholder

[Generated at ship close per POST_PUSH_RETROSPECTIVE.md 5-component standard. Includes parbaughs-goal-completion-verify skill output reference.]
