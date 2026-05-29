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

# ── Origin/main FREEZE (Founder directive: main stays frozen until sign-off) ──
# Block any push whose destination ref on the remote is `main`. Staging pushes
# (e.g. `git push origin main:staging`) are explicitly allowed — only the
# destination ref matters. The Founder override above bypasses this for the
# eventual staging→main replication after end-to-end sign-off.
#
# Threat model: a guardrail against an accidental `git push origin main` (or a
# bare `git push` from the main branch, which defaults to origin/main) during
# long autonomous runs — NOT an adversarial parser. Chained pushes past the
# first `;`/`&&`/`||`/`|` are out of scope (covered by the deny-list + the
# established main:staging workflow discipline).
targets_main() {
  local cmd="$1"
  local rest="${cmd#*git push}"
  # Only consider the first command segment (avoid false positives from
  # trailing chained commands like `... && echo main`).
  rest="${rest%%;*}"; rest="${rest%%&&*}"; rest="${rest%%||*}"; rest="${rest%%|*}"
  local remote="" tok dst
  local -a refspecs=()
  for tok in $rest; do
    case "$tok" in
      -*) continue ;;            # skip flags (-u, --force, --set-upstream, ...)
    esac
    if [[ -z "$remote" ]]; then
      remote="$tok"              # first positional = remote name
    else
      refspecs+=("$tok")         # remaining positionals = refspecs
    fi
  done
  # No explicit refspec → default push of the current branch to its upstream.
  if [[ ${#refspecs[@]} -eq 0 ]]; then
    local cur; cur="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
    [[ "$cur" == "main" ]] && return 0
    return 1
  fi
  for tok in "${refspecs[@]}"; do
    tok="${tok#+}"               # strip force-update marker
    if [[ "$tok" == *:* ]]; then
      dst="${tok##*:}"           # destination ref after the colon
    else
      dst="$tok"                 # shorthand: src == dst
    fi
    [[ "$dst" == "main" || "$dst" == "refs/heads/main" ]] && return 0
  done
  return 1
}

if targets_main "$command"; then
  {
    echo ""
    echo "─────────────────────────────────────────────────────────"
    echo "PUSH BLOCKED — origin/main is FROZEN"
    echo "─────────────────────────────────────────────────────────"
    echo ""
    echo "  Founder directive: main stays frozen until staging is"
    echo "  reviewed end-to-end and explicitly signed off; THEN"
    echo "  staging is replicated to main."
    echo ""
    echo "  Push to staging instead:"
    echo "     git push origin main:staging"
    echo ""
    echo "  Founder override (post-sign-off main replication):"
    echo "     CLAUDE_PARBAUGHS_FOUNDER_PUSH=1 git push ..."
    echo ""
  } >&2
  exit 2
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
