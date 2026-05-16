# D32 — Pre-commit secret-scanner fixture-rejection test

**Run:** 2026-05-16T00:41:29Z
**Fixture path:** tests/secret-scanner-fixture-DELETE-ME.txt (containing assembled fake AWS key)
**Hook:** .husky/pre-commit (inline LEAK_PATTERNS regex)
**Method:** stage fixture → run hook directly → assert exit non-zero → cleanup

## Result

**Verdict: PASS**

Detail: Hook exited 1 + emitted credential-leak warning. Scanner works.

Hook exit code: 1

## Hook output (truncated; key literals redacted so this log itself doesn't trigger the scanner)

```

POTENTIAL CREDENTIAL LEAK DETECTED IN STAGED CHANGES

A pattern matched something that looks like a credential.

Matched lines:
106:+1:+FAKE_AWS_KEY=[REDACTED-AWS-KEY-PATTERN]
383:+FAKE_AWS_KEY=[REDACTED-AWS-KEY-PATTERN]

Options:
  1. Remove the credential, use environment variable instead
  2. If false positive (schema field name, doc text, etc.),
     refine the LEAK_PATTERNS regex in .husky/pre-commit
  3. Override (NOT RECOMMENDED): git commit --no-verify
```

## What this test validates

- Husky pre-commit hook is wired (.husky/pre-commit exists + executable)
- LEAK_PATTERNS regex matches AKIA + 16-char AWS key pattern
- `git diff --cached --unified=0 | grep -E` pipeline functions
- Hook exits with code 1 (blocking) when a match is found
- Cleanup path runs even on test failure (trap EXIT)

## What this does NOT test

- detect-secrets v1.5.0 invocation — the live hook uses an inline regex
  rather than the detect-secrets binary. The P8 baseline used
  detect-secrets independently. Direct detect-secrets test:
  `detect-secrets scan tests/secret-scanner-fixture-DELETE-ME.txt`.
- Pre-push hook — no .husky/pre-push exists; pre-commit is the gate.
- Other patterns (sk_live_, ghp_, ya29., sk-) — AWS pattern coverage
  proves the matching mechanism works; per-pattern testing would
  expand here if any specific pattern fails in the field.

## How to re-run

```
bash scripts/test-precommit-secret-rejection.sh
```

Idempotent. Cleanup runs on success or failure.

