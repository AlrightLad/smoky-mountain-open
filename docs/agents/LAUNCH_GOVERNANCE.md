# Launch Governance

Modified governance for the Launch Roadmap. Build Roadmap governance applies with specific modifications acknowledged in the strategic Q&A (Q56 lock).

## Why Launch governance differs from Build governance

Build Roadmap fires under agent-autonomous execution. Founder directs at a high level; Orchestrator + Engineer + Critic execute under the governance frameworks in this directory. Founder asynchronous availability is the default mode.

Launch Roadmap is higher-stakes:
- Phase C ships member-facing features that affect retention before monetization
- Phase A introduces payment infrastructure — financial, legal, and trust implications
- Phase B exposes the platform to app store review processes — irreversible decisions affect launch success

Launch governance preserves the Build governance framework but with modifications:
- Founder synchronous presence per ship (no autonomous chains)
- CFR items inherent to Launch scope acknowledged, not triggering halt+escalate
- All other governance preserved

---

## Modifications from Build governance

### 1. Founder synchronous presence per ship

Build Roadmap: Founder asynchronous; agents chain ships per graduated autonomy.

Launch Roadmap: Founder synchronous per ship. Agents do not advance ship status without Founder presence and ratification at each phase boundary.

What this means in practice:
- Ship Plan ratification: Founder synchronous
- Engineering phase boundaries: Founder synchronous (per phase, not per commit)
- Critic approval: Founder synchronous before status advance to Shipped
- Push: Founder-only (unchanged from Build)
- Retrospective: Founder synchronous (unchanged from Build)

### 2. Critical Feature Registry items inherent to Launch scope

Build Roadmap: CFR triggers halt + escalate.

Launch Roadmap: CFR triggers inherent to Launch scope are acknowledged at Ship Plan drafting and do NOT halt+escalate during implementation.

Inherent CFR triggers:
- **Category 3 — Paid implementations.** Phase A IS payment integration. Stripe (or equivalent) implementation is the ship's scope, not a CFR trigger to escalate.
- **Category 9 — Onboarding architecture.** Phase B may include onboarding flow refinements; acknowledged as Launch scope.
- **Category 10 — Compliance & legal.** Phase A and Phase B both touch terms of service, payment compliance, app store policy compliance — inherent to Launch.
- **Category 11 — Cost-incurring implementations.** Phase A monetization is itself cost-incurring infrastructure. Acknowledged at Ship Plan; comparison matrix still required per cost halt mandate.

Non-inherent CFR triggers still halt+escalate normally:
- Category 1 — New feature additions beyond the Launch phase scope (e.g., adding a new game format mid-Phase-A)
- Category 4 — Security risk vectors not part of Launch scope
- Category 5 — Data architecture changes not required by Launch scope
- Category 6 — Identity & permission architecture changes (these were Wave 4, not Launch)
- Category 7 — Multi-league architecture changes
- Category 8 — Mobile Clubhouse capabilities beyond Launch scope

### 3. Sanity Halt preserved

All 9 Sanity Halt categories apply unchanged. Production safety, data loss, data exposure, security failures, drift, Founder protection, cost-incurring architecture, smoke failures, and visual verification failures all halt and escalate normally.

Launch is higher-stakes; Sanity Halt is more important, not less.

### 4. All hooks and skills preserved

`.claude/settings.json` hooks remain active during Launch:
- Critical path blocker
- Secrets scanner
- Schema mutation alarm
- Governance protection
- Approval-gated paths
- Push protection

`.claude/skills/` skills remain active and may expand during Launch.

### 5. Ship Plan template unchanged

SHIP_PLAN_TEMPLATE.md applies to Launch ships. Vision authored by Founder. Acceptance criteria concrete. Scalability architecture documented. CFR triggers identified (acknowledged or escalated per above).

### 6. Engineer + Critic roles unchanged

Same audit-first protocol for Engineer. Same 12 rejection criteria for Critic. Same gap inference protocol per P6.

### 7. Graduated autonomy preserved BUT Founder synchronous presence trumps

Even at Tier 3, Launch ships require Founder synchronous presence. Graduated autonomy applies to operational decisions during implementation; ship-level advancement requires Founder.

---

## Launch phase-specific governance

### Phase C — Golf Features

**Cost halt + scalability mandate especially applies:**
- Swing analyzer involves video upload + storage + analysis approach
- Storage costs scale with member engagement
- Analysis approach (on-device, server-side, third-party API) has very different cost profiles
- Comparison matrix MANDATORY (3+ options)
- Free-tier first preference
- Migration path documented if interim approach chosen

**Ship-level approvals:**
- Each Phase C ship requires Founder Ship Plan ratification
- Each Phase C ship requires Founder presence at Critic approval
- Founder may compress this per ship if comfort level is high (record in ship report)

### Phase A — Monetization

**Pricing model definition is the gate:**
- Phase A cannot fire until Founder defines pricing model
- Defined during Build → Launch interlude period
- Pricing model determines all Phase A scope (subscription vs per-league vs paid features vs transaction fees)

**Payment processor decision:**
- Comparison matrix required (Stripe, PayPal, Square, etc.)
- Free-tier first preference (most processors have transaction-based pricing, not subscription)
- App store policy compliance considered (web vs in-app purchase routing)
- Founder ratifies processor choice before any integration work begins

**Grandfather logic for founding 20:**
- If pricing model affects founding crew: explicit grandfather strategy
- Communicated via external channels per locked protocol
- Caddy Notes wave-cadence update describes grandfather

**Compliance considerations:**
- Terms of service updated
- Privacy policy updated
- Tax handling per jurisdiction
- Refund / chargeback flow

### Phase B — App Store Submission

**App store policy compliance:**
- iOS App Store guidelines reviewed before submission
- Google Play policies reviewed before submission
- Content rating accurate
- Privacy declarations accurate (Capacitor plugin permissions disclosed)

**Metadata authoring:**
- App description (Caddy Notes voice per Pass 4 M6 lock)
- Screenshots (from M2 + M3 mobile)
- Privacy declarations
- Age rating
- App icon final

**Review preparation:**
- Test account credentials for app store reviewer
- Demo video if required
- Support contact info
- Submission timing — avoid major member events

**Post-submission:**
- Monitor review status
- Respond to reviewer feedback synchronously
- Re-submit if rejected
- Coordinate public launch timing once approved

---

## What stays unchanged from Build

- Three-agent system (Orchestrator + Engineer + Critic)
- Audit-first protocol for Engineer
- 12 rejection criteria for Critic
- All 11 CFR categories (with Launch-scope inherent acknowledgments)
- All 8 Sanity Halt categories
- Cost halt + Scalability mandate
- Graduated autonomy tier framework (with Founder synchronous overlay)
- Ship Plan template
- All 9 protocols (P1-P9)
- Caddy Notes universal content discipline
- Backlog hybrid structure
- Memory architecture (persistent → committed; session-internal → memory; ship-close clearing)
- Single-machine constraint

---

## When Launch ends

Launch Phase B completes when:
- iOS app live on App Store
- Android app live on Google Play
- Public launch communications via external channels complete
- Production monitoring active
- Build Phase disclaimer removed from footer

After Launch complete, the orchestration system returns to Build-style governance for ongoing maintenance and feature work. New strategic phases may be defined by Founder; new governance documents may be added to this directory at that time.
