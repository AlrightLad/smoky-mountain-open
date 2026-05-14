#!/usr/bin/env python3
"""
Round-trip test: simulate parbaughs-report-generate skill end-to-end.

Steps:
  1. Build a synthetic .claude/state/ tree with telemetry + handoffs + bubbles + proposals
  2. Read source state (mimics what the agent does on heartbeat)
  3. Swap each HTML file's <script id="report-data"> block with new data
  4. Verify output HTML parses, data block is valid JSON, required fields present
  5. Report pass/fail per file

Exits 0 on full pass, non-zero on any failure.

Usage: python3 round-trip-test.py
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST_WORKSPACE = ROOT / "tests" / "round-trip-workspace"
REPORTS_SRC = ROOT / "docs" / "reports"

# Folder → canonical scenario token (per REPORT_HTML_SPEC_v8.1_AMENDMENT.md §amendment.9)
FOLDER_TO_SCENARIO = {
    "cycle-to-cycle":      "cycle-to-cycle",
    "agent-to-agent":      "agent-to-agent",
    "subagent-returns":    "subagent-to-parent",
    "dispatches":          "parent-to-subagent",
    "proactive-to-ship":   "proactive-to-ship",
    "halts":               "halt-to-resume",
    "founder-responses":   "founder-to-agent",
    "discussion-bubbles":  "discussion-bubble-to-caller",
    "cross-ship":          "cross-ship",
    "wave-to-wave":        "wave-to-wave",
    "wave-transitions":    "wave-to-wave",
    "parallel-merge":      "parallel-merge",
}

DATA_BLOCK_RE = re.compile(
    r'(<script id="report-data" type="application/json">\s*)(.*?)(\s*</script>)',
    re.DOTALL,
)

# ---------- ANSI helpers ----------
def green(s):  return f"\033[32m{s}\033[0m"
def red(s):    return f"\033[31m{s}\033[0m"
def cyan(s):   return f"\033[36m{s}\033[0m"
def yellow(s): return f"\033[33m{s}\033[0m"
def bold(s):   return f"\033[1m{s}\033[0m"


# ---------- Fixture seeding ----------
def seed_state(state_root: Path):
    """Build a synthetic .claude/state/ tree representing one heartbeat in mid-W1.S3."""
    if state_root.exists():
        shutil.rmtree(state_root)
    state_root.mkdir(parents=True)

    now = datetime(2026, 5, 13, 4, 0, 0, tzinfo=timezone.utc)

    # --- Telemetry aggregates ---
    aggregates = state_root / "telemetry" / "aggregates"
    aggregates.mkdir(parents=True)
    snapshot = {
        "as_of": now.isoformat(),
        "weekly_tokens": 2_410_000,
        "weekly_cost": 20.12,
        "ships_this_week": 2,
        "halts_this_week": 0,
        "fiq_depth": 3,
        # Phase 6.6: no fictional cap. manual_quota_latest sourced from real
        # manual-quota-log.ndjson; synthetic fixture leaves it None.
        "manual_quota_latest": None,
        "tokens_by_role": {
            "labels": ["Orchestrator", "Engineer", "Critic", "Discussion Bubble", "Design Bot", "End User"],
            "values": [425_000, 990_000, 545_000, 185_000, 152_000, 113_000],
        },
        "token_trend_7d": {
            "labels": ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
            "values": [340_000, 380_000, 290_000, 310_000, 410_000, 360_000, 320_000],
        },
        "cycle_outcomes_7d": {
            "labels": ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"],
            "datasets": [
                {"label": "Complete", "data": [6, 7, 5, 5, 7, 6, 6], "color": "#4a8067"},
                {"label": "Partial",  "data": [1, 0, 2, 1, 0, 1, 1], "color": "#d4a857"},
                {"label": "Halted",   "data": [0, 0, 0, 0, 0, 0, 0], "color": "#9c4a4a"},
            ],
        },
        "recent_ships": [
            {"id": "W1.S1", "title": "Component foundations", "status": "complete",    "tokens": 1_240_000, "cost": 9.85},
            {"id": "W1.S2", "title": "Page chrome + bands",   "status": "complete",    "tokens":   980_000, "cost": 7.92},
            {"id": "W1.S3", "title": "Round flow + scoring",  "status": "in-progress", "tokens":   620_000, "cost": 4.95},
            {"id": "W1.I1", "title": "Test infrastructure",   "status": "complete",    "tokens":   410_000, "cost": 3.21},
            {"id": "W1.I2", "title": "Smoke automation",      "status": "complete",    "tokens":   320_000, "cost": 2.48},
        ],
    }
    (aggregates / "current-snapshot.json").write_text(json.dumps(snapshot, indent=2), encoding="utf-8")

    # --- Handoffs (5 entries across 4 scenarios) ---
    handoffs_root = state_root / "handoffs"
    handoff_files = [
        ("cycle-to-cycle", "20260513-035800-w1s3-impl-handoff.md", {
            "id": "cycle-to-cycle-20260513-035800-w1s3-impl-handoff",
            "from_agent": "engineer",
            "to_agent": "next-cycle",
            "created_at": "2026-05-13T03:58:00Z",
            "cycle_id": "ship-cycle-042",
            "ship_id": "W1.S3",
            "scope_completed": ["Round flow scaffold", "Score input component", "Hole-by-hole navigation"],
            "scope_remaining": ["Putt count widget", "Live HUD pairing", "Tee time linkage"],
            "next_action": "Resume Putt count widget implementation per W1.S3 Vision section 3.2.",
            "blockers": "none",
            "context_required": ["src/pages/playnow.js", "docs/ship-visions/W1.S3.md"],
        }),
        ("agent-to-agent", "20260513-021400-critic-handoff.md", {
            "id": "agent-to-agent-20260513-021400-critic-handoff",
            "from_agent": "critic",
            "to_agent": "engineer",
            "created_at": "2026-05-13T02:14:00Z",
            "cycle_id": "ship-cycle-042",
            "ship_id": "W1.S3",
            "scope_completed": ["Audit of playnow.js diff vs Vision section 3.1"],
            "scope_remaining": ["Engineer applies 3 corrections noted in audit"],
            "next_action": "Apply line 142 type guard, line 218 missing await, line 304 stale state reference.",
            "blockers": "none",
            "context_required": [".claude/state/audits/W1.S3-audit-cycle-042.md"],
        }),
        ("discussion-bubbles", "20260513-014500-scoring-validation-decision.md", {
            "id": "discussion-bubble-to-caller-20260513-014500-scoring-validation",
            "from_agent": "discussion-bubble-orchestrator",
            "to_agent": "engineer",
            "created_at": "2026-05-13T01:45:00Z",
            "cycle_id": "ship-cycle-042",
            "ship_id": "W1.S3",
            "scope_completed": ["Discussion bubble closed: scoring validation approach"],
            "scope_remaining": ["Engineer implements per discussion bubble outcome"],
            "next_action": "Implement write-time hole-par validation against masters config per discussion bubble outcome.",
            "blockers": "none",
            "context_required": [".claude/state/decisions/decision-20260512-0945-w1s3-scoring-validation.md"],
        }),
        ("proactive-to-ship", "proposal-008-to-ship-cycle-042.md", {
            "id": "proactive-to-ship-20260512-111500-css-token-cleanup",
            "from_agent": "proactive-orchestrator",
            "to_agent": "ship-orchestrator",
            "created_at": "2026-05-12T11:15:00Z",
            "cycle_id": "proactive-cycle-008",
            "ship_id": "W1.S3",
            "scope_completed": ["Proposal approved by Founder: consolidate --el-0..4 unused tokens"],
            "scope_remaining": ["Implementation queued for next ship cycle"],
            "next_action": "Schedule Lane 4 token cleanup as part of W1.S3 if budget permits, else defer to W1.S4.",
            "blockers": "none",
            "context_required": [".claude/state/proposals/approved/proposal-008-css-token-cleanup.md"],
        }),
        ("subagent-returns", "ship-cycle-041/end-user-persona-01.md", {
            "id": "subagent-to-parent-20260512-093000-end-user-feedback",
            "from_agent": "end-user-persona",
            "to_agent": "orchestrator",
            "created_at": "2026-05-12T09:30:00Z",
            "cycle_id": "ship-cycle-041",
            "ship_id": "W1.S2",
            "scope_completed": ["UX simulation of band-A drawer interaction"],
            "scope_remaining": ["Orchestrator reviews 2 UX findings"],
            "next_action": "Review End User finding F1 (drawer modal a11y gap) and F2 (sidebar nav order on mobile band).",
            "blockers": "none",
            "context_required": [".claude/state/personas/end-user-W1.S2-report.md"],
        }),
    ]
    for folder, filename, payload in handoff_files:
        fpath = handoffs_root / folder / filename
        fpath.parent.mkdir(parents=True, exist_ok=True)
        body = "---\n" + json.dumps(payload, indent=2) + "\n---\n"
        fpath.write_text(body, encoding="utf-8")

    # --- Discussion bubbles ---
    bubbles = state_root / "discussion-bubbles"
    bubbles.mkdir()
    bubble_specs = [
        ("db-2026-05-12-001.md", {
            "id": "db-2026-05-12-001",
            "topic": "Chart library choice for dashboard.html",
            "claim": "Use Chart.js CDN over hand-rolled SVG for the 3 dashboard charts.",
            "summary": "Approved 4-0-1. Chart.js CDN selected for time-to-ship.",
            "ship_id": "v8-governance",
            "opened_at": "2026-05-12T14:00:00Z",
            "closed_at": "2026-05-12T14:18:00Z",
            "status": "approved",
            "decision": "Chart.js CDN (proceed)",
            "vote_tally": {"approve": 4, "reject": 0, "abstain": 1},
            "messages": [
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "open",       "timestamp": "2026-05-12T14:00:00Z", "content": "Opening bubble. Dashboard needs 3 charts. Options A vs B."},
                {"author": "engineer",                       "role_in_bubble": "voting",     "timestamp": "2026-05-12T14:04:00Z", "content": "CDN is ~60KB, hand-rolled is ~450 LOC.", "vote": "approve"},
                {"author": "performance-load",               "role_in_bubble": "voting",     "timestamp": "2026-05-12T14:07:00Z", "content": "CDN cache amortizes cost.",               "vote": "approve"},
                {"author": "critic",                         "role_in_bubble": "voting",     "timestamp": "2026-05-12T14:10:00Z", "content": "Chart.js a11y is decent OOTB.",          "vote": "approve"},
                {"author": "design-bot",                     "role_in_bubble": "voting",     "timestamp": "2026-05-12T14:14:00Z", "content": "CSS-var theming supported.",            "vote": "approve"},
                {"author": "data-integrity",                 "role_in_bubble": "voting",     "timestamp": "2026-05-12T14:16:00Z", "content": "Outside my lane.",                       "vote": "abstain"},
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "decision",   "timestamp": "2026-05-12T14:18:00Z", "content": "Vote 4-0-1. Approved."},
            ],
        }),
        ("db-2026-05-12-002.md", {
            "id": "db-2026-05-12-002",
            "topic": "Approval persistence: backend vs intent-capture",
            "claim": "Use intent-capture (export JSON + apply script) instead of standing up a backend.",
            "summary": "Approved with dissent (3-1-1). Intent-capture proceeds; data-integrity dissent recorded.",
            "ship_id": "v8.1-operational-views",
            "opened_at": "2026-05-12T19:30:00Z",
            "closed_at": "2026-05-12T19:54:00Z",
            "status": "approved-with-dissent",
            "decision": "Intent-capture (proceed; data-integrity dissent recorded)",
            "vote_tally": {"approve": 3, "reject": 1, "abstain": 1},
            "messages": [
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "open",       "timestamp": "2026-05-12T19:30:00Z", "content": "Opening bubble. Proposals.html durability question."},
                {"author": "engineer",                       "role_in_bubble": "voting",     "timestamp": "2026-05-12T19:33:00Z", "content": "Backend overkill. Intent-capture matches static-arch.", "vote": "approve"},
                {"author": "data-integrity",                 "role_in_bubble": "voting",     "timestamp": "2026-05-12T19:38:00Z", "content": "localStorage not durable.",                              "vote": "reject"},
                {"author": "critic",                         "role_in_bubble": "voting",     "timestamp": "2026-05-12T19:42:00Z", "content": "Durable artifact is the exported JSON.",                  "vote": "approve"},
                {"author": "devil-advocate",                 "role_in_bubble": "bubble-only","timestamp": "2026-05-12T19:45:00Z", "content": "What if Founder forgets to export?"},
                {"author": "engineer",                       "role_in_bubble": "contributing","timestamp": "2026-05-12T19:47:00Z", "content": "beforeunload + persistent banner."},
                {"author": "security",                       "role_in_bubble": "voting",     "timestamp": "2026-05-12T19:50:00Z", "content": "Backend expands attack surface.",                       "vote": "approve"},
                {"author": "performance-load",               "role_in_bubble": "voting",     "timestamp": "2026-05-12T19:52:00Z", "content": "Abstaining; outside lane.",                              "vote": "abstain"},
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "decision",   "timestamp": "2026-05-12T19:54:00Z", "content": "Vote 3-1-1. Approved with dissent."},
            ],
        }),
        ("db-2026-05-13-001.md", {
            "id": "db-2026-05-13-001",
            "topic": "Rename bubble → discussion bubble across governance",
            "claim": "Rename improves Founder readability; deterministic script low risk.",
            "summary": "Approved 3-0-0. Rename script + cleanup pass + residual audit.",
            "ship_id": "v8.1-operational-views",
            "opened_at": "2026-05-13T13:00:00Z",
            "closed_at": "2026-05-13T13:08:00Z",
            "status": "approved",
            "decision": "Proceed with deterministic rename script + cleanup pass",
            "vote_tally": {"approve": 3, "reject": 0, "abstain": 0},
            "messages": [
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "open",     "timestamp": "2026-05-13T13:00:00Z", "content": "Opening bubble. Founder requested bubble → discussion bubble rename."},
                {"author": "engineer",                       "role_in_bubble": "voting",   "timestamp": "2026-05-13T13:02:00Z", "content": "Deterministic sed-style script handles it. 166 replacements.",      "vote": "approve"},
                {"author": "critic",                         "role_in_bubble": "voting",   "timestamp": "2026-05-13T13:04:00Z", "content": "Audit-first: residual grep after the rename.",                      "vote": "approve"},
                {"author": "devil-advocate",                 "role_in_bubble": "bubble-only","timestamp": "2026-05-13T13:05:30Z","content": "What about hardcoded regex consumers downstream?"},
                {"author": "data-integrity",                 "role_in_bubble": "voting",   "timestamp": "2026-05-13T13:07:00Z", "content": "No external consumers yet — agents not loose.",                      "vote": "approve"},
                {"author": "discussion-bubble-orchestrator", "role_in_bubble": "decision", "timestamp": "2026-05-13T13:08:00Z", "content": "Vote 3-0-0. Approved."},
            ],
        }),
    ]
    for filename, payload in bubble_specs:
        body = "---\n" + json.dumps(payload, indent=2) + "\n---\n"
        (bubbles / filename).write_text(body, encoding="utf-8")

    # --- Proposals (pending) ---
    proposals = state_root / "proposals" / "pending"
    proposals.mkdir(parents=True)
    proposal_specs = [
        ("PROP-008.md", {
            "id": "PROP-008",
            "title": "Consolidate unused elevation/easing tokens",
            "lane": "Lane 4 — Code Quality",
            "rationale": "v8.9.0 left --el-0..4 and --ease-standard defined-but-unconsumed.",
            "scope": "Audit src/styles/, alias or delete unused tokens, migrate consumers.",
            "estimate_tokens": 18000,
            "files_affected": ["src/styles/base.css", "src/styles/components.css"],
            "ship_target": "W1.S4",
        }),
        ("PROP-009.md", {
            "id": "PROP-009",
            "title": "Extract page-helpers from home.js",
            "lane": "Lane 4 — Code Quality",
            "rationale": "renderPageFooter, showRivalryDetail, doCopy, doRestore live in home.js but are imported by 11+ pages.",
            "scope": "Create src/core/page-helpers.js, move helpers, update imports.",
            "estimate_tokens": 24000,
            "files_affected": ["src/pages/home.js", "src/core/page-helpers.js", "src/pages/*.js (11 import updates)"],
            "ship_target": "W1.S4",
        }),
    ]
    for filename, payload in proposal_specs:
        body = "---\n" + json.dumps(payload, indent=2) + "\n---\n\n## Body\n\nDetails would live here.\n"
        (proposals / filename).write_text(body, encoding="utf-8")

    print(green(f"  ✓ Seeded {len(handoff_files)} handoffs, {len(bubble_specs)} discussion bubbles, {len(proposal_specs)} proposals"))


# ---------- Generator simulation ----------
def read_handoffs(state_root: Path):
    """Walk handoffs/*/* and translate folder → canonical scenario token."""
    out = []
    handoffs_root = state_root / "handoffs"
    for folder_path in sorted(handoffs_root.iterdir()):
        if not folder_path.is_dir():
            continue
        scenario = FOLDER_TO_SCENARIO.get(folder_path.name)
        if scenario is None:
            print(red(f"  ✗ Unknown handoff folder (no scenario mapping): {folder_path.name}"))
            sys.exit(2)
        for f in sorted(folder_path.rglob("*.md")):
            body = f.read_text(encoding="utf-8")
            m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
            if not m:
                continue
            payload = json.loads(m.group(1))
            payload["scenario"] = scenario
            out.append(payload)
    out.sort(key=lambda h: h["created_at"], reverse=True)
    return out


def read_bubbles(state_root: Path):
    out = []
    for f in sorted((state_root / "discussion-bubbles").iterdir()):
        if not f.name.endswith(".md"):
            continue
        body = f.read_text(encoding="utf-8")
        m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
        if not m:
            continue
        out.append(json.loads(m.group(1)))
    out.sort(key=lambda b: b["opened_at"], reverse=True)
    return out


def read_proposals(state_root: Path):
    out = []
    for f in sorted((state_root / "proposals" / "pending").iterdir()):
        if not f.name.endswith(".md"):
            continue
        body = f.read_text(encoding="utf-8")
        m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
        if not m:
            continue
        out.append(json.loads(m.group(1)))
    return out


def read_snapshot(state_root: Path):
    return json.loads((state_root / "telemetry" / "aggregates" / "current-snapshot.json").read_text(encoding="utf-8"))


def build_dashboard_data(state_root: Path):
    snap = read_snapshot(state_root)
    handoffs = read_handoffs(state_root)
    proposals = read_proposals(state_root)
    return {
        "weekly_tokens": snap["weekly_tokens"],
        "weekly_cost": snap["weekly_cost"],
        "ships_this_week": snap["ships_this_week"],
        "proposals_pending": len(proposals),
        "halts_this_week": snap["halts_this_week"],
        "fiq_depth": snap["fiq_depth"],
        "manual_quota_latest": snap.get("manual_quota_latest"),
        "tokens_by_role": snap["tokens_by_role"],
        "token_trend_7d": snap["token_trend_7d"],
        "cycle_outcomes_7d": snap["cycle_outcomes_7d"],
        "recent_handoffs": [
            {"scenario": h["scenario"], "from": h["from_agent"], "to": h["to_agent"], "created_at": h["created_at"]}
            for h in handoffs[:5]
        ],
        "recent_ships": snap["recent_ships"],
    }


def build_activity_data(state_root: Path):
    handoffs = read_handoffs(state_root)
    agents = sorted({h["from_agent"] for h in handoffs} | {h["to_agent"] for h in handoffs})
    ships = sorted({h["ship_id"] for h in handoffs if h.get("ship_id")})
    return {"handoffs": handoffs, "agents": agents, "ships": ships}


def build_bubbles_data(state_root: Path):
    bubbles = read_bubbles(state_root)
    return {"discussion_bubbles": bubbles}


def build_proposals_data(state_root: Path):
    proposals = read_proposals(state_root)
    return {"proposals": proposals}


def swap_data_block(html_path: Path, new_data: dict):
    """Surgical replacement of <script id="report-data"> block contents per skill spec."""
    if not html_path.exists():
        return False, f"file not found: {html_path}"
    html = html_path.read_text(encoding="utf-8")
    new_json = json.dumps(new_data, indent=2)
    replacement = lambda m: m.group(1) + new_json + m.group(3)
    new_html, count = DATA_BLOCK_RE.subn(replacement, html, count=1)
    if count != 1:
        return False, f"data block not matched (count={count})"
    html_path.write_text(new_html, encoding="utf-8")
    return True, None


# ---------- Verification ----------
def verify_html(html_path: Path, required_keys: list):
    """Verify HTML can be re-read, data block parses as JSON, required keys present."""
    html = html_path.read_text(encoding="utf-8")
    m = DATA_BLOCK_RE.search(html)
    if not m:
        return False, "data block not found post-write"
    raw = m.group(2)
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        return False, f"data block not valid JSON: {e}"
    missing = [k for k in required_keys if k not in data]
    if missing:
        return False, f"required keys missing: {missing}"
    # Basic HTML integrity: ensure no truncation
    if not html.rstrip().endswith("</html>"):
        return False, "HTML does not end with </html>"
    return True, None


# ---------- Main ----------
def main():
    print(bold(cyan("\n=== PARBAUGHS v8.1 Round-Trip Test ===\n")))

    if TEST_WORKSPACE.exists():
        shutil.rmtree(TEST_WORKSPACE)
    TEST_WORKSPACE.mkdir(parents=True)

    # Copy report templates into test workspace so we don't mutate the originals during the test
    test_reports = TEST_WORKSPACE / "docs" / "reports"
    test_reports.mkdir(parents=True)
    for src in REPORTS_SRC.iterdir():
        dst = test_reports / src.name
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)

    state_root = TEST_WORKSPACE / ".claude" / "state"
    print(cyan("[1/4] Seeding synthetic state tree..."))
    seed_state(state_root)

    print(cyan("\n[2/4] Reading source state..."))
    dashboard_data = build_dashboard_data(state_root)
    activity_data = build_activity_data(state_root)
    bubbles_data = build_bubbles_data(state_root)
    proposals_data = build_proposals_data(state_root)

    print(green(f"  ✓ Dashboard: {dashboard_data['proposals_pending']} pending proposals, {len(dashboard_data['recent_handoffs'])} recent handoffs"))
    print(green(f"  ✓ Activity:  {len(activity_data['handoffs'])} handoffs across {len({h['scenario'] for h in activity_data['handoffs']})} scenarios"))
    print(green(f"  ✓ Bubbles:   {len(bubbles_data['discussion_bubbles'])} discussion bubbles"))
    print(green(f"  ✓ Proposals: {len(proposals_data['proposals'])} pending"))

    print(cyan("\n[3/4] Swapping data blocks in HTML..."))
    targets = [
        (test_reports / "dashboard.html",          dashboard_data, ["weekly_tokens", "tokens_by_role", "recent_handoffs", "recent_ships"]),
        (test_reports / "activity.html",           activity_data,  ["handoffs", "agents", "ships"]),
        (test_reports / "discussion-bubbles.html", bubbles_data,   ["discussion_bubbles"]),
        (test_reports / "proposals.html",          proposals_data, ["proposals"]),
    ]
    failures = []
    for html_path, data, _ in targets:
        ok, err = swap_data_block(html_path, data)
        if ok:
            size = html_path.stat().st_size
            print(green(f"  ✓ {html_path.name:32s} swap OK ({size:,} bytes)"))
        else:
            print(red(f"  ✗ {html_path.name:32s} swap FAILED: {err}"))
            failures.append((html_path.name, err))

    print(cyan("\n[4/4] Verifying outputs..."))
    for html_path, _, required_keys in targets:
        ok, err = verify_html(html_path, required_keys)
        if ok:
            print(green(f"  ✓ {html_path.name:32s} valid HTML + valid JSON + required keys present"))
        else:
            print(red(f"  ✗ {html_path.name:32s} verify FAILED: {err}"))
            failures.append((html_path.name, err))

    # Discussion-bubbles deep check: every bubble has messages, status is canonical
    print(cyan("\n[transcript] Verifying discussion bubble transcripts..."))
    bubbles_html = (test_reports / "discussion-bubbles.html").read_text(encoding="utf-8")
    bubbles_data_match = DATA_BLOCK_RE.search(bubbles_html)
    bubbles_payload = json.loads(bubbles_data_match.group(2))
    valid_statuses = {"open", "approved", "approved-with-dissent", "rejected", "tied"}
    valid_roles = {"open", "voting", "contributing", "bubble-only", "decision", "summary"}
    valid_votes = {"approve", "reject", "abstain", None}
    for b in bubbles_payload["discussion_bubbles"]:
        bid = b.get("id", "<unknown>")
        if b.get("status") not in valid_statuses:
            print(red(f"  ✗ {bid}: invalid status '{b.get('status')}'"))
            failures.append((bid, f"invalid status: {b.get('status')}"))
            continue
        msgs = b.get("messages", [])
        if not msgs:
            print(red(f"  ✗ {bid}: no messages"))
            failures.append((bid, "no messages"))
            continue
        for i, m in enumerate(msgs):
            role = m.get("role_in_bubble")
            if role not in valid_roles:
                print(red(f"  ✗ {bid} msg[{i}]: invalid role_in_bubble '{role}'"))
                failures.append((bid, f"msg[{i}] invalid role: {role}"))
            vote = m.get("vote")
            if vote not in valid_votes:
                print(red(f"  ✗ {bid} msg[{i}]: invalid vote '{vote}'"))
                failures.append((bid, f"msg[{i}] invalid vote: {vote}"))
            if role == "voting" and vote is None:
                print(red(f"  ✗ {bid} msg[{i}]: voting role but no vote"))
                failures.append((bid, f"msg[{i}] voting with no vote"))
        # Tally cross-check
        tally = b.get("vote_tally", {})
        cast_votes = [m.get("vote") for m in msgs if m.get("vote") in ("approve", "reject", "abstain")]
        expected = {"approve": cast_votes.count("approve"), "reject": cast_votes.count("reject"), "abstain": cast_votes.count("abstain")}
        actual = {"approve": tally.get("approve", 0), "reject": tally.get("reject", 0), "abstain": tally.get("abstain", 0)}
        if expected != actual:
            print(red(f"  ✗ {bid}: vote_tally {actual} ≠ message-derived {expected}"))
            failures.append((bid, f"tally mismatch: declared {actual} vs derived {expected}"))
        else:
            print(green(f"  ✓ {bid:24s} {len(msgs)} messages, tally {actual['approve']}-{actual['reject']}-{actual['abstain']} matches messages, status '{b.get('status')}'"))

    # Cross-dashboard nav structure: verify all 6 production dashboards carry the canonical 6-link nav
    # Test runs against REPORTS_SRC (the real docs/reports/), not the test workspace —
    # the nav lives in the production templates, not in seeded synthetic state.
    print(cyan("\n[nav] Cross-dashboard navigation audit..."))
    NAV_LINKS_REQUIRED = ["dashboard.html", "activity.html", "discussion-bubbles.html", "proposals.html", "amendments.html", "main-flows.html", "design-system.html", "token-usage.html", "index.html"]
    NAV_PAGES = [
        ("dashboard.html",         "dashboard.html"),
        ("activity.html",          "activity.html"),
        ("discussion-bubbles.html","discussion-bubbles.html"),
        ("proposals.html",         "proposals.html"),
        ("amendments.html",        "amendments.html"),
        ("main-flows.html",        "main-flows.html"),
        ("design-system.html",     "design-system.html"),
        ("token-usage.html",       "token-usage.html"),
        ("index.html",             "index.html"),
    ]
    # Match either legacy .page-nav or canonical .pb-page-nav while migration is in progress.
    nav_re = re.compile(r'<nav class="(?:pb-)?page-nav">(.*?)</nav>', re.DOTALL)
    active_re = re.compile(r'href="([^"]+)"[^>]*\bclass="is-active"')
    for page, expected_active in NAV_PAGES:
        p = REPORTS_SRC / page
        if not p.exists():
            print(red(f"  ✗ {page:32s} file missing"))
            failures.append((f"nav:{page}", "file missing"))
            continue
        html = p.read_text(encoding="utf-8")
        m = nav_re.search(html)
        if not m:
            print(red(f"  ✗ {page:32s} no <nav class=\"page-nav\"> block"))
            failures.append((f"nav:{page}", "no page-nav block"))
            continue
        inside = m.group(1)
        missing_links = [lnk for lnk in NAV_LINKS_REQUIRED if f'href="{lnk}"' not in inside]
        if missing_links:
            print(red(f"  ✗ {page:32s} missing nav links: {missing_links}"))
            failures.append((f"nav:{page}", f"missing links: {missing_links}"))
            continue
        am = active_re.search(inside)
        if not am or am.group(1) != expected_active:
            actual = am.group(1) if am else "(none)"
            print(red(f"  ✗ {page:32s} is-active should be '{expected_active}', got '{actual}'"))
            failures.append((f"nav:{page}", f"is-active mismatch: expected={expected_active} actual={actual}"))
            continue
        print(green(f"  ✓ {page:32s} {len(NAV_LINKS_REQUIRED)} links, is-active='{expected_active}'"))

    # main-flows.html + index.html data-block parse — verify production files (not test workspace).
    # main-flows.html schema is the architecture+flows shape: columns[], flows[] with steps[] referencing component IDs.
    print(cyan("\n[main-flows+index] Verifying production data blocks..."))
    MF_PROD = REPORTS_SRC / "main-flows.html"
    if MF_PROD.exists():
        html = MF_PROD.read_text(encoding="utf-8")
        m = DATA_BLOCK_RE.search(html)
        if not m:
            print(red("  ✗ main-flows.html no data block"))
            failures.append(("main-flows.html", "no data block"))
        else:
            try:
                data = json.loads(m.group(2))
                # New architecture+flows schema requires columns + flows
                missing = [k for k in ("columns", "flows", "last_amended", "doc_source") if k not in data]
                if missing:
                    print(red(f"  ✗ main-flows.html missing top-level keys: {missing}"))
                    failures.append(("main-flows.html", f"missing keys: {missing}"))
                else:
                    columns = data.get("columns") or []
                    flows = data.get("flows") or []
                    if not isinstance(columns, list) or not isinstance(flows, list):
                        print(red("  ✗ main-flows.html columns/flows not lists"))
                        failures.append(("main-flows.html", "columns/flows not lists"))
                    else:
                        # Build component-ID set from columns
                        comp_ids = set()
                        for col in columns:
                            for c in (col.get("components") or []):
                                cid = c.get("id")
                                if cid:
                                    comp_ids.add(cid)
                        if not flows:
                            print(green(f"  ✓ main-flows.html              {len(columns)} cols, {len(comp_ids)} components, 0 flows (bare template)"))
                        else:
                            # Every flow.path component + every step.from/to must resolve
                            unresolved = []
                            empty_steps = []
                            for f in flows:
                                if not isinstance(f, dict) or "id" not in f or "name" not in f:
                                    unresolved.append(f"flow missing id/name: {f}")
                                    continue
                                for p in (f.get("path") or []):
                                    if p not in comp_ids:
                                        unresolved.append(f"flow {f['id']} path '{p}' not in grid")
                                steps = f.get("steps") or []
                                if not steps:
                                    empty_steps.append(f["id"])
                                for s in steps:
                                    for fk in ("from", "to"):
                                        v = s.get(fk)
                                        if v not in comp_ids:
                                            unresolved.append(f"flow {f['id']} step {s.get('n')} {fk}='{v}' not in grid")
                            if unresolved:
                                print(red(f"  ✗ main-flows.html unresolved references ({len(unresolved)}):"))
                                for u in unresolved[:5]:
                                    print(red(f"     - {u}"))
                                failures.append(("main-flows.html", f"unresolved component refs: {len(unresolved)}"))
                            elif empty_steps:
                                print(red(f"  ✗ main-flows.html flows with empty steps: {empty_steps}"))
                                failures.append(("main-flows.html", f"empty steps: {empty_steps}"))
                            else:
                                total_steps = sum(len(f.get("steps") or []) for f in flows)
                                print(green(f"  ✓ main-flows.html              {len(columns)} cols, {len(comp_ids)} components, {len(flows)} flows, {total_steps} steps — all refs resolve"))
                # v2 Phase 3 iter 1: flow_rail must carry the 62-flow inventory.
                rail = data.get("flow_rail")
                if isinstance(rail, list):
                    rail_required_fields = {"id", "name", "actor", "tier", "status"}
                    bad_entries = [r for r in rail if not rail_required_fields.issubset(set(r.keys()))]
                    if bad_entries:
                        print(red(f"  ✗ main-flows.html flow_rail entries missing required fields: {len(bad_entries)}"))
                        failures.append(("main-flows.html:flow_rail", f"missing fields in {len(bad_entries)} entries"))
                    elif len(rail) != 62:
                        print(red(f"  ✗ main-flows.html flow_rail has {len(rail)} entries (expected 62 per inventory)"))
                        failures.append(("main-flows.html:flow_rail", f"count={len(rail)}"))
                    else:
                        tier_counts = {}
                        for r in rail:
                            tier_counts[r.get("tier", "?")] = tier_counts.get(r.get("tier", "?"), 0) + 1
                        print(green(f"  ✓ main-flows.html flow_rail   62 entries · tiers {tier_counts}"))
                else:
                    print(red("  ✗ main-flows.html missing flow_rail (Phase 3 iter 1 required)"))
                    failures.append(("main-flows.html:flow_rail", "missing flow_rail"))
            except json.JSONDecodeError as e:
                print(red(f"  ✗ main-flows.html JSON parse: {e}"))
                failures.append(("main-flows.html", f"JSON parse: {e}"))
    else:
        print(red("  ✗ main-flows.html (production) MISSING"))
        failures.append(("main-flows.html", "production file missing"))

    IDX_PROD = REPORTS_SRC / "index.html"
    if IDX_PROD.exists():
        html = IDX_PROD.read_text(encoding="utf-8")
        m = DATA_BLOCK_RE.search(html)
        if not m:
            print(red("  ✗ index.html no data block"))
            failures.append(("index.html", "no data block"))
        else:
            try:
                data = json.loads(m.group(2))
                missing = [k for k in ("as_of", "status", "dashboards") if k not in data]
                if missing:
                    print(red(f"  ✗ index.html missing data keys: {missing}"))
                    failures.append(("index.html", f"missing keys: {missing}"))
                else:
                    dashboards = data.get("dashboards", {})
                    expected_dashes = {"dashboard.html", "activity.html", "discussion-bubbles.html", "proposals.html", "amendments.html", "main-flows.html"}
                    missing_dashes = expected_dashes - set(dashboards.keys())
                    if missing_dashes:
                        print(red(f"  ✗ index.html dashboards missing: {missing_dashes}"))
                        failures.append(("index.html", f"missing dashboards: {missing_dashes}"))
                    else:
                        print(green(f"  ✓ index.html                   data block valid, status + {len(expected_dashes)} dashboard entries present"))
            except json.JSONDecodeError as e:
                print(red(f"  ✗ index.html JSON parse: {e}"))
                failures.append(("index.html", f"JSON parse: {e}"))
    else:
        print(red("  ✗ index.html (production) MISSING"))
        failures.append(("index.html", "production file missing"))

    # PROP-003.b [meter-wiring]: validate the freshness gate + status
    # transition logic in the telemetry + token-usage aggregators.
    # Source of truth: the SHIPPED current-snapshot.json + token-usage-snapshot.json
    # in .claude/state/telemetry/aggregates/. These are regenerated on every
    # commit by the regen-all chain, so testing them here catches drift.
    print(cyan("\n[meter-wiring] PROP-003.b sidecar consumption..."))
    real_state = ROOT / ".claude" / "state"
    snap_path = real_state / "telemetry" / "aggregates" / "current-snapshot.json"
    tu_path = real_state / "telemetry" / "aggregates" / "token-usage-snapshot.json"
    qs_path = real_state / "quota-status.json"

    VALID_METER_STATES = {
        "wired-real",
        "wired-estimated",
        "wired-estimated-sidecar-empty",
        "wired-estimated-sidecar-stale",
        "gap-per-F1a",
    }
    REQUIRED_QS_KEYS = {
        "state", "as_of", "age_seconds", "weekly_tokens", "weekly_cap",
        "weekly_pct", "org_monthly_tokens", "org_monthly_cap",
        "org_monthly_pct", "data_source",
    }

    meter_checks = []
    if snap_path.exists():
        try:
            snap = json.loads(snap_path.read_text(encoding="utf-8"))
            ms = snap.get("_meter_status")
            qs = snap.get("quota_status") or {}
            meter_checks.append(("telemetry snapshot has _meter_status", ms in VALID_METER_STATES))
            meter_checks.append(("telemetry snapshot has quota_status block", isinstance(qs, dict)))
            missing_qs_keys = REQUIRED_QS_KEYS - set(qs.keys())
            meter_checks.append(("telemetry snapshot quota_status schema complete", len(missing_qs_keys) == 0))
            # If quota-status.json exists, the snapshot's quota_status.state should
            # reflect its content (not "absent")
            if qs_path.exists():
                meter_checks.append((
                    "quota_status.state != 'absent' when sidecar present",
                    qs.get("state") != "absent",
                ))
        except Exception as e:
            failures.append(("meter-wiring", f"telemetry snapshot parse failed: {e}"))
    else:
        failures.append(("meter-wiring", "current-snapshot.json missing — run scripts/aggregate-telemetry.py"))
    if tu_path.exists():
        try:
            tu = json.loads(tu_path.read_text(encoding="utf-8"))
            tms = tu.get("_meter_status")
            tqs = tu.get("quota_status") or {}
            meter_checks.append(("token-usage snapshot has _meter_status", tms in VALID_METER_STATES))
            meter_checks.append(("token-usage snapshot has quota_status block", isinstance(tqs, dict)))
        except Exception as e:
            failures.append(("meter-wiring", f"token-usage snapshot parse failed: {e}"))
    else:
        failures.append(("meter-wiring", "token-usage-snapshot.json missing — run scripts/aggregate-token-usage.py"))

    # Both aggregators must agree on _meter_status (they read the same
    # sidecar file with the same freshness gate, so divergence indicates
    # a real bug in one of the readers)
    if snap_path.exists() and tu_path.exists():
        try:
            snap_ms = json.loads(snap_path.read_text(encoding="utf-8")).get("_meter_status")
            tu_ms = json.loads(tu_path.read_text(encoding="utf-8")).get("_meter_status")
            meter_checks.append((
                f"aggregators agree on _meter_status (telemetry={snap_ms}, token-usage={tu_ms})",
                snap_ms == tu_ms,
            ))
        except Exception:
            pass

    if all(ok for _, ok in meter_checks):
        print(green(f"  ✓ meter-wiring                 {len(meter_checks)} checks pass"))
        for name, _ in meter_checks:
            print(green(f"    · {name}"))
    else:
        missing = [name for name, ok in meter_checks if not ok]
        print(red(f"  ✗ meter-wiring                 failures: {missing}"))
        failures.append(("meter-wiring", f"checks failed: {missing}"))

    # AMD-007 P18.6 [founder-queue]: dashboard data block must always
    # carry a founder_queue object with the four canonical sub-sections
    # (governance_gates, system_health, activity_since_last_visit, exceptions).
    # Counts in governance_gates must match the on-disk state directories.
    print(cyan("\n[founder-queue] AMD-007 P18.6 dashboard surface..."))
    dash_html = (REPORTS_SRC / "dashboard.html").read_text(encoding="utf-8")
    dash_data_match = DATA_BLOCK_RE.search(dash_html)
    fq_checks = []
    if not dash_data_match:
        failures.append(("founder-queue", "dashboard.html data block missing"))
    else:
        try:
            dd = json.loads(dash_data_match.group(2))
        except json.JSONDecodeError as e:
            dd = None
            failures.append(("founder-queue", f"dashboard JSON parse: {e}"))
        if dd is not None:
            fq = dd.get("founder_queue")
            fq_checks.append(("founder_queue key present", isinstance(fq, dict)))
            if isinstance(fq, dict):
                fq_checks.append(("governance_gates sub-section", isinstance(fq.get("governance_gates"), dict)))
                fq_checks.append(("system_health sub-section",    isinstance(fq.get("system_health"), dict)))
                fq_checks.append(("activity_since_last_visit sub-section", isinstance(fq.get("activity_since_last_visit"), dict)))
                fq_checks.append(("exceptions sub-section",       isinstance(fq.get("exceptions"), list)))
                # Cross-check: amendments_pending count == on-disk pending count
                gov = fq.get("governance_gates", {}) or {}
                disk_amd_pending = 0
                amd_pending_dir = ROOT / ".claude" / "state" / "amendments" / "pending"
                if amd_pending_dir.exists():
                    disk_amd_pending = sum(1 for f in amd_pending_dir.glob("AMD-*.md"))
                fq_checks.append((
                    f"amendments_pending matches on-disk ({disk_amd_pending})",
                    gov.get("amendments_pending") == disk_amd_pending,
                ))
                # Same for proposals_pending
                disk_prop_pending = 0
                prop_pending_dir = ROOT / ".claude" / "state" / "proposals" / "pending"
                if prop_pending_dir.exists():
                    disk_prop_pending = sum(1 for f in prop_pending_dir.glob("PROP-*.md"))
                fq_checks.append((
                    f"proposals_pending matches on-disk ({disk_prop_pending})",
                    gov.get("proposals_pending") == disk_prop_pending,
                ))
    if all(ok for _, ok in fq_checks):
        print(green(f"  ✓ founder-queue                {len(fq_checks)} checks pass"))
    else:
        missing = [name for name, ok in fq_checks if not ok]
        print(red(f"  ✗ founder-queue                failures: {missing}"))
        failures.append(("founder-queue", f"checks failed: {missing}"))

    # PROP-004 [quota-type-enum]: every cycle.paused / cycle.resumed event in
    # the telemetry log must use a quota_type value from the canonical enum.
    # PROP-004 (2026-05-14) added "org-monthly" to the enum so the discipline
    # can pause for the Anthropic org-level monthly cap (F1a finding b).
    print(cyan("\n[quota-type-enum] PROP-004 enum coverage..."))
    VALID_QUOTA_TYPES = {
        "weekly-tokens", "daily-tokens", "hourly-requests", "org-monthly", None,
    }
    events_dir = ROOT / ".claude" / "state" / "telemetry" / "events"
    bad_quota_events = []
    if events_dir.exists():
        for ndj in sorted(events_dir.glob("*.ndjson")):
            try:
                for ln in ndj.read_text(encoding="utf-8").splitlines():
                    ln = ln.strip()
                    if not ln:
                        continue
                    try:
                        ev = json.loads(ln)
                    except json.JSONDecodeError:
                        continue
                    et = ev.get("event_type", "")
                    if et not in ("cycle.paused", "cycle.resumed"):
                        continue
                    d = ev.get("data", {}) if isinstance(ev.get("data"), dict) else {}
                    qt = d.get("quota_type", None)
                    if qt not in VALID_QUOTA_TYPES:
                        bad_quota_events.append({
                            "file": ndj.name,
                            "ts": ev.get("timestamp"),
                            "event_type": et,
                            "quota_type": qt,
                        })
            except OSError:
                continue
    if bad_quota_events:
        print(red(f"  ✗ quota-type-enum              {len(bad_quota_events)} events with unknown quota_type"))
        for b in bad_quota_events[:5]:
            print(red(f"    · {b['file']} @ {b['ts']}: {b['event_type']} quota_type={b['quota_type']!r}"))
        failures.append(("quota-type-enum", f"{len(bad_quota_events)} invalid events"))
    else:
        print(green(f"  ✓ quota-type-enum              all cycle.paused/resumed events use valid quota_type (enum: {sorted(VALID_QUOTA_TYPES - {None})})"))

    # Cross-dashboard count consistency: every dashboard that surfaces a count for the
    # same metric MUST show the same number. Founder caught a banner-vs-page divergence
    # by eye on 2026-05-13; this check catches the class going forward.
    print(cyan("\n[cross-dash] Cross-dashboard count consistency..."))
    def get_data_block(path):
        if not path.exists():
            return None
        html = path.read_text(encoding="utf-8")
        m = DATA_BLOCK_RE.search(html)
        if not m:
            return None
        try:
            return json.loads(m.group(2))
        except json.JSONDecodeError:
            return None

    dash_data = get_data_block(REPORTS_SRC / "dashboard.html")
    prop_data = get_data_block(REPORTS_SRC / "proposals.html")
    idx_data = get_data_block(REPORTS_SRC / "index.html")
    bub_data = get_data_block(REPORTS_SRC / "discussion-bubbles.html")
    act_data = get_data_block(REPORTS_SRC / "activity.html")

    # On-disk truth — counted directly from state dirs in the real repo (not test workspace)
    real_state = ROOT / ".claude" / "state"
    truth_pending = sum(1 for _ in (real_state / "proposals" / "pending").glob("*.md")) if (real_state / "proposals" / "pending").exists() else 0
    truth_bubbles_total = sum(1 for _ in (real_state / "discussion-bubbles").glob("*.md")) if (real_state / "discussion-bubbles").exists() else 0
    truth_handoffs_total = 0
    handoffs_dir = real_state / "handoffs"
    if handoffs_dir.exists():
        for folder in handoffs_dir.iterdir():
            if folder.is_dir():
                truth_handoffs_total += sum(1 for _ in folder.rglob("*.md"))

    def check_eq(label, ground, candidates):
        """`candidates` is list of (source_name, value). All must equal ground."""
        nonlocal failures
        diverging = [(s, v) for s, v in candidates if v != ground]
        if diverging:
            div_str = ", ".join(f"{s}={v}" for s, v in diverging)
            print(red(f"  ✗ {label:40s} ground={ground}  DIVERGENT: {div_str}"))
            failures.append((f"cross-dash:{label}", f"ground={ground} divergent={div_str}"))
        else:
            sources = ", ".join(f"{s}={v}" for s, v in candidates)
            print(green(f"  ✓ {label:40s} ground={ground}  all={sources}"))

    # proposals_pending: dashboard.html data block + proposals.html (handles both legacy array + new 5-state object) + index.html status + on-disk
    def proposals_html_pending_len(d):
        if d is None: return None
        p = d.get("proposals")
        if isinstance(p, list):
            return len(p)  # legacy
        if isinstance(p, dict):
            return len(p.get("pending") or [])  # PROPOSAL_LIFECYCLE_v8.2 shape
        return None
    cands = []
    if dash_data is not None:
        cands.append(("dashboard.html data.proposals_pending", dash_data.get("proposals_pending")))
    if prop_data is not None:
        cands.append(("proposals.html pending length", proposals_html_pending_len(prop_data)))
    if idx_data is not None:
        cands.append(("index.html data.status.proposals_pending", idx_data.get("status", {}).get("proposals_pending")))
    check_eq("proposals_pending", truth_pending, cands)

    # Proposal lifecycle v8.2 schema: when proposals.html is in the 5-state shape, verify all keys + counts
    if prop_data is not None and isinstance(prop_data.get("proposals"), dict):
        print(cyan("\n[lifecycle] PROPOSAL_LIFECYCLE_v8.2 schema validation..."))
        plp = prop_data["proposals"]
        required_keys = ("pending", "approved", "deferred", "shipped", "rejected")
        missing = [k for k in required_keys if k not in plp]
        if missing:
            print(red(f"  ✗ proposals.html proposals.* missing keys: {missing}"))
            failures.append(("lifecycle:proposals.html", f"missing keys: {missing}"))
        else:
            counts = prop_data.get("counts") or {}
            # On-disk truth for each state
            on_disk_counts = {
                "pending":  sum(1 for _ in (real_state / "proposals" / "pending" ).glob("*.md")) if (real_state / "proposals" / "pending").exists()  else 0,
                "approved": sum(1 for _ in (real_state / "proposals" / "approved").glob("*.md")) if (real_state / "proposals" / "approved").exists() else 0,
                "deferred": sum(1 for _ in (real_state / "proposals" / "deferred").glob("*.md")) if (real_state / "proposals" / "deferred").exists() else 0,
                "shipped":  sum(1 for _ in (real_state / "proposals" / "shipped" ).glob("*.md")) if (real_state / "proposals" / "shipped").exists()  else 0,
                "rejected": sum(1 for _ in (real_state / "proposals" / "rejected").glob("*.md")) if (real_state / "proposals" / "rejected").exists() else 0,
            }
            ok = True
            # Verify data block bucket length matches on-disk (for the inline-display caps: pending/approved/deferred uncapped; shipped/rejected capped at 50)
            for key in ("pending", "approved", "deferred"):
                if len(plp[key]) != on_disk_counts[key]:
                    print(red(f"  ✗ proposals.{key}: data block has {len(plp[key])}, on-disk has {on_disk_counts[key]}"))
                    failures.append((f"lifecycle:{key}", f"data={len(plp[key])} on-disk={on_disk_counts[key]}"))
                    ok = False
            # shipped/rejected: inline-bucket length is min(on_disk, 50); but counts.*_total must match on-disk
            for key, count_key in (("shipped", "shipped_total"), ("rejected", "rejected_total")):
                if counts.get(count_key) != on_disk_counts[key]:
                    print(red(f"  ✗ counts.{count_key}: data block has {counts.get(count_key)}, on-disk has {on_disk_counts[key]}"))
                    failures.append((f"lifecycle:counts.{count_key}", f"data={counts.get(count_key)} on-disk={on_disk_counts[key]}"))
                    ok = False
                # inline bucket must be ≤ 50 and ≤ on_disk
                if len(plp[key]) > 50 or len(plp[key]) > on_disk_counts[key]:
                    print(red(f"  ✗ proposals.{key} inline bucket has {len(plp[key])} (cap is min(50, {on_disk_counts[key]}))"))
                    failures.append((f"lifecycle:{key}-inline-cap", f"inline={len(plp[key])}"))
                    ok = False
            # Every shipped proposal must have shipped_at + shipped_in_commit (immutability contract per § 3 rule 5)
            for p in plp["shipped"]:
                if "shipped_at" not in p or "shipped_in_commit" not in p:
                    print(red(f"  ✗ shipped proposal {p.get('id')} missing shipped_at/shipped_in_commit"))
                    failures.append((f"lifecycle:shipped-fields", f"prop={p.get('id')}"))
                    ok = False
            if ok:
                summary = f"counts pending={counts.get('pending')} approved={counts.get('approved')} deferred={counts.get('deferred')} shipped={counts.get('shipped_total')} rejected={counts.get('rejected_total')}"
                print(green(f"  ✓ PROPOSAL_LIFECYCLE_v8.2 schema valid; {summary}"))

        # Dashboard banner must surface proposals_counts (new schema)
        if dash_data is not None:
            pc = dash_data.get("proposals_counts")
            if not isinstance(pc, dict):
                print(red("  ✗ dashboard.html missing proposals_counts object (needed for banner)"))
                failures.append(("lifecycle:dashboard.proposals_counts", "missing"))
            else:
                for k in ("pending", "approved", "shipped_total"):
                    if k not in pc:
                        print(red(f"  ✗ dashboard.proposals_counts missing {k}"))
                        failures.append((f"lifecycle:dashboard.proposals_counts.{k}", "missing"))
                if all(k in pc for k in ("pending", "approved", "shipped_total")):
                    print(green(f"  ✓ dashboard.html proposals_counts present: pending={pc['pending']} approved={pc['approved']} shipped={pc.get('shipped_total')}"))

    # AMENDMENTS lifecycle schema: mirror of PROPOSAL_LIFECYCLE_v8.2 for governance amendment drafts.
    # 5-state (pending / approved / deferred / applied / rejected), AMD-NNN frontmatter, target_canonical_path
    # required on every AMD. Applied + rejected capped at 50 inline; counts.*_total surfaces full count.
    print(cyan("\n[amendments] AMENDMENTS lifecycle schema validation..."))
    amd_data = get_data_block(REPORTS_SRC / "amendments.html")
    if amd_data is None:
        print(red("  ✗ amendments.html no data block"))
        failures.append(("amendments.html", "no data block"))
    else:
        amend_required = ("amendments", "counts", "as_of", "schema_version")
        amend_missing = [k for k in amend_required if k not in amd_data]
        if amend_missing:
            print(red(f"  ✗ amendments.html missing top-level keys: {amend_missing}"))
            failures.append(("amendments.html", f"missing keys: {amend_missing}"))
        else:
            ab = amd_data["amendments"]
            ac_block = amd_data["counts"]
            amend_states = ("pending", "approved", "deferred", "applied", "rejected")
            state_missing = [s for s in amend_states if s not in ab]
            if state_missing:
                print(red(f"  ✗ amendments.amendments missing states: {state_missing}"))
                failures.append(("amendments.states", f"missing: {state_missing}"))
            else:
                # On-disk truth per state
                amd_on_disk = {}
                for s in amend_states:
                    d = real_state / "amendments" / s
                    amd_on_disk[s] = sum(1 for _ in d.glob("AMD-*.md")) if d.exists() else 0
                ok = True
                # Uncapped buckets: pending/approved/deferred — inline length == on-disk
                for s in ("pending", "approved", "deferred"):
                    if len(ab[s]) != amd_on_disk[s]:
                        print(red(f"  ✗ amendments.{s}: data block has {len(ab[s])}, on-disk has {amd_on_disk[s]}"))
                        failures.append((f"amendments:{s}", f"data={len(ab[s])} on-disk={amd_on_disk[s]}"))
                        ok = False
                # Applied + rejected: inline capped at 50, *_total surfaces full count
                for s, count_key in (("applied", "applied_total"), ("rejected", "rejected_total")):
                    if ac_block.get(count_key) != amd_on_disk[s]:
                        print(red(f"  ✗ amendments.counts.{count_key}: data block has {ac_block.get(count_key)}, on-disk has {amd_on_disk[s]}"))
                        failures.append((f"amendments:counts.{count_key}", f"data={ac_block.get(count_key)} on-disk={amd_on_disk[s]}"))
                        ok = False
                    if len(ab[s]) > 50 or len(ab[s]) > amd_on_disk[s]:
                        print(red(f"  ✗ amendments.{s} inline bucket has {len(ab[s])} (cap is min(50, {amd_on_disk[s]}))"))
                        failures.append((f"amendments:{s}-inline-cap", f"inline={len(ab[s])}"))
                        ok = False
                # Every pending AMD must have id + title + target_canonical_path + type (per AMD frontmatter schema)
                AMD_REQ = ("id", "title", "target_canonical_path", "type")
                AMD_TYPES = {"new-file", "replace-existing", "append-to-existing", "edit-section"}
                for amd in ab["pending"]:
                    missing_fields = [k for k in AMD_REQ if not amd.get(k)]
                    if missing_fields:
                        print(red(f"  ✗ AMD {amd.get('id') or amd.get('_filename')} missing fields: {missing_fields}"))
                        failures.append((f"amendments:pending-fields", f"amd={amd.get('id')} missing={missing_fields}"))
                        ok = False
                    elif amd["type"] not in AMD_TYPES:
                        print(red(f"  ✗ AMD {amd.get('id')} invalid type: {amd.get('type')} (expected one of {AMD_TYPES})"))
                        failures.append((f"amendments:pending-type", f"amd={amd.get('id')} type={amd.get('type')}"))
                        ok = False
                if ok:
                    summary = f"pending={ac_block.get('pending')} approved={ac_block.get('approved')} deferred={ac_block.get('deferred')} applied={ac_block.get('applied_total')} rejected={ac_block.get('rejected_total')}"
                    print(green(f"  ✓ AMENDMENTS lifecycle schema valid; {summary}"))

        # Dashboard must surface amendments_counts (counts wired into KPI tiles)
        if dash_data is not None:
            ac_dash = dash_data.get("amendments_counts")
            if not isinstance(ac_dash, dict):
                print(red("  ✗ dashboard.html missing amendments_counts object"))
                failures.append(("amendments:dashboard.amendments_counts", "missing"))
            else:
                for k in ("pending", "applied_total"):
                    if k not in ac_dash:
                        print(red(f"  ✗ dashboard.amendments_counts missing {k}"))
                        failures.append((f"amendments:dashboard.amendments_counts.{k}", "missing"))
                if all(k in ac_dash for k in ("pending", "applied_total")):
                    print(green(f"  ✓ dashboard.html amendments_counts present: pending={ac_dash['pending']} applied={ac_dash.get('applied_total')}"))

    # amendments_pending cross-dashboard consistency
    cands = []
    truth_amd_pending = sum(1 for _ in (real_state / "amendments" / "pending").glob("AMD-*.md")) if (real_state / "amendments" / "pending").exists() else 0
    if amd_data is not None:
        cands.append(("amendments.html counts.pending", (amd_data.get("counts") or {}).get("pending")))
    if dash_data is not None and isinstance(dash_data.get("amendments_counts"), dict):
        cands.append(("dashboard.html amendments_counts.pending", dash_data["amendments_counts"].get("pending")))
    if cands:
        check_eq("amendments_pending", truth_amd_pending, cands)

    # discussion_bubbles_total: discussion-bubbles.html data block + index.html status + on-disk
    cands = []
    if bub_data is not None:
        cands.append(("discussion-bubbles.html data.discussion_bubbles.length", len(bub_data.get("discussion_bubbles", []))))
    if idx_data is not None:
        # index status reports open count, but also surfaces total_bubbles in extended field
        total_or_open = idx_data.get("status", {}).get("total_bubbles")
        if total_or_open is None:
            total_or_open = idx_data.get("status", {}).get("open_discussion_bubbles")
        cands.append(("index.html status.total_bubbles", total_or_open))
    check_eq("discussion_bubbles_total", truth_bubbles_total, cands)

    # handoffs_total
    # Founder directive 2026-05-14 "DASHBOARD DATA PIPELINE BROKEN":
    # dashboard.recent_handoffs is now a UNION of legacy handoff markdown
    # entries + git-commit-derived recent substrate activity (ship-close
    # commits, cron auto-commits, watcher applies). It is no longer a
    # 1:1 mirror of .claude/state/handoffs/ — by design. Only assert
    # activity.html mirrors legacy ground truth; dashboard.recent_handoffs
    # is the richer "recent activity" surface.
    cands = []
    if act_data is not None:
        cands.append(("activity.html data.handoffs.length", len(act_data.get("handoffs", []))))
    # NOTE: dashboard.recent_handoffs intentionally no longer matches the
    # ground-truth legacy handoff count (it now includes git-commit-mined
    # activity entries). Cross-check skips it.
    if truth_handoffs_total <= 5:
        check_eq("handoffs_total", truth_handoffs_total, cands)
    else:
        # Truth >5 — only assert activity.html count == truth
        act_count = len(act_data.get("handoffs", [])) if act_data else 0
        if act_count == truth_handoffs_total:
            print(green(f"  ✓ {'handoffs_total':40s} ground={truth_handoffs_total} activity.html={act_count} (dashboard.recent_handoffs is design-extended with git activity, skipped)"))
        else:
            print(red(f"  ✗ {'handoffs_total':40s} ground={truth_handoffs_total} activity.html={act_count}"))
            failures.append(("cross-dash:handoffs_total", f"ground={truth_handoffs_total} activity={act_count}"))

    # Banner text on dashboard.html must NOT contain a hardcoded count (would diverge)
    print(cyan("\n[banner-text] dashboard.html banner must be data-bound, not hardcoded..."))
    dash_html = (REPORTS_SRC / "dashboard.html").read_text(encoding="utf-8")
    # Look for the pattern "<N> proposals awaiting" where <N> is a literal digit (not "—" or span)
    bad_banner = re.search(r'<div class="card-title text-brass">\s*\d+\s+proposals\s+awaiting', dash_html)
    if bad_banner:
        print(red(f"  ✗ dashboard.html banner contains hardcoded digit count: '{bad_banner.group(0)[:80]}'"))
        failures.append(("dashboard.html banner", "hardcoded digit count in banner card-title"))
    else:
        print(green("  ✓ dashboard.html banner uses data-bound placeholder (no hardcoded count)"))

    # Proposal-card field rendering: every proposal in pending/ must have id/title/lane parseable from data block
    # AND the renderer's required fields (per §amendment.4) must be present in each proposal.
    print(cyan("\n[proposal-cards] Each pending proposal has full §amendment.4 schema..."))
    PROPOSAL_RENDER_FIELDS = ["id", "title", "lane", "lane_label", "created_at", "rationale", "scope", "ship_target", "estimate", "files_affected"]
    real_pending_dir = real_state / "proposals" / "pending"
    if real_pending_dir.exists():
        for f in sorted(real_pending_dir.glob("*.md")):
            body = f.read_text(encoding="utf-8")
            m = re.match(r"^---\n(.*?)\n---", body, re.DOTALL)
            if not m:
                print(red(f"  ✗ {f.name} no frontmatter"))
                failures.append((f"proposal-card:{f.name}", "no frontmatter"))
                continue
            try:
                fm = json.loads(m.group(1))
            except json.JSONDecodeError as e:
                print(red(f"  ✗ {f.name} JSON parse: {e}"))
                failures.append((f"proposal-card:{f.name}", f"JSON parse: {e}"))
                continue
            missing_fields = [k for k in PROPOSAL_RENDER_FIELDS if k not in fm]
            type_issues = []
            if "lane" in fm and not isinstance(fm["lane"], int):
                type_issues.append(f"lane is {type(fm['lane']).__name__}, expected int per §amendment.4")
            if "estimate" in fm:
                est = fm["estimate"]
                if not isinstance(est, dict):
                    type_issues.append(f"estimate is {type(est).__name__}, expected object")
                else:
                    for sub in ("cost_tokens", "duration_minutes", "risk"):
                        if sub not in est:
                            type_issues.append(f"estimate.{sub} missing")
            if missing_fields or type_issues:
                problems = (missing_fields or []) + (type_issues or [])
                print(red(f"  ✗ {f.name} schema issues: {problems}"))
                failures.append((f"proposal-card:{f.name}", f"schema: {problems}"))
            else:
                print(green(f"  ✓ {f.name:48s} id={fm['id']} lane={fm['lane']} ({fm['lane_label']}) cost={fm['estimate']['cost_tokens']}"))

    # Design-token discipline: design-system.html is the exemplar and MUST be clean.
    # Other dashboards are pre-migration (Phase 2 cleans them up); we count violations
    # for visibility but only fail on design-system.html.
    print(cyan("\n[design-tokens] Design-token discipline check..."))
    HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
    PX_RE  = re.compile(r"\b\d+\s*px\b")
    MS_RE  = re.compile(r"\b\d+\s*ms\b")
    TOKEN_FILE = REPORTS_SRC / "_assets" / "design-tokens.css"
    EXEMPLAR  = REPORTS_SRC / "design-system.html"
    if TOKEN_FILE.exists():
        # design-tokens.css is allowed (and required) to have raw hex/px/ms.
        # design-system-components.css is allowed inline px in token-derived form? No — it should also be clean.
        # But for Phase 1 we tolerate raw 0 / 1px / 2px / 3px etc. in components when they're sub-token sizes (e.g., border widths)
        component_file = REPORTS_SRC / "_assets" / "design-system-components.css"

        # Exemplar check — design-system.html is the documentation page, so it's
        # ALLOWED to display hex values as text content (the swatch labels literally
        # are the hex values being documented). The discipline that matters: inside
        # <style> blocks and style="..." attributes, every color must be a var(--*)
        # reference (the exemplar should LEAD BY EXAMPLE in its CSS usage).
        if EXEMPLAR.exists():
            text = EXEMPLAR.read_text(encoding="utf-8")
            # Extract the <style>...</style> block contents
            style_blocks = re.findall(r"<style[^>]*>(.*?)</style>", text, flags=re.DOTALL)
            # Extract style="..." attribute contents
            style_attrs = re.findall(r'style="([^"]*)"', text)
            css_text = "\n".join(style_blocks) + "\n" + "\n".join(style_attrs)
            # Now check for raw hex in CSS contexts only
            hex_in_css = HEX_RE.findall(css_text)
            if hex_in_css:
                print(red(f"  ✗ design-system.html CSS contexts contain {len(hex_in_css)} raw hex values"))
                print(red(f"     samples: {hex_in_css[:5]}"))
                failures.append(("design-tokens:exemplar-css", f"raw hex in CSS: {len(hex_in_css)}"))
            else:
                print(green("  ✓ design-system.html CSS clean — every color via var(--*), hex in text content is documentation only"))

        # Token file sanity — must DEFINE the canonical palette
        token_text = TOKEN_FILE.read_text(encoding="utf-8")
        required_tokens = [
            "--pb-billiard-green-900", "--pb-billiard-green-800", "--pb-chalk-50", "--pb-brass-500",
            "--pb-success", "--pb-error", "--text-base", "--space-4", "--radius-md", "--duration-fast", "--ease-out",
        ]
        missing_tokens = [t for t in required_tokens if t not in token_text]
        if missing_tokens:
            print(red(f"  ✗ design-tokens.css missing required tokens: {missing_tokens}"))
            failures.append(("design-tokens:missing", f"missing: {missing_tokens}"))
        else:
            print(green(f"  ✓ design-tokens.css declares all {len(required_tokens)} required canonical tokens"))

        # Phase 1 informational scan: count violations in legacy dashboards (not a failure;
        # migration to --pb-* is Phase 2 work)
        legacy = ["dashboard.html", "activity.html", "proposals.html", "amendments.html", "discussion-bubbles.html", "main-flows.html", "index.html"]
        legacy_violations = {}
        for name in legacy:
            p = REPORTS_SRC / name
            if not p.exists():
                continue
            html = p.read_text(encoding="utf-8")
            no_script = re.sub(r"<script.*?</script>", "", html, flags=re.DOTALL)
            no_data_block = re.sub(r"<script id=\"report-data\".*?</script>", "", no_script, flags=re.DOTALL)
            hex_count = len(HEX_RE.findall(no_data_block))
            px_count = len(PX_RE.findall(no_data_block))
            ms_count = len(MS_RE.findall(no_data_block))
            legacy_violations[name] = (hex_count, px_count, ms_count)
        if legacy_violations:
            print(cyan("  Phase 2 migration scope (informational, not a failure):"))
            for name, (h, px, ms) in legacy_violations.items():
                print(cyan(f"     {name:30s}  raw-hex={h:3d}  raw-px={px:3d}  raw-ms={ms:3d}"))
    else:
        print(cyan("  design-tokens.css not yet authored; skipping discipline check"))

    # Token-usage dashboard: validate data block + cross-panel reconciliation.
    # Solid=real, hatched=estimated, asterisk-prefix=manual. Never blend totals.
    print(cyan("\n[token-usage] Verifying production data block + cross-panel reconciliation..."))
    TU_PROD = REPORTS_SRC / "token-usage.html"
    if not TU_PROD.exists():
        print(red("  ✗ token-usage.html (production) MISSING"))
        failures.append(("token-usage.html", "production file missing"))
    else:
        html = TU_PROD.read_text(encoding="utf-8")
        m = DATA_BLOCK_RE.search(html)
        if not m:
            print(red("  ✗ token-usage.html no data block"))
            failures.append(("token-usage.html", "no data block"))
        else:
            try:
                tu = json.loads(m.group(2))
            except json.JSONDecodeError as e:
                print(red(f"  ✗ token-usage.html JSON parse: {e}"))
                failures.append(("token-usage.html", f"JSON parse: {e}"))
                tu = None
            if tu is not None:
                required_top = ["by_agent", "by_cron", "by_ship", "all_time"]
                missing_top = [k for k in required_top if k not in tu]
                if missing_top:
                    print(red(f"  ✗ token-usage.html missing top-level keys: {missing_top}"))
                    failures.append(("token-usage.html", f"missing keys: {missing_top}"))
                else:
                    # Each panel bucket must have real / estimated / manual buckets, each numeric.
                    def panel_ok(panel_name, panel):
                        if not isinstance(panel, dict):
                            return False, f"{panel_name} is not an object"
                        for entry_key, entry in panel.items():
                            if entry_key == "_meta":
                                continue
                            if not isinstance(entry, dict):
                                return False, f"{panel_name}.{entry_key} is not an object"
                            for sub in ("real", "estimated", "manual"):
                                if sub not in entry:
                                    return False, f"{panel_name}.{entry_key} missing '{sub}' bucket"
                                if not isinstance(entry[sub], (int, float)):
                                    return False, f"{panel_name}.{entry_key}.{sub} not numeric"
                        return True, None

                    panel_failures = []
                    for k in ("by_agent", "by_cron", "by_ship"):
                        ok, err = panel_ok(k, tu[k])
                        if not ok:
                            panel_failures.append(err)
                    # all_time must be a flat object with real / estimated / manual
                    at = tu.get("all_time", {})
                    if not isinstance(at, dict):
                        panel_failures.append("all_time is not an object")
                    else:
                        for sub in ("real", "estimated", "manual"):
                            if sub not in at:
                                panel_failures.append(f"all_time missing '{sub}' bucket")
                            elif not isinstance(at[sub], (int, float)):
                                panel_failures.append(f"all_time.{sub} not numeric")

                    if panel_failures:
                        for pf in panel_failures:
                            print(red(f"  ✗ {pf}"))
                            failures.append(("token-usage:schema", pf))
                    else:
                        # Cross-panel reconciliation: sum of real across by_agent == sum across by_cron + by_ship
                        # only when those panels overlap. Conservative check: each panel's real sum must
                        # equal all_time.real OR be a strict subset (some sources only attribute to one axis).
                        def sum_real(panel):
                            return sum(v.get("real", 0) for k, v in panel.items() if k != "_meta" and isinstance(v, dict))
                        def sum_est(panel):
                            return sum(v.get("estimated", 0) for k, v in panel.items() if k != "_meta" and isinstance(v, dict))
                        def sum_man(panel):
                            return sum(v.get("manual", 0) for k, v in panel.items() if k != "_meta" and isinstance(v, dict))
                        real_at = at["real"]
                        est_at  = at["estimated"]
                        man_at  = at["manual"]
                        # Each panel's sum should match all_time (every event attributes to all three axes).
                        # If an event is missing an attribution dimension, the aggregator must record it
                        # under an "unattributed" bucket so the sum still reconciles.
                        recon_failures = []
                        for pname in ("by_agent", "by_cron", "by_ship"):
                            sr = sum_real(tu[pname])
                            se = sum_est(tu[pname])
                            sm = sum_man(tu[pname])
                            if sr != real_at:
                                recon_failures.append(f"sum({pname}.real)={sr} != all_time.real={real_at}")
                            if se != est_at:
                                recon_failures.append(f"sum({pname}.estimated)={se} != all_time.estimated={est_at}")
                            if sm != man_at:
                                recon_failures.append(f"sum({pname}.manual)={sm} != all_time.manual={man_at}")
                        if recon_failures:
                            for rf in recon_failures:
                                print(red(f"  ✗ token-usage cross-panel: {rf}"))
                                failures.append(("token-usage:reconciliation", rf))
                        else:
                            print(green(f"  ✓ token-usage.html schema valid; all_time real={real_at} estimated={est_at} manual={man_at}; cross-panel sums match"))

                # The dashboard MUST visually distinguish real vs estimated vs manual.
                # Accepted markers (post Dashboard Consolidation):
                #   - is-manual / is-estimated CSS classes on stat cells + asterisk prefix
                #   - SVG donut with at least one tu-arc element (3 colors)
                #   - Legacy hatch/stripe pattern (pre-consolidation token-usage)
                markers = ["is-manual", "is-estimated", "tu-arc", "tu-donut", "hatch", "stripe"]
                found = [m for m in markers if m in html]
                if not found:
                    print(red("  ✗ token-usage.html missing visual-distinction markers (donut/is-manual/is-estimated/hatch)"))
                    failures.append(("token-usage:visual-distinction", "no visual-distinction marker in HTML"))
                else:
                    print(green(f"  ✓ token-usage.html visual distinction present: {', '.join(found)}"))

    # Theme convergence guard: every dashboard's <style> blocks + style="..." attrs
    # must reference colors via var(--*) only — no raw hex. design-system.html is
    # exempt because it displays hex values as documentation. main-flows.html has
    # 6 documented hex declarations inside :root (the --col-* category tokens
    # col-actor/-client/-auth-fn/-data/-distribution/-external — encode category
    # meaning, appear only in legend dots / column headers). All 6 are page-
    # specific data tokens, not theme colors.
    #
    # Iter 6 (2026-05-14, Founder directive): the prior R1-R5 ships had added 2
    # more documented hex declarations (--bg-page: #000000 + --accent-brass:
    # #F5C518) that overrode the entire dashboard theme to a Dave-Jeffery-
    # reference black/yellow. Founder direction: "page is theme-divorced from
    # the rest of the dashboard". Those 2 declarations + downstream --pb-*
    # remaps were DELETED in iter 6; page now inherits dashboard-shell.css
    # billiard-green + brass exactly like every other dashboard. Allowed hex
    # count returns to 6 (the --col-* tokens only).
    print(cyan("\n[theme] Theme convergence guard (no raw hex in dashboard <style>)..."))
    HEX_IN_CSS_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
    THEME_PAGES = [
        ("dashboard.html",          0),
        ("activity.html",           0),
        ("proposals.html",          0),
        ("discussion-bubbles.html", 0),
        ("main-flows.html",         6),  # 6 col-* only (--bg-page/--accent-brass removed iter 6)
        ("token-usage.html",        0),
        ("index.html",              0),
    ]
    # design-system.html is the documentation page — it deliberately shows hex
    # values in text content as the swatch labels. Round-trip already validates
    # design-system.html CSS-context hex separately (the [design-tokens] block).
    for fname, allowed_hex in THEME_PAGES:
        p = REPORTS_SRC / fname
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        style_blocks = re.findall(r"<style[^>]*>(.*?)</style>", text, flags=re.DOTALL)
        style_attrs  = re.findall(r'style="([^"]*)"', text)
        css_text = "\n".join(style_blocks) + "\n" + "\n".join(style_attrs)
        hex_in_css = HEX_IN_CSS_RE.findall(css_text)
        if len(hex_in_css) > allowed_hex:
            print(red(f"  ✗ {fname:32s} {len(hex_in_css)} raw hex value(s) in CSS contexts (allowed: {allowed_hex})"))
            print(red(f"     samples: {hex_in_css[:5]}"))
            failures.append((f"theme:{fname}", f"raw hex count {len(hex_in_css)} > allowed {allowed_hex}"))
        else:
            tag = "ok" if allowed_hex == 0 else f"ok ({len(hex_in_css)}/{allowed_hex} documented)"
            print(green(f"  ✓ {fname:32s} {tag}"))
        # Must import dashboard-shell.css (transitively imports design-tokens.css).
        if 'href="_assets/dashboard-shell.css"' not in text:
            print(red(f"  ✗ {fname:32s} does not import dashboard-shell.css"))
            failures.append((f"theme:{fname}:shell-import", "dashboard-shell.css not imported"))

    # No-charts discipline (DC-7): the Dashboard Consolidation strips every chart
    # from every dashboard except the explicitly-carved-out token-usage donut and
    # the main-flows SVG arrow overlay (functional documentation, not a chart).
    # Fail on any new <canvas>, Chart.js import, D3 import, or chart.umd reference.
    print(cyan("\n[no-charts] Dashboards must not introduce charts (donut + arch arrows exempted)..."))
    # Match only load-bearing chart references, not documentation prose
    # explaining the absence of charts. <canvas> tag is unambiguous; Chart.js /
    # chart.umd / D3 must appear in a <script src=...> import, not in a comment
    # like "/* no Chart.js, no D3 */".
    CHART_RES = [
        (re.compile(r"<canvas\b", re.IGNORECASE),                                 "<canvas>"),
        (re.compile(r'<script[^>]*src="[^"]*chart\.umd[^"]*"', re.IGNORECASE),    "chart.umd <script>"),
        (re.compile(r'<script[^>]*src="[^"]*chart\.js[^"]*"',  re.IGNORECASE),    "chart.js <script>"),
        (re.compile(r'<script[^>]*src="[^"]*d3[^"]*"',         re.IGNORECASE),    "D3 <script>"),
        (re.compile(r"new\s+Chart\s*\("),                                          "new Chart()"),
    ]
    chart_failures = []
    for fname in ["dashboard.html", "activity.html", "proposals.html", "amendments.html",
                  "discussion-bubbles.html", "main-flows.html",
                  "design-system.html", "token-usage.html", "index.html"]:
        p = REPORTS_SRC / fname
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8", errors="ignore")
        for pat, label in CHART_RES:
            for m in pat.finditer(text):
                # Exception: main-flows.html has the SVG arrow overlay (<svg class="mf-arrows">),
                # not <canvas>. Exception: token-usage.html uses an SVG donut, not a canvas.
                # Documentation comments mentioning "no Chart.js" are not matched (require
                # <script src=...> wrapper for library references).
                chart_failures.append((fname, label, m.start()))
    if chart_failures:
        print(red(f"  ✗ {len(chart_failures)} chart reference(s) detected:"))
        for fname, label, off in chart_failures[:10]:
            print(red(f"     {fname}: {label} @ offset {off}"))
        failures.append(("no-charts", f"{len(chart_failures)} chart refs"))
    else:
        print(green("  ✓ no canvas/Chart.js/D3 references in any dashboard (SVG donut + arch arrows are SVG, not charts)"))

    # Protected layout sentinels (Phase 6.5 + DC-7): structural assertions that
    # the three protected layouts (bubbles 2-panel, main-flows grid+arrows,
    # design-system showcase) survived past consolidation work.
    print(cyan("\n[protected-layouts] Sentinels for protected layouts..."))

    # discussion-bubbles.html: master/detail 2-panel intact
    bubbles_html = (REPORTS_SRC / "discussion-bubbles.html").read_text(encoding="utf-8")
    bubble_checks = [
        ("db-app container",       'class="db-app"' in bubbles_html or 'id="db-app"' in bubbles_html),
        ("db-rail (master)",       'class="db-rail"' in bubbles_html),
        ("db-thread-list iteration", 'class="db-thread-list"' in bubbles_html),
        # db-day-divider is added dynamically by JS, so look for the class name
        # anywhere (CSS rule or JS template), not just `class="..."` attribute.
        ("db-day-divider grouping", 'db-day-divider' in bubbles_html),
        ("2-panel grid declaration", "grid-template-columns" in bubbles_html and ("360px" in bubbles_html or "300px" in bubbles_html)),
    ]
    bubble_pass = all(ok for _, ok in bubble_checks)
    if bubble_pass:
        print(green(f"  ✓ discussion-bubbles.html      master/detail 2-panel intact ({sum(1 for _, ok in bubble_checks if ok)}/{len(bubble_checks)} sentinels)"))
    else:
        missing = [name for name, ok in bubble_checks if not ok]
        print(red(f"  ✗ discussion-bubbles.html      missing sentinels: {missing}"))
        failures.append(("protected:bubbles", f"missing: {missing}"))

    # main-flows.html: 6-col grid + SVG arrows + flow rail + steps panel
    mf_html = (REPORTS_SRC / "main-flows.html").read_text(encoding="utf-8")
    # Iter 6 (2026-05-14, Founder directive — "two specific failures"):
    #   1. Theme: page must NOT override --bg-page or --accent-brass at page-
    #      local :root. Page must inherit dashboard-shell.css billiard-green +
    #      brass exactly like every other dashboard.
    #   2. Composition: bottom #flow-rail-section catalog DELETED. Architecture
    #      diagram's mf-rail-search + mf-rail-chips already carry all 62 flows
    #      filterable in the right rail; bottom section was duplication.
    #
    # The prior order-check sentinel (architecture-before-rail) is preserved
    # for archaeology — it still passes when flow-rail-section is absent
    # (the .find returns -1 which short-circuits the arch_first check), but
    # the more important guard is the iter-6 NEGATIVE assertions below.
    mf_idx_workspace = mf_html.find('class="mf-workspace"')
    mf_idx_flowrail = mf_html.find('id="flow-rail-section"')
    arch_first = (mf_idx_workspace > 0 and (mf_idx_flowrail < 0 or mf_idx_workspace < mf_idx_flowrail))

    # Iter 6 negative assertions — these prevent iteration 7 from re-introducing
    # the same two failure modes. Sentinels run on raw page text against the
    # specific strings that comprised each failure.
    mf_iter6_negatives = [
        # (name, must_be_absent_token, why)
        ("no flow-rail-section",       'id="flow-rail-section"',  "bottom 62-flow catalog DELETED — duplicate of arch rail"),
        ("no rail-search id",          'id="rail-search"',        "bottom catalog search input gone"),
        ("no rail-chip class",         'class="rail-chip',         "bottom catalog filter chips gone"),
        ("no rail-groups host",        'id="rail-groups"',        "bottom catalog group host gone"),
        ("no rail-total-count",        'id="rail-total-count"',   "bottom catalog header counter gone"),
        ("no renderRail IIFE",         "function renderRail(",    "bottom catalog JS gone"),
        ("no --bg-page override",      "--bg-page:       #000",   "page-local Janowiak black-canvas override DELETED"),
        ("no --accent-brass override", "--accent-brass:  #F5C518","page-local Janowiak yellow-accent override DELETED"),
        ("no --pb-billiard-green-900 override", "--pb-billiard-green-900: var(--bg-page)", "page-local --pb-* remap to white-on-black DELETED"),
    ]

    # Ship 4 (Founder diagnostic 2026-05-14): the prior sentinel check
    # passed while the page was visually wrong — sentinels only prove
    # structure, not balance. Extend with content-count sentinels grounded
    # in the data block, AND the Ship 3 rail expansion (search + chips +
    # all-62 rendering). Static checks only here — proportion check is in
    # scripts/visual-audit/verify-main-flows.mjs.
    mf_data_match = DATA_BLOCK_RE.search(mf_html)
    mf_data = None
    expected_total_components = None
    expected_total_steps = None
    if mf_data_match:
        try:
            mf_data = json.loads(mf_data_match.group(2))
            cols = mf_data.get("columns", []) or []
            expected_total_components = sum(len(c.get("components", []) or []) for c in cols)
            flows = mf_data.get("flows", []) or []
            expected_total_steps = sum(len(f.get("steps", []) or []) for f in flows)
        except json.JSONDecodeError:
            pass

    mf_checks = [
        ("mf-workspace",      'class="mf-workspace"' in mf_html),
        ("mf-grid",           'class="mf-grid"'      in mf_html or 'id="mf-grid"' in mf_html),
        ("6-column declared", "repeat(6," in mf_html),
        ("SVG arrows",        '<svg class="mf-arrows"' in mf_html or 'id="mf-arrows"' in mf_html),
        ("flows list rail",   'class="mf-flows-list"' in mf_html or 'id="mf-flows-list"' in mf_html),
        ("steps panel",       'class="mf-steps-list"' in mf_html or 'id="mf-steps-list"' in mf_html),
        ("arch-before-rail",  arch_first),
        # Ship 3 / Founder Q2 (2026-05-14): rail must carry search + filter
        # chips + render all 62 flows from data.flow_rail (not just F1-F8).
        ("rail search input",   'id="mf-rail-search"' in mf_html),
        ("rail filter chips",   'class="mf-rail-chips"' in mf_html),
        ("rail sources flow_rail", "railEntries()" in mf_html and "data.flow_rail" in mf_html),
        # Ship 4 / Founder brief 2026-05-14: content-count sentinels grounded
        # in the data block so display-layer regressions surface immediately.
        ("expected components (data)", expected_total_components is not None and expected_total_components >= 40),
        ("expected steps (data)",      expected_total_steps is not None and expected_total_steps >= 30),
        # P1 iter 16 (2026-05-14): expanded from 8 hand-authored flows to all
        # 62 via scripts/generate-flow-paths.py per Founder directive "every
        # rail click must light up the diagram". F1-F8 retain detailed
        # hand-authored steps; F9-F62 have generated paths derived from
        # flow_rail metadata + architecture component inventory.
        ("62 path-rich flows",         mf_data is not None and len((mf_data.get("flows") or [])) == 62),
        ("62 rail entries",            mf_data is not None and len((mf_data.get("flow_rail") or [])) == 62),
    ]
    # Iter 6 (2026-05-14, Founder directive): negative-presence sentinels.
    # Each check passes when the named token is ABSENT from the page.
    for name, token, _why in mf_iter6_negatives:
        mf_checks.append((f"iter6:{name}", token not in mf_html))
    mf_pass = all(ok for _, ok in mf_checks)
    if mf_pass:
        cc_note = f" ({expected_total_components} components, {expected_total_steps} steps)" if expected_total_components else ""
        print(green(f"  ✓ main-flows.html              arch grid + SVG arrows + rails + Ship-3 rail expansion intact{cc_note} ({sum(1 for _, ok in mf_checks if ok)}/{len(mf_checks)} sentinels)"))
    else:
        missing = [name for name, ok in mf_checks if not ok]
        print(red(f"  ✗ main-flows.html              missing sentinels: {missing}"))
        failures.append(("protected:main-flows", f"missing: {missing}"))

    # design-system.html: >=10 swatches + type ladder + component primitives
    ds_html = (REPORTS_SRC / "design-system.html").read_text(encoding="utf-8")
    swatch_count = ds_html.count('class="ds-swatch"')
    type_row_count = ds_html.count('class="ds-type-row"')
    ds_checks = [
        (f"{swatch_count} color swatches (>=10)", swatch_count >= 10),
        (f"{type_row_count} type-ladder rows (>=4)", type_row_count >= 4),
        ("component primitives section", 'ds-compose' in ds_html or 'Composition examples' in ds_html),
        ("form controls section", 'pb-filter-bar' in ds_html and ('pb-select' in ds_html or 'pb-input' in ds_html)),
    ]
    ds_pass = all(ok for _, ok in ds_checks)
    if ds_pass:
        print(green(f"  ✓ design-system.html           {swatch_count} swatches, {type_row_count} type rows, primitives + form controls present"))
    else:
        missing = [name for name, ok in ds_checks if not ok]
        print(red(f"  ✗ design-system.html           missing sentinels: {missing}"))
        failures.append(("protected:design-system", f"missing: {missing}"))

    # W1.S1 iteration 1: 3 spike-surfaced primitives must be declared
    # in components.css AND demonstrated in design-system.html showcase.
    # Added 2026-05-14 per W1.S1 ship plan acceptance criteria.
    components_css = (REPORTS_SRC / "_assets" / "design-system-components.css").read_text(encoding="utf-8")
    w1s1_primitives = [
        ("pb-avatar",       ".pb-avatar {",       "pb-avatar"),
        ("pb-list",         ".pb-list {",         "pb-list"),
        ("pb-list-row",     ".pb-list-row {",     "pb-list-row"),
        ("pb-trend-delta",  ".pb-trend-delta {",  "pb-trend-delta"),
    ]
    w1s1_checks = []
    for name, css_selector, html_class in w1s1_primitives:
        css_ok = css_selector in components_css
        showcase_ok = html_class in ds_html
        w1s1_checks.append((f"{name} declared in components.css", css_ok))
        w1s1_checks.append((f"{name} shown in design-system.html", showcase_ok))
    # Additional discipline: variants for leader-ring + up/down/flat
    w1s1_checks.append(("pb-avatar--leader-ring variant", "pb-avatar--leader-ring" in components_css))
    w1s1_checks.append(("pb-list-row--is-leader variant", "pb-list-row--is-leader" in components_css))
    w1s1_checks.append(("pb-trend-delta--up variant",    "pb-trend-delta--up" in components_css))
    w1s1_checks.append(("pb-trend-delta--down variant",  "pb-trend-delta--down" in components_css))
    w1s1_checks.append(("pb-trend-delta--flat variant",  "pb-trend-delta--flat" in components_css))
    w1s1_pass = all(ok for _, ok in w1s1_checks)
    if w1s1_pass:
        print(green(f"  ✓ W1.S1 primitives             4 primitives + 5 variants declared in components.css + demonstrated in showcase"))
    else:
        missing = [name for name, ok in w1s1_checks if not ok]
        print(red(f"  ✗ W1.S1 primitives             missing: {missing}"))
        failures.append(("w1s1:primitives", f"missing: {missing}"))

    # AMD-011 auto-execute scanner discipline. Every proposal in
    # ship-readiness-deferred/ must have a marker JSON with enumerated
    # criteria_failed. No orphan markers (marker for a proposal that's no
    # longer in approved/). No missing markers (approved/ proposal that
    # failed readiness but has no marker).
    print(cyan("\n[proposal-readiness] AMD-011 scanner state discipline..."))
    APPROVED_DIR = ROOT / ".claude" / "state" / "proposals" / "approved"
    DEFERRED_DIR = ROOT / ".claude" / "state" / "proposals" / "ship-readiness-deferred"
    pr_failures = []
    if DEFERRED_DIR.exists():
        for marker in sorted(DEFERRED_DIR.glob("*.json")):
            try:
                m = json.loads(marker.read_text(encoding="utf-8"))
            except Exception as e:
                pr_failures.append((marker.name, f"unparseable: {e}"))
                continue
            req = {"proposal_id", "deferred_at", "criteria_failed", "resolution_path"}
            missing = req - set(m.keys())
            if missing:
                pr_failures.append((marker.name, f"missing fields: {sorted(missing)}"))
            elif not isinstance(m.get("criteria_failed"), list) or len(m["criteria_failed"]) == 0:
                pr_failures.append((marker.name, "criteria_failed must be non-empty list"))
            # Orphan check — marker exists but no matching proposal in approved/
            prop_id = m.get("proposal_id", marker.stem)
            if APPROVED_DIR.exists():
                matching = list(APPROVED_DIR.glob(f"{prop_id}-*.md")) + list(APPROVED_DIR.glob(f"{prop_id}.md"))
                if not matching:
                    pr_failures.append((marker.name, f"orphan: no {prop_id}-*.md in approved/"))
    if pr_failures:
        print(red(f"  ✗ proposal-readiness markers have {len(pr_failures)} issues:"))
        for n, e in pr_failures[:5]:
            print(red(f"     {n}: {e}"))
        failures.append(("proposal-readiness:markers", f"{len(pr_failures)} issues"))
    else:
        marker_count = len(list(DEFERRED_DIR.glob("*.json"))) if DEFERRED_DIR.exists() else 0
        print(green(f"  ✓ proposal-readiness        {marker_count} deferred marker(s); schema valid; no orphans"))

    # Install script parseability (Founder directive 2026-05-14 INSTALL FLOW
    # IS BROKEN): every scripts/cron/install-*.ps1 must parse without errors.
    # The dashboard install-command surface was broken (window.location.origin
    # produced "cd file://" instead of a real path) and would have been caught
    # if install scripts had been smoke-tested for parseability.
    print(cyan("\n[install-scripts] PowerShell install script parseability..."))
    install_dir = ROOT / "scripts" / "cron"
    install_scripts = sorted(install_dir.glob("install-*.ps1")) if install_dir.exists() else []
    install_failures = []
    if not install_scripts:
        install_failures.append("no install-*.ps1 scripts found in scripts/cron/")
    else:
        # PowerShell parse check via -Command. Available on Windows; on
        # non-Windows hosts, skip gracefully. (Don't `import shutil` here —
        # the module is already imported at the top of this file, and a
        # local re-import triggers UnboundLocalError on later top-level
        # references like shutil.rmtree(TEST_WORKSPACE).)
        import subprocess
        import shutil as _shutil_mod
        ps = _shutil_mod.which("powershell.exe") or _shutil_mod.which("powershell") or _shutil_mod.which("pwsh")
        if not ps:
            print(yellow(f"  ~ install-scripts  PowerShell not available; skipping parseability check ({len(install_scripts)} scripts present)"))
        else:
            # AMD-009 P7 honest fix 2026-05-14: ParseFile() passes when actual
             # PowerShell execution fails (em-dash on a line confuses Windows
             # PowerShell 5.1's cp1252 byte handling). Smoke now also runs the
             # file via -File to verify it loads + parses with real encoding
             # context. The install scripts elevation-check early-exits 1
             # without doing destructive work, so this is safe to run.
            for script in install_scripts:
                try:
                    # Step 1: AST parse (existing check)
                    r = subprocess.run(
                        [ps, "-NoProfile", "-NonInteractive", "-Command",
                         f"$null = [System.Management.Automation.Language.Parser]::ParseFile('{str(script).replace(chr(92), chr(92)+chr(92))}', [ref]$null, [ref]$null)"],
                        capture_output=True, text=True, timeout=15, check=False,
                    )
                    if r.returncode != 0:
                        install_failures.append(f"{script.name}: parser exited {r.returncode}: {(r.stderr or '').strip()[:200]}")
                        continue
                    # Step 2: ASCII-only check (catches em-dash / smart-quote bytes
                    # that ParseFile tolerates but `-File` mode misreads as cp1252).
                    try:
                        raw_bytes = script.read_bytes()
                        try:
                            raw_bytes.decode("ascii")
                        except UnicodeDecodeError as e:
                            install_failures.append(f"{script.name}: contains non-ASCII byte at offset {e.start} ({raw_bytes[e.start:e.start+1].hex()}); PowerShell -File may misparse as cp1252")
                    except OSError as e:
                        install_failures.append(f"{script.name}: read failed: {e}")
                except (OSError, subprocess.SubprocessError) as e:
                    install_failures.append(f"{script.name}: parse probe error: {e}")
            if install_failures:
                print(red(f"  ✗ install-scripts  {len(install_failures)} parse failure(s):"))
                for f in install_failures[:10]:
                    print(red(f"     {f}"))
                failures.append(("install-scripts:parseability", f"{len(install_failures)} failures"))
            else:
                print(green(f"  ✓ install-scripts  {len(install_scripts)} scripts parse cleanly"))

            # AMD-016 reinforcement (Founder directive 2026-05-14 third-failure
             # fix): the Founder-facing install command surfaced in dashboard.html
             # must include "-ExecutionPolicy Bypass" otherwise default Windows
             # PowerShell ExecutionPolicy=Restricted blocks the .ps1 invocation.
             # This catches the recurring "command parses but won't execute in
             # Founder's context" pattern that has caused 3 ship failures.
            # Iter 16 (Founder directive: bypass-flag audit): install-all.ps1
            # now detects ExecutionPolicy at CurrentUser scope + offers proper
            # fix via Set-ExecutionPolicy RemoteSigned on first run. This
            # removes the need for per-invocation -ExecutionPolicy Bypass.
            # Round-trip check now verifies the dashboard surfaces either:
            #   (a) the proper one-time setup pattern (bare install-all.ps1
            #       invocation with policy-fix prompt explained in the
            #       surrounding <p>), OR
            #   (b) the legacy bypass-per-run pattern (still operates) — kept
            #       acceptable for back-compat
            # Either passes. The fundamental requirement remains: Set-Location
            # + literal repo path so Founder knows where to cd.
            print(cyan("\n[install-cmd-surface] Founder-facing install command execution-context check..."))
            dashboard_html = REPORTS_SRC / "dashboard.html"
            cmd_failures = []
            if dashboard_html.exists():
                dash_text = dashboard_html.read_text(encoding="utf-8")
                if "install-all.ps1" in dash_text:
                    pre_blocks = re.findall(r"<pre[^>]*>(.*?)</pre>", dash_text, re.DOTALL)
                    found_install_pre = False
                    for pre in pre_blocks:
                        if "install-all.ps1" in pre:
                            found_install_pre = True
                            # Set-Location check still applies — Founder needs
                            # to know which directory to cd to.
                            if "Set-Location" not in pre:
                                cmd_failures.append(
                                    "dashboard.html install command <pre> missing Set-Location — Founder won't know which directory to cd to"
                                )
                            if "C:\\\\Users\\\\Zach" not in pre and "C:\\Users\\Zach" not in pre:
                                cmd_failures.append(
                                    "dashboard.html install command <pre> missing literal repo path — Founder needs absolute path, not a template variable"
                                )
                            # ExecutionPolicy fix surfaced either via per-run
                            # Bypass flag (legacy) OR via the surrounding
                            # explanation text mentioning the one-time setup
                            # (post-iter-16). Both acceptable.
                            has_per_run_bypass = ("ExecutionPolicy" in pre and "Bypass" in pre)
                            # Check the surrounding text for the policy
                            # explanation (signals the proper-fix pattern).
                            pre_idx = dash_text.find(pre)
                            surrounding = dash_text[max(0, pre_idx-200):pre_idx+len(pre)+500] if pre_idx >= 0 else ""
                            has_policy_explanation = ("ExecutionPolicy" in surrounding or "RemoteSigned" in surrounding or "policy" in surrounding.lower())
                            if not has_per_run_bypass and not has_policy_explanation:
                                cmd_failures.append(
                                    "dashboard.html install command <pre> missing both ExecutionPolicy Bypass AND policy-fix explanation — Founder default Windows policy will block .ps1 execution without context"
                                )
                    if not found_install_pre:
                        m = re.search(r"'<pre[^>]*install-all\.ps1[^']*'", dash_text)
                        if m:
                            pre_literal = m.group(0)
                            # JS-literal: same dual-acceptance rule.
                            jsl_idx = dash_text.find(pre_literal)
                            surrounding = dash_text[max(0, jsl_idx-100):jsl_idx+len(pre_literal)+500] if jsl_idx >= 0 else ""
                            has_per_run_bypass = ("ExecutionPolicy" in pre_literal)
                            has_policy_explanation = ("ExecutionPolicy" in surrounding or "RemoteSigned" in surrounding or "policy" in surrounding.lower())
                            if not has_per_run_bypass and not has_policy_explanation:
                                cmd_failures.append(
                                    "dashboard.html JS-literal install <pre> missing both ExecutionPolicy Bypass AND policy-fix explanation"
                                )
            if cmd_failures:
                print(red(f"  ✗ install-cmd-surface  {len(cmd_failures)} issue(s):"))
                for f in cmd_failures[:5]:
                    print(red(f"     {f}"))
                failures.append(("install-cmd-surface:execution-context", f"{len(cmd_failures)} issues"))
            else:
                print(green("  ✓ install-cmd-surface  Founder-facing install command surfaces with execution-context handling (either per-run Bypass or one-time policy fix)"))

    # Scroll reachability (Founder directive 2026-05-14 iter 8): for every
    # scrollable surface the team ships, verify the LAST item is reachable +
    # visible after scrolling. Behavior test (not just DOM presence) — catches
    # scrollbar overlay covering last items, max-height too small for content
    # plus chrome below, padding-bottom missing on scrollable container,
    # collapsed <details> hiding last items. Implementation lives in
    # scripts/visual-audit/verify-scroll-reachability.mjs; round-trip invokes
    # it via node + parses exit code. Requires playwright (already installed
    # for capture-dashboards.mjs).
    print(cyan("\n[scroll-reachability] Last item reachable + visible on every scrollable surface..."))
    import subprocess
    scroll_script = ROOT / "scripts" / "visual-audit" / "verify-scroll-reachability.mjs"
    if not scroll_script.exists():
        print(yellow(f"  ~ scroll-reachability  script missing: {scroll_script.relative_to(ROOT)}"))
    else:
        try:
            scroll_proc = subprocess.run(
                ["node", str(scroll_script)],
                capture_output=True, text=True, timeout=180,
                cwd=str(ROOT),
            )
            if scroll_proc.returncode != 0:
                # Stderr contains the failure detail; emit last few lines.
                stderr_tail = (scroll_proc.stderr or "").strip().splitlines()[-6:]
                stdout_tail = (scroll_proc.stdout or "").strip().splitlines()[-6:]
                print(red(f"  ✗ scroll-reachability  exit {scroll_proc.returncode}"))
                for ln in stdout_tail: print(red(f"      {ln}"))
                for ln in stderr_tail: print(red(f"      {ln}"))
                failures.append(("scroll-reachability", f"exit {scroll_proc.returncode}"))
            else:
                # Parse the summary line "[scroll-reachability] N pass / M fail / K skip"
                summary = None
                for ln in (scroll_proc.stdout or "").splitlines():
                    if "pass /" in ln and "fail" in ln:
                        summary = ln.strip()
                        break
                if summary:
                    print(green(f"  ✓ scroll-reachability  {summary.split(']', 1)[-1].strip()}"))
                else:
                    print(green("  ✓ scroll-reachability  all surfaces pass"))
        except subprocess.TimeoutExpired:
            print(red("  ✗ scroll-reachability  timed out after 180s"))
            failures.append(("scroll-reachability", "timeout"))
        except FileNotFoundError:
            print(yellow("  ~ scroll-reachability  node not on PATH; skipping (CI-only)"))

    # User-context verification gate (Founder directive 2026-05-14 iter 9,
    # PROP-007): for any user-facing surface, a recent Founder-context
    # capture (channel:chrome headed Playwright, run by Founder) must
    # exist that is NEWER than the most recent surface modification.
    # Catches the 9-iteration main-flows pattern where agent-context
    # tests PASS while Founder's real Chrome shows broken state.
    #
    # Scoped narrowly to main-flows.html for the immediate ship; expand
    # to additional user-facing surfaces once Founder has confirmed the
    # pattern works.
    print(cyan("\n[user-context-gate] User-context capture present for modified user-facing surfaces..."))
    USER_CTX_ROOT = ROOT / ".claude" / "state" / "main-flows-v2" / "founder-real-context"
    user_ctx_failures = []
    user_ctx_skips = []
    USER_FACING_SURFACES = [
        (ROOT / "docs" / "reports" / "main-flows.html", "main-flows.html"),
        # Future expansion: add other user-facing surfaces here when
        # PROP-007 expands coverage (members-facing app pages, etc.)
    ]
    if not USER_CTX_ROOT.exists():
        # No captures yet — first run after PROP-007 lands. Don't fail;
        # surface a warning so the Founder can run the diagnostic.
        print(yellow(f"  ~ user-context-gate  no captures yet at {USER_CTX_ROOT.relative_to(ROOT)} — Founder runs `node scripts/visual-audit/founder-context-capture.mjs` to seed"))
    else:
        # Sort by mtime to handle mixed dir naming conventions (the
        # founder-context-capture.mjs script writes <ISO-timestamp>Z dirs;
        # ad-hoc helpers may write <name>-<epoch> dirs). mtime is the
        # authoritative ordering signal.
        capture_dirs = sorted([d for d in USER_CTX_ROOT.iterdir() if d.is_dir()], key=lambda d: d.stat().st_mtime, reverse=True)
        if not capture_dirs:
            print(yellow(f"  ~ user-context-gate  founder-real-context/ exists but has no capture dirs yet"))
        else:
            latest_capture_dir = capture_dirs[0]
            try:
                latest_capture_mtime = (latest_capture_dir / "capture-meta.json").stat().st_mtime if (latest_capture_dir / "capture-meta.json").exists() else latest_capture_dir.stat().st_mtime
            except OSError:
                latest_capture_mtime = 0

            for surface_path, surface_name in USER_FACING_SURFACES:
                if not surface_path.exists():
                    user_ctx_skips.append(f"{surface_name}: surface file missing — skipping")
                    continue
                surface_mtime = surface_path.stat().st_mtime
                if surface_mtime > latest_capture_mtime:
                    delta_minutes = (surface_mtime - latest_capture_mtime) / 60
                    user_ctx_failures.append(
                        f"{surface_name}: modified {delta_minutes:.1f} min after most recent user-context capture ({latest_capture_dir.name}) — Founder runs `node scripts/visual-audit/founder-context-capture.mjs` to seed fresh capture before ship-close"
                    )
                else:
                    delta_hours = (latest_capture_mtime - surface_mtime) / 3600
                    print(green(f"  ✓ user-context-gate  {surface_name} — capture {latest_capture_dir.name} is fresh ({delta_hours:.1f}h after last surface edit)"))

    if user_ctx_failures:
        for msg in user_ctx_failures:
            print(red(f"  ✗ user-context-gate  {msg}"))
        failures.append(("user-context-gate", f"{len(user_ctx_failures)} surface(s) modified after last capture"))
    if user_ctx_skips:
        for msg in user_ctx_skips:
            print(yellow(f"  ~ user-context-gate  {msg}"))

    # Escalations lifecycle discipline (Founder directive 2026-05-14):
    # 5-state lifecycle, schema integrity, no orphan markers, dashboard
    # count matches pending/ count.
    print(cyan("\n[escalations] Lifecycle + schema discipline..."))
    ESC_ROOT = ROOT / ".claude" / "state" / "escalations"
    REQUIRED_STATES = ["pending", "approved", "applied", "deferred", "rejected"]
    esc_failures = []
    if not ESC_ROOT.exists():
        esc_failures.append("escalations root directory missing — run state-directory migration")
    else:
        for s in REQUIRED_STATES:
            sub = ESC_ROOT / s
            if not sub.exists():
                esc_failures.append(f"state directory missing: {s}/")
                continue
        # Per-file schema check: every ESC-NNN.md has the required frontmatter
        # fields (id matches filename; title + question + proposed_answer present).
        REQUIRED_FIELDS = ["id", "title", "type", "question", "proposed_answer"]
        all_esc_files = []
        for s in REQUIRED_STATES:
            sub = ESC_ROOT / s
            if sub.exists():
                all_esc_files.extend([(s, f) for f in sub.glob("ESC-*.md")])
        for state, f in all_esc_files:
            try:
                text = f.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError) as e:
                esc_failures.append(f"{state}/{f.name}: unreadable ({e})")
                continue
            m = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
            if not m:
                esc_failures.append(f"{state}/{f.name}: no YAML frontmatter")
                continue
            head = m.group(1)
            for field in REQUIRED_FIELDS:
                if not re.search(rf"^{field}:", head, re.MULTILINE):
                    esc_failures.append(f"{state}/{f.name}: missing required field '{field}'")
            # ID-from-filename match: filename ESC-NNN-*.md should have id: ESC-NNN
            fname_id_m = re.match(r"^(ESC-\d+)-", f.name)
            if fname_id_m:
                expected_id = fname_id_m.group(1)
                id_match = re.search(r"^id:\s*(.+)$", head, re.MULTILINE)
                if id_match and id_match.group(1).strip() != expected_id:
                    esc_failures.append(f"{state}/{f.name}: filename id '{expected_id}' != frontmatter id '{id_match.group(1).strip()}'")
        # Founder Review Queue count cross-check: dashboard.html data block
        # open_escalations should match pending/ count.
        pending_count = len(list((ESC_ROOT / "pending").glob("ESC-*.md"))) if (ESC_ROOT / "pending").exists() else 0
        dashboard_path = REPORTS_SRC / "dashboard.html"
        if dashboard_path.exists():
            dtext = dashboard_path.read_text(encoding="utf-8")
            # Extract the data block + parse open_escalations length
            mdata = re.search(r'<script id="report-data" type="application/json">\s*(\{.*?\})\s*</script>', dtext, re.DOTALL)
            if mdata:
                try:
                    djson = json.loads(mdata.group(1))
                    open_esc = (djson.get("founder_queue", {}).get("governance_gates", {}).get("open_escalations") or [])
                    if len(open_esc) != pending_count:
                        esc_failures.append(f"dashboard.html open_escalations count={len(open_esc)} != pending/ count={pending_count}")
                except json.JSONDecodeError:
                    esc_failures.append("dashboard.html data block not parseable")
    if esc_failures:
        print(red(f"  ✗ escalations    {len(esc_failures)} issue(s):"))
        for f in esc_failures[:10]:
            print(red(f"     {f}"))
        failures.append(("escalations:lifecycle", f"{len(esc_failures)} issues"))
    else:
        applied_count = len(list((ESC_ROOT / "applied").glob("ESC-*.md"))) if (ESC_ROOT / "applied").exists() else 0
        pending_count = len(list((ESC_ROOT / "pending").glob("ESC-*.md"))) if (ESC_ROOT / "pending").exists() else 0
        approved_count = len(list((ESC_ROOT / "approved").glob("ESC-*.md"))) if (ESC_ROOT / "approved").exists() else 0
        deferred_count = len(list((ESC_ROOT / "deferred").glob("ESC-*.md"))) if (ESC_ROOT / "deferred").exists() else 0
        rejected_count = len(list((ESC_ROOT / "rejected").glob("ESC-*.md"))) if (ESC_ROOT / "rejected").exists() else 0
        print(green(f"  ✓ escalations    pending={pending_count} approved={approved_count} applied={applied_count} deferred={deferred_count} rejected={rejected_count}; schema valid; dashboard count matches"))

    # PROP-003.a quota-status.json schema discipline. The sidecar writes
    # this file on a 5-min cron cadence; consumers (PROP-003.b, future
    # PAUSE_DISCIPLINE meter-gate per AMD-014) depend on a stable schema.
    # File is gitignored (regenerated state); --absent-ok handles the
    # case where the sidecar hasn't run in this clone yet.
    print(cyan("\n[quota-status] PROP-003.a sidecar schema discipline..."))
    quota_schema_check = ROOT / "tests" / "checks" / "quota-status-schema.py"
    if quota_schema_check.exists():
        try:
            import subprocess
            r = subprocess.run(
                [sys.executable, str(quota_schema_check), "--absent-ok"],
                cwd=str(ROOT), capture_output=True, text=True, timeout=30,
            )
            if r.returncode == 0:
                line = (r.stdout.strip().splitlines() or ["(no output)"])[-1]
                print(green(f"  ✓ quota-status        {line}"))
            else:
                print(red(f"  ✗ quota-status        validator exit={r.returncode}"))
                for ln in (r.stdout + r.stderr).strip().splitlines()[-5:]:
                    print(red(f"     {ln}"))
                failures.append(("quota-status:schema", f"validator exit {r.returncode}"))
        except Exception as e:
            print(red(f"  ✗ quota-status        validator invocation failed: {e}"))
            failures.append(("quota-status:invocation", str(e)))
    else:
        print(red(f"  ✗ quota-status        validator missing at {quota_schema_check.relative_to(ROOT)}"))
        failures.append(("quota-status:validator-missing", str(quota_schema_check)))

    # Pause-discipline guard (Phase 6.6): no production-tree references to the
    # fictional 3.5M cap or budget_pct. The audit doc + governance drafts +
    # historical proposals are explicitly exempt.
    print(cyan("\n[pause-discipline] No fictional-cap references in production tree..."))
    FICTIONAL_RE = re.compile(r"(?<![0-9.])(3\.5M|3500000|3,500,000|weekly_budget_cap|budget_pct|weekly_tokens_cap)\b")
    PD_SCOPE = [
        ROOT / "docs" / "reports",
        ROOT / "scripts",
    ]
    PD_EXEMPT_PATHS = [
        ROOT / ".claude" / "state" / "wave-zero-dry-run" / "fictional-cap-audit.md",
        ROOT / ".claude" / "state" / "wave-zero-dry-run" / "remediation",
        ROOT / ".claude" / "state" / "proposals",  # historical proposal artifacts
        ROOT / ".claude" / "state" / "amendments", # AMD drafts deprecate the fictional cap; references are documentary
        ROOT / "docs" / "reports" / "amendments.html",  # rendered AMD drafts (body previews mirror exempt sources)
        ROOT / "scripts" / "cron" / "quarantine",   # maintenance script holding area
        ROOT / "scripts" / "refresh-quota-manual.ps1",  # placeholder caps for % -> tokens conversion
        ROOT / "scripts" / "sidecar" / "usage-snapshot.ps1",  # same role: % -> tokens via plan_a manual-paste-derived (PROP-003.a)
        ROOT / "scripts" / "sidecar" / "usage-snapshot-config.json",  # operator-overridable caps; not a hardcoded ceiling
        ROOT / "scripts" / "sidecar" / "README.md",  # documents the caps used by refresh-quota-manual.ps1 (same exempt rationale)
    ]
    def _is_exempt(p):
        for ex in PD_EXEMPT_PATHS:
            try:
                p.relative_to(ex)
                return True
            except ValueError:
                continue
        return False
    pd_failures = []
    for root in PD_SCOPE:
        if not root.exists():
            continue
        for f in root.rglob("*"):
            if not f.is_file():
                continue
            if _is_exempt(f):
                continue
            if f.suffix not in {".py", ".ps1", ".sh", ".html", ".js", ".css", ".json", ".md"}:
                continue
            try:
                text = f.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            for m in FICTIONAL_RE.finditer(text):
                pd_failures.append((str(f.relative_to(ROOT)), m.group(0)))
                if len(pd_failures) >= 20:
                    break
            if len(pd_failures) >= 20:
                break
        if len(pd_failures) >= 20:
            break
    if pd_failures:
        print(red(f"  ✗ {len(pd_failures)} fictional-cap reference(s) in production tree:"))
        for path, tok in pd_failures[:10]:
            print(red(f"     {path}: '{tok}'"))
        failures.append(("pause-discipline:fictional-cap-refs", f"{len(pd_failures)} refs"))
    else:
        print(green("  ✓ no fictional-cap references in production tree (audit doc + governance drafts + historical proposals exempt)"))

    # Wiring assertions: cross-check that scenarios in activity data match canonical CSS classes.
    # Accept either legacy `.activity-item.scenario-X` or new `.act-item.scenario-X` during migration.
    print(cyan("\n[wiring] Cross-checking scenario tokens against CSS + dropdown..."))
    activity_html = (test_reports / "activity.html").read_text(encoding="utf-8")
    scenarios_in_data = {h["scenario"] for h in activity_data["handoffs"]}
    for scenario in scenarios_in_data:
        legacy_class = f".activity-item.scenario-{scenario}::before"
        new_class    = f".act-item.scenario-{scenario}::before"
        dropdown = f'<option value="{scenario}">'
        css_ok = (legacy_class in activity_html) or (new_class in activity_html)
        drop_ok = dropdown in activity_html
        if css_ok and drop_ok:
            print(green(f"  ✓ {scenario:32s} has CSS class + dropdown option"))
        else:
            problems = []
            if not css_ok: problems.append("CSS class missing")
            if not drop_ok: problems.append("dropdown option missing")
            print(red(f"  ✗ {scenario:32s} {', '.join(problems)}"))
            failures.append((f"wiring:{scenario}", ", ".join(problems)))

    # Final result
    print()
    if not failures:
        print(green(bold("=== ALL CHECKS PASSED ===")))
        print(cyan(f"\nOutputs written to: {test_reports}"))
        print(cyan("Open dashboard.html in a browser to visually verify rendering.\n"))
        return 0
    else:
        print(red(bold(f"=== {len(failures)} FAILURE(S) ===")))
        for name, err in failures:
            print(red(f"  - {name}: {err}"))
        return 1


if __name__ == "__main__":
    sys.exit(main())
