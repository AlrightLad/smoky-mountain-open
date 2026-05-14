#!/usr/bin/env python3
"""
scripts/generate-flow-paths.py

Generate step paths for F9-F62 in docs/reports/main-flows.html.

Per Founder directive 2026-05-14: every flow in the rail must light
up the architecture grid. F1-F8 have full hand-authored paths.
F9-F62 currently show placeholder "step path not yet authored".
This script generates plausible paths from flow_rail metadata +
architecture component inventory.

Approach: keyword-match flow name → likely client surface, data
targets, fn calls. Compose path: actor → client → (fn) → data →
distribution. Generate 4-6 step entries per flow with reasonable
labels + descriptions.

Quality: less detailed than F1-F8 (which cite specific source
files), but accurate enough for the diagram to light up
representatively for each flow. Founder + design-bot can refine
specific paths in follow-on ships.
"""
import json
import sys
from pathlib import Path

# Iter 16.2 fix: there are TWO sources merged by regen-main-flows.py:
#  - main-flows-data.json holds flows[] (path-rich entries; F1-F8)
#  - .claude/state/main-flows-v2/flow-inventory.json holds flow_rail
#    (62-entry catalog; F1-F62 with metadata but no step paths)
# Generator must read flow_rail from the inventory + write generated
# entries to main-flows-data.json's flows[].
DATA_PATH = Path("docs/reports/_assets/main-flows-data.json")
INVENTORY_PATH = Path(".claude/state/main-flows-v2/flow-inventory.json")


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))

    flow_rail = inventory.get("flow_rail") or inventory.get("flows") or []
    if not flow_rail and isinstance(inventory, list):
        flow_rail = inventory  # raw list-form

    existing_flows = data.get("flows", [])
    existing_ids = {f["id"] for f in existing_flows}

    # Compose new flow entries for unpathed ids
    to_add = []
    for r in flow_rail:
        if r["id"] in existing_ids:
            continue
        flow = _build_flow(r)
        if flow:
            to_add.append(flow)

    if not to_add:
        print("No flows to add.")
        return

    # Append to flows[]
    data["flows"].extend(to_add)

    # Re-serialize + write back to canonical source
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Added {len(to_add)} flow entries to {DATA_PATH}:")
    for f in to_add:
        print(f"  {f['id']:5s} {f['name'][:55]:55s} steps={len(f['steps'])}")
    print("Run scripts/regen-main-flows.py to materialize into HTML.")


def _build_flow(rail_entry):
    """Build a flows[] entry from a flow_rail entry."""
    fid = rail_entry["id"]
    name = rail_entry.get("name", "")
    actor_short = rail_entry.get("actor", "member")
    tier = rail_entry.get("tier", "supplementary")
    status = rail_entry.get("status", "planned")
    served_by = rail_entry.get("served_by_ships", []) or []
    goal = rail_entry.get("primary_user_goal", "")

    # Resolve actor full id
    actor_full = f"actor.{actor_short}" if actor_short in ("member", "commissioner", "founder", "invitee", "guest") else "actor.member"
    # 'system' / 'agent' actors don't exist in actors column; route via founder admin path
    if actor_short in ("system", "agent"):
        actor_full = "actor.founder"

    # Match keywords → components
    lower = (name + " " + goal).lower()

    # Client surface
    client = _match_client(lower, actor_short)

    # Optional Fn
    fn = _match_fn(lower, actor_short)

    # Data targets
    data_targets = _match_data(lower, actor_short)

    # Distribution
    is_mobile = "mobile" in lower or "capacitor" in lower
    dist = "dist.capacitor-android" if is_mobile else "dist.gh-pages"

    # External (optional, last step)
    ext = _match_external(lower)

    # Compose path
    path = [actor_full, client]
    if fn:
        path.append(fn)
    path.extend(data_targets)
    path.append(dist)
    if ext:
        path.append(ext)

    # Dedupe path while preserving order
    seen = set()
    unique_path = []
    for p in path:
        if p not in seen:
            seen.add(p)
            unique_path.append(p)
    path = unique_path

    # Build steps from consecutive path pairs
    steps = []
    for i in range(len(path) - 1):
        steps.append({
            "n": i + 1,
            "from": path[i],
            "to": path[i + 1],
            "label": _step_label(path[i], path[i + 1], name),
            "description": _step_description(path[i], path[i + 1], name, goal),
        })

    return {
        "id": fid,
        "name": name,
        "primary_user_goal": goal,
        "actor": actor_full,
        "served_by_ships": served_by,
        "status": status,
        "path": path,
        "steps": steps,
        "_generated_by": "scripts/generate-flow-paths.py (iter 16, 2026-05-14)",
    }


def _match_client(lower, actor):
    """Pick the primary client surface for the flow."""
    rules = [
        ("range", "client.hq-range"),
        ("drill", "client.hq-range"),
        ("swing analyzer", "client.hq-range"),
        ("training", "client.hq-range"),
        ("trophy", "client.hq-trophy"),
        ("achievement", "client.hq-trophy"),
        ("aces", "client.hq-trophy"),
        ("records", "client.hq-trophy"),
        ("wager", "client.hq-wagers"),
        ("bounty", "client.hq-wagers"),
        ("challenge", "client.hq-wagers"),
        ("scramble", "client.hq-wagers"),
        ("party game", "client.hq-wagers"),
        ("tee time", "client.hq-teetimes"),
        ("calendar", "client.hq-teetimes"),
        ("trip", "client.hq-teetimes"),
        ("event", "client.hq-teetimes"),
        ("settings", "client.hq-settings"),
        ("notification", "client.hq-settings"),
        ("appearance", "client.hq-settings"),
        ("privacy", "client.hq-settings"),
        ("subscription", "client.hq-settings"),
        ("admin", "client.hq-admin"),
        ("commissioner", "client.hq-admin"),
        ("founder", "client.hq-admin"),
        ("crisis", "client.hq-admin"),
        ("token observability", "client.hq-admin"),
        ("invite", "client.hq-admin"),
        ("suspend", "client.hq-admin"),
        ("transfer", "client.hq-admin"),
        ("delete league", "client.hq-admin"),
        ("approve", "client.hq-admin"),
        ("reject member", "client.hq-admin"),
        ("identity", "client.hq-admin"),
        ("grandfather", "client.hq-admin"),
        ("caddy notes", "client.hq-home"),
        ("caddy bot", "client.hq-home"),
        ("activity", "client.hq-feed"),
        ("feed", "client.hq-feed"),
        ("trash talk", "client.hq-feed"),
        ("spotlight", "client.hq-feed"),
        ("victory lap", "client.hq-feed"),
        ("social action", "client.hq-feed"),
        ("dm", "client.hq-feed"),
        ("direct message", "client.hq-feed"),
        ("chat", "client.hq-feed"),
        ("league chat", "client.hq-feed"),
        ("members", "client.hq-members"),
        ("profile", "client.hq-members"),
        ("find a player", "client.hq-members"),
        ("course", "client.hq-leagues"),
        ("leagues", "client.hq-leagues"),
        ("standings", "client.hq-leagues"),
        ("season", "client.hq-leagues"),
        ("multi-league", "client.hq-leagues"),
        ("rich list", "client.hq-leagues"),
        ("round detail", "client.hq-roundhistory"),
        ("round history", "client.hq-roundhistory"),
        ("sync round", "client.hq-roundhistory"),
        ("buy cosmetic", "client.hq-trophy"),
        ("shop", "client.hq-trophy"),
        ("mobile", "client.mobile-capacitor"),
        ("faq", "client.hq-settings"),
        ("rules", "client.hq-settings"),
        ("bug", "client.hq-settings"),
    ]
    for kw, surface in rules:
        if kw in lower:
            return surface
    # Default by actor
    if actor in ("commissioner", "founder"):
        return "client.hq-admin"
    return "client.hq-home"


def _match_fn(lower, actor):
    """Pick an optional cloud function trigger for the flow."""
    if "invite" in lower or "join" in lower:
        if "validate" in lower or "join" in lower:
            return "fn.validate-invite"
    if "suspend" in lower or "transfer" in lower or "role" in lower or "approve" in lower or "reject member" in lower:
        return "fn.on-member-role-change"
    if "delete league" in lower:
        return "fn.on-league-delete"
    if "founder" in lower and ("admin" in lower or "access" in lower):
        return "fn.on-founder-access-log"
    if "course" in lower and "search" in lower:
        return "fn.search-courses"
    if "notification" in lower or "push" in lower:
        return "fn.send-push"
    if "auth" in lower or "signup" in lower or "onboarding" in lower:
        return "fn.auth"
    if "suspension" in lower:
        return "fn.expire-suspensions"
    return None


def _match_data(lower, actor):
    """Pick 1-2 primary data targets for the flow."""
    rules = [
        ("round", "data.rounds"),
        ("wager", "data.wagers-bounties"),
        ("bounty", "data.wagers-bounties"),
        ("challenge", "data.wagers-bounties"),
        ("scramble", "data.wagers-bounties"),
        ("tee time", "data.events"),
        ("trip", "data.events"),
        ("calendar", "data.events"),
        ("event", "data.events"),
        ("course", "data.courses"),
        ("trophy", "data.members"),
        ("achievement", "data.members"),
        ("aces", "data.rounds"),
        ("records", "data.rounds"),
        ("invite", "data.invites"),
        ("dm", "data.dms"),
        ("direct message", "data.dms"),
        ("chat", "data.dms"),
        ("notification", "data.notifications"),
        ("social action", "data.social"),
        ("trash talk", "data.social"),
        ("spotlight", "data.social"),
        ("victory lap", "data.social"),
        ("photo", "data.social"),
        ("parcoin", "data.parcoins"),
        ("buy cosmetic", "data.parcoins"),
        ("shop", "data.parcoins"),
        ("rich list", "data.parcoins"),
        ("leagues", "data.leagues"),
        ("standings", "data.leagues"),
        ("season", "data.leagues"),
        ("multi-league", "data.leagues"),
        ("members", "data.members"),
        ("profile", "data.members"),
        ("settings", "data.members"),
        ("appearance", "data.members"),
        ("privacy", "data.members"),
        ("subscription", "data.members"),
        ("commissioner", "data.members"),
        ("suspend", "data.members"),
        ("transfer", "data.members"),
        ("approve member", "data.members"),
        ("delete league", "data.leagues"),
        ("token observability", "data.config"),
        ("crisis", "data.config"),
        ("caddy notes", "data.config"),
        ("faq", "data.config"),
        ("rules", "data.config"),
        ("bug", "data.config"),
        ("identity", "data.members"),
        ("grandfather", "data.members"),
        ("cron", "data.config"),
        ("heartbeat", "data.config"),
        ("discussion bubble", "data.social"),
        ("proposal", "data.config"),
        ("amendment", "data.config"),
    ]
    matched = []
    for kw, target in rules:
        if kw in lower and target not in matched:
            matched.append(target)
        if len(matched) >= 2:
            break
    if not matched:
        # Fallback by actor
        if actor in ("commissioner", "founder"):
            matched = ["data.members", "data.leagues"]
        else:
            matched = ["data.members"]
    return matched


def _match_external(lower):
    """Optional external service for the flow."""
    if "course" in lower and "search" in lower:
        return "ext.golfcourseapi"
    if "push" in lower or "notification" in lower:
        return "ext.fcm"
    if "weather" in lower:
        return "ext.open-meteo"
    if "swing analyzer" in lower or "ai caddie" in lower or "caddie" in lower:
        return "ext.anthropic"
    return None


def _step_label(from_id, to_id, name):
    """Concise step label."""
    if from_id.startswith("actor.") and to_id.startswith("client."):
        return "Open surface"
    if from_id.startswith("client.") and to_id.startswith("client."):
        return "Navigate"
    if from_id.startswith("client.") and to_id.startswith("fn."):
        return "Invoke function"
    if from_id.startswith("client.") and to_id.startswith("data."):
        return "Read/write data"
    if from_id.startswith("fn.") and to_id.startswith("data."):
        return "Function writes"
    if from_id.startswith("data.") and to_id.startswith("data."):
        return "Cross-collection update"
    if from_id.startswith("data.") and to_id.startswith("dist."):
        return "Serve to client"
    if to_id.startswith("dist."):
        return "Distribute"
    if to_id.startswith("ext."):
        return "External service"
    return "Step"


def _step_description(from_id, to_id, name, goal):
    """Generic step description. Less detail than F1-F8 (which cite source files), but captures the intent."""
    from_label = from_id.split(".", 1)[-1].replace("-", " ")
    to_label = to_id.split(".", 1)[-1].replace("-", " ")
    if from_id.startswith("actor.") and to_id.startswith("client."):
        return f"{name}: user opens {to_label} surface."
    if from_id.startswith("client.") and to_id.startswith("fn."):
        return f"{name}: client invokes {to_label} cloud function."
    if from_id.startswith("client.") and to_id.startswith("data."):
        return f"{name}: client reads/writes {to_label} collection."
    if from_id.startswith("fn.") and to_id.startswith("data."):
        return f"{name}: function writes {to_label}."
    if from_id.startswith("data.") and to_id.startswith("data."):
        return f"{name}: change in {from_label} propagates to {to_label}."
    if to_id.startswith("dist."):
        return f"{name}: state surfaces back to client via {to_label}."
    if to_id.startswith("ext."):
        return f"{name}: external service {to_label} contributes."
    return f"{name}: {from_label} → {to_label}."


if __name__ == "__main__":
    main()
