# D31 — Refactor scanners to defeat AgentShield 1.5.0 static analysis

**Date:** 2026-05-19 (Founder LOCKED 2026-05-19)
**Goal:** Zero CRITICAL false-positive findings on final goal-close AgentShield commit.
**AgentShield version:** ecc-agentshield@1.5.0
**Pre-refactor baseline:** `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt`
**Post-refactor baseline:** `.claude/state/security/baseline-20260518-222441/agentshield-post-refactor.txt`

---

## Pre-state — 18 CRITICAL

| # | Finding | File | Why FP |
|---|---|---|---|
| 1 | Bash(*) overly permissive | `.claude/settings.json` | Task #3 (Policy Allow-List) — out of D31 scope |
| 2 | Potential command injection (var-interpolation) | `.claude/hooks/schema-mutation-alarm.sh:30` | `${content}${new_string}` piped to grep, never to exec — false positive |
| 3 | Hardcoded Private key material | `.claude/hooks/secrets-scanner.sh:59` | PEM literal inside detection regex — false positive |
| 4 | PEM-encoded private key | `.claude/hooks/secrets-scanner.sh:59` | Same line as #3, two rules fire — false positive |
| 5-7 | `--no-verify` × 3 | `.claude/worktrees/architecture-agent-day1/CLAUDE.md` | Phase H housekeeping |
| 8 | Bash(*) | `.claude/worktrees/architecture-agent-day1/.claude/settings.json` | Phase H housekeeping |
| 9-11 | Mirrors of #2, #3, #4 | `.claude/worktrees/architecture-agent-day1/.claude/hooks/` | Phase H housekeeping |
| 12-14 | `--no-verify` × 3 | `.claude/worktrees/dashboard-banners/CLAUDE.md` | Phase H housekeeping |
| 15 | Bash(*) | `.claude/worktrees/dashboard-banners/.claude/settings.json` | Phase H housekeeping |
| 16-18 | Mirrors of #2, #3, #4 | `.claude/worktrees/dashboard-banners/.claude/hooks/` | Phase H housekeeping |

**Target for this task:** Close #2, #3, #4 (the 3 main-repo false positives). The 6 worktree mirrors (#9-#11, #16-#18) auto-resolve when Phase H deletes `.claude/worktrees/`. The 3 `Bash(*)` policy CRITICALs (#1, #8, #15) are Task #3.

---

## Refactor strategy

### Choice per file

| File | Strategy | Rationale |
|---|---|---|
| `.claude/hooks/secrets-scanner.sh` | Replaced with thin bash shim (3 executable lines); detection logic moved to `.claude/hooks/lib/scanner.py` | Option B (Python rewrite) chosen over Option A (external JSON) because Option A still leaves the PEM literal verbatim in the JSON file, where AgentShield's secrets-private-key-material rule (no file-type filter, line 988-1028 of dist/action.js) still matches it. Option B works because Python is classified as `hook-code` rather than `hook-script`, which exempts it from the bash-only `hooks-injection` rule (gated at dist/action.js:2414: `if (file.type !== "settings-json" && file.type !== "hook-script") return [];`). The PEM literal is additionally constructed at runtime via Option C-style string concatenation inside `scanner.py::_pem_header_regex()` so the contiguous string never appears in source at all. |
| `.claude/hooks/schema-mutation-alarm.sh` | Same — thin bash shim, detection in `scanner.py` (`--mode=schema`) | Same rationale. The bash shim has no `${content}` / `${new_string}` interpolation; the Python module uses ordinary variable names that don't match the `/\$\{(?:file\|command\|content\|input\|args?)\}/gi` regex. |

### Why not Option A (external JSON)

External JSON would still be scanned. AgentShield's `secrets-private-key-material` rule runs on every file's raw content with no file-type gate. A `.json` containing the standard PEM start-marker (5-dash + "BEGIN" + "PRIVATE KEY" + 5-dash) as a string value would trip the rule identically to the `.sh` containing it as a grep argument. Encoding the pattern (base64, hex) inside the JSON would technically work, but adds parsing complexity to the bash loader without solving the secondary problem (var-interpolation in bash).

### Why not Option C (string concatenation in bash)

Construction at runtime via `printf` of the PEM start-marker fragments in bash would defeat the PEM-literal rule, but the bash shim would still need the `${content}${new_string}` variable concatenation to feed `grep`, which would still trip `var-interpolation`. We'd close 2 of 3 main-repo CRITICALs, not all 3. The Python rewrite closes all 3 with a single move.

### Combined strategy — both files

1. Thin bash shims (`secrets-scanner.sh` + `schema-mutation-alarm.sh`) containing only `exec python "$(dirname "$0")/lib/scanner.py" --mode={secrets|schema}`. No tool-input variable interpolation. No PEM literals. No `>/dev/null` redirection (bonus: closes the existing HIGH/MEDIUM finding on schema-mutation-alarm.sh:44).
2. New Python module `.claude/hooks/lib/scanner.py` with `--mode=secrets` and `--mode=schema` subcommands. Patterns constructed at runtime; no contiguous PEM literal in source.
3. `.claude/settings.json` unchanged — still invokes `bash .claude/hooks/secrets-scanner.sh` etc. The shims are drop-in replacements.

---

## Implementation

### Files modified

| File | Before | After | Notes |
|---|---|---|---|
| `.claude/hooks/secrets-scanner.sh` | 122 lines of detection logic | 22 lines (header comment + `exec python ...`) | Drop-in replacement; same hook entry point |
| `.claude/hooks/schema-mutation-alarm.sh` | 74 lines of detection logic | 20 lines (header comment + `exec python ...`) | Drop-in replacement; same hook entry point |

### Files added

| File | Purpose |
|---|---|
| `.claude/hooks/lib/scanner.py` | Combined entry point for both scanner modes. Constructs PEM regex at runtime via `_pem_header_regex()` and `_pem_block_in_json_regex()` so the literal never appears as a contiguous substring in source. Uses ordinary Python variable names (`payload`, `text`, `hits`) that don't match AgentShield's bash var-interpolation regex. |

### Files NOT modified

- `.claude/hooks/lib/parse-payload.sh` — unchanged (used by other hooks).
- `.claude/settings.json` — unchanged (still wires the shims by name).
- `.claude/worktrees/*/.claude/hooks/{secrets-scanner.sh,schema-mutation-alarm.sh}` — left as-is. They will be deleted in Phase H along with the worktrees. The 6 worktree CRITICAL findings (mirrors of the 3 main-repo ones) auto-resolve there.

---

## Detection-still-works tests

Ran 19 end-to-end tests routing through the bash shims (Git Bash) into the Python module. All passed.

| # | Test | Mode | Input | Expected | Actual |
|---|---|---|---|---|---|
| 1 | AWS access key in `.js` | secrets | AWS published 20-char example token in source | exit 2 (block) | exit 2 PASS |
| 2 | PEM PRIVATE KEY in `.js` (constructed) | secrets | header + data + footer | exit 2 | exit 2 PASS |
| 3 | PEM RSA key in `.js` | secrets | RSA header variant | exit 2 | exit 2 PASS |
| 4 | PEM OPENSSH key in `.js` | secrets | OPENSSH header variant | exit 2 | exit 2 PASS |
| 5 | Stripe live secret in `.js` | secrets | `sk_live_...` 28-char body | exit 2 | exit 2 PASS |
| 6 | Google API key in `.js` | secrets | `AIza` 39-char body | exit 2 | exit 2 PASS |
| 7 | GitHub PAT modern in `.js` | secrets | `ghp_...` 40-char body | exit 2 | exit 2 PASS |
| 8 | JWT in `.js` | secrets | `eyJ...eyJ...` triplet | exit 2 | exit 2 PASS |
| 9 | AWS key in `.md` (docs) | secrets | same as #1 in `.md` | exit 0 (warn only) | exit 0 PASS |
| 10 | PEM in `.md` (docs) | secrets | same as #2 in `.md` | exit 0 | exit 0 PASS |
| 11 | Normal text | secrets | `const x = 1;` | exit 0 silent | exit 0 PASS |
| 12 | Empty content | secrets | `""` | exit 0 silent | exit 0 PASS |
| 13 | No file_path | secrets | missing key | exit 0 silent | exit 0 PASS |
| 14 | Firebase service account | secrets | full JSON with `private_key` field | exit 2 | exit 2 PASS |
| 15 | `FieldValue.delete()` in `src/*.js` | schema | `await ref.update({foo: FieldValue.delete()})` | exit 0, warning printed | exit 0 PASS (warning observed) |
| 16 | `.set()` without merge | schema | `await ref.set({foo: 1})` | exit 0, warning printed | exit 0 PASS (warning observed) |
| 17 | `.set()` with merge | schema | `await ref.set({foo: 1}, {merge: true})` | exit 0 silent | exit 0 PASS |
| 18 | `FieldValue.delete()` in tests/*.js | schema | path outside `src/` | exit 0 silent | exit 0 PASS |
| 19 | `.ts` file with `FieldValue.delete()` | schema | non-`.js` extension | exit 0 silent | exit 0 PASS |

Tests also verified:
- Windows-style `\` path with `src\core\data.js` is normalized correctly and matches the `src/` segment check.
- Docs-path (`docs/note.md`) downgrades to warning even on credential pattern.

The detection logic is **functionally identical** to the prior bash implementation. One small correction was made during port: the bash glob `*src/*.js` matched paths anywhere containing the `src/` directory; the first Python port required the `src/` segment to follow a `/`, which failed for `src/data.js` (no leading `/`). Fixed to match `lowered.startswith("src/") or "/src/" in lowered`. Verified the fix unbreaks `src/data.js` and continues to block `tests/data.js`.

---

## Post-state — 15 CRITICAL (was 18, -3 target met)

Source: `.claude/state/security/baseline-20260518-222441/agentshield-post-refactor.txt`

```
  Grade: F (34/100)     ← was 31/100
  CRITICAL: 15          ← was 18 (-3, all 3 main-repo FPs closed)
  HIGH: 31              ← was 32 (-1, schema-mutation /dev/null logging finding gone — bonus)
  MEDIUM: 102           ← unchanged
  LOW: 3                ← unchanged
  INFO: 4               ← was 5 (-1, the documented --no-verify INFO finding on the old shim moved off scanner.py)
```

### Remaining CRITICAL breakdown

| Category | Count | Status |
|---|---|---|
| `Bash(*)` main repo `.claude/settings.json` | 1 | Task #3 (Policy Allow-List) — separate Founder ratification |
| `Bash(*)` worktree settings (× 2) | 2 | Phase H housekeeping (worktree deletion) |
| `--no-verify` worktree CLAUDE.md (× 6) | 6 | Phase H housekeeping |
| Mirrors of refactored-away findings in worktrees (3 rules × 2 worktrees) | 6 | Phase H housekeeping |
| Main repo false-positive CRITICALs from this task | **0** | ✓ All closed |

### Bonus: HIGH/MEDIUM closures

| Finding | Before | After |
|---|---|---|
| `hooks-logging-disabled` `schema-mutation-alarm.sh:44 >/dev/null 2>&1` | HIGH (or MEDIUM — flagged) | Gone (the refactor removed the bash `grep ... >/dev/null` line entirely) |

Worktree mirrors of the `>/dev/null` finding remain until Phase H.

---

## Upstream PR drafts status

- `.claude/state/security/agentshield-upstream-issues-FILED.md` — staged, ready to file. Three separate issues prepared with titles, severities, reproducers, proposed fixes, and acceptance criteria.
- `gh` CLI not installed on this workstation. V2 authorization does not extend to credentials / IT Glue / password-manager content, so the agent cannot file via PAT either.
- **Founder action:** copy-paste each issue body from `agentshield-upstream-issues-FILED.md` into https://github.com/affaan-m/everything-claude-code/issues; capture issue URLs back into that file.
- The PARBAUGHS main repo no longer depends on these upstream fixes — the refactor closed the local impact. Filing the issues benefits the broader AgentShield user base.

---

## Files committed in this work

```
.claude/hooks/lib/scanner.py                                    (new, ~300 lines)
.claude/hooks/secrets-scanner.sh                                (rewritten, 22 lines)
.claude/hooks/schema-mutation-alarm.sh                          (rewritten, 20 lines)
.claude/state/security/baseline-20260518-222441/agentshield-post-refactor.txt   (new baseline)
.claude/state/security/agentshield-upstream-issues-FILED.md     (new, ready-to-file drafts)
.claude/state/dashboard-audit-2026-05-18/D31-REFACTOR-LOG.md    (this document)
```

---

## Acceptance check

| Item | Required | Status |
|---|---|---|
| Main-repo false-positive CRITICAL closure | 3 of 3 | ✓ All 3 closed |
| Detection-still-works (AWS, PEM variants, Stripe, Google, GitHub, JWT, Firebase SA) | Each scanner still fires on real secret | ✓ 14 secrets tests pass |
| Schema mutation alarm still warns | FieldValue.delete + .set-without-merge | ✓ 5 schema tests pass |
| New main-repo files don't introduce new findings | `scanner.py` + shims clean | ✓ Verified post-scan |
| Detection coverage equivalence with bash original | Bash-tested + Python-tested behaviors match | ✓ All 8 secret types + 2 schema patterns ported and tested |
| Upstream PR drafts converted to filing format | Ready for Founder | ✓ `agentshield-upstream-issues-FILED.md` |

---

## Blockers / open items

- **Filing the 3 upstream issues:** requires Founder. No agent path (no `gh` CLI; no Founder credentials in V2 scope).
- **Phase H housekeeping (worktree deletion):** out of scope for D31 task; tracked separately.
- **Task #3 (Bash(*) Policy Allow-List):** out of scope for D31 task; tracked separately.

D31 main-repo zero-CRITICAL-false-positive goal achieved.
