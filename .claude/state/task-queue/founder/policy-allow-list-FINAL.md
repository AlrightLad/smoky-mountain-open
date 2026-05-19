# Policy allow-list FINAL — Founder ratification required

**Status:** AWAITING FOUNDER APPROVAL — replaces the open-ended `Bash(*)/Edit(*)/Write(*)` wildcards in `.claude/settings.json` with a per-command/per-path allow-list. Closes 3 of 18 AgentShield CRITICAL findings.

**Created:** 2026-05-19 (Founder LOCKED 2026-05-19 follow-on to `policy-overpermissiveness-ratification.md`; Founder picked the ALLOW-LIST approach — Option A).

**Constraint honored:** This file is DRAFT only. `.claude/settings.json` was NOT modified. Application waits for `FOUNDER-ALLOW-LIST-APPROVED-{TS}` placeholder below to be filled in.

---

## Methodology

1. Read current `.claude/settings.json` + `.claude/settings.local.json` to enumerate today's wildcards.
2. Enumerate commands from:
   - `git log --all --pretty=format:'%s' --since='2026-04-01'` (1078 commits — gives the operations-shape distribution).
   - PARBAUGHS hook scripts (`.claude/hooks/*.sh`) — they encode the commands the substrate expects.
   - `package.json` scripts block (npm targets the agent actually invokes).
   - `scripts/regen-all.sh` + `scripts/regen-all.ps1` (the dashboard pipeline backbone).
   - `scripts/cron/*.ps1` (cron-invoked PowerShell — informs `PowerShell(*)` carve).
   - Cron logs at `scripts/cron/logs/*.log` and `.claude/state/cron/maintenance-*.md`.
   - The historical "allow" wildcards already in `.claude/settings.local.json` (these document what Founder previously approved per-prompt, so they are pre-cleared).
   - Phase-2 dashboard audit log `.claude/state/dashboard-audit-2026-05-18/CONSOLIDATION.md` (sessions 1+2 work-record).
3. Categorize commands into families. For each family pick the narrowest pattern that covers legitimate use without `*` wildcards. Where multiple narrow patterns are needed, list them individually rather than collapsing to a wildcard.
4. Cross-check against AMD-018 11-gate (Cloud Functions / Firestore rules / payment / secrets / etc.) — those stay blocked by hooks + denylist, NOT by allow-list expansion.

---

## Current state — BEFORE (the wildcards AgentShield flagged CRITICAL)

`.claude/settings.json` (committed, source of truth):

```json
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Edit(*)",        // <-- AgentShield CRITICAL #1
      "Write(*)",       // <-- AgentShield CRITICAL #2
      "MultiEdit(*)",
      "Bash(*)",        // <-- AgentShield CRITICAL #3
      "Glob(*)",
      "Grep(*)",
      "TodoWrite(*)",
      "WebFetch(*)",
      "WebSearch(*)"
    ],
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(rm -rf ~*)",
      "Bash(git push --force*)",
      "Bash(git push -f*)"
    ]
  }
}
```

`.claude/settings.local.json` (gitignored, local-only, ~70 narrower entries already present):

- Mostly `Bash(git ...)`, `Bash(npm ...)`, `Bash(node ...)`, `Bash(sed -n ...)`, `Bash(wc ...)`, `Bash(ls ...)`, `Bash(grep ...)`, `Bash(curl ...)`, `Bash(awk ...)`, `Bash(firebase ...)`, `Bash(gh api *)`, `Bash(rm -f .claude/state/proposals/...)`, plus four `PowerShell(...)` entries for python invocation.
- Two open wildcards leaked in: `Bash(grep *)` and `Bash(git *)`. These are subsumed by the AFTER block below.

---

## Proposed allow-list — AFTER

Replaces the four CRITICAL wildcard lines (`Edit(*)`, `Write(*)`, `MultiEdit(*)`, `Bash(*)`) and consolidates `.claude/settings.local.json`'s ~70 narrower entries into a single canonical list. `Read(*)/Glob(*)/Grep(*)/TodoWrite(*)/WebFetch(*)/WebSearch(*)` stay as-is — these are read-only / agent-internal and not flagged by AgentShield.

### Tool tools that stay wildcarded (read-only or harness-internal — not flagged)

```json
"Read(*)",
"Glob(*)",
"Grep(*)",
"TodoWrite(*)",
"WebFetch(*)",
"WebSearch(*)"
```

Rationale: AgentShield's policy regex only flags `Bash(*)`, `Edit(*)`, `Write(*)`, `MultiEdit(*)`. The read-only tools have no write surface to attack; the harness controls `TodoWrite`.

### Bash — 38 specific allows (git ops + python + node + npm + bash scripts + firebase + read-only inspection)

**Git operations (15 — most-used family):**

```json
"Bash(git status*)",
"Bash(git diff*)",
"Bash(git log*)",
"Bash(git show*)",
"Bash(git add*)",
"Bash(git commit*)",
"Bash(git push*)",
"Bash(git fetch*)",
"Bash(git pull*)",
"Bash(git checkout*)",
"Bash(git reset --soft*)",
"Bash(git reset --mixed*)",
"Bash(git reset HEAD*)",
"Bash(git rev-parse*)",
"Bash(git rev-list*)",
"Bash(git branch*)",
"Bash(git stash*)",
"Bash(git rm*)",
"Bash(git restore*)",
"Bash(git mv*)",
"Bash(git config --get*)"
```

Rationale: All observed in commit history + hooks. `git push` is already gated by AMD-018 hook 11 (`push-protection.sh` requires last-verify green or Founder override). `git reset --hard` is intentionally OMITTED — destructive; requires Founder per-prompt approval (P8). `git rebase` and `git merge` OMITTED — interactive risk; Founder approves per-use. `git config --get` allowed (read-only); `git config --set` would require Founder prompt.

**Python / scripts (5):**

```json
"Bash(python scripts/*)",
"Bash(python tests/*)",
"Bash(python .claude/scripts/*)",
"Bash(python3 scripts/*)",
"Bash(python -m*)"
```

Rationale: All dashboard regen + aggregate scripts + round-trip-test live under `scripts/` / `tests/` / `.claude/scripts/`. Path-scoped — agent cannot escape these directories without a fresh approval prompt.

**Node / npx (5):**

```json
"Bash(node scripts/*)",
"Bash(node tests/*)",
"Bash(node -e*)",
"Bash(npx playwright*)",
"Bash(npx ecc-agentshield*)"
```

Rationale: Visual-audit + smoke + lint + verify all run as `node scripts/...` or `node tests/...`. `node -e` is the in-script eval used by `pre-commit-version-sync.sh`. Playwright + AgentShield are the two npx tools the team uses; any new npx tool requires a fresh prompt.

**NPM scripts (6):**

```json
"Bash(npm run lint*)",
"Bash(npm run test*)",
"Bash(npm run build*)",
"Bash(npm run smoke*)",
"Bash(npm run verify*)",
"Bash(npm run dev*)",
"Bash(npm run preview*)",
"Bash(npm run emulator*)",
"Bash(npm test*)",
"Bash(npm install*)",
"Bash(npm uninstall*)",
"Bash(npm list*)",
"Bash(npm outdated*)",
"Bash(npm audit*)"
```

Rationale: All targets in `package.json` "scripts" block. `install` and `uninstall` allowed because the maintenance cron and active dev use them; AMD-018 hooks block edits to `.env*` and `firestore.rules` regardless of npm context.

**Bash scripts (4):**

```json
"Bash(bash scripts/*)",
"Bash(bash .claude/hooks/*)",
"Bash(bash .claude/scripts/*)",
"Bash(scripts/cron/*)"
```

Rationale: Path-scoped to the substrate's own scripts. Includes `bash scripts/scaffold-from-templates.sh`, `bash scripts/verify-approval-pipeline.sh`, `bash scripts/regen-all.sh`, etc.

**Firebase + gcloud + gh CLI (read-only / inventory) (4):**

```json
"Bash(firebase --version)",
"Bash(firebase projects:list)",
"Bash(firebase login:list)",
"Bash(firebase firestore:indexes*)",
"Bash(gcloud --version)",
"Bash(gcloud auth list)",
"Bash(gh api*)",
"Bash(gh pr*)",
"Bash(gh issue*)"
```

Rationale: Read-only inventory checks. `firebase deploy *` is INTENTIONALLY OMITTED — AMD-018 gates 1+2 require Founder pre-auth. `gcloud auth login` requires Founder per-prompt (would surface a browser).

**Read-only inspection — POSIX (10):**

```json
"Bash(ls *)",
"Bash(find *)",
"Bash(wc *)",
"Bash(file *)",
"Bash(stat *)",
"Bash(du *)",
"Bash(df *)",
"Bash(diff *)",
"Bash(head *)",
"Bash(tail *)"
```

Rationale: Pure read-only. Already covered by Read/Glob/Grep tools but agents fall back to bash equivalents for compound piped commands.

**Editing / sed inline (3 — narrow):**

```json
"Bash(sed -n *)",
"Bash(sed -i *)",
"Bash(awk *)"
```

Rationale: `sed -n` is read-only (print-mode). `sed -i` is in-place edit — the hook layer (`gate-protected.sh`, `gate-assertions.sh`, `secrets-scanner.sh`, `governance-protection.sh`) still applies because these hooks fire on the Edit/Write tool layer, NOT on bash-sed-i. **CAVEAT — surface this to Founder:** `sed -i` does bypass `gate-protected.sh` if the agent edits `.env*` or `firestore.rules` via bash instead of Edit. A future hook layer should hook `Bash` for `sed -i` patterns matching those paths. For now: `sed -i` is allowed but the team must use Edit tool for protected files (which is the standard pattern observed).

**Tools (3):**

```json
"Bash(curl *)",
"Bash(rm -f .claude/state/proposals/*)",
"Bash(rm -f .claude/state/proposals/inbox/*)"
```

Rationale: `curl` is the manual visual-verification probe (alternate to playwright). `rm -f` scoped to two specific paths under `.claude/state/proposals/` (matches existing approved entries in `settings.local.json`). General `rm -rf` and `rm` OMITTED — destructive, Founder per-prompt required. Specific `bash scripts/scaffold-from-templates.sh` legitimately rebuilds dashboards via the `bash scripts/*` allow above.

**PowerShell (3 — narrow):**

```json
"PowerShell(Get-Command *)",
"PowerShell(Get-ChildItem *)",
"PowerShell(py *)",
"PowerShell($env:Path *)"
```

Rationale: Read-only Get-* commands + py launcher invocation (Python on Windows). Broader PowerShell stays Founder-gated (the four observed historical PowerShell calls were all `py *` and `$env:Path *` chained invocations).

### Edit + Write — path-scoped

Replace `Edit(*)` + `Write(*)` + `MultiEdit(*)` (the three wildcards AgentShield flags) with these path-scoped allows:

```json
"Edit(scripts/**)",
"Edit(tests/**)",
"Edit(src/**)",
"Edit(templates/**)",
"Edit(docs/**)",
"Edit(public/**)",
"Edit(functions/**)",
"Edit(.claude/state/**)",
"Edit(.claude/skills/**)",
"Edit(.claude/hooks/**)",
"Edit(.claude/scripts/**)",
"Edit(.claude/state/task-queue/founder/**)",
"Edit(CLAUDE.md)",
"Edit(package.json)",
"Edit(vite.config.js)",
"Edit(playwright.config.js)",
"Edit(index.html)",
"Edit(README.md)",
"Edit(.gitignore)",

"Write(scripts/**)",
"Write(tests/**)",
"Write(src/**)",
"Write(templates/**)",
"Write(docs/**)",
"Write(public/**)",
"Write(functions/**)",
"Write(.claude/state/**)",
"Write(.claude/skills/**)",
"Write(.claude/hooks/**)",
"Write(.claude/scripts/**)",
"Write(.claude/state/task-queue/founder/**)",
"Write(CLAUDE.md)",
"Write(package.json)",
"Write(vite.config.js)",
"Write(playwright.config.js)",
"Write(index.html)",
"Write(README.md)",
"Write(.gitignore)",

"MultiEdit(scripts/**)",
"MultiEdit(tests/**)",
"MultiEdit(src/**)",
"MultiEdit(templates/**)",
"MultiEdit(docs/**)",
"MultiEdit(public/**)",
"MultiEdit(functions/**)",
"MultiEdit(.claude/state/**)",
"MultiEdit(.claude/skills/**)",
"MultiEdit(.claude/hooks/**)",
"MultiEdit(.claude/scripts/**)",
"MultiEdit(CLAUDE.md)"
```

**Explicitly OMITTED from Edit/Write/MultiEdit (Founder per-prompt approval required, redundant with hook 4 `gate-protected.sh`):**

- `.env*` — AMD-018 gate 6 (also Hook 4 blocks)
- `firestore.rules` — AMD-018 gate 2 (also Hook 4 blocks)
- `scripts/.service-account.json` — AMD-018 gate 6 (also Hook 4 blocks)
- `tests/e2e/helpers/assertions.js` — Hook 3 (`gate-assertions.sh`) blocks
- `.claude/settings.json` — meta-settings; Founder per-prompt for this file specifically
- `.claude/settings.local.json` — meta-settings; Founder per-prompt
- `.husky/**` — git layer hooks; Founder per-prompt
- Anything outside the repo root (covered by V2 boundary)

### Deny list — kept unchanged + tightened slightly

```json
"deny": [
  "Bash(rm -rf /*)",
  "Bash(rm -rf ~*)",
  "Bash(rm -rf .git*)",
  "Bash(rm -rf .claude*)",
  "Bash(rm -rf node_modules*)",
  "Bash(git push --force*)",
  "Bash(git push -f*)",
  "Bash(git push --force-with-lease*)",
  "Bash(git reset --hard*)",
  "Bash(git rebase -i*)",
  "Bash(git add -i*)",
  "Bash(firebase deploy*)",
  "Bash(npx firebase deploy*)",
  "Edit(.env*)",
  "Edit(.env.local*)",
  "Edit(firestore.rules)",
  "Edit(scripts/.service-account.json)",
  "Edit(.claude/settings.json)",
  "Edit(.claude/settings.local.json)",
  "Edit(tests/e2e/helpers/assertions.js)",
  "Write(.env*)",
  "Write(firestore.rules)",
  "Write(scripts/.service-account.json)",
  "Write(.claude/settings.json)",
  "Write(.claude/settings.local.json)",
  "Write(tests/e2e/helpers/assertions.js)"
]
```

Rationale: Explicit denies are belt-and-suspenders alongside `.claude/hooks/gate-*.sh`. `firebase deploy*` denial belongs in deny-list (AMD-018 gate 1+2) — pulls these out of the natural-language hook layer into a per-tool mechanical block.

---

## Allow-list count by category

| Category | Specific allows | Notes |
|---|---:|---|
| Bash — git ops | 21 | All read + write git ops except destructive (rebase / reset --hard / push --force) |
| Bash — python | 5 | Path-scoped to scripts/, tests/, .claude/scripts/ |
| Bash — node/npx | 5 | Path-scoped + named npx tools (playwright, ecc-agentshield) |
| Bash — npm scripts | 14 | Per package.json + maintenance cron + install/uninstall/list/audit |
| Bash — bash scripts | 4 | Path-scoped to scripts/, .claude/hooks/, .claude/scripts/, scripts/cron/ |
| Bash — firebase/gh/gcloud | 9 | Read-only only — deploy blocked by hook + deny |
| Bash — POSIX inspection | 10 | Pure read-only |
| Bash — sed/awk | 3 | sed -n read-only; sed -i + awk for inline edits (CAVEAT noted) |
| Bash — tools | 3 | curl + 2 specific rm -f paths |
| PowerShell | 4 | Read-only Get-* + py + $env:Path inspection |
| Edit/Write/MultiEdit | 56 | Path-scoped to all legitimate work directories |
| Read-only tools (kept wildcard) | 6 | Read/Glob/Grep/TodoWrite/WebFetch/WebSearch — not flagged by AgentShield |
| **TOTAL allows** | **140** | (count includes the 56 Edit/Write/MultiEdit path entries) |
| **Deny list entries** | **26** | Belt-and-suspenders block for destructive + protected paths |

---

## Edge cases noted

### Commands historically observed in `.claude/settings.local.json` that are NOW subsumed

- `Bash(grep *)` — superseded by Grep tool + read-only `Bash(grep *)` pattern (kept narrowly because grep with chained `awk`/`xargs` invocations are bash-pipelined). Keep as `Bash(grep *)` or add as `Bash(grep -*)` to make narrower? **Recommended:** keep as-is in inspection family with rationale "read-only by definition."
- `Bash(git *)` — replaced by the 21 specific git allows above (the open `git *` allowed `git rebase -i`, `git reset --hard`, etc., which we are now explicitly excluding).
- `Bash(awk '...')` — covered by `Bash(awk *)`.
- `PowerShell($env:Path = ...)` — covered by `PowerShell($env:Path *)`.

### Commands that MIGHT BE needed but not yet observed (added speculatively)

- `Bash(git restore*)` — file-level restore; not seen in commits but pairs with `git reset --soft/mixed`. **Decision:** include (read/move-equivalent operation).
- `Bash(git mv*)` — file rename via git; not observed but common in refactors. **Decision:** include.
- `Bash(git stash*)` — stashing changes; not directly observed but expected. **Decision:** include.
- `Bash(npm run preview*)` — package.json has `preview` but cron doesn't invoke it. **Decision:** include (matches package.json).
- `Bash(node -e*)` — used by `pre-commit-version-sync.sh`. **Decision:** include.

### Commands historically used but considered out-of-scope going forward

- `Bash(BROWSERS=webkit node tests/smoke/run.js)` — covered by `Bash(node tests/*)`.
- `Bash(BROWSERS=chromium,firefox,webkit,webkit-mobile node tests/smoke/run.js)` — covered.
- The `Bash(echo "... ... ...")` chained-grep entries from `settings.local.json` — these were one-off audit constructs; now covered by Grep tool. **Decision:** drop on application.
- `Bash(sed -n '959,1132p' /c/Users/zachary.boogher/...)` — old WSL-style path from `settings.local.json`. Covered by `Bash(sed -n *)`. **Decision:** drop on application.

### Blockers — commands I cannot classify with confidence

1. **`Bash(git reset *)` from `settings.local.json`.** The existing entry is open-wildcard, but `git reset --hard` is destructive. **Resolution above:** I split this into `Bash(git reset --soft*)`, `Bash(git reset --mixed*)`, `Bash(git reset HEAD*)` — covers the cleanup pattern from D29 fixture work and the soft-reset retry pattern from amendments-lifecycle work. `git reset --hard` moved to deny.
2. **PowerShell beyond what's listed.** I only saw 4 PowerShell invocations in `settings.local.json` history. The maintenance cron is `.ps1` but the cron runs as a scheduled task, not as Claude Code. **Resolution:** narrow allow-list above; if a future agent needs more PowerShell, the prompt will surface and Founder can extend.
3. **Bash heredoc / multiline commit messages.** `git commit -m "$(cat <<EOF ... EOF)"` is the team's standard commit pattern. **Resolution:** `Bash(git commit*)` covers this since the matcher checks the head of the command; heredoc body doesn't change the match.

---

## Application strategy

**If Founder approves below, the application sequence is:**

1. Re-read `.claude/settings.json` (it may have changed since this packet was drafted).
2. Replace the `permissions` block with the AFTER list above (Bash + Edit/Write/MultiEdit allows + tightened deny list). Keep `hooks` block unchanged.
3. Update `.claude/settings.local.json` to keep only worktree-specific or session-specific narrow allows (or empty its allow-list entirely — `.claude/settings.json` is now comprehensive).
4. Run `npx ecc-agentshield scan > .claude/state/security/baseline-after-allow-list.txt` to verify the 3 policy-overpermissiveness CRITICAL findings are now closed.
5. Compare to `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt`. Expected delta: 18 → 15 CRITICAL (or fewer if the count drops further from secondary effects).
6. Open Phase G (Founder Verification Packet) iteration with this packet's outcome appended.
7. Commit: `[security-P8] policy allow-list applied — 3 CRITICAL closed (D31 progress)`.

**If a novel command surfaces post-application:**

- Agent will hit a permission prompt (V3 friction — accepted trade-off for P8 hardening per Founder approval below).
- Surface the command via Founder packet at `.claude/state/task-queue/founder/policy-allow-list-extension-{TS}.md` with the specific allow-pattern proposed.
- Apply per-extension after approval; do NOT widen back to wildcard.

---

## Workflow impact disclosure (V3 honesty)

This change WILL introduce friction relative to the wildcard state. Expected new permission prompts:

- First time an agent runs a command outside the 140-item allow-list, the harness will surface a prompt to Founder.
- Routine ops (`git status`, `git diff`, `git add .`, `git commit -m '...'`, `git push`, `npm run lint`, `python scripts/regen-all.py`, `bash scripts/regen-all.sh`, `node scripts/visual-audit/capture-dashboards.mjs`, etc.) are pre-cleared. No prompt.
- Novel ops (e.g., `npx some-new-tool`, `pnpm ...`, `bun ...`, `gh release create`, custom `git plumbing` commands) will prompt.

Cron + scheduled tasks are unaffected — they don't run through Claude Code's permission layer.

The friction is intentional and serves P8 ("security as ship-blocking"). Per V3, Founder may choose to widen specific buckets back to wildcards if a particular allow becomes onerous — surface via `.claude/state/task-queue/founder/policy-allow-list-extension-{TS}.md` per item.

---

## Founder ratification

```
FOUNDER-ALLOW-LIST-APPROVED-{TS}      placeholder — fill in ISO-8601 timestamp on approval

Decision (choose one):
[ ] APPROVE — apply the AFTER block above to .claude/settings.json
[ ] APPROVE WITH MODIFICATIONS — note adjustments below, apply edited version
[ ] DEFER — keep wildcards on D31 exception list (revert to Option B of policy-overpermissiveness-ratification.md)
[ ] REJECT — keep current state, explore Option C (hybrid) instead

Modifications (if APPROVE WITH MODIFICATIONS):
```

---

## Related files

- `.claude/settings.json` — primary settings (READ-ONLY for this packet draft)
- `.claude/settings.local.json` — local overrides (READ-ONLY for this packet draft)
- `.claude/state/task-queue/founder/policy-overpermissiveness-ratification.md` — prior packet that surfaced the 3-options choice
- `.claude/state/task-queue/founder/d31-zero-critical-decision.md` — overall D31 path
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-REMEDIATION-LOG.md` — sibling task (skill-instrumentation remediation, 42 MEDIUM closed)
- `.claude/state/dashboard-audit-2026-05-18/CONSOLIDATION.md` — session 1+2 work-record
- `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt` — current 18-CRITICAL baseline
- `.claude/hooks/gate-protected.sh` — Hook 4, mechanical block on `.env*`/`firestore.rules`/service-account
- `.claude/hooks/gate-assertions.sh` — Hook 3, block on assertions.js
- `.claude/hooks/push-protection.sh` — Hook 11, push gated on last-verify green
- AMD-018 — 11-gate Founder-pre-auth-required production-risk boundaries
