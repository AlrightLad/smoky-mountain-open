# AgentShield upstream issue drafts

**Date:** 2026-05-18
**AgentShield version:** ecc-agentshield@1.5.0 (installed via `npx`)
**Repo:** https://github.com/affaan-m/agentshield (issues filed under everything-claude-code: https://github.com/affaan-m/everything-claude-code/issues)
**Context:** Documenting false positives identified while remediating PARBAUGHS dashboard ecosystem audit (D31 zero-CRITICAL gate).

---

## TL;DR

AgentShield 1.5.0 has no inline-suppression, no `.agentshieldignore`, no per-finding policy exemption, and no comment-aware context. It uses raw regex pattern matching against file content, so:

1. Any shell hook that holds tool-input variables (`${content}`, `${new_string}`) in a string for later non-exec use (e.g., piping to `grep -qE`) is permanently flagged as a "Potential command injection" CRITICAL.
2. Any security-detection regex that contains the literal string of the credential it is trying to *find* (e.g., `-----BEGIN PRIVATE KEY-----` inside a `grep` argument) is permanently flagged as "Hardcoded Private key material" + "PEM-encoded private key found in config" CRITICAL.

Both are detection patterns by purpose; they grep *for* the threat, they do not embed it.

This is a real gap. AgentShield is intentionally a strict tool — and "strict at the cost of breaking the tools that defend against the threat" is the spot where strict needs context awareness.

---

## Issue draft 1 — Distinguish detection regex from embedded credential

**Title:** Secrets rules flag credential-detection regexes as hardcoded credentials

**Severity:** Medium (false positives erode trust in CRITICAL findings)

**Affected rules:**
- `secrets-private-key-pem` (PEM-encoded private key found in config)
- `secrets-private-key-material` (Hardcoded Private key material)
- Likely also: `secrets-aws-access-key`, `secrets-stripe-live`, `secrets-github-pat`, `secrets-google-api` — any rule whose regex matches the literal credential pattern *and* is itself written into a detection script.

**Reproducer:** Any shell hook or script that scans tool-input content for credential leaks:

```bash
# secrets-scanner.sh — detects PEM leaks in tool-input payloads
if echo "$payload" | grep -qE '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'; then
  echo "WARNING: PEM credential in payload"
fi
```

AgentShield flags the regex as both "Hardcoded Private key material" and "PEM-encoded private key found in config" — but the regex *detects* PEM leaks; it doesn't embed one. Reporting this as a CRITICAL incentivizes deleting the detection (worse security), not strengthening it.

**Proposed fix:**

A regex string used as a detector has structural cues. Heuristic:

1. The literal credential appears **inside** a quoted-string argument to `grep`, `grep -qE`, `grep -E`, `egrep`, `awk '/.../'`, `sed -n '/.../p'`, `match(...)`, `test(...)`, `re.search(...)`, `re.match(...)`, `Pattern.compile(...)`, etc.
2. AND the surrounding token is a known pattern-matching invocation (the literal is a *predicate*, not a *value*).
3. AND/OR the regex string contains additional metacharacters that would be invalid for an actual credential (parens, `|`, `?`, character classes, `\d`, etc.).

If both conditions hold, downgrade to INFO ("detection regex contains credential pattern — verify scanner") instead of CRITICAL.

Alternative simpler fix: support an inline-comment directive `# agentshield-ignore-next-line: <reason>` that suppresses the next match. Familiar pattern from ESLint, Bandit, mypy, pylint, etc.

---

## Issue draft 2 — Distinguish string assignment from command execution

**Title:** Hook command-injection rule flags benign variable concatenation that never reaches a shell sink

**Severity:** Medium

**Affected rule:** `hooks-injection` (Potential command injection in hook), `var-interpolation` pattern.

**Pattern source:**
```js
INJECTION_PATTERNS = [
  {
    name: "var-interpolation",
    pattern: /\$\{(?:file|command|content|input|args?)\}/gi,
    severity: "critical"
  }
]
```

**Reproducer:** Bash hook that concatenates two tool-input variables into one string for static grep:

```bash
payload="${content}${new_string}"  # AgentShield flags both ${content} and ${new_string}
echo "$payload" | grep -qE 'FieldValue\.delete\(\)'
```

The variables here never reach `sh -c`, `eval`, `bash -c`, backticks, or any exec sink — they're stored in `$payload` and consumed by `grep -qE` (read-only pattern matching). No injection vector exists.

**Proposed fix:**

The `var-interpolation` rule needs taint analysis or, at minimum, a heuristic sink check:

1. Find all `${file|command|content|input|args?}` occurrences.
2. For each, look forward through the script for known exec sinks: `eval`, `sh -c`, `bash -c`, `$(...)`, backticks, `exec`, `xargs ... bash`, `parallel`, etc.
3. If no exec sink consumes the tainted variable, downgrade to INFO ("hook holds tool-input in variable — verify it never reaches exec").

Alternative: the existing `shell-interpolation` pattern (`/\bsh\s+-c\s+["'].*\$\{/g`) already distinguishes the *dangerous* case. The `var-interpolation` rule as-is over-triggers because it doesn't differentiate. Either:
(a) merge into shell-interpolation, or
(b) downgrade `var-interpolation` to HIGH/MEDIUM with description "tool-input variable interpolation present — verify it never reaches a shell sink", or
(c) support inline `# agentshield-ignore` directive.

---

## Issue draft 3 (umbrella) — Add inline-suppression directive support

**Title:** Add `# agentshield-ignore-next-line` directive for documented false positives

**Severity:** Low-priority enhancement (but unblocks legitimate security-tool authoring)

**Background:** Every other linter/static-analyzer in the modern tooling stack supports per-line suppression:
- ESLint: `// eslint-disable-next-line`
- Bandit: `# nosec`
- mypy: `# type: ignore`
- pylint: `# pylint: disable=line-too-long`
- ShellCheck: `# shellcheck disable=SC2086`
- TruffleHog: `# trufflehog:ignore`

A scanner without suppression is a scanner that either (a) accepts permanent false positives or (b) forces users to delete legitimate detection code to satisfy it. Both outcomes are worse than supporting `# agentshield-ignore-next-line: <reason>`.

**Proposed semantics:**

```bash
# agentshield-ignore-next-line: PEM regex detects credentials, doesn't embed one
if grep -qE '-----BEGIN PRIVATE KEY-----'; then ...
```

- Scoped to next line only (no file-level disable to avoid drift).
- Reason text required (force the author to write *why*).
- Logged in scan output as `INFO: suppressed N findings with documented reasons` so suppressions remain visible.
- Optional: `--no-suppress` flag to scan as if no suppressions exist (for CI audit cycles).

---

## Filing recommendation

File these as three separate issues on https://github.com/affaan-m/everything-claude-code/issues with labels `bug`, `enhancement`, and `enhancement` respectively. Reference this document. Optionally fork ecc-agentshield, prototype the directive in `dist/action.js` around the rule loop (around line 2418, where `findings.push` is called — check the line for a preceding `# agentshield-ignore-next-line` token before pushing), and submit a PR.

Until upstream lands a fix, these 3 main-repo CRITICALs (1× hook-injection, 2× PEM-detection) remain in AgentShield's count as documented false positives. The actual security posture is unchanged: the regex still detects real leaks, the variable still feeds a static grep.

---

## Findings inventory (false positives)

| # | File | Line (post-comment) | Rule ID | Title | Why false |
|---|---|---|---|---|---|
| 1 | `.claude/hooks/schema-mutation-alarm.sh` | 30 | `hooks-injection` / `var-interpolation` | Potential command injection in hook | `${content}${new_string}` concatenation; piped to `grep -qE`, never to exec sink |
| 2 | `.claude/hooks/secrets-scanner.sh` | 59 | `secrets-private-key-material` | Hardcoded Private key material | Literal PEM header inside `grep -qE '...'` detection regex |
| 3 | `.claude/hooks/secrets-scanner.sh` | 59 | `secrets-private-key-pem` | PEM-encoded private key found in config | Same as above (two rules fire on the same line) |
| 4-9 | `.claude/worktrees/{architecture-agent-day1,dashboard-banners}/.claude/hooks/{secrets-scanner.sh,schema-mutation-alarm.sh}` | various | Same three rules above | Worktree mirrors of same files — auto-resolve when Phase H deletes `.claude/worktrees/` |

3 false positives × 3 surfaces (main repo + 2 worktrees) = 9 CRITICAL findings traced to two upstream rule weaknesses.
