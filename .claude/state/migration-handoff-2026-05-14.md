# Migration handoff — 5-terminal → agent-view

**Date:** 2026-05-14
**Migration trigger:** Anthropic released `claude agents` agent-view
feature on 2026-05-11.
**Outgoing pattern:** 5 manually-managed terminals (main, dashboard-
health, main-flows-polish, test-qa, security).
**Incoming pattern:** single terminal running `claude agents`,
dispatching the same 5 agents via the agent-view UI.

Every new agent-view session must boot by reading this document. The
Section-6 boot prompts are designed to copy-paste into the agent-view
dispatch input.

---

## Section 1 — Current substrate state

### Applied amendments (18 total)

| ID | Title |
|---|---|
| AMD-001 | PAUSE_DISCIPLINE v8.2 — remove fictional cap |
| AMD-002 | CRON_CONFIGURATION v8.2 — remove fictional cap |
| AMD-003 | Design-bot dashboard checklist |
| AMD-004 | AUTONOMOUS_FAILURE_RECOVERY v8.3 |
| AMD-005 | Deprecate op-count pause |
| AMD-006 | P18 amendments discipline |
| AMD-007 | Dashboard as newspaper |
| AMD-008 | Edit-section bounded fallback |
| AMD-009 | Senior engineering standard |
| AMD-010 | MAIN_FLOWS v2 |
| AMD-011 | Auto-execute approved proposals |
| AMD-012 | Smoke testing governance |
| AMD-013 | Roadmap v2 |
| AMD-014 | Pause discipline reactivation |
| AMD-015 | Team-proposes / Agent-2-ratifies |
| AMD-016 | Infrastructure-operational question |
| AMD-017 | Continuation discipline |
| AMD-018 | Self-governed push authorization (11-gate criteria) |

### Pending amendments (4 — operating ACTIVE pending ratification)

| ID | Title | Operating status |
|---|---|---|
| AMD-019 | Dashboard freshness per commit | ACTIVE — post-commit hook installed; Gate 11 operative |
| AMD-020 | Auto-clean dirty tree | ACTIVE — class A/B/C/D auto-resolve operative |
| AMD-022 | Inter-agent task queue protocol | ACTIVE — task-queue/ + poll.sh + per-agent READMEs landed |
| AMD-023 | Approval pipeline reliability | ACTIVE — watcher allowlist widened + verify script in place |

AMD-021 is reserved (not yet authored).

### Proposals state

**Shipped (4):**
- PROP-002 main-flows-html operational view
- PROP-003.a token meter sidecar mechanics
- PROP-003.b token meter dashboard telemetry integration
- PROP-004 org monthly quota type

**Approved but not shipped (8 — waiting on proposal-readiness scanner):**
- PROP-005 continuation-discipline skill
- PROP-006 outcome-vs-task skill
- PROP-007 user-context verification gate
- PROP-008 browser-control install
- PROP-009 click-through user-journey gate
- PROP-010 design-bot role formalization
- PROP-011 vision capability install
- PROP-012 mandatory visual review protocol

**Pending (1):**
- PROP-013 button coverage gate

### Applied escalations (3)

- ESC-001 main-flows-v2 taxonomy
- ESC-002 Wave 1 ship 1 selection
- ESC-003 per-ship token attribution instrumentation (Approach A —
  current-ship.json + emit-team-work-summary.py)

### Skills installed (at `~/.claude/skills/`)

- `continuation-discipline` — Q0-Q4 pre-stop checklist + stop-decisions log
- `frontend-design` — bold visual direction, anti-AI-slop
- `canvas-design` — share cards, generated images
- `webapp-testing` — Playwright + visual smoke patterns
- `theme-factory` — design system primitives
- `dream` — internal Anthropic skill (sparse-cloned from skills repo)
- `anthropic-skills-checkout` — meta — manages skills repo subset

### MCP servers connected

- DTC Bookstack — internal DTC knowledge base
- Microsoft 365 — work email + calendar
- Fireflies — meeting transcripts
- Playwright (`@playwright/mcp@latest`) — browser-control for visual
  audit + user-context capture

### Scheduled Tasks (Windows cron)

| Task | Cadence | Purpose |
|---|---|---|
| PARBAUGHS-Daily-Maintenance | Daily 02:55 local | gc + sweep + regen-all + telemetry + report + commit |
| PARBAUGHS-Downloads-Watcher | Every 5 min | Scan Downloads for decisions/amendments/escalations JSON → apply |
| PARBAUGHS-Overnight-Triage | Daily 03:00 local | Overnight FIQ + bug-report triage |
| PARBAUGHS-Proposal-Readiness-Scanner | Every 2h | Scan approved/ for ship-readiness → ship-close |
| PARBAUGHS-Token-Sidecar | Every 5 min | Refresh quota-status.json from manual paste log |

**Not installed (built but Founder-gated):** `PARBAUGHS-Overnight-Agent`
(Tue + Fri 23:00, scripts/overnight-agent/install-scheduled-task.ps1).
Run as Admin to enable Pattern A bounded-scope overnight runs.

### Git hooks active

- `.git/hooks/post-commit` — AMD-019 dashboard freshness; emits
  session.team-work.summary event + regen-all on every commit
- `.husky/pre-commit` — Husky/lint-staged gate (AMD-018 Gate part)
- `.husky/post-commit` — secondary post-commit lane (dashboard-health
  agent installed; coordinates with main post-commit)

### Push authorization

**11-gate self-governed push (AMD-018) operative.**

Gates 1-11 (all must be GREEN before push):
1. Round-trip-test PASS
2. Scroll-reachability PASS
3. User-context capture fresh (<24h)
4. Click-through user-journey PASS
5. Click-every-interactive coverage PASS
6. Visual review PASS (1920x1080 + responsive checkpoints)
7. Critic PASS
8. Design-bot review PASS (for visual changes)
9. Tree clean (Q0 PASS)
10. No deferred debt (PROP-006 outcome-vs-task)
11. Dashboard freshness within seconds of commit (AMD-019)

**Exception list (still requires Founder pre-auth):**
- Database schema changes (Firestore rules, indexes)
- Cloud Function deploys (`firebase deploy --only functions:*`)
- Auth provider changes
- Payment / ParCoin economy changes
- Breaking changes to member-facing data structures
- Production secrets / API key rotation
- IT Glue-stored credentials

---

## Section 2 — Current priorities + state

### PRIORITY 1 — Main-flows polish

**Owner:** main-flows-polish agent (Terminal 3 in outgoing model).
**State:** iter 16 completed P1 (main-flows default state + F9-F62
path generation via canonical JSON). F9-F62 paths approximation-
accepted; refinement is enhancement scope, not bug scope.

**Open:**
- F9-F62 step paths less detailed than F1-F8 (script-generated vs
  hand-authored — refinement work, not blocking)
- Component density 47 vs Janowiak ref's ~60 (data difference,
  approximation accepted)

### PRIORITY 2 — Invite link auto-apply bug

**Owner:** main agent.
**State:** Code + Cloud Function deploy complete (Founder pre-auth
ratified). Going-forward invites work correctly; legacy invites
(pre-iter-16) drop new members into the-parbaughs regardless of
inviter's league (client-side fallback preserves prior behavior).

**Open:**
- E2E signup verification (Founder action — open invite link with new
  account, verify drops into inviter's league)

### PRIORITY 3 — Full app audit

**Owner:** main agent.
**State:** SUMMARY.md scaffolded at
`.claude/state/app-audit-2026-05-14/SUMMARY.md`. Findings closed
this session:

| Finding | Severity | Status |
|---|---|---|
| C1 | CRITICAL | FIXED (P2 invite + Cloud Function deploy) |
| H1 | HIGH | FIXED (data layer + UI consumers) |
| H2 | HIGH | STALE — already fixed in code |
| H3 | HIGH | OPEN — Parbaugh Round joined-players export display, needs deep code archeology |
| M1 | MEDIUM | FIXED (courses.js 9-hole averages) |
| M2 | MEDIUM | STALE — already fixed in code |
| M3 | MEDIUM | FIXED (standings Courses → Our Courses view) |
| M4 | MEDIUM | FIXED (member + trophyroom profile Courses click) |
| L1 | LOW | STALE — already fixed in code |
| L2 | LOW | STALE — already fixed in code |

H3 is the only diagnosed bug remaining. Pattern of session: 4 STALE
findings (CLAUDE.md Known Bugs section drifted from current code).

**Open follow-up:**
- H3 Parbaugh Round joined-players export display
- CLAUDE.md Known Bugs section update (sweep stale entries)
- Authenticated flow walk-through via Playwright MCP
- E2E suite run against fresh emulator

### PRIORITY 4 — CRITICAL + HIGH fixes

Closed via P3 work (C1, H1, H2 stale, M3, M4). H3 remains.

### Bypass flag audit

**Closed iter 16.** PowerShell ExecutionPolicy CurrentUser=RemoteSigned
proper fix landed in `scripts/cron/install-all.ps1` (replaces per-run
`-ExecutionPolicy Bypass`). Git push schannel SEC_E_MESSAGE_ALTERED
fixed via `http.version HTTP/1.1` + `http.postBuffer 524288000`. Both
captured in CLAUDE.md "Operational Gotchas".

### Approval pipeline lockdown

**Closed this session (commit 8743bd4).** AMD-023 authored, watcher
allowlist widened from 3 to 16 patterns, verify script in place, tasks
queued to dashboard + test-qa agents.

### PROP-013 button coverage

**Authored + scripts already operating.** PROP-013 codifies the
existing enumerate-interactives + click-every-interactive pipeline.
Awaiting ratification via amendments UI.

### Wave 1 gate

**Blocked.** W1.S1.b (ship 1.b) awaiting Agent 2 ratification. Founder
relays out-of-band.

---

## Section 3 — Per-agent role definitions

### Main agent (Terminal 1)

**Owns:**
- Member-facing app code (`src/pages/`, `src/core/`, `src/styles/`)
- Repo-level verification (`tests/round-trip-test.py`)
- Cron infrastructure (`scripts/cron/`)
- Overnight-agent wrapper (`scripts/overnight-agent/`)
- P3 audit working files (`.claude/state/app-audit-*`)
- Discipline doc authoring (amendments, proposals)
- CLAUDE.md, top-level `docs/`
- `firestore.rules`, `firestore.indexes.json` (Founder-pre-auth only)
- Cloud Functions code (`functions/`)
- AMD-018 exception list operations (Founder-pre-auth only)

**Does NOT own:**
- `docs/reports/*.html` + `_assets/*` — dashboard agent
- `docs/reports/main-flows.html` + flow data + reference frames —
  main-flows agent
- E2E tests + visual-audit — test-qa agent
- Credential audit + dependency CVE — security agent

### Dashboard-health agent (Terminal 2)

**Owns:**
- `docs/reports/*.html` (except main-flows.html)
- `docs/reports/_assets/*`
- `scripts/regen-*.py` / `scripts/regen-*.sh`
- `scripts/regen-all.sh`
- `.husky/post-commit` (dashboard freshness)
- `.claude/state/dashboard-health/` log
- `.claude/state/aggregates/` (banner data files)

**Does NOT own:**
- Member-facing app code → main
- Main-flows surface → main-flows
- Cron Scheduled Tasks → main

### Main-flows polish agent (Terminal 3)

**Owns:**
- `docs/reports/main-flows.html`
- `docs/reports/_assets/main-flows-data.json`
- `scripts/generate-flow-paths.{py,sh}`
- `.claude/state/main-flows-v2/` — iteration captures, reference
  frames, flow inventory
- `scripts/visual-audit/capture-*` when targeting main-flows

**Does NOT own:**
- Other dashboards → dashboard
- Member-facing app code → main

### Test/QA agent (Terminal 4)

**Owns:**
- `tests/` directory (Playwright e2e, fixtures, helpers)
- `tests/round-trip-test.py` (the canonical PASS/FAIL gate)
- `scripts/visual-audit/*` capture + assertion
- Regression triage (read-only investigation; fixes queue to surface
  owner)
- `scripts/verify-approval-pipeline.sh` continuous monitoring (AMD-023)

**Does NOT own:**
- Authoring fixes after diagnosis → queue surface owner

### Security agent (Terminal 5)

**Owns:**
- Credential leak detection across all paths
- Firestore rule audit (read-only; rule edits queue to main with
  Founder pre-auth flagged)
- Dependency CVE scanning
- Cloud Function security review
- AMD-018 exception-list enforcement
- `.claude/state/security/` log

**Does NOT own:**
- Authoring security fixes → queue surface owner
- Cloud Function deploys → AMD-018 exception list

---

## Section 4 — Coordination mechanisms

### Task queue (AMD-022)

`.claude/state/task-queue/<agent>/` directories. Every agent polls
its own queue + `founder/` at cycle start. Task files are markdown
with YAML frontmatter (see `.claude/state/task-queue/SCHEMA.md`).

Priority handling:
- **CRITICAL** — stop current work, address immediately
- **HIGH** — finish current ship, then address
- **MEDIUM** — next eligible cycle
- **LOW** — batch with other LOW items

CLI: `bash scripts/task-queue/poll.sh list [agent]`

### Banner data files (aggregates)

`.claude/state/aggregates/` contains JSON data files that dashboard
banners read. Agents emit aggregate data here; dashboard regen
consumes. Pattern provides decoupling: agents don't render HTML, and
dashboard doesn't grep source state.

### Git as coordination layer

All cross-session state lives in tracked files. `git pull` before any
work that overlaps other agents' scope; atomic commits scoped to one
agent's ownership; AMD-022 cross-agent writes restricted to assignment
+ notification.

### Polling protocol (codified)

```bash
# At start of every interactive cycle:
ls .claude/state/task-queue/<own-agent>/*.md 2>/dev/null
ls .claude/state/task-queue/founder/*.md 2>/dev/null
```

Process in priority order. Claim by setting `status: in_progress`
before starting. On completion, set `status: completed` + append
`## Findings` + move to `task-queue/completed/`.

### Dashboard freshness (AMD-019)

Post-commit hook fires on every commit. Regen-all updates dashboard
data within seconds. Banner data files re-aggregated. CRITICAL queued
tasks auto-surface to dashboard banner so Founder sees convergence.

---

## Section 5 — Active escalations + pending work

### Wave 1 ship 1.b ratification (W1.S1.b)

**Blocked on:** Agent 2 (Claude.ai CTO) ratification.
**Owner relay:** Founder out-of-band.
**Impact:** Wave 1 cannot start execution until W1.S1.b ratified.

### AMD-019, AMD-020, AMD-022, AMD-023 awaiting ratification

All four operating ACTIVE per Founder verbal directives at authoring
time. Formal ratification via amendments UI pending. No operational
gap (amendments active immediately).

### PROP-013 ratification

**Status:** Authored + scripts already operating; formal proposal
awaits Founder approval via UI.
**Impact:** None operational; codification of in-flight pattern.

### 8 stalled approved proposals (PROP-005..PROP-012)

**Status:** In `approved/`, waiting on proposal-readiness scanner.
**Not a regression:** the pending → approved hop did work for all 8.
The approved → shipped hop runs separately via the
proposal-readiness scanner (every 2h). Worth a follow-up amendment if
that scanner shows similar SKIP-on-dirty-tree drift.

### Cloud Function deploys

**None pending.** P2 invite fix already deployed (Founder pre-authed
per AMD-018 exception list).

### Founder decisions pending

None pending agent action; Founder workflow continues normally
through proposals.html UI.

### In-flight ships

Tree clean post-commit 8743bd4. No in-flight uncommitted work.

---

## Section 6 — Boot prompts for each agent

Copy-paste these into the agent-view dispatch input. Each prompt
references this handoff doc as the source of truth so the agent can
re-read for full context.

### Main agent boot prompt

```
You are the PARBAUGHS main agent in the agent-view multi-session
model (post-migration 2026-05-14). Boot procedure:

1. Read .claude/state/migration-handoff-2026-05-14.md in full.
2. Poll your queue:
     ls .claude/state/task-queue/main/*.md 2>/dev/null
     ls .claude/state/task-queue/founder/*.md 2>/dev/null
3. Read CLAUDE.md for project conventions.
4. Apply continuation-discipline skill (Q0-Q4) before every unit of
   work.

Your scope is defined in Section 3 of the handoff doc. The 11-gate
push authorization (AMD-018) is operative — you commit + push when
all gates green; AMD-018 exception list still requires Founder
pre-auth.

First action: report status — what's in your queue, what you intend
to pick up first, any blockers visible from current tree state.
```

### Dashboard-health agent boot prompt

```
You are the PARBAUGHS dashboard-health agent in the agent-view
multi-session model. Boot procedure:

1. Read .claude/state/migration-handoff-2026-05-14.md in full,
   especially Section 3 (scope) and Section 4 (coordination).
2. Poll your queue:
     ls .claude/state/task-queue/dashboard/*.md 2>/dev/null
     ls .claude/state/task-queue/founder/*.md 2>/dev/null
3. Note: task `approvals-pipeline-banner` is HIGH priority and
   queued for you. Read .claude/state/approval-pipeline-trace-
   2026-05-14.md for context.

Scope: docs/reports/*.html (except main-flows.html),
docs/reports/_assets/*, scripts/regen-*.py, scripts/regen-all.sh,
.husky/post-commit, .claude/state/dashboard-health/,
.claude/state/aggregates/.

First action: report status — what's in your queue (especially the
approvals-pipeline-banner task), what's the current dashboard freshness
state, any data sources missing for tasks you're about to start.
```

### Main-flows polish agent boot prompt

```
You are the PARBAUGHS main-flows polish agent in the agent-view
multi-session model. Boot procedure:

1. Read .claude/state/migration-handoff-2026-05-14.md.
2. Poll your queue:
     ls .claude/state/task-queue/main-flows/*.md 2>/dev/null
     ls .claude/state/task-queue/founder/*.md 2>/dev/null
3. Read the latest .claude/state/main-flows-v2/ iteration notes for
   pickup context.

Scope: docs/reports/main-flows.html only, plus the supporting JSON
(_assets/main-flows-data.json), path generation
(scripts/generate-flow-paths.*), and the iteration captures /
reference frames under .claude/state/main-flows-v2/.

The Janowiak ToDesktop diagram is the visual reference; F9-F62 path
refinement is the most likely next work-item if anything queued.

First action: report status — iter number, what's queued, what
refinements you're considering.
```

### Test/QA agent boot prompt

```
You are the PARBAUGHS test/qa agent in the agent-view multi-session
model. Boot procedure:

1. Read .claude/state/migration-handoff-2026-05-14.md.
2. Poll your queue:
     ls .claude/state/task-queue/test-qa/*.md 2>/dev/null
     ls .claude/state/task-queue/founder/*.md 2>/dev/null
3. CRITICAL: task `continuous-approval-pipeline-verify` is queued
   for you. AMD-023 needs you running scripts/verify-approval-
   pipeline.sh on every cycle.

Scope: tests/ (Playwright e2e, fixtures, helpers),
tests/round-trip-test.py, scripts/visual-audit/*, scripts/verify-
approval-pipeline.sh. Continuous verification across all surfaces.

When you find a regression, queue a fix task to the surface owner
(main / dashboard / main-flows). Do NOT author fixes directly.

First action: run scripts/verify-approval-pipeline.sh and report
outcome. Then report your queue status.
```

### Security agent boot prompt

```
You are the PARBAUGHS security/compliance agent in the agent-view
multi-session model. Boot procedure:

1. Read .claude/state/migration-handoff-2026-05-14.md.
2. Poll your queue:
     ls .claude/state/task-queue/security/*.md 2>/dev/null
     ls .claude/state/task-queue/founder/*.md 2>/dev/null
3. Note: AMD-018 exception list is your enforcement scope. Cloud
   Function deploys, firestore.rules edits, payment changes — all
   require Founder pre-auth and you flag violations.

Scope: credential leak detection (all paths), Firestore rule audit
(read-only review), dependency CVE scanning, Cloud Function security
review. Findings log: .claude/state/security/.

CRITICAL findings (credential exposure, write-allow on sensitive
collections) → write task to task-queue/main/ AND surface to
dashboard banner. Never just log silently.

First action: report status — any CRITICAL findings in current
state, queue contents, next-cycle scan plan.
```

---

## Migration verification checklist (pre-Founder-handoff)

- [x] Approval pipeline lockdown deliverables landed (commit 8743bd4)
- [x] Handoff doc authored (this file)
- [x] Boot prompts ready for copy-paste (Section 6 above)
- [x] Tree clean (post-commit 8743bd4 except routine telemetry +
       this file in progress)
- [x] All amendments operating ACTIVE per Founder directives
- [x] Task queue infrastructure (AMD-022) ready
- [ ] migration-handoff-2026-05-14.md committed (next commit)
- [ ] 26 local commits ahead of remote — Founder reviews + pushes
       per 11-gate AMD-018

## Founder action items (post-migration)

1. Verify Claude Code version: `claude --version` (need v2.1.139+)
2. Launch agent view: `claude agents`
3. For each of the 5 agents, paste the boot prompt from Section 6
   into the agent-view dispatch input. Agent self-boots by reading
   this handoff doc.
4. Watch agents converge on queued tasks. CRITICAL items auto-
   surface to dashboard banner.
5. When ready: push the 26 ahead commits to origin/main per 11-gate.

## Rollback

If agent-view introduces friction or sessions diverge in ways the
task queue can't reconcile, revert to 5-terminal manual pattern.
This handoff doc + task queue infrastructure both survive rollback
(they're tracked files).

## References

- AMD-022 — Inter-agent task queue
- AMD-023 — Approval pipeline reliability
- `.claude/state/approval-pipeline-trace-2026-05-14.md`
- `scripts/task-queue/poll.sh` — CLI
- `scripts/verify-approval-pipeline.sh` — pipeline verify
- CLAUDE.md — project conventions + operational gotchas
