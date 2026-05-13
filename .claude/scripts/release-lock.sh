#!/bin/bash
# release-lock.sh — Release cycle lock at end of cron cycle.
# Per HEADLESS_OPERATION_PROTOCOL § 2.1.
#
# Usage: bash .claude/scripts/release-lock.sh <cycle_type>
# Example: bash .claude/scripts/release-lock.sh heartbeat

set -e

CYCLE_TYPE="$1"
LOCK_FILE=".claude/state/cycle-lock.json"

if [ -f "$LOCK_FILE" ]; then
    EXISTING_TYPE=$(jq -r '.cycle_type' "$LOCK_FILE" 2>/dev/null || echo "")
    if [ "$EXISTING_TYPE" = "$CYCLE_TYPE" ]; then
        rm "$LOCK_FILE"
        echo "Lock released for $CYCLE_TYPE cycle."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-LOCK-RELEASE] cycle_type=$CYCLE_TYPE. github_run_id=${GITHUB_RUN_ID:-unknown}." >> docs/agents/SESSION_JOURNAL.md
    else
        echo "Lock owned by different cycle ($EXISTING_TYPE != $CYCLE_TYPE). Not releasing."
        echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-LOCK-MISMATCH] expected=$CYCLE_TYPE found=$EXISTING_TYPE. Lock not released." >> docs/agents/SESSION_JOURNAL.md
    fi
else
    echo "No lock file found. Nothing to release."
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [CYCLE-LOCK-MISSING] cycle_type=$CYCLE_TYPE. No lock file present at release time." >> docs/agents/SESSION_JOURNAL.md
fi
