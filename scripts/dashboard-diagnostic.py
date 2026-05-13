#!/usr/bin/env python3
"""
Dashboard diagnostic — Step 0 of dashboard-fix-pass.

Captures, for each operational-view HTML file:
  - Last-modified timestamp
  - SHA256 hash
  - First 3 keys of <script id="report-data"> data block content (parsed)

Then cross-checks against on-disk state and produces a report at
.claude/state/wave-zero-dry-run/dashboard-diagnostic.md.
"""
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
REPORTS = ROOT / "docs" / "reports"

DATA_BLOCK_RE = re.compile(
    r'<script id="report-data" type="application/json">(.*?)</script>',
    re.DOTALL,
)

TARGETS = [
    REPORTS / "dashboard.html",
    REPORTS / "activity.html",
    REPORTS / "proposals.html",
    REPORTS / "discussion-bubbles.html",
    REPORTS / "index.html",
]


def file_info(path: Path):
    if not path.exists():
        return {"exists": False}
    body = path.read_bytes()
    sha = hashlib.sha256(body).hexdigest()
    mtime = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).isoformat()
    text = body.decode("utf-8", errors="replace")
    m = DATA_BLOCK_RE.search(text)
    data_block = None
    data_summary = None
    parse_error = None
    if m:
        raw = m.group(1).strip()
        try:
            data = json.loads(raw)
            data_block = data
            if isinstance(data, dict):
                # First 3 keys + counts where applicable
                keys = list(data.keys())[:6]
                data_summary = {
                    k: (
                        f"<list len={len(data[k])}>" if isinstance(data[k], list)
                        else f"<dict keys={list(data[k].keys())[:5]}>" if isinstance(data[k], dict)
                        else data[k]
                    )
                    for k in keys
                }
        except json.JSONDecodeError as e:
            parse_error = str(e)
    return {
        "exists": True,
        "size_bytes": len(body),
        "mtime_utc": mtime,
        "sha256": sha,
        "has_data_block": m is not None,
        "data_block_parse_error": parse_error,
        "data_summary": data_summary,
        "data_full": data_block,
    }


def on_disk_counts():
    counts = {}
    bubbles_dir = STATE / "discussion-bubbles"
    counts["discussion_bubbles_dir_count"] = sum(
        1 for f in bubbles_dir.glob("*.md")
    ) if bubbles_dir.exists() else 0
    counts["discussion_bubbles_ids"] = sorted(
        [f.stem for f in bubbles_dir.glob("*.md")] if bubbles_dir.exists() else []
    )
    proposals_dir = STATE / "proposals" / "pending"
    counts["proposals_pending_count"] = sum(
        1 for f in proposals_dir.glob("*.md")
    ) if proposals_dir.exists() else 0
    counts["proposals_pending_ids"] = sorted(
        [f.stem for f in proposals_dir.glob("*.md")] if proposals_dir.exists() else []
    )
    handoffs_dir = STATE / "handoffs"
    total = 0
    by_folder = {}
    if handoffs_dir.exists():
        for folder in handoffs_dir.iterdir():
            if folder.is_dir():
                n = sum(1 for f in folder.rglob("*.md"))
                if n:
                    by_folder[folder.name] = n
                    total += n
    counts["handoffs_total"] = total
    counts["handoffs_by_folder"] = by_folder
    snapshot = STATE / "telemetry" / "aggregates" / "current-snapshot.json"
    counts["snapshot_exists"] = snapshot.exists()
    if snapshot.exists():
        try:
            s = json.loads(snapshot.read_text(encoding="utf-8"))
            counts["snapshot_aggregate_counts"] = s.get("_aggregate_counts", {})
            counts["snapshot_as_of"] = s.get("as_of")
            counts["snapshot_meter_status"] = s.get("_meter_status")
        except Exception as e:
            counts["snapshot_parse_error"] = str(e)
    return counts


def main():
    print("=" * 70)
    print(f"Dashboard diagnostic — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    file_data = {}
    for t in TARGETS:
        info = file_info(t)
        file_data[t.name] = info
        print(f"\n{t.name}:")
        if not info["exists"]:
            print("  EXISTS=False")
            continue
        print(f"  size={info['size_bytes']:>7} bytes  mtime_utc={info['mtime_utc']}")
        print(f"  sha256={info['sha256']}")
        print(f"  has_data_block={info['has_data_block']}")
        if info["data_block_parse_error"]:
            print(f"  PARSE ERROR: {info['data_block_parse_error']}")
        if info["data_summary"]:
            print("  data summary:")
            for k, v in info["data_summary"].items():
                print(f"    {k}: {v}")

    counts = on_disk_counts()
    print("\n" + "=" * 70)
    print("On-disk state counts")
    print("=" * 70)
    for k, v in counts.items():
        print(f"  {k}: {v}")

    # Cross-check
    print("\n" + "=" * 70)
    print("Cross-check: do dashboard data blocks reflect on-disk state?")
    print("=" * 70)
    findings = []

    db = file_data.get("discussion-bubbles.html", {})
    if db.get("data_full"):
        bubbles_in_data = db["data_full"].get("discussion_bubbles", [])
        on_disk = counts["discussion_bubbles_dir_count"]
        ok = len(bubbles_in_data) == on_disk
        msg = f"discussion-bubbles.html: data={len(bubbles_in_data)} on-disk={on_disk} -> {'OK' if ok else 'MISMATCH'}"
        findings.append(msg)
        print("  " + msg)

    pr = file_data.get("proposals.html", {})
    if pr.get("data_full"):
        proposals_in_data = pr["data_full"].get("proposals", [])
        on_disk = counts["proposals_pending_count"]
        ok = len(proposals_in_data) == on_disk
        msg = f"proposals.html: data={len(proposals_in_data)} on-disk={on_disk} -> {'OK' if ok else 'MISMATCH'}"
        findings.append(msg)
        print("  " + msg)

    ac = file_data.get("activity.html", {})
    if ac.get("data_full"):
        handoffs_in_data = ac["data_full"].get("handoffs", [])
        on_disk = counts["handoffs_total"]
        ok = len(handoffs_in_data) == on_disk
        msg = f"activity.html: data={len(handoffs_in_data)} on-disk={on_disk} -> {'OK' if ok else 'MISMATCH'}"
        findings.append(msg)
        print("  " + msg)

    dh = file_data.get("dashboard.html", {})
    if dh.get("data_full"):
        d = dh["data_full"]
        msg = (
            f"dashboard.html: proposals_pending={d.get('proposals_pending')} on-disk={counts['proposals_pending_count']} | "
            f"recent_handoffs={len(d.get('recent_handoffs', []))} on-disk={counts['handoffs_total']} | "
            f"meter={d.get('_meter_status')}"
        )
        findings.append(msg)
        print("  " + msg)

    # Index.html may not have a data block yet
    ix = file_data.get("index.html", {})
    if not ix.get("has_data_block"):
        findings.append("index.html: NO data block — stale or hand-authored (expected per Founder note)")
        print("  index.html: NO data block — stale or hand-authored (expected per Founder note)")

    return file_data, counts, findings


if __name__ == "__main__":
    file_data, counts, findings = main()
    # Write a JSON dump for follow-up scripts
    out_dir = ROOT / ".claude" / "state" / "wave-zero-dry-run"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "dashboard-diagnostic.json"
    out_path.write_text(
        json.dumps(
            {
                "captured_at": datetime.now(timezone.utc).isoformat(),
                "files": {k: {kk: vv for kk, vv in v.items() if kk != "data_full"} for k, v in file_data.items()},
                "on_disk": counts,
                "findings": findings,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"\nJSON dump: {out_path}")
