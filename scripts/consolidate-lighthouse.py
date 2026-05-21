#!/usr/bin/env python3
"""Consolidate per-page Lighthouse JSON reports into a single summary.

Reads .claude/state/aggregates/lighthouse/*.json (one per page run) and
emits .claude/state/aggregates/lighthouse-scores.json with averaged scores
across all sampled pages, plus the per-page breakdown.

Consumed by scripts/aggregate-app-health.py for A4/A8/A9 scoring.
"""
from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
LH_DIR = ROOT / ".claude" / "state" / "aggregates" / "lighthouse"
OUT = ROOT / ".claude" / "state" / "aggregates" / "lighthouse-scores.json"

pages: dict[str, dict] = {}
totals = {"performance": [], "accessibility": [], "best-practices": [], "seo": []}

for f in sorted(LH_DIR.glob("*.json")):
    if f.name == "lighthouse-scores.json":
        continue
    try:
        d = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        continue
    cats = d.get("categories", {})
    page_scores = {}
    for k in totals:
        v = cats.get(k)
        if v and v.get("score") is not None:
            score = round(v["score"] * 100)
            page_scores[k] = score
            totals[k].append(score)
    if page_scores:
        pages[f.stem] = page_scores

averages = {k: round(sum(v) / len(v)) if v else None for k, v in totals.items()}

summary = {
    "schema_version": "lighthouse-scores-v1",
    "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "pages_sampled": len(pages),
    "pages": pages,
    "averages": averages,
}

OUT.write_text(json.dumps(summary, indent=2), encoding="utf-8")

print(f"Consolidated {len(pages)} pages -> {OUT.relative_to(ROOT)}")
for k, v in averages.items():
    print(f"  {k:18}: {v}")
