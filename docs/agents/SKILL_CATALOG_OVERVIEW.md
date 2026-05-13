# Skill Catalog Overview

Every skill's purpose at-a-glance. Complementary to SKILL_PERFORMANCE_REVIEW.md (which governs retirement / graduation) — this doc lists what exists, what each does, when it fires.

## Why this exists

As skill count grows, discoverability matters. Without single catalog, agents discover skills by accident or memory. This catalog gives every agent + Founder an instant index of available skills.

## Active skills at Phase 1 commit (11 skills)

### Quality gates (permanent, never graduate)

| Skill | Purpose | Trigger |
|---|---|---|
| `parbaughs-goal-completion-verify` | Forces explicit acceptance-criteria walkthrough with evidence per criterion before completion declaration accepted. Per PROTOCOLS.md P10. | Any Engineer completion-declaration phrase ("feature complete", "ship ready for review", phase advancement) |
| `parbaughs-rate-limit-aware-pause` | Monitors API rate limit metadata; activates pause at 90% threshold per RATE_LIMIT_DISCIPLINE.md. Writes state checkpoint + session journal before stopping. | Every API call + tool invocation; pre-operation self-check moments |

### Audit skills (Wave 1 catalog)

| Skill | Purpose | Trigger |
|---|---|---|
| `parbaughs-firestore-writer-audit` | Audits Firestore write paths for: validator consistency, security rule alignment, cost projection, audit log presence. Catches write-side regressions. | Engineer writes new Firestore write path; ship plan introduces new write category |
| `parbaughs-cross-surface-dependency-audit` | Greps across `src/pages/` + `src/core/` for cross-surface dependencies. Pre-flight audit pattern enforcement. | Engineer prepares to modify shared module; ship plan touches >2 surfaces |
| `parbaughs-css-token-usage-audit` | Greps `var(--*)` references across JS inline styles + CSS. Catches token alias scope drift per memory #6. | Design system rationalization ship; CSS token alias spec authoring |
| `parbaughs-legacy-field-consumer-audit` | Greps field names across pages + core + cloud functions for READERS before deletion. Per memory #7. | Theme/personalization system deletion; field name retirement |
| `parbaughs-state-reassignment-audit` | Greps every `<stateVar> = {` pattern across file before locking scope. Per memory #8 (liveState lesson). | New field added to module-scoped state object |
| `parbaughs-validator-strictness-audit` | Enumerates universe of existing docs that will encounter new validator. Per memory #18 (lastWriteAt lesson). | Strict validator introduction on Firestore doc field |

### Workflow skills

| Skill | Purpose | Trigger |
|---|---|---|
| `parbaughs-caddy-notes-update` | Forces Caddy Notes entry per locked Writing Standard. Member-visible description, not internal implementation. | Every ship close; never skipped per locked governance |
| `parbaughs-semver-triple-bump` | Forces utils.js APP_VERSION + package.json + sw.js CACHE_NAME bump together. Per memory #5. | Any push to remote; pre-push hook enforces |
| `parbaughs-decision-bubble-write` | Writes decision bubble file per locked DECISION_BUBBLE_AGENTS.md schema. Includes per-agent reasoning, votes, Plain English summary. | Decision bubble fires for any criterion |

## Skills planned but not yet built (Wave 2+ catalog growth)

These skills are referenced in governance but await implementation when triggers actually fire:

| Skill | Activation wave | Purpose |
|---|---|---|
| `parbaughs-performance-budget-verify` | Wave 2 entry | Measures performance budget per ship; halts on regression > X% |
| `parbaughs-security-rule-fuzz` | Launch Phase A | Fuzzes Firestore security rules with member-visibility edge cases |
| `parbaughs-data-integrity-invariant-check` | Wave 2 entry | Walks invariants per ship (authorship, single-author, etc.); halts on violation |
| `parbaughs-migration-rollback-verify` | Per migration | Verifies migration rollback path in staging before production fires |
| `parbaughs-feature-flag-lifecycle-audit` | Per quarter | Audits active flags for staleness per FEATURE_FLAG_DISCIPLINE.md |
| `parbaughs-memory-freshness-audit` | Per quarter | Reviews memory entries for staleness per DOC_FRESHNESS_REVIEW.md |
| `parbaughs-cost-projection-verify` | Every cost-impact decision | Computes 30-day cost projection against HALT_CRITERIA thresholds |

## Skill performance tracking

Per SKILL_PERFORMANCE_REVIEW.md, each skill maintains:
- `trigger_count` — how often skill activated
- `useful_count` — how often skill caught a real issue
- `spurious_count` — how often skill triggered on irrelevant context

Performance review fires per-wave-close. Skills with high spurious rate → matcher refinement OR retirement.

## Catalog structure

Each skill file at `.claude/skills/<skill-name>.md` follows the standard frontmatter:

```yaml
---
name: <skill-name>
description: <one-line purpose>
trigger: <when this skill activates>
owner: <which agent role primarily uses this skill>
tier: T1 | T2 | T3 (graduation tier)
created: <YYYY-MM-DD>
last_amended: <YYYY-MM-DD>
trigger_count: 0
useful_count: 0
spurious_count: 0
---
```

Skill body: explanation of mechanics + integration with other skills/protocols.

## Tier system

- **T1** — Active at Phase 1 commit; permanent quality gate; never graduates
- **T2** — Active when triggered; graduates to T3 (retired) after 30 days of zero triggers OR per SKILL_PERFORMANCE_REVIEW evaluation
- **T3** — Retired; preserved for historical reference but not in active rotation

Current count: 11 T1 / 0 T2 / 0 T3 at Phase 1 commit.

## How to add a new skill

1. Identify the pattern that needs enforcement (catch-coupling, pre-flight check, completion gate, etc.)
2. Draft skill file per standard frontmatter + body
3. Test skill triggers against historical session data (does it activate on relevant context? does it stay silent on irrelevant context?)
4. Commit skill to `.claude/skills/`
5. Add entry to this catalog
6. Reference skill from relevant governance docs (PROTOCOLS.md, AGENT_NETWORK.md, etc.)
7. Schedule first review at next wave-close per SKILL_PERFORMANCE_REVIEW.md

## How to retire a skill

Per SKILL_PERFORMANCE_REVIEW.md:
1. Skill has fired ≥10 times with >50% spurious rate OR zero triggers in 30 days
2. Retrospective identifies skill as no longer adding value
3. Founder ratifies retirement at wave-close review
4. Skill file moved to `.claude/skills/retired/` (preserved, not deleted)
5. Remove entry from active section of this catalog; add to retired section
6. Update governance references that mentioned the skill

## Cross-references

- SKILL_PERFORMANCE_REVIEW.md (graduation / retirement protocol)
- PROTOCOLS.md P10 (parbaughs-goal-completion-verify gate)
- RATE_LIMIT_DISCIPLINE.md (parbaughs-rate-limit-aware-pause operational layer)
- All audit-related memory entries (#6, #7, #8, #18) — source patterns for audit skills

## Activation

This catalog activates at Phase 1 commit with 11 skills listed. Updates as skills are added or retired. Reviewed for accuracy at every doc-freshness audit per DOC_FRESHNESS_REVIEW.md cadence.
