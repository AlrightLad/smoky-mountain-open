#!/usr/bin/env bash
# scripts/overnight-agent/queue-prompt.sh
#
# Drop a prompt file into the overnight-agent queue, validating it has
# bounded scope + clear stop conditions before accepting.
#
# Founder direction 2026-05-14: queue helper rejects free-form prompts.
# Every overnight prompt must include the required structure blocks so
# the wrapper's safety preamble can rely on them existing.
#
# USAGE
#   scripts/overnight-agent/queue-prompt.sh <prompt-file>
#
#   <prompt-file> is a regular text file. Validator checks for:
#     - "## SCOPE" section
#     - "## STOP CONDITIONS" section (with at least one bullet)
#     - "## TOKEN BUDGET" section
#     - "## ALLOWED SURFACES" section (paths the run may edit)
#     - "## DELIVERABLE" section
#
# Accepted prompts are copied to:
#   .claude/state/overnight-agent/prompts/queue/<YYYY-MM-DDTHHMMSSZ>-<basename>.txt
#
# Wrapper pops the oldest by mtime on next overnight run.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
QUEUE_DIR="$REPO_ROOT/.claude/state/overnight-agent/prompts/queue"
EXAMPLE_FILE="$REPO_ROOT/.claude/state/overnight-agent/prompts/example-prompt.txt"

mkdir -p "$QUEUE_DIR"

# ── Args ─────────────────────────────────────────────────────────────────────
if [ $# -lt 1 ]; then
    echo "USAGE: $0 <prompt-file>"
    echo ""
    echo "Prompt files must include these sections:"
    echo "  ## SCOPE"
    echo "  ## STOP CONDITIONS"
    echo "  ## TOKEN BUDGET"
    echo "  ## ALLOWED SURFACES"
    echo "  ## DELIVERABLE"
    echo ""
    if [ -f "$EXAMPLE_FILE" ]; then
        echo "Example: $EXAMPLE_FILE"
    fi
    exit 1
fi

PROMPT_FILE="$1"
if [ ! -f "$PROMPT_FILE" ]; then
    echo "FAIL prompt file not found: $PROMPT_FILE"
    exit 2
fi

# ── Validation ──────────────────────────────────────────────────────────────
errs=0
require_section() {
    local section="$1"
    if ! grep -qE "^${section}( |$)" "$PROMPT_FILE"; then
        echo "FAIL missing section: $section"
        errs=$((errs+1))
    fi
}

require_section "## SCOPE"
require_section "## STOP CONDITIONS"
require_section "## TOKEN BUDGET"
require_section "## ALLOWED SURFACES"
require_section "## DELIVERABLE"

# Sanity-check STOP CONDITIONS has at least one bullet item.
if grep -qE "^## STOP CONDITIONS" "$PROMPT_FILE"; then
    stop_block_bullets="$(awk '/^## STOP CONDITIONS/{flag=1; next} /^## /{flag=0} flag' "$PROMPT_FILE" | grep -cE '^[[:space:]]*[-*]')"
    if [ "$stop_block_bullets" -lt 1 ]; then
        echo "FAIL ## STOP CONDITIONS section has no bullet items."
        errs=$((errs+1))
    fi
fi

# Token budget should match \$N format (whole dollars).
if grep -qE "^## TOKEN BUDGET" "$PROMPT_FILE"; then
    if ! awk '/^## TOKEN BUDGET/{flag=1; next} /^## /{flag=0} flag' "$PROMPT_FILE" | grep -qE '\$[0-9]+'; then
        echo "WARN ## TOKEN BUDGET section: no \$N dollar amount detected."
    fi
fi

# Refuse if any AMD-018 exception-list operation hinted in the prompt.
if grep -qE 'firebase deploy --only functions' "$PROMPT_FILE"; then
    echo "FAIL prompt mentions Cloud Function deploy — AMD-018 exception list. Refused."
    errs=$((errs+1))
fi
if grep -qE 'firestore\.rules' "$PROMPT_FILE"; then
    echo "FAIL prompt mentions firestore.rules — AMD-018 exception list. Refused."
    errs=$((errs+1))
fi
if grep -qE 'git push' "$PROMPT_FILE"; then
    echo "FAIL prompt mentions git push — overnight agent never pushes. Refused."
    errs=$((errs+1))
fi

if [ "$errs" -gt 0 ]; then
    echo ""
    echo "FAIL $errs validation error(s); prompt NOT queued."
    exit 3
fi

# ── Queue ────────────────────────────────────────────────────────────────────
TS="$(date -u +"%Y-%m-%dT%H%M%SZ")"
BASENAME="$(basename "$PROMPT_FILE" .txt)"
QUEUED_NAME="$QUEUE_DIR/$TS-$BASENAME.txt"
cp "$PROMPT_FILE" "$QUEUED_NAME"

echo "OK queued: $QUEUED_NAME"
echo "    will run on next overnight slot (Tue/Fri 11pm ET when installed)."
queue_count="$(find "$QUEUE_DIR" -maxdepth 1 -name '*.txt' ! -name '*.processed-*' 2>/dev/null | wc -l)"
echo "    queue depth: $queue_count"
exit 0
