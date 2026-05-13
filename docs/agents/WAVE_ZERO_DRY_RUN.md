# Wave Zero Dry-Run Protocol

Before Ship 5+8 fires under the new orchestration system, the 6-agent network exercises a trivial change end-to-end to verify the orchestration system itself functions. Catches integration bugs in agent coordination before they affect real work.

## Why this exists

Per Founder direction (Vision authoring session 2026-05-12): the 6-agent network now exists in committed governance (Orchestrator + Engineer + Critic + Flow Documenter + UI Polisher + End User). Adding 3 more (Performance + Security + Data Integrity) at their activation milestones brings the total to 9 agents across the Build + Launch roadmaps.

The orchestration system is now complex enough that "does it actually work end-to-end" is a real question. Wave Zero Dry-Run answers it cheaply, before real ships depend on the system functioning.

## What the dry-run exercises

A trivial change is selected — one that touches enough surfaces to exercise the agent network but is low-risk if it fails:

**Recommended dry-run change:** Update a Caddy Notes entry with a "Phase 1 complete — orchestration system live" announcement. Universal content for all members per locked governance.

This is trivial because:
- Single file modification (`src/pages/caddynotes.js`)
- Member-facing content (so End User testing applies)
- Version triple bump required (so version-bumper skill exercises)
- Visual verification applicable (Critic captures Playwright screenshots)
- No architecture changes, no security risk, no data integrity concerns
- Smoke + lint trivially pass
- Easy rollback if something goes wrong

## Dry-run flow

Step-by-step exercise of the orchestration system:

### 1. Vision authoring
Founder authors a 2-sentence Vision for the dry-run "ship":
> Members deserve to know when the orchestration system goes live. This update announces Phase 1 completion in Caddy Notes with the country-club voice and no architectural detail leaked.

### 2. Ship Plan drafting (Orchestrator)
Orchestrator creates `docs/agents/ships/DRY_RUN.md` per SHIP_PLAN_TEMPLATE.md. Exercises the template's structure end-to-end.

### 3. Pre-flight audit (Engineer)
Engineer runs P1 (Audit-first):
- Reads Ship Plan in full ✓
- Reads relevant code files (`src/pages/caddynotes.js`) in full ✓
- Verifies version state ✓
- Runs smoke against main to establish baseline ✓

### 4. Critic pre-engineering review
Critic walks the 12 rejection criteria against the Ship Plan. Trivial pass for most criteria. Verifies template structure complete. Exercises the Critic role end-to-end.

### 5. Engineer implementation
Engineer modifies `src/pages/caddynotes.js` per Vision + Ship Plan:
- Adds the announcement entry following Caddy Notes Writing Standard
- Applies version triple bump (utils.js APP_VERSION + package.json + sw.js CACHE_NAME)
- Updates flow documentation if applicable (likely not for this trivial change)

### 6. Flow Documenter check (new — first activation)
Flow Documenter activates for the first time. Verifies no flows were changed by the dry-run ship; commits initial `docs/flows/flows.json` and `docs/flows/flows.html` bootstrapped from current codebase audit.

This step also exercises the bootstrap protocol — even though the dry-run itself doesn't change flows, the activation work happens here.

### 7. Visual verification (Engineer + Critic per Correction 2)
Engineer captures Playwright screenshots of Caddy Notes page across all 4 browsers (chromium, firefox, webkit, msedge). Critic reviews screenshots — verifies announcement renders correctly.

### 8. End User sub-agent sweep (new — first activation)
End User activates for the first time. Spawns all 5 sub-agents:
- Beginner: reads Caddy Notes, verifies plain-language announcement is understandable
- Mid-handicap: verifies tone matches country-club voice
- Scratch: verifies no stat-related context omitted
- Lone Wolf: verifies announcement doesn't assume league membership
- League Commissioner: verifies no commissioner-specific context missing

Trivial findings expected; sub-agent profiles exercise.

### 9. Critic final review
Critic verifies all acceptance criteria met. Reviews:
- Flow Documenter activation completed cleanly
- End User sub-agent sweep completed cleanly
- Visual screenshots green
- Smoke + lint + visual all pass
- `.claude/state/last-verify.json` written with all-green state

### 10. Autonomous push (per Correction 1)
Push protection hook reads `.claude/state/last-verify.json`. All fields green. Push fires autonomously.

### 11. Production verification
Engineer verifies production deployment:
- GitHub Pages build succeeded
- Caddy Notes entry visible on production
- Smoke still green on production

### 12. Retrospective
Founder reviews the dry-run end-to-end:
- Did each agent execute correctly?
- Did the parallel authorities collaborate cleanly?
- Were there friction points in the orchestration system itself?
- What lessons emerge about the system?

Lessons committed to `docs/agents/lessons-learned/WAVE_ZERO_DRY_RUN_LESSONS.md`.

## Success criteria

Dry-run passes when:
- All 12 steps complete without orchestration system failure
- Caddy Notes entry visible to members on production
- No agent disputes or escalations during execution
- `last-verify.json` state file written correctly with all fields
- Founder reviews retrospective and ratifies system readiness

If any step fails, retrospective captures the failure, fix applied to orchestration system itself (governance update, skill addition, hook adjustment, whatever), then dry-run re-runs until success.

## Failure response

If dry-run fails:
1. Capture failure mode at `docs/agents/lessons-learned/WAVE_ZERO_DRY_RUN_FAILURE_<DATE>.md`
2. Diagnose: governance gap, skill gap, hook bug, agent miscoordination, tooling issue
3. Apply fix to orchestration system (not to PARBAUGHS app)
4. Re-run dry-run
5. Repeat until success

The dry-run is allowed to take multiple attempts. Each failure improves the system. Once it passes cleanly, the orchestration system is verified for real ship execution.

## What this validates

Dry-run validates:
- Vision authoring → Ship Plan flow works
- Pre-flight audit catches obvious problems (or correctly passes trivial work)
- Critic 12 criteria framework functional
- Engineer + Critic coordination works
- Flow Documenter activation produces valid initial output
- End User activation produces 5 valid sub-agent reports
- Visual verification (Correction 2) works across all 4 browsers
- Last-verify state file written correctly
- Push protection hook reads state file correctly
- Autonomous push fires on green (Correction 1)
- Retrospective process works

## What this does NOT validate

- Real architectural decisions (the dry-run is trivial)
- Real load behavior (Performance Agent not active yet)
- Real security surfaces (Security Auditor not active yet)
- Real data integrity invariants (Data Integrity Agent not active yet)
- Real cross-platform sync (Mobile app doesn't exist yet)

These get validated as their respective agents activate at later milestones.

## When dry-run runs

Once, before Ship 5+8 fires. Wave 1 first ship under new orchestration does NOT execute until dry-run has passed.

If governance evolves significantly during Build Roadmap (new agents added, major protocol changes), Founder may call additional dry-runs at wave boundaries to validate. Optional, not required.

## Activation

Dry-run fires after Phase 1 setup completion + memory migration + all governance commits. Specifically: after the Phase 1 setup commit ratification, but before Founder authors W1.I4 Vision and Ship 5+8 fires.

Orchestration team triggers dry-run autonomously per this protocol; Founder reviews retrospective at completion.

## Audit cadence

- Once at orchestration system activation (this dry-run)
- Optional at wave boundaries if significant governance changes occurred
- Always after any major orchestration system overhaul
