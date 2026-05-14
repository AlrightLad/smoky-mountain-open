#!/usr/bin/env bash
# ============================================================
# apply-escalation-decisions.sh — apply Founder escalation decisions
#                                 exported from dashboard.html
# ============================================================
# Usage:
#   .claude/scripts/apply-escalation-decisions.sh path/to/escalation-decisions-<ts>.json [--dry-run]
#
# The JSON is produced by clicking "Mark resolved & export decision"
# on dashboard.html's Founder Review Queue escalation cards. This
# script:
#   1. Validates the JSON shape (schema_version=1, kind="escalation-decisions")
#   2. For each decision: removes the corresponding entry from
#      .claude/state/founder/review-queue.json's open_escalations
#      array; appends the decision to escalation-decisions-log.ndjson
#   3. Commits the changes with a structured commit message
#
# Mirrors apply-amendments.sh + apply-decisions.sh structure.
#
# Exits non-zero on:
#   - Missing or malformed JSON
#   - kind != "escalation-decisions" (catches misrouting from watcher)
#   - Referenced escalation_id not found in open_escalations
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
    echo "Error: missing escalation-decisions JSON path" >&2
    echo "Usage: $0 path/to/escalation-decisions-<ts>.json [--dry-run]" >&2
    exit 2
fi

if [[ ! -f "$JSON_PATH" ]]; then
    echo "Error: file not found: $JSON_PATH" >&2
    exit 2
fi

REVIEW_QUEUE=".claude/state/founder/review-queue.json"
LOG_FILE=".claude/state/founder/escalation-decisions-log.ndjson"

if [[ ! -f "$REVIEW_QUEUE" ]]; then
    echo "Error: review-queue.json not found at $REVIEW_QUEUE" >&2
    echo "Run this from the repo root." >&2
    exit 2
fi

# Locate python.exe (mirror regen-all.ps1's discovery order; same
# Windows-Founder environment).
PY=""
for cand in \
    "$LOCALAPPDATA/Programs/Python/Python312/python.exe" \
    "$LOCALAPPDATA/Programs/Python/Python311/python.exe" \
    "$LOCALAPPDATA/Programs/Python/Python310/python.exe" \
    "$PROGRAMFILES/Python312/python.exe" \
    "$PROGRAMFILES/Python311/python.exe"; do
    if [[ -f "$cand" ]]; then PY="$cand"; break; fi
done
if [[ -z "$PY" ]]; then
    if command -v python >/dev/null 2>&1; then PY="python"
    elif command -v python3 >/dev/null 2>&1; then PY="python3"
    else echo "Error: no python found" >&2; exit 2
    fi
fi

# Delegate the JSON surgery to Python (jq isn't in PATH on Windows-Founder).
export ESC_JSON="$JSON_PATH"
export REVIEW_QUEUE_PATH="$REVIEW_QUEUE"
export LOG_PATH="$LOG_FILE"
export DRY_RUN

PYTHONIOENCODING=utf-8 PYTHONUTF8=1 "$PY" <<'PYEOF'
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

esc_json_path = Path(os.environ["ESC_JSON"])
review_queue_path = Path(os.environ["REVIEW_QUEUE_PATH"])
log_path = Path(os.environ["LOG_PATH"])
dry_run = os.environ.get("DRY_RUN", "0") == "1"

with esc_json_path.open("r", encoding="utf-8") as f:
    payload = json.load(f)

kind = payload.get("kind")
if kind != "escalation-decisions":
    print(f"Error: kind={kind!r} (expected 'escalation-decisions'); not routing", file=sys.stderr)
    sys.exit(3)

schema = payload.get("schema_version")
if schema != 1:
    print(f"Error: schema_version={schema!r} (expected 1); aborting", file=sys.stderr)
    sys.exit(3)

decisions = payload.get("decisions") or []
if not decisions:
    print("Warning: no decisions in payload; nothing to apply")
    sys.exit(0)

with review_queue_path.open("r", encoding="utf-8") as f:
    queue = json.load(f)

gov = queue.setdefault("governance_gates", {})
open_esc = gov.get("open_escalations") or []
open_ids = {e.get("id") for e in open_esc}

applied = []
skipped = []
for d in decisions:
    eid = d.get("escalation_id")
    action = (d.get("action") or "").lower()
    decision_text = (d.get("decision") or "").strip()
    notes = (d.get("notes") or "").strip()
    if not eid:
        skipped.append({"escalation_id": None, "reason": "missing escalation_id"})
        continue
    if action != "resolved":
        skipped.append({"escalation_id": eid, "reason": f"unsupported action={action!r}"})
        continue
    if eid not in open_ids:
        skipped.append({"escalation_id": eid, "reason": "not in open_escalations (already resolved or stale id)"})
        continue
    if not decision_text:
        skipped.append({"escalation_id": eid, "reason": "empty decision text"})
        continue
    applied.append({
        "escalation_id": eid,
        "action": action,
        "decision": decision_text,
        "notes": notes,
        "applied_at": datetime.now(timezone.utc).isoformat(),
        "exported_at": payload.get("exported_at"),
    })

if not applied:
    print(f"No decisions applied. {len(skipped)} skipped:")
    for s in skipped:
        print(f"  - {s}")
    sys.exit(0)

# Filter out applied IDs from open_escalations
applied_ids = {a["escalation_id"] for a in applied}
new_open = [e for e in open_esc if e.get("id") not in applied_ids]
gov["open_escalations"] = new_open
queue["governance_gates"] = gov

# Bump as_of timestamp so the dashboard registers the change
queue["as_of"] = datetime.now(timezone.utc).isoformat()

if dry_run:
    print("[DRY RUN] would apply:")
    for a in applied:
        print(f"  - {a['escalation_id']}: {a['decision'][:80]}")
    print(f"[DRY RUN] would write {review_queue_path}")
    print(f"[DRY RUN] would append {len(applied)} entries to {log_path}")
    sys.exit(0)

# Persist review-queue.json (write atomic via tmp + rename)
tmp = review_queue_path.with_suffix(".tmp")
with tmp.open("w", encoding="utf-8") as f:
    json.dump(queue, f, indent=2)
    f.write("\n")
tmp.replace(review_queue_path)
print(f"updated {review_queue_path}: {len(applied)} escalations removed; {len(new_open)} remaining")

# Append to log (ndjson, one decision per line)
log_path.parent.mkdir(parents=True, exist_ok=True)
with log_path.open("a", encoding="utf-8") as f:
    for a in applied:
        f.write(json.dumps(a) + "\n")
print(f"logged {len(applied)} decisions to {log_path}")

for a in applied:
    print(f"  APPLIED {a['escalation_id']}: {a['decision'][:120]}")

if skipped:
    print(f"{len(skipped)} skipped:")
    for s in skipped:
        print(f"  - {s}")
PYEOF

PY_RC=$?
if [[ "$PY_RC" -ne 0 ]]; then
    echo "Error: python apply step exited $PY_RC" >&2
    exit "$PY_RC"
fi

if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY RUN] no commit"
    exit 0
fi

# Commit the changes locally (per amendments + decisions pattern;
# downloads-watcher manages git config + commits before invoking this
# script, so we only need to add + commit the affected files).
git add "$REVIEW_QUEUE" "$LOG_FILE" 2>/dev/null || true
if git diff --cached --quiet; then
    echo "No staged changes after apply (review-queue may have been clean already)."
    exit 0
fi

JSON_BASENAME=$(basename "$JSON_PATH")
git commit -m "Apply escalation decisions: $JSON_BASENAME

Founder-resolved escalations removed from open_escalations;
decisions appended to escalation-decisions-log.ndjson.

Source: $JSON_BASENAME (via downloads-watcher)
" 2>&1

echo "apply-escalation-decisions: DONE"
exit 0
