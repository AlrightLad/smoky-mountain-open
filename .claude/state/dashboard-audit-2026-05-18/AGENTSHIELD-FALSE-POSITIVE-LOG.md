# AgentShield false-positive suppression log

**Date:** 2026-05-18
**Audit cycle:** D31 zero-CRITICAL gate
**AgentShield version:** ecc-agentshield@1.5.0
**Founder decision (session 2):** "REMEDIATE all CRITICAL findings this audit cycle. Hit D31 zero-CRITICAL before goal closes."
**Pre-baseline:** `.claude/state/security/baseline-20260518-184859/agentshield-post-skill-instrumentation.txt`
**Post-baseline:** `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt`

---

## Summary

| Metric | Pre | Post |
|---|---|---|
| Total findings | 160 | 160 |
| CRITICAL | 18 | 18 |
| HIGH | 32 | 32 |
| MEDIUM | 102 | 102 |
| LOW | 3 | 3 |
| INFO | 5 | 5 |
| Grade | F (31/100) | F (31/100) |

**Net CRITICAL closures: 0** — AgentShield 1.5.0 has no inline-suppression mechanism. Inline documentation comments do not reduce its finding count.

---

## Investigation: AgentShield suppression mechanism

Searched the installed `ecc-agentshield@1.5.0` package (`C:\Users\Zach\AppData\Local\npm-cache\_npx\9277ba5a66241c73\node_modules\ecc-agentshield`) for any inline-suppression, ignore-file, or comment-aware directive. Result:

- **No** `agentshield-ignore`, `ignore-next-line`, `noqa`, `nosec`-style directive support.
- **No** `.agentshieldignore`, `.agentshield-ignore`, `agentshield.config.{json,yaml}` exclusion file support.
- **No** per-finding policy exemption (`policy init` generates org-wide enforcement template only — required-deny-list, banned-MCPs, min-score, banned-tools — no per-finding suppression schema).
- **Yes** `--baseline <path>` for regression detection (compares old scan to new — does not suppress findings, just flags new vs. existing).
- **Yes** `--min-severity` to filter output below a threshold (does not reduce CRITICAL count).
- **Yes** `--policy` to validate against org-wide policy (different scope — enforces *required* controls).

AgentShield's secrets and hooks rules operate on raw file content via JS regex (`INJECTION_PATTERNS` array in `dist/action.js:1970-1995`, secrets patterns elsewhere in the same file). The matchers have **no awareness** of:
- comments (any line content matches, including `#`/`//` comments),
- regex-string-vs-shell-execution context (a literal inside `grep -qE '...'` matches identically to a literal in `eval "..."`),
- variable-flow taint analysis (whether `${content}` reaches a shell sink or just `grep`).

This is a structural limitation of the 1.5.0 tool. Documented as 3 upstream issue drafts in `AGENTSHIELD-UPSTREAM-ISSUES.md`.

---

## Suppression strategy applied

**Strategy:** Inline documentation comments above each flagged line in the hook source files. These comments do NOT change AgentShield's count, but they:

1. Make the false-positive nature explicit for any human reviewer (auditor, future engineer, security reviewer agent).
2. Reference `AGENTSHIELD-FALSE-POSITIVE-LOG.md` (this file) and `AGENTSHIELD-UPSTREAM-ISSUES.md` for full context.
3. Use the proposed `# agentshield-ignore` token preemptively so they're forward-compatible if upstream lands inline suppression.

**Constraint discovered mid-task:** Comments containing the literal PEM start-marker string (5-dash + "BEGIN" + algorithm + "PRIVATE KEY" + 5-dash) themselves trip the secrets rules, adding NEW CRITICALs. Mitigation: the comment in `secrets-scanner.sh` refers to "the PEM-header literal below" without restating the literal. Confirmed via re-scan that this avoids creating new findings.

---

## Files modified

| File | Lines added | What |
|---|---|---|
| `.claude/hooks/schema-mutation-alarm.sh` | +8 (above line 22) | Documentation comment explaining `${content}${new_string}` is a static-grep concatenation, not an exec sink |
| `.claude/hooks/secrets-scanner.sh` | +3 (above line 23) | Documentation comment explaining same false positive for the `${content}${new_string}` concatenation in this file |
| `.claude/hooks/secrets-scanner.sh` | +7 (above line 49, now 56) | Documentation comment explaining the PEM-header literal inside `grep -qE` is a detection regex, not an embedded credential |
| `.claude/hooks/secrets-scanner.sh` | +1 (above line 55, now 64) | Same comment for the second PEM regex (generic private key markers) |

Total: 2 files modified, 4 documentation comment blocks added.

---

## Post-state — remaining 18 CRITICALs

| # | Finding | Line | Task owner | Status |
|---|---|---|---|---|
| 1 | Bash(*) — main repo `settings.json` | — | Task #3 | Open (Founder ratification required) |
| 2 | Potential command injection in `schema-mutation-alarm.sh` | :30 | This task | FALSE POSITIVE (documented, no upstream suppression mechanism) |
| 3 | Hardcoded Private key material in `secrets-scanner.sh` | :59 | This task | FALSE POSITIVE (documented) |
| 4 | PEM-encoded private key in `secrets-scanner.sh` | :59 | This task | FALSE POSITIVE (documented) |
| 5 | `--no-verify` in `worktrees/architecture-agent-day1/CLAUDE.md:933` | — | Phase H housekeeping | Open (auto-resolves on worktree cleanup) |
| 6 | `--no-verify` in `worktrees/architecture-agent-day1/CLAUDE.md:952` | — | Phase H housekeeping | Open (auto-resolves) |
| 7 | `--no-verify` in `worktrees/architecture-agent-day1/CLAUDE.md:958` | — | Phase H housekeeping | Open (auto-resolves) |
| 8 | Bash(*) in `worktrees/architecture-agent-day1/.claude/settings.json` | — | Phase H housekeeping | Open (auto-resolves) |
| 9 | Potential command injection in `worktrees/architecture-agent-day1/.claude/hooks/schema-mutation-alarm.sh:22` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #2; auto-resolves on worktree cleanup) |
| 10 | Hardcoded Private key material in `worktrees/architecture-agent-day1/.claude/hooks/secrets-scanner.sh:49` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #3; auto-resolves) |
| 11 | PEM-encoded private key in `worktrees/architecture-agent-day1/.claude/hooks/secrets-scanner.sh:49` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #4; auto-resolves) |
| 12 | `--no-verify` in `worktrees/dashboard-banners/CLAUDE.md:933` | — | Phase H housekeeping | Open (auto-resolves) |
| 13 | `--no-verify` in `worktrees/dashboard-banners/CLAUDE.md:952` | — | Phase H housekeeping | Open (auto-resolves) |
| 14 | `--no-verify` in `worktrees/dashboard-banners/CLAUDE.md:958` | — | Phase H housekeeping | Open (auto-resolves) |
| 15 | Bash(*) in `worktrees/dashboard-banners/.claude/settings.json` | — | Phase H housekeeping | Open (auto-resolves) |
| 16 | Potential command injection in `worktrees/dashboard-banners/.claude/hooks/schema-mutation-alarm.sh:22` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #2; auto-resolves) |
| 17 | Hardcoded Private key material in `worktrees/dashboard-banners/.claude/hooks/secrets-scanner.sh:49` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #3; auto-resolves) |
| 18 | PEM-encoded private key in `worktrees/dashboard-banners/.claude/hooks/secrets-scanner.sh:49` | — | Phase H housekeeping | FALSE POSITIVE (mirror of #4; auto-resolves) |

**Real categorization:**
- 3 main-repo false positives (#2, #3, #4) — documented, awaiting upstream AgentShield fix
- 6 worktree mirrors of the false positives (#9, #10, #11, #16, #17, #18) — auto-resolve when Phase H deletes `.claude/worktrees/`
- 6 `--no-verify` flagged in worktree CLAUDE.md (#5, #6, #7, #12, #13, #14) — auto-resolve when Phase H deletes worktrees
- 3 `Bash(*)` permissions (#1, #8, #15) — Task #3 (Founder ratification for main repo; #8 and #15 auto-resolve with worktrees)

**True scope after Phase H + Task #3 lands:**
- 3 main-repo CRITICALs remain (the documented false positives). They will not close until upstream AgentShield supports suppression or context-aware detection — outside this audit cycle.
- D31 zero-CRITICAL target is **structurally unachievable** with AgentShield 1.5.0 unless either:
  (a) the hook scripts are rewritten to obfuscate detection patterns (degrades security — rejected),
  (b) the hook scripts are removed entirely (degrades security — rejected),
  (c) AgentShield ships inline-suppression (upstream dependency — outside our control),
  (d) `--min-severity high` is used at the audit gate so CRITICALs documented as false positives are excluded from D31 (acceptable workaround pending upstream fix — Founder decision required).

---

## Recommendation for D31

Surface to Founder: option (d) above. Pre-Founder framing:

> "D31 zero-CRITICAL gate cannot be hit cleanly with AgentShield 1.5.0 because 3 of the 18 CRITICALs are structural false positives — the scanner flags our own credential-detection hook for containing the PEM regex it uses to detect leaks. Documented upstream issues drafted. Until upstream lands a fix, propose D31 gate becomes 'zero-CRITICAL **after documented false positives**', tracked via `AGENTSHIELD-FALSE-POSITIVE-LOG.md`. Goal closure path stays intact."

---

## Re-scan command (reproducible)

```bash
cd C:\Users\Zach\smoky-mountain-open
npx ecc-agentshield scan --path .claude --format terminal
# Note: scanning .claude (not the repo root) per existing baseline convention.
# Worktree findings appear because .claude/worktrees/*/.claude/ is mirrored inside the scan root.
```
