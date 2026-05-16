#!/usr/bin/env bash
# D33 — concrete test-run artifact wrapper.
#
# Per dashboard-completion-spec-2026-05-15.md D33 + P8.7:
#   "Every test result: exact command, exit code, exact stdout/stderr,
#   timestamp, environment. NO summary-only reports. All artifacts
#   committed under .claude/state/test-runs/{ts}/."
#
# Usage:
#   bash scripts/run-test-with-artifacts.sh <test-name> <command...>
#
# Example:
#   bash scripts/run-test-with-artifacts.sh round-trip python tests/round-trip-test.py
#   bash scripts/run-test-with-artifacts.sh scroll-audit node scripts/visual-audit/verify-scroll-reachability.mjs
#
# Writes to .claude/state/test-runs/{ISO-ts-of-run}-{test-name}/:
#   - command.txt          — the literal command invocation
#   - stdout.txt           — captured stdout
#   - stderr.txt           — captured stderr
#   - meta.json            — {test_name, command, exit_code, started_at,
#                            duration_seconds, environment, repo_head_sha}
#
# Exit code: same as the wrapped command (transparent passthrough).

set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ "$#" -lt 2 ]; then
    echo "usage: $0 <test-name> <command...>" >&2
    exit 2
fi

TEST_NAME="$1"
shift
TS=$(date -u +%Y-%m-%dT%H-%M-%SZ)
OUT_DIR=".claude/state/test-runs/${TS}-${TEST_NAME}"

mkdir -p "$OUT_DIR"

# Capture the command for the artifact
echo "$*" > "$OUT_DIR/command.txt"

# Capture environment
HEAD_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
STARTED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
STARTED_EPOCH=$(date +%s)

# Run the command, capturing stdout + stderr separately
"$@" > "$OUT_DIR/stdout.txt" 2> "$OUT_DIR/stderr.txt"
EXIT_CODE=$?

FINISHED_EPOCH=$(date +%s)
DURATION=$((FINISHED_EPOCH - STARTED_EPOCH))

# Write meta sidecar
cat > "$OUT_DIR/meta.json" <<EOF
{
  "test_name": "${TEST_NAME}",
  "command": "$(echo "$*" | sed 's/"/\\"/g')",
  "exit_code": ${EXIT_CODE},
  "started_at": "${STARTED_AT}",
  "duration_seconds": ${DURATION},
  "head_sha": "${HEAD_SHA}",
  "stdout_path": "${OUT_DIR}/stdout.txt",
  "stderr_path": "${OUT_DIR}/stderr.txt",
  "stdout_bytes": $(wc -c < "$OUT_DIR/stdout.txt" | tr -d ' '),
  "stderr_bytes": $(wc -c < "$OUT_DIR/stderr.txt" | tr -d ' ')
}
EOF

echo "[run-test-with-artifacts] ${TEST_NAME} exit=${EXIT_CODE} → ${OUT_DIR}/"
exit $EXIT_CODE
