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

STEPS=(
    "scan-shipped-proposals|scripts/scan-shipped-proposals.py"
    "aggregate-telemetry|scripts/aggregate-telemetry.py"
    "regen-proposals|scripts/regen-proposals.py"
    "regen-dashboard|scripts/regen-dashboard.py"
    "regen-ops-views|scripts/dry-run-regen-ops-views.py"
    "regen-main-flows|scripts/regen-main-flows.py"
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

# Sanity-gate: run round-trip-test before declaring success. If the test fails,
# the regenerated dashboards are inconsistent with state — roll back via git
# checkout so Founder never sees a divergent dashboard.
echo ""
echo "[regen-all] running round-trip sanity test..."
TEST_OUT="$("$PYTHON" tests/round-trip-test.py 2>&1)"
TEST_RC=$?
if [ "$TEST_RC" -ne 0 ]; then
    echo "[regen-all] ROUND-TRIP TEST FAILED (exit $TEST_RC). Dashboards will be rolled back."
    echo "$TEST_OUT" | tail -20 | sed 's/^/    /'
    # Roll back each affected HTML to last committed version. Quiet on files that aren't tracked yet.
    for f in docs/reports/dashboard.html docs/reports/activity.html docs/reports/proposals.html \
             docs/reports/discussion-bubbles.html docs/reports/index.html docs/reports/main-flows.html; do
        if [ -f "$f" ]; then
            git checkout HEAD -- "$f" 2>/dev/null || echo "[regen-all] could not roll back $f (not tracked or no HEAD)"
        fi
    done
    echo ""
    echo "REGEN ROLLED BACK at $END_TS — round-trip test failed; consult the test output above"
    exit 2
fi
echo "[regen-all] round-trip test PASS"
echo ""
echo "ALL DASHBOARDS REGENERATED at $END_TS"
exit 0
