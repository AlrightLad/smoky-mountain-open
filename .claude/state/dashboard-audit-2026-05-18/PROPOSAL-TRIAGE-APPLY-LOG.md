# Proposal triage apply log — 2026-05-19

**Source of truth:** `.claude/state/task-queue/founder/proposal-triage-2026-05-19.md`
**Founder authorization:** blanket-approval-2026-05-19
**Apply timestamp:** 2026-05-19T03:00:00Z
**Apply operator:** Claude Code (engineer/QA agent)

## Summary

| Bucket | Count | Disposition |
|---|---|---|
| OBSOLETED-BY (archived) | 7 | PROP-005, PROP-007, PROP-008, PROP-009, PROP-011, PROP-012, PROP-013 |
| STILL-RELEVANT (approved) | 2 | PROP-006, PROP-010 |
| **Total resolved** | **9 of 9** | |

All 9 proposals had Founder-approval dating to 2026-05-14 (per `.claude/state/proposals/decisions-log.ndjson`). The triage resolves the administrative state: which proposals were already substantively closed by shipped substrate (archive), and which still represent open work (approve, continue).

## Per-proposal BEFORE → AFTER

### Batch A — STILL-RELEVANT (approve, content ratified)

#### PROP-006 — Author outcome-vs-task skill

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-006-outcome-vs-task-skill.md` (Founder-approved 2026-05-14)
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-006.json` (scanner-deferred for sparse frontmatter)
  - Status: approved-but-stalled
- **AFTER**
  - `.md` remains at `.claude/state/proposals/approved/PROP-006-outcome-vs-task-skill.md` with trailing **Approval metadata** block
  - `.json` moved to `.claude/state/proposals/approved/PROP-006.json` (no longer deferred)
  - Status: approved
- **Citation:** Triage doc Batch A row 1. Content ratified. Small finishing job (~600 tokens) to author `~/.claude/skills/outcome-vs-task/SKILL.md` as the symmetric sister-skill of continuation-discipline. Substrate content currently operative from `.claude/state/lessons-learned/engineering-mindset.md`.

#### PROP-010 — Design-bot role formalization

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-010-design-bot-role-formalization.md` (Founder-approved 2026-05-14)
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-010.json`
  - Status: approved-but-stalled
- **AFTER**
  - `.md` remains at `.claude/state/proposals/approved/PROP-010-design-bot-role-formalization.md` with trailing **Approval metadata** block
  - `.json` moved to `.claude/state/proposals/approved/PROP-010.json`
  - Status: approved (closure gated by Phase G)
- **Citation:** Triage doc Batch A row 2. Content ratified. **NOTE on closure semantics:** the approval here means "Founder accepts the proposal's content as ratified," NOT "team must ship immediately." Closure is gated by Phase G design-batch per dashboard-completion-spec D39 ("PROP-010 + design-bot APPROVE on every dashboard surface"). The `parbaughs-design-bot.md` skill is already operative; remaining gap is `docs/agents/DESIGN_BOT.md` formalization, which Phase G will complete.

### Batch B — OBSOLETED-BY (archive, substrate operative)

#### PROP-005 — Continuation-discipline skill + Critic protocol update

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-005-continuation-discipline-skill.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-005.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-005-continuation-discipline-skill.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-005.json`
- **Citation:** SHIPPED — `.claude/skills/continuation-discipline/` operative (skill auto-loads per system reminder); `docs/agents/CONTINUATION_DISCIPLINE.md` exists; AMD-017 applied; `.claude/state/stop-decisions/` logging active. Triage doc Batch B row 1.

#### PROP-007 — User-context verification gate

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-007-user-context-verification-gate.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-007.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-007-user-context-verification-gate.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-007.json`
- **Citation:** SHIPPED — `scripts/visual-audit/founder-context-capture.mjs` on disk; round-trip `[user-context-gate]` block at `tests/round-trip-test.py:1833` operative; cited in CONSOLIDATION session 2. Triage doc Batch B row 2.

#### PROP-008 — Browser-control install (Playwright MCP)

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-008-browser-control-install.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-008.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-008-browser-control-install.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-008.json`
- **Citation:** SHIPPED — `@playwright/mcp` installed; `playwright` MCP server in `~/.claude.json`; `mcp__playwright__*` tools available in this session's deferred-tool list. Triage doc Batch B row 3.

#### PROP-009 — Click-through user-journey gate

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-009-click-through-user-journey-gate.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-009.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-009-click-through-user-journey-gate.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-009.json`
- **Citation:** SHIPPED — `scripts/visual-audit/user-journey-audit.mjs` on disk; used in session 2 design-bot reviews; click-every coverage absorbs PROP-013 scope. Triage doc Batch B row 4.

#### PROP-011 — Vision capability install

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-011-vision-capability-install.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-011.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-011-vision-capability-install.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-011.json`
- **Citation:** SHIPPED — Four Anthropic skills (`frontend-design`, `webapp-testing`, `canvas-design`, `theme-factory`) installed at `~/.claude/skills/` and available in this session's skill list. Z.AI MCP correctly deferred (paid). Triage doc Batch B row 5.

#### PROP-012 — Mandatory visual review protocol

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-012-mandatory-visual-review-protocol.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-012.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-012-mandatory-visual-review-protocol.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-012.json`
- **Citation:** SHIPPED — `.claude/skills/parbaughs-visual-verification-protocol.md` exists (codifies iter-14 Read-and-articulate discipline); used in session 2 main-flows iteration; dashboard-completion-spec line 450 cites "PROP-012 visual review per surface, V1" as a live convention. Triage doc Batch B row 6.

#### PROP-013 — Button coverage gate (click-every-interactive)

- **BEFORE**
  - `.md` at `.claude/state/proposals/approved/PROP-013-button-coverage-gate.md`
  - `.json` stub at `.claude/state/proposals/ship-readiness-deferred/PROP-013.json`
- **AFTER**
  - `.md` moved to `.claude/state/proposals/archived/PROP-013-button-coverage-gate.md` with **Archive metadata** trailing block
  - `.json` moved to `.claude/state/proposals/archived/PROP-013.json`
- **Citation:** SHIPPED — `scripts/visual-audit/enumerate-interactives.mjs` + `scripts/visual-audit/click-every-interactive.mjs` on disk; AMD-018 11-gate stack incorporates Gate 5 click-every coverage; used in session 2 button audits. Triage doc Batch B row 7.

## Net state-of-pipeline after apply

- `.claude/state/proposals/approved/` — now contains PROP-006 + PROP-010 (each with `.md` + `.json`)
- `.claude/state/proposals/ship-readiness-deferred/` — **empty** (all 9 .json stubs dispositioned)
- `.claude/state/proposals/archived/` — newly created; contains 7 archived proposals (each with `.md` + `.json`) + `README.md`
- `.claude/state/proposals/decisions-log.ndjson` — 9 new entries appended (timestamped 2026-05-19T03:00:00Z)

## Constraints observed

- All file moves used `git mv` to preserve history
- No PROP-*.md content was modified — archive/approval metadata appended as trailing blocks only
- No proposal content was deleted
- Per-archive citations point to the specific shipped artifact (skill / script / AMD) per the triage document
- README.md created in `archived/` documenting state-machine semantics

## References

- Triage doc: `.claude/state/task-queue/founder/proposal-triage-2026-05-19.md`
- Decisions log: `.claude/state/proposals/decisions-log.ndjson` (lines 15-23 are the 2026-05-19 entries)
- Archived README: `.claude/state/proposals/archived/README.md`
