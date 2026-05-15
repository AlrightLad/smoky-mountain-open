#!/usr/bin/env python3
"""Write .claude/state/heartbeats/regen-all-last-pass.json on successful regen.

Per dashboard-completion-spec-2026-05-15.md PHASE I polish.

Called at end of regen-all.sh after all regen + round-trip-test pass.
The heartbeat is consumed by:
  - aggregate-test-health.py (computes status from heartbeat age)
  - regen-dashboard.last_regen_all_status() (round-trip last pass banner)

Writes minimal JSON: timestamp, status, head_sha, age_minutes (0 at write).

Exit 0 always (heartbeat write is best-effort; failure shouldn't block
regen).
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / ".claude" / "state" / "heartbeats" / "regen-all-last-pass.json"


def git_head_short():
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, cwd=str(ROOT), timeout=5)
        return r.stdout.strip() if r.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def main():
    import os
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    status = os.environ.get("HEARTBEAT_STATUS", "PASS")
    out = {
        "ts": now,
        "timestamp": now,
        "generated_at": now,
        "status": status,
        "age_minutes": 0,
        "head_sha": git_head_short(),
    }
    try:
        TARGET.parent.mkdir(parents=True, exist_ok=True)
        TARGET.write_text(json.dumps(out, indent=2), encoding="utf-8")
        print(f"[write-regen-heartbeat] OK ts={now}")
    except OSError as exc:
        print(f"[write-regen-heartbeat] WARN failed: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
