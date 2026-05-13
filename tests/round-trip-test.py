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

    # Cross-dashboard nav structure: verify all 6 production dashboards carry the canonical 6-link nav
    # Test runs against REPORTS_SRC (the real docs/reports/), not the test workspace —
    # the nav lives in the production templates, not in seeded synthetic state.
    print(cyan("\n[nav] Cross-dashboard navigation audit..."))
    NAV_LINKS_REQUIRED = ["dashboard.html", "activity.html", "discussion-bubbles.html", "proposals.html", "main-flows.html", "design-system.html", "token-usage.html", "index.html"]
    NAV_PAGES = [
        ("dashboard.html",         "dashboard.html"),
        ("activity.html",          "activity.html"),
        ("discussion-bubbles.html","discussion-bubbles.html"),
        ("proposals.html",         "proposals.html"),
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
                    expected_dashes = {"dashboard.html", "activity.html", "discussion-bubbles.html", "proposals.html", "main-flows.html"}
                    missing_dashes = expected_dashes - set(dashboards.keys())
                    if missing_dashes:
                        print(red(f"  ✗ index.html dashboards missing: {missing_dashes}"))
                        failures.append(("index.html", f"missing dashboards: {missing_dashes}"))
                    else:
                        print(green(f"  ✓ index.html                   data block valid, status + 5 dashboard entries present"))
            except json.JSONDecodeError as e:
                print(red(f"  ✗ index.html JSON parse: {e}"))
                failures.append(("index.html", f"JSON parse: {e}"))
    else:
        print(red("  ✗ index.html (production) MISSING"))
        failures.append(("index.html", "production file missing"))

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
    cands = []
    if act_data is not None:
        cands.append(("activity.html data.handoffs.length", len(act_data.get("handoffs", []))))
    if dash_data is not None:
        cands.append(("dashboard.html data.recent_handoffs.length", len(dash_data.get("recent_handoffs", []))))
    # NOTE: dashboard.recent_handoffs is capped at 5 by design; only compare against truth if truth <= 5
    if truth_handoffs_total <= 5:
        check_eq("handoffs_total", truth_handoffs_total, cands)
    else:
        # Truth >5 — only assert activity.html count == truth; dashboard is "recent" subset
        act_count = len(act_data.get("handoffs", [])) if act_data else 0
        if act_count == truth_handoffs_total:
            print(green(f"  ✓ {'handoffs_total':40s} ground={truth_handoffs_total} activity.html={act_count} (dashboard.recent_handoffs is design-capped at 5, skipped)"))
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
        legacy = ["dashboard.html", "activity.html", "proposals.html", "discussion-bubbles.html", "main-flows.html", "index.html"]
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

                # The dashboard MUST visually distinguish real vs estimated. Detect the
                # hatched CSS pattern that marks estimated bars (load-bearing per spec).
                if "hatch" not in html.lower() and "stripe" not in html.lower():
                    print(red("  ✗ token-usage.html missing hatched/striped pattern for estimated bars"))
                    failures.append(("token-usage:visual-distinction", "no hatch/stripe pattern in CSS"))
                else:
                    print(green("  ✓ token-usage.html visual distinction (hatched/striped) present"))

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
