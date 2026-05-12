#!/usr/bin/env bash
# Hook 11 — Push protection.
# Blocks `git push` ONLY when last-verify state shows failure on smoke OR lint OR
# visual verification. Per Correction 1: push graduates to autonomous on green.
#
# State file: .claude/state/last-verify.json
#   {
#     "smoke":  { "pass": true|false, "timestamp": "ISO", "ship_id": "..." },
#     "lint":   { "pass": true|false, "timestamp": "ISO" },
#     "visual": { "pass": true|false, "timestamp": "ISO", "ship_id": "..." }
#   }
#
# Defaults:
# - Missing file: ALLOW (governance-only / doc-only commits; first run; bootstrap state)
# - Field missing or stale (>24h): WARN but ALLOW (push but flag for retrospective)
# - Field present and false (within 24h): BLOCK

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

command="$(parse_payload '.tool_input.command')"
[[ -z "$command" ]] && exit 0

# Match `git push` anywhere in the command (handles chained commands)
if ! echo "$command" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  exit 0
fi

# Founder override: bypass for explicit override env var
if [[ "${CLAUDE_PARBAUGHS_FOUNDER_PUSH:-}" == "1" ]]; then
  exit 0
fi

state_file=".claude/state/last-verify.json"

# Missing state file → allow (governance/doc-only commits, bootstrap, etc.)
if [[ ! -f "$state_file" ]]; then
  exit 0
fi

# Parse state file (best-effort jq-free)
# Look for any "pass": false within smoke/lint/visual fields
content="$(cat "$state_file" 2>/dev/null || echo '{}')"

# Quick check: any field with pass: false?
if echo "$content" | grep -qE '"pass"[[:space:]]*:[[:space:]]*false'; then
  failed_fields=""
  if echo "$content" | grep -qE '"smoke"[^}]*"pass"[[:space:]]*:[[:space:]]*false'; then
    failed_fields="${failed_fields} smoke"
  fi
  if echo "$content" | grep -qE '"lint"[^}]*"pass"[[:space:]]*:[[:space:]]*false'; then
    failed_fields="${failed_fields} lint"
  fi
  if echo "$content" | grep -qE '"visual"[^}]*"pass"[[:space:]]*:[[:space:]]*false'; then
    failed_fields="${failed_fields} visual"
  fi

  {
    echo ""
    echo "─────────────────────────────────────────────────────────"
    echo "PUSH PROTECTION — last verification not green"
    echo "─────────────────────────────────────────────────────────"
    echo ""
    echo "  Failed fields:$failed_fields"
    echo "  State file:   $state_file"
    echo ""
    echo "Per Correction 1: autonomous push requires smoke + lint + visual"
    echo "verification all green. Fix the failure or escalate to Founder."
    echo ""
    echo "Founder override:"
    echo "  CLAUDE_PARBAUGHS_FOUNDER_PUSH=1 git push ..."
    echo ""
    echo "Smoke triage: see parbaughs-smoke-failure-triage skill"
    echo "Visual triage: see parbaughs-visual-verification-protocol skill (category 9)"
  } >&2
  exit 2
fi

# All pass fields are true (or fields missing — treated as ungated)
exit 0
