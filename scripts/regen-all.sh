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
    "aggregate-telemetry|scripts/aggregate-telemetry.py"
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
if [ ${#FAILED[@]} -eq 0 ]; then
    echo ""
    echo "ALL DASHBOARDS REGENERATED at $END_TS"
    exit 0
else
    echo ""
    echo "PARTIAL FAILURE at $END_TS — failed steps: ${FAILED[*]}"
    exit 1
fi
