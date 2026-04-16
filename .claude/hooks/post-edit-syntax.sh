#!/usr/bin/env bash
# Hook 2 — Post-edit syntax check (advisory, non-blocking).
#
# Fires after Edit/Write/MultiEdit on any *.js file under src/, tests/,
# or scripts/. Parses the file with acorn (ecmaVersion: 2022) and, on
# parse error, echoes a warning to stderr and exits 0.
#
# Why exit 0 with stderr instead of exit 2?
#   Dry-run behavior of the current Claude Code host (verified in
#   Phase 3.5): exit 2 on PostToolUse is surfaced as a hard error and
#   interrupts the session even though the edit has already landed —
#   which is the wrong UX for "your edit parsed fine but here's an
#   FYI." Exit 0 + stderr shows the warning inline without disrupting
#   the run. If a future version reverses that, switch to exit 2.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

# Normalize Windows backslashes so case globs work uniformly.
normalized="${file//\\//}"

# Scope: src/**/*.js, tests/**/*.js, scripts/**/*.js. Skip node_modules,
# functions/, and anything else.
case "$normalized" in
  *node_modules*|*functions/*) exit 0 ;;
esac
case "$normalized" in
  *.js) ;;
  *) exit 0 ;;
esac
case "$normalized" in
  *"/src/"*|*"/tests/"*|*"/scripts/"*) ;;
  *) exit 0 ;;
esac

# Parse via Node + acorn. Error output (if any) goes to stderr.
if err="$(node -e "
  const fs = require('fs');
  const acorn = require('acorn');
  try {
    acorn.parse(fs.readFileSync(process.argv[1], 'utf8'), { ecmaVersion: 2022, sourceType: 'script' });
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
" "$file" 2>&1)"; then
  exit 0
fi

{
  echo ""
  echo "POST-EDIT SYNTAX WARNING — $file does not parse:"
  echo "  $err"
  echo ""
  echo "(Advisory only; edit already landed. Fix before commit — the"
  echo "pre-commit lint gate will block otherwise.)"
} >&2
exit 0
