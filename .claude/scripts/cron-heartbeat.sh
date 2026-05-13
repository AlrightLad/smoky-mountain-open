#!/bin/bash
# cron-heartbeat.sh — Heartbeat cycle invocation wrapper.
# Per HEADLESS_OPERATION_PROTOCOL § 3.
#
# Activities (in order):
#   1. Bug Triage Listener scan (10k tokens)
#   2. Critic spot-check (10k tokens)
#   3. Performance Agent synthetic benchmark (8k tokens)
#   4. Wellness observance audit (5k tokens)
#   5. FIQ queue health check (2k tokens)
#   6. Session journal completeness audit (5k tokens)
#
# Budget: 40k tokens / 30 min

set -e

CYCLE_ID="heartbeat-$(date -u +%Y%m%d-%H%M)"
HEARTBEAT_LOG=".claude/state/heartbeat/$(date -u +%Y-%m-%d).log"
JOURNAL="docs/agents/SESSION_JOURNAL.md"
TOKEN_CAP="${CYCLE_TOKEN_CAP:-40000}"
DURATION_CAP="${CYCLE_DURATION_CAP:-1800}"
START_TIME=$(date -u +%s)

mkdir -p .claude/state/heartbeat

# Cycle start journal entry
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HEARTBEAT-CYCLE-START] cycle_id=$CYCLE_ID. Lock acquired. Pre-flight: pending checks." >> "$JOURNAL"

# Initialize heartbeat log entry
cat >> "$HEARTBEAT_LOG" <<EOF

## Heartbeat — $(date -u +%Y-%m-%dT%H:%M:%SZ)

**Cycle ID:** $CYCLE_ID
**Token cap:** $TOKEN_CAP
**Duration cap:** ${DURATION_CAP}s
**Started:** $(date -u +%Y-%m-%dT%H:%M:%SZ)

EOF

# Pre-flight: check emergency-halt
if [ -f .claude/state/emergency-halt.json ]; then
    echo "Emergency halt detected. Exiting cycle."
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [EMERGENCY-HALT-DETECTED] cycle_id=$CYCLE_ID. Emergency halt active. Exiting." >> "$JOURNAL"
    echo "**OUTCOME:** EMERGENCY HALT" >> "$HEARTBEAT_LOG"
    exit 0
fi

# Pre-flight: check FIQ for blocking entries
if [ -f .claude/state/founder_input_queue.json ]; then
    BLOCKING_COUNT=$(jq '[.entries[] | select(.blocking == true and .resolved_at == null)] | length' .claude/state/founder_input_queue.json 2>/dev/null || echo "0")
    if [ "$BLOCKING_COUNT" -gt 0 ]; then
        echo "Blocking FIQ entries present ($BLOCKING_COUNT). Cycle exits."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HALT-BLOCKING-FIQ] cycle_id=$CYCLE_ID. ${BLOCKING_COUNT} blocking FIQ entries. Cycle aborted." >> "$JOURNAL"
        echo "**OUTCOME:** BLOCKED ($BLOCKING_COUNT FIQ entries)" >> "$HEARTBEAT_LOG"
        exit 0
    fi
fi

# ===============================================================================
# CLAUDE CODE INVOCATION SECTION
# ===============================================================================
# The actual heartbeat work happens via Claude Code CLI invocation here.
# Founder configures this section based on their Claude Code setup.
#
# Recommended pattern:
#   claude-code run \
#     --prompt-file .claude/prompts/heartbeat-cycle.md \
#     --token-cap "$TOKEN_CAP" \
#     --working-dir . \
#     --state-dir .claude/state/ \
#     --output-file .claude/state/heartbeat/$(date -u +%Y-%m-%d-%H%M).json \
#     --halt-on-budget-90 true \
#     --halt-on-emergency-file .claude/state/emergency-halt.json
#
# The prompt file (.claude/prompts/heartbeat-cycle.md) instructs Claude Code to:
#   - Read HEADLESS_OPERATION_PROTOCOL.md § 3 for activity definitions
#   - Execute activities 1-6 in order with respective token budgets
#   - Write activity outputs to heartbeat log + state files
#   - Respect budget watchdog at 90%/100% thresholds
#   - Emit cycle outcome summary at end
# ===============================================================================

# Placeholder: replace with actual Claude Code invocation per § 7 of CRON_CONFIGURATION.md
echo "**NOTE:** Heartbeat cycle invocation pending Claude Code CLI configuration." >> "$HEARTBEAT_LOG"
echo "Configure .claude/scripts/cron-heartbeat.sh per CRON_CONFIGURATION.md § 7." >> "$HEARTBEAT_LOG"

# Calculate cycle duration
END_TIME=$(date -u +%s)
DURATION=$((END_TIME - START_TIME))
DURATION_MIN=$((DURATION / 60))

# Cycle end summary
cat >> "$HEARTBEAT_LOG" <<EOF

**Ended:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Duration:** ${DURATION_MIN}m (${DURATION}s)
**Outcome:** PLACEHOLDER (Claude Code invocation not yet configured)

---
EOF

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
       "type": "heartbeat",
       "started_at": $start,
       "ended_at": $end,
       "duration_seconds": ($dur | tonumber),
       "tokens_consumed": 0,
       "outcome": "PLACEHOLDER",
       "summary": "Heartbeat cycle invocation not yet configured"
   }]' .claude/state/cycle-history.json > "$TEMP_HISTORY"
mv "$TEMP_HISTORY" .claude/state/cycle-history.json

# Cycle end journal entry
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [HEARTBEAT-CYCLE-END] cycle_id=$CYCLE_ID. Duration: ${DURATION_MIN}m. Outcome: PLACEHOLDER (Claude Code invocation pending configuration)." >> "$JOURNAL"

echo "Heartbeat cycle complete: $CYCLE_ID (${DURATION_MIN}m)."
