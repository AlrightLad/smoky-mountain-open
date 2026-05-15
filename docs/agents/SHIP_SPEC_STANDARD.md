
# Ship spec standard — 10 mandatory sections + research-first discipline

Founder direction 2026-05-15 "NEW SHIP STANDARD — All work products
follow structured spec format". Every spec, prompt, agent-dispatch
artifact, or ship deliverable authored by any agent from this point
forward follows a 10-section structure with documented pre-research.
Specs lacking a PRE-RESEARCH section fail the Critic gate.

## PRE-RESEARCH

Sources verified before authoring this amendment:

- Founder verbatim directive 2026-05-15T01:54Z (system reminder
  injection during /goal execution)
- Current substrate: AMD-009 senior engineering standard P5 (honest
  delta), P7 (honest language); AMD-017 continuation discipline;
  AMD-018 11-gate push authorization
- Engineering-mindset.md Observation 10 (this session, authored
  immediately before this amendment)
- Existing /goal command in Claude Code v2.1.139+ (Founder cited
  4k char limit; verified by reading harness Stop hook in this
  conversation thread)
- Two cited Founder catches against Claude.ai (Agent 2):
    (a) 14k char /goal prompt vs 4k cap
    (b) Manual loop recommendation when /goal already native

No external web fetches required — directive is binding by Founder
authority; substrate context is sufficient to formalize. Future spec
authors performing pre-research per this amendment will exercise
the discipline downstream.

## GOAL

Every spec / prompt / ship deliverable from 2026-05-15 forward
follows a 10-section structure with documented pre-research.
Measurable outcome: spec authoring without PRE-RESEARCH section =
blocked at Critic gate.

## CONTEXT

- Source of truth: this amendment (`AMD-025-ship-spec-standard.md`)
  + Founder verbatim directive in session transcript
- Engineering-mindset Observation 10 (`.claude/state/lessons-
  learned/engineering-mindset.md`) — captures the two Founder
  catches that motivated this amendment
- Canonical doc target: `docs/agents/SHIP_SPEC_STANDARD.md` (created
  on application)
- Substrate state: AMD-001..AMD-024 in applied/; PROP-005..PROP-013
  in approved/; this is the 25th amendment
- Test account: smoke@parbaughs.test in smoke-test-league (for any
  e2e verification authored under this standard)

## CONSTRAINTS

- **All 10 sections required.** Spec missing any section = Critic
  gate failure. Sections may be brief but must be present.
- **PRE-RESEARCH cites sources.** Empty placeholder ("none required"
  with no rationale) = failure. Either cite or explain why no
  external research was needed (substrate sufficient).
- **Format constraints honored.** /goal commands ≤ 4000 chars
  (two-step pattern: save full spec to file + tight invocation
  referencing it). /loop verifies interval supported. Agent
  dispatch via agent view uses paste-ready inline content.
- **AMD-009 P5 binding.** Honest delta required on every ship close
  — what shipped vs what claimed, sources cited, format constraints
  verified.
- **AMD-017 continuation discipline.** Q0 tree-clean + Q1-Q4 stop
  conditions still gate every turn-end.
- **AMD-018 11-gate push authorization.** Specs that drive
  member-facing ships still subject to all 11 gates.

## PRIORITY

1. **Immediate (this turn):** AMD-025 authored + engineering-mindset
   Observation 10 captured + this directive operates ACTIVE pending
   Founder ratification via amendments.html.
2. **Next turn (post-application):** Canonical doc lands at
   `docs/agents/SHIP_SPEC_STANDARD.md` on next watcher cycle.
3. **Going forward:** Every spec / prompt / dispatch artifact
   follows the 10 sections. Critic gate enforces.

## PLAN

1. **Spec sections defined** (this amendment, in scope):
   - PRE-RESEARCH (sources, version checks, format limits, substrate state)
   - GOAL (one-line + measurable outcome)
   - CONTEXT (sources of truth, paths, accounts, substrate, live URLs)
   - CONSTRAINTS (hard rules, governance refs, scope, exception list)
   - PRIORITY (order, blocking vs parallel, critical path)
   - PLAN (steps, time estimates, risks)
   - DONE WHEN (validator-checkable, measurable)
   - VERIFY (exact commands, pass/fail thresholds)
   - OUTPUT (per-turn + final deliverables, committed paths)
   - STOP RULES (real conditions, NOT-stop conditions, AMD-017 default)

2. **Format constraint awareness embedded:**
   - /goal: 4000 char hard cap → two-step pattern when spec exceeds
   - /loop: verify interval support before invocation
   - Agent dispatch: paste-ready inline, no file attachments
     unless asked
   - Founder prompts: surgical, skip preamble/postamble

3. **Research discipline embedded:**
   - Web search current Anthropic docs for relevant slash commands,
     SDK features, releases, limits
   - Web search community for real-world implementations, failure
     modes, free alternatives
   - Verify version compatibility (`claude --version`)
   - Check substrate for installed capability, existing
     skills/proposals, in-flight overlap
   - Cite sources in PRE-RESEARCH section

4. **Critic gate question added:** "What did you research before
   authoring this?" The answer is the spec's PRE-RESEARCH section.
   Empty section = blocked.

5. **Skill propagation:** Discipline binds at decision moment via
   skills. Research-first becomes structural, not memory-dependent.

Risks per step:
- (1) — 10 sections may feel heavy for trivial specs. Mitigation:
  trivial specs (bug fixes, single-file edits) can have one-line
  sections; the requirement is presence + honest content.
- (2) — Format awareness requires agents to know every constraint.
  Mitigation: PRE-RESEARCH section explicitly forces lookup.
- (3) — Research requires WebSearch availability. Mitigation:
  substrate-sufficient specs declare "no external research needed"
  with rationale; that's auditable.

## DONE WHEN

- AMD-025 authored in `.claude/state/amendments/pending/`
- Engineering-mindset Observation 10 added with cross-reference
- Founder ratification via amendments.html → watcher applies → moves
  to `applied/` + creates `docs/agents/SHIP_SPEC_STANDARD.md`
- Every spec / prompt authored by any agent from 2026-05-15T01:55Z
  onward contains all 10 sections with non-empty PRE-RESEARCH
- Critic gate rejects specs lacking PRE-RESEARCH section

## VERIFY

- `ls .claude/state/amendments/pending/AMD-025-*.md` returns 1 file
- `git log --grep "AMD-025"` shows this commit
- `grep -c "Observation 10" .claude/state/lessons-learned/engineering-mindset.md`
  returns ≥ 1
- After Founder ratification: `ls .claude/state/amendments/applied/AMD-025-*.md`
  returns 1 file; `ls docs/agents/SHIP_SPEC_STANDARD.md` exists
- Spec audit (manual): every new amendment / proposal / spike doc
  authored in the next 7 days contains all 10 section headers

## OUTPUT

This turn:
- `.claude/state/amendments/pending/AMD-025-ship-spec-standard.md`
  (this file)
- `.claude/state/lessons-learned/engineering-mindset.md` (Observation 10 added)

On Founder ratification (next watcher cycle):
- `.claude/state/amendments/applied/AMD-025-ship-spec-standard.md`
  (moved)
- `docs/agents/SHIP_SPEC_STANDARD.md` (canonical doc materialized
  by apply-amendments.sh)

Future agent output (this amendment binds):
- Every spec / prompt / dispatch artifact: 10 sections present,
  PRE-RESEARCH non-empty, sources cited

## STOP RULES

Continue per AMD-017 default unless one fires:
- AMD-025 ratified + canonical doc lands → close this amendment loop;
  remaining /goal objectives continue
- Founder rejects via amendments.html → revise per feedback; the
  observation in engineering-mindset.md stays as a learnings record
- Critic gate cannot enforce because skill not yet operative → flag
  to Founder via task-queue/founder/ as gap

NOT stop conditions:
- Trivial spec feels overweight with 10 sections → 1-line sections
  are acceptable per CONSTRAINTS
- Pre-research returns nothing useful → cite that as the research
  outcome; absence of result is data
- Founder hasn't ratified within an hour → directive is operative
  immediately; ratification is formalization, not gate
