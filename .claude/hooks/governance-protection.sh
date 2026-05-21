#!/usr/bin/env bash
# Hook 9 - Governance protection.
#
# 2026-05-21 Founder direction: "you don't need approval to write to agent
# files or edit md files of agents... you need to be able to edit these
# agents to make them better as they troubleshoot and progress like their
# own personal memory updater". Previous broad block on docs/agents/* was
# creating friction for legitimate agent self-improvement (memory updates,
# incident-driven rules, etc.). Constraint: agent documents what changed +
# why in session summary; the broad block is gone but a narrow block on
# authority-defining files remains.

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

# NARROW BLOCK LIST - only files that codify the AMD-018 authority structure
# itself remain Founder-approval-only. Everything else in docs/agents/ is
# agent-editable.
case "$normalized" in
  */docs/agents/AMD-018.md|docs/agents/AMD-018.md) ;;
  */docs/agents/SANITY_HALT.md|docs/agents/SANITY_HALT.md) ;;
  */docs/agents/WAVE_PLAN.md|docs/agents/WAVE_PLAN.md) ;;
  *)
    # Not in the narrow protected list - allow the edit.
    exit 0
    ;;
esac

# Bypass flag (still works for the 3 protected files above)
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
