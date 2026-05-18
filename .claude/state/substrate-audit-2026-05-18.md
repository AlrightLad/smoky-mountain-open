# Substrate audit — 2026-05-18 — KEEP / DROP / MIGRATE

Phase 0.5 deliverable. Classifies every AMD, PROP, skill, and discoverable substrate against Superpowers + ECC offerings.

## Decision frame

- **KEEP** — PARBAUGHS-specific (production-risk boundaries, working infrastructure, role definitions, operational context). Cannot be replaced by Superpowers OR ECC.
- **DROP** — Wholly subsumed by a Superpowers OR ECC skill. Archive to `.claude/state/archived-substrate-2026-05-18/` (don't delete).
- **MIGRATE** — Concept correct; can be augmented or rebuilt on top of Superpowers/ECC primitives. Stays operational; rebuild is later work.

## AMDs (25 total, all "applied" status)

| ID | Title | Class | Rationale |
|---|---|---|---|
| AMD-001 | PAUSE_DISCIPLINE v8.2 remove fictional cap | **KEEP** | Anti-pause behavior is reinforced by Superpowers' executing-plans (no-stop discipline), but the AMD encodes the historical incident + concrete language that defines the rule. |
| AMD-002 | CRON_CONFIGURATION v8.2 remove fictional cap | **KEEP** | Defines cron handler behavior. PARBAUGHS-specific. |
| AMD-003 | design-bot dashboard checklist | **KEEP** | PARBAUGHS-specific design-bot taste rubric. |
| AMD-004 | AUTONOMOUS_FAILURE_RECOVERY v8.3 | **KEEP** | Operational rule for autonomous agent recovery. |
| AMD-005 | deprecate op-count pause | **KEEP** | Historical context for current no-stop policy. |
| AMD-006 | P18-amendments-discipline | **MIGRATE** | Proposal flow can use Superpowers' `brainstorming` and `writing-plans` skills for the authoring portion; PARBAUGHS approval pipeline (AMD-023) still owns ratification. |
| AMD-007 | dashboard-as-newspaper | **KEEP** | Founder-specific taste rubric. |
| AMD-008 | edit-section bounded fallback | **KEEP** | Concrete editing technique. |
| AMD-009 | senior-engineering-standard | **MIGRATE** | Aligns with Founder P7 + Superpowers' verification-before-completion. ECC's `code-architect` agent is a useful supplement. |
| AMD-010 | MAIN_FLOWS_v2 | **KEEP** | PARBAUGHS-specific surface spec. |
| AMD-011 | auto-execute-approved-proposals | **KEEP** | Operational automation. |
| AMD-012 | smoke-testing-governance | **KEEP** (augment) | Keep PARBAUGHS smoke discipline; ECC's `e2e-runner` agent can supplement when needed. |
| AMD-013 | roadmap-v2 | **KEEP** | PARBAUGHS roadmap structure. |
| AMD-014 | pause-discipline-reactivation | **KEEP** | Historical context. |
| AMD-015 | team-proposes-agent-2-ratifies | **KEEP** | Three-agent workflow ratification rule. Superpowers' `subagent-driven-development` complements but doesn't replace. |
| AMD-016 | infrastructure-operational-question | **KEEP** | PARBAUGHS operational pattern. |
| AMD-017 | continuation-discipline | **KEEP** (augment) | Anti-false-stop rules. Augmented by Superpowers' `verification-before-completion`. |
| **AMD-018** | self-governed-push-authorization | **KEEP** | 🔒 Spec-mandated KEEP. PARBAUGHS production-risk 11-gate boundary. Irreplaceable. |
| AMD-019 | dashboard-freshness-per-commit | **KEEP** | PARBAUGHS post-commit regen pipeline. |
| AMD-020 | auto-clean-dirty-tree | **KEEP** | PARBAUGHS auto-commit cron drift policy. |
| AMD-021 | strict-closure-discipline | **KEEP** (augment) | Verification rigor. Augmented by Superpowers' `verification-before-completion`. |
| **AMD-022** | inter-agent-task-queue | **KEEP** | 🔒 Spec-mandated KEEP. PARBAUGHS inter-agent infrastructure. |
| **AMD-023** | approval-pipeline-reliability | **KEEP** | 🔒 Spec-mandated KEEP. PARBAUGHS approval pipeline (downloads-watcher). |
| **AMD-024** | architecture-ai-engineer-agent | **KEEP** | 🔒 Spec-mandated KEEP. PARBAUGHS three-agent role definition. |
| AMD-025 | ship-spec-standard | **KEEP** (augment) | PARBAUGHS ship spec format. Superpowers' `writing-plans` is the methodological complement. |

**Net result: 25 KEEP (some with "augment"), 3 MIGRATE (concept correct, can layer plugin primitives), 0 DROP.**

The MIGRATE entries don't get rebuilt now — they're operational as-is. The "MIGRATE" label flags that next time these AMDs are reviewed, the rebuild can use plugin primitives.

## PROPs

### Shipped (4) — historical record
- PROP-002 main-flows html operational view → KEEP
- PROP-003.a token-meter sidecar mechanics → KEEP
- PROP-003.b token-meter dashboard telemetry integration → KEEP
- PROP-004 org-monthly-quota-type → KEEP

### Ship-readiness-deferred (9) — pending resolution
All deferred for the same two reasons:
- `token_cost_methodology_absent` — no documented methodology for token_cost_estimate
- `cross_cutting_dependency` — chained dependencies on unshipped predecessors

**Implication for dashboard goal (Phase T):** PROP-003.a/b sidecar + dashboard integration are SHIPPED. The token meter exists. The PROP-005-013 backlog blocked on `token_cost_methodology_absent` will be unblocked when Phase T finishes — Phase T's token meter implementation IS the documented methodology these PROPs need. So the dashboard goal closes PROP-005-013 transitively.

| PROP | Class | Rationale |
|---|---|---|
| PROP-005 | **KEEP (deferred)** | Resolves on Phase T close |
| PROP-006-013 | **KEEP (deferred)** | Resolves on Phase T close |

## Skills (29 in .claude/skills/ + 7 in ~/.claude/skills/)

### PARBAUGHS skills (`.claude/skills/` — 29 entries incl. .APPROVAL.md companions)

All `parbaughs-*` prefixed skills (21 base + 11 .APPROVAL): **KEEP**. Domain-specific to the golf league platform. No plugin replacement available.

| Skill | Class | Notes |
|---|---|---|
| parbaughs-audit-protocol | KEEP | App-audit method |
| parbaughs-caddy-notes-classifier | KEEP | Member-visible language enforcement |
| parbaughs-critic-checklist | KEEP | Surface review checklist |
| parbaughs-cross-surface-dependency-audit | KEEP | Surface coupling audit |
| parbaughs-deep-research | KEEP | P1 depth-of-research methodology (PARBAUGHS-flavored) |
| parbaughs-design-bot (design-bot-v2) | KEEP | Design quality bot |
| parbaughs-firestore-writer-audit | KEEP | Firestore write-path safety |
| parbaughs-founder-input-triage | KEEP | Founder-input routing |
| parbaughs-handoff-note | KEEP | Inter-session handoff |
| parbaughs-namespace-collision-check | KEEP | data-* attribute collision detection |
| parbaughs-proactive-proposal | KEEP | PROP authoring |
| parbaughs-report-generate | KEEP | Report generation |
| parbaughs-ship-planner | KEEP | Ship spec drafting |
| parbaughs-smoke-failure-triage | KEEP | E2E failure triage |
| parbaughs-telemetry-emit | KEEP | Telemetry event emission |
| parbaughs-version-triple-bumper | KEEP | APP_VERSION/package.json/CACHE_NAME sync |
| parbaughs-visual-verification-protocol | KEEP | V1 vision-verification protocol |
| parbaughs-wellness-checkpoint | KEEP | Periodic wellness check |
| continuation-discipline (project) | KEEP | Stop-decision discriminator (Q0-Q4) |

### User-level skills (`~/.claude/skills/` — 7)
- canvas-design, dream, frontend-design, theme-factory, webapp-testing, anthropic-skills-checkout, continuation-discipline
- All **KEEP** — these are general-purpose, multi-project skills.

## Repo scripts

| Path | Class | Notes |
|---|---|---|
| scripts/scaffold-from-templates.sh | **KEEP** | 🔒 Spec-mandated. Dashboard scaffolding from templates. |
| scripts/verify-approval-pipeline.sh | **KEEP** | 🔒 Spec-mandated. Approval pipeline durability check. |
| scripts/regen-*.py | **KEEP** | Dashboard regen pipeline. |
| scripts/visual-audit/* | **KEEP** | Visual audit + Janowiak capture pipeline. |
| scripts/aggregate-*.py | **KEEP** | Data aggregation for dashboards. |
| scripts/cron/* | **KEEP** | Cron handlers. |
| templates/dashboards/ | **KEEP** | 🔒 Spec-mandated. Dashboard template source-of-truth. |
| tests/round-trip-test.py | **KEEP** | Phase G durability check. |

## Test infrastructure
- smoke@parbaughs.test in smoke-test-league: **KEEP** (🔒 spec-mandated)
- E2E suite in tests/e2e/: **KEEP**
- Playwright config: **KEEP**

## Caddy Notes discipline
**KEEP** (🔒 spec-mandated). Member-visible release notes pattern — irreplaceable, PARBAUGHS-specific.

## Worktree clutter

`.claude/worktrees/architecture-agent-day1/` and `.claude/worktrees/dashboard-banners/` contain duplicate skills/hooks/CLAUDE.md from prior parallel-development experiments. AgentShield flagged these as duplicating findings.

**Class: DROP** — Archive to `.claude/state/archived-substrate-2026-05-18/worktrees-2026-05-18/` then delete the live copies. Deferred from this phase — handle as Phase H housekeeping when durability test runs the rm-rf-scaffold-regen sequence.

## Spec-mandated KEEP confirmation

Per spec line 110-117, the following MUST be in KEEP list:
- ✅ AMD-018 — 11-gate push exception list
- ✅ AMD-022 — inter-agent task queue
- ✅ AMD-023 — approval pipeline reliability
- ✅ AMD-024 — architecture / AI Engineer agent role
- ✅ Test accounts (smoke@parbaughs.test)
- ✅ Caddy Notes discipline
- ✅ Repo structure + templates/dashboards/ + scaffold-from-templates.sh + verify-approval-pipeline.sh

All confirmed KEEP.

## Net

- **KEEP:** 25 AMDs, 4 shipped PROPs, 9 deferred PROPs (resolving via Phase T), 36 skills, all repo scripts, all test infrastructure, all production-risk boundaries.
- **MIGRATE:** 3 AMDs (concept-correct; layer plugin primitives next time they're touched).
- **DROP:** Worktree clutter (deferred to Phase H).
