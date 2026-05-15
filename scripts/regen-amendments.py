#!/usr/bin/env python3
"""
Regenerate docs/reports/amendments.html via data-block swap with the
5-state amendments lifecycle schema:

    {
      "amendments": {
        "pending":   [...],
        "approved":  [...],
        "deferred":  [...],
        "applied":   [...],   # last 50 (full archive linked)
        "rejected":  [...]    # last 50
      },
      "counts": {
        "pending":         N,
        "approved":        N,
        "deferred":        N,
        "applied_total":   N,
        "rejected_total":  N
      }
    }

Mirrors regen-proposals.py structure. Reads AMD-NNN frontmatter from
.claude/state/amendments/<state>/ directories. Each frontmatter has:
id, title, target_canonical_path, source_draft_path, scope_summary,
type, section_anchor, depends_on, authored_by, authored_at,
bubble_of_record, estimate_tokens_to_apply, rollback_strategy, status,
plus per-state timestamp (applied_at / deferred_at / rejected_at).

The bare-template state of the data block (empty arrays + zero counts)
gets surfaced when the script first runs against an empty lifecycle.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
AMENDMENTS = STATE / "amendments"
TARGET = ROOT / "docs" / "reports" / "amendments.html"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

ARCHIVE_DISPLAY_CAP = 50  # last N applied/rejected shown inline


def read_frontmatter(path: Path):
    """Read AMD frontmatter (YAML-ish) from a markdown file."""
    body = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---", body, re.DOTALL)
    if not m:
        return None
    fm = {}
    for line in m.group(1).split("\n"):
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k = k.strip()
        v = v.strip()
        # Strip surrounding quotes
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        if v == "null":
            v = None
        elif v in ("true", "True"):
            v = True
        elif v in ("false", "False"):
            v = False
        # Inline list: [a, b, c]
        elif v.startswith("[") and v.endswith("]"):
            inner = v[1:-1].strip()
            if not inner:
                v = []
            else:
                v = [x.strip().strip('"').strip("'") for x in inner.split(",")]
        fm[k] = v
    # Also extract body summary (first 2 lines after frontmatter) for card preview
    body_after = body[m.end():].lstrip()
    fm["_body_preview"] = body_after[:400]
    return fm


def read_bucket(name: str):
    d = AMENDMENTS / name
    if not d.exists():
        return []
    out = []
    for f in sorted(d.glob("AMD-*.md")):
        data = read_frontmatter(f)
        if data is None:
            continue
        # Inject the filename so the UI can construct an "open draft" link
        data["_filename"] = f.name
        out.append(data)
    return out


def sort_key_for(name: str):
    if name == "applied":
        return lambda a: a.get("applied_at") or a.get("authored_at") or ""
    if name == "rejected":
        return lambda a: a.get("rejected_at") or a.get("authored_at") or ""
    if name == "deferred":
        return lambda a: a.get("deferred_at") or a.get("authored_at") or ""
    if name == "approved":
        return lambda a: a.get("approved_at") or a.get("authored_at") or ""
    # pending: by AMD ID ascending (oldest-first read order)
    return lambda a: a.get("id") or ""


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
    # R1 (2026-05-15): scaffold-or-bail. Self-heal if target missing.
    from _dashboard_bootstrap import ensure_scaffold
    ensure_scaffold(TARGET)
    buckets = {
        "pending":  read_bucket("pending"),
        "approved": read_bucket("approved"),
        "deferred": read_bucket("deferred"),
        "applied":  read_bucket("applied"),
        "rejected": read_bucket("rejected"),
    }
    # pending sorted by AMD ID ascending; others by terminal-state timestamp descending
    buckets["pending"].sort(key=sort_key_for("pending"))
    for name in ("approved", "deferred", "applied", "rejected"):
        buckets[name].sort(key=sort_key_for(name), reverse=True)

    counts = {
        "pending":         len(buckets["pending"]),
        "approved":        len(buckets["approved"]),
        "deferred":        len(buckets["deferred"]),
        "applied_total":   len(buckets["applied"]),
        "rejected_total":  len(buckets["rejected"]),
    }
    display = dict(buckets)
    display["applied"]  = buckets["applied"][:ARCHIVE_DISPLAY_CAP]
    display["rejected"] = buckets["rejected"][:ARCHIVE_DISPLAY_CAP]

    data_block = {
        "amendments": display,
        "counts": counts,
        "as_of": datetime.now(timezone.utc).isoformat(),
        "schema_version": 1,
        "archive_display_cap": ARCHIVE_DISPLAY_CAP,
    }

    ok, err = swap_data_block(TARGET, data_block)
    if ok:
        print(f"[regen-amendments] OK   {TARGET.name}")
        print(f"[regen-amendments] counts: pending={counts['pending']} approved={counts['approved']} "
              f"deferred={counts['deferred']} applied={counts['applied_total']} rejected={counts['rejected_total']}")
        return 0
    print(f"[regen-amendments] FAIL {TARGET.name}: {err}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
