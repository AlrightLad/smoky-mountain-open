#!/usr/bin/env bash
# Hook 3 — Edit gate on tests/e2e/helpers/assertions.js.
#
# WARNING: the target path below is HARDCODED. If that file ever moves,
# update both the matcher here AND the NOTE comment at the top of the
# target file (which points back at this hook).
#
# This is the primary safety net of v7.8.1. It exists because during the
# v7.8.0 ship, an earlier agent silently added broad `permission-denied`
# patterns to IGNORE_PATTERNS to make failing tests pass, masking a real
# dead-listener bug. The user caught it in review. This hook makes that
# failure mode impossible to recur: every edit to this file must stop and
# wait for an explicit human handshake.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
normalized="${file//\\//}"

case "$normalized" in
  */tests/e2e/helpers/assertions.js) ;;
  tests/e2e/helpers/assertions.js) ;;
  *) exit 0 ;;
esac

{
  echo ""
  echo "─────────────────────────────────────────────────────────────"
  echo "assertions.js — EDIT REQUIRES EXPLICIT HUMAN APPROVAL"
  echo "─────────────────────────────────────────────────────────────"
  echo ""
  echo "If you are adding a new IGNORE_PATTERN:"
  echo "  1. Paste the raw console error you want to suppress."
  echo "  2. Confirm it's non-functional noise, not a real bug."
  echo "  3. Get sign-off from the user before proceeding."
  echo ""
  echo "If you are modifying other logic in this file:"
  echo "  Wait for an explicit spec from the user before proceeding."
  echo ""
  echo "This file is the test suite's trust contract. Silent edits can"
  echo "mask real bugs indefinitely. That exact failure mode shipped"
  echo "in v7.8.0 pre-release and is why this hook exists."
} >&2
exit 2
