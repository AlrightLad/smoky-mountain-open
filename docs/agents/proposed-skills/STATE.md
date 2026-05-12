# Proposed skills — Phase 1 state

**Phase 1 commit (2026-05-12, overnight autonomous execution):** 10 skills drafted AND committed directly to `.claude/skills/` with auto-generated `SKILL_APPROVAL.md` sidecars. Per Founder Correction 3 (autonomous mode + minimize prompts), agents act + log + Founder reviews at retrospective.

## What's in `.claude/skills/` after Phase 1

| Skill | Owner | Trigger |
|---|---|---|
| `parbaughs-audit-protocol` | Engineer | P1 audit-first before code/schema/deploy |
| `parbaughs-ship-planner` | Orchestrator | New ship; Vision authored or pending |
| `parbaughs-critic-checklist` | Critic | Ship Plan ratified (pre-eng); Engineer self-audit complete |
| `parbaughs-firestore-writer-audit` | Engineer + Critic | Firestore write; V12 P4 rule-damage audit |
| `parbaughs-smoke-failure-triage` | Engineer + Critic + Orchestrator | Smoke produces failures |
| `parbaughs-namespace-collision-check` | Engineer + Critic | Adding data-* attrs / global helpers / CSS classes |
| `parbaughs-cross-surface-dependency-audit` | Engineer + Critic | Shared data shape change (Criterion 12) |
| `parbaughs-caddy-notes-classifier` | Orchestrator | Drafting / reviewing Caddy Notes entries |
| `parbaughs-version-triple-bumper` | Engineer + Critic | Closing member-facing ship; version bump |
| `parbaughs-visual-verification-protocol` | Engineer + Critic | Per Correction 2 — screenshot capture + review |

Each skill ships with a sibling `<skill-name>.APPROVAL.md` token. The token format was invented as a Phase 1 inferred decision (see `INFERRED_DECISIONS.md` Phase 1 entries). Founder may reverse any skill at retrospective; reversal removes both the skill .md and the sibling token.

## How `proposed-skills/` is used going forward

This directory is for SKILLS THAT NEED PRE-COMMIT FOUNDER APPROVAL (vs. Phase 1's autonomous bootstrap).

Future skill proposal flow:
1. Orchestrator drafts skill content to `docs/agents/proposed-skills/<skill-name>.md`
2. Founder reviews at retrospective
3. On approval: Orchestrator copies to `.claude/skills/<skill-name>.md` and creates a `<skill-name>.APPROVAL.md` sidecar with `ratifier: <Founder>` + timestamp
4. The proposed-skills draft is deleted (fulfilled)

For skills inferred under Tier 3 graduated autonomy (post-Tier 1 + Tier 2 sustained graduation): the proposed-skills draft is auto-committed to `.claude/skills/` with `ratifier: T3-AUTO` and Founder reviews at retrospective per graduated autonomy framework.

## Phase 1 retrospective items related to skills

At Founder morning retrospective, items to review (Tier 1 graduation eligibility decisions):

- All 10 skills' content (read each .md; ratify, reverse, or defer per skill)
- `SKILL_APPROVAL.md` token format (Phase 1 inferred; ratify the format itself)
- Any skill content that needs refinement based on V11 audit findings from prior session (members.js audit)

See `lessons-learned/PHASE_1_COMPLETE.md` for the full retrospective package.
