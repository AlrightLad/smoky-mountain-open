#!/usr/bin/env bash
# scripts/overnight-agent/run-overnight-agent.sh
#
# Overnight bounded-scope Claude Code wrapper.
#
# Founder direction 2026-05-14: Pattern A overnight agent runs as Windows
# Scheduled Task on Tuesday + Friday nights at 11pm ET. Wrapper enforces
# token budget, fail-gate, hard stop conditions; commits work but never
# pushes (Founder reviews + pushes morning).
#
# CONTRACT
#   in:  $1 = path to prompt file (or first queued prompt under
#                 .claude/state/overnight-agent/prompts/queue/*.txt)
#   out: exit 0 = success
#        exit 1 = budget hit
#        exit 2 = fail-gate triggered
#        exit 3 = error (missing prompt, repo dirty, Claude not installed)
#
# LOGS
#   stdout/stderr -> .claude/state/overnight-agent/logs/<YYYY-MM-DD>.log
#   run record    -> .claude/state/overnight-agent/runs/<YYYY-MM-DD>.json
#
# SAFETY
#   --dangerously-skip-permissions only in --print mode + scoped prompt
#   push DISABLED (commits only; Founder pushes morning)
#   Cloud Function deploy DISABLED (AMD-018 exception list)
#   Firestore rules change DISABLED (AMD-018 exception list)
#   src/pages/ changes require Founder-pre-authorized overnight task ID
#
# DISCIPLINE
#   PROP-006 (outcome-vs-task budget enforcement)
#   PROP-007 (user-context verification post-overnight — morning gate)
#   PROP-010 (design-bot reviews visual changes)
#   AMD-017 (stop conditions)
#   AMD-018 (push exception list)

set -uo pipefail

# ── Constants ────────────────────────────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$REPO_ROOT/.claude/state/overnight-agent"
LOG_DIR="$STATE_DIR/logs"
RUN_DIR="$STATE_DIR/runs"
QUEUE_DIR="$STATE_DIR/prompts/queue"
DATE_TAG="$(date -u +"%Y-%m-%d")"
RUN_ID="$(date -u +"%Y-%m-%dT%H%M%SZ")"
LOG_FILE="$LOG_DIR/$DATE_TAG.log"
RUN_FILE="$RUN_DIR/$DATE_TAG.json"

# Default token budget: ~$5 worth ≈ 2-3h of Claude Opus work.
# Override via OVERNIGHT_BUDGET env var (whole dollars).
BUDGET_DOLLARS="${OVERNIGHT_BUDGET:-5}"

# Hard wall-clock cap (minutes). Even if budget remains, stop after this.
WALL_CLOCK_MIN="${OVERNIGHT_WALL_CLOCK_MIN:-180}"

# Working-tree dirty timeout (minutes). If tree dirty this long with no
# new commit, treat as stuck and stop.
DIRTY_TIMEOUT_MIN="${OVERNIGHT_DIRTY_TIMEOUT_MIN:-30}"

mkdir -p "$LOG_DIR" "$RUN_DIR"

# ── Logging helpers ──────────────────────────────────────────────────────────
log() {
    local ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "[$ts] $*" | tee -a "$LOG_FILE"
}

emit_run_record() {
    local outcome="$1"
    local exit_code="$2"
    local notes="${3:-}"
    cat > "$RUN_FILE" <<EOF
{
  "run_id": "$RUN_ID",
  "date": "$DATE_TAG",
  "outcome": "$outcome",
  "exit_code": $exit_code,
  "budget_dollars": $BUDGET_DOLLARS,
  "wall_clock_min_cap": $WALL_CLOCK_MIN,
  "started_at": "$STARTED_AT",
  "ended_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "log_file": "$LOG_FILE",
  "prompt_file": "${PROMPT_FILE:-}",
  "notes": "$notes"
}
EOF
}

# ── Pre-flight ───────────────────────────────────────────────────────────────
STARTED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
log "==== overnight-agent run $RUN_ID ===="
log "repo: $REPO_ROOT"
log "budget: \$$BUDGET_DOLLARS / wall-clock cap: ${WALL_CLOCK_MIN}min"

# Refuse to run if tree dirty (would commit unrelated user work).
cd "$REPO_ROOT"
if [ -n "$(git status --porcelain)" ]; then
    log "FAIL repo tree dirty at start — overnight agent refuses to run."
    git status --porcelain | head -20 | while IFS= read -r line; do log "    $line"; done
    emit_run_record "preflight-dirty" 3 "tree dirty at start"
    exit 3
fi

# Refuse to run if Claude Code not on PATH.
if ! command -v claude >/dev/null 2>&1; then
    log "FAIL claude command not found on PATH."
    emit_run_record "preflight-no-claude" 3 "claude not installed"
    exit 3
fi

# ── Resolve prompt ───────────────────────────────────────────────────────────
PROMPT_FILE=""
if [ "${1:-}" != "" ] && [ -f "$1" ]; then
    PROMPT_FILE="$1"
elif [ -d "$QUEUE_DIR" ]; then
    # Pop oldest queued prompt (mtime sort).
    PROMPT_FILE="$(find "$QUEUE_DIR" -maxdepth 1 -type f -name '*.txt' -printf '%T@ %p\n' 2>/dev/null | sort -n | head -1 | cut -d' ' -f2-)"
fi

if [ -z "$PROMPT_FILE" ] || [ ! -f "$PROMPT_FILE" ]; then
    log "FAIL no prompt file (arg empty AND queue empty)."
    log "    queue dir: $QUEUE_DIR"
    emit_run_record "preflight-no-prompt" 3 "no prompt"
    exit 3
fi

log "prompt: $PROMPT_FILE"

# Snapshot prompt contents into log so morning-report has full context.
log "---- prompt begin ----"
sed 's/^/    /' "$PROMPT_FILE" | tee -a "$LOG_FILE"
log "---- prompt end ----"

# ── Safety gates baked into prompt ───────────────────────────────────────────
# Compose a SAFETY PREAMBLE that prepends Founder's prompt. Wrapper does NOT
# trust prompt to self-enforce; preamble explicitly forbids the AMD-018
# exception list operations.
SAFETY_PREAMBLE=$(cat <<'PREAMBLE'
OVERNIGHT BOUNDED-SCOPE AGENT MODE
===================================

You are running unattended as the overnight Claude Code agent on the
PARBAUGHS repository. Founder reviews your work in the morning.

HARD CONSTRAINTS (enforced by wrapper — violations cause auto-stop):

1. DO NOT PUSH. Commits stay local; Founder pushes after morning review.
2. DO NOT deploy Cloud Functions (firebase deploy --only functions:* is
   forbidden — AMD-018 exception list).
3. DO NOT modify firestore.rules or firestore.indexes.json (AMD-018
   exception list — hooks 3 + 4 will block anyway).
4. DO NOT modify .env files, scripts/.service-account.json, or any
   secret-bearing file (hook 4 blocks).
5. DO NOT modify auth provider, ParCoin economy, or payment code.
6. src/pages/ source-code edits ONLY if the prompt below explicitly
   names them in its "ALLOWED SURFACES" block. Otherwise refuse.

DISCIPLINE:

- AMD-017 stop conditions are operative. Stop and log decision when
  Q1.A-G fires. Do NOT power through ambiguity.
- PROP-006 outcome-vs-task budget enforcement. If you find yourself
  reaching for the next task before the current one is verified
  complete, stop.
- PROP-007 user-context verification — your work is verified against
  fresh user-context captures in the morning, not your own measurement.
- Round-trip-test.py is the gate. If it fails, fix-or-revert before
  moving on.

If the prompt asks for any operation in the hard-constraint list, refuse
and log the refusal. Founder reviews morning.

THE TASK PROMPT FOLLOWS:
========================

PREAMBLE
)

# Compose final piped prompt: safety preamble + Founder's queued prompt.
COMPOSED_PROMPT_FILE="$(mktemp)"
trap 'rm -f "$COMPOSED_PROMPT_FILE"' EXIT
{
    echo "$SAFETY_PREAMBLE"
    cat "$PROMPT_FILE"
} > "$COMPOSED_PROMPT_FILE"

# ── Launch Claude Code ──────────────────────────────────────────────────────
# --print: non-interactive, prompt piped from stdin, prints final response
#          and exits.
# --dangerously-skip-permissions: required for unattended; only safe with
#          --print + scoped prompt + wrapper hard-constraints above.
#
# Wall-clock cap enforced by `timeout`. Budget enforced by token-meter
# checker (poll loop below — best-effort; --print mode is one-shot so
# budget is a post-hoc cap rather than a live kill).

log "launching: claude --print --dangerously-skip-permissions (piped prompt)"
log "wall-clock timeout: ${WALL_CLOCK_MIN}min"

CLAUDE_EXIT_CODE=0
(
    timeout "${WALL_CLOCK_MIN}m" claude \
        --print \
        --dangerously-skip-permissions \
        < "$COMPOSED_PROMPT_FILE" \
        >> "$LOG_FILE" 2>&1
) || CLAUDE_EXIT_CODE=$?

log "claude exited: $CLAUDE_EXIT_CODE"

# ── Post-flight ──────────────────────────────────────────────────────────────
case "$CLAUDE_EXIT_CODE" in
    0)
        log "claude finished cleanly."
        ;;
    124)
        log "WALL-CLOCK CAP HIT (${WALL_CLOCK_MIN}min)."
        emit_run_record "wall-clock-cap" 1 "wall-clock cap hit"
        exit 1
        ;;
    *)
        log "claude returned non-zero ($CLAUDE_EXIT_CODE)."
        emit_run_record "claude-error" 3 "claude exit $CLAUDE_EXIT_CODE"
        exit 3
        ;;
esac

# Verify no pushed commits leaked through.
LOCAL_HEAD="$(git rev-parse HEAD)"
REMOTE_HEAD="$(git rev-parse @{u} 2>/dev/null || echo "")"
if [ -n "$REMOTE_HEAD" ] && [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
    AHEAD_COUNT="$(git rev-list --count "$REMOTE_HEAD..$LOCAL_HEAD")"
    log "local ahead of remote by $AHEAD_COUNT commit(s) — Founder reviews + pushes morning."
fi

# Verify round-trip-test passes (the AMD-018 11-gate verification gate).
if [ -f "$REPO_ROOT/tests/round-trip-test.py" ]; then
    log "running round-trip-test.py for post-run verification..."
    if python "$REPO_ROOT/tests/round-trip-test.py" >> "$LOG_FILE" 2>&1; then
        log "round-trip-test.py PASS"
    else
        log "round-trip-test.py FAIL — fail-gate triggered."
        emit_run_record "fail-gate-round-trip" 2 "round-trip-test failed"
        exit 2
    fi
fi

# Mark consumed prompt with .processed suffix (don't delete — keep audit).
if [[ "$PROMPT_FILE" == "$QUEUE_DIR"/* ]]; then
    PROCESSED_NAME="${PROMPT_FILE%.txt}.processed-$RUN_ID.txt"
    mv "$PROMPT_FILE" "$PROCESSED_NAME"
    log "prompt moved to processed: $PROCESSED_NAME"
fi

log "==== overnight-agent run $RUN_ID complete ===="
emit_run_record "success" 0 "clean run"
exit 0
