#!/usr/bin/env bash
# Hook 12 (ECC GAP-FILL, Founder-approved 2026-05-21) — console.log edit-time warning.
#
# Adopts ECC's check-console-log pattern, scoped to PARBAUGHS:
#   - Fires after Edit/Write on .js / .jsx / .ts / .tsx files
#   - Scans ONLY the file just edited (not all modified files like ECC's git-walk)
#   - Excludes scripts/, tests/, *.config.js — console.log is intentional there
#   - WARN only (does not block) — pre-commit ESLint still gates the commit
#
# Why: surface console.log 30 seconds earlier than the lint gate. AI agents
# can self-correct mid-edit instead of after commit-time rejection.
#
# Compatible with PARBAUGHS hooks 1-11. Does NOT replace hook 1 (ESLint gate).

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

# Normalize path
normalized="${file//\\//}"

# Only check .js / .jsx / .ts / .tsx
case "$normalized" in
    *.js|*.jsx|*.ts|*.tsx) ;;
    *) exit 0 ;;
esac

# Exclude scripts/, tests/, config files where console.log is intentional
case "$normalized" in
    */scripts/*|scripts/*) exit 0 ;;
    */tests/*|tests/*) exit 0 ;;
    *.test.*|*.spec.*|*.config.*) exit 0 ;;
    */__tests__/*|*/__mocks__/*) exit 0 ;;
esac

# Find file relative to repo root for absolute vs relative tolerance
if [[ "$file" == /* ]] || [[ "$file" == [A-Z]:* ]]; then
    abs_file="$file"
else
    abs_file="$(pwd)/$file"
fi

[[ ! -f "$abs_file" ]] && exit 0

# Scan for console.log (also console.warn/error are NOT flagged — those are intentional)
matches=$(grep -nE 'console\.log\(' "$abs_file" 2>/dev/null || true)
[[ -z "$matches" ]] && exit 0

# Emit a friendly warning (non-blocking)
echo "" >&2
echo "[hook-12 console.log] $normalized contains console.log calls:" >&2
echo "$matches" | head -10 | sed 's/^/  /' >&2
echo "  (warning only — ESLint pre-commit gate will block if not removed)" >&2

exit 0
