#!/usr/bin/env python3
"""
Regenerate docs/reports/main-flows.html via data-block swap.

Source of truth: docs/reports/_assets/main-flows-data.json
Sub-source (for flow status overrides): .claude/state/ship-progress/*.json

Generator-driven per db-2026-05-13-004 binding caveats — never hand-edit
the data block inside the HTML; edit the JSON sidecar + re-run this.

Validation:
- Every flow.path component must exist in columns[].components[]
- Every step.from / step.to component must exist in columns[].components[]
- Every flow has at least 1 step
- Orphan components (in grid but in no flow's path) emit warning, not error
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "docs" / "reports" / "main-flows.html"
DATA_SOURCE = ROOT / "docs" / "reports" / "_assets" / "main-flows-data.json"
SHIP_PROGRESS = ROOT / ".claude" / "state" / "ship-progress"
# Phase 3 iteration 1 (2026-05-14) — flow rail consumes the 62-flow inventory
# alongside the existing architecture grid (columns + flows). Inventory is
# read-only here per stability invariant; this script just projects it into
# the data block.
FLOW_INVENTORY = ROOT / ".claude" / "state" / "main-flows-v2" / "flow-inventory.json"

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)


def load_source():
    if not DATA_SOURCE.exists():
        sys.stderr.write(f"[regen-main-flows] FATAL: source missing at {DATA_SOURCE}\n")
        sys.exit(2)
    return json.loads(DATA_SOURCE.read_text(encoding="utf-8"))


def apply_ship_progress(flows):
    """If a flow's served_by_ships includes a ship whose ship-progress is 'complete',
    upgrade the flow's status to 'shipped-on-current-system'. Defensive: don't
    DOWNgrade explicitly-set statuses.
    """
    if not SHIP_PROGRESS.exists():
        return flows
    complete_ships = set()
    for f in SHIP_PROGRESS.glob("*.json"):
        try:
            s = json.loads(f.read_text(encoding="utf-8"))
            if (s.get("status") or "").lower() == "complete":
                ship_id = s.get("ship_id") or s.get("id")
                if ship_id:
                    complete_ships.add(ship_id)
        except Exception:
            continue
    for fl in flows:
        if fl.get("status") in (None, "planned", "shipping"):
            served = set(fl.get("served_by_ships", []) or [])
            if served and served.issubset(complete_ships):
                fl["status"] = "shipped-on-current-system"
    return flows


def validate(data):
    issues = []
    comp_ids = set()
    for col in data.get("columns", []):
        for c in col.get("components", []):
            comp_ids.add(c["id"])

    referenced = set()
    for fl in data.get("flows", []):
        if not fl.get("steps"):
            issues.append(f"flow {fl.get('id')} has no steps")
        for p in fl.get("path", []):
            referenced.add(p)
            if p not in comp_ids:
                issues.append(f"flow {fl['id']} path references unknown component '{p}'")
        for s in fl.get("steps", []):
            for fk in ("from", "to"):
                v = s.get(fk)
                referenced.add(v)
                if v not in comp_ids:
                    issues.append(f"flow {fl['id']} step {s.get('n')} {fk}='{v}' is unknown component")

    orphans = comp_ids - referenced
    return issues, orphans


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
    ensure_scaffold(DASHBOARD)
    src = load_source()
    src["flows"] = apply_ship_progress(src.get("flows", []))

    issues, orphans = validate(src)
    if issues:
        print(f"[regen-main-flows] VALIDATION FAILED ({len(issues)} issues):")
        for i in issues:
            print(f"  - {i}")
        return 1
    if orphans:
        print(f"[regen-main-flows] WARN: {len(orphans)} orphan components in grid (referenced by no flow's path):")
        for o in sorted(orphans):
            print(f"    {o}")

    # Load the 62-flow inventory (Phase 3 iteration 1)
    flow_rail = []
    rail_counts = {"by_tier": {}, "by_actor": {}, "by_status": {}, "total": 0}
    if FLOW_INVENTORY.exists():
        try:
            inv = json.loads(FLOW_INVENTORY.read_text(encoding="utf-8"))
            for f in inv.get("flows", []):
                entry = {
                    "id": f.get("id"),
                    "name": f.get("name"),
                    "actor": f.get("actor"),
                    "tier": f.get("tier"),
                    "status": f.get("status"),
                    # 2026-05-20 iter3: carry layer + category from inventory
                    # so the new layer toggle + category filter UI works.
                    "layer": f.get("layer") or "app",
                    "category": f.get("category") or "debug",
                    "served_by_ships": f.get("served_by_ships", []),
                    "primary_user_goal": f.get("primary_user_goal", ""),
                    "estimated_steps_count": f.get("estimated_steps_count"),
                }
                flow_rail.append(entry)
                rail_counts["total"] += 1
                for axis_key, axis_dict in (("tier", "by_tier"), ("actor", "by_actor"), ("status", "by_status")):
                    v = f.get(axis_key) or "unknown"
                    rail_counts[axis_dict][v] = rail_counts[axis_dict].get(v, 0) + 1
        except Exception as e:
            print(f"[regen-main-flows] WARN: flow-inventory.json parse failed: {e}")

    # Build the data block — copy validated source + add timestamp + counts
    data_block = {
        "columns": src.get("columns", []),
        "flows": src.get("flows", []),
        "last_amended": datetime.now(timezone.utc).isoformat(),
        "doc_source": str(DATA_SOURCE.relative_to(ROOT)).replace("\\", "/"),
        "schema_version": src.get("schema_version", 1),
        "flow_rail": flow_rail,
        "flow_rail_counts": rail_counts,
        "taxonomy_decision": ".claude/state/main-flows-v2/taxonomy-decision.md",
        "_counts": {
            "columns": len(src.get("columns", [])),
            "components_total": sum(len(c.get("components", [])) for c in src.get("columns", [])),
            "flows": len(src.get("flows", [])),
            "flow_rail_total": len(flow_rail),
            "orphan_components": sorted(list(orphans)),
        },
    }

    ok, err = swap_data_block(DASHBOARD, data_block)
    if ok:
        print(f"[regen-main-flows] OK   {DASHBOARD.name}")
        c = data_block["_counts"]
        print(f"[regen-main-flows] {c['columns']} columns, {c['components_total']} components, {c['flows']} flows; orphans={len(c['orphan_components'])}")
        return 0
    print(f"[regen-main-flows] FAIL {DASHBOARD.name}: {err}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
