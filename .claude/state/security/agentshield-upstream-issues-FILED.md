# AgentShield upstream issues — ready to file

**Date:** 2026-05-18
**Status:** Draft text ready; awaiting Founder to file at https://github.com/affaan-m/everything-claude-code/issues
**Reason for staging:** `gh` CLI not installed locally; Founder action required.
**AgentShield version observed:** ecc-agentshield@1.5.0 (installed via `npx`)
**Refactor that obviated the local impact:** `.claude/state/dashboard-audit-2026-05-18/D31-REFACTOR-LOG.md`

After the D31 refactor, the PARBAUGHS repo no longer trips these false positives in the main tree (the affected scanners were ported to Python, where the bash-only `var-interpolation` rule does not run, and the PEM detection regex is constructed at runtime so the literal never appears in source). The upstream issues below remain valid for the broader ecosystem — any user who writes credential-detection hooks in bash will hit the same wall.

---

## Issue 1 — Distinguish detection regex from embedded credential

**Title:** `secrets-private-key-material` flags credential-detection regexes as hardcoded credentials

**Suggested labels:** `bug`, `false-positive`, `rule:secrets-private-key-material`

**Severity:** Medium — false positives erode trust in CRITICAL findings; users either ignore them, delete legitimate detection code to satisfy the scanner, or rewrite hooks in another language to escape the static rule. None of those outcomes improve security.

**Affected rules (1.5.0):**
- `secrets-private-key-material` (dist/action.js ~line 988)
- `secrets-private-key-pem` (same check function, second pattern in the same rule)
- Likely also: `secrets-aws-access-key`, `secrets-stripe-live`, `secrets-github-pat`, `secrets-google-api` — any rule whose regex matches the literal credential pattern *and* is written into a detection script.

**Reproducer:** A shell hook that scans tool-input content for credential leaks:

```bash
# secrets-scanner.sh — detects PEM leaks in payloads
if echo "$payload" | grep -qE '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'; then
  echo "WARNING: PEM credential in payload"
  exit 2
fi
```

AgentShield flags this as both "Hardcoded Private key material" and "PEM-encoded private key found in config". But the regex *detects* PEM leaks; it doesn't embed one. Reporting this as CRITICAL incentivizes either (a) deleting the detection, (b) obfuscating it (silent weakening), or (c) rewriting in a language AgentShield's bash-only rules don't cover. All worse than just supporting context.

**Where it fires in `dist/action.js` 1.5.0:**
```js
// Line 988-1028 — runs over every file's raw content with no file-type filter
{
  id: "secrets-private-key-material",
  check(file) {
    const keyPatterns = [
      { pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, ... },
      { pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g, ... }
    ];
    // ... findAllMatches(file.content, pattern) — no context awareness
  }
}
```

The rule does not check:
- Whether the literal sits inside a quoted argument to a pattern-matching invocation (`grep`, `egrep`, `awk`, `sed`, `re.search`, etc.)
- Whether the line is a regex string consumed by a matcher rather than a value assigned to a variable used as a credential
- Whether the surrounding context indicates a detection script (file is named `*scanner*`, `*secret*`, `*detect*`, etc.)

**Proposed fix:**

A regex string used as a detector has structural cues. Heuristic:

1. The literal credential appears **inside** a quoted-string argument to `grep`, `grep -qE`, `grep -E`, `egrep`, `awk '/.../'`, `sed -n '/.../p'`, `match(...)`, `test(...)`, `re.search(...)`, `re.match(...)`, `Pattern.compile(...)`, etc.
2. AND the surrounding token is a known pattern-matching invocation (literal is a *predicate*, not a *value*).
3. AND/OR the regex string contains additional metacharacters that would be invalid for an actual credential (parens, `|`, `?`, character classes, `\d`, etc.).

If both conditions hold, downgrade to INFO ("detection regex contains credential pattern — verify scanner") instead of CRITICAL.

Alternative simpler fix: support an inline-comment directive `# agentshield-ignore-next-line: <reason>` (issue 3 below) that suppresses the next match. Familiar pattern from ESLint, Bandit, mypy, pylint, ShellCheck, TruffleHog.

**Acceptance criteria:**
- Scan of a hook script that contains `grep -qE '-----BEGIN PRIVATE KEY-----'` produces no CRITICAL finding (INFO or nothing).
- Scan of a config file that contains `private_key = '-----BEGIN PRIVATE KEY-----...'` (real credential) still produces a CRITICAL finding.
- Test fixtures: `tests/fixtures/false-positive-detection-script.sh` + `tests/fixtures/true-positive-embedded-credential.json`.

---

## Issue 2 — Distinguish string assignment from command execution

**Title:** `hooks-injection` / `var-interpolation` flags benign variable concatenation that never reaches a shell sink

**Suggested labels:** `bug`, `false-positive`, `rule:hooks-injection`

**Severity:** Medium

**Affected rule (1.5.0):** `hooks-injection` (`dist/action.js` line 2407), pattern `var-interpolation` (`dist/action.js` line 1970-1976).

**Pattern source:**
```js
var INJECTION_PATTERNS = [
  {
    name: "var-interpolation",
    pattern: /\$\{(?:file|command|content|input|args?)\}/gi,
    description: "Hook uses variable interpolation that could be influenced by file content or command arguments. An attacker could craft filenames or content to inject commands.",
    severity: "critical"
  },
  // ...
];
```

**Reproducer:** Bash hook that concatenates two tool-input variables into one string for static grep:

```bash
payload="${content}${new_string}"  # AgentShield flags both ${content} and ${new_string}
echo "$payload" | grep -qE 'FieldValue\.delete\(\)'
```

The variables here never reach `sh -c`, `eval`, `bash -c`, backticks, `xargs ... bash`, `parallel`, or any exec sink — they're stored in `$payload` and consumed by `grep -qE` (read-only pattern matching). No injection vector exists.

The 1.5.0 code already does context inspection in nearby checks (e.g. `isInsideTestPattern` at line 2170, `isInsideQuotedString` at line 2213, `isBlockingGuardCommand` at line 2227 — applied at line 2238-2241 for blocking-guard commands). The var-interpolation rule could reuse the same machinery: walk forward from the variable assignment, look for exec sinks vs. matcher sinks, and downgrade if no exec is found.

**Proposed fix:**

The `var-interpolation` rule needs taint analysis or, at minimum, a heuristic sink check:

1. Find all `${file|command|content|input|args?}` occurrences.
2. For each, look forward through the script for known exec sinks: `eval`, `sh -c`, `bash -c`, `$(...)`, backticks, `exec`, `xargs ... bash`, `parallel ... bash`, etc.
3. If no exec sink consumes the tainted variable, downgrade to INFO ("hook holds tool-input in variable — verify it never reaches exec").

Alternative: the existing `shell-interpolation` pattern (`/\bsh\s+-c\s+["'].*\$\{/g`) already distinguishes the *dangerous* case. The `var-interpolation` rule as-is over-triggers because it doesn't differentiate. Either:
(a) merge into shell-interpolation, or
(b) downgrade `var-interpolation` to HIGH/MEDIUM with description "tool-input variable interpolation present — verify it never reaches a shell sink", or
(c) support inline `# agentshield-ignore` directive (issue 3).

**Acceptance criteria:**
- Scan of a hook that contains `payload="${content}${new_string}"; echo "$payload" | grep -qE '...'` produces no CRITICAL finding.
- Scan of a hook that contains `bash -c "echo ${content}"` still produces a CRITICAL finding.
- Test fixtures: `tests/fixtures/false-positive-static-grep.sh` + `tests/fixtures/true-positive-bash-c-injection.sh`.

---

## Issue 3 (umbrella) — Add `# agentshield-ignore-next-line` directive

**Title:** Add inline-suppression directive support for documented false positives

**Suggested labels:** `enhancement`, `dx`, `parity-with-existing-tools`

**Severity:** Low-priority enhancement — but unblocks legitimate security-tool authoring and is parity with every comparable scanner.

**Background:** Every other linter/static-analyzer in the modern tooling stack supports per-line suppression:
- ESLint: `// eslint-disable-next-line`
- Bandit: `# nosec`
- mypy: `# type: ignore`
- pylint: `# pylint: disable=line-too-long`
- ShellCheck: `# shellcheck disable=SC2086`
- TruffleHog: `# trufflehog:ignore`
- Semgrep: `# nosemgrep`

A scanner without suppression is one that either (a) accepts permanent false positives or (b) forces users to delete legitimate detection code to satisfy it. Both outcomes are worse than supporting `# agentshield-ignore-next-line: <reason>`.

**Proposed semantics:**

```bash
# agentshield-ignore-next-line: PEM regex detects credentials, doesn't embed one
if grep -qE '-----BEGIN PRIVATE KEY-----'; then ...
```

- Scoped to next line only (no file-level disable to avoid drift).
- Reason text required (force the author to write *why*).
- Logged in scan output as `INFO: suppressed N findings with documented reasons` so suppressions remain visible.
- Optional: `--no-suppress` flag to scan as if no suppressions exist (for CI audit cycles).

**Implementation sketch (1.5.0 `dist/action.js`):**

In the rule-evaluation loop, when a finding is about to be pushed (e.g. line 2418 `findings.push(...)`), check the immediately preceding non-blank line of `file.content` for a token matching `/#\s*agentshield-ignore-next-line:\s*\S/`. If present, skip the push and accumulate a suppression count for the audit summary.

```js
function shouldSuppress(file, lineNumber) {
  const lines = file.content.split("\n");
  // Walk backwards from lineNumber - 1 (0-indexed = lineNumber - 2) skipping blanks
  for (let i = lineNumber - 2; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    return /^#\s*agentshield-ignore-next-line:\s*\S/.test(trimmed);
  }
  return false;
}
```

**Acceptance criteria:**
- Comment `# agentshield-ignore-next-line: documented reason` above a flagged line suppresses that finding.
- Scan output summary shows `Suppressed: N findings with documented reasons`.
- Suppression without a reason (`# agentshield-ignore-next-line`) is ignored (still flags).
- `--no-suppress` flag bypasses all suppressions.

---

## Filing checklist for Founder

1. Open https://github.com/affaan-m/everything-claude-code/issues
2. Verify the issue tracker accepts AgentShield-specific reports (the README points there even though AgentShield itself ships from a different repo).
3. File issue 1 with the title, severity, and reproducer above. Attach link to this document if helpful, but the issue body should stand alone.
4. File issue 2 same way.
5. File issue 3 same way.
6. Capture issue URLs back into this file (replace each "Status:" line below) for traceability.

```
Issue 1 URL: <pending>
Issue 2 URL: <pending>
Issue 3 URL: <pending>
Filed by: Zach Boogher (Founder)
Filed at: <pending>
```

---

## Why this is staged, not auto-filed

The Claude Code agent attempted `gh issue create` but `gh` CLI is not installed on this workstation, and filing GitHub issues programmatically with curl + a PAT would require credentials AgentShield doesn't have access to and the V2 authorization scope excludes credentials / IT Glue / password-manager content (per CLAUDE.md AMD-018 11-gate item 5).

This document gives the Founder a one-paste-per-issue path. Each "Title:" line plus the body below it can be copy-pasted directly into a GitHub new-issue form.
