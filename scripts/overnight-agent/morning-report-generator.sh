#!/usr/bin/env bash
# scripts/overnight-agent/morning-report-generator.sh
#
# Aggregates the overnight-agent run outcome (if any) into a markdown
# report for Founder morning review. Designed to run via the existing
# maintenance cron at ~07:00 ET.
#
# Reads
#   .claude/state/overnight-agent/runs/<today>.json     (run record)
#   .claude/state/overnight-agent/runs/<yesterday>.json (if today empty —
#                                                       Tue/Fri runs span
#                                                       into Wed/Sat 7am)
#   .claude/state/overnight-agent/logs/<date>.log       (full log)
#
# Writes
#   .claude/state/overnight-agent/reports/<date>.md     (markdown report)
#
# The report is consumed by the dashboard's Overnight Agent banner (regen
# script reads the latest report file and surfaces outcome).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_DIR="$REPO_ROOT/.claude/state/overnight-agent"
RUN_DIR="$STATE_DIR/runs"
LOG_DIR="$STATE_DIR/logs"
REPORT_DIR="$STATE_DIR/reports"

mkdir -p "$REPORT_DIR"

today="$(date -u +"%Y-%m-%d")"
yesterday="$(date -u -d 'yesterday' +"%Y-%m-%d" 2>/dev/null || python -c "from datetime import datetime,timedelta; print((datetime.utcnow()-timedelta(days=1)).strftime('%Y-%m-%d'))")"

# Determine run record to summarize. Prefer today's; fall back to
# yesterday's if today is empty (a Tue night run finishes early Wed; the
# morning report Wed AM should still cover it).
run_file=""
if [ -f "$RUN_DIR/$today.json" ]; then
    run_file="$RUN_DIR/$today.json"
    run_date="$today"
elif [ -f "$RUN_DIR/$yesterday.json" ]; then
    run_file="$RUN_DIR/$yesterday.json"
    run_date="$yesterday"
fi

report_file="$REPORT_DIR/$today.md"

if [ -z "$run_file" ]; then
    # No overnight run since last morning report. Emit a sparse "idle"
    # report so dashboard banner doesn't go stale.
    cat > "$report_file" <<EOF
# Overnight agent — morning report ($today)

No overnight run recorded for $today or $yesterday.

If you expected a run, check:
- Scheduled task PARBAUGHS-Overnight-Agent — last run time
- $RUN_DIR/ — any *.json file present?
- $LOG_DIR/ — any log emitted?
- Queue — \`ls scripts/overnight-agent/queue-prompt.sh\` shows queued prompts
EOF
    echo "[morning-report] OK idle report: $report_file"
    exit 0
fi

# Parse run record fields. Use python for robust JSON read.
parse_field() {
    local field="$1"
    python -c "import json,sys; d=json.load(open('$run_file')); print(d.get('$field',''))"
}

outcome="$(parse_field outcome)"
exit_code="$(parse_field exit_code)"
budget="$(parse_field budget_dollars)"
started="$(parse_field started_at)"
ended="$(parse_field ended_at)"
prompt_file="$(parse_field prompt_file)"
log_file="$(parse_field log_file)"
notes="$(parse_field notes)"

# Outcome label for header (emoji-free per CLAUDE.md "No emojis" rule).
case "$outcome" in
    success)              label="SUCCESS"               ;;
    wall-clock-cap)       label="WALL-CLOCK CAP"         ;;
    fail-gate-round-trip) label="FAIL GATE (round-trip)" ;;
    claude-error)         label="ERROR (claude exit)"    ;;
    preflight-dirty)      label="REFUSED (tree dirty)"   ;;
    preflight-no-claude)  label="REFUSED (no claude)"    ;;
    preflight-no-prompt)  label="REFUSED (no prompt)"    ;;
    *)                    label="UNKNOWN ($outcome)"     ;;
esac

# Git activity since the run started — what did the agent commit?
# `|| true` rationale (all three below): this is a best-effort REPORT
# generator. Missing log file, no commits in window, or empty tree status
# are all valid empty-state outcomes — they should produce empty strings
# in the report body, not abort report generation. Not exit-swallowing of
# real failures (those would show up as missing report content).
commits_since=""
if [ -n "$started" ]; then
    commits_since="$(git -C "$REPO_ROOT" log --since="$started" --pretty='format:- %h %s' 2>/dev/null || true)"
fi

# Tail of log file for quick scan.
log_tail=""
if [ -n "$log_file" ] && [ -f "$log_file" ]; then
    log_tail="$(tail -n 30 "$log_file" 2>/dev/null || true)"
fi

# Working tree status — should be clean post-run (wrapper guarantees).
tree_status="$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null | head -20 || true)"
tree_label="clean"
if [ -n "$tree_status" ]; then
    tree_label="DIRTY (review needed)"
fi

# Local ahead count — what should Founder review + push?
ahead=""
if git -C "$REPO_ROOT" rev-parse @{u} >/dev/null 2>&1; then
    ahead="$(git -C "$REPO_ROOT" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
fi

cat > "$report_file" <<EOF
# Overnight agent — morning report ($today)

**Run date:** $run_date
**Outcome:** $label
**Exit code:** $exit_code
**Budget:** \$$budget
**Started:** $started
**Ended:**   $ended
**Prompt:**  \`$(basename "$prompt_file" 2>/dev/null)\`
**Notes:**   $notes

## Working tree

$tree_label

EOF

if [ -n "$tree_status" ]; then
    {
        echo '```'
        echo "$tree_status"
        echo '```'
        echo
    } >> "$report_file"
fi

cat >> "$report_file" <<EOF
## Commits since run started

EOF
if [ -n "$commits_since" ]; then
    echo "$commits_since" >> "$report_file"
else
    echo "(no new commits)" >> "$report_file"
fi
echo "" >> "$report_file"

cat >> "$report_file" <<EOF
## Local ahead of remote

EOF
if [ -n "$ahead" ] && [ "$ahead" != "0" ]; then
    echo "**$ahead commit(s)** ahead of \`@{u}\`. Founder review + push per AMD-018 11-gate." >> "$report_file"
else
    echo "(in sync with remote — nothing to push)" >> "$report_file"
fi
echo "" >> "$report_file"

if [ -n "$log_tail" ]; then
    {
        echo "## Log tail (last 30 lines)"
        echo
        echo '```'
        echo "$log_tail"
        echo '```'
        echo
    } >> "$report_file"
fi

cat >> "$report_file" <<EOF
## Founder action items

1. Read the prompt that ran (\`$prompt_file\`)
2. Skim commits + diffs above
3. Run \`tests/round-trip-test.py\` manually to re-verify
4. Open the live app or relevant dashboard via Playwright user-context capture (PROP-007)
5. If green: \`git push origin main\` per AMD-018
6. If red: investigate before next overnight slot; consider amending or reverting

---

Generated by \`scripts/overnight-agent/morning-report-generator.sh\` at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

echo "[morning-report] OK report: $report_file"
exit 0
