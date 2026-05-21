#!/usr/bin/env bash
# Run the full dashboard regen pipeline.
# Mirror of scripts/regen-all.ps1 for bash users.
set -e

# Locate python (USER / USERPROFILE / LOCALAPPDATA may be unset under set -u; we don't use it)
USER_NAME="${USER:-${USERNAME:-}}"
LOCALAPPDATA_PATH="${LOCALAPPDATA:-}"
PYTHON=""
for c in \
    "/c/Users/${USER_NAME}/AppData/Local/Programs/Python/Python312/python.exe" \
    "/c/Users/${USER_NAME}/AppData/Local/Programs/Python/Python311/python.exe" \
    "${LOCALAPPDATA_PATH}/Programs/Python/Python312/python.exe" \
    "/usr/bin/python3" \
    "/usr/local/bin/python3"; do
    if [ -n "$c" ] && [ -x "$c" ]; then PYTHON="$c"; break; fi
done
if [ -z "$PYTHON" ]; then
    # `|| true` rationale: this is a python-discovery fallthrough, not exit-
    # swallowing. command -v returns non-zero when the binary isn't found;
    # we test for an empty result on the next line and exit FATAL there.
    PYTHON="$(command -v python3 || command -v python || true)"
fi
if [ -z "$PYTHON" ]; then
    echo "[regen-all] FATAL: no python found on PATH or in known locations" >&2
    exit 2
fi

export PYTHONIOENCODING=utf-8
export PYTHONUTF8=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[regen-all] START $START_TS   python=$PYTHON"

# R1+R2 (2026-05-15): bootstrap docs/reports/ from tracked templates before
# any regen step touches them. scaffold-from-templates.sh is idempotent —
# it skips files that already exist, so this is a no-op on normal runs and
# self-heals when scaffolds vanish (the failure mode that produced the
# 2026-05-15 dashboard outage). Failure here halts the pipeline via set -e.
echo "[regen-all] $(date -u +%H:%M:%S)   scaffold-from-templates ..."
bash "$SCRIPT_DIR/scaffold-from-templates.sh"

STEPS=(
    "scan-shipped-proposals|scripts/scan-shipped-proposals.py"
    "aggregate-telemetry|scripts/aggregate-telemetry.py"
    "aggregate-token-usage|scripts/aggregate-token-usage.py"
    "aggregate-test-health|scripts/aggregate-test-health.py"
    "aggregate-security-health|scripts/aggregate-security-health.py"
    "aggregate-approvals-pipeline|scripts/aggregate-approvals-pipeline.py"
    "aggregate-architecture-review|scripts/aggregate-architecture-review.py"
    "aggregate-fiq-status|scripts/aggregate-fiq-status.py"
    "inject-health-banners|scripts/inject-health-banners.py"
    "regen-proposals|scripts/regen-proposals.py"
    "regen-amendments|scripts/regen-amendments.py"
    "regen-escalations|scripts/regen-escalations.py"
    "regen-dashboard|scripts/regen-dashboard.py"
    "regen-ops-views|scripts/dry-run-regen-ops-views.py"
    "regen-main-flows|scripts/regen-main-flows.py"
    "regen-token-usage|scripts/regen-token-usage.py"
    "aggregate-app-health|scripts/aggregate-app-health.py"
    "regen-app-health|scripts/regen-app-health.py"
    "regen-sessions|scripts/regen-sessions.py"
    "regen-founder-checklist|scripts/regen-founder-checklist.py"
    "regen-index|scripts/regen-index.py"
)

FAILED=()
for step in "${STEPS[@]}"; do
    NAME="${step%%|*}"
    SCRIPT="${step##*|}"
    STEP_TS="$(date -u +%H:%M:%S)"
    printf "[regen-all] %s   %s ..." "$STEP_TS" "$NAME"
    OUT="$("$PYTHON" "$SCRIPT" 2>&1)"
    RC=$?
    echo ""
    echo "$OUT" | sed 's/^/    /'
    if [ "$RC" -ne 0 ]; then
        FAILED+=("$NAME")
        echo "[regen-all] $NAME FAILED (exit $RC)" >&2
    else
        echo "[regen-all] $NAME OK"
    fi
done

END_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
if [ ${#FAILED[@]} -ne 0 ]; then
    echo ""
    echo "PARTIAL FAILURE at $END_TS — failed steps: ${FAILED[*]}"
    exit 1
fi

# Sanity-gate: run round-trip-test before declaring success.
#
# NOTE on rollback (2026-05-15 PHASE H + I refactor): the prior version
# rolled back HTML files via `git checkout HEAD --` on round-trip-test
# failure. Since the dashboards are now gitignored per Founder local-only
# directive, `git checkout` is a no-op for them — the rollback never
# actually rolled anything back, it just emitted "could not roll back"
# warnings. Removed in favor of:
#   1. Always write the heartbeat (so we know regen completed)
#   2. Let test-health.json reflect the test outcome (status='yellow' for
#      known-failure gates like user-context-gate; status='red' for true
#      regressions)
#   3. Return exit 2 on test fail so CI / human flows see the gate
echo ""
echo "[regen-all] running round-trip sanity test..."
# Disable set -e so the command-substitution's non-zero exit doesn't bail
# before we reach the if/else gate logic below. Re-enable immediately
# after capturing TEST_RC.
set +e
TEST_OUT="$("$PYTHON" tests/round-trip-test.py 2>&1)"
TEST_RC=$?
set -e

# Always write heartbeat — successful regen of dashboards is the load-bearing
# event for test-health freshness. Round-trip-test FAILURES are signaled by
# the heartbeat's status field ("PASS" | "GATE-FAIL") so test-health can
# differentiate "regen working" from "regen + tests both green."
if [ "$TEST_RC" -eq 0 ]; then
    "$PYTHON" scripts/write-regen-heartbeat.py
    echo "[regen-all] round-trip test PASS"
else
    HEARTBEAT_STATUS="GATE-FAIL" "$PYTHON" scripts/write-regen-heartbeat.py
    echo "[regen-all] ROUND-TRIP TEST FAILED (exit $TEST_RC) — heartbeat written with status=GATE-FAIL."
    echo "$TEST_OUT" | tail -20 | sed 's/^/    /'
    echo ""
    echo "[regen-all] test-health.json will reflect the gate failure on next aggregate refresh"
    exit 2
fi

# Ship-close-commit trigger (AMD-011 Step 2 — dispatch scanner inline at
# ship boundaries). Detects ship-close patterns in HEAD commit message:
#   - "W<N>.<S> ship close" / "ship complete"  (Wave-N ship-N pattern)
#   - "Shipped PROP-NNN[.suffix]:"             (proposal ship pattern)
#   - "ship close:" / "ship complete:"          (generic ship-close)
# When matched: invokes scan-proposal-readiness.py + emits
# ship.close.scanner-dispatched telemetry event. Does NOT auto-execute
# ready proposals — dispatch != execute (separate ship plans the launcher).
# Match against SUBJECT ONLY (--pretty=%s) — using %B (full message)
# previously matched body text from prior commit messages that quoted
# the trigger output, causing recursive false-positives. Subject-only
# is the contract per AMD-011 ship-close convention.
HEAD_MSG=$(git log -1 --pretty=%s 2>/dev/null || echo "")
SHIP_CLOSE_RE='(W[0-9]+\.[SIMm][0-9a-z]+ ship (close|complete)|Shipped PROP-[0-9]+(\.[a-z])?|[Ss]hip (close|complete):)'
if echo "$HEAD_MSG" | grep -qE "$SHIP_CLOSE_RE"; then
    SHIP_HEAD_LINE="$HEAD_MSG"
    echo ""
    echo "[regen-all] SHIP-CLOSE DETECTED: $SHIP_HEAD_LINE"
    echo "[regen-all] dispatching proposal-readiness scanner..."
    SCANNER_OUT="$("$PYTHON" .claude/scripts/scan-proposal-readiness.py 2>&1)"
    SCANNER_RC=$?
    echo "$SCANNER_OUT" | sed 's/^/    [scan] /'
    READY_LINE=$(echo "$SCANNER_OUT" | grep -E "summary:" | head -1)
    READY_COUNT=$(echo "$READY_LINE" | grep -oE "[0-9]+ ready" | grep -oE "[0-9]+" || echo 0)
    DEFERRED_COUNT=$(echo "$READY_LINE" | grep -oE "[0-9]+ deferred" | grep -oE "[0-9]+" || echo 0)
    echo "[regen-all] ship-close scanner: ready=$READY_COUNT deferred=$DEFERRED_COUNT exit=$SCANNER_RC"
    # Emit telemetry event so the proposal-readiness lineage is observable
    NOW_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    TODAY=$(date -u +%Y-%m-%d)
    EVENT_DIR=".claude/state/telemetry/events"
    mkdir -p "$EVENT_DIR"
    EVENT_FILE="$EVENT_DIR/$TODAY.ndjson"
    SHIP_HEAD_ESC=$(echo "$SHIP_HEAD_LINE" | sed 's/"/\\"/g')
    printf '{"event_type":"ship.close.scanner-dispatched","timestamp":"%s","data":{"head_commit_subject":"%s","ready_count":%s,"deferred_count":%s,"scanner_exit":%s}}\n' \
        "$NOW_UTC" "$SHIP_HEAD_ESC" "$READY_COUNT" "$DEFERRED_COUNT" "$SCANNER_RC" \
        >> "$EVENT_FILE"
fi

echo ""
echo "ALL DASHBOARDS REGENERATED at $END_TS"
exit 0
