---
id: AMD-021
title: Strict closure discipline — workarounds replaced with proven fix + proof
target_canonical_path: docs/agents/STRICT_CLOSURE_DISCIPLINE.md
source_draft_path: .claude/state/amendments/pending/AMD-021-strict-closure-discipline.md
scope_summary: Reserved slot now authored. Every workaround, exception, hack, or "good enough" patch must be replaced with a proven root-cause fix + proof before closure. Workarounds that ship as "the fix" require explicit Founder pre-auth + sunset commitment recorded in task-queue/founder/. Drift toward "workaround is fine" gets caught at Critic gate.
type: new-file
section_anchor: null
depends_on:
  - AMD-009
  - AMD-017
  - AMD-018
authored_by: claude-code
authored_at: 2026-05-15T02:05:00Z
bubble_of_record: null
estimate_tokens_to_apply: 2000
rollback_strategy: Canonical doc revert leaves AMD-009 P5 honest-delta + AMD-017 continuation as the closest substitute discipline. Engineering-mindset.md preserves the principle even if formal amendment reverts.
status: pending
operating_status: ACTIVE — directive operates under AMD-009 senior engineering standard P5 (honest delta) already binding. This amendment formalizes the closure half of that discipline.
---

# Strict closure discipline — workarounds replaced with proven fix + proof

The reserved AMD-021 slot from the migration-handoff allocation
sequence. The goal-roadmap defines its scope: "workarounds replaced
with proven fix + proof". This amendment formalizes the discipline
referenced operationally throughout the substrate but never authored
as a standalone amendment until now.

## PRE-RESEARCH

Sources verified (per AMD-025 mandatory PRE-RESEARCH section):

- `.claude/state/goal-roadmap-2026-05-14.md` line 17: "AMD-021 strict
  closure; workarounds replaced with proven fix + proof"
- `.claude/state/migration-handoff-2026-05-14.md` line 52: "AMD-021
  is reserved (not yet authored)"
- AMD-009 senior engineering standard P5 (honest delta) — already
  operating with closure overtones
- AMD-017 continuation discipline — Q0..Q4 gates the stop decision,
  not the closure decision
- Two recent strict-closure executions in this session (referenced
  in commit messages):
  - `416e4d2 fix(approval-pipeline): untrack .claude/worktrees/`
    — proven root-cause fix, not --ignore-submodules workaround
  - `7fb3a13 fix(verify-approval-pipeline): match canonical
    decisions JSON schema` — root-cause payload fix, not schema-
    version-tolerance workaround
- No external research needed — directive is internal governance.

## GOAL

Every workaround / exception / hack / "good enough" patch authored
by any agent gets replaced with a proven root-cause fix + proof
before the ship closes. Workarounds that must ship as "the fix"
(time-pressure, blocked-on-Founder, etc.) require explicit Founder
pre-auth + sunset commitment recorded in `task-queue/founder/`.

Measurable outcome: every commit message that uses the words
"workaround", "hack", "patch", "good enough", "defer", or "temporary"
links to either:
- a proven root-cause fix landed in the same ship, OR
- a Founder-pre-authorized sunset task in `.claude/state/task-queue/founder/`

## CONTEXT

- Source of truth: this amendment + goal-roadmap line 17
- Canonical doc target: `docs/agents/STRICT_CLOSURE_DISCIPLINE.md`
- Existing closure-adjacent disciplines:
  - AMD-009 P5 honest delta (substrate)
  - AMD-017 continuation (stop gate; this is the closure gate)
  - AMD-018 11-gate push (post-closure verification)
- Recent strict-closure proof points (this session):
  - `416e4d2` worktree gitlink untrack (not --ignore-submodules)
  - `7fb3a13` verify-pipeline schema payload (not version-tolerant
    apply-decisions)
- Recent workaround surfaced: `-ExecutionPolicy Bypass` in
  production scripts (documented as gotcha; bypass-flag scan
  surfaced Founder-gate task for proper policy fix)

## CONSTRAINTS

- **No workaround ships as "the fix" without Founder pre-auth.**
  Time-pressure exceptions get an authored sunset task in
  `.claude/state/task-queue/founder/` with explicit
  "this is a workaround; proven fix to land by <date>".
- **Critic gate question:** "Is this a workaround or a proven fix?
  If workaround, where's the sunset task?" Empty answer = blocked.
- **AMD-018 exception list compatibility:** sensitive operations
  (Firestore rules, CF deploys, payments) that require Founder
  pre-auth still get that — but the underlying fix must be proven,
  not workaround.
- **AMD-009 P5 binding:** honest delta on every closure — what
  shipped vs what claimed. "Worked around X with Y" is honest;
  "fixed X" when X is actually only bypassed is not.

## PRIORITY

1. **Immediate (this turn):** AMD-021 authored. Directive operates
   ACTIVE per Founder verbal intent already encoded in goal-roadmap.
2. **Next watcher cycle:** Canonical doc materializes at
   `docs/agents/STRICT_CLOSURE_DISCIPLINE.md` on Founder ratification.
3. **Going forward:** Every workaround commit references a sunset
   task. Critic gate enforces.

## PLAN

1. **Authoring** (this commit): write AMD-021 to `pending/`
2. **Engineering-mindset linkage:** Observation 10 (research-first)
   pairs naturally with closure discipline; both are decision-moment
   skills.
3. **Watcher application:** Founder ratification via amendments.html
   → watcher moves to `applied/` + creates canonical doc
4. **Tooling (deferred):** A static check that scans recent commit
   messages for "workaround|hack|patch|good enough" without an
   accompanying sunset-task path would close the loop. Not in scope
   for this amendment; surface as follow-up if drift observed.

Risks:
- (1) — Workaround vocabulary is broader than the matched words.
  Mitigation: Critic gate is human-grade; words trigger inspection,
  but inspection is the real gate.
- (3) — Watcher application requires Founder action. Mitigation:
  AMD-022/023/024/025 round-trip earlier this session proved the
  amendments pipeline is healthy; AMD-021 will follow same path.

## DONE WHEN

- AMD-021 authored in `.claude/state/amendments/pending/`
- Founder ratifies via amendments.html
- Watcher moves to `applied/` + creates `docs/agents/STRICT_CLOSURE_DISCIPLINE.md`
- Every workaround commit in subsequent sessions links to either a
  proven root-cause fix or a Founder-pre-auth sunset task

## VERIFY

- `ls .claude/state/amendments/pending/AMD-021-*.md` returns 1 file
- After ratification: `ls .claude/state/amendments/applied/AMD-021-*.md`
  returns 1 file; `ls docs/agents/STRICT_CLOSURE_DISCIPLINE.md` exists
- Commit audit (manual, weekly): every commit using workaround
  vocabulary has a paired sunset task or proven-fix paired commit

## OUTPUT

This turn:
- `.claude/state/amendments/pending/AMD-021-strict-closure-discipline.md`

On Founder ratification (next watcher cycle):
- `.claude/state/amendments/applied/AMD-021-strict-closure-discipline.md`
- `docs/agents/STRICT_CLOSURE_DISCIPLINE.md`

Future agent output (this amendment binds):
- Workaround commits link to sunset task or proven fix
- Critic gate rejects workaround-claimed-as-fix specs

## STOP RULES

Continue per AMD-017 default unless one fires:
- AMD-021 ratified + canonical doc lands → close this amendment loop
- Founder rejects via amendments.html → revise per feedback
- Watcher fails to apply within 6 min → diagnostic per verify-approval-pipeline.sh

NOT stop conditions:
- Workaround is sometimes the right call (in emergencies) → that's
  why sunset tasks exist; the discipline isn't "no workarounds ever"
- Critic gate human-grade → that's by design; tooling later if drift
