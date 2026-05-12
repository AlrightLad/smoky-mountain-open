# Phase 1 — Open Items (Founder workstreams + parallel reminders)

Items captured during Phase 1 setup that do NOT block any agent work but require Founder attention on a parallel timeline.

## Apple Developer Program enrollment

**Owner:** Founder
**Blocker for:** Wave 3 M1 (Capacitor harness) + Wave 3 M6 (TestFlight enrollment of founding 20)
**Cost:** $99/year
**URL:** https://developer.apple.com/programs/enroll/
**Setup time:** Apple review takes 24-72 hours (sometimes longer for first-time enrollees)

Not blocking until Wave 3 fires (after Wave 1 + Wave 2 complete). Wave 3 → Wave 4 transition per INTER_WAVE_PROTOCOL.md mentions "Apple Developer Account activation planning" — ideally enrolled BEFORE Wave 3 M1 fires to avoid timing pressure later.

**Founder action at morning retrospective:** triage when to enroll. Recommend starting enrollment 2-3 weeks before Wave 3 expected start date (so the 24-72h review window doesn't surprise the schedule). If Wave 3 is 2+ months out, no urgency at Phase 1 commit.

**Captured per Founder prompt STEP 7.**

## Google Play Developer Account

**Owner:** Founder
**Blocker for:** Launch Phase B AS2 (Android submission)
**Cost:** $25 one-time
**URL:** https://play.google.com/console
**Setup time:** Account approval typically same-day

Not blocking until Launch Phase B. Pricing model + Phase A monetization come first. Mention here for completeness; defer activation to Phase A close.

## Domain decision

Per CLAUDE.md "Brand": need to secure `parbaughs.com` or `parbaughs.golf`. Flagged for commissioner. No agent action; Founder triage.

## Social handles

Per CLAUDE.md: `@PlayThru_` claimed but may conflict with PlayThru LLC (playthru.golf). Commissioner decision needed: switch to `@Parbaughs` or `@ParbaughsGolf`. No agent action.

## `~/.claude/teams/parbaughs/config.json` authoring

Per PHASE_1_ENVIRONMENT_VALIDATION.md: Agent Teams config absent. Founder sets env var + authors config when ready for Agent Teams workflow. Not blocking single-agent operation.

## CLAUDE.md update

Per PHASE_1_FOUNDER_REVIEW.md Q5: CLAUDE.md "Project State" line is 21 ships out of date. CLAUDE.md also describes "Three-Agent Workflow" (Zach / Claude.ai / Claude Code) which conflicts with new Orchestrator + Engineer + Critic structure.

**Recommended:** add banner at top of CLAUDE.md noting "Project State stale — see docs/agents/ROADMAP.md for current orchestration model and ship history."

Founder authors the substantive rewrite during a future maintenance window OR Wave 1 retrospective. Agents do not rewrite CLAUDE.md autonomously (it's Founder-voice document).

## `scripts/v7-mtd-diagnostic.js` untracked

Per PHASE_1_FOUNDER_REVIEW.md Q3: unknown file in working tree. Founder reads + decides: commit / gitignore / delete.

## Smoke account credentials sync (if W1.I4 chooses Option B/C)

If Founder selects W1.I4 Option B (separate Firebase project) or Option C (hybrid), the smoke@parbaughs.test account must be replicated in the staging project (Option B) or auth-federated (Option C). This is a W1.I4 implementation detail; mentioned here so Founder considers it during Vision authoring.

## Items closed during Phase 1 (no follow-up needed)

- **B.5 confirmed resolved.** Members profile chart toggle audit completed per v8.14.4 ruling. Inline code comment at members.js:1152-1154 documents the resolution. Per `project_ship_5_8_inventory.md` memory — confirmed in Phase 1 audit.

## Items deferred to retrospective ratification

Per INFERRED_DECISIONS.md Phase 1 entries — 5 inferred decisions made during overnight Phase 1 autonomous execution. Founder ratifies or reverses each at retrospective:
1. Visual verification artifact storage path (`tests/visual-verify/<ship-id>/`)
2. `SKILL_APPROVAL.md` token format (per-skill sidecar markdown)
3. `CLAUDE_EXPERIMENTAL_AGENT_TEAMS` env var → Founder sets manually
4. Hook 1 (Critical path blocker) extends `gate-protected.sh`
5. `tests/visual-verify/` directory NOT pre-created in Phase 1

All 5 documented in INFERRED_DECISIONS.md "Phase 1 setup — inferred decisions (pre-tier-tracking)" section.
