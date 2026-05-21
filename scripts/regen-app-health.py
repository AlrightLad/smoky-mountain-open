#!/usr/bin/env python3
"""Regenerate docs/reports/app-health.html via data-block swap.

Source of truth: .claude/state/aggregates/app-health.json (produced by
scripts/aggregate-app-health.py).

The HTML template embeds an empty <script id="report-data" type="application/
json">{}</script>. This script swaps the {} for the current app-health.json
content. The page JS reads it at runtime.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "app-health.html"
DATA_SOURCE = ROOT / ".claude" / "state" / "aggregates" / "app-health.json"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def main() -> int:
    if not DASHBOARD.exists():
        sys.stderr.write(
            f"[regen-app-health] FATAL: {DASHBOARD.relative_to(ROOT)} missing — run scaffold first\n"
        )
        return 2
    if not DATA_SOURCE.exists():
        sys.stderr.write(
            f"[regen-app-health] FATAL: {DATA_SOURCE.relative_to(ROOT)} missing — run aggregate-app-health.py first\n"
        )
        return 2

    data = json.loads(DATA_SOURCE.read_text(encoding="utf-8"))
    html = DASHBOARD.read_text(encoding="utf-8")
    new_block = json.dumps(data, indent=2, ensure_ascii=False)

    def _repl(m: re.Match) -> str:
        return m.group(1) + new_block + m.group(3)

    new_html, count = DATA_BLOCK_RE.subn(_repl, html, count=1)
    if count == 0:
        sys.stderr.write(
            "[regen-app-health] FATAL: report-data block not found in app-health.html\n"
        )
        return 2
    DASHBOARD.write_text(new_html, encoding="utf-8")
    print(
        f"[regen-app-health] OK  overall={data.get('overall_grade')} ({data.get('overall_score')}) "
        f"· {len(data.get('dimensions', {}))} dimensions · {DASHBOARD.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
