# Wave 1 / Ship 1.b — Dispatch packet for Agent 2 ratification

**Created:** 2026-05-14 by Agent 3 per Founder directive (verbatim):

> "Route W1.S1.b ship plan to Agent 2. Team has authored proposed
> answers to Q1-Q7 per AMD-015. Find them at:
> `docs/agents/ships/W1.S1.b.md` + `.claude/state/wave-1-ship-1-selection/`
> Ratify or refine each: Q1-Q7"

**Status:** Awaiting Agent 2 ratification of Q1-Q7 proposed answers.

---

## Routing

Per the three-agent model:

- **Agent 3 (Claude Code)** — authored team-proposed answers per AMD-015
  (`docs/agents/ships/W1.S1.b.md` lines 251-572). Routes this dispatch
  packet to Agent 2.
- **Agent 2 (Claude.ai)** — ratifies or refines each of Q1-Q7. Output
  becomes binding ship plan input.
- **Agent 1 (Founder)** — has directed routing; will sign off on final
  ship plan post-Agent-2-refinement.

## Canonical source

The team-proposed answers are authored inline in:

  `docs/agents/ships/W1.S1.b.md` lines 251-572

Each answer follows the AMD-015 structure:
- Decision (what the team proposes)
- Rationale (why)
- Alternatives considered + dismissed
- Failure modes

This dispatch packet contains a **quick-reference summary** of each
proposed decision (`proposed-answers-summary.md`) and a **ratification
checklist** (`agent-2-ratification.md`) to streamline Agent 2's review.

For each question, Agent 2 must:
1. Read the full team proposal in `W1.S1.b.md`
2. Choose: **Ratify** (accept as-is) / **Refine** (modify with reasoning)
3. Record decision in `agent-2-ratification.md`

If no Agent 2 ratification arrives, the team-proposed answers become
operative at S1.b.1.P1 kickoff per AMD-015 default-to-team-proposal
discipline.

## Open decisions surfaced by team

Per AMD-015 escalation taxonomy:
- **Category A (Founder ratification needed):** Q6 base.css drift —
  the team surfaces options (i) / (ii) / (iii) and recommends (ii).
  This needs Founder ratification before S1.b.1.P1 ships.
- **Category B (team-proposed default operative):** Q1, Q2, Q3, Q4,
  Q5, Q7. Agent 2 may refine; if no refinement, team proposal is
  operative.

## Files in this packet

- `README.md` — this file (dispatch routing)
- `proposed-answers-summary.md` — one-paragraph extract of each Q1-Q7
  team proposal (skim-friendly; full rationale in W1.S1.b.md)
- `agent-2-ratification.md` — checklist Agent 2 fills in per question

## Path back to execution

Once Agent 2 records ratification in `agent-2-ratification.md`:

1. Agent 3 reads ratified ship plan
2. Agent 3 begins S1.b.1.P1 (palette refinement) per ratified Q1
   sequencing
3. Per AMD-009 P3 (ship complete) discipline, each phase ships
   independently with full evidence

If Founder ratification is needed (Q6 Category A specifically), Agent
3 will surface via escalations.html ESC-NNN before S1.b.1.P1 commit.
