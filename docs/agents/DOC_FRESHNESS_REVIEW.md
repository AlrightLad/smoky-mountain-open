# Doc Freshness Review

Periodic review protocol keeping governance docs, memory entries, ship reports, and decision-bubble archive aligned with current codebase + roadmap state.

## Why this exists

Per memory #22 (Audit-first protocol catches coupled bugs): "When memory cites tech debt, verify against current codebase before scoping — memory reflects a moment in time, not current state." This applies platform-wide. Governance docs, memory, ship reports drift as the platform evolves. Without periodic review, drift compounds and orchestration team works from stale guidance.

This protocol fires at locked cadence to keep the foundation aligned.

## Review cadence

### Per-ship review
- Caddy Notes updated for current ship
- Ship Plan archived to `docs/agents/ship-reports/` upon close
- Skill performance review per SKILL_PERFORMANCE_REVIEW.md
- Post-push retrospective captures any governance refinements

### Per-wave review (at wave close)
- All ship reports for the wave reviewed for patterns
- Lessons captured to `docs/agents/lessons-learned/WAVE_N_LESSONS.md`
- Backlog reconciliation: closed items removed, deferred items re-prioritized
- Skill graduations / retirements per SKILL_PERFORMANCE_REVIEW.md
- Memory entry audit (see below)
- Governance file audit (see below)

### Per-quarter review (every 3 months regardless of ship cadence)
- Full freshness audit across all governance + memory + ship reports + decision-bubble archive
- Stale flag detection per FEATURE_FLAG_DISCIPLINE.md
- Stale memory entries surfaced for retirement
- Governance docs that no longer match active behavior surfaced for amendment
- Cross-wave dependencies map updated for new ships

### Pre-Launch Phase A review
- Comprehensive freshness audit
- Member-visible behavior consistency verification
- All "TBD" placeholders in governance resolved or explicitly deferred to Launch Phase B
- Migration ships, feature flags, decision bubbles all closed or scheduled

## What gets reviewed

### Memory entries

Each memory entry assessed against:
1. **Still applicable** — does this still describe current codebase / governance / decisions?
2. **Still useful** — is this entry referenced during work, or has it been superseded?
3. **Specific enough** — does it cite locations, ships, dates that are still meaningful?
4. **Within character budget** — is the entry concise (locked memory enforces 500 char max)

Stale entries: retired via `memory_user_edits` `remove` command. Refreshed entries: updated via `replace` command.

### Governance files in docs/agents/

Each governance file assessed against:
1. **Reference accuracy** — do file references in the doc point to current code locations?
2. **Decision currency** — do decisions still apply, or have newer decisions superseded?
3. **Cross-reference integrity** — do cross-refs to other governance docs work?
4. **Skill references** — do referenced skills still exist? (per SKILL_PERFORMANCE_REVIEW.md)
5. **Audit cadence honored** — are the per-ship / per-wave / per-quarter audits actually firing?

Stale docs: amend via dedicated ship if material; minor amendments inline.

### Ship reports in docs/agents/ship-reports/

Each ship report assessed against:
1. **Acceptance criteria** met per closing parbaughs-goal-completion-verify skill output
2. **Caddy Notes entry** matches member-visible reality
3. **Lessons captured** to relevant lessons-learned file
4. **Backlog items** correctly filed with severity tag
5. **Decision bubbles** referenced are findable + closed

Reports are permanent records — never deleted, only annotated if subsequent discoveries amend understanding.

### Decision bubble archive in docs/agents/decision-bubbles/ + lessons-learned

Each bubble assessed against:
1. **Decision still applies** — has subsequent work superseded?
2. **Plain English summary** still readable
3. **Pattern recognition** — does this bubble's pattern compound into skill library?

Decision bubble archive is permanent. Patterns surface to Skills catalog for future automation.

## Audit checklist (per-quarter execution)

Orchestrator (or designated agent) runs through this checklist:

```markdown
## Doc Freshness Audit — <YYYY-Q#>

### Memory
- [ ] All 30 memory entries reviewed for applicability + accuracy
- [ ] Stale entries retired
- [ ] New locks from period captured
- [ ] Entries fit within 500 char budget
- [ ] Build Roadmap entry reflects current ship count

### Governance docs
- [ ] HALT_CRITERIA references current cost thresholds + member counts
- [ ] AGENT_NETWORK references current agent roster + activation status
- [ ] CTO_INTERFACE references current Founder availability + escalation patterns
- [ ] BACKLOG.md severity tags reflect current priorities
- [ ] SKILL_PERFORMANCE_REVIEW.md results applied (retirements, graduations)
- [ ] All cross-references resolve

### Ship reports
- [ ] All closed ships have ship-report files
- [ ] Open ships have ship-plan files
- [ ] Acceptance criteria walkthroughs preserved per ship
- [ ] Lessons-learned files updated per wave

### Decision bubbles
- [ ] Open bubbles have current status
- [ ] Closed bubbles archived to lessons-learned
- [ ] Plain English summaries readable to Founder
- [ ] Bubble outcomes referenced in dependent ship plans

### Feature flags
- [ ] All active flags reviewed for staleness
- [ ] Stale flags scheduled for removal ship
- [ ] Flag-dependent code paths verified

### Cross-wave dependencies
- [ ] CROSS_WAVE_DEPENDENCIES.md reflects current ship count
- [ ] Hard / soft dependency annotations accurate
- [ ] Downstream consumer lists current

### Skills catalog
- [ ] All active skills in SKILL_CATALOG_OVERVIEW.md
- [ ] Recently retired skills removed from catalog
- [ ] Skill performance data informs catalog ordering

### Cost discipline
- [ ] Cost dashboard data accurate against actual spend
- [ ] Halt criterion thresholds reviewed for member count scale
- [ ] Free-tier exhaustion projections current

### Findings + actions
- <Finding 1>: <action>
- <Finding 2>: <action>
```

## Output artifact

Each freshness review produces a markdown file at `docs/agents/freshness-reviews/<YYYY-Q#>-freshness-audit.md` with completed checklist + findings + actions.

Founder reviews findings + ratifies actions. Critic verifies actions completed before next review.

## Cross-references

- Memory #22 (Audit-first protocol)
- SKILL_PERFORMANCE_REVIEW.md (skill catalog freshness)
- FEATURE_FLAG_DISCIPLINE.md (flag staleness)
- POST_PUSH_RETROSPECTIVE.md (per-push freshness signals)
- BACKLOG.md (severity tag freshness)
- PROTOCOLS.md (audit cadence governance)

## Activation

This protocol activates at Phase 1 commit. First freshness review fires:
- Per-ship: immediately upon first ship execution
- Per-wave: at Wave 1 close
- Per-quarter: 3 months after Phase 1 commit OR at Build → Launch interlude (whichever first)
- Pre-Launch Phase A: explicit comprehensive review before Launch Phase A begins
