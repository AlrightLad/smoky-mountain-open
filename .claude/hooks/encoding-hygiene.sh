#!/usr/bin/env bash
# Hook 15 (post-INC-2026-05-21-002) - Encoding hygiene check.
#
# 2026-05-21 incident: an em-dash character in scripts/founder-mark-complete.ps1
# was UTF-8 double-encoded to U+201D (right curly quote) which PowerShell 5.1
# treats as a string-closing delimiter. Result: 30 minutes of "Missing closing
# }" parse errors that had nothing to do with brace structure.
#
# This hook WARNS on Edit/Write to .ps1 / .py files containing non-ASCII
# characters unless a `# noqa: encoding` marker is present in the file.
# Encoded-fine UTF-8 multi-byte sequences are fine elsewhere (.md, .html,
# .json) - the constraint is specific to scripting languages with known
# smart-quote / mojibake hazards on Windows PS 5.1.
#
# Non-blocking. Catches the problem at edit time without stopping the agent.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"

# Only check .ps1 / .py / .psm1
case "$normalized" in
  *.ps1|*.py|*.psm1) ;;
  *) exit 0 ;;
esac

case "$normalized" in
  */node_modules/*|*/dist/*|*/.venv/*|*/__pycache__/*) exit 0 ;;
esac

if [[ "$file" == /* ]] || [[ "$file" == [A-Z]:* ]]; then
    abs_file="$file"
else
    abs_file="$(pwd)/$file"
fi
[[ ! -f "$abs_file" ]] && exit 0

# Allow opt-out marker
if grep -q "# noqa: encoding" "$abs_file" 2>/dev/null; then
    exit 0
fi

# Scan for non-ASCII bytes
non_ascii_lines=$(LC_ALL=C grep -nP '[\x80-\xFF]' "$abs_file" 2>/dev/null | head -5 || true)

if [[ -n "$non_ascii_lines" ]]; then
    echo "" >&2
    echo "[hook-15 encoding-hygiene] WARN $normalized contains non-ASCII bytes:" >&2
    echo "$non_ascii_lines" | head -3 | sed 's/^/  /' >&2
    echo "  PowerShell 5.1 has known smart-quote / mojibake parse hazards." >&2
    echo "  If intentional, add '# noqa: encoding' to suppress this warning." >&2
fi

exit 0
