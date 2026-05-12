# Graduated Autonomy

The framework for how agent autonomy expands over time as decision-match accuracy is proven.

## Why this exists

Founder cannot ratify every micro-decision indefinitely without becoming the bottleneck. Agents cannot make every micro-decision without drift from Founder intent. Graduated autonomy is the path: agents earn autonomy by demonstrating they match Founder rulings consistently, in increasing tiers, with permanent-Founder-approval categories carved out.

The framework also includes a feedback loop: when an inferred decision is reversed, the pattern recognition adjusts. Reversal is information; the system learns.

## Pattern threshold

Decision-match accuracy. Orchestrator's recommendations are tracked against Founder's actual rulings at retrospective review. When match accuracy exceeds **95% over the minimum ship count** for a category, that category becomes eligible for graduation to the next tier.

## Tier 1 — Lowest risk, graduates earliest

**Threshold:** 95% match over 10 ships.

**Categories that graduate:**
- Skill triggering false-positive fixes (when a skill loads in wrong context)
- Skill content drafting (initial drafts, still requires Founder approval to commit)
- Backlog item severity tagging
- Phase report formatting decisions
- Member-relevance classification for Caddy Notes entries

**What this means in practice:**
- Orchestrator drafts skill content without Founder pre-approval (Founder still ratifies before commit)
- Orchestrator tags backlog severity without Founder review (Founder may override at retrospective)
- Phase reports formatted at Orchestrator discretion
- Caddy Notes entries classified for relevance without Founder approval

---

## Tier 2 — Medium risk, graduates after Tier 1 proven

**Threshold:** 95% match over 20 ships (after Tier 1 graduations stable).

**Categories that graduate:**
- Skill modifications to existing approved skills
- Hook false-positive adjustments (loosening overly-strict matchers)
- Ship plan phase-breakdown decisions
- Member-facing Caddy Notes copy authoring
- Member-facing roadmap section drafting

**What this means in practice:**
- Orchestrator modifies existing skills to fix false-positives without Founder pre-approval
- Hook patterns adjusted to reduce noise without Founder approval (only loosening — tightening still requires approval)
- Ship plans broken into implementation phases at Orchestrator discretion
- Caddy Notes copy authored without Founder approval (universal content discipline already applies; leak protection enforced)
- Roadmap section in Caddy Notes drafted by Orchestrator without Founder review

---

## Tier 3 — Higher risk, graduates after Tier 2 proven

**Threshold:** 95% match over 30 ships (after Tier 2 graduations stable).

**Categories that graduate:**
- Hook scope additions (adding new patterns hooks check)
- New skill drafting + commit (currently requires explicit Founder approval per Q19)
- Engineer-Critic dispute resolution without Founder consultation
- Ship plan CTO Ruling decisions for non-Critical-Registry items

**What this means in practice:**
- New PreToolUse hook patterns added without Founder pre-approval (Founder reviews at retrospective)
- New skills committed to `.claude/skills/` without `SKILL_APPROVAL.md` token requirement
- Engineer-Critic disputes resolved by Orchestrator without Founder synchronous involvement
- Ship plan ambiguities not touching CFR resolved by Orchestrator's reading of Founder intent

---

## Permanent Founder-approval items — NEVER graduate

These decisions remain Founder-only forever, regardless of accuracy or tier progression:

- **Critical Feature Registry triggers** — all 11 categories per CRITICAL_FEATURE_REGISTRY.md
- **Sanity Halt severity calls** — all 9 categories per SANITY_HALT.md
- **Vision section content** — Founder authority on every ship, forever
- **Roadmap structure changes** — Founder edits ROADMAP.md; agents acknowledge
- **Cost-incurring architecture** — per Q44 Lock 3
- **Wave-to-wave gate ratifications** — Founder ratifies wave closes
- **P0/P1 production rollback decisions** — Founder synchronous presence required for severity P0 (production down / data loss) and P1 (significant member impact). P2/P3 corrective stays autonomous.

Push to remote graduates per Correction 1: autonomous on green (smoke + lint + visual verification). Founder override remains available as escape hatch.

## Decision-match tracking

The Orchestrator maintains decision-match tracking via INFERRED_DECISIONS.md:

- Every inferred decision logged with tier classification
- Founder rules at retrospective: ratify, reverse, defer
- Match accuracy computed per category
- When threshold met (95% over minimum ships), category eligible for graduation

Orchestrator notifies Founder at retrospective: "Category X is eligible for graduation to Tier Y. Match accuracy: Z over N ships."

## Founder ratification of graduation

Founder rules on graduation eligibility:
- **Accept** — category graduates; new autonomy active going forward
- **Defer** — category remains at prior tier; revisit at later retrospective
- **Reverse a prior graduation** — category demotes back to prior tier; rare but possible if pattern recognition has drifted

Graduations are NOT automatic. Threshold eligibility surfaces the question; Founder makes the call.

## Reversal feedback loop

When an inferred decision is reversed:

1. Reversal logged to INFERRED_DECISIONS.md with Founder rationale
2. Pattern recognition adjusts:
   - What pattern did Orchestrator/Engineer think this matched?
   - What pattern does Founder say it actually matches?
   - Where is the gap in the team's reading of Founder intent?
3. Future similar decisions follow the corrected pattern
4. Match accuracy recomputed; category may lose graduation eligibility if reversal pattern emerges
5. If reversal pattern is systemic, category may be DEMOTED back to lower tier

This is the learning loop. Reversals are not punishment; they are information.

## What this enables

- Founder bandwidth scales as agents prove themselves
- Operational micro-decisions stop bottlenecking strategic Founder attention
- Strategic decisions remain Founder-only forever
- Audit trail of every inferred decision keeps the system accountable
- Reversal feedback keeps the system honest

## What this does NOT enable

- Agents do not autonomously decide what is Critical Feature Registry territory
- Agents do not autonomously decide what is Sanity Halt territory
- Agents do not autonomously author Vision sections
- Agents do not autonomously modify ROADMAP.md
- Agents do not autonomously make P0/P1 rollback decisions (P2/P3 corrective is autonomous)
- Agents do not autonomously ratify wave gates
- Agents do not autonomously promote graduation tiers (Founder rules)

Push to remote IS autonomous when smoke + lint + visual verification all green. Push protection hook blocks only on failed-or-missing-verification state.

## Initial state

Per Correction 3 (Phase 1 commit): all Tier 1 categories start active. Agents act under autonomous-by-default mode for Tier 1 operations; Founder reviews log at retrospective. Tier 2 and Tier 3 still require Founder pre-approval until they graduate via the 95%-match threshold.

Tier 2 first graduation eligibility: 20 ships under new orchestration with 95% match accuracy on Tier 1 categories sustained over that window.

Tracking begins at first ship under new orchestration (Ship 5+8). Phase 1 setup itself is governance bootstrap, not a tracked ship — its inferred decisions (visual-verify path, SKILL_APPROVAL.md format, env-var ruling) are pre-tier-tracking and logged in INFERRED_DECISIONS.md for transparency only.

## Audit cadence

Orchestrator surfaces graduation eligibility at retrospective when threshold met. Founder rules. No automatic promotion.
