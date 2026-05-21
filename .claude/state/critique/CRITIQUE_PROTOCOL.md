# Critique Protocol

Per Founder directive 2026-05-21:

> All work completed and pushed must have a critique loop and be challenged/scrutinized. If agents see faults that they can fix they should fix and update summary session to reflect we were going to stop at X but we took these steps and provided Y which is much higher quality release.

This protocol operationalizes the directive.

## When the critique loop fires

After **every non-routine commit** (anything matching `feat:` / `fix:` / `refactor:` — but NOT `cron(...)` / `chore(cycle): heartbeat`):

1. The shipping agent declares "ship-close candidate"
2. Critique subagent runs (immediately, before push)
3. Findings classified (CRITICAL / HIGH / MEDIUM / LOW)
4. Agent applies CRITICAL + HIGH fixes inline (extends the same ship)
5. Session summary updated with the "would have stopped at X — took these steps — delivered Y" note
6. Only then: push

## How the critique subagent is dispatched

Use the `Agent` tool with `subagent_type=code-reviewer` (or `security-reviewer` for security-sensitive code). The prompt must include:

- The commit SHA(s) being critiqued
- `git diff` since the previous non-routine commit
- The specific files changed (paths, not content — let the agent read them)
- Quality bar (P7 >= 9.5/10 visual, P9 data truthfulness, P10 actionability)
- The output schema (severity / location / finding / fix / can_agent_apply)

## Recording critique outcomes

Each critique produces:

`.claude/state/critique/{commit-sha-short}-{YYYY-MM-DD}.md`

With front-matter:

```yaml
---
commit_sha: 8092d5f9
ship_label: agent created Firebase staging project + Sentry walkthrough
critic_agent: code-reviewer
fired_at: 2026-05-21T15:45:00Z
findings_count: 2
applied_count: 2
escalated_count: 0
---
```

Then a `## Findings` section with one entry per finding:

```
### F1 (severity) — file:line
Finding sentence.
**Fix applied:** Edit/Write description.
**Status:** APPLIED in commit {follow-up-sha}.
```

## Session summary update

When critique applies findings, the session summary gets a Critique-applied block:

```
## Critique applied ({original-sha} -> {fix-sha})

Would have stopped at: {ship label}.

Critique findings + applied fixes:
- (high) {finding} -> applied {fix}
- (medium) {finding} -> applied {fix}

Delivered: same ship, more robust. Quality grade lifted from {before} -> {after}.
```

This is the "we took these steps" trail Founder asked for.

## What the critic DOESN'T do

- Re-architect the work (that's a follow-up ship)
- Block ship on style preferences (LOW findings are notes, not gates)
- Demand 100% test coverage
- Surface taste decisions (those go to Founder via founder-checklist, not critique)

## What the shipping agent OWES

- **Critic gate**: every ship invokes critic, no exceptions for "this one's simple"
- **Honest classification**: don't downgrade findings to dodge fix work
- **Visible trail**: critique file committed + session summary updated
- **No mute**: if critic finds CRITICAL, push BLOCKS until fixed or Founder pre-auth bypass

## Cross-references

- AMD-026 Actionable Surfacing
- AMD-027 file-size budgets
- AMD-018 11-gate
- continuation-discipline skill (Q4)
- outcome-vs-task skill
