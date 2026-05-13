# REPORT_TEMPLATES.md

> **Status:** Governance v8 addition. Locked Founder ratification 2026-05-12.
> **Purpose:** Markdown report templates per report type. Used by `parbaughs-report-generate` skill. Each report has matching HTML version per REPORT_HTML_SPEC.md.

---

## 0 — Six report types

| Type | Trigger | MD path | HTML path | Audience |
|---|---|---|---|---|
| Dashboard | Every heartbeat | `.claude/state/reports/dashboard.md` | `docs/reports/dashboard.html` | Founder + agents |
| Daily | End of day (last heartbeat) | `.claude/state/reports/daily/YYYY-MM-DD.md` | `docs/reports/daily/YYYY-MM-DD.html` | Founder |
| Weekly | Proactive cycle (Mondays) | `.claude/state/reports/weekly/YYYY-WW.md` | `docs/reports/weekly/YYYY-WW.html` | Founder |
| Ship | Ship completion | `.claude/state/reports/ships/{ship_id}.md` | `docs/reports/ships/{ship_id}.html` | Founder + agents |
| Wave | Wave close | `.claude/state/reports/waves/{wave_id}.md` | `docs/reports/waves/{wave_id}.html` | Founder + agents |
| Quarterly | Manual or auto-detected (every 13 weeks) | `.claude/state/reports/quarterly/YYYY-QN.md` | `docs/reports/quarterly/YYYY-QN.html` | Founder |

---

## 1 — Dashboard report template

```markdown
# PARBAUGHS Orchestration Dashboard

**Generated:** {timestamp_iso}
**Snapshot age:** {N} minutes since last heartbeat

---

## Current state

**Active cycle:** {cycle_id or "idle"}
**Last cycle:** {last_cycle_id} ({outcome}, {duration})

**Next scheduled:**
- Heartbeat: {next_heartbeat_timestamp} ({minutes_until} min)
- Ship: {next_ship_timestamp} ({hours_until} h)
- Proactive: {next_proactive_timestamp} ({days_until} d)

---

## Current ship

**Ship:** {ship_id} — {ship_title}
**Wave:** {wave_id}
**Progress:** {progress_pct}% complete
**Started:** {ship_started_at}
**Expected completion:** {expected_completion}
**Cycles consumed so far:** {cycles_count}
**Tokens consumed so far:** {tokens_consumed}k

---

## Current Wave

**Wave:** {wave_id} — {wave_title}
**Ships completed:** {N} / {total_ships}
**Wave progress:** {wave_progress_pct}%
**Average tokens per ship:** {avg_tokens}k
**Average duration per ship:** {avg_duration_hours} h

---

## Queue health

| Queue | Active | Stale | Notes |
|---|---|---|---|
| FIQ | {fiq_active} | {fiq_stale} | {fiq_blocking} blocking |
| Proposals pending review | {proposals_pending} | — | {weeks_pending} weeks old (oldest) |
| Proposals approved unimplemented | {proposals_approved_pending} | — | Will execute in next ship cycles |

---

## Cost state

**Last 24 hours:** {tokens_24h}k tokens
**Last 7 days:** {tokens_7d}M tokens
**Weekly budget consumption:** {pct_consumed}% of {weekly_threshold}M target
**Threshold breached:** {yes/no}
**Cost trend (7-day):** {up/down/stable}

---

## Agent state

| Agent | Past wellness threshold | In rest cycle | Active handoffs pending ack |
|---|---|---|---|
| Engineer | {yes/no} | {yes/no} | {N} |
| Critic | {yes/no} | {yes/no} | {N} |
| ... | ... | ... | ... |

---

## Halt state

- **Cron paused:** {yes/no}
- **Any halt active:** {yes/no}
- **Last halt:** {halt_summary or "none in 7 days"}

---

## Telemetry data sources

- current-snapshot: `.claude/state/telemetry/aggregates/current-snapshot.json`
- cycles: `.claude/state/telemetry/aggregates/cycles.json`
- Generated at: {timestamp_iso}
```

---

## 2 — Daily report template

```markdown
# Daily Report — {YYYY-MM-DD}

**Generated:** {timestamp_iso} (end of day)

---

## Cycles this day

**Total cycles:** {N} (heartbeat: {N}, ship: {N}, proactive: {N})
**Total duration:** {Nh}
**Total tokens:** {N}k
**Outcomes:** {N} SUCCESS / {N} OVERRUN / {N} SKIP / {N} HALT

### Cycle log

| Time | Cycle | Duration | Tokens | Outcome |
|---|---|---|---|---|
| {HH:MM} | heartbeat-... | {Nm} | {N}k | SUCCESS |
| {HH:MM} | ship-... | {Nm} | {N}k | SUCCESS |
| ... | ... | ... | ... | ... |

---

## Ship progress today

- **{ship_id}:** {progress_at_start}% → {progress_at_end}% ({delta}%)
- **{ship_id}:** {progress_at_start}% → {progress_at_end}% ({delta}%)

---

## Token consumption by role

| Role | Tokens | Pct |
|---|---|---|
| Engineer | {N}k | {pct}% |
| Critic | {N}k | {pct}% |
| Orchestrator | {N}k | {pct}% |
| ... | ... | ... |

---

## Token consumption by activity

| Activity | Tokens | Pct |
|---|---|---|
| Preflight | {N}k | {pct}% |
| Execution | {N}k | {pct}% |
| Discussion Bubbles | {N}k | {pct}% |
| Retrospective | {N}k | {pct}% |
| Telemetry | {N}k | {pct}% |
| Handoffs | {N}k | {pct}% |
| Wellness | {N}k | {pct}% |

---

## Code activity

- **Files modified:** {N}
- **Lines added:** {N}
- **Lines removed:** {N}
- **Tests added:** {N}
- **Commits:** {N}
- **Coverage:** {pct_start}% → {pct_end}%

---

## Handoffs

**Total handoffs written today:** {N}

**By scenario:**
| Scenario | Count |
|---|---|
| 1. Cycle-to-cycle | {N} |
| 2. Agent-to-agent | {N} |
| 3. Subagent-to-parent | {N} |
| ... | ... |

**Avg ack delay:** {N} seconds (target <60s)
**Pending acks at end of day:** {N}

---

## Discussion Bubbles

**Total discussion bubbles run today:** {N}
**Decisions reached:** {N}
**Tie-breaks invoked:** {N}
**Avg duration:** {N} minutes

---

## FIQ activity

- **Entries created today:** {N}
- **Entries resolved today:** {N}
- **Net delta:** {+/-N}
- **Active total at EOD:** {N}

---

## Wellness

- **Checkpoints triggered today:** {N}
- **Outcomes:** {N} clean / {N} drift / {N} escalate
- **Wellness halts:** {N}

---

## Notable events

{Bullet list of any unusual events today: halts, scope violations, repeated failures, etc.}

---

## Tomorrow's outlook

- **Scheduled ship cycle:** {next_ship_timestamp}
- **Ship in flight:** {ship_id} ({progress_pct}% complete)
- **Expected completion:** {expected_completion}
- **Open blocking FIQ:** {N}

---

*Generated from: `.claude/state/telemetry/events/{YYYY-MM-DD}.ndjson` and aggregates.*
```

---

## 3 — Weekly report template

```markdown
# Weekly Report — {YYYY-WW}

**Week of:** {monday_date} to {sunday_date}
**Generated:** {timestamp_iso} (proactive cycle)

---

## Executive summary

{2-3 sentence summary of the week. E.g.: "Wave 1 progressed from 30% to 50% complete with 3 ships landing (W1.S3, W1.S4, W1.S5). Token consumption ran 8% over weekly budget due to extended discussion bubble on Ship W1.S4 typography. No halts. Proactive cycle generated 12 proposals; 8 awaiting Founder review."}

---

## Ships closed this week

| Ship | Wave | Duration | Tokens | Discussion Bubbles | FIQ |
|---|---|---|---|---|---|
| W1.S3 | W1 | 4 days | 720k | 8 | 5 |
| W1.S4 | W1 | 5 days | 920k | 12 | 7 |
| W1.S5 | W1 | 3 days | 540k | 6 | 3 |

**Ships in flight at end of week:** {N}
**Average ship duration:** {N} days
**Average ship tokens:** {N}k

---

## Wave progress

**Wave 1:** {progress_start_pct}% → {progress_end_pct}% (+{delta}%)
**Ships remaining in Wave 1:** {N}
**Projected Wave 1 completion:** {date} (based on current velocity)

---

## Token consumption

**Total this week:** {N}M tokens
**Weekly budget target:** {N}M tokens
**Budget consumption:** {pct}%

### By cycle type
- Heartbeat: {N}M ({pct}%)
- Ship: {N}M ({pct}%)
- Proactive: {N}M ({pct}%)

### By role
- Engineer: {N}M ({pct}%)
- Critic: {N}M ({pct}%)
- Orchestrator: {N}M ({pct}%)
- ...

### By activity
- Preflight: {N}M ({pct}%)
- Execution: {N}M ({pct}%)
- Discussion Bubbles: {N}M ({pct}%)
- Retrospective: {N}M ({pct}%)
- Telemetry: {N}M ({pct}%)
- Handoffs: {N}M ({pct}%)

---

## Trends (7-day rolling)

- **Tokens per ship:** {trend up/down/stable, delta vs last week}
- **Ship duration:** {trend}
- **Discussion Bubble count per ship:** {trend}
- **FIQ resolution rate:** {trend}

---

## Code metrics

- **Files modified this week:** {N}
- **Lines added:** {N}
- **Lines removed:** {N}
- **Tests added:** {N}
- **Coverage trend:** {start}% → {end}% ({delta})
- **Commits:** {N}

---

## Handoff metrics

**Total handoffs this week:** {N}

| Scenario | Count | Avg ack delay |
|---|---|---|
| 1. Cycle-to-cycle | {N} | {N}s |
| 2. Agent-to-agent | {N} | {N}s |
| ... | ... | ... |

---

## Discussion Bubbles

**Total discussion bubbles this week:** {N}
**Discussion Bubble outcomes:**
- {decision summary 1}
- {decision summary 2}
- ...

**Discussion Bubble cost:** {N}k tokens ({pct}% of weekly spend)

---

## Proactive cycle (this week)

**Proposals generated:** {N}
- Lane 1 (UI Polish): {N}
- Lane 2 (Bug Discovery): {N}
- Lane 3 (Performance): {N}
- Lane 4 (Design System): {N}

**Critic quality-bar rejections:** {N}
**Pending Founder review:** {N}

---

## Approved proposals implemented this week

| PROP ID | Lane | Surface | Cost (est/actual) |
|---|---|---|---|
| PROP-001 | 1 | 3h.1.4 | 15m / 18m |
| PROP-008 | 3 | Honors leaderboard | 45m / 52m |

---

## FIQ activity

- **Entries this week:** {N} created
- **Entries resolved:** {N}
- **Stale entries:** {N}
- **Blocking entries pending:** {N}

---

## Wellness summary

**Checkpoints this week:** {N}
- Clean: {N}
- Drift detected: {N}
- Escalated: {N}

**Halts this week:** {N}

---

## Notable events

{Significant events from the week. Patterns, anomalies, Founder-relevant items.}

---

## Cost vs budget

**Weekly cost:** ${N} ({tokens}M tokens at {avg_rate})
**Budget:** ${N}
**Variance:** {+/-pct}%

---

## Next week preview

- **Ships scheduled:** {list of next ships}
- **Wave milestones:** {expected completions}
- **Founder reviews due:** {N} proactive proposals, {N} FIQ batch
- **Memory consolidation:** {scheduled?}

---

*Generated by proactive cycle from: `.claude/state/telemetry/aggregates/`.*
```

---

## 4 — Ship report template

```markdown
# Ship Report — {ship_id}

**Title:** {ship_title}
**Wave:** {wave_id}
**Status:** Completed
**Started:** {start_timestamp}
**Completed:** {end_timestamp}
**Total duration:** {N} days, {N} cycles

---

## Summary

{2-3 sentence summary of what shipped, key outcomes, any anomalies.}

---

## Token consumption

**Total:** {N}k tokens

### By phase
| Phase | Tokens | Pct |
|---|---|---|
| Preflight | {N}k | {pct}% |
| Discussion Bubbles | {N}k | {pct}% |
| Execution | {N}k | {pct}% |
| Retrospective | {N}k | {pct}% |
| Wellness | {N}k | {pct}% |
| Handoffs | {N}k | {pct}% |
| Telemetry | {N}k | {pct}% |

### By role
| Role | Tokens | Pct |
|---|---|---|
| Engineer | {N}k | {pct}% |
| Critic | {N}k | {pct}% |
| Orchestrator | {N}k | {pct}% |
| UI Polisher | {N}k | {pct}% |
| ... | ... | ... |

---

## Cycle waterfall

```
Day 1: ████████░░ 30% (preflight + discussion bubbles + initial execution)
Day 2: ████████████ 50% (execution + checkpoint + handoff)
Day 3: ████████████ 70% (execution + discussion bubble + critic audit)
Day 4: ██████████████ 100% (retrospective + completion)
```

---

## Discussion Bubbles ({N} total)

| Discussion Bubble | Question | Outcome | Tokens |
|---|---|---|---|
| discussion bubble-... | "..." | "..." | {N}k |
| discussion bubble-... | "..." | "..." | {N}k |

---

## Handoffs ({N} total)

| Scenario | Count |
|---|---|
| 1. Cycle-to-cycle | {N} |
| 2. Agent-to-agent | {N} |
| ... | ... |

---

## Code changes

- **Files modified:** {N}
- **Lines added:** {N}
- **Lines removed:** {N}
- **Net delta:** {+/-N}
- **Tests added:** {N}
- **Coverage at start:** {pct}%
- **Coverage at end:** {pct}%
- **Coverage delta:** {+/-pct}%
- **Commits:** {N}

### Files touched

| File | Lines changed | Tests added |
|---|---|---|
| src/pages/scorecard.js | +120 / -30 | 3 |
| ... | ... | ... |

---

## FIQ entries

**Created during ship:** {N}
**Resolved during ship:** {N}
**Carried forward:** {N}

| FIQ ID | Question | Status |
|---|---|---|
| FIQ-007 | "..." | Resolved by Founder 2026-05-19 |
| FIQ-008 | "..." | Active, non-blocking |

---

## Wellness

- **Checkpoints triggered:** {N}
- **Outcomes:** {N} clean / {N} drift
- **Halts:** {N}

---

## Decisions locked

- {Decision 1 from discussion bubbles or Critic audits}
- {Decision 2}
- {Decision 3}

---

## Tech debt added

- {Debt item 1 — to track in TECH_DEBT_INVENTORY.md}

## Tech debt resolved

- {Debt item 1 — was tracked, now closed}

---

## Linked proposals implemented

- PROP-{XXX} (Lane {N}): {short title}
- PROP-{XXX} (Lane {N}): {short title}

---

## Retrospective notes

{Component 3 plain-English summary from post-push retrospective.}

---

## References

- Ship Vision: `docs/agents/ship-visions/{ship_id}.md`
- Cycle history: filter cycle-history.json by `ship_id={ship_id}`
- All handoffs: `.claude/state/handoffs/**/*{ship_id}*`

---

*Generated at ship completion.*
```

---

## 5 — Wave report template

```markdown
# Wave Report — {wave_id}

**Title:** {wave_title}
**Status:** Completed
**Started:** {start_timestamp}
**Completed:** {end_timestamp}
**Total duration:** {N} weeks

---

## Summary

{3-5 sentence executive summary of the wave. Major outcomes, key decisions, lessons learned.}

---

## Ships completed ({N}/{total})

| Ship | Title | Duration | Tokens | Status |
|---|---|---|---|---|
| W1.S1 | ... | {N}d | {N}k | Complete |
| W1.S2 | ... | {N}d | {N}k | Complete |
| ... | ... | ... | ... | ... |

**Ships deferred to future wave:** {list if any}

---

## Token consumption (wave total)

**Total tokens:** {N}M

### By role (wave totals)
- Engineer: {N}M ({pct}%)
- Critic: {N}M ({pct}%)
- Orchestrator: {N}M ({pct}%)
- ...

### Per-ship average
- Avg tokens per ship: {N}k
- Avg duration per ship: {N} days

---

## Wave waterfall (Gantt)

```mermaid
gantt
    title Wave {wave_id} ship timeline
    dateFormat YYYY-MM-DD
    section Ships
    W1.S1 :2026-05-01, 4d
    W1.S2 :2026-05-05, 5d
    W1.S3 :2026-05-10, 3d
    ...
```

(Auto-generated; renders in GitHub markdown.)

---

## Decisions locked this wave

- **{Decision 1}** — rationale, affects: {scope}
- **{Decision 2}** — rationale, affects: {scope}
- ...

---

## Design system state at wave close

- **Tokens:** {N total, {delta} this wave}
- **Primitives:** {N total, {delta} this wave}
- **Utility classes:** {N total, {delta} this wave}
- **Color palette:** {state if changed}

---

## Tech debt

- **Inventory at wave start:** {N items}
- **Added this wave:** {N items}
- **Resolved this wave:** {N items}
- **Inventory at wave end:** {N items}

---

## Proven patterns (reusable in next wave)

- {Pattern 1}
- {Pattern 2}
- {Pattern 3}

## Anti-patterns identified

- {Anti-pattern 1 — origin context}
- {Anti-pattern 2 — origin context}

---

## Founder directives locked this wave

- {Directive 1 — origin and scope}
- {Directive 2 — origin and scope}

---

## Cost analysis

**Total wave cost:** ${N}
**Tokens consumed:** {N}M
**Avg cost per ship:** ${N}

---

## Discussion Bubble + handoff summary

- **Total discussion bubbles:** {N}
- **Total handoffs:** {N} across {scenarios}
- **Avg discussion bubbles per ship:** {N}
- **Avg handoffs per ship:** {N}

---

## FIQ summary

- **Entries this wave:** {N}
- **Resolved:** {N}
- **Carried forward:** {N}
- **Avg resolution time:** {N} days

---

## Wellness summary

- **Total checkpoints:** {N}
- **Drift incidents:** {N}
- **Halts:** {N}
- **Rest cycles taken:** {N}

---

## Proactive proposals (wave-spanning)

- **Generated during wave:** {N}
- **Implemented during wave:** {N}
- **Founder acceptance rate:** {pct}%

---

## Next wave handoff

See: `.claude/state/handoffs/wave-transitions/{closing_wave}-to-{opening_wave}.md`

---

*Generated at wave close.*
```

---

## 6 — Quarterly report template

```markdown
# Quarterly Report — {YYYY-QN}

**Period:** {quarter_start} to {quarter_end}
**Generated:** {timestamp_iso}

---

## Executive summary

{High-level summary of the quarter: waves completed, milestones hit, cost trends, organizational learnings.}

---

## Waves completed

| Wave | Ships | Duration | Tokens | Cost |
|---|---|---|---|---|
| W1 | 20/20 | 8 weeks | 60M | ${N} |
| W2 | 6/6 | 4 weeks | 18M | ${N} |
| ... | ... | ... | ... | ... |

---

## Total quarterly metrics

- **Total ships completed:** {N}
- **Total cycles run:** {N} (heartbeat: {N}, ship: {N}, proactive: {N})
- **Total tokens:** {N}M
- **Total cost:** ${N}
- **Avg cost per ship:** ${N}

---

## Trend analysis

### Token consumption trend (week-over-week)
{Embedded chart in HTML version; data table in MD version}

### Ship velocity trend
{Embedded chart in HTML version}

### Discussion Bubble cost as % of total
{Embedded chart in HTML version}

---

## Major decisions (quarter)

- {Decision 1 — Wave/Ship origin, scope, rationale}
- ...

---

## Founder retrospective input

{Founder writes during quarterly review session. Initially empty in auto-generated report; Founder edits to add.}

---

## Going forward

- **Wave roadmap:** {next waves with target dates}
- **Cost budget:** {next quarter target}
- **Memory locks scheduled:** {upcoming memory consolidations}

---

*Generated quarterly (manual or auto-detected every 13 weeks).*
```

---

## 7 — HTML version pairing

Every markdown report has a paired HTML version per REPORT_HTML_SPEC.md. The HTML version:
- Reads same telemetry data
- Renders identical metrics
- Adds interactive charts (Chart.js)
- Adds filter/drilldown capability
- Lives at `docs/reports/{type}/{name}.html`

Both versions generated by `parbaughs-report-generate` skill in same invocation.

---

## 8 — Template variable substitution

Skill substitutes `{variable_name}` placeholders with values from telemetry aggregates. Substitution rules:

- `{timestamp_iso}` → ISO 8601 UTC at generation time
- `{N}`, `{pct}` → numeric values from aggregates
- `{cycle_id}`, `{ship_id}` → string IDs
- `{trend up/down/stable}` → computed from rolling window comparison
- `{list}` → bullet list or comma-separated, format-appropriate

Substitution always preserves layout. Missing data yields "—" or "n/a", not blank strings.

---

## 9 — Cross-references

- `TELEMETRY_PROTOCOL.md` (telemetry data sources)
- `REPORT_HTML_SPEC.md` (HTML version spec)
- `parbaughs-report-generate` skill (generation pattern)
- `parbaughs-telemetry-emit` skill (event emission)
- `HANDOFF_PROTOCOL.md` (handoff data feeds reports)

---

*Document authored 2026-05-12. Locked Founder ratification.*
