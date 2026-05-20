#!/usr/bin/env python3
"""Add layer + category fields to every flow in main-flows-data.json.

Founder directive 2026-05-20: redesign main-flows.html so the flow rail filters
into App vs Orchestration layers, with Debug / Ships / Data category buckets.
This script does the data side; the template + regen handle the UI.

Heuristic (auto-categorization, can be hand-overridden per flow later):

  layer:
    - "orch" if actor is actor.founder AND name starts with "Cron" / "Proposal" /
              "Amendments" / "Discussion bubble" / "Founder " platform-admin
    - "orch" if id is F55-F62 (existing convention: substrate/orchestration flows)
    - "app"  otherwise

  category:
    - "ships" if served_by_ships is non-empty AND status in {"shipping", "planned",
              "in-flight"} (i.e., the flow is what's IN the next ship)
    - "data"  if path has >=3 data.* nodes AND path has <=1 fn.* node (data
              lifecycle exploration, not event flow)
    - "debug" otherwise (event/behavior — Janowiak's primary frame)

Run with no args; mutates docs/reports/_assets/main-flows-data.json in place.
Idempotent — re-run after manual overrides keeps explicit values.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "docs" / "reports" / "_assets" / "main-flows-data.json"

ORCH_NAME_PREFIXES = (
    "Cron ",
    "Cron —",
    "Cron —",
    "Proposal lifecycle",
    "Amendments lifecycle",
    "Discussion bubble lifecycle",
)
ORCH_ID_MIN_NUM = 55  # F55+ are orchestration flows per existing data convention

FOUNDER_PLATFORM_ADMIN_KEYWORDS = ("platform admin", "founder — platform")


def derive_layer(flow: dict) -> str:
    """Return 'app' or 'orch' for the flow."""
    explicit = flow.get("layer")
    if explicit in ("app", "orch"):
        return explicit
    fid = flow.get("id", "")
    if fid.startswith("F") and fid[1:].isdigit() and int(fid[1:]) >= ORCH_ID_MIN_NUM:
        return "orch"
    name = (flow.get("name") or "").strip()
    if any(name.startswith(p) for p in ORCH_NAME_PREFIXES):
        return "orch"
    name_lower = name.lower()
    if any(kw in name_lower for kw in FOUNDER_PLATFORM_ADMIN_KEYWORDS):
        return "orch"
    return "app"


def derive_category(flow: dict) -> str:
    """Return 'debug', 'ships', or 'data' for the flow."""
    explicit = flow.get("category")
    if explicit in ("debug", "ships", "data"):
        return explicit
    served = flow.get("served_by_ships") or []
    status = (flow.get("status") or "").lower()
    if served and status in ("shipping", "planned", "in-flight", "in-progress"):
        return "ships"
    path = flow.get("path") or []
    data_nodes = sum(1 for p in path if p.startswith("data."))
    fn_nodes = sum(1 for p in path if p.startswith("fn."))
    if data_nodes >= 3 and fn_nodes <= 1:
        return "data"
    return "debug"


def main() -> int:
    if not DATA.exists():
        sys.stderr.write(f"[categorize-main-flows] FATAL: {DATA} not found\n")
        return 2
    raw = DATA.read_text(encoding="utf-8")
    doc = json.loads(raw)
    flows = doc.get("flows") or []
    if not flows:
        sys.stderr.write("[categorize-main-flows] no flows array\n")
        return 2

    layer_counts: dict[str, int] = {"app": 0, "orch": 0}
    cat_counts: dict[str, int] = {"debug": 0, "ships": 0, "data": 0}
    for flow in flows:
        layer = derive_layer(flow)
        category = derive_category(flow)
        flow["layer"] = layer
        flow["category"] = category
        layer_counts[layer] = layer_counts.get(layer, 0) + 1
        cat_counts[category] = cat_counts.get(category, 0) + 1

    rail = doc.get("flow_rail") or []
    flow_lookup = {f["id"]: f for f in flows}
    for entry in rail:
        target = flow_lookup.get(entry.get("id"))
        if target:
            entry["layer"] = target["layer"]
            entry["category"] = target["category"]

    DATA.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"[categorize-main-flows] tagged {len(flows)} flows\n"
        f"  layer:    app={layer_counts['app']:3d}  orch={layer_counts['orch']:3d}\n"
        f"  category: debug={cat_counts['debug']:3d}  ships={cat_counts['ships']:3d}  data={cat_counts['data']:3d}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
