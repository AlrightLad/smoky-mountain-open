#!/usr/bin/env python3
"""
scan-proposal-readiness.py — AMD-011 Step 2 scanner

Evaluates every proposal in .claude/state/proposals/approved/ against
the AMD-009 8-criteria ship-readiness gate (defined in AMD-011's
operating protocol). Writes a marker JSON per deferred proposal to
.claude/state/proposals/ship-readiness-deferred/<PROP-ID>.json with
the specific criteria that failed.

USAGE
    python scripts/scan-proposal-readiness.py
        (full scan; default)

    python scripts/scan-proposal-readiness.py --dry-run
        (prints decisions; does NOT write markers)

EXIT CODES
    0 — scan completed (regardless of how many proposals deferred)
    1 — fatal error (state dir missing, etc.)

The scanner is READ-ONLY against proposal frontmatter; it never edits
proposal files. Resolution of deferred gaps is a separate authoring
step (team or Founder), not the scanner's job.

Per AMD-011 closure deliverable + per Founder's 'PRIORITY 1 — AMD-011
Step 2' authorization 2026-05-14.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
APPROVED_DIR = ROOT / ".claude" / "state" / "proposals" / "approved"
DEFERRED_DIR = ROOT / ".claude" / "state" / "proposals" / "ship-readiness-deferred"
SHIPPED_DIR = ROOT / ".claude" / "state" / "proposals" / "shipped"
EVENTS_DIR = ROOT / ".claude" / "state" / "telemetry" / "events"


# ---------- frontmatter parsing ----------
def parse_frontmatter(text):
    """Extract frontmatter as a dict. Detects JSON vs YAML-ish and parses accordingly.

    Proposals authored under PROPOSAL_LIFECYCLE_v8.2+ use JSON-formatted frontmatter
    (starts with '{'). AMD-NNN amendments use YAML-ish key:value lines. This parser
    handles both — JSON via json.loads (correct nested handling), YAML-ish via the
    legacy line parser (acceptable for flat AMD schemas only).
    """
    m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not m:
        return None
    raw = m.group(1).strip()
    # JSON frontmatter — used by PROP-NNN lifecycle.
    if raw.startswith("{") and raw.endswith("}"):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass  # fall through to YAML-ish; won't help but matches prior behavior
    # YAML-ish line parser (legacy, used by AMD-NNN).
    fm = {}
    for line in raw.split("\n"):
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        k = k.strip()
        v = v.strip()
        if v.startswith('"') and v.endswith('"'):
            v = v[1:-1]
        elif v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
        if v.startswith("[") and v.endswith("]"):
            inner = v[1:-1].strip()
            v = [x.strip().strip('"').strip("'") for x in inner.split(",")] if inner else []
        if v == "null":
            v = None
        fm[k] = v
    return fm


# ---------- AMD-009 8-criteria evaluator ----------
def evaluate_readiness(fm, body):
    """Return list of failure messages. Empty list = READY (8/8 pass)."""
    fails = []

    # P1 — scope bounded and enumerated. Accept any of:
    # files_affected / scope_files_affected / scope (Founder-spec aliases).
    files_affected = (fm.get("files_affected")
                      or fm.get("scope_files_affected")
                      or fm.get("scope"))
    if not files_affected or (isinstance(files_affected, str) and len(files_affected) < 8):
        fails.append("scope_not_enumerated: frontmatter missing files_affected/scope_files_affected/scope with concrete file list")
    elif isinstance(files_affected, list) and len(files_affected) == 0:
        fails.append("scope_not_enumerated: files_affected is empty list")

    # P2 — fallback plan documented. Frontmatter declares 'fallback_plan'
    # OR body contains Plan A/B/C/D structure.
    has_fallback_fm = "fallback_plan" in fm or "plan_b" in fm
    has_fallback_body = bool(re.search(r"plan\s*[ab]\b|fallback", body, re.IGNORECASE))
    if not (has_fallback_fm or has_fallback_body):
        fails.append("fallback_plan_absent: no Plan B/C/D or fallback_plan field documented")

    # P3 — reversible. Frontmatter declares 'rollback_strategy' or 'rollback'.
    if not (fm.get("rollback_strategy") or fm.get("rollback")):
        fails.append("rollback_absent: rollback_strategy/rollback field missing from frontmatter")

    # P4 — no cross-cutting architecture changes. Frontmatter must NOT
    # depend_on unshipped proposals OR unapplied amendments. PROP-* deps
    # check shipped/; AMD-* deps check applied/.
    deps = fm.get("depends_on") or fm.get("dependencies") or []
    if isinstance(deps, str):
        deps = [deps]
    unshipped_deps = []
    if deps:
        shipped_ids = set()
        if SHIPPED_DIR.exists():
            for f in SHIPPED_DIR.glob("*.md"):
                m_sid = re.match(r"(PROP-\d+(?:\.\w+)?)", f.stem)
                if m_sid:
                    shipped_ids.add(m_sid.group(1))
        applied_amd_ids = set()
        applied_dir = ROOT / ".claude" / "state" / "amendments" / "applied"
        if applied_dir.exists():
            for f in applied_dir.glob("AMD-*.md"):
                m_aid = re.match(r"(AMD-\d+(?:\.\w+)?)", f.stem)
                if m_aid:
                    applied_amd_ids.add(m_aid.group(1))
        for d in deps:
            if not d:
                continue
            if d.startswith("PROP-") and d not in shipped_ids:
                unshipped_deps.append(d)
            elif d.startswith("AMD-") and d not in applied_amd_ids:
                unshipped_deps.append(d)
    if unshipped_deps:
        fails.append(f"cross_cutting_dependency: depends on unshipped/unapplied {unshipped_deps}")

    # P5 — round-trip test before/after coverage planned. Accept any of:
    # round_trip_coverage / test_strategy_before_after (Founder-spec) / body mentions.
    has_round_trip = (
        "round_trip_coverage" in fm
        or "round_trip" in fm
        or "test_strategy_before_after" in fm
        or bool(re.search(r"round[- ]?trip|round_trip|tests/round-trip", body, re.IGNORECASE))
    )
    if not has_round_trip:
        fails.append("round_trip_coverage_absent: no round_trip_coverage/test_strategy_before_after field or named test assertions")

    # P6 — bubble approval. Recognizes the PARBAUGHS lifecycle statuses:
    #   "approved" — unanimous pass
    #   "approved-with-dissent" — passed with documented dissent; valid approval
    #   "closed-by-founder-directive" — Founder closure; valid approval
    #   "open" / "rejected" — not approved; fail P6
    # Per AMD-009 P6 'unanimous high confidence' interpreted in PARBAUGHS context:
    # the bubble's CLOSURE STATE (status) is the authoritative signal; vote_tally
    # is informational. Founder-ratified approval-with-dissent IS approved.
    bubble = fm.get("bubble_of_record") or fm.get("originating_bubble")
    if bubble and bubble != "null":
        bubble_path = ROOT / ".claude" / "state" / "discussion-bubbles" / f"{bubble}.md"
        if bubble_path.exists():
            btext = bubble_path.read_text(encoding="utf-8")
            mb = re.match(r"^---\n(.*?)\n---", btext, re.DOTALL)
            if mb:
                try:
                    bdata = json.loads(mb.group(1))
                    status = bdata.get("status", "")
                    accepted_states = ("approved", "approved-with-dissent", "closed-by-founder-directive")
                    if status not in accepted_states:
                        fails.append(f"bubble_not_approved: {bubble} status={status!r} (expected one of {accepted_states})")
                except Exception:
                    pass

    # P7 — frontmatter declares all of the above explicitly. Accept Founder-spec
    # field-name aliases (introduced post-AMD-009). Each conceptual gate has
    # multiple acceptable field names; P7 is satisfied if ANY of each group exists.
    fm_required_aliases = {
        "scope":         ("files_affected", "scope_files_affected", "scope"),
        "fallback":      ("fallback_plan", "fallback_a"),
        "rollback":      ("rollback_strategy", "rollback"),
        "round_trip":    ("round_trip_coverage", "test_strategy_before_after"),
        "token_cost":    ("token_cost_estimate", "cost_tokens", "estimate_tokens"),
    }
    fm_missing = [group for group, aliases in fm_required_aliases.items()
                  if not any(fm.get(a) for a in aliases)]
    if not fails and fm_missing:
        fails.append(f"frontmatter_sparse: required field groups missing {fm_missing} (P7 declares-everything-explicitly)")

    # P8 — token-cost estimate has documented methodology. Accept any of:
    # token_cost_estimate / cost_tokens (Founder-spec, dict with low/high/methodology) /
    # estimate_tokens. Dict with methodology field passes; single number fails.
    tce = (fm.get("token_cost_estimate")
           or fm.get("cost_tokens")
           or fm.get("estimate_tokens"))
    if tce is None:
        fails.append("token_cost_methodology_absent: no token_cost_estimate/cost_tokens field with documented range/methodology")
    elif isinstance(tce, dict):
        # Founder-spec shape: {low, high, methodology}. Methodology must be present.
        if not tce.get("methodology") and not (tce.get("low") and tce.get("high")):
            fails.append("token_cost_methodology_absent: cost_tokens dict missing methodology or low/high range")
    elif isinstance(tce, (int, str)):
        if not re.search(r"range|-|to|methodology|low|high", str(tce), re.IGNORECASE):
            if str(tce).replace(",", "").replace("k", "").replace("M", "").replace(".", "").isdigit():
                fails.append("token_cost_methodology_absent: estimate is a single number without methodology/range")

    return fails


# ---------- per-proposal scan ----------
def scan_proposal(path):
    """Returns (prop_id, criteria_failed_list)."""
    text = path.read_text(encoding="utf-8")
    fm = parse_frontmatter(text) or {}
    body = text[text.find("---", 3) + 3:] if "---" in text[3:] else text
    # Extract PROP-NNN or PROP-NNN.suffix from filename
    # e.g. 'PROP-001-foo.md' -> 'PROP-001'; 'PROP-003.a-foo.md' -> 'PROP-003.a'
    m_id = re.match(r"(PROP-\d+(?:\.\w+)?)", path.stem)
    prop_id = fm.get("id") or (m_id.group(1) if m_id else path.stem)
    fails = evaluate_readiness(fm, body)
    return prop_id, fails


# ---------- marker write ----------
def write_deferred_marker(prop_id, criteria_failed, dry_run=False):
    DEFERRED_DIR.mkdir(parents=True, exist_ok=True)
    marker = DEFERRED_DIR / f"{prop_id}.json"
    payload = {
        "proposal_id": prop_id,
        "deferred_at": datetime.now(timezone.utc).isoformat(),
        "criteria_failed": criteria_failed,
        "resolution_path": "team or Founder authors missing fields; scanner re-evaluates next cycle",
        "scanner_run_id": datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
    }
    if dry_run:
        print(f"  [DRY-RUN] would write {marker.relative_to(ROOT)}")
        return
    marker.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def clear_marker(prop_id, dry_run=False):
    marker = DEFERRED_DIR / f"{prop_id}.json"
    if marker.exists():
        if dry_run:
            print(f"  [DRY-RUN] would clear {marker.relative_to(ROOT)}")
        else:
            marker.unlink()


def emit_event(event_type, data):
    """Emit a telemetry event so the auto-execute trigger can pick up."""
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc)
    target = EVENTS_DIR / f"{now.date().isoformat()}.ndjson"
    payload = {"event_type": event_type, "timestamp": now.isoformat(), "data": data}
    with open(target, "a", encoding="utf-8", newline="") as f:
        f.write(json.dumps(payload) + "\n")


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    if not APPROVED_DIR.exists():
        print(f"FATAL: {APPROVED_DIR.relative_to(ROOT)} does not exist", file=sys.stderr)
        return 1

    DEFERRED_DIR.mkdir(parents=True, exist_ok=True)

    approved = sorted(APPROVED_DIR.glob("PROP-*.md"))
    print(f"[scan-proposal-readiness] scanning {len(approved)} approved proposals...")

    ready = []
    deferred = []
    for path in approved:
        prop_id, fails = scan_proposal(path)
        if not fails:
            ready.append(prop_id)
            clear_marker(prop_id, dry_run=args.dry_run)
            if not args.dry_run:
                emit_event("proposal.readiness.ready", {"proposal_id": prop_id, "criteria_passed": 8})
            print(f"  ✓ READY    {prop_id}")
        else:
            deferred.append((prop_id, fails))
            write_deferred_marker(prop_id, fails, dry_run=args.dry_run)
            if not args.dry_run:
                emit_event("proposal.readiness.deferred", {
                    "proposal_id": prop_id, "criteria_failed": fails,
                })
            print(f"  ✗ DEFERRED {prop_id}: {len(fails)} criteria failed")
            for f in fails:
                print(f"      - {f}")

    print(f"\n[scan-proposal-readiness] summary: {len(ready)} ready, {len(deferred)} deferred")
    if args.dry_run:
        print("[scan-proposal-readiness] DRY-RUN: no markers written, no events emitted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
