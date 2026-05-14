
# Team Proposes; Agent 2 Ratifies

The default operating principle for orchestration-team escalations to
Agent 2 (Claude.ai planning agent). Supersedes the blank-escalation
pattern observed in recent Q1-Q7 routings on W1.S1.b. When this
principle conflicts with another, this one wins for escalation-
discipline questions. Founder is the only override.

## Founder principle (recorded verbatim)

> "When the orchestration team has a question that would otherwise
> route to Agent 2 (Claude.ai planning agent), the team authors a
> proposed answer with rationale BEFORE escalating. Agent 2 ratifies
> or refines. Default mode: team proposes; Agent 2 reviews.
>
> Escalation without proposed answer is reserved for:
>   - Vision-level decisions (what to build, why, for whom)
>   - Strategic trade-offs that require Founder taste or preference
>   - Cross-cutting architecture that affects multiple ships
>   - Information Agent 2 or Founder uniquely has
>
> Code implementation questions, technical fallback chains, smoke
> test scenario enumeration, phase sequencing within a ship — these
> are TEAM decisions to propose, not Agent 2 questions to answer.
>
> Critic gates escalations: if a question lacks proposed answer +
> rationale, Critic blocks the escalation and returns it to the team
> for authoring."

## Founder framing (recorded verbatim)

> "It should only come to us when they need vision not a how to implement"
>
> "The team is more capable than recent escalation patterns suggest.
> Trust the substrate. Trust AMD-009. Trust Critic. Make decisions.
> Author proposed answers. Ship complete. Move forward."

## The escalation taxonomy

### Category A — Blank escalation permitted

| Category | Example |
|---|---|
| Vision-level decision | "Should leagues have custom branding in Phase 4?" — what to build, why |
| Strategic trade-off | "Choose between Phase 3 ship A (TestFlight closed beta) vs ship B (HQ first)" — Founder taste |
| Cross-cutting architecture | "Move Firestore from us-central1 to multi-region" — affects every ship |
| Information uniquely held | "Founder's X.com session to extract reference frames" — Founder credentials |

### Category B — Team MUST propose answer + rationale

| Category | Example |
|---|---|
| Code implementation | "How to wire the sidecar's cron task" — team designs and proposes |
| Technical fallback chain | "Plan A / B / C for SVG icon library — what's the fallback if axe-core flags AAA contrast for inline brass?" — team chains |
| Smoke test scenario enumeration | "What scenarios does AMD-012 require for sunlight mode?" — team enumerates per the 6 minimums |
| Phase sequencing within a ship | "Does Phase 5 AAA audit block on Phase 2 token refinement?" — team analyzes independence |

The categories are not exhaustive. The discriminator is: **does answering this require Founder taste or vision, or does it require engineering judgment + reference to existing substrate?** Engineering judgment is team-resolvable; Founder taste is escalation-warranted.

## How proposed answers are authored

A proposed answer to a question includes:

1. **Restate the question** in single-sentence form.
2. **State the proposed answer** as a decision, not a hedge. "Yes, ship as (b) two-ship split" not "I lean toward (b) but maybe (a)."
3. **Cite the rationale**, citing specific files / commits / prior amendments / round-trip results / etc. ("Per AMD-009 P3 + the cost-of-context-switching cited in W1.S1.b.md Phase boundary analysis, single ship is the AMD-009-coherent unit.")
4. **Enumerate the alternatives considered and dismissed**, with one-line rationale for dismissal each.
5. **Identify failure modes** if the proposed answer is wrong (what breaks, what's the rollback).

A well-authored proposed answer is **complete enough that Agent 2 can ratify without authoring** — just confirm or refine. If the answer is so thin that Agent 2 must author the rationale itself, the team didn't do its job.

## How Critic gates escalations

Critic blocks an escalation when:

- The question lacks a proposed answer (blank escalation that doesn't fit Category A)
- The proposed answer lacks rationale citing specific substrate
- The proposed answer is a hedge ("maybe X, but also Y?") rather than a decision
- Alternative considerations are absent
- The question is a Category B (engineering judgment) routed as Category A (blank)

Critic returns the escalation to the team with the gap stated. The team re-authors. Escalation proceeds only when Critic ratifies the proposed-answer quality.

This mirrors AMD-011's proposal-readiness 8-criteria gate, but for escalations rather than proposals. Same pattern: Critic gates quality at the boundary; team's job is to produce a Critic-passable artifact.

## Effect on in-flight W1.S1.b

The 7 questions Agent 3 routed to Agent 2 in the previous consolidated report (W1.S1.b: Phase sequencing / Token cost / Fallback chain / Smoke coverage / Single-vs-split / Refinement values / felt-soft scope) are **blank escalations**. Per this amendment they must be re-authored as proposed answers + rationale.

Re-authoring is the immediate next deliverable (Phase B of the four-part Founder directive 2026-05-14).

## What this amendment intentionally does NOT do

- Does NOT eliminate Agent 2 — strategic / vision-level work stays Agent 2's domain (Category A).
- Does NOT make team decisions unilateral — Agent 2 ratifies; if Agent 2 refines, the refinement is binding.
- Does NOT bypass Critic — Critic's role grows (now gates escalation quality in addition to ship quality).
- Does NOT permit team to claim "this is engineering" when the question is actually vision (e.g., "what features should the app have" is not engineering).

## Cross-references

- AMD-009 SENIOR_ENGINEERING_STANDARD (governs underlying decision discipline; this amendment specializes for escalation)
- AMD-011 AUTO_EXECUTE_PROTOCOL (gates proposal-readiness at a different boundary)
- Three-agent model in CLAUDE.md (Zach / Claude.ai / Claude Code authority structure preserved)
- Founder framing recorded verbatim above

## Pre-escalation Critic checklist

Every escalation gets these Critic gates added to whatever existing gates already exist:

```
[ ] Question is restated as single sentence
[ ] Category established (A vs B) — Category B requires proposed answer
[ ] Proposed answer is a decision, not a hedge
[ ] Rationale cites specific substrate (file path, commit, amendment, etc.)
[ ] Alternatives considered + dismissed with one-line rationale each
[ ] Failure modes of the proposed answer enumerated
[ ] Question is genuinely Category A (blank-permitted) OR proposed answer is Category-B-compliant
```

Critic blocks until all gates pass.
