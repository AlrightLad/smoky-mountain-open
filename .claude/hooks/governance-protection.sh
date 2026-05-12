#!/usr/bin/env bash
# Hook 9 — Governance protection.
# Blocks writes to docs/agents/* except when an explicit governance-update marker is set.
# Per README.md: "Agents do NOT modify this directory without Founder approval."
#
# Bypass: set CLAUDE_PARBAUGHS_GOVERNANCE_EDIT=1 in the environment before the write
# operation. Phase 1 setup itself runs with this bypass enabled.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"

# Match docs/agents/ paths (including subdirs)
case "$normalized" in
  */docs/agents/*|docs/agents/*) ;;
  *) exit 0 ;;
esac

# Exempt: lessons-learned/ (ongoing capture) and proposed-skills/STATE.md (Phase 1 inferred)
# and active ship plans in ships/ (Engineer/Orchestrator add inferred decisions during ship)
case "$normalized" in
  */docs/agents/lessons-learned/*|docs/agents/lessons-learned/*) exit 0 ;;
  */docs/agents/ships/*|docs/agents/ships/*) exit 0 ;;
  */docs/agents/ship-reports/*|docs/agents/ship-reports/*) exit 0 ;;
  */docs/agents/backlog/*|docs/agents/backlog/*) exit 0 ;;
  */docs/agents/INFERRED_DECISIONS.md|docs/agents/INFERRED_DECISIONS.md) exit 0 ;;
esac

# Bypass flag
if [[ "${CLAUDE_PARBAUGHS_GOVERNANCE_EDIT:-}" == "1" ]]; then
  exit 0
fi

{
  echo ""
  echo "─────────────────────────────────────────────────────────"
  echo "GOVERNANCE PROTECTION — write blocked"
  echo "─────────────────────────────────────────────────────────"
  echo ""
  echo "  $file"
  echo ""
  echo "Files in docs/agents/ require Founder approval to modify."
  echo "Exempt subdirs (always writable): lessons-learned/, ships/,"
  echo "ship-reports/, backlog/, INFERRED_DECISIONS.md."
  echo ""
  echo "Bypass for authorized governance update:"
  echo "  CLAUDE_PARBAUGHS_GOVERNANCE_EDIT=1 (env var)"
} >&2
exit 2
