# Critical Feature Registry

The 11 categories of decisions that require explicit Founder approval. Permanent Founder-approval territory; does not graduate to agent autonomy regardless of decision-match accuracy.

## How this registry is used

The Orchestrator audits every Ship Plan against this registry during pre-flight review. If any category is triggered, Orchestrator escalates to Founder per P2 (CFR escalation protocol) before engineering work begins.

The Engineer monitors for CFR triggers during implementation. If one surfaces mid-flight, Engineer halts and escalates via Orchestrator.

The Critic verifies the Ship Plan addressed CFR triggers identified at pre-flight, and watches for missed triggers during implementation review.

Push to remote is NOT a CFR trigger. Per Correction 1, push graduates to autonomous-on-green (smoke + lint + visual verification). See `CTO_INTERFACE.md` → "Autonomous push protocol".

---

## Category 1 — Feature additions

**Trigger:** Adding a new member-facing feature to PARBAUGHS.

Not a "feature variant" or "refinement of existing feature" — a genuinely new capability that members did not previously have access to.

Examples:
- Adding GPS course visualization (new capability — Wave 3 M3 lock)
- Adding swing analyzer (Launch Phase C)
- Adding training drills (Launch Phase C)
- Adding a new game format
- Adding any new social interaction type

Not examples:
- Polishing an existing feature
- Adding a state to an existing feature (empty / loading / error)
- Refactoring without changing member behavior

**Founder action:** Vision authoring + Ship Plan ratification. Vision must answer: why this feature, why now, what does success look like for members.

---

## Category 2 — Feature reworks requiring human testing

**Trigger:** Modifying an existing feature in ways that change member workflow significantly.

Examples:
- Rewriting onboarding flow (Wave 1 W1.S14 lock)
- Restructuring scorecard input model
- Changing handicap computation methodology
- Redesigning league chat surface

Not examples:
- Visual refinement of existing feature
- Bug fix in existing feature
- Performance improvement to existing feature

**Founder action:** Vision authoring + Founder synchronous presence during implementation if scope is high-risk. UAT may be required before ship close.

---

## Category 3 — Paid implementations or API additions

**Trigger:** Any decision to use a paid service or external API.

Examples:
- Stripe integration (Launch Phase A)
- Apple Developer Program enrollment (Wave 3 M1)
- Twilio for SMS
- Any third-party API with usage costs
- Google Play Account ($25 one-time at Launch Phase B)

**Founder action:** Comparison matrix required (3+ options). Free-tier first preference. Founder ratifies cost-incurring choice. Per Q44 Lock 3, scalability mandate applies.

---

## Category 4 — Security risk vectors

**Trigger:** Changes that affect authentication, authorization, data exposure, or attack surface.

Examples:
- Firestore security rules changes
- Authentication flow changes
- Permission tier changes
- Adding any data exposure (more data visible to more members)
- Adding any third-party script or library that runs in member browsers

**Founder action:** Founder ratifies security-affecting change. Sanity Halt category 5 backstops if implementation introduces unmitigated risk.

---

## Category 5 — Data architecture changes

**Trigger:** Schema changes to Firestore documents that have multiple consumers.

Examples:
- Changing the shape of `members/{id}` document
- Changing the shape of `rounds/{id}` document
- Changing the shape of `leagues/{id}/chat/{messageId}` document
- Adding required fields to existing documents
- Removing fields from existing documents

Not examples:
- Adding optional fields to documents (with null-safe consumers)
- Adding new collections (no existing consumers)

**Founder action:** Cross-surface dependency audit (Criterion 12) per Ship Plan. Founder ratifies schema migration plan. Validator strictness pattern enforced (accept missing fields during migration window).

---

## Category 6 — Identity & permission architecture

**Trigger:** Changes to how identity is established or how permissions are evaluated.

Examples:
- Wave 4 Discord-style usernames + discriminators (locked roadmap item)
- Adding new permission tier
- Changing existing permission tier behavior
- Changing role gating on any surface

**Founder action:** Identity changes touch every surface; Founder synchronous presence required for migration ships (Wave 4 I2 in particular). Member communication via external channels (group text) coordinated.

---

## Category 7 — Multi-league architecture

**Trigger:** Changes that affect how members participate in multiple leagues or switch between leagues.

Examples:
- League switcher implementation
- Cross-league data sharing
- League invitation flows
- Spectator-tier across multiple leagues

**Founder action:** Multi-league architecture has cascading implications on every league-scoped query. Founder ratifies architectural decision before any league-related ship.

---

## Category 8 — Mobile Clubhouse capabilities

**Trigger:** Adding or changing native capabilities in the Capacitor mobile app.

Examples:
- Adding new Capacitor plugin
- Changing native permission flow
- Adding push notification category
- Adding new sensor integration

Not examples:
- UI changes within already-shipped mobile surface
- Web-fallback adjustments

**Founder action:** Native capabilities affect both iOS and Android. Founder ratifies plugin addition. Apple Developer Program enrollment required for new capabilities that need re-review (Wave 3 M1 lock).

---

## Category 9 — Onboarding architecture

**Trigger:** Changes to how new members enter the platform.

Examples:
- Onboarding flow rewrite (Wave 1 W1.S14 lock)
- New signup path (lone wolf vs league-invited)
- TestFlight enrollment process (Founder-managed manual per lock)
- First-time member experience

**Founder action:** Founder synchronous presence during onboarding ship implementation. First-impression surface; mistakes lose members permanently.

---

## Category 10 — Compliance & legal

**Trigger:** Changes that touch privacy, terms, data export, or jurisdictional compliance.

Examples:
- Privacy policy changes
- Terms of service changes
- GDPR / CCPA data export implementation
- Age verification
- Account deletion flow

**Founder action:** Founder ratifies legal-affecting change. Generic compliance language not used — Founder authors specific terms when needed.

---

## Category 11 — Cost-incurring implementations

**Trigger:** Any architectural decision that introduces ongoing or scaling costs.

Per Q44 Lock 3.

Examples:
- Firebase Storage usage that scales with member content (image attachments — Wave 1 W1.S12 lock includes images)
- Cloud Function invocation frequency that scales with member activity
- Listener-everywhere patterns (read budget violations)
- Server-rendered image generation (vs client-side Canvas)
- Any service with metered pricing

**Founder action:**
- Comparison matrix required (3+ viable options)
- Free-tier first preference
- 10x scaling architecture documented (current 20 → 200 → 2000)
- Migration path documented if approach is interim
- Founder ratifies cost-incurring choice
- Engineer instruments cost metrics from day 1 (cost halt mandate per Pass 1)

---

## What is NOT a CFR trigger

- Visual refinements within existing design spec
- Bug fixes that don't change architecture
- Performance optimizations within existing architecture
- Adding states to existing surfaces (empty / loading / error)
- Token additions per design spec amendment process
- Smoke test additions
- Helper extractions to reduce duplication
- Caddy Notes content (Orchestrator publishes universal content without approval)

## What graduates and what does not

CFR triggers do NOT graduate. They remain Founder-approval territory regardless of decision-match accuracy or graduated autonomy tier progression.

Graduated autonomy applies to operational decisions (skill modifications, hook adjustments, ship plan phase breakdowns) — not strategic decisions (Vision, CFR, Sanity Halt, Roadmap, Push, Wave gates, Rollback).

## Audit cadence

Orchestrator audits this registry:
- At every Ship Plan drafting
- At every retrospective (have new categories surfaced?)
- At every wave gate (does category coverage still feel right?)

Founder may add categories at any time. New categories are not retroactive; existing ships under prior registry are unaffected.
