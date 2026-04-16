#!/usr/bin/env bash
# Hook 1 — Pre-commit lint gate.
# Fires on every Bash call; no-ops unless the command is `git commit ...`.
# Runs `npm run lint`. Exit 2 blocks the commit on any non-zero exit.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

cmd="$(parse_payload '.tool_input.command')"
case "$cmd" in
  "git commit"*) ;;
  *) exit 0 ;;
esac

cd "$(git rev-parse --show-toplevel)"

if lint_output="$(npm run lint 2>&1)"; then
  exit 0
fi

{
  echo ""
  echo "──────────────────────────────────────────────────────────"
  echo "PRE-COMMIT LINT GATE FAILED — commit blocked."
  echo "──────────────────────────────────────────────────────────"
  # Show the actual failures (ERR lines + summary), not OK noise.
  echo "$lint_output" | grep -E "ERR|FAILED" || echo "$lint_output" | tail -10
} >&2
exit 2
