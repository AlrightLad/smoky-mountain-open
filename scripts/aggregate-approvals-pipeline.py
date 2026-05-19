#!/usr/bin/env python3
"""Aggregate approvals-pipeline.json from inline regen-dashboard logic.

Per dashboard-completion-spec-2026-05-15.md B3.

Single source of truth: the `approvals_pipeline_status()` function in
scripts/regen-dashboard.py handles the (rich) log parsing + cross-bucket
inbox totaling + consecutive-SKIP detection. This aggregator imports + calls
that function and writes the result to JSON so:

  - The dashboard reads from the inline function (live computation)
  - Other consumers + D4 spec check read from the JSON (cached snapshot)
  - Both reflect the SAME logic — no source drift

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
TARGET = ROOT / ".claude" / "state" / "aggregates" / "approvals-pipeline.json"

SCHEMA_VERSION = "approvals-pipeline-v1.1"


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    spec = importlib.util.spec_from_file_location("rd", str(ROOT / "scripts" / "regen-dashboard.py"))
    rd = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rd)

    result = rd.approvals_pipeline_status()
    # Augment with aggregate-level meta fields
    out = {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "source": "regen-dashboard.approvals_pipeline_status()",
        **result,
    }

    wrote, reason = idempotent_write_json(TARGET, out, ensure_ascii=False)
    print(f"[aggregate-approvals-pipeline] OK status={out.get('status')} summary={(out.get('summary') or '')[:80]} write={wrote} ({reason})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
