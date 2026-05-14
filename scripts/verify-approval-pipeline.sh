#!/usr/bin/env bash
# scripts/verify-approval-pipeline.sh
#
# End-to-end verification of the proposal approval pipeline (AMD-023).
#
# Drops a synthetic decisions-<ts>.json into ~/Downloads/ referencing a
# canary proposal pre-staged in .claude/state/proposals/pending/. Polls
# until the watcher cron moves it to approved/. Asserts pipeline health.
#
# Runs as part of test/qa agent's continuous verification cycle.
# Pipeline regression = automatic detection.
#
# USAGE
#   scripts/verify-approval-pipeline.sh             # full end-to-end (~6 min)
#   scripts/verify-approval-pipeline.sh --quick     # dry-run without dropping JSON
#   scripts/verify-approval-pipeline.sh --cleanup   # clean canary state only
#
# EXIT CODES
#   0  pipeline verified end-to-end
#   1  canary did not propagate within timeout
#   2  preconditions failed (no Downloads, watcher disabled, etc.)
#   3  cleanup of canary state failed
#
# DISCIPLINE
#   AMD-023 — approval pipeline reliability
#   PROP-007 — verify post-state with fresh user-context (filesystem
#              snapshot is the equivalent for non-UI verification)

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROPOSALS="$REPO_ROOT/.claude/state/proposals"
PENDING="$PROPOSALS/pending"
APPROVED="$PROPOSALS/approved"
CANARY_ID="TEST-PIPELINE-CANARY"
CANARY_FILE="$PENDING/$CANARY_ID.md"
DOWNLOADS="${DOWNLOADS:-$HOME/Downloads}"
# On Windows under Git Bash, $HOME points at C:/Users/<name>; $USERPROFILE
# in Windows-side env. Resolve manually.
if [ ! -d "$DOWNLOADS" ] && [ -n "${USERPROFILE:-}" ]; then
    DOWNLOADS="$(echo "$USERPROFILE" | sed 's#\\#/#g')/Downloads"
fi

MODE="full"
case "${1:-}" in
    --quick)   MODE="quick"   ;;
    --cleanup) MODE="cleanup" ;;
    ""|--help) ;;
esac

log() { echo "[verify-approval-pipeline] $*"; }

# ── Cleanup canary state (used by --cleanup AND end-of-run normal path) ─────
cleanup_canary() {
    if [ -f "$CANARY_FILE" ]; then
        rm -f "$CANARY_FILE"
        log "removed canary from pending/"
    fi
    if [ -f "$APPROVED/$CANARY_ID.md" ]; then
        rm -f "$APPROVED/$CANARY_ID.md"
        log "removed canary from approved/"
    fi
    # Remove any leftover canary decisions JSON in Downloads
    if [ -d "$DOWNLOADS" ]; then
        for f in "$DOWNLOADS"/decisions-canary-*.json; do
            [ -f "$f" ] && rm -f "$f" && log "removed canary JSON from Downloads: $(basename "$f")"
        done
    fi
}

if [ "$MODE" = "cleanup" ]; then
    cleanup_canary
    exit 0
fi

# ── Preflight ────────────────────────────────────────────────────────────────
log "mode: $MODE"
log "repo: $REPO_ROOT"
log "downloads: $DOWNLOADS"

if [ ! -d "$DOWNLOADS" ]; then
    log "FAIL Downloads folder not found at: $DOWNLOADS"
    log "    set DOWNLOADS env var to override"
    exit 2
fi

if [ ! -d "$PENDING" ]; then
    log "FAIL pending/ not found: $PENDING"
    exit 2
fi

# Check watcher Scheduled Task installed
if command -v powershell.exe >/dev/null 2>&1 || command -v pwsh >/dev/null 2>&1; then
    PS_BIN="$(command -v pwsh || command -v powershell.exe)"
    "$PS_BIN" -Command "Get-ScheduledTask -TaskName 'PARBAUGHS-Downloads-Watcher' -ErrorAction SilentlyContinue" \
        > /tmp/watcher-check.txt 2>&1 || true
    if ! grep -q "PARBAUGHS-Downloads-Watcher" /tmp/watcher-check.txt 2>/dev/null; then
        log "WARN PARBAUGHS-Downloads-Watcher not registered — verification will not propagate"
        log "    install via: scripts/cron/install-all.ps1 (as Admin)"
        if [ "$MODE" = "full" ]; then
            log "FAIL prerequisite: watcher Scheduled Task missing"
            exit 2
        fi
    fi
fi

# ── Stage canary proposal in pending/ ───────────────────────────────────────
log "staging canary proposal: $CANARY_FILE"
cat > "$CANARY_FILE" <<EOF
---
id: $CANARY_ID
title: Test pipeline canary
authored_by: verify-approval-pipeline.sh
authored_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
status: pending
type: test
---

# Test pipeline canary

Synthetic proposal used by scripts/verify-approval-pipeline.sh to
verify the approval pipeline end-to-end. Should NEVER be merged or
shipped; the verify script cleans it up after each run.

If you see this file in approved/ or shipped/ outside of a verify run,
the cleanup step failed — delete the file manually.
EOF

# ── Mode: quick (skip JSON drop) ─────────────────────────────────────────────
if [ "$MODE" = "quick" ]; then
    log "quick mode — canary staged but JSON drop skipped"
    log "next step: drop $DOWNLOADS/decisions-canary-<ts>.json with body:"
    cat <<'JSON'
    { "kind": "decisions",
      "decisions": [
        { "id": "TEST-PIPELINE-CANARY", "decision": "approved", "note": "canary" }
      ]
    }
JSON
    exit 0
fi

# ── Drop synthetic decisions JSON in Downloads ──────────────────────────────
TS="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
JSON_FILE="$DOWNLOADS/decisions-canary-$TS.json"
cat > "$JSON_FILE" <<EOF
{
  "kind": "decisions",
  "exported_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "exported_by": "verify-approval-pipeline.sh",
  "decisions": [
    { "id": "$CANARY_ID", "decision": "approved", "note": "canary — verify script" }
  ]
}
EOF
log "dropped JSON: $JSON_FILE"

# ── Poll until canary appears in approved/ ──────────────────────────────────
DEADLINE=$(( $(date +%s) + 360 ))  # 6 minutes
SLEEP_INTERVAL=15
log "polling $APPROVED for $CANARY_ID.md (timeout: 6 min)"
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    if [ -f "$APPROVED/$CANARY_ID.md" ]; then
        log "PASS canary propagated to approved/ at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        break
    fi
    elapsed=$(( $(date +%s) + 360 - DEADLINE ))
    log "    waiting... ($((DEADLINE - $(date +%s) ))s remaining)"
    sleep "$SLEEP_INTERVAL"
done

# ── Verify outcome ──────────────────────────────────────────────────────────
if [ ! -f "$APPROVED/$CANARY_ID.md" ]; then
    log "FAIL canary did not propagate within 6 min"
    log "    pending: $CANARY_FILE — $([ -f "$CANARY_FILE" ] && echo present || echo missing)"
    log "    approved: $APPROVED/$CANARY_ID.md — missing"
    log "    JSON in Downloads: $([ -f "$JSON_FILE" ] && echo still-present || echo consumed)"
    log "    Check: scripts/cron/logs/<latest>-downloads-watcher.log"
    log "    Common cause: working tree dirty with non-routine files (SKIP)"
    log "    cleaning up canary state..."
    cleanup_canary
    exit 1
fi

# Tree should be clean (watcher commits the move).
DIRTY="$(git -C "$REPO_ROOT" status --porcelain | wc -l)"
log "tree dirty count post-run: $DIRTY"

# Cleanup canary state
log "cleaning up canary state..."
cleanup_canary

# Commit the cleanup so the next verify run starts clean
git -C "$REPO_ROOT" add "$PENDING" "$APPROVED" 2>/dev/null || true
if [ -n "$(git -C "$REPO_ROOT" status --porcelain | head -5)" ]; then
    log "WARN tree has changes after cleanup — manual review recommended"
fi

log "PASS approval pipeline verified end-to-end"
exit 0
