#!/usr/bin/env python3
"""Aggregate architecture-review.json from inline regen-dashboard logic.

Per dashboard-completion-spec-2026-05-15.md B4.

Single source of truth: the `architecture_review_status()` function in
scripts/regen-dashboard.py. This aggregator imports + calls it and writes
the result to JSON for D4 freshness check + cross-consumer use.

Exit 0 always.
"""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / ".claude" / "state" / "aggregates" / "architecture-review.json"

SCHEMA_VERSION = "architecture-review-v1.1"


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    spec = importlib.util.spec_from_file_location("rd", str(ROOT / "scripts" / "regen-dashboard.py"))
    rd = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rd)

    result = rd.architecture_review_status()
    out = {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "source": "regen-dashboard.architecture_review_status()",
        **result,
    }

    wrote, reason = idempotent_write_json(TARGET, out, ensure_ascii=False)
    print(f"[aggregate-architecture-review] OK status={out.get('status')} summary={(out.get('summary') or '')[:80]} write={wrote} ({reason})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
