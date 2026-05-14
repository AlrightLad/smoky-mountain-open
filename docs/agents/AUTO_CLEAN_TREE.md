
# Auto-clean dirty tree protocol

Founder directive 2026-05-14: dirty working tree is operational debt
that compounds. The watcher SKIPS processing on dirty tree (P0 stalled
7 proposals). Push authorization Gate 9 blocks on dirty tree.
Continuous clean is the operational baseline.

## Classification criteria

### Auto-resolve (commit with appropriate ship_id)

**Class A — State file drift (regenerable):**
- `.claude/state/telemetry/aggregates/*.json` — regenerable from
  source events
- `docs/reports/*.html` — regenerable via regen-all
- `.claude/state/telemetry/events/*.ndjson` — append-only, commit
  as routine cron output
- `.claude/state/cron-status/*.json` — regenerable from OS state
- `.claude/state/heartbeats/*.json` — regen pipeline output

**Class B — Generated artifacts (commit as evidence):**
- `scripts/visual-audit/<timestamp>/` — audit output
- `.claude/state/main-flows-v2/founder-real-context/<ts>/` —
  capture output
- `.claude/state/app-audit-2026-05-14/` — audit results
- `.claude/state/user-journey-audits/<ts>/` — click-through
  transcripts

**Class C — Ship-in-progress:**
- Files modified as part of `current-ship.json` declared scope
- Files matching ship's expected file footprint

**Class D — Intentional edits with stale tracking:**
- `.gitignore` additions not yet committed
- Permission changes (chmod) on scripts

### Surface to Founder (per AMD-015 propose-first)

**Class X — Source code outside current ship:**
- Files in `src/` modified but not part of current ship scope
- Surface with diagnosis: was this intentional? new ship needed?

**Class Y — Credentials / secrets / keys:**
- `serviceAccountKey.json`, `.env*`, IT Glue credential paths
- Surface with security warning

**Class Z — Conflicting / ambiguous:**
- Files modified by multiple parallel ships
- Files where intent unclear from context

**Class W — Large binary additions:**
- PNG >5MB, video, database dumps
- Surface to verify .gitignore vs commit decision

## Execution timing

Every continuation cycle before starting next priority work:

1. `git status`
2. For each dirty file: classify A/B/C/D (auto) or X/Y/Z/W (surface)
3. Auto-classified files: commit with descriptive message + ship_id
4. Surface-classified files: STOP, surface to Founder with proposed
   resolution per AMD-015
5. After auto-cleanup: verify `git status` clean
6. If still dirty: surface-classified files exist, escalation required

## AMD-018 Gate 9 integration

Gate 9 "Working tree clean" is now auto-satisfied for A/B/C/D
classes. X/Y/Z/W classes still block push pending Founder resolution.
No change to push criteria — just better automation of Gate 9
compliance.

## Honest delta

Why has tree been allowed to drift?

The team treated dirty tree as background state ("I'll commit it
later") instead of operational debt. The watcher-skip behavior
proved dirty tree has cascading impact (P0 stalled proposals).

Structural fix: continuous clean as default. Dirty surfaces only
intentional in-progress ship work.

## Cross-references

- AMD-015 (propose-first with rationale for X/Y/Z/W surface
  classes)
- AMD-017 (continuation discipline — auto-clean is on every cycle)
- AMD-018 (push authorization Gate 9)
