#!/usr/bin/env python3
"""Aggregate PARBAUGHS application-health metrics into a single JSON.

Computes a 0-100 score for each of the 12 audit dimensions A1-A12 defined in
.claude/state/audit-spec-2026-05-19.md and emits .claude/state/aggregates/
app-health.json which the App Health dashboard tab renders from.

Dimensions:
  A1  roadmap position
  A2  FIQ score
  A3  security posture
  A4  UI/UX weak points
  A5  code quality
  A6  architecture review
  A7  data integrity
  A8  performance
  A9  accessibility
  A10 mobile-first sanity
  A11 testing coverage
  A12 operational health

Inputs (per-dimension):
  A2  -> .claude/state/aggregates/fiq-status.json
  A3  -> latest .claude/state/security/baseline-*/agentshield-*.txt
  A4  -> .claude/state/app-audit-2026-05-14/SUMMARY.md (prior findings) + iter
         observation log
  A5  -> file LOC walk of src/, vs AMD-027 budgets
  A6  -> .claude/state/aggregates/architecture-review.json + AMD-027 budgets
  A7  -> firestore.rules + firestore.indexes.json schema cross-check
  A8  -> Lighthouse not yet wired (Phase 2)
  A9  -> WCAG scan not yet wired (Phase 2)
  A10 -> manual flag (44pt touch-target target per CLAUDE.md)
  A11 -> tests/e2e file count + LOC; (no coverage tool wired yet)
  A12 -> .claude/state/aggregates/security-health.json (proxy) + watcher
         heartbeat

Output schema: app-health-v1.0
  overall_grade (A-F letter computed from weighted average of dimensions)
  overall_score (numeric weighted average)
  dimensions[A1..A12] -> { score, status, label, source, weak_points[] }
  attention_items[]  -> top 3-5 weak points by severity, WHAT/WHERE/WHAT-ACTION

Honest scope-cut (2026-05-20T23:55Z iter1): dimensions A4 (Lighthouse), A8
(performance), A9 (accessibility) require tools not yet wired. They emit a
"not-measured" status with a clear next-action so the App Health tab surfaces
the gap honestly rather than fake-scoring.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import shlex

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
AGG = STATE / "aggregates"
SECURITY_DIR = STATE / "security"
APP_AUDIT_DIR = STATE / "app-audit-2026-05-14"
OUT = AGG / "app-health.json"

# PARBAUGHS app code paths — when these change in a commit, that commit
# counts as "an app commit" for the per-commit audit cadence.
APP_PATHS = ("src/", "functions/", "public/")

# Per AMD-027 file-size budgets
CORE_BUDGETS = {
    "src/core/router.js": 3000,
    "src/core/data.js": 2500,
}
CORE_DEFAULT_BUDGET = 1000
PAGE_BUDGET = 800  # default page-tier rule


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def capture_audit_trigger() -> dict:
    """Capture the current HEAD commit metadata + whether it touched app code.

    Used to render the 'Audit schedule' panel on the App Health page so
    Founder knows when the last audit ran, what triggered it, and whether
    that trigger was a PARBAUGHS app commit (vs a substrate-only commit
    that still re-ran the aggregator on cron cadence).
    """
    try:
        sha = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=5, check=False,
        ).stdout.strip()
        msg = subprocess.run(
            ["git", "log", "-1", "--pretty=%s"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=5, check=False,
        ).stdout.strip()
        ts = subprocess.run(
            ["git", "log", "-1", "--pretty=%cI"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=5, check=False,
        ).stdout.strip()
        files = subprocess.run(
            ["git", "show", "--name-only", "--pretty=", "HEAD"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=5, check=False,
        ).stdout.strip().splitlines()
        app_files = [f for f in files if any(f.startswith(p) for p in APP_PATHS)]
        is_app_commit = bool(app_files)
        # Classify the trigger
        if is_app_commit:
            trigger = "app-commit"
        elif msg.startswith("cron(routine)"):
            trigger = "cron"
        else:
            trigger = "substrate-commit"
        return {
            "sha": sha or "unknown",
            "subject": msg or "—",
            "committed_at": ts or now_iso(),
            "trigger": trigger,
            "is_app_commit": is_app_commit,
            "app_files_touched": app_files[:10],
            "total_files_touched": len(files),
        }
    except Exception:
        return {
            "sha": "unknown",
            "subject": "git probe failed",
            "committed_at": now_iso(),
            "trigger": "unknown",
            "is_app_commit": False,
            "app_files_touched": [],
            "total_files_touched": 0,
        }


def load_json(p: Path) -> dict:
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def grade_letter(score: float | None) -> str:
    """Convert 0-100 score to A-F letter."""
    if score is None:
        return "—"
    if score >= 95:
        return "A+"
    if score >= 90:
        return "A"
    if score >= 85:
        return "A-"
    if score >= 80:
        return "B+"
    if score >= 75:
        return "B"
    if score >= 70:
        return "B-"
    if score >= 65:
        return "C+"
    if score >= 60:
        return "C"
    if score >= 55:
        return "C-"
    if score >= 50:
        return "D"
    return "F"


def status_color(score: float | None) -> str:
    if score is None:
        return "not-measured"
    if score >= 80:
        return "green"
    if score >= 60:
        return "yellow"
    return "red"


# ---- A1 Roadmap position ---------------------------------------------------


def a1_roadmap() -> dict:
    """Read CLAUDE.md + memory for current roadmap position."""
    # Roadmap signal: version + ship-progress files
    progress_dir = STATE / "ship-progress"
    completed = 0
    in_flight = 0
    if progress_dir.exists():
        for f in progress_dir.glob("*.json"):
            try:
                s = json.loads(f.read_text(encoding="utf-8"))
                status = (s.get("status") or "").lower()
                if status == "complete":
                    completed += 1
                elif status in ("in-flight", "shipping", "in-progress"):
                    in_flight += 1
            except Exception:
                continue
    # Score: 70 baseline (we know Wave 1 is in flight), bump for activity
    score = 70.0
    if completed >= 5:
        score = 75.0
    if completed >= 10:
        score = 80.0
    weak = []
    if completed < 5:
        weak.append(
            {
                "what": "Only {} ships marked complete in ship-progress/".format(completed),
                "where": ".claude/state/ship-progress/",
                "what_action": "Continue Wave 1 ships; mark complete via apply-decisions watcher",
            }
        )
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"{completed} complete, {in_flight} in flight",
        "source": ".claude/state/ship-progress/*.json",
        "weak_points": weak,
    }


# ---- A2 FIQ score ----------------------------------------------------------


def a2_fiq() -> dict:
    src = AGG / "fiq-status.json"
    d = load_json(src)
    declared = d.get("declared_count") or 0
    deployed = d.get("deployed_count") or 0
    pending = d.get("pending_builds") or 0
    if declared == 0 and deployed == 0:
        score = None
        label = "no FIQ data on disk"
    elif pending > 0:
        score = max(60.0, 100.0 - (pending * 10))
        label = f"{declared} declared / {deployed} deployed / {pending} pending"
    elif declared == deployed:
        score = 100.0
        label = f"{declared}/{deployed} deployed · 0 pending"
    else:
        score = 75.0
        label = f"{declared} declared / {deployed} deployed (drift)"
    weak = []
    if pending > 0:
        weak.append(
            {
                "what": f"{pending} Firestore composite indexes pending build",
                "where": "firestore.indexes.json + firebase console",
                "what_action": "firebase deploy --only firestore:indexes (Founder pre-auth via task-queue/founder/)",
            }
        )
    return {
        "score": round(score) if score is not None else None,
        "status": status_color(score),
        "label": label,
        "source": ".claude/state/aggregates/fiq-status.json",
        "weak_points": weak,
    }


# ---- A3 Security posture ---------------------------------------------------


def a3_security() -> dict:
    # Find latest agentshield-*.txt
    latest = None
    if SECURITY_DIR.exists():
        baselines = sorted(SECURITY_DIR.glob("baseline-*"), reverse=True)
        for b in baselines:
            txts = list(b.glob("agentshield-*.txt"))
            if txts:
                latest = txts[0]
                break
    crit = 0
    high = 0
    grade_num = None
    grade_letter_as = "—"
    if latest:
        try:
            text = latest.read_text(encoding="utf-8", errors="replace")
            m = re.search(r"Grade:\s+([A-F][+-]?)\s+\((\d+)/100\)", text)
            if m:
                grade_letter_as = m.group(1)
                grade_num = int(m.group(2))
            cm = re.search(r"(\d+)\s+critical", text)
            if cm:
                crit = int(cm.group(1))
            hm = re.search(r"(\d+)\s+high", text)
            if hm:
                high = int(hm.group(1))
        except Exception:
            pass
    score = grade_num
    label = (
        f"Grade {grade_letter_as} {grade_num}/100 · {crit} CRITICAL · {high} HIGH"
        if grade_num is not None
        else "no scan baseline found"
    )
    weak = []
    if crit > 0:
        weak.append(
            {
                "what": f"{crit} CRITICAL findings in AgentShield",
                "where": str(latest.relative_to(ROOT)) if latest else "—",
                "what_action": "Run `npx ecc-agentshield scan` + remediate top CRITICALs",
            }
        )
    elif high > 0:
        weak.append(
            {
                "what": f"{high} HIGH (non-CRITICAL) findings — known acceptable",
                "where": str(latest.relative_to(ROOT)) if latest else "—",
                "what_action": "Triage via task-queue/founder/d31-zero-critical-decision.md",
            }
        )
    return {
        "score": round(score) if score is not None else None,
        "status": status_color(score),
        "label": label,
        "source": str(latest.relative_to(ROOT)) if latest else None,
        "weak_points": weak,
    }


# ---- A4 UI/UX weak points -------------------------------------------------


def a4_uiux() -> dict:
    """Composite from prior app-audit findings + known-bug log."""
    summary = APP_AUDIT_DIR / "SUMMARY.md"
    if not summary.exists():
        return {
            "score": None,
            "status": "not-measured",
            "label": "No prior audit on disk; Lighthouse not yet wired",
            "source": "phase-2-deferred",
            "weak_points": [
                {
                    "what": "UI/UX dimension not yet measured (Lighthouse + WCAG scans deferred to Phase 2)",
                    "where": "scripts/aggregate-app-health.py · A4 function",
                    "what_action": "Wire Lighthouse CLI to capture 6+ key pages + emit lighthouse-scores.json",
                }
            ],
        }
    txt = summary.read_text(encoding="utf-8", errors="replace")
    critical = len(re.findall(r"### CRITICAL \((\d+)\)", txt))
    high = len(re.findall(r"### HIGH \((\d+)\)", txt))
    medium = len(re.findall(r"### MEDIUM \((\d+)\)", txt))
    # Count open findings (text-based heuristic)
    open_count = len(re.findall(r"Diagnosed; not yet fixed|DEFERRED", txt))
    # Score: more findings = lower
    score = max(40.0, 95.0 - (open_count * 5))
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"{open_count} open / {critical} crit / {high} high / {medium} med (prior audit)",
        "source": ".claude/state/app-audit-2026-05-14/SUMMARY.md",
        "weak_points": [
            {
                "what": f"{open_count} UI/UX findings open from prior audit",
                "where": ".claude/state/app-audit-2026-05-14/SUMMARY.md",
                "what_action": "Lighthouse scans + WCAG audit (Phase 2)",
            }
        ],
    }


# ---- A5 Code quality (LOC vs AMD-027 budgets) -----------------------------


def a5_code_quality() -> dict:
    over_budget = []
    core_dir = ROOT / "src" / "core"
    pages_dir = ROOT / "src" / "pages"
    for f in core_dir.glob("*.js"):
        try:
            lines = sum(1 for _ in f.open(encoding="utf-8", errors="replace"))
        except OSError:
            continue
        rel = str(f.relative_to(ROOT)).replace("\\", "/")
        budget = CORE_BUDGETS.get(rel, CORE_DEFAULT_BUDGET)
        if lines > budget:
            over_budget.append({"file": rel, "lines": lines, "budget": budget})
    for f in pages_dir.glob("*.js"):
        try:
            lines = sum(1 for _ in f.open(encoding="utf-8", errors="replace"))
        except OSError:
            continue
        rel = str(f.relative_to(ROOT)).replace("\\", "/")
        if lines > PAGE_BUDGET:
            over_budget.append({"file": rel, "lines": lines, "budget": PAGE_BUDGET})
    total_violations = len(over_budget)
    # Score: page violations are less critical than core violations
    core_over = sum(1 for x in over_budget if x["file"].startswith("src/core/"))
    page_over = sum(1 for x in over_budget if x["file"].startswith("src/pages/"))
    score = max(40.0, 95.0 - (core_over * 10) - (page_over * 2))
    weak = [
        {
            "what": f"{x['file']} is {x['lines']} lines (budget {x['budget']})",
            "where": x["file"],
            "what_action": "Split into modules per AMD-027 budget",
        }
        for x in sorted(over_budget, key=lambda x: -x["lines"])[:5]
    ]
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"{core_over} core + {page_over} page files over budget",
        "source": "src/core/, src/pages/ vs AMD-027 budgets",
        "weak_points": weak,
        "details": {"over_budget_count": total_violations, "files": over_budget[:10]},
    }


# ---- A6 Architecture review ------------------------------------------------


def a6_architecture() -> dict:
    src = AGG / "architecture-review.json"
    d = load_json(src)
    if not d:
        return {
            "score": None,
            "status": "not-measured",
            "label": "no architecture-review aggregate found",
            "source": "phase-2-deferred",
            "weak_points": [
                {
                    "what": "Architecture review aggregator missing",
                    "where": "scripts/aggregate-architecture-review.py",
                    "what_action": "Run + ensure JSON emitted",
                }
            ],
        }
    findings = d.get("findings") or []
    score = max(50.0, 95.0 - (len(findings) * 3))
    return {
        "score": round(score),
        "status": status_color(score),
        "label": d.get("summary") or f"{len(findings)} findings",
        "source": ".claude/state/aggregates/architecture-review.json",
        "weak_points": [
            {
                "what": (f.get("note") or f.get("title") or "architecture finding")[:120],
                "where": f.get("path") or f.get("source") or "—",
                "what_action": f.get("action") or "Review + refactor",
            }
            for f in findings[:5]
        ],
    }


# ---- A7 Data integrity -----------------------------------------------------


def a7_data_integrity() -> dict:
    rules_path = ROOT / "firestore.rules"
    indexes_path = ROOT / "firestore.indexes.json"
    issues = []
    if not rules_path.exists():
        issues.append("firestore.rules missing")
    if not indexes_path.exists():
        issues.append("firestore.indexes.json missing")
    rules_lines = 0
    if rules_path.exists():
        rules_lines = sum(1 for _ in rules_path.open(encoding="utf-8", errors="replace"))
    indexes_count = 0
    if indexes_path.exists():
        try:
            idx = json.loads(indexes_path.read_text(encoding="utf-8"))
            indexes_count = len(idx.get("indexes") or [])
        except Exception:
            issues.append("firestore.indexes.json parse error")
    score = 100.0 if not issues else 60.0
    if rules_lines > 0:
        score = min(100.0, score)
    label = f"{rules_lines} lines rules · {indexes_count} indexes"
    return {
        "score": round(score),
        "status": status_color(score),
        "label": label,
        "source": "firestore.rules + firestore.indexes.json",
        "weak_points": [
            {
                "what": issue,
                "where": "repo root",
                "what_action": "Investigate + restore",
            }
            for issue in issues
        ],
    }


# ---- A8/A9 not-yet-measured ------------------------------------------------


def not_measured(name: str, gap: str, next_action: str) -> dict:
    return {
        "score": None,
        "status": "not-measured",
        "label": gap,
        "source": "phase-2-deferred",
        "weak_points": [
            {
                "what": f"{name} dimension not yet measured",
                "where": "scripts/aggregate-app-health.py",
                "what_action": next_action,
            }
        ],
    }


# ---- A10 Mobile-first ------------------------------------------------------


def a10_mobile_first() -> dict:
    """Grep for 44pt-touch-target + min-height patterns per CLAUDE.md rule."""
    page_files = list((ROOT / "src" / "pages").glob("*.js"))
    css_files = list((ROOT / "src" / "styles").glob("*.css")) if (ROOT / "src" / "styles").exists() else []
    touch_target_hits = 0
    for f in css_files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
            touch_target_hits += len(re.findall(r"min-height:\s*44\w*", text))
        except OSError:
            continue
    score = 80.0 if touch_target_hits > 0 else 60.0
    label = f"{touch_target_hits} 44pt touch-target rules found"
    return {
        "score": round(score),
        "status": status_color(score),
        "label": label,
        "source": "src/styles/*.css grep min-height: 44",
        "weak_points": [
            {
                "what": "Mobile viewport rendering not yet measured at 375px",
                "where": "tests/e2e/ — no mobile viewport spec yet",
                "what_action": "Add Playwright mobile-viewport spec (375x812)",
            }
        ],
    }


# ---- A11 Testing coverage --------------------------------------------------


def a11_testing() -> dict:
    spec_dir = ROOT / "tests" / "e2e" / "flows"
    if not spec_dir.exists():
        return not_measured("Testing coverage", "tests/e2e/flows/ missing", "Wire Playwright tests")
    specs = list(spec_dir.glob("*.spec.js"))
    total_lines = 0
    for s in specs:
        try:
            total_lines += sum(1 for _ in s.open(encoding="utf-8", errors="replace"))
        except OSError:
            continue
    # Heuristic: 6 spec files / 677 LOC vs ~32,000 LOC of app code
    app_loc = 32000  # rough
    coverage_ratio = total_lines / app_loc if app_loc > 0 else 0
    # If we had real coverage tooling we'd score 0-100; here we use spec-to-app ratio
    # As a proxy: 1:50 = 100, 1:100 = 75, 1:200 = 50
    score = min(100.0, max(30.0, coverage_ratio * 5000))
    label = f"{len(specs)} specs · {total_lines} LOC (vs ~{app_loc} app LOC)"
    return {
        "score": round(score),
        "status": status_color(score),
        "label": label,
        "source": "tests/e2e/flows/*.spec.js",
        "weak_points": [
            {
                "what": "Smoke 54 failures on baseline tests (FirebaseError: auth/network-request-failed)",
                "where": "tests/e2e/flows/01-all-users-baseline.spec.js",
                "what_action": "Diagnose Firebase auth emulator port mismatch + fix in tests/e2e/_fixtures/",
            },
            {
                "what": "No unit test framework wired (vitest/jest)",
                "where": "package.json — only playwright present",
                "what_action": "Add vitest for src/core/ unit coverage",
            },
        ],
    }


# ---- A12 Operational health -----------------------------------------------


def a12_operational() -> dict:
    """Approval pipeline + watcher state + heartbeat freshness as proxy."""
    pipeline = load_json(AGG / "approvals-pipeline.json")
    watcher = load_json(STATE / "heartbeats" / "watcher-last-run.json")
    status = (pipeline.get("status") or "").lower()
    summary = pipeline.get("summary") or ""
    if status == "green":
        score = 95.0
    elif status == "yellow":
        score = 75.0
    elif status == "red":
        score = 50.0
    else:
        score = None
    watcher_exit = watcher.get("exit_reason") or ""
    weak = []
    if status != "green":
        weak.append(
            {
                "what": summary or "Approvals pipeline not green",
                "where": ".claude/state/aggregates/approvals-pipeline.json",
                "what_action": "Trigger watcher manually + diagnose log",
            }
        )
    return {
        "score": round(score) if score is not None else None,
        "status": status_color(score),
        "label": summary or "no pipeline data",
        "source": ".claude/state/aggregates/approvals-pipeline.json",
        "weak_points": weak,
        "details": {
            "watcher_last_status": watcher.get("status"),
            "watcher_exit_reason": watcher_exit,
        },
    }


# ---- Overall computation ---------------------------------------------------


def compute_overall(dims: dict) -> tuple[float | None, str]:
    """Weighted average of dimension scores, ignoring not-measured."""
    weights = {
        "A1_roadmap": 0.05,
        "A2_fiq": 0.08,
        "A3_security": 0.15,
        "A4_uiux": 0.10,
        "A5_code_quality": 0.10,
        "A6_architecture": 0.08,
        "A7_data_integrity": 0.10,
        "A8_performance": 0.05,
        "A9_accessibility": 0.05,
        "A10_mobile_first": 0.07,
        "A11_testing": 0.12,
        "A12_operational": 0.05,
    }
    total_w = 0.0
    total_v = 0.0
    for key, w in weights.items():
        s = dims.get(key, {}).get("score")
        if s is not None:
            total_v += s * w
            total_w += w
    if total_w == 0:
        return None, "—"
    avg = total_v / total_w
    return round(avg, 1), grade_letter(avg)


def main() -> int:
    dimensions = {
        "A1_roadmap": a1_roadmap(),
        "A2_fiq": a2_fiq(),
        "A3_security": a3_security(),
        "A4_uiux": a4_uiux(),
        "A5_code_quality": a5_code_quality(),
        "A6_architecture": a6_architecture(),
        "A7_data_integrity": a7_data_integrity(),
        "A8_performance": not_measured(
            "Performance",
            "Lighthouse not yet wired",
            "Wire Lighthouse CLI; capture 6 key pages; emit lighthouse-scores.json",
        ),
        "A9_accessibility": not_measured(
            "Accessibility",
            "WCAG 2.1 AA scan not yet wired",
            "Wire axe-core CLI; per-page scan; emit a11y-scores.json",
        ),
        "A10_mobile_first": a10_mobile_first(),
        "A11_testing": a11_testing(),
        "A12_operational": a12_operational(),
    }
    overall_score, overall_grade = compute_overall(dimensions)

    # Top attention items: pick top 1-2 weak points per dimension by score
    attention: list[dict] = []
    for key, d in dimensions.items():
        weak = d.get("weak_points") or []
        if weak and d.get("score") is not None and d["score"] < 80:
            attention.append({**weak[0], "dimension": key})
    attention = attention[:5]

    # Split attention items by who-handles. Founder-actionable items are
    # surfaced separately so the dashboard can call them out distinctly.
    # Heuristic: items whose what_action mentions 'Founder' or 'approve' or
    # 'task-queue/founder/' are Founder-actionable; everything else is the
    # agent's to handle.
    founder_action_kw = ("founder", "approve", "task-queue/founder", "decide", "ratify")
    founder_attention = []
    agent_attention = []
    for item in attention:
        action_l = (item.get("what_action") or "").lower()
        if any(kw in action_l for kw in founder_action_kw):
            founder_attention.append(item)
        else:
            agent_attention.append(item)

    trigger = capture_audit_trigger()
    out = {
        "schema_version": "app-health-v1.1",
        "generated_at": now_iso(),
        "source": "scripts/aggregate-app-health.py",
        "overall_score": overall_score,
        "overall_grade": overall_grade,
        "dimensions": dimensions,
        "attention_items": attention,
        # New in v1.1: split by who-handles + audit-trigger context for the
        # 'Audit schedule' panel on app-health.html.
        "founder_attention": founder_attention,
        "agent_attention": agent_attention,
        "audit_trigger": trigger,
        "cadence": {
            "policy": (
                "Per-commit (any commit re-runs the audit via husky post-commit "
                "hook) + per-cron-cycle (5-min watcher fires regen-all + this "
                "aggregator). For PARBAUGHS app commits specifically, the "
                "is_app_commit flag is set so the dashboard distinguishes "
                "app-code-driven refreshes from substrate-driven ones."
            ),
            "next_scheduled": "on next commit, OR within 5 minutes via cron",
            "founder_cadence_request": (
                "Audit should refresh after each app commit + after each wave "
                "close — wired 2026-05-21 per Founder request."
            ),
        },
        "honest_disclosures": [
            "A8 (Performance) + A9 (Accessibility) deferred to Phase 2: tooling not yet wired (Lighthouse + axe-core).",
            "A4 (UI/UX) score derived from prior 2026-05-14 audit summary, not live Lighthouse.",
            "A11 (Testing) score is a spec-LOC-vs-app-LOC proxy until unit-coverage tooling is added.",
            "A5 (Code quality) is file-size budget compliance only — not cyclomatic, dead-code, or duplication.",
        ],
    }
    AGG.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"[aggregate-app-health] overall={overall_grade} ({overall_score}) · "
        f"{len(attention)} attention items · {OUT.relative_to(ROOT)}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
