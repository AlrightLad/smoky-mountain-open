#!/bin/bash
# acquire-lock.sh — Acquire cycle lock before cron cycle work begins.
# Per HEADLESS_OPERATION_PROTOCOL § 2.1.
#
# Usage: bash .claude/scripts/acquire-lock.sh <cycle_type>
# Example: bash .claude/scripts/acquire-lock.sh heartbeat

set -e

CYCLE_TYPE="$1"
LOCK_FILE=".claude/state/cycle-lock.json"

# Stale threshold per cycle type (in minutes)
case "$CYCLE_TYPE" in
    heartbeat) MAX_STALE_MINUTES=240 ;;  # 4 hours
    ship)      MAX_STALE_MINUTES=480 ;;  # 8 hours
    proactive) MAX_STALE_MINUTES=360 ;;  # 6 hours
    *)         echo "Unknown cycle type: $CYCLE_TYPE" >&2; exit 1 ;;
esac

mkdir -p .claude/state

if [ -f "$LOCK_FILE" ]; then
    LOCK_AGE=$(jq -r '.started_at' "$LOCK_FILE" 2>/dev/null || echo "")
    if [ -n "$LOCK_AGE" ] && [ "$LOCK_AGE" != "null" ]; then
        # Calculate age in seconds (BSD/macOS vs GNU date compatibility)
        if date -d "$LOCK_AGE" +%s >/dev/null 2>&1; then
            LOCK_TIMESTAMP=$(date -u -d "$LOCK_AGE" +%s)
        else
            LOCK_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$LOCK_AGE" +%s 2>/dev/null || echo "0")
        fi
        NOW_TIMESTAMP=$(date -u +%s)
        AGE_SECONDS=$((NOW_TIMESTAMP - LOCK_TIMESTAMP))
        AGE_MINUTES=$((AGE_SECONDS / 60))

        if [ "$AGE_MINUTES" -lt "$MAX_STALE_MINUTES" ]; then
            echo "Previous cycle still running. Lock age: ${AGE_MINUTES} min. Exiting."
            echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-SKIP] cycle_type=$CYCLE_TYPE. Previous cycle still running (lock age ${AGE_MINUTES}m)." >> docs/agents/SESSION_JOURNAL.md
            exit 1
        fi

        echo "Stale lock detected (age: ${AGE_MINUTES} min > threshold ${MAX_STALE_MINUTES} min). Clearing."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-LOCK-STALE] cycle_type=$CYCLE_TYPE. Previous lock cleared (age ${AGE_MINUTES}m)." >> docs/agents/SESSION_JOURNAL.md
    fi
fi

cat > "$LOCK_FILE" <<EOF
{
  "cycle_type": "$CYCLE_TYPE",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "pid": "$$",
  "github_run_id": "${GITHUB_RUN_ID:-unknown}"
}
EOF

echo "Lock acquired for $CYCLE_TYPE cycle."
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-LOCK-ACQUIRE] cycle_type=$CYCLE_TYPE. github_run_id=${GITHUB_RUN_ID:-unknown}." >> docs/agents/SESSION_JOURNAL.md
