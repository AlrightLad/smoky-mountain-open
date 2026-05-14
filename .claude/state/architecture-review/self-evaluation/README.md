# Self-evaluation

The architecture agent reviews its own past recommendations on a
regular cadence. This bucket holds the outcome-vs-prediction tracking.

## When to write

- After each weekly cycle: read prior week's recommendations,
  measure what got ratified, what shipped, whether outcome
  matched prediction.
- After each monthly cycle: synthesize the month's
  recommendation-outcome data into a trend file.

## Template (`<YYYY-MM-DD>.md`)

```markdown
---
period: <weekly | monthly>
window: <YYYY-WW | YYYY-MM>
authored_at: <ISO-8601>
---

## Recommendations made this window

| ID | Title | Status | Outcome vs prediction |
|----|-------|--------|----------------------|
| REC-NNN | ... | ratified | matched |
| REC-NNN | ... | rejected | n/a |
| REC-NNN | ... | ratified | partial |

## Ratification rate

(ratified / proposed)

## Methodology refinements

(what the architecture agent learned from this window)

## False predictions

(specific recommendations where outcome diverged from prediction;
 root cause; methodology adjustment)

## Sources
```

The point is honest self-evaluation. Predictions that don't pan out
inform methodology refinement. AMD-009 P5 honest delta governs.
