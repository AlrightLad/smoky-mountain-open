# Inter-Wave Protocol

What happens between waves. Hybrid checklist: a minimum set of activities for every wave transition, plus wave-specific additions for the unique work each transition requires.

## Why this exists

Each wave-to-wave transition is a natural pause. Without explicit structure, things get skipped, drift accumulates, and the next wave starts with stale state. The inter-wave protocol ensures core hygiene happens every transition, and wave-specific work happens at the right transition.

---

## Minimum checklist — every wave transition

Run at every wave-to-wave transition, in order. No transition advances without completing these.

### 1. Retrospective review of closing wave

Per RETROSPECTIVE_REVIEW.md per-wave structure:
- Wave gate verification
- Aggregate inferred decision review
- Per-ship lessons aggregated
- Backlog reconciliation
- Graduated autonomy wave review

### 2. Lessons-learned commit

Commit `docs/agents/lessons-learned/WAVE_N_LESSONS.md` capturing wave themes:
- Process improvements
- Skill / hook proposals
- Governance doc adjustments
- Roadmap implications

### 3. Backlog reconciliation

- Items from closing wave that should reshape next wave's plan
- Items resolved during wave → moved to `backlog/closed/`
- Items deferred or rescoped → updated in INDEX.md
- New items captured during wave → severity tagged

### 4. Founder explicit "Wave N closed, Wave N+1 fires" ratification

Founder records explicit ratification in the closing ship's report or in `lessons-learned/WAVE_N_LESSONS.md`. Until ratification, no Wave N+1 ship fires.

---

## Wave-specific additions

In addition to the minimum checklist, each wave transition has specific activities the unique transition requires.

### Wave 1 → 2 transition

**Design bot per-page mock generation for HQ:**
- Wave 1 production state is the input
- Design bot generates per-page mocks at 1:1 fidelity for each HQ surface
- Founder confirms each page individually before file packaging
- Shared file packaging: design bot drafts, Founder reviews/edits, agents consume

**Wave 1 functional baseline locked:**
- All Wave 1 ships shipped and deployed to production
- P8 visual smoke coverage chromium 100%
- HQ functionally complete (no "needs functionality" — only "needs design refinement")

**Phase 2A design system spec ratified:**
- For mobile: already done (Pass 2 of design bot work, committed at `docs/CLUBHOUSE_SPEC.md`)
- For HQ: design bot may amend spec during Wave 2 per-page work; amendments committed additively

**File packages prepared:**
- Per-page briefs in a consistent format
- Token JSON / YAML for design tokens
- Component specs
- Interaction specs
- Motion specs
- Breakpoints
- Accessibility specs

### Wave 2 → 3 transition

**Wave 2 staged content production deploy (the "redesign reveal"):**
- All Wave 2 staged content deploys to production simultaneously
- Member-facing redesign reveal communicated via Caddy Notes wave-cadence update + external channels per locked protocol

**Mobile design system handoff confirmed:**
- Wave 3 inherits the mobile design system from Phase 2A (already specified)
- M1 (Capacitor harness) is the first Wave 3 ship and consumes the system spec

**Apple Developer Account activation planning:**
- Founder begins enrollment at developer.apple.com if not already done
- $99/year; 24-72h Apple review (sometimes longer for first-time enrollees)
- Required by M6 TestFlight; ideally enrolled before M1 fires

### Wave 3 → 4 transition

**TestFlight enrollment of founding 20:**
- Founder-managed manual per Pass 1 § 3.2 lock
- Each founding member receives individual text or email with TestFlight link + 1-sentence what-this-is
- Member installs TestFlight, accepts invitation, installs Parbaughs Clubhouse build
- Founder confirms each member successfully installed before Wave 4 fires

**Identity architecture pre-work review:**
- Wave 4 ships I1-I5 are identity migration (Discord-style usernames + discriminators + title separation)
- Pre-work review confirms migration plan, downtime expectations, fallback paths
- Founder ratifies migration plan with founding crew communication coordinated via external channels

**Founder-led migration communication plan:**
- Group text to founding 20 before I2 fires (the migration ship)
- Caddy Notes wave-cadence update
- In-app crisis banner if migration affects login flow
- Post-migration verification per member

### Wave 4 → Build complete transition

**Final migration confirmation:**
- All 20 founding members migrated to new identity primitive
- Each member's username#XXXX confirmed accessible
- Each member's titles (Commissioner, Founder, Champion) properly separated from username

**Legacy cleanup verification:**
- Legacy username code paths removed
- No file in codebase references pre-migration identity model
- Smoke covers post-migration identity flows

**Build Roadmap close ratification:**
- Founder explicit ratification: "Build Roadmap complete"
- Interlude period begins (Founder-controlled length)
- No agent work during interlude
- Founder uses interlude for: pricing model definition (Launch Phase A prep), monetization research, marketing strategy, Phase C feature scope confirmation

**Launch Phase A activation gate:**
- After interlude, Founder ratifies "Launch Phase A activated, agents resume"
- Launch governance applies (per LAUNCH_GOVERNANCE.md) — Founder synchronous presence per ship, modified CFR handling, Sanity Halt preserved

---

## Build → Launch transition

After Wave 4 close + interlude period, Launch Roadmap begins. This is a major mode shift:

- Build governance (autonomous chains, graduated autonomy, audit-first agent execution) ends
- Launch governance (Founder synchronous presence, modified CFR handling, agents-under-Founder-direction) begins

See LAUNCH_GOVERNANCE.md for full Launch governance specification.

---

## Inter-phase transitions within Launch

Launch has three phases (C → A → B per Q45 lock). Phase transitions are smaller than wave transitions but still have inter-phase activities:

### Phase C → Phase A transition

- Phase C ships (swing analyzer, training drills) shipped and deployed
- Founder defines pricing model (this is the gate item)
- Comparison matrix for payment processor
- Phase A first ship fires only after pricing model + processor decisions ratified

### Phase A → Phase B transition

- Phase A monetization shipped and tested with founding 20 (grandfather logic if applicable)
- Apple Developer Account active (carried forward from Wave 3)
- Google Play Account activation if needed ($25 one-time)
- App store metadata authored (Caddy Notes voice for description per Pass 4 M6.3)
- AS1 (iOS submission) first ship of Phase B

### Phase B → Launch complete

- AS1 + AS2 both approved + published on app stores
- Public launch communications via external channels
- Production monitoring escalated
- Build Phase disclaimer removed from footer per Pass 1 § 3.4

---

## What if an inter-wave activity is skipped?

Don't skip. The activities are minimum because they catch what slips between waves.

If a specific activity does not apply (e.g., no founding-crew communication needed because nothing member-affecting in the wave), Orchestrator notes this in the wave-close ship report with rationale.

Founder rules on whether the activity actually doesn't apply or whether the activity needs to happen.

## Founder discretion within structure

The protocol is structure, not rigidity. Founder may:
- Add wave-specific activities not listed here (recorded for the specific transition)
- Defer specific activities to a later transition with documented rationale
- Compress or expand timing as the situation demands
- Run inter-wave activities in different order than listed

What Founder may NOT do:
- Skip the minimum checklist
- Advance to next wave without explicit ratification
- Defer lessons-learned commit indefinitely
- Skip backlog reconciliation
