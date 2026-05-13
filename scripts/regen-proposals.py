#!/usr/bin/env python3
"""
Regenerate docs/reports/proposals.html via data-block swap with the
5-state schema per PROPOSAL_LIFECYCLE_v8.2:

    {
      "proposals": {
        "pending":  [...],
        "approved": [...],
        "deferred": [...],
        "shipped":  [...],   # last 50 (full archive linked)
        "rejected": [...]    # last 50
      },
      "counts": {
        "pending":  N,
        "approved": N,
        "deferred": N,
        "shipped_total":  N,  # includes beyond last 50
        "rejected_total": N
      }
    }

Runs `scripts/scan-shipped-proposals.py` FIRST so any newly-shipped
proposals are detected before the regen reads `approved/` and `shipped/`.

The legacy `scripts/dry-run-regen-ops-views.py` still regenerates
discussion-bubbles.html and activity.html. This script owns proposals.html
exclusively going forward.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
PROPOSALS = STATE / "proposals"
TARGET = ROOT / "docs" / "reports" / "proposals.html"
SCAN_SCRIPT = ROOT / "scripts" / "scan-shipped-proposals.py"
PYTHON = sys.executable

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

ARCHIVE_DISPLAY_CAP = 50  # last N shipped/rejected shown inline


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---", body, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def read_bucket(name: str):
    d = PROPOSALS / name
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob("*.md")):
        data = read_frontmatter(f)
        if data is None:
            continue
        out.append(data)
    return out


def sort_key_for(name: str):
    if name == "shipped":
        return lambda p: p.get("shipped_at") or p.get("created_at") or ""
    if name == "rejected":
        return lambda p: p.get("rejected_at") or p.get("created_at") or ""
    if name == "deferred":
        return lambda p: p.get("deferred_at") or p.get("created_at") or ""
    if name == "approved":
        return lambda p: p.get("approved_at") or p.get("created_at") or ""
    return lambda p: p.get("created_at") or ""


def run_scan():
    if not SCAN_SCRIPT.exists():
        print(f"[regen-proposals] WARN scan script missing: {SCAN_SCRIPT}", file=sys.stderr)
        return
    try:
        r = subprocess.run([PYTHON, str(SCAN_SCRIPT)], cwd=str(ROOT), capture_output=True, text=True, timeout=30,
                           env={**dict(__import__("os").environ), "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"})
        for line in (r.stdout or "").splitlines():
            print("  [scan] " + line)
        if r.returncode != 0:
            print("[regen-proposals] WARN scan-shipped-proposals exited with non-zero", file=sys.stderr)
            if r.stderr:
                print("    " + r.stderr, file=sys.stderr)
    except Exception as e:
        print(f"[regen-proposals] WARN scan-shipped-proposals failed: {e}", file=sys.stderr)


def swap_data_block(html_path: Path, new_data: dict):
    if not html_path.exists():
        return False, f"file missing: {html_path}"
    html = html_path.read_text(encoding="utf-8")
    new_json = json.dumps(new_data, indent=2)
    new_html, count = DATA_BLOCK_RE.subn(
        lambda m: m.group(1) + new_json + m.group(3), html, count=1
    )
    if count != 1:
        return False, f"data block match count = {count}"
    html_path.write_text(new_html, encoding="utf-8")
    return True, None


def main():
    print("[regen-proposals] running shipped-scan first...")
    run_scan()

    buckets = {
        "pending":  read_bucket("pending"),
        "approved": read_bucket("approved"),
        "deferred": read_bucket("deferred"),
        "shipped":  read_bucket("shipped"),
        "rejected": read_bucket("rejected"),
    }
    for name in buckets:
        buckets[name].sort(key=sort_key_for(name), reverse=True)

    counts = {
        "pending":         len(buckets["pending"]),
        "approved":        len(buckets["approved"]),
        "deferred":        len(buckets["deferred"]),
        "shipped_total":   len(buckets["shipped"]),
        "rejected_total":  len(buckets["rejected"]),
    }
    # Cap shipped/rejected at 50 in the inline view; total counts already captured above
    display = dict(buckets)
    display["shipped"]  = buckets["shipped"][:ARCHIVE_DISPLAY_CAP]
    display["rejected"] = buckets["rejected"][:ARCHIVE_DISPLAY_CAP]

    data_block = {
        "proposals": display,
        "counts": counts,
        "as_of": datetime.now(timezone.utc).isoformat(),
        "schema_version": 2,
        "archive_display_cap": ARCHIVE_DISPLAY_CAP,
    }

    ok, err = swap_data_block(TARGET, data_block)
    if ok:
        print(f"[regen-proposals] OK   {TARGET.name}")
        print(f"[regen-proposals] counts: pending={counts['pending']} approved={counts['approved']} "
              f"deferred={counts['deferred']} shipped={counts['shipped_total']} rejected={counts['rejected_total']}")
        return 0
    print(f"[regen-proposals] FAIL {TARGET.name}: {err}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
