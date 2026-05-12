# Phase 1 — Environment Validation

**Validation run:** 2026-05-12 (Phase 1 setup STEP 6)
**Target:** Verify Claude Code + Agent Teams + repo configuration ready for new orchestration

## Tooling versions

| Component | Required | Found | Status |
|---|---|---|---|
| Claude Code CLI | v2.1.32+ | v2.1.139 | ✓ Pass |
| Node.js (Hook helper + Vite) | Active | (current shell session) | ✓ Pass (Vite builds + smoke runner working per audit) |
| Vite | ^8.0.8 (per package.json) | 8.0.x (locked via package.json) | ✓ Pass |
| Playwright | ^1.59.1 | 1.59.x (locked via package.json) | ✓ Pass |
| firebase-admin | ^13.8.0 | 13.8.x | ✓ Pass |
| Husky | ^9.1.7 | (locked) | ✓ Pass; `.husky/pre-commit` referenced |

## Agent Teams environment

### `CLAUDE_EXPERIMENTAL_AGENT_TEAMS` flag

**Status:** NOT SET in current shell session.

**Output of check:** `$env:CLAUDE_EXPERIMENTAL_AGENT_TEAMS` returns empty.

**Implications:**
- Agent Teams (Orchestrator + Engineer + Critic invocation via subagent infrastructure) requires this flag to be set
- Without flag, agent invocation falls back to single-agent operation (which is what this Phase 1 setup runs as)
- Phase 1 setup completes without Agent Teams active; future ships can fire under single-agent until flag set

### `~/.claude/teams/parbaughs/config.json`

**Status:** Does NOT exist.

**Glob check:** No file found at expected path.

**Implications:**
- Agent Teams config absent; per-team agent config not yet authored
- Phase 1 setup runs as single-agent (default) — no team config consulted
- When Founder sets the flag and creates the config, Agent Teams can fire

### Phase 1 inferred decision: do NOT modify host environment

Per `PHASE_1_FOUNDER_REVIEW.md` Q1 + INFERRED_DECISIONS.md Phase 1 entries: agent does not autonomously modify Founder's machine environment variables. The env var setup is Founder's morning task.

**Steps for Founder at morning retrospective (manual):**

```powershell
# Persistent (survives reboots):
[Environment]::SetEnvironmentVariable("CLAUDE_EXPERIMENTAL_AGENT_TEAMS", "1", "User")

# Session-only (current PowerShell only):
$env:CLAUDE_EXPERIMENTAL_AGENT_TEAMS = "1"
```

After setting:
```powershell
# Verify:
$env:CLAUDE_EXPERIMENTAL_AGENT_TEAMS
# Should print: 1
```

Then create `~/.claude/teams/parbaughs/config.json` with the Orchestrator + Engineer + Critic agent definitions. Format depends on Claude Code's current Agent Teams schema — Founder consults `claude --help` or release notes for v2.1.139.

## Repo configuration

### Working directory
- Path: `C:\Users\Zach\smoky-mountain-open`
- Git branch: `main`
- Remote: tracked (origin/main up to date pre-Phase-1 audit + settings commits)

### Hooks active (post-Phase-1 settings update)
- 5 pre-existing hooks (lint, version-sync, gate-assertions, gate-protected, post-edit-syntax)
- 6 new hooks added in Phase 1 STEP 3:
  - `push-protection.sh` (Bash matcher)
  - `secrets-scanner.sh` (Edit/Write/MultiEdit matcher)
  - `schema-mutation-alarm.sh` (Edit/Write/MultiEdit matcher)
  - `governance-protection.sh` (Edit/Write/MultiEdit matcher)
  - `skill-approval-gate.sh` (Edit/Write/MultiEdit matcher)
  - `gate-protected.sh` (Edit/Write/MultiEdit) — EXTENDED, not new file; added `payments/`, `auth/`, `create-smoke-account.js` patterns

Total: 11 hook invocations across 3 matchers.

### Skills active (post-Phase-1 STEP 2)
10 skills committed to `.claude/skills/` with sibling `*.APPROVAL.md` token files:
- parbaughs-audit-protocol
- parbaughs-ship-planner
- parbaughs-critic-checklist
- parbaughs-firestore-writer-audit
- parbaughs-smoke-failure-triage
- parbaughs-namespace-collision-check
- parbaughs-cross-surface-dependency-audit
- parbaughs-caddy-notes-classifier
- parbaughs-version-triple-bumper
- parbaughs-visual-verification-protocol

All under AUTO-PHASE-1 ratification per inferred decision; Founder reviews + ratifies/reverses at retrospective.

### Permissions block (per separate commit `3794499`)
Pre-authorizes 10 standard tool patterns; denies 4 dangerous patterns (rm -rf root/home; force push). Hooks remain the real safety layer.

## Production health (verified at audit time)

- `curl -I https://alrightlad.github.io/smoky-mountain-open/` → 200 OK ✓
- Bundle size: ~1.97 MB
- Service worker `parbaughs-v8.22.0` active ✓
- Version triple aligned (utils.js + package.json + sw.js all 8.22.0) ✓

## Test infrastructure

- E2E: `tests/e2e/flows/*.spec.js` (6 spec files, 44+ tests) — Tier 2 regression suite per CLAUDE.md
- Smoke: `tests/smoke/scenarios/*.js` (27 scenarios s1 → s26 + _demo) — Tier 1 cross-browser pre-push gate per CLAUDE.md (planned for v7.9.1 per CLAUDE.md note; ACTUALLY ALREADY EXISTS per Phase 1 audit UD-1)
- Smoke runner: `tests/smoke/run.js` covers 4 browsers (chromium, firefox, webkit, webkit-mobile)
- Smoke account: `smoke@parbaughs.test` in `smoke-test-league` (per `docs/SMOKE_TEST_ACCOUNT.md`, .env.local-loaded creds)
- Real Firebase smoke (no mocks) — confirmed via `tests/smoke/run.js:23-25` SMOKE_EMAIL + SMOKE_PASSWORD loading

## Engineer + Critic agent invocation

Cannot test directly without `CLAUDE_EXPERIMENTAL_AGENT_TEAMS=1` flag set. Phase 1 setup ran as single-agent under Engineer + Critic + Orchestrator combined operations (one agent wearing all hats).

Per CTO_INTERFACE.md "Founder workflow", future ships under Agent Teams will fire the agents independently; for now, the single-agent fallback is sufficient.

**Verification deferred:** test Agent Teams invocation after Founder sets flag + creates config. Add to Wave 1 first-ship (Ship 5+8) acceptance criteria if Agent Teams should be active by then.

## Environment validation verdict

**Phase 1 setup proceeds.** Single-agent operation is functional; Agent Teams is opt-in upgrade Founder authorizes at morning. No hard blockers in environment.

Open items for Founder morning action:
1. Set `CLAUDE_EXPERIMENTAL_AGENT_TEAMS=1` env var (per PHASE_1_FOUNDER_REVIEW.md Q1)
2. Author `~/.claude/teams/parbaughs/config.json` if Agent Teams adoption desired
3. Authorize ratification of Phase 1 inferred decisions (per INFERRED_DECISIONS.md Phase 1 entries)
