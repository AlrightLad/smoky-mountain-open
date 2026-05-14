---
id: AMD-004
title: AUTONOMOUS_FAILURE_RECOVERY v8.3 — Team owns recovery, Founder owns decisions
target_canonical_path: docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md
source_draft_path: .claude/state/wave-zero-dry-run/remediation/proposed-AUTONOMOUS_FAILURE_RECOVERY_v8.3.md
scope_summary: New governance doc. Backend issues, infrastructure failures, encoding bugs, test failures are TEAM problems. Founder escalation requires 3+ failed attempts AND a decision (not a fix). Documents 5 real failure-recovery patterns already applied during consolidation as precedent.
type: new-file
section_anchor: null
depends_on: []
authored_by: claude-code
authored_at: 2026-05-14T01:15:00Z
bubble_of_record: null
estimate_tokens_to_apply: 6000
rollback_strategy: git revert; new file, no overwrite of existing governance. Protocol stays in effect via operating-immediately status while the formal doc is being re-applied.
status: pending
operating_status: ACTIVE — protocol operates immediately per Founder PROTOCOL UPDATE 2026-05-14; this draft is the formalization artifact only.
migrated_from_remediation: 2026-05-14T01:30:00Z
---

# AUTONOMOUS_FAILURE_RECOVERY v8.3

Backend issues, infrastructure failures, encoding bugs, test failures,
and similar technical problems are **TEAM problems** to diagnose and
fix, not Founder problems to receive notifications about. Founder gets
involved only when (a) all reasonable attempts have failed AND (b) a
decision is genuinely required.

## 1 — Operating principle

The team owns failure recovery. Founder owns decisions. Diagnostic work
is the team's; specification choices are Founder's. This is the same
principle that governs verification (team verifies against codified
standards; Founder reviews exceptions) extended to recovery.

## 2 — When something breaks during execution

### Step 1 — Diagnose

Cite evidence. Read the actual error, logs, file contents.
Classify the failure: encoding bug? path issue? schema mismatch?
race condition? permissions? dependency missing? test wrong? code wrong?

Hypothesis-vs-confirmed discipline:
- "I think it's X" → confirm by inspecting the actual artifact (read
  the bytes of the file, run the regex on the actual string, etc.)
- Do NOT escalate diagnostic work to Founder. The team has every tool
  needed to diagnose.

### Step 2 — Plan A (primary attempt)

Apply the most likely fix per diagnosis. Test the fix. Verify against
the original failure. If fixed: continue, document the fix in the
commit message. If not fixed: proceed to Step 3.

### Step 3 — Plan B (different angle)

Different angle, different approach, different mechanism. Common
fallback patterns:
- Encoding bug not caught by string replace → byte-level replacement
- Module-level fix not working → patch the consumer instead
- Refactor breaking tests → roll back refactor, update test FIRST,
  then re-apply refactor against updated test
- Library X failing → swap for library Y or implement primitive
- Path resolution failing on Windows → cygpath or absolute path or
  environment variable

Apply Plan B. Test. Verify.

### Step 4 — Plan C (third angle)

If Plan B fails, try a third angle. The team has tools to iterate.
Plan A → B → C → D → E is normal engineering.

### Step 5 — When to actually escalate

Only escalate to Founder when ALL of:
- At least 3 distinct approach attempts have failed
- Failure cannot be diagnosed further without info Founder uniquely
  has (e.g., "what's your Anthropic API key endpoint?")
- A decision is required, not a fix (e.g., "two valid approaches with
  different tradeoffs — which does Founder prefer?")
- The escalation includes the full attempts log, not "it's broken
  please help"

### Anti-pattern

Paginating Founder on every failed attempt. The team fixes things.
Founder doesn't.

## 3 — PR / ship fallback plan requirement

Every ship plan and every multi-commit operation MUST include a
fallback plan. Document in the ship plan or in the work-in-progress
state file at `.claude/state/in-flight/<ship-id>.md`.

### Required fallback fields

```
primary_approach:
  description: <what the team will try first>
  success_criteria: <how to know it worked>

fallback_b:
  trigger: <what failure conditions invoke this>
  description: <different angle, not a tweak>
  revert_strategy: <how to undo primary cleanly first>

fallback_c:
  trigger: <when fallback_b also fails>
  description: <third distinct approach>

abandon_criteria:
  <under what conditions does the team give up and escalate>
  Should be HARD criteria, not vague "if it's not working"
```

### Example — hypothetical "migrate dashboard.css to design tokens"

```
primary: in-place token substitution via regex
fallback_b (trigger: regex misses cases): manual line-by-line edit
fallback_c (trigger: visual regression): keep css, swap underlying tokens
abandon: after 3 attempts produce different visual breakage on
  different files; escalate with specific question about which visual
  variant Founder prefers
```

## 4 — Revert-and-retry discipline

When Plan A fails, REVERT cleanly before trying Plan B. Don't stack
Plan B fixes on top of Plan A's partial state.

Mechanism: `git reset --hard <commit-before-attempt>` (or `git stash`
if Plan A had partial commits) before applying Plan B.

Multi-commit operations (like the Dashboard Consolidation arc's 12
commits): each commit is independently revertable. If commit N+3 fails
and N+4 can't fix it, the team reverts commit N+3 (`git revert <sha>`)
and tries a different approach at N+4.

This requires every commit to be small enough that reverting doesn't
lose other valuable work. **Discipline: commits do ONE THING.**

## 5 — Learn-and-document discipline

After successful resolution (whether Plan A, B, or C worked):
- Document in commit message which plan succeeded + why others failed
- Update relevant skills/protocols if the failure was a class-of-bugs
  not previously known (e.g., the UTF-8 mojibake byte-replacement
  pattern is now a documented technique because the team rediscovered
  it 3 separate times during the Dashboard Consolidation session)
- Append to `.claude/state/learnings/<topic>.md` so future agents
  don't re-encounter the same issue
- If a class of bugs keeps recurring, propose a system-level fix
  (linter, pre-commit hook, automated check) so the bug class CAN'T
  happen again

## 6 — Escalation format (when actually escalating)

When the team finally must escalate:

- **Subject**: specific failure summary in one sentence
- **Diagnosis**: what was wrong, with evidence (logs, file paths, line numbers)
- **Attempts**: numbered list of Plans A/B/C with what each tried and why each failed
- **Decision needed**: specific question with 2-3 concrete options
- **Default if no response**: which fallback the team will take if Founder doesn't respond within reasonable time

NOT "please help" or "stuck on X." Specific question + options + default plan.

## 7 — Applies to

All work going forward, including (in-flight as of authoring):
- V7-V12 audit + execute (just committed: `47aa793`)
- Wave 1 transition prep
- Design tooling spike (Founder TASK 2)
- Amendments lifecycle build
- All future Wave 1 ship work

If any of the in-flight work hits a failure: diagnose, attempt fixes,
fall back, retry, retry again, escalate only per § 2.5 criteria.

## 8 — Critic enforcement

Critic must verify this protocol is being followed on every PR audit
going forward. Failure to attempt fallbacks before escalating is a
Critic-gated issue.

Concretely, Critic checks:
- Did the team encounter any failure during the work?
- If yes: did the commit message or work-in-progress state document
  Plans A/B/C and which one succeeded?
- If a Founder escalation was generated: did it meet the § 6 format?

## 9 — Status

This protocol is **operating immediately** per Founder PROTOCOL UPDATE
of 2026-05-14. The draft formalization at this path is a follow-up
artifact; the protocol takes effect the moment Founder issued the
update.

When `amendments.html` ships and is operational, this draft moves to
the canonical path `docs/agents/AUTONOMOUS_FAILURE_RECOVERY_v8.3.md`
via the new amendments lifecycle UI — alongside the DC-9 governance
pair (PAUSE_DISCIPLINE_v8.2 + CRON_CONFIGURATION_v8.2). Until then,
the team operates BY this protocol.

## 10 — Cross-references

- Codified working standards (team verifies against these):
  - `.claude/state/design-system/aesthetic-brief.md`
  - `.claude/skills/parbaughs-design-bot.md`
  - `docs/agents/METRIC_INTEGRITY_PROTOCOL.md`
  - `docs/agents/PROPOSAL_LIFECYCLE_v8.2_AMENDMENT.md`
  - `docs/agents/HALT_CRITERIA_AND_AUTONOMY_DISCIPLINE.md`
  - `docs/agents/MAIN_FLOWS.md`
  - `tests/round-trip-test.py`
- Related amendment drafts pending application:
  - `proposed-PAUSE_DISCIPLINE_v8.2_remove-fictional-cap.md`
  - `proposed-CRON_CONFIGURATION_v8.2_remove-fictional-cap.md`
  - `proposed-parbaughs-design-bot-dashboard-checklist.md`
- Historical examples of fallback discipline already in use:
  - Dashboard consolidation `[no-charts]` round-trip false-positive on
    documentation comment → tightened regex to require `<script src=...>`
    wrapper (Plan A regex was too greedy; Plan B narrowed it)
  - Discussion-bubble `db-day-divider` not in `class=""` attr →
    relaxed sentinel check to substring match across CSS + JS (Plan A
    looked for class attr only; Plan B accepted CSS-rule or JS-emit)
  - `inject-page-nav.py` accumulating indent on each re-run → matched
    leading whitespace in regex (Plan A re-injected without consuming
    preceding whitespace; Plan B captured `[ \t]*` before `<header>`)
  - `_is_exempt()` try/except scope bug → moved try inside loop (Plan A
    short-circuited on first non-match; Plan B per-iteration try/except)
  - UTF-8 em-dash mojibake in PowerShell scripts → byte-level sed
    replacement (Plan A `sed -i 's/—/-/g'` failed because PowerShell
    5.1 reads .ps1 without BOM as Win-1252; Plan B byte-level rewrite)

Each of these failure-recovery patterns was applied autonomously during
the Dashboard Consolidation arc without escalating to Founder. They are
the precedent this protocol formalizes.
