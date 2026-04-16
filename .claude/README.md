# Claude Code Hooks — PARBAUGHS project config

This directory contains project-level Claude Code hooks that
govern how automated agents interact with the codebase. These
hooks are deterministic guardrails — they fire every time
regardless of agent memory or intent.

## Files in this directory

- `settings.json` — Hook declarations (committed, shared)
- `hooks/` — Hook scripts (committed, shared)
- `settings.local.json` — Per-user permission settings (gitignored)
- `scheduled_tasks.lock` — Runtime state (gitignored)

## What each hook does

**Hook 1 — pre-commit-lint.sh**
Blocks `git commit` if `npm run lint` fails. Surfaces the ERR
lines, not the OK noise.

**Hook 2 — post-edit-syntax.sh**
After any Edit/Write in src/, tests/, or scripts/, runs acorn
against the edited file. Exits 0 with stderr warning if syntax
is broken. Non-blocking — Hook 1 is the real commit gate.

**Hook 3 — gate-assertions.sh**
Blocks any edit to `tests/e2e/helpers/assertions.js`. This is
the primary safety net of v7.8.1. Editing that file requires
explicit human approval because silent additions to
IGNORE_PATTERNS can hide real test failures indefinitely.

**Hook 4 — gate-protected.sh**
Blocks writes to credentials files and firestore.rules without
explicit human approval. Prevents accidental exposure or rule
changes.

**Hook 5 — pre-commit-version-sync.sh**
Blocks `git commit` if APP_VERSION in src/core/utils.js doesn't
match version in package.json. Prevents silent version drift.

## How to bypass (emergencies only)

- For a single commit: `git commit --no-verify`
  (only bypasses Hooks 1 and 5, not Hooks 2-4)
- To disable all hooks: set `"disableAllHooks": true` in
  settings.json
- Do NOT bypass routinely. If a hook is blocking a legitimate
  action, the right move is usually to update the hook, not
  bypass it.

## Modifying hooks

Any change to hook behavior should be proposed, reviewed, and
shipped as its own version bump — not bundled with unrelated
work. Hooks are workflow infrastructure; they deserve the same
rigor as production code.
