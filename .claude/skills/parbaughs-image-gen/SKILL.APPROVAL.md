---
skill: parbaughs-image-gen
ratifier: FOUNDER-DIRECTED
timestamp: 2026-06-14 (marathon — Founder explicit request)
tier: Founder-directed creation
rationale: |
  Founder 2026-06-14, verbatim: "all merch looks generic and not professionally
  tailored or edited which means the design prompts are not well crafted enough
  to get the results we need add or create a skill to use [image] generation at
  an expert level with extreme research and knowledge on high end use of the
  tool." This skill is the direct deliverable. Content synthesized from a
  6-agent research workflow (Imagen prompt engineering, product-photography
  vocabulary, AI-tell avoidance, materials rendering, gemini-vs-imagen, post-edit
  pipeline) run 2026-06-14. Founder reviews the resulting regenerated assets on
  staging for taste sign-off (AMD-028).
review-state: Pending Founder retrospective review (skill created under standing
  marathon autonomy; assets it produces are Founder-vetted on staging)
# >>> agentshield-instrumentation
# Wires the skill to the real PARBAUGHS telemetry substrate; no fake telemetry.
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
    git revert the commit that introduced the skill; the APPROVAL sidecar travels
    with the skill so revert restores both. Skill changes never co-mingle with
    code commits, so revert is mechanically clean. The gen-script + finishing
    pipeline changes are separate commits and revert independently.
  rollback_safe: true
# <<< agentshield-instrumentation
---

Founder-directed skill creation 2026-06-14. Encodes expert Vertex Imagen 4
prompt engineering + a deterministic local (PIL) post-edit finishing pipeline
so PARBAUGHS brand assets read as professionally art-directed, not generic-AI.
See SKILL.md for the prompt formula, modifier library, consistency protocol,
per-asset recipes, vetting checklist, finishing pipeline, and anti-generic rules.
