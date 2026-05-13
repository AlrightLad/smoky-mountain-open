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
def green(s): return f"\033[32m{s}\033[0m"
def red(s):   return f"\033[31m{s}\033[0m"
def cyan(s):  return f"\033[36m{s}\033[0m"
def bold(s):  return f"\033[1m{s}\033[0m"


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
        "budget_pct": 0.689,
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
    (aggregates / "current-snapshot.json").write_text(json.dumps(snapshot, indent=2))

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
        fpath.write_text(body)

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
        (bubbles / filename).write_text(body)

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
        (proposals / filename).write_text(body)

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
            body = f.read_text()
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
        body = f.read_text()
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
        body = f.read_text()
        m = re.search(r"^---\n(.*?)\n---", body, re.DOTALL)
        if not m:
            continue
        out.append(json.loads(m.group(1)))
    return out


def read_snapshot(state_root: Path):
    return json.loads((state_root / "telemetry" / "aggregates" / "current-snapshot.json").read_text())


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
        "budget_pct": snap["budget_pct"],
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
    html = html_path.read_text()
    new_json = json.dumps(new_data, indent=2)
    replacement = lambda m: m.group(1) + new_json + m.group(3)
    new_html, count = DATA_BLOCK_RE.subn(replacement, html, count=1)
    if count != 1:
        return False, f"data block not matched (count={count})"
    html_path.write_text(new_html)
    return True, None


# ---------- Verification ----------
def verify_html(html_path: Path, required_keys: list):
    """Verify HTML can be re-read, data block parses as JSON, required keys present."""
    html = html_path.read_text()
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
    bubbles_html = (test_reports / "discussion-bubbles.html").read_text()
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

    # Wiring assertions: cross-check that scenarios in activity data match canonical CSS classes
    print(cyan("\n[wiring] Cross-checking scenario tokens against CSS + dropdown..."))
    activity_html = (test_reports / "activity.html").read_text()
    scenarios_in_data = {h["scenario"] for h in activity_data["handoffs"]}
    for scenario in scenarios_in_data:
        css_class = f".activity-item.scenario-{scenario}::before"
        dropdown = f'<option value="{scenario}">'
        css_ok = css_class in activity_html
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
