# D31 zero-CRITICAL — Founder decision required

**Status:** AWAITING FOUNDER APPROVAL — D31 spec criterion structurally blocked by AgentShield 1.5.0 limitation.

**Created:** 2026-05-18 session 2 (after AgentShield false-positive suppression agent confirmed no in-tool suppression mechanism exists).

## The blocker

Spec D31 requires: "AgentShield zero CRITICAL findings on final goal-close commit."

Current AgentShield CRITICAL findings (`.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt`):

| # | Finding | File | Category | Closeable? |
|---|---|---|---|---|
| 1-3 | `${content}${new_string}` interpolation | `.claude/hooks/schema-mutation-alarm.sh:22` | **False positive** — benign string concatenation, not command execution | ❌ NOT in 1.5.0 |
| 4-9 | PEM regex literal `-----BEGIN PRIVATE KEY-----` in pattern variable | `.claude/hooks/secrets-scanner.sh:49` | **False positive** — this regex is the DETECTOR for credential leaks, not an embedded key | ❌ NOT in 1.5.0 |
| 10-12 | `Bash(*)` in `.claude/settings.json` permissions | Root settings + worktree mirrors | **Policy overpermissiveness** — needs Founder ratification of allowed command list | ✓ via task #3 ratification |
| 13-18 | `--no-verify` references in worktree `CLAUDE.md` | `.claude/worktrees/*/CLAUDE.md` | **Prohibitive context only** (warns "don't use --no-verify") — auto-resolves when worktrees deleted | ✓ via Phase H housekeeping |

**Summary:**
- **9 of 18 CRITICALs require an upstream AgentShield fix** (false-positive regex suppression). Upstream issue drafts ready at `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-UPSTREAM-ISSUES.md`. PARBAUGHS cannot close these without either upstream PR or restructuring the hooks to avoid the patterns.
- **3 CRITICALs** are policy choices (Bash(*) wildcard). Task #3 surfaces the ratification ask.
- **6 CRITICALs** are worktree-only and auto-resolve when Phase H housekeeping runs.

## What AgentShield 1.5.0 supports

Confirmed via package inspection at `C:\Users\Zach\AppData\Local\npm-cache\_npx\9277ba5a66241c73\node_modules\ecc-agentshield`:

- `--policy <file>` — org-wide enforcement (required hooks, banned MCPs, min-score)
- `--baseline <file>` — regression detection (does NOT exempt findings, just flags new ones)
- `--min-severity high|medium|low` — filters OUTPUT only, doesn't change underlying scan

**Not supported:**
- Inline directives (`# agentshield-ignore-next-line`, `# noqa`, etc.)
- `.agentshieldignore` exclusion files
- Per-finding policy exemption / allowlist
- Context-aware regex (the scanner doesn't distinguish "embedded credential" from "regex that DETECTS credentials")

## Three options for D31 closure

### Option A — Accept `--min-severity high` gate with documented exception list
**What it means:** D31 gate uses `npx ecc-agentshield scan --min-severity high` instead of full scan. The 9 false-positive CRITICALs still get scanned and reported, but the gate command exits 0 if no genuine HIGH+ issues exist. Document the 9 false positives in a maintained exception list inside the repo.

**Pros:**
- D31 closeable today
- Honest — not silencing the findings, just exempting from blocker status
- No code changes to PARBAUGHS hooks (preserves functionality)

**Cons:**
- Requires maintaining the exception list
- Future genuine CRITICAL findings would need careful triage (could be confused with the documented exceptions)
- Doesn't escape the fact that AgentShield reports 18 CRITICAL on every scan

### Option B — Wait for upstream PR
**What it means:** File the 3 upstream issues at https://github.com/affaan-m/everything-claude-code/issues. Wait for AgentShield maintainers to land a fix (add inline suppression directives + improve PEM/interpolation regex). Then re-run scan and close D31.

**Pros:**
- Cleanest solution if upstream is responsive
- No PARBAUGHS code changes
- Benefits the broader ECC community

**Cons:**
- D31 timeline uncertain (depends on upstream response)
- Goal-close blocked indefinitely
- Could draft a PR ourselves to accelerate

### Option C — Refactor PARBAUGHS hooks to avoid the flagged patterns
**What it means:** Restructure `schema-mutation-alarm.sh` to avoid `${content}${new_string}` (rewrite using `printf` or temp file). Restructure `secrets-scanner.sh` to compute the PEM regex from individual characters rather than literal string (e.g., `pem_header="$(printf -- '-----%s-----' 'BEGIN PRIVATE KEY')"`). Make settings.json wildcard scopes specific.

**Pros:**
- D31 closeable today
- Hardens PARBAUGHS hooks against future AgentShield rules
- No external dependencies

**Cons:**
- Significant refactor work (multiple hours)
- Risk of breaking the hooks' actual detection logic
- Treats the symptom, not the cause (the false positive is AgentShield's, not PARBAUGHS')

## Founder recommendation request

**Question:** Which option closes D31?

- [ ] **A** — Accept `--min-severity high` gate with documented exception list (FASTEST, ships today)
- [ ] **B** — Wait for upstream PR (CLEANEST, indefinite timeline)
- [ ] **C** — Refactor PARBAUGHS hooks (HARDEST, hours of work, risks breakage)
- [ ] **Other** — write your alternative below

### Founder decision

Write `FOUNDER-D31-DECISION-{TIMESTAMP}` + the choice letter (and any clarifying instructions) below. The agent will execute the chosen path.

```
FOUNDER-D31-DECISION-2026-05-18T??:??:??Z choice=?
notes:
```

## Context on impact

D31 zero-CRITICAL is one of 49 DONE WHEN conditions. The full set requires:
- Phase B closed ✅ (session 2)
- Phase T6 closed (in flight)
- Phase M ≥ 9.5 (currently 8.6 — iterating)
- D31 zero-CRITICAL (this file)
- D49 Founder approval of verification packet
- Plus ~15 other conditions

D31 is NOT the only outstanding gate. But it's the one that requires Founder input on options, which is why it surfaces here.

## Related files

- `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt` — latest scan
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-FALSE-POSITIVE-LOG.md` — suppression investigation
- `.claude/state/dashboard-audit-2026-05-18/AGENTSHIELD-UPSTREAM-ISSUES.md` — 3 upstream issue drafts
