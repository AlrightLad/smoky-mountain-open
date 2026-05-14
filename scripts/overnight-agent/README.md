# Overnight Agent Infrastructure

Pattern A bounded-scope Claude Code agent that runs unattended on
Tuesday + Friday nights, executes a queued prompt within strict safety
constraints, commits its work (but never pushes), and surfaces an outcome
report for Founder morning review.

Founder direction 2026-05-14 ratified this pattern. Push remains
Founder-gated per AMD-018 11-gate criteria.

## How it fits together

```
┌────────────────────────────────────────────────────────────────────┐
│ Founder day                                                        │
│   - drafts a prompt in a text file (or copies example-prompt.txt)  │
│   - validates + queues it:                                         │
│       scripts/overnight-agent/queue-prompt.sh path/to/prompt.txt   │
│   - prompt lands in:                                               │
│       .claude/state/overnight-agent/prompts/queue/<ts>-<name>.txt  │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ Tue/Fri 23:00 local — Scheduled Task fires                         │
│   - runs run-overnight-agent.sh                                    │
│   - safety preamble prepended to prompt                            │
│   - claude --print --dangerously-skip-permissions pipes prompt     │
│   - wall-clock cap, budget cap, fail-gate enforced                 │
│   - commits but does NOT push                                      │
│   - emits run record + full log                                    │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ Wed/Sat 07:00 — morning-report-generator.sh fires                  │
│   - reads run record + tails log                                   │
│   - emits .claude/state/overnight-agent/reports/<date>.md          │
│   - dashboard banner surfaces the latest report                    │
└────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ Founder morning review                                             │
│   - reads report                                                   │
│   - skims commits + diffs                                          │
│   - re-runs round-trip-test.py                                     │
│   - 11-gate green → git push                                       │
│   - 11-gate red → investigate / revert / amend                     │
└────────────────────────────────────────────────────────────────────┘
```

## Files

| Path | Role |
|------|------|
| `run-overnight-agent.sh` | Wrapper. Launches Claude Code with piped prompt. Enforces token budget, wall-clock cap, fail-gate. Emits log + run record. Exit codes: 0 success, 1 budget hit, 2 fail-gate, 3 error. |
| `queue-prompt.sh` | Helper to validate + queue prompts. Rejects free-form prompts missing required sections. Refuses prompts that mention AMD-018 exception-list operations (Cloud Function deploys, firestore.rules edits, git push). |
| `install-scheduled-task.ps1` | Installs `PARBAUGHS-Overnight-Agent` Windows Scheduled Task. **Not auto-installed.** Founder runs explicitly when ready to enable overnight runs. |
| `morning-report-generator.sh` | Daily 07:00 maintenance-cron task. Aggregates outcome → markdown report. |
| `../../.claude/state/overnight-agent/prompts/example-prompt.txt` | Template showing safe prompt structure. Copy + customize per overnight run. |

## Queuing a prompt

1. **Draft.** Copy the template:

   ```bash
   cp .claude/state/overnight-agent/prompts/example-prompt.txt my-task.txt
   ```

2. **Edit.** Required `##` sections (validator enforces all five):

   - `## SCOPE` — what the run should accomplish (1-3 sentences)
   - `## STOP CONDITIONS` — hard stops in addition to AMD-017 Q1.A-G
   - `## TOKEN BUDGET` — dollar cap (e.g. `$5`)
   - `## ALLOWED SURFACES` — paths the run may edit
   - `## DELIVERABLE` — what "done" looks like

3. **Queue.** Submit through the validator:

   ```bash
   scripts/overnight-agent/queue-prompt.sh my-task.txt
   ```

   The validator copies it (with a timestamp prefix) into the queue
   directory. The wrapper pops the oldest queued prompt on next run.

4. **Wait.** Tue/Fri 23:00 local runs the next queued prompt.

## Safety constraints (enforced by wrapper)

The wrapper prepends a safety preamble to every Founder prompt before
piping to Claude Code. The preamble explicitly forbids the AMD-018
exception-list operations. In addition, project hooks (gate-protected,
gate-assertions) block at the tool layer.

| Constraint | Source |
|---|---|
| No push (commits only) | Wrapper preamble + AMD-018 |
| No Cloud Function deploys | Wrapper preamble + AMD-018 exception list |
| No `firestore.rules` edits | Wrapper preamble + hook 4 (gate-protected) |
| No `.env*` / service-account edits | Hook 4 (gate-protected) |
| No `tests/e2e/helpers/assertions.js` silent edits | Hook 3 (gate-assertions) |
| `src/pages/` edits only if `ALLOWED SURFACES` lists them | Wrapper preamble |
| Round-trip-test must pass post-run | Wrapper post-flight |
| Tree dirty at start → refuse | Wrapper pre-flight |
| Stop on Q1.A-G | AMD-017 + continuation-discipline skill |
| Token budget cap | Wrapper (env var) |
| Wall-clock cap (default 180 min) | Wrapper `timeout` |

## Budget rules (PROP-006 outcome-vs-task)

- Default budget: **$5** (≈ 2-3h of Opus work).
- Override per run: `OVERNIGHT_BUDGET=10 scripts/overnight-agent/run-overnight-agent.sh ...`
- At 90% consumed: the agent stops, commits progress, logs remaining
  items for next slot. The budget is a soft cap on intent — the
  wall-clock cap is the hard kill.

## Auto-stop triggers (in addition to AMD-017)

- `round-trip-test.py` fails post-run → exit 2 (fail-gate)
- Wall-clock cap hit → exit 1 (budget/clock)
- Tree dirty at preflight → exit 3 (refuse to run)
- `claude` not on PATH → exit 3 (refuse to run)
- No queued prompt + no argument → exit 3 (refuse to run)
- Any non-zero exit from `claude` → exit 3 (error)

## Recovery / rollback

If a morning report shows the overnight run committed broken work:

1. **Stop the next run.** Disable the Scheduled Task while
   investigating:
   ```powershell
   Disable-ScheduledTask -TaskName "PARBAUGHS-Overnight-Agent"
   ```

2. **Find the bad commit(s).** Read the morning report's
   "Commits since run started" section. Reproduce locally:
   ```bash
   git log --since="<run started_at>" --oneline
   ```

3. **Revert.** Use a NEW commit (per CLAUDE.md git safety: prefer
   forward-only history):
   ```bash
   git revert <bad-sha>
   ```
   Hard-reset only if the commits are still local and you are sure
   nothing else has built on them.

4. **Drain the queue.** If a class of prompts proves unsafe, archive
   the queue dir:
   ```bash
   mv .claude/state/overnight-agent/prompts/queue _quarantined-$(date -u +%Y%m%d)
   mkdir -p .claude/state/overnight-agent/prompts/queue
   ```

5. **Amend.** If a safety gap is discovered, raise an amendment
   (AMD-XXX) before re-enabling the Scheduled Task.

6. **Re-enable.** Only after the round-trip-test passes against the
   reverted state and an amendment (if any) is applied:
   ```powershell
   Enable-ScheduledTask -TaskName "PARBAUGHS-Overnight-Agent"
   ```

## Discipline references

- **AMD-017** — stop conditions (operative in overnight mode)
- **AMD-018** — self-governed push authorization with exception list
- **AMD-019** — dashboard freshness per commit (morning report consumer)
- **PROP-006** — outcome-vs-task budget enforcement
- **PROP-007** — user-context verification (morning gate uses fresh
                 user-context captures, not the agent's self-report)
- **PROP-010** — design-bot reviews any visual changes
- **PROP-013** — button coverage gate
- **continuation-discipline** — Q0-Q4 between units of work
