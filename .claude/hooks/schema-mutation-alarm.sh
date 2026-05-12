#!/usr/bin/env bash
# Hook 8 — Schema mutation alarm.
# Detects potentially non-additive Firestore field operations and warns.
# Warn-only (non-blocking) — static analysis can't fully prove additive-vs-non-additive;
# Engineer + Critic do the real audit per Criterion 12 and cross-surface-dependency-audit skill.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
content="$(parse_payload '.tool_input.content')"
new_string="$(parse_payload '.tool_input.new_string')"
[[ -z "$file" ]] && exit 0

# Only fire on .js files in src/
case "$file" in
  *src/*.js|*/src/*.js) ;;
  *) exit 0 ;;
esac

payload="${content}${new_string}"
[[ -z "$payload" ]] && exit 0

flagged=0
patterns=""

# Pattern 1: .update({...}) with FieldValue.delete() — explicit field removal
if echo "$payload" | grep -qE 'FieldValue\.delete\(\)|firebase\.firestore\.FieldValue\.delete\(\)'; then
  flagged=1
  patterns="${patterns}\n  - FieldValue.delete() — explicit field removal; verify all consumers handle missing field"
fi

# Pattern 2: .set({...}) without { merge: true } — full doc overwrite
# Match `.set(<args>)` where args don't contain "merge: true" or "merge:true"
if echo "$payload" | grep -qE '\.set\([^)]*\)' | grep -v 'merge[[:space:]]*:[[:space:]]*true' >/dev/null 2>&1; then
  # Refine: look for explicit .set() without merge
  if echo "$payload" | grep -qE '\.set\([^)]+\)' ; then
    if ! echo "$payload" | grep -qE 'merge[[:space:]]*:[[:space:]]*true'; then
      flagged=1
      patterns="${patterns}\n  - .set() without { merge: true } — full doc overwrite; verify intentional"
    fi
  fi
fi

# Pattern 3: Renaming likely (delete + add adjacent) — heuristic
# Hard to detect reliably; skip in static pass

if [[ $flagged -eq 1 ]]; then
  {
    echo ""
    echo "─────────────────────────────────────────────────────────"
    echo "SCHEMA MUTATION ALARM — non-additive write pattern detected"
    echo "─────────────────────────────────────────────────────────"
    echo ""
    echo "  $file"
    echo -e "$patterns"
    echo ""
    echo "Non-blocking warning. Verify per cross-surface-dependency-audit skill"
    echo "and CFR Category 5 (data architecture changes). If intentional and"
    echo "consumers are updated in same ship, proceed."
  } >&2
fi

# Always exit 0 (warn-only)
exit 0
