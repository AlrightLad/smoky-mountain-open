#!/usr/bin/env bash
# Hook 10 — Approval-gated paths (skills).
# Writes to .claude/skills/<name>.md require a sibling <name>.APPROVAL.md token
# to either pre-exist OR be written in the same conceptual batch.
#
# Per inferred decision in INFERRED_DECISIONS.md Phase 1 entries:
# Token format is a minimal sidecar markdown file alongside the skill.
# Phase 1 batch landed 10 skill + 10 token files together.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"

# Only fire on .claude/skills/*.md (not .APPROVAL.md sidecars themselves)
case "$normalized" in
  */.claude/skills/*.APPROVAL.md|.claude/skills/*.APPROVAL.md) exit 0 ;;
  */.claude/skills/*.md|.claude/skills/*.md) ;;
  *) exit 0 ;;
esac

# Look for sidecar APPROVAL.md
sidecar="${normalized%.md}.APPROVAL.md"
sidecar_path="$sidecar"

if [[ -f "$sidecar_path" ]]; then
  # Token exists; allow
  exit 0
fi

# Bypass for batch-commit case (e.g., Phase 1 setup writing both files in one session)
if [[ "${CLAUDE_PARBAUGHS_SKILL_BATCH:-}" == "1" ]]; then
  exit 0
fi

{
  echo ""
  echo "─────────────────────────────────────────────────────────"
  echo "SKILL APPROVAL GATE — token sidecar missing"
  echo "─────────────────────────────────────────────────────────"
  echo ""
  echo "  Skill file:    $file"
  echo "  Expected token: $sidecar"
  echo ""
  echo "Skills in .claude/skills/ require a sibling .APPROVAL.md sidecar"
  echo "with Founder ratification. Create the sidecar first, or set"
  echo "CLAUDE_PARBAUGHS_SKILL_BATCH=1 to bypass for same-session batch."
} >&2
exit 2
