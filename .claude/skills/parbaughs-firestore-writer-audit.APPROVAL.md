---
skill: parbaughs-firestore-writer-audit
ratifier: AUTO-PHASE-1
timestamp: 2026-05-12 (overnight Phase 1 autonomous execution)
tier: Phase 1 bootstrap (pre-tier-tracking)
rationale: Phase 1 STEP 2 autonomous mode per Correction 3. Encodes leagueQuery/leagueDoc wrapper audit pattern (corrected from stale leagueCollection name per DRIFT-1) + V12 audit pattern for P4 rule-damage suspects (Bounties/Wagers/Scrambles/Trips). Founder reviews at retrospective.
review-state: Pending Founder retrospective review
# >>> agentshield-instrumentation
# Added 2026-05-18 to satisfy AgentShield ECC 2.0 skill-health checks
# (observation-hooks, feedback-hooks, version, rollback). Wires the skill to
# the real PARBAUGHS telemetry substrate; no fake telemetry. See
# parbaughs-telemetry-emit and HANDOFF_PROTOCOL.md for the consuming systems.
version: 1.0.0
observation_hooks:
  on_invoke:
    event_type: skill.invocation.start
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
  on_complete:
    event_type: skill.invocation.end
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
feedback_hooks:
  channel: handoff-note
  scenario: subagent-return
  template: HANDOFF_NOTE_TEMPLATES.md
  target_dir: .claude/state/handoffs/subagent-returns/
rollback:
  previous_version: null
  procedure: |
    git revert the commit that introduced the skill update; APPROVAL sidecar
    travels with the skill so revert restores both. Skill changes never co-mingle
    with code commits, so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
---

Auto-generated SKILL_APPROVAL.md token per Phase 1 inferred decision (see INFERRED_DECISIONS.md Phase 1 entries).
