#!/usr/bin/env bash
# ============================================================
# apply-decisions.sh — apply proposal decisions exported from
#                     docs/reports/proposals.html
# ============================================================
# Usage:
#   .claude/scripts/apply-decisions.sh path/to/decisions-<ts>.json [--dry-run]
#
# The JSON is produced by clicking "Export decisions" in
# proposals.html. This script:
#   1. Validates the JSON shape
#   2. For each decided proposal, moves the proposal file from
#      .claude/state/proposals/pending/ to the appropriate
#      destination directory (approved/ rejected/ deferred/)
#   3. Appends the Founder's note (if any) to the proposal file
#   4. Updates .claude/state/proposals/decisions-log.ndjson
#   5. Commits the changes with a structured commit message
#
# Exits non-zero on:
#   - Missing or malformed JSON
#   - Referenced proposal file not found in pending/
#   - Destination directory missing
#   - Git operation fails
# ============================================================

set -euo pipefail

DRY_RUN=0
JSON_PATH=""

for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=1 ;;
        -h|--help)
            sed -n '2,/^# ====/p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *) JSON_PATH="$arg" ;;
    esac
done

if [[ -z "$JSON_PATH" ]]; then
    echo "Error: missing decisions JSON path" >&2
    echo "Usage: $0 path/to/decisions-<ts>.json [--dry-run]" >&2
    exit 2
fi

if [[ ! -f "$JSON_PATH" ]]; then
    echo "Error: file not found: $JSON_PATH" >&2
    exit 2
fi

# Verify we're in the repo root (must contain .claude/state/proposals/)
PROPOSALS_DIR=".claude/state/proposals"
if [[ ! -d "$PROPOSALS_DIR/pending" ]]; then
    echo "Error: must be run from repo root. Expected $PROPOSALS_DIR/pending/ to exist." >&2
    exit 3
fi

# Ensure destination dirs exist
for d in approved rejected deferred; do
    mkdir -p "$PROPOSALS_DIR/$d"
done

LOG="$PROPOSALS_DIR/decisions-log.ndjson"
touch "$LOG"

# Locate a Python interpreter. Prefer python3 (POSIX), fall back to python
# (Windows / Git Bash where there's no python3 symlink), then probe known
# Windows install paths.
PYTHON_BIN=""
for cand in python3 python py; do
    if command -v "$cand" >/dev/null 2>&1; then PYTHON_BIN="$cand"; break; fi
done
if [ -z "$PYTHON_BIN" ]; then
    # USER (POSIX) and USERNAME (Windows) — either may be unset under set -u; guard both.
    USER_NAME="${USER:-${USERNAME:-}}"
    if [ -n "$USER_NAME" ]; then
        for p in \
            "/c/Users/${USER_NAME}/AppData/Local/Programs/Python/Python312/python.exe" \
            "/c/Users/${USER_NAME}/AppData/Local/Programs/Python/Python311/python.exe"; do
            if [ -x "$p" ]; then PYTHON_BIN="$p"; break; fi
        done
    fi
fi
if [ -z "$PYTHON_BIN" ]; then
    echo "Error: no Python interpreter found (tried python3, python, py, and known Windows install paths)." >&2
    exit 4
fi
export PYTHONIOENCODING=utf-8
export PYTHONUTF8=1

# Detect Git-Bash on Windows via uname -s, not PYTHON_BIN suffix.
# Earlier *.exe-suffix check missed the case where command -v finds python3
# on PATH and PYTHON_BIN is a bare name (no .exe). cygpath got skipped,
# Windows Python received POSIX /c/Users/... paths which it cannot open.
# Same class-of-bug fix as apply-amendments.sh 2026-05-14.
JSON_PATH_FOR_PY="$JSON_PATH"
case "$(uname -s 2>/dev/null)" in
    MINGW*|MSYS*|CYGWIN*)
        if command -v cygpath >/dev/null 2>&1; then
            JSON_PATH_FOR_PY=$(cygpath -w "$JSON_PATH")
        else
            # Manual: /c/foo/bar → C:/foo/bar
            JSON_PATH_FOR_PY=$(echo "$JSON_PATH" | sed -E 's|^/([a-zA-Z])/|\1:/|')
        fi
        ;;
esac

# Parse + validate JSON
PARSED=$("$PYTHON_BIN" <<PYEOF
import json, sys
try:
    with open(r"$JSON_PATH_FOR_PY") as f:
        data = json.load(f)
except Exception as e:
    print(f"PARSE_ERROR: {e}", file=sys.stderr)
    sys.exit(1)

if data.get("schema_version") != 1:
    print(f"VERSION_ERROR: expected schema_version=1, got {data.get('schema_version')}", file=sys.stderr)
    sys.exit(1)

decisions = data.get("decisions", [])
if not decisions:
    print("EMPTY_ERROR: no decisions in JSON", file=sys.stderr)
    sys.exit(1)

valid_types = {"approve", "reject", "defer"}
for i, d in enumerate(decisions):
    if "proposal_id" not in d:
        print(f"MISSING_ID at index {i}", file=sys.stderr)
        sys.exit(1)
    if d.get("decision") not in valid_types:
        print(f"INVALID_DECISION '{d.get('decision')}' for {d.get('proposal_id')}", file=sys.stderr)
        sys.exit(1)

# Emit shell-safe tuples: proposal_id|decision|note|decided_at
for d in decisions:
    pid = d["proposal_id"]
    typ = d["decision"]
    note = (d.get("note") or "").replace("|", " ").replace("\n", " ")
    decided_at = d.get("decided_at") or ""
    print(f"{pid}|{typ}|{note}|{decided_at}")

print(f"SOURCE_TS={data.get('source_report_generated_at', 'unknown')}", file=sys.stderr)
print(f"EXPORT_TS={data.get('generated_at', 'unknown')}", file=sys.stderr)
PYEOF
)

if [[ -z "$PARSED" ]]; then
    echo "Error: JSON validation failed. See messages above." >&2
    exit 1
fi

echo ""
echo "=== Proposal Decisions to Apply ==="
echo ""

APPLIED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
COMMIT_LINES=()

map_destination() {
    case "$1" in
        approve) echo "approved" ;;
        reject)  echo "rejected" ;;
        defer)   echo "deferred" ;;
    esac
}

while IFS='|' read -r PID TYPE NOTE DECIDED_AT; do
    [[ -z "$PID" ]] && continue
    DEST_DIR=$(map_destination "$TYPE")

    # Find source file in pending/
    SRC=""
    for ext in md MD markdown txt; do
        candidate="$PROPOSALS_DIR/pending/${PID}.${ext}"
        if [[ -f "$candidate" ]]; then
            SRC="$candidate"
            break
        fi
    done

    if [[ -z "$SRC" ]]; then
        # Try fuzzy match (proposal id may have prefix variations)
        FUZZY=$(find "$PROPOSALS_DIR/pending" -maxdepth 1 -type f -name "*${PID}*" 2>/dev/null | head -1)
        if [[ -n "$FUZZY" ]]; then
            SRC="$FUZZY"
        fi
    fi

    if [[ -z "$SRC" ]]; then
        echo "  ✗ SKIP $PID — no matching file in $PROPOSALS_DIR/pending/"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    DST="$PROPOSALS_DIR/$DEST_DIR/$(basename "$SRC")"

    if [[ $DRY_RUN -eq 1 ]]; then
        echo "  [DRY-RUN] $TYPE $PID  →  $DST${NOTE:+  (note: $NOTE)}"
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
        continue
    fi

    # Append note if provided
    if [[ -n "$NOTE" ]]; then
        {
            echo ""
            echo "---"
            echo ""
            echo "## Founder decision ($TYPE — $(date -u +%Y-%m-%dT%H:%M:%SZ))"
            echo ""
            echo "$NOTE"
        } >> "$SRC"
    fi

    # Move file
    if ! git mv "$SRC" "$DST" 2>/dev/null; then
        # Fall back to mv if file isn't tracked yet (e.g., new proposal)
        if ! mv "$SRC" "$DST"; then
            echo "  ✗ FAIL $PID — could not move $SRC → $DST"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            continue
        fi
    fi

    # Append decision-log entry.
    # Use env vars instead of shell substitution into the Python source to
    # avoid breakage on values containing quotes, backslashes, or newlines
    # (Founder's live watcher hit this with a multi-line note).
    export LE_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    export LE_PID="$PID" LE_TYPE="$TYPE" LE_NOTE="$NOTE" LE_DECIDED_AT="$DECIDED_AT" LE_DST="$DST"
    LOG_ENTRY=$("$PYTHON_BIN" -c '
import json, os
print(json.dumps({
    "ts": os.environ.get("LE_TS",""),
    "proposal_id": os.environ.get("LE_PID",""),
    "decision": os.environ.get("LE_TYPE",""),
    "note": os.environ.get("LE_NOTE",""),
    "decided_at": os.environ.get("LE_DECIDED_AT",""),
    "moved_to": os.environ.get("LE_DST",""),
}))
')
    echo "$LOG_ENTRY" >> "$LOG"

    echo "  ✓ $TYPE $PID  →  $DST${NOTE:+  (note appended)}"
    COMMIT_LINES+=("$TYPE: $PID")
    APPLIED_COUNT=$((APPLIED_COUNT + 1))

done <<< "$PARSED"

echo ""
echo "=== Summary ==="
echo "  Applied: $APPLIED_COUNT"
echo "  Skipped: $SKIPPED_COUNT"
echo "  Failed:  $FAILED_COUNT"
echo ""

if [[ $FAILED_COUNT -gt 0 ]]; then
    echo "Some proposals failed to apply. Review output and resolve manually." >&2
    exit 5
fi

if [[ $DRY_RUN -eq 1 ]]; then
    echo "Dry-run complete. No files moved, no commit. Re-run without --dry-run to apply."
    exit 0
fi

if [[ $APPLIED_COUNT -eq 0 ]]; then
    echo "Nothing applied — nothing to commit."
    exit 0
fi

# Stage + commit
git add "$PROPOSALS_DIR" "$LOG"

COMMIT_MSG="Apply proposal decisions ($APPLIED_COUNT total)"
COMMIT_BODY=$(printf '%s\n' "${COMMIT_LINES[@]}")

if ! git commit -m "$COMMIT_MSG" -m "$COMMIT_BODY"; then
    echo "Warning: git commit failed. Files moved but not committed. Resolve and commit manually." >&2
    exit 6
fi

echo "Committed: $COMMIT_MSG"
echo ""
echo "Push when ready: git push"
