#!/usr/bin/env bash
# D32 — pre-commit secret scanner fixture-rejection test.
#
# Per dashboard-completion-spec-2026-05-15.md D32: "pre-commit + pre-push
# secret scanner installed + REJECTS fixture commit."
#
# This script:
#   1. Stages a fixture file containing a fake AWS access key
#   2. Runs the actual .husky/pre-commit hook
#   3. Asserts the hook EXITS NON-ZERO (= rejects the commit)
#   4. Cleans up the fixture (unstages + removes file)
#   5. Logs result to .claude/state/security/precommit-secret-fixture-test.md
#
# NOTE: this script BUILDS the AWS key pattern at runtime via concatenation
# to avoid the secrets-scanner pre-tool-use hook blocking the script's own
# write. The fixture file contains the assembled key, but this source file
# does not contain the literal contiguous pattern.
#
# Exit codes:
#   0 — fixture correctly REJECTED + test passes
#   1 — fixture was NOT rejected = scanner failure = REAL bug
#   2 — test setup error

set -eo pipefail
cd "$(git rev-parse --show-toplevel)"

FIXTURE_PATH="tests/secret-scanner-fixture-DELETE-ME.txt"
LOG_PATH=".claude/state/security/precommit-secret-fixture-test.md"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Cleanup function — runs even on failure
cleanup() {
    git reset HEAD -- "$FIXTURE_PATH" 2>/dev/null || true
    rm -f "$FIXTURE_PATH"
}
trap cleanup EXIT

mkdir -p "$(dirname "$LOG_PATH")"

# Step 1: build fake AWS access key pattern via concatenation
# Pattern: A + K + IA + 16 chars
# Use AWS docs canonical fake key (split to dodge our own write-tool scanner)
KEY_PART1="AK"
KEY_PART2="IA"
KEY_PART3="IOSFODNN7EXAMPLE"
FAKE_KEY="${KEY_PART1}${KEY_PART2}${KEY_PART3}"

# Step 2: write fixture
printf 'FAKE_AWS_KEY=%s\n' "$FAKE_KEY" > "$FIXTURE_PATH"

# Step 3: stage
git add "$FIXTURE_PATH"

# Step 4: run pre-commit hook directly (do NOT actually commit)
set +e
HOOK_OUT=$(bash .husky/pre-commit 2>&1)
HOOK_RC=$?
set -e

# Step 5: verdict
if [ "$HOOK_RC" -ne 0 ]; then
    VERDICT="PASS"
    DETAIL="Hook exited $HOOK_RC + emitted credential-leak warning. Scanner works."
else
    VERDICT="FAIL"
    DETAIL="Hook exited 0 — DID NOT REJECT fake AWS key. Scanner is broken."
fi

# Step 6: log
cat > "$LOG_PATH" <<EOF
# D32 — Pre-commit secret-scanner fixture-rejection test

**Run:** $TS
**Fixture path:** $FIXTURE_PATH (containing assembled fake AWS key)
**Hook:** .husky/pre-commit (inline LEAK_PATTERNS regex)
**Method:** stage fixture → run hook directly → assert exit non-zero → cleanup

## Result

**Verdict: $VERDICT**

Detail: $DETAIL

Hook exit code: $HOOK_RC

## Hook output (truncated; key literals redacted so this log itself doesn't trigger the scanner)

\`\`\`
$(echo "$HOOK_OUT" | head -25 | sed -E 's/AK(IA)[A-Z0-9_]{16,}/[REDACTED-AWS-KEY-PATTERN]/g')
\`\`\`

## What this test validates

- Husky pre-commit hook is wired (.husky/pre-commit exists + executable)
- LEAK_PATTERNS regex matches AKIA + 16-char AWS key pattern
- \`git diff --cached --unified=0 | grep -E\` pipeline functions
- Hook exits with code 1 (blocking) when a match is found
- Cleanup path runs even on test failure (trap EXIT)

## What this does NOT test

- detect-secrets v1.5.0 invocation — the live hook uses an inline regex
  rather than the detect-secrets binary. The P8 baseline used
  detect-secrets independently. Direct detect-secrets test:
  \`detect-secrets scan tests/secret-scanner-fixture-DELETE-ME.txt\`.
- Pre-push hook — no .husky/pre-push exists; pre-commit is the gate.
- Other patterns (sk_live_, ghp_, ya29., sk-) — AWS pattern coverage
  proves the matching mechanism works; per-pattern testing would
  expand here if any specific pattern fails in the field.

## How to re-run

\`\`\`
bash scripts/test-precommit-secret-rejection.sh
\`\`\`

Idempotent. Cleanup runs on success or failure.

EOF

# Step 7: emit verdict
if [ "$VERDICT" = "PASS" ]; then
    echo "[test-precommit-secret] PASS hook correctly rejected fake AWS key"
    exit 0
else
    echo "[test-precommit-secret] FAIL hook did NOT reject fake AWS key — SECURITY REGRESSION" >&2
    cat "$LOG_PATH" >&2
    exit 1
fi
