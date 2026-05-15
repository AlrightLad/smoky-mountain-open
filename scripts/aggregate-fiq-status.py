#!/usr/bin/env python3
"""Aggregate fiq-status.json — Firebase Index Queue check.

Per dashboard-completion-spec-2026-05-15.md F3.

Reads:
  - firestore.indexes.json (declared local indexes)
  - Optional: a marker file from a recent `firebase firestore:indexes`
    invocation if cached

Method:
  Run `firebase firestore:indexes` and parse output for index count + state.
  If firebase CLI unavailable / not authenticated, fall back to declared-
  count only (with status='unknown').

Writes:
  .claude/state/aggregates/fiq-status.json with:
    timestamp / generated_at
    status (green | yellow | red | unknown)
    summary
    declared_count
    deployed_count (when firebase CLI available)
    pending_builds (when firebase CLI reports any)
    schema_version

Exit 0 always (aggregator failure doesn't block regen).
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEXES_FILE = ROOT / "firestore.indexes.json"
TARGET = ROOT / ".claude" / "state" / "aggregates" / "fiq-status.json"

SCHEMA_VERSION = "fiq-status-v1.0"


def git_head_short():
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, cwd=str(ROOT), timeout=5)
        return r.stdout.strip() if r.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def count_local_indexes():
    if not INDEXES_FILE.exists():
        return None
    try:
        data = json.loads(INDEXES_FILE.read_text(encoding="utf-8"))
        return len(data.get("indexes", []))
    except (OSError, json.JSONDecodeError):
        return None


def _find_firebase_cli():
    """Locate firebase CLI executable across platforms.

    Python subprocess on Windows doesn't expand .cmd extension; explicit
    .cmd path needed when running under PowerShell launcher path. Falls
    back to plain 'firebase' which works under Git Bash / POSIX.
    """
    import shutil
    # First try .cmd (Windows npm shim)
    for candidate in [
        "firebase.cmd",
        "firebase",
    ]:
        p = shutil.which(candidate)
        if p:
            return p
    return "firebase"  # will fail with FileNotFoundError if missing


def deployed_index_count():
    """Run `firebase firestore:indexes` to count deployed. Returns (count, err)."""
    cli = _find_firebase_cli()
    try:
        r = subprocess.run(
            [cli, "firestore:indexes", "--project", "parbaughs",
             "--non-interactive"],
            capture_output=True, text=True, cwd=str(ROOT), timeout=30,
        )
        if r.returncode != 0:
            return None, f"firebase CLI exit {r.returncode}: {r.stderr[:200]}"
        # The output is JSON; count "indexes" entries
        try:
            data = json.loads(r.stdout)
            return len(data.get("indexes", [])), None
        except json.JSONDecodeError:
            # CLI may output ANSI-decorated text; fallback to line count of
            # "collectionGroup" appearances
            count = r.stdout.count("collectionGroup")
            return count, None
    except subprocess.TimeoutExpired:
        return None, "firebase CLI timed out (30s)"
    except FileNotFoundError:
        return None, "firebase CLI not in PATH"
    except Exception as exc:
        return None, f"{exc.__class__.__name__}: {exc}"


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    declared = count_local_indexes()
    deployed, err = deployed_index_count()

    if declared is None:
        status = "unknown"
        summary = "firestore.indexes.json missing or unreadable"
    elif deployed is None:
        status = "unknown"
        summary = f"declared={declared}; deployed-count unknown ({err or 'no firebase CLI access'})"
    elif deployed >= declared:
        # The declared set should be a subset of deployed (deploy
        # auto-creates from declared). Equal-or-more = good.
        status = "green"
        summary = f"FIQ clean · {declared} declared / {deployed} deployed (0 pending builds)"
    elif deployed < declared:
        # Some indexes still building or not yet deployed
        pending = declared - deployed
        status = "yellow"
        summary = f"{pending} index(es) declared but not deployed yet · {deployed}/{declared}"
    else:
        status = "green"
        summary = f"FIQ clean · {declared} indexes"

    out = {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "head_sha": git_head_short(),
        "status": status,
        "summary": summary,
        "declared_count": declared,
        "deployed_count": deployed,
        "pending_builds": (declared - deployed) if (deployed is not None and declared is not None and deployed < declared) else 0,
        "firebase_cli_error": err,
        "source_files": [
            "firestore.indexes.json",
            "firebase firestore:indexes (CLI live query)",
        ],
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"[aggregate-fiq-status] OK status={status} declared={declared} deployed={deployed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
