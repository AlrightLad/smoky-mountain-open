# Skill approval — parbaughs-legal-compliance

**Approved by:** Founder direction 2026-05-30, verbatim: *"also there
needs to be a legal agent added to the orchestration team that ensures
all laws and requirements are met for the application to be successful
and protected"* and *"make sure the legal agent is added to the
dashboard and harness flow page please"*.

The Founder's explicit directive to add this reviewer to the
orchestration team IS the ratification this gate requires. The skill is
the operative form of that reviewer (CLAUDE.md role + harness-flow card
+ dashboard surface are the documentation/visibility forms).

**Operating status:** ACTIVE immediately. The Legal & Compliance
reviewer gates ship-close from this point forward, symmetric to P8
security (legal RED blocks; legal YELLOW needs Founder approval via
`task-queue/founder/`).

**Authority:** Specialist-tier, launch-gating. Mirrors the Security
Auditor's ship-blocking authority (P8) applied to the legal/regulatory
surface instead of the security surface.

**Related principles + substrate:**
- P8 SECURITY_SHIP_BLOCKING (the security-reviewer analogue this mirrors)
- P9 DATA_TRUTHFULNESS + P10 ACTIONABLE_SURFACING (LEGAL block format)
- AMD-018 11-gate (payments/economy + App-Store + domain gates overlap
  the legal surface; legal review is the substantive layer over the
  procedural gate)
- AMD-015 TEAM_PROPOSES_FOUNDER_RATIFIES (escalation discipline for
  legal YELLOW/RED)
- `public/privacy.html` + `public/terms.html` (the legal documents this
  reviewer keeps current)
- `deleteMyAccount` Cloud Function (#199/#200), UGC block/report
  moderation (#208) — existing compliance substrate

This sidecar exists to satisfy `.claude/hooks/skill-approval-gate.sh`
which requires Founder ratification before skill files materialize in
`.claude/skills/`.
