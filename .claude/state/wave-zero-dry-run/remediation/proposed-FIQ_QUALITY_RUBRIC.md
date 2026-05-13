# Proposed FIQ_QUALITY_RUBRIC.md

> **Status:** Draft authored 2026-05-13 by the orchestration team for Founder ratification.
> **Apply path:** When Founder ratifies, this moves to `docs/agents/FIQ_QUALITY_RUBRIC.md` (Founder applies; governance hook blocks orchestration-team writes to `docs/agents/`).
> **Bubble of record (forthcoming):** `db-2026-05-13-007` — to be opened at first FIQ-write attempt after ratification, so the rubric is exercised on a real entry.
> **Trigger:** Founder Finding 3 directive — "FIQ depth should be maximized AND high-grade. An agent can dump shallow questions to inflate depth metric and appear productive while wasting Founder attention."
> **Dependency:** This rubric depends on `proposed-METRIC_INTEGRITY_PROTOCOL.md` Rule 2 (FIQ depth gamed = shallow entries). This is the mitigation.

---

## 1 — Why this rubric exists

Founder Input Queue (FIQ) is the channel agents use to escalate decisions Founder must make. If FIQ is unguarded, agents can inflate depth metrics by writing shallow entries that look like questions but aren't decision-ready. Founder attention is the scarcest resource in the system; entries that aren't Founder-readable in <60s waste it.

The rubric grades every FIQ entry on 5 dimensions × 5 points = 25 total. The grade maps to a letter (A–F). Entries grading **B or higher** count toward the dashboard `fiq_depth` metric. Entries grading **C or below** are demoted to `proactive-backlog.md` — they are not deleted (they may still be valid work), but they don't inflate the Founder-facing depth count.

## 2 — The 5 dimensions (5 points each)

### Dimension 1 — Specificity

**Question:** Is the FIQ a vague preference or a concrete decision with options?

| Points | Description |
|---|---|
| 5 | Names the concrete decision + 2-4 specific options + clear trade-offs |
| 4 | Names the decision + at least 2 options, trade-offs implicit |
| 3 | Names the decision, one option proposed, alternative implied not stated |
| 2 | Names the question but no options, just "what should we do" |
| 1 | Vague: "should we think about X" — direction-of-curiosity, not a decision |
| 0 | Not a decision at all (status update, observation, etc.) |

### Dimension 2 — Decision-readiness

**Question:** Can Founder answer this in <60s of reading, or do they need outside research?

| Points | Description |
|---|---|
| 5 | All context inline; Founder reads + decides in one sitting |
| 4 | Context inline; one quick code/file glance needed |
| 3 | Founder needs 5-10 min of reading linked references before deciding |
| 2 | Founder needs 30+ min of research / re-reading multiple docs |
| 1 | Founder needs new external research (talk to users, check a vendor, etc.) |
| 0 | Cannot be decided without doing the underlying work first (this is a TASK, not a question) |

### Dimension 3 — Blast radius

**Question:** Is scope-of-impact stated? Does Founder know what depends on this decision?

| Points | Description |
|---|---|
| 5 | Specific scope: ship, files, downstream consumers all named |
| 4 | Ship + general scope named; consumers implied not enumerated |
| 3 | Affected area named at the page/feature level |
| 2 | Vague: "this affects how we build going forward" |
| 1 | Unclear if this is a one-ship decision or cross-wave |
| 0 | No scope stated at all |

### Dimension 4 — Reversibility

**Question:** Is the cost of getting it wrong stated?

| Points | Description |
|---|---|
| 5 | Quantified cost named (tokens, hours, ships of rework, member-visible regression) |
| 4 | Qualitative cost named (small / medium / large with reasoning) |
| 3 | Direction-of-cost named (low-risk / high-risk) |
| 2 | Vague: "reversible" or "irreversible" without context |
| 1 | Implicit: cost not addressed |
| 0 | Decision feels final but cost is absent and Founder must guess |

### Dimension 5 — Alternatives

**Question:** Are at least 2 options presented with trade-offs?

| Points | Description |
|---|---|
| 5 | 3+ options, each with explicit pros + cons + estimated cost |
| 4 | 2+ options, each with pros + cons |
| 3 | 2 options with one-line trade-off each |
| 2 | 2 options stated, trade-offs implicit |
| 1 | 1 option stated, "should we do this y/n" |
| 0 | No options — just "what should we do" |

## 3 — Total → Letter grade

| Total (out of 25) | Letter | Disposition |
|---|---|---|
| 23–25 | A | Counts toward `fiq_depth`; surface at top of FIQ in dashboard |
| 20–22 | B | Counts toward `fiq_depth`; surface normally |
| 16–19 | C | Demoted to `proactive-backlog.md`; agent who wrote it receives auto-feedback to revise + resubmit |
| 11–15 | D | Demoted; flag for Critic pre-close audit on next cycle (gaming pattern check) |
| 0–10  | F | Demoted; Critic AND Devil's-Advocate audit: was this entry generated to inflate depth? |

**Effective on `fiq_depth`:** dashboard.html's `fiq_depth` field counts only entries graded A or B. C-F entries exist in `proactive-backlog.md` and can be improved + resubmitted, but they don't inflate the Founder-facing metric.

## 4 — FIQ entry frontmatter (extended schema)

Every FIQ entry written under this rubric MUST have this frontmatter:

```yaml
id: FIQ-NNN
priority: low | medium | high | blocking
question: <one-sentence question>
context: <multi-sentence context summary>
options:
  - name: <option-1>
    pros: [...]
    cons: [...]
    estimated_cost: <tokens/hours/ships>
  - name: <option-2>
    pros: [...]
    cons: [...]
    estimated_cost: <tokens/hours/ships>
blast_radius: <ship-id, file paths, downstream consumers>
reversibility: <quantified cost of getting it wrong>
decision_deadline: <ISO-8601 OR "ship-close" OR "no-deadline">
blocking: true | false
raised_by: <agent-id>
raised_at: <ISO-8601>
triaged_at: null  # set when an agent (or Founder) marks it processed
rubric_grade:
  specificity: <0-5>
  decision_readiness: <0-5>
  blast_radius: <0-5>
  reversibility: <0-5>
  alternatives: <0-5>
  total: <0-25>
  letter: <A|B|C|D|F>
  graded_by: <agent-id>
  graded_at: <ISO-8601>
```

Body of the entry: free-form markdown for the actual question + context.

## 5 — Grading flow

1. Agent writes the FIQ entry frontmatter + body
2. Same agent runs `scripts/grade-fiq-entry.py <path-to-entry>` (lightweight rubric application; agent fills the grade fields directly from rubric judgment)
3. If grade is A or B: entry stays in `.claude/state/founder-input-queue/`
4. If grade is C or below: agent moves entry to `.claude/state/proactive-backlog.md` (appended as a section) and adds a self-note about which dimensions scored low + how the entry could be revised
5. Critic spot-audits 1 in 5 FIQ entries per cycle to verify grading discipline

## 6 — Auto-grading existing entries (one-time pass)

When this rubric ratifies, run a one-time pass on existing FIQ entries:
- For each entry in `.claude/state/founder-input-queue/`:
  - Apply rubric
  - Add `rubric_grade` block to frontmatter
  - If C or below: move to `proactive-backlog.md`
- Current count of existing entries: **0** (no FIQ entries written yet — the queue dir was just created). This step is trivial today.

## 7 — Cross-references

- `proposed-METRIC_INTEGRITY_PROTOCOL.md` (Rule 2: FIQ depth gamed = shallow entries; this rubric is the mitigation)
- `docs/agents/HEADLESS_OPERATION_PROTOCOL.md` § 5 (FIQ queue health check during heartbeat)
- `docs/agents/PROACTIVE_IMPROVEMENT_PROTOCOL.md` § 8.1 (FIQ vs proposal distinction)
- `scripts/grade-fiq-entry.py` (grader implementation)
- Dashboard data shape: `fiq_depth` field in `current-snapshot.json` (aggregator counts only A/B grade entries after this rubric ratifies)

---

*Draft authored 2026-05-13 by orchestration-team during Wave Zero Dry-Run remediation pass F3. Awaiting Founder review + ratification + move to `docs/agents/FIQ_QUALITY_RUBRIC.md`.*
