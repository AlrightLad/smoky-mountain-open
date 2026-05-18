---
name: parbaughs-version-triple-bumper
description: Three-file version bump pattern — utils.js APP_VERSION + package.json version + sw.js CACHE_NAME. All three must align at every member-facing ship. Hook 5 enforces utils.js ↔ package.json; sw.js is manual update.
trigger: Closing a ship with member-facing changes; preparing the version-bump commit (separate from feature commits, always last in ship sequence)
owner: Engineer (applies), Critic (verifies in implementation review)
tier: T1 (skill content drafted at Phase 1)
# >>> agentshield-instrumentation
# Added 2026-05-18 to satisfy AgentShield ECC 2.0 skill-health checks
# (observation-hooks, feedback-hooks, version, rollback). Wires the skill to
# the real PARBAUGHS telemetry substrate; no fake telemetry. See
# parbaughs-telemetry-emit and HANDOFF_PROTOCOL.md for the consuming systems.
version: 1.0.0
observation_hooks:
  on_invoke:
    event_type: skill.invocation.start
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
  on_complete:
    event_type: skill.invocation.end
    emit_via: parbaughs-telemetry-emit
    target: .claude/state/telemetry/events/{utc_date}.ndjson
feedback_hooks:
  channel: handoff-note
  scenario: subagent-return
  template: HANDOFF_NOTE_TEMPLATES.md
  target_dir: .claude/state/handoffs/subagent-returns/
rollback:
  previous_version: null
  procedure: |
    git revert the commit that introduced the skill update; APPROVAL sidecar
    travels with the skill so revert restores both. Skill changes never co-mingle
    with code commits, so revert is mechanically clean.
  rollback_safe: true
# <<< agentshield-instrumentation
---

# Skill: parbaughs-version-triple-bumper

Version bumps are 3 files in 1 commit. Hook 5 catches 2 of 3; the sw.js leak is on you.

## When to invoke

- Closing any ship with member-visible behavior or UI change
- Hotfix ship (even bug fixes get a version bump)
- Wave-gate ship (often a feature ship; gets normal triple bump)

## When NOT to invoke

- Mid-ship; multiple commits within a ship don't each bump
- Pure governance ship (docs/agents/ only, no app code change) — debatable; Founder ruling at first such ship
- Doc-only commit (no APP_VERSION change needed if app code unchanged)

## The three files

### 1. `src/core/utils.js:7`

```js
var APP_VERSION = "X.Y.Z";
```

X = MAJOR (breaking / direction shifts)
Y = MINOR (new features / substantive)
Z = PATCH (fixes / small tweaks)

### 2. `package.json` line ~3

```json
"version": "X.Y.Z",
```

Same value. Hook 5 (`pre-commit-version-sync.sh`) blocks commit if utils.js and package.json disagree.

### 3. `public/sw.js:16`

```js
var CACHE_NAME = 'parbaughs-vX.Y.Z';
```

Must match. The service worker's activate-handler cache cleanup deletes any cache whose name differs from CACHE_NAME — if CACHE_NAME doesn't change between deploys, the cleanup is a no-op and stale caches accumulate. Hook 5 does NOT enforce this — manual update part of the version-bump step.

Per CLAUDE.md: pre-v8.12.0, CACHE_NAME was stuck at `'parbaughs-v6-4-0'` for ~30 ships. Don't recreate that drift.

## Procedure

1. **Determine version delta.**
   - Hotfix / minor copy / behavior tweak → Z bump (8.22.0 → 8.22.1)
   - New feature / surface restructure → Y bump (8.22.0 → 8.23.0)
   - Major direction shift / governance overhaul → X bump (8.22.0 → 9.0.0) — rare

2. **Edit utils.js + package.json + sw.js in one commit.**
   - Use Edit tool: target the literal version strings; replace_all may catch unrelated `8.22.0` references in comments
   - Verify all 3 land in the same commit

3. **Commit message format:**
   ```
   vX.Y.Z — Ship N+M: <one-line ship description>
   ```
   See `git log --oneline -10` for recent examples.

4. **Verify pre-push:**
   ```sh
   Grep -n "APP_VERSION" src/core/utils.js
   Grep -n "\"version\"" package.json
   Grep -n "CACHE_NAME" public/sw.js
   ```
   Three matches; same X.Y.Z.

5. **Caddy Notes entry MUST mention the new version** in the "What's New · vX.Y.Z" tagline.

## Anti-patterns

- Bumping utils.js + package.json only — sw.js drift causes stale cache; members see old version
- Bumping in same commit as feature work — version bump should be its own commit (last in ship sequence per CLAUDE.md)
- Skipping bump because "this is just a fix" — bug fixes DO get a bump (patch Z)
- Re-using a prior version number — monotonic per CLAUDE.md (abandoned 8.22.3 → next is 8.22.4, not insert 8.22.3)

## Quick sanity check at audit start

Before any work on a ship, run:
```sh
grep "APP_VERSION" src/core/utils.js && grep "\"version\"" package.json | head -1 && grep "CACHE_NAME" public/sw.js
```

All three should report the SAME version (the current production version). If not, prior ship had a triple-bump miss — escalate per Sanity Halt category 6 (drift).

## References

- CLAUDE.md "Version Numbering"
- CLAUDE.md "Caddy Notes Lifecycle" (version bump triggers Caddy Notes update)
- `.claude/hooks/pre-commit-version-sync.sh` (Hook 5; utils.js ↔ package.json enforcement)
- `public/sw.js` comment block at top documents the historical drift
