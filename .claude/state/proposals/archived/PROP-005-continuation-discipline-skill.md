---
{
  "id": "PROP-005",
  "title": "Author continuation-discipline skill + Critic protocol update",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-14T17:18:00Z",
  "rationale": "The team has habitually stopped at consolidated-report logical handoff points that aren't real stop conditions per AUTONOMOUS_FAILURE_RECOVERY v8.3. Founder has directed continuation discipline multiple times; AMD-017 codifies the principle but a SKILL is what the team consults at decision time. Without the skill, AMD-017 is a policy doc the team doesn't naturally reach for at the relevant moment.",
  "scope": "Three deliverables: (1) Author .claude/skills/continuation-discipline/SKILL.md with the 7 real stop conditions + 8 false signals + 4-step determination procedure + confidence framework + Critic gate. (2) Update Critic protocol to gate consolidated-reports — Critic verifies skill consultation + documented stop condition before allowing turn-end. (3) Operate the skill immediately per Founder directive even before formal approval; this proposal codifies it.",
  "estimate": {
    "cost_tokens": 4000,
    "duration_minutes": 10,
    "risk": "low"
  },
  "files_affected": [
    ".claude/skills/continuation-discipline/SKILL.md (new)",
    "docs/agents/CRITIC_PROTOCOL.md (or peer doc) — append continuation-skill gate",
    ".claude/state/proposals/pending/PROP-005-continuation-discipline-skill.md (this file)"
  ],
  "fallback_plan": "Plan A: ship the skill + Critic protocol update as one bundle (this proposal). Plan B: ship the skill only, defer Critic protocol update to follow-on if doc location is unclear. Plan C: keep AMD-017 as the authoritative source; team operates from amendment text alone. Abandon: skill format itself becomes unworkable (unlikely — Claude Code skill format is well-defined).",
  "rollback_strategy": "git revert; skill is new — removal restores prior implicit behavior. AMD-017 continues to operate as written.",
  "round_trip_coverage": "Existing [proposals] check verifies this proposal's frontmatter schema; no new round-trip block required (skills are loaded by Claude Code at session start, not by round-trip-test.py).",
  "depends_on": ["AMD-009", "AMD-011", "AMD-015", "AMD-017"],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1000,
  "status": "pending",
  "operating_status": "Skill operates immediately per Founder directive even before approval. This proposal codifies it for the next agent loop."
}
---

# PROP-005 — Continuation Discipline Skill + Critic Protocol Update

Authored 2026-05-14 per Founder directive "AUTHOR SKILL — Continuation
discipline".

## Why a skill (not just an amendment)

AMD-017 (continuation discipline) codifies the principle. But amendments
are reference policy documents the team consults via cross-references.
The team needs to encounter the discipline at the **decision moment** —
when about to write "Tree clean. Round-trip green. Founder reviews when
ready." or similar turn-end phrases.

Claude Code skills are loaded at session start and surface via the
trigger mechanism. By authoring this as a skill, the team naturally
consults it at the right moment.

## What the skill contains

See `.claude/skills/continuation-discipline/SKILL.md` (authored
alongside this proposal). Sections:

- When to consult (5 trigger conditions)
- 7 real stop conditions (exhaustive)
- 8 false stop signals (the bad-habit list)
- 4-step continuation determination procedure
- Confidence framework (HIGH / MEDIUM / LOW → action)
- Habit-correction reminder
- Pre-turn-end Critic gate
- 4 worked example walkthroughs

## Critic protocol update

Add to Critic's pre-ship-close checklist:

```
[ ] Continuation-discipline skill consulted before turn-end?
[ ] At least one real stop condition documented in the report?
[ ] If no real stop condition: Critic blocks turn-end + instructs
    continuation per Step 2 of the skill
```

Documented in Critic's protocol doc (location to confirm during apply —
likely `docs/agents/CRITIC_PROTOCOL.md` or peer doc; verified at
apply time).

## Operating immediately

Per Founder directive: *"Even before the skill is formally approved,
OPERATE under its principles starting now."*

The skill principles operate from authoring time. This proposal
codifies the substrate change. Founder approves to make the Critic
gate structural rather than advisory.

## Apply behavior

When Founder approves via proposals.html:

- Watcher catches `decisions-*.json` with `PROP-005: approve`
- `apply-decisions.sh` moves this proposal `pending/` → `shipped/`
- Skill file at `.claude/skills/continuation-discipline/SKILL.md`
  remains in place (already authored in this commit)
- Critic protocol doc gets updated (or note added)

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (foundation)
- AMD-011 AUTO_EXECUTE_PROTOCOL (readiness pipeline)
- AMD-015 TEAM_PROPOSES_AGENT_2_RATIFIES (escalation pattern)
- AMD-017 CONTINUATION_DISCIPLINE (the policy this skill operationalizes)
- AUTONOMOUS_FAILURE_RECOVERY v8.3 (stop condition definitions)

---

## Archive metadata

```
archived_at: 2026-05-19T03:00:00Z
archived_by: founder-blanket-approval-2026-05-19
obsoleted_by: SHIPPED — .claude/skills/continuation-discipline/ + docs/agents/CONTINUATION_DISCIPLINE.md operative; AMD-017 applied; .claude/state/stop-decisions/ logging active. Triage source: .claude/state/task-queue/founder/proposal-triage-2026-05-19.md Batch B row 1.
```
