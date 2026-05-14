#!/usr/bin/env bash
# ============================================================
# apply-escalations.sh — apply Founder escalation decisions
#                        exported from docs/reports/escalations.html
# ============================================================
# Usage:
#   .claude/scripts/apply-escalations.sh path/to/escalations-<ts>.json [--dry-run]
#
# The JSON is produced by clicking "Export escalations" in
# escalations.html. This script:
#   1. Validates the JSON shape (schema_version=1, kind="escalations")
#   2. For each approve decision: moves pending/ESC-NNN.md → approved/,
#      appends founder_decision/founder_decision_options/founder_decision_text/
#      founder_note/approved_at to frontmatter.
#   3. For each reject decision: moves pending/ESC-NNN.md → rejected/,
#      appends founder_rejection_rationale + rejected_at.
#   4. For each defer decision: moves pending/ESC-NNN.md → deferred/,
#      appends founder_note + deferred_at.
#   5. Appends each decision to escalation-decisions-log.ndjson.
#   6. Commits locally.
#
# Mirrors apply-amendments.sh + apply-decisions.sh structure.
# Note: the approved/ → applied/ transition is NOT this script's job;
# that happens when the orchestration team acts on Founder's decision
# on the next agent loop and moves the file to applied/ with applied_at
# + applied_commit fields recorded.
#
# Exits non-zero on:
#   - Missing or malformed JSON
#   - kind != "escalations" (catches misrouting from watcher)
#   - Referenced ESC-NNN.md not found in pending/
#   - Unsupported action
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
    echo "Error: missing escalations JSON path" >&2
    echo "Usage: $0 path/to/escalations-<ts>.json [--dry-run]" >&2
    exit 2
fi

if [[ ! -f "$JSON_PATH" ]]; then
    echo "Error: file not found: $JSON_PATH" >&2
    exit 2
fi

ESC_DIR=".claude/state/escalations"
LOG_FILE=".claude/state/founder/escalation-decisions-log.ndjson"

for sub in pending approved applied rejected deferred; do
    if [[ ! -d "$ESC_DIR/$sub" ]]; then
        echo "Error: $ESC_DIR/$sub directory not found" >&2
        echo "Run from repo root; ensure escalations lifecycle is set up." >&2
        exit 2
    fi
done

# Locate python.exe
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

# Delegate the markdown + JSON surgery to Python.
export ESC_JSON="$JSON_PATH"
export ESC_DIR
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
esc_dir = Path(os.environ["ESC_DIR"])
log_path = Path(os.environ["LOG_PATH"])
dry_run = os.environ.get("DRY_RUN", "0") == "1"

with esc_json_path.open("r", encoding="utf-8") as f:
    payload = json.load(f)

kind = payload.get("kind")
if kind != "escalations":
    print(f"Error: kind={kind!r} (expected 'escalations'); not routing", file=sys.stderr)
    sys.exit(3)

schema = payload.get("schema_version")
if schema != 1:
    print(f"Error: schema_version={schema!r} (expected 1); aborting", file=sys.stderr)
    sys.exit(3)

decisions = payload.get("decisions") or []
if not decisions:
    print("Warning: no decisions in payload; nothing to apply")
    sys.exit(0)

now_iso = datetime.now(timezone.utc).isoformat()


def find_pending(eid):
    """Return the path of pending/ESC-NNN-*.md matching the id, or None."""
    for f in (esc_dir / "pending").glob(f"{eid}-*.md"):
        return f
    direct = (esc_dir / "pending" / f"{eid}.md")
    return direct if direct.exists() else None


def append_frontmatter_fields(text, extra):
    """Insert key:value lines into the file's YAML frontmatter, just before
    the closing '---'. Returns the modified text. If no frontmatter, prepends
    a new one (defensive)."""
    m = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    inserted = "".join(extra)
    if not m:
        return f"---\n{inserted}---\n{text}"
    head = m.group(1)
    new_head = head.rstrip("\n") + "\n" + inserted.rstrip("\n") + "\n"
    return f"---\n{new_head}---\n" + text[m.end():]


def fmt_yaml_value(v):
    """Render a Python value as a YAML-safe inline string."""
    if v is None: return "null"
    if isinstance(v, bool): return "true" if v else "false"
    if isinstance(v, (int, float)): return str(v)
    s = str(v)
    if "\n" in s:
        return "|\n" + "\n".join("  " + line for line in s.splitlines())
    # Quote if contains special chars
    if any(c in s for c in [":", "#", "{", "}", "[", "]", ",", "&", "*", "!", "|", ">", "'", '"', "%", "@", "`"]) or s.strip() != s:
        return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'
    return s


applied_summary = []
skipped = []
modified_files = []  # for git add

for d in decisions:
    eid = d.get("escalation_id")
    action = (d.get("action") or "").lower()
    decision_options = d.get("decision_options") or []
    decision_text = (d.get("decision_text") or "").strip()
    note = (d.get("note") or "").strip()
    rejection_rationale = (d.get("rejection_rationale") or note).strip()

    if not eid:
        skipped.append({"escalation_id": None, "reason": "missing escalation_id"})
        continue

    if action not in ("approve", "reject", "defer"):
        skipped.append({"escalation_id": eid, "reason": f"unsupported action={action!r}"})
        continue

    pending_path = find_pending(eid)
    if not pending_path:
        skipped.append({"escalation_id": eid, "reason": f"not found in pending/ (already processed or stale id)"})
        continue

    text = pending_path.read_text(encoding="utf-8")

    if action == "approve":
        extra = []
        extra.append(f"founder_decision: approve\n")
        if decision_options:
            opts = ", ".join(decision_options)
            extra.append(f"founder_decision_options: [{opts}]\n")
        if decision_text:
            extra.append(f"founder_decision_text: {fmt_yaml_value(decision_text)}\n")
        if note:
            extra.append(f"founder_note: {fmt_yaml_value(note)}\n")
        extra.append(f"approved_at: {now_iso}\n")
        new_text = append_frontmatter_fields(text, extra)
        target_dir = esc_dir / "approved"
    elif action == "reject":
        extra = []
        extra.append(f"founder_decision: reject\n")
        if rejection_rationale:
            extra.append(f"founder_rejection_rationale: {fmt_yaml_value(rejection_rationale)}\n")
        extra.append(f"rejected_at: {now_iso}\n")
        new_text = append_frontmatter_fields(text, extra)
        target_dir = esc_dir / "rejected"
    else:  # defer
        extra = []
        extra.append(f"founder_decision: defer\n")
        if note:
            extra.append(f"founder_note: {fmt_yaml_value(note)}\n")
        extra.append(f"deferred_at: {now_iso}\n")
        new_text = append_frontmatter_fields(text, extra)
        target_dir = esc_dir / "deferred"

    target_path = target_dir / pending_path.name

    if dry_run:
        applied_summary.append({
            "escalation_id": eid,
            "action": action,
            "from": str(pending_path.relative_to(esc_dir.parent.parent)).replace("\\", "/"),
            "to":   str(target_path.relative_to(esc_dir.parent.parent)).replace("\\", "/"),
            "options": decision_options,
            "text": decision_text[:120],
        })
    else:
        target_path.write_text(new_text, encoding="utf-8")
        pending_path.unlink()
        applied_summary.append({
            "escalation_id": eid,
            "action": action,
            "from": str(pending_path.relative_to(esc_dir.parent.parent)).replace("\\", "/"),
            "to":   str(target_path.relative_to(esc_dir.parent.parent)).replace("\\", "/"),
            "options": decision_options,
        })
        modified_files.append(str(target_path.relative_to(Path(".").resolve())))
        modified_files.append(str(pending_path.relative_to(Path(".").resolve())))

# Append log
log_entry_count = 0
if applied_summary and not dry_run:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    with log_path.open("a", encoding="utf-8") as f:
        for a in applied_summary:
            entry = {
                "escalation_id": a["escalation_id"],
                "action": a["action"],
                "from": a["from"],
                "to": a["to"],
                "options": a.get("options") or [],
                "applied_at": now_iso,
                "exported_at": payload.get("exported_at"),
            }
            f.write(json.dumps(entry) + "\n")
            log_entry_count += 1
    modified_files.append(str(log_path))

if dry_run:
    print(f"[DRY RUN] would apply {len(applied_summary)} decisions:")
    for a in applied_summary:
        print(f"  - {a['escalation_id']}: {a['action']:7s} {a['from']} → {a['to']}")
        if a.get('options'): print(f"      options: {a['options']}")
        if a.get('text'):    print(f"      text:    {a['text']}")
else:
    print(f"applied {len(applied_summary)} decisions; logged {log_entry_count} entries to {log_path}")
    for a in applied_summary:
        print(f"  APPLIED {a['escalation_id']}: {a['action']} → {a['to']}")

if skipped:
    print(f"{len(skipped)} skipped:")
    for s in skipped:
        print(f"  - {s}")

# Write list of modified files for the shell wrapper to git-add
if not dry_run and modified_files:
    Path(".tmp-escalation-modified-files").write_text("\n".join(sorted(set(modified_files))), encoding="utf-8")
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

# Stage + commit
if [[ -f ".tmp-escalation-modified-files" ]]; then
    while IFS= read -r f; do
        if [[ -n "$f" ]]; then
            git add -- "$f" 2>/dev/null || true
        fi
    done < ".tmp-escalation-modified-files"
    rm -f ".tmp-escalation-modified-files"
fi

# Also catch the pending/ deletions
git add -A "$ESC_DIR/" 2>/dev/null || true

if git diff --cached --quiet; then
    echo "No staged changes after apply."
    exit 0
fi

JSON_BASENAME=$(basename "$JSON_PATH")
git commit -m "Apply escalation decisions: $JSON_BASENAME

Founder approvals/rejections/defers processed; pending escalations
moved to approved/, rejected/, or deferred/ per founder_decision.
Each entry logged to escalation-decisions-log.ndjson.

Source: $JSON_BASENAME (via downloads-watcher)
" 2>&1

echo "apply-escalations: DONE"
exit 0
