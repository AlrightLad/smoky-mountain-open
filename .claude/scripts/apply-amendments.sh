#!/usr/bin/env bash
# ============================================================
# apply-amendments.sh — apply governance amendment decisions
#                      exported from docs/reports/amendments.html
# ============================================================
# Usage:
#   .claude/scripts/apply-amendments.sh path/to/amendments-<ts>.json [--dry-run]
#
# The JSON is produced by clicking "Export amendments" in
# amendments.html. This script:
#   1. Validates the JSON shape (schema_version=1, kind="amendments")
#   2. For each approve decision: applies the amendment per its type
#      (new-file | replace-existing | append-to-existing | edit-section),
#      then moves the AMD draft from pending/ to applied/
#   3. For reject/defer decisions: moves the AMD draft from pending/
#      to rejected/ or deferred/, appending Founder's note
#   4. Updates .claude/state/amendments/amendments-log.ndjson
#   5. Commits the changes with a structured commit message
#
# Mirrors apply-decisions.sh structure (Python fallback chain, cygpath
# handling, set -u guards). See that script for the proposal lifecycle.
#
# Exits non-zero on:
#   - Missing or malformed JSON
#   - kind != "amendments" (catches misrouting from watcher)
#   - Referenced AMD file not found in pending/
#   - Apply step fails (section anchor not found, target missing for
#     replace-existing, etc.)
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
    echo "Error: missing amendments JSON path" >&2
    echo "Usage: $0 path/to/amendments-<ts>.json [--dry-run]" >&2
    exit 2
fi

if [[ ! -f "$JSON_PATH" ]]; then
    echo "Error: file not found: $JSON_PATH" >&2
    exit 2
fi

# Verify we're in the repo root
AMENDMENTS_DIR=".claude/state/amendments"
if [[ ! -d "$AMENDMENTS_DIR/pending" ]]; then
    echo "Error: must be run from repo root. Expected $AMENDMENTS_DIR/pending/ to exist." >&2
    exit 3
fi

# Ensure destination dirs exist
for d in approved applied rejected deferred; do
    mkdir -p "$AMENDMENTS_DIR/$d"
done

LOG="$AMENDMENTS_DIR/amendments-log.ndjson"
touch "$LOG"

# Locate Python (POSIX → Windows fallback chain, same as apply-decisions.sh)
PYTHON_BIN=""
for cand in python3 python py; do
    if command -v "$cand" >/dev/null 2>&1; then PYTHON_BIN="$cand"; break; fi
done
if [ -z "$PYTHON_BIN" ]; then
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
    echo "Error: no Python interpreter found." >&2
    exit 4
fi
export PYTHONIOENCODING=utf-8
export PYTHONUTF8=1

# Windows .exe + Git-Bash POSIX path → cygpath translation
JSON_PATH_FOR_PY="$JSON_PATH"
case "$PYTHON_BIN" in
    *.exe|*.EXE)
        if command -v cygpath >/dev/null 2>&1; then
            JSON_PATH_FOR_PY=$(cygpath -w "$JSON_PATH")
        else
            JSON_PATH_FOR_PY=$(echo "$JSON_PATH" | sed -E 's|^/([a-zA-Z])/|\1:/|')
        fi
        ;;
esac

# Parse + validate JSON. Emit decisions as shell-safe pipe-delimited tuples.
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

# kind="amendments" — this script REFUSES to process other kinds.
# Catches watcher misrouting (decisions-*.json with kind="decisions"
# arriving at this script).
kind = data.get("kind")
if kind != "amendments":
    print(f"KIND_ERROR: this script only handles kind='amendments', got kind={kind!r}", file=sys.stderr)
    sys.exit(1)

decisions = data.get("decisions", [])
if not decisions:
    print("EMPTY_ERROR: no decisions in JSON", file=sys.stderr)
    sys.exit(1)

valid_types = {"approve", "reject", "defer"}
for i, d in enumerate(decisions):
    if "amendment_id" not in d:
        print(f"MISSING_ID at index {i}", file=sys.stderr)
        sys.exit(1)
    if d.get("decision") not in valid_types:
        print(f"INVALID_DECISION '{d.get('decision')}' for {d.get('amendment_id')}", file=sys.stderr)
        sys.exit(1)

for d in decisions:
    aid = d["amendment_id"]
    typ = d["decision"]
    note = (d.get("note") or "").replace("|", " ").replace("\n", " ")
    decided_at = d.get("decided_at") or ""
    print(f"{aid}|{typ}|{note}|{decided_at}")

print(f"SOURCE_TS={data.get('source_report_generated_at', 'unknown')}", file=sys.stderr)
print(f"EXPORT_TS={data.get('generated_at', 'unknown')}", file=sys.stderr)
PYEOF
)

if [[ -z "$PARSED" ]]; then
    echo "Error: JSON validation failed. See messages above." >&2
    exit 1
fi

echo ""
echo "=== Governance Amendment Decisions to Apply ==="
echo ""

APPLIED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0
COMMIT_LINES_APPROVED=()
COMMIT_LINES_REJECTED=()
COMMIT_LINES_DEFERRED=()

# Track exactly which target_canonical_path files got written by approve
# operations, so we stage only those (NOT `git add -A docs/agents/` which
# would sweep up unrelated untracked files — known bug class, see
# AUTONOMOUS_FAILURE_RECOVERY_v8.3 §4).
TOUCHED_LOG=$(mktemp -t apply-amendments-touched.XXXXXX)
trap 'rm -f "$TOUCHED_LOG"' EXIT

# Type-aware amendment application via Python (cleaner than bash for
# section-anchor splicing and frontmatter stripping).
apply_amendment_via_python() {
    local SRC="$1"
    local AMID="$2"
    local LE_NOTE="$3"
    local LE_DECIDED_AT="$4"

    # Convert SRC path if necessary
    local SRC_FOR_PY="$SRC"
    case "$PYTHON_BIN" in
        *.exe|*.EXE)
            if command -v cygpath >/dev/null 2>&1; then
                SRC_FOR_PY=$(cygpath -w "$SRC")
            else
                SRC_FOR_PY=$(echo "$SRC" | sed -E 's|^/([a-zA-Z])/|\1:/|')
            fi
            ;;
    esac

    export AMD_SRC_PATH="$SRC_FOR_PY"
    export AMD_ID="$AMID"
    export AMD_NOTE="$LE_NOTE"
    export AMD_DECIDED_AT="$LE_DECIDED_AT"
    export AMD_DRY_RUN="$DRY_RUN"
    export AMD_TOUCHED_LOG="$TOUCHED_LOG"

    "$PYTHON_BIN" <<'PYEOF'
import json, os, sys, re
from pathlib import Path

src_path = Path(os.environ["AMD_SRC_PATH"])
amd_id   = os.environ["AMD_ID"]
note     = os.environ.get("AMD_NOTE", "")
dry_run  = os.environ.get("AMD_DRY_RUN", "0") == "1"
# Path of touched-files log so bash can stage exactly what changed
# (avoids overly-broad `git add -A docs/agents/` sweeping untracked files).
touched_log = os.environ.get("AMD_TOUCHED_LOG", "")

def record_touched(p):
    if touched_log:
        with open(touched_log, "a", encoding="utf-8") as f:
            f.write(str(p) + "\n")

text = src_path.read_text(encoding="utf-8")

# Strip leading frontmatter (---\n ... \n---\n) to get the body.
m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.DOTALL)
if not m:
    print(f"FRONTMATTER_PARSE_ERROR: AMD file has no leading --- frontmatter", file=sys.stderr)
    sys.exit(2)

fm_yaml, body = m.group(1), m.group(2)

# Parse frontmatter as YAML-ish (simple key: value). For richer schema we
# use the manual line parser; this is robust for the AMD schema's flat
# key/value shape.
fm = {}
for line in fm_yaml.split("\n"):
    if ":" not in line:
        continue
    k, _, v = line.partition(":")
    k = k.strip()
    v = v.strip().strip('"').strip("'")
    if v == "null":
        v = None
    fm[k] = v

target = fm.get("target_canonical_path")
amd_type = fm.get("type")

if not target or not amd_type:
    print(f"FRONTMATTER_SCHEMA_ERROR: missing target_canonical_path or type", file=sys.stderr)
    sys.exit(2)

target_path = Path(target)
report = {"amendment_id": amd_id, "target": str(target_path), "type": amd_type}

if amd_type == "new-file":
    if dry_run:
        print(f"  [DRY-RUN] new-file → {target_path} ({len(body)} chars)")
        sys.exit(0)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if target_path.exists():
        print(f"  ✗ APPLY-FAIL {amd_id}: new-file but target already exists at {target_path}", file=sys.stderr)
        sys.exit(3)
    target_path.write_text(body, encoding="utf-8")
    record_touched(target_path)
    print(f"  ✓ APPLIED new-file {amd_id} → {target_path}")
    report["applied"] = True

elif amd_type == "replace-existing":
    if dry_run:
        print(f"  [DRY-RUN] replace-existing → {target_path}")
        sys.exit(0)
    if not target_path.exists():
        print(f"  ✗ APPLY-FAIL {amd_id}: replace-existing but target missing at {target_path}", file=sys.stderr)
        sys.exit(3)
    target_path.write_text(body, encoding="utf-8")
    record_touched(target_path)
    print(f"  ✓ APPLIED replace-existing {amd_id} → {target_path}")
    report["applied"] = True

elif amd_type == "append-to-existing":
    if dry_run:
        print(f"  [DRY-RUN] append-to-existing → {target_path}")
        sys.exit(0)
    if not target_path.exists():
        print(f"  ✗ APPLY-FAIL {amd_id}: append-to-existing but target missing at {target_path}", file=sys.stderr)
        sys.exit(3)
    existing = target_path.read_text(encoding="utf-8")
    if not existing.endswith("\n"):
        existing += "\n"
    target_path.write_text(existing + "\n" + body, encoding="utf-8")
    record_touched(target_path)
    print(f"  ✓ APPLIED append-to-existing {amd_id} → {target_path}")
    report["applied"] = True

elif amd_type == "edit-section":
    anchor = fm.get("section_anchor")
    if not anchor:
        print(f"  ✗ APPLY-FAIL {amd_id}: edit-section requires section_anchor", file=sys.stderr)
        sys.exit(3)
    if dry_run:
        print(f"  [DRY-RUN] edit-section {anchor!r} → {target_path}")
        sys.exit(0)
    if not target_path.exists():
        print(f"  ✗ APPLY-FAIL {amd_id}: edit-section but target missing at {target_path}", file=sys.stderr)
        sys.exit(3)
    existing = target_path.read_text(encoding="utf-8")
    # Splice: find a heading or text-anchor matching anchor; replace from
    # that line to the next heading line (## or #) with body. Conservative
    # implementation — anchor must be a heading line OR exact prose match.
    lines = existing.splitlines(keepends=True)
    anchor_re = re.compile(r"^#+\s*" + re.escape(anchor.strip()) + r"\s*$")
    start_idx = None
    for i, line in enumerate(lines):
        if anchor_re.match(line.rstrip()):
            start_idx = i
            break
        if anchor.strip() in line and line.strip().startswith("#"):
            start_idx = i
            break
    if start_idx is None:
        # Fall back to substring match in body
        for i, line in enumerate(lines):
            if anchor.strip() in line:
                start_idx = i
                break
    if start_idx is None:
        print(f"  ✗ APPLY-FAIL {amd_id}: section_anchor {anchor!r} not found in {target_path}", file=sys.stderr)
        sys.exit(3)
    # Find next heading line (same or higher level)
    start_line = lines[start_idx]
    end_idx = len(lines)
    if start_line.strip().startswith("#"):
        start_level = len(start_line) - len(start_line.lstrip("#"))
        for j in range(start_idx + 1, len(lines)):
            if lines[j].strip().startswith("#"):
                jlevel = len(lines[j]) - len(lines[j].lstrip("#"))
                if jlevel <= start_level:
                    end_idx = j
                    break
    spliced = "".join(lines[:start_idx]) + body + ("\n" if not body.endswith("\n") else "") + "".join(lines[end_idx:])
    target_path.write_text(spliced, encoding="utf-8")
    record_touched(target_path)
    print(f"  ✓ APPLIED edit-section {amd_id} at {anchor!r} → {target_path}")
    report["applied"] = True

else:
    print(f"  ✗ APPLY-FAIL {amd_id}: unknown type {amd_type!r}", file=sys.stderr)
    sys.exit(3)

print(f"REPORT: {json.dumps(report)}", file=sys.stderr)
PYEOF
}

map_destination() {
    case "$1" in
        approve) echo "applied" ;;
        reject)  echo "rejected" ;;
        defer)   echo "deferred" ;;
    esac
}

while IFS='|' read -r AMID TYPE NOTE DECIDED_AT; do
    [[ -z "$AMID" ]] && continue
    DEST_DIR=$(map_destination "$TYPE")

    # Find source file in pending/
    SRC=""
    FUZZY=$(find "$AMENDMENTS_DIR/pending" -maxdepth 1 -type f -name "${AMID}-*.md" 2>/dev/null | head -1)
    if [[ -n "$FUZZY" ]]; then
        SRC="$FUZZY"
    fi

    if [[ -z "$SRC" ]]; then
        echo "  ✗ SKIP $AMID — no matching file in $AMENDMENTS_DIR/pending/"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    if [[ "$TYPE" == "approve" ]]; then
        # Apply the amendment to its target canonical path
        if ! apply_amendment_via_python "$SRC" "$AMID" "$NOTE" "$DECIDED_AT"; then
            FAILED_COUNT=$((FAILED_COUNT + 1))
            continue
        fi
        # Then move the AMD draft from pending/ to applied/ as archive
        DST="$AMENDMENTS_DIR/applied/$(basename "$SRC")"
        if [[ $DRY_RUN -eq 0 ]]; then
            git mv "$SRC" "$DST"
        fi
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
        COMMIT_LINES_APPROVED+=("$AMID")
    else
        # reject/defer: just move the AMD file with note
        DST="$AMENDMENTS_DIR/$DEST_DIR/$(basename "$SRC")"

        if [[ $DRY_RUN -eq 1 ]]; then
            echo "  [DRY-RUN] $TYPE $AMID  →  $DST${NOTE:+  (note: $NOTE)}"
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

        git mv "$SRC" "$DST"
        echo "  ✓ $TYPE $AMID  →  $DST${NOTE:+  (note: $NOTE)}"
        APPLIED_COUNT=$((APPLIED_COUNT + 1))
        if [[ "$TYPE" == "reject" ]]; then
            COMMIT_LINES_REJECTED+=("$AMID${NOTE:+ — $NOTE}")
        else
            COMMIT_LINES_DEFERRED+=("$AMID${NOTE:+ — $NOTE}")
        fi
    fi

    # Append to amendments-log.ndjson
    LE_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if [[ $DRY_RUN -eq 0 ]]; then
        LE_TS_VAR="$LE_TS" \
        LE_AMID="$AMID" \
        LE_TYPE="$TYPE" \
        LE_NOTE="$NOTE" \
        LE_DECIDED_AT="$DECIDED_AT" \
        "$PYTHON_BIN" <<'PYEOF' >> "$LOG"
import json, os
print(json.dumps({
    "timestamp":   os.environ["LE_TS_VAR"],
    "amendment_id": os.environ["LE_AMID"],
    "decision":    os.environ["LE_TYPE"],
    "note":        os.environ["LE_NOTE"],
    "decided_at":  os.environ["LE_DECIDED_AT"],
}))
PYEOF
    fi
done <<< "$PARSED"

echo ""
echo "=== Summary ==="
echo "  Applied/moved: $APPLIED_COUNT"
echo "  Skipped:       $SKIPPED_COUNT"
echo "  Failed:        $FAILED_COUNT"

if [[ $DRY_RUN -eq 1 ]]; then
    echo ""
    echo "DRY-RUN complete. No changes made to disk."
    exit 0
fi

if [[ $APPLIED_COUNT -eq 0 ]]; then
    echo "No amendments applied; nothing to commit."
    exit 0
fi

# Build commit message
COMMIT_MSG="Apply governance amendments via amendments.html watcher

"
if [[ ${#COMMIT_LINES_APPROVED[@]} -gt 0 ]]; then
    COMMIT_MSG+="Approved: ${COMMIT_LINES_APPROVED[*]}
"
fi
if [[ ${#COMMIT_LINES_REJECTED[@]} -gt 0 ]]; then
    COMMIT_MSG+="Rejected: ${COMMIT_LINES_REJECTED[*]}
"
fi
if [[ ${#COMMIT_LINES_DEFERRED[@]} -gt 0 ]]; then
    COMMIT_MSG+="Deferred: ${COMMIT_LINES_DEFERRED[*]}
"
fi
COMMIT_MSG+="
Decisions from: $JSON_PATH
Source export: ${EXPORT_TS:-unknown}"

# Stage + commit
# Stage AMD lifecycle state changes (pending/, applied/, deferred/, rejected/,
# amendments-log.ndjson). These are all under .claude/state/amendments/.
git add -A "$AMENDMENTS_DIR/"
# Stage ONLY the target_canonical_path files that apply-amendment_via_python
# actually wrote, recorded in TOUCHED_LOG. Does NOT sweep entire docs/agents/
# or .claude/skills/ which would pick up unrelated untracked files.
if [[ -s "$TOUCHED_LOG" ]]; then
    while IFS= read -r touched; do
        [[ -z "$touched" ]] && continue
        if [[ -f "$touched" ]]; then
            git add "$touched"
        fi
    done < "$TOUCHED_LOG"
fi

if git diff --cached --quiet; then
    echo "No staged changes; commit skipped."
    exit 0
fi

git commit -m "$COMMIT_MSG"
echo ""
echo "✓ Committed amendments to repo. Push when ready."
exit 0
