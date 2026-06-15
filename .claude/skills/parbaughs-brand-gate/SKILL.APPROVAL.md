---
skill: parbaughs-brand-gate
ratifier: FOUNDER-DIRECTED
timestamp: 2026-06-15 (marathon — Founder "the harness review and upgrades are all you… any skills you think would be helpful even if custom do them, no need for me")
tier: Founder-directed creation (standing full-autonomy harness grant)
rationale: |
  Founder 2026-06-15, verbatim drivers: "these are not parbaugh related at all"
  (the rejected Imagen ring/crest), "explain the app and our direction BEFORE
  having these made", "I need all tools and 0 excuses as to why designs would be
  lackluster in the morning", and "ensure that all image prompts are extremely
  specific and provide size needed and purpose of image and how it will be used…
  use your image generation prompt skill… so we are not generating a bunch of
  random images that are not cohesive or on brand". This skill is the direct
  deliverable: a ship-gating brand check that (1) makes the locked brand spec
  UNSKIPPABLE at generation time via scripts/brand-gate.mjs, (2) mechanically
  requires size + purpose + usage on every prompt, (3) routes through
  parbaughs-image-gen for the senior-professional prompt, and (4) RED-blocks
  off-brand output via a fixed 5-point QC BEFORE the Founder sees it (doer !=
  judge). Synthesized from the 2026-06-15 harness research (ADOPT-PLAN-EXTERNAL.md
  + UPGRADE-PLAN.md): "the doer cannot be the judge, and the brand cannot live in
  memory." Authority mirrors P8 security: RED blocks ship; YELLOW = Founder taste
  sign-off on staging (AMD-028).
review-state: Pending Founder retrospective review (created under standing
  marathon autonomy; the assets it gates are Founder-vetted on staging per AMD-028)
# >>> agentshield-instrumentation
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
    git revert the commit that introduced the skill; the APPROVAL sidecar +
    scripts/brand-gate.mjs travel in the same skill/harness commit (never
    co-mingled with app code), so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
---

Founder-directed skill creation 2026-06-15 under the standing harness-autonomy
grant. The ship-gating brand check around ALL visual-asset generation: injects
the locked brand spec (BRAND-RULES.json + BRAND-BRIEF.md) into every prompt,
requires size + purpose + usage, routes through parbaughs-image-gen, and applies
a fixed 5-point QC that RED-blocks off-brand output before the Founder sees it.
See SKILL.md for the non-negotiable sequence, lane map, DO/DON'T gallery,
brand-translate table, and rationalization table.
