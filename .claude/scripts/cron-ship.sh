#!/bin/bash
# cron-ship.sh — Ship cycle invocation wrapper.
# Per HEADLESS_OPERATION_PROTOCOL § 4.
#
# Activities (in order):
#   1. Pre-cycle setup (5k tokens)
#   2. Ship selection from SHIP_INDEX (5k tokens)
#   3. Pre-flight audit P1 (30k tokens)
#   4. Decision bubbles for ambiguous spec (30k tokens)
#   5. Engineer execution per Vision (100k tokens — main work)
#   6. Post-push retrospective 5-component (20k tokens)
#   7. State persistence + cycle close (10k tokens)
#
# Budget: 200k tokens / 2 hours

set -e

CYCLE_ID="ship-$(date -u +%Y%m%d-%H%M)"
JOURNAL="docs/agents/SESSION_JOURNAL.md"
TOKEN_CAP="${CYCLE_TOKEN_CAP:-200000}"
DURATION_CAP="${CYCLE_DURATION_CAP:-7200}"
START_TIME=$(date -u +%s)

mkdir -p .claude/state/ship-progress

# Cycle start journal entry
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [SHIP-CYCLE-START] cycle_id=$CYCLE_ID. Lock acquired. Pre-flight: pending checks." >> "$JOURNAL"

# Pre-flight: check emergency-halt
if [ -f .claude/state/emergency-halt.json ]; then
    echo "Emergency halt detected. Exiting cycle."
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [EMERGENCY-HALT-DETECTED] cycle_id=$CYCLE_ID. Emergency halt active. Exiting." >> "$JOURNAL"
    exit 0
fi

# Pre-flight: check FIQ for blocking entries
if [ -f .claude/state/founder_input_queue.json ]; then
    BLOCKING_COUNT=$(jq '[.entries[] | select(.blocking == true and .resolved_at == null)] | length' .claude/state/founder_input_queue.json 2>/dev/null || echo "0")
    if [ "$BLOCKING_COUNT" -gt 0 ]; then
        echo "Blocking FIQ entries present ($BLOCKING_COUNT). Cycle exits."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HALT-BLOCKING-FIQ] cycle_id=$CYCLE_ID. ${BLOCKING_COUNT} blocking FIQ entries. Cycle aborted." >> "$JOURNAL"
        exit 0
    fi
fi

# Pre-flight: check repeated failure pattern
if [ -f .claude/state/cycle-history.json ]; then
    LAST_3_SHIP_OUTCOMES=$(jq -r '[.cycles[] | select(.type == "ship")] | sort_by(.started_at) | reverse | .[0:3] | .[].outcome' .claude/state/cycle-history.json 2>/dev/null || echo "")
    FAILURE_COUNT=$(echo "$LAST_3_SHIP_OUTCOMES" | grep -cE "FAILED|CRASH|OVERRUN" || echo "0")
    if [ "$FAILURE_COUNT" -ge 3 ]; then
        echo "3 consecutive ship cycle failures detected. HALT per HALT_CRITERIA item 20."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HALT-CYCLE-REPEATED-FAILURE] cycle_type=ship. 3 consecutive failures. cron-paused.json being written." >> "$JOURNAL"
        cat > .claude/state/cron-paused.json <<EOF
{
  "paused": true,
  "paused_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "paused_by": "Automated (HALT item 20)",
  "reason": "3 consecutive ship cycle failures",
  "auto_resume_at": null
}
EOF
        exit 0
    fi
fi

# ===============================================================================
# CLAUDE CODE INVOCATION SECTION
# ===============================================================================
# The actual ship work happens via Claude Code CLI invocation here.
# Founder configures this section based on their Claude Code setup.
#
# Recommended pattern:
#   claude-code run \
#     --prompt-file .claude/prompts/ship-cycle.md \
#     --token-cap "$TOKEN_CAP" \
#     --working-dir . \
#     --state-dir .claude/state/ \
#     --output-file .claude/state/ship-progress/$CYCLE_ID.json \
#     --halt-on-budget-90 true \
#     --halt-on-emergency-file .claude/state/emergency-halt.json
#
# The prompt file (.claude/prompts/ship-cycle.md) instructs Claude Code to:
#   - Read HEADLESS_OPERATION_PROTOCOL.md § 4 for activity definitions
#   - Read SHIP_INDEX for next eligible ship
#   - Execute activities 1-7 in order with respective token budgets
#   - Apply full P1 + P4 + P10 + P12 + P13 discipline
#   - Generate 5-component post-push retrospective
#   - Respect budget watchdog at 90%/100% thresholds
#   - Emit cycle outcome summary at end
# ===============================================================================

# Placeholder: replace with actual Claude Code invocation per § 7 of CRON_CONFIGURATION.md
echo "Ship cycle invocation pending Claude Code CLI configuration."
echo "Configure .claude/scripts/cron-ship.sh per CRON_CONFIGURATION.md § 7."

# Calculate cycle duration
END_TIME=$(date -u +%s)
DURATION=$((END_TIME - START_TIME))
DURATION_MIN=$((DURATION / 60))

# Update cycle history
mkdir -p .claude/state
if [ ! -f .claude/state/cycle-history.json ]; then
    echo '{"cycles":[]}' > .claude/state/cycle-history.json
fi

TEMP_HISTORY=$(mktemp)
jq --arg cid "$CYCLE_ID" \
   --arg start "$(date -u -d @$START_TIME +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -r $START_TIME +%Y-%m-%dT%H:%M:%SZ)" \
   --arg end "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   --arg dur "$DURATION" \
   '.cycles += [{
       "cycle_id": $cid,
       "type": "ship",
       "started_at": $start,
       "ended_at": $end,
       "duration_seconds": ($dur | tonumber),
       "tokens_consumed": 0,
       "outcome": "PLACEHOLDER",
       "summary": "Ship cycle invocation not yet configured"
   }]' .claude/state/cycle-history.json > "$TEMP_HISTORY"
mv "$TEMP_HISTORY" .claude/state/cycle-history.json

# Cycle end journal entry
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [SHIP-CYCLE-END] cycle_id=$CYCLE_ID. Duration: ${DURATION_MIN}m. Outcome: PLACEHOLDER (Claude Code invocation pending configuration)." >> "$JOURNAL"

echo "Ship cycle complete: $CYCLE_ID (${DURATION_MIN}m)."
