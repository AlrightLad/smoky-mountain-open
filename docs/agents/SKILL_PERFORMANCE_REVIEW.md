# Skill Performance Review

Skills in `.claude/skills/` and `docs/agents/proposed-skills/` get reviewed at every retrospective for actual utility. Skills that don't trigger when they should, or trigger uselessly when they shouldn't, get retired or amended. High-utility skills get expanded. This makes skill evolution explicit instead of implicit.

## Why this exists

Phase 1 committed 10 skills with auto-generated SKILL_APPROVAL.md tokens per Tier 1 graduated autonomy. Each skill encodes a discipline (audit-first, ship planning, critic checklist, etc.). Over time:
- Some skills will reliably catch real problems (high utility)
- Some skills will trigger spuriously without adding value (low utility / noise)
- Some skills will fail to trigger when they should (gaps in pattern matching)
- New patterns will emerge that warrant new skills

Without explicit review, skills accumulate without quality control. Skill Performance Review fires at every retrospective to keep the skill catalog disciplined.

## What gets reviewed

At every retrospective (per RETROSPECTIVE_REVIEW.md), Orchestrator + Critic produce a Skill Performance Report covering:

### For each active skill in `.claude/skills/`:
1. **Trigger count** — how many times did this skill activate during the period?
2. **Useful trigger rate** — of those triggers, how many produced output that actually informed the work?
3. **Spurious trigger rate** — how many triggers were noise (activated but didn't apply)?
4. **Missed trigger candidates** — were there moments where this skill SHOULD have triggered but didn't?
5. **Member-visible value** — did the skill's output contribute to ship quality or just internal process?

### Categorization
Per skill, classify into one of:
- **High utility** — frequent useful triggers, low spurious rate; expand scope if natural fit
- **Stable utility** — occasional useful triggers, low spurious rate; preserve as-is
- **Low utility** — rare useful triggers OR high spurious rate; consider amendment or retirement
- **Failing** — should have triggered repeatedly but didn't; either fix the matcher or retire

## Action paths per category

### High utility
- Document the pattern that makes this skill valuable
- Consider expanding scope (e.g., audit skill that catches one class of bug may extend to another)
- Surface to other agents as a model pattern

### Stable utility
- Preserve as-is
- Re-evaluate at next retrospective

### Low utility
- Amend the matcher to reduce spurious triggers OR
- Amend the skill content to add genuine value OR
- Retire the skill (move to `docs/agents/retired-skills/` with rationale)

Retirement is not failure — skills that don't serve get out of the way of skills that do.

### Failing
- Diagnose: matcher too narrow, pattern actually rare, skill content incomplete
- Fix matcher OR retire
- Don't keep a skill that fails to trigger; it adds noise to the catalog without value

## Founder ratification

Per GRADUATED_AUTONOMY.md:
- **Tier 1 (active at Phase 1 commit):** Skill content drafting + skill triggering false-positive fixes are autonomous. Skill amendments to fix spurious triggers fire autonomously; logged to INFERRED_DECISIONS.md.
- **Tier 2 (after 20 ships @ 95% match):** Skill modifications to existing approved skills are autonomous.
- **Tier 3 (after 30 ships @ 95% match):** New skill drafting + commit becomes autonomous.

Until tier graduation, skill addition + retirement require Founder ratification at retrospective.

## Skill performance report format

Per retrospective, committed to `docs/agents/lessons-learned/SKILL_PERFORMANCE_WAVE_N.md`:

```markdown
## Skill performance review — Wave N

### Active skills snapshot
| Skill | Trigger count | Useful | Spurious | Category | Action |
|---|---|---|---|---|---|
| parbaughs-audit-protocol | 19 | 18 | 1 | High utility | Preserve |
| parbaughs-version-triple-bumper | 19 | 19 | 0 | High utility | Preserve |
| parbaughs-caddy-notes-classifier | 19 | 15 | 4 | Stable utility | Amend matcher (reduce spurious) |
| <etc.> | | | | | |

### New skill proposals from this wave
- <Proposed skill name>: <Pattern that suggests this skill>

### Skills proposed for retirement
- <Skill name>: <Rationale>

### Skill amendments
- <Skill name>: <Specific change>

### Founder ratification needed
- <List of changes requiring Founder approval per current Tier>
```

## Skill metadata tracking

To support performance review, each skill in `.claude/skills/` includes metadata in its YAML frontmatter:

```yaml
---
name: parbaughs-audit-protocol
description: <description>
trigger: <trigger condition>
owner: <agent>
tier: T1
created: 2026-05-12
last_amended: 2026-05-12
trigger_count: 0
useful_count: 0
spurious_count: 0
---
```

Orchestrator updates `trigger_count`, `useful_count`, `spurious_count` as observed. Engineer + Critic flag when skills do/don't trigger usefully.

At retrospective, the snapshot table in the performance report reads directly from this metadata across all active skills.

## Authority

Orchestrator owns the skill performance review process. Critic provides input on whether skills produce useful output. Both report to Founder at retrospective.

Per Tier 1+ graduated autonomy, Orchestrator may autonomously:
- Amend matchers to reduce spurious triggers
- Retire skills with consistent low-utility pattern
- Propose new skills (committed to `docs/agents/proposed-skills/` for Founder ratification per Tier rules)

## Initial state

At Phase 1 commit, 10 skills active with all metadata fields at zero (no triggers yet):

1. parbaughs-audit-protocol
2. parbaughs-ship-planner
3. parbaughs-critic-checklist
4. parbaughs-firestore-writer-audit
5. parbaughs-smoke-failure-triage
6. parbaughs-namespace-collision-check
7. parbaughs-cross-surface-dependency-audit
8. parbaughs-caddy-notes-classifier
9. parbaughs-version-triple-bumper
10. parbaughs-visual-verification-protocol

First Skill Performance Review fires at Wave 1 close retrospective with whatever trigger data the wave produced.

## What this does NOT do

- Not a grading mechanism for agents (that's DEVELOPMENT_GRADING.md)
- Not a substitute for skill ratification (Founder still approves new skills per Tier)
- Not a noise reduction tool that hides useful low-trigger skills (rare-but-critical skills are stable utility, not low)
- Not retroactive — past triggers before Phase 1 are not tracked

## Audit cadence

- Per-retrospective (every ship close + every wave close)
- Per-Build → Launch transition: full skill catalog review (Launch governance may modify cadence)
