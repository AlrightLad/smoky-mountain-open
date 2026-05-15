#!/usr/bin/env python3
"""
Regenerate docs/reports/token-usage.html via data-block swap.

Reads .claude/state/telemetry/aggregates/token-usage-snapshot.json
and swaps the <script id="report-data"> JSON block. Runs the aggregator
first if the snapshot doesn't exist.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / ".claude" / "state" / "telemetry" / "aggregates" / "token-usage-snapshot.json"
TARGET = ROOT / "docs" / "reports" / "token-usage.html"
AGGREGATOR = ROOT / "scripts" / "aggregate-token-usage.py"
PYTHON = sys.executable

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def main():
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if target missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(TARGET)
    if not SNAPSHOT.exists():
        print(f"[regen-token-usage] snapshot missing; running aggregator first")
        try:
            subprocess.run([PYTHON, str(AGGREGATOR)], cwd=str(ROOT), check=False, timeout=30,
                           env={**__import__("os").environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
        except Exception as e:
            print(f"[regen-token-usage] WARN aggregator failed: {e}", file=sys.stderr)
    if not SNAPSHOT.exists():
        print(f"[regen-token-usage] FATAL snapshot still missing after aggregator", file=sys.stderr)
        return 2
    if not TARGET.exists():
        print(f"[regen-token-usage] FATAL target missing: {TARGET}", file=sys.stderr)
        return 2

    data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    html = TARGET.read_text(encoding="utf-8")
    new_json = json.dumps(data, indent=2, default=str)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        print(f"[regen-token-usage] FAIL data-block match count = {count}", file=sys.stderr)
        return 1
    TARGET.write_text(new_html, encoding="utf-8")
    a = data.get("all_time", {})
    print(f"[regen-token-usage] OK   {TARGET.name}")
    print(f"[regen-token-usage] all-time: real={a.get('real')} estimated={a.get('estimated')} manual={a.get('manual')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
