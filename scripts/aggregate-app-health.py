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
    """Brutally honest enterprise-grade security scoring.

    Industry rubric (per OWASP ASVS + NIST CSF + vendor security postures
    of Stripe / Auth0 / etc.):
    - Zero CRITICAL is BASELINE, not bonus
    - 20 HIGH findings is a SIGNIFICANT debt, not 'acceptable'
    - Permissive `Bash(curl *)` ALLOW = unrestricted egress = unacceptable
    - Missing deny rules for sudo/ssh/chmod 777 = privilege escalation gap
    - No bundle-exposure scan run = unknown blind spot
    - No rate-limit verification on Cloud Functions = abuse-prevention gap
    - No penetration test ever run = critical gap

    AgentShield grade alone is NOT industry-grade — it scans config, not
    code logic, not auth flows, not data exfil paths. We weight it
    heavily but cap the score by what's ACTUALLY been verified.
    """
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
    medium = 0
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
            mm = re.search(r"(\d+)\s+medium", text)
            if mm:
                medium = int(mm.group(1))
        except Exception:
            pass

    # Brutally honest scoring — start at 100 and DEDUCT for every gap
    score = 100.0
    weak = []

    # AgentShield findings
    score -= crit * 15  # each CRITICAL: -15
    score -= high * 2   # each HIGH: -2 (20 HIGH = -40)
    score -= medium * 0.5

    # Hard deductions for known gaps (not just AgentShield)
    # Bundle-exposure scan: now wired via scripts/scan-bundle.js
    scan_bundle = (ROOT / "scripts" / "scan-bundle.js").exists() or (ROOT / "scripts" / "scan-bundle.py").exists()
    bundle_report = STATE / "security" / "bundle-scan-latest.json"
    if not scan_bundle:
        score -= 8
        weak.append(
            {
                "what": "No bundle-exposure scan ever run on dist/ or public/",
                "where": "scripts/ — no scan-bundle.js / no trufflehog wiring",
                "what_action": "Wire trufflehog or gitleaks to scan public/ and dist/ for embedded secrets/PII before deploy",
            }
        )
    elif bundle_report.exists():
        try:
            br = json.loads(bundle_report.read_text(encoding="utf-8"))
            if br.get("counts", {}).get("CRITICAL", 0) > 0 or br.get("counts", {}).get("HIGH", 0) > 0:
                score -= 5
                weak.append(
                    {
                        "what": f"Bundle scan reports {br['counts'].get('CRITICAL',0)} CRITICAL + {br['counts'].get('HIGH',0)} HIGH",
                        "where": ".claude/state/security/bundle-scan-latest.json",
                        "what_action": "Review bundle-scan findings; remove embedded secrets before deploy",
                    }
                )
        except Exception:
            pass

    # NO rate-limit verification on Cloud Functions
    functions_file = ROOT / "functions" / "index.js"
    has_rate_limit = False
    if functions_file.exists():
        try:
            text = functions_file.read_text(encoding="utf-8", errors="replace")
            if "rateLimit" in text or "rate-limit" in text or "tooManyRequests" in text:
                has_rate_limit = True
        except OSError:
            pass
    if not has_rate_limit:
        score -= 10
        weak.append(
            {
                "what": "No rate-limit middleware on Cloud Functions",
                "where": "functions/index.js — no rateLimit / tooManyRequests checks",
                "what_action": "Add per-IP and per-user rate-limit middleware (firebase-functions-rate-limiter or equivalent) on at least joinLeague + validateInvite + searchCourses",
            }
        )

    # NO penetration test ever conducted
    pentest_files = list(SECURITY_DIR.glob("pentest-*")) if SECURITY_DIR.exists() else []
    if not pentest_files:
        score -= 10
        weak.append(
            {
                "what": "No penetration test record on disk",
                "where": ".claude/state/security/ — no pentest-*.{md,json}",
                "what_action": "Schedule a manual pen-test (OWASP ZAP scan + manual auth-flow attack) and emit pentest-{date}.md report",
            }
        )

    # NO firestore rules coverage matrix — search task-queue/founder/ AND security/
    rules_matrix_candidates = []
    fdir = ROOT / ".claude" / "state" / "task-queue" / "founder"
    sdir = ROOT / ".claude" / "state" / "security"
    if fdir.exists():
        rules_matrix_candidates += list(fdir.glob("*firestore-rules-coverage*"))
    if sdir.exists():
        rules_matrix_candidates += list(sdir.glob("*firestore-rules-coverage*"))
    if not rules_matrix_candidates:
        score -= 7
        weak.append(
            {
                "what": "No Firestore rules coverage matrix (per collection × per operation)",
                "where": "firestore.rules + .claude/state/security/ — no coverage doc",
                "what_action": "Build a coverage matrix: every collection × every operation with the rule clause that gates it",
            }
        )

    # AgentShield findings always show as weak points
    if crit > 0:
        weak.insert(
            0,
            {
                "what": f"{crit} CRITICAL findings — MUST be remediated before any production deploy",
                "where": str(latest.relative_to(ROOT)) if latest else "—",
                "what_action": "Run `npx ecc-agentshield scan` + remediate top CRITICALs immediately",
            },
        )
    if high > 0:
        weak.append(
            {
                "what": f"{high} HIGH findings — at industry-grade this is technical debt, NOT 'acceptable'",
                "where": str(latest.relative_to(ROOT)) if latest else "—",
                "what_action": (
                    "Top 3: tighten Bash(curl *) allow rule to specific domains; "
                    "add deny rules for sudo/ssh/chmod 777; replace `>/dev/null 2>&1` "
                    "in hooks with audit log writes"
                ),
            }
        )

    score = max(30.0, min(100.0, score))
    label = (
        f"AgentShield grade {grade_letter_as}; honest score {round(score)}/100 · {crit} CRITICAL · {high} HIGH · {medium} MED"
        if grade_num is not None
        else "no scan baseline found"
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
    """Brutally honest: NO live Lighthouse → not-measured.

    The prior 2026-05-14 audit's text-summary is NOT a substitute for
    real Lighthouse measurements. High-level companies (Stripe, Linear,
    Vercel) score UI/UX via Lighthouse + WebPageTest + RUM + WCAG axe
    scans, not by counting open findings in a summary doc.
    """
    return {
        "score": None,
        "status": "not-measured",
        "label": "Lighthouse not wired — score honestly unknown (NOT 80)",
        "source": "no live measurement",
        "weak_points": [
            {
                "what": "UI/UX dimension UNMEASURED — no live Lighthouse, no WebPageTest, no RUM",
                "where": "scripts/aggregate-app-health.py · A4 function",
                "what_action": "Wire Lighthouse CLI (npm i -D @lhci/cli). Capture home/profile/feed/scorecard/round-detail/calendar at desktop + mobile viewports. Emit lighthouse-scores.json. Re-run on every commit via post-commit hook.",
            },
            {
                "what": "Prior 2026-05-14 audit had 1 CRITICAL + 3 HIGH + 4 MEDIUM findings; most reported CLOSED but no V1 re-verification",
                "where": ".claude/state/app-audit-2026-05-14/SUMMARY.md",
                "what_action": "Re-run user-journey audit at desktop + mobile viewport; V1 capture each member-facing page; update SUMMARY.md status column",
            },
        ],
    }


# ---- A5 Code quality (LOC vs AMD-027 budgets) -----------------------------


def a5_code_quality() -> dict:
    """Brutally honest: file-size + missing-tooling penalties."""
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
    core_over = sum(1 for x in over_budget if x["file"].startswith("src/core/"))
    page_over = sum(1 for x in over_budget if x["file"].startswith("src/pages/"))
    # Brutally honest: file-size is 50% of code quality; missing tools count
    score = 100.0 - (core_over * 12) - (page_over * 3)
    # NO eslint with cyclomatic-complexity rule? -10
    # NO unit test framework (covered in A11)? -5
    # NO dead-code detection (knip)? -8
    # NO duplication scan (jscpd)? -5
    pkg_json = ROOT / "package.json"
    has_eslint = False
    has_dead_code_tool = False
    has_dup_tool = False
    if pkg_json.exists():
        try:
            text = pkg_json.read_text(encoding="utf-8")
            has_eslint = "eslint" in text
            has_dead_code_tool = "knip" in text or "ts-prune" in text
            has_dup_tool = "jscpd" in text
        except OSError:
            pass
    if not has_eslint:
        score -= 10
    if not has_dead_code_tool:
        score -= 8
    if not has_dup_tool:
        score -= 5
    score = max(25.0, min(100.0, score))
    weak = [
        {
            "what": f"{x['file']} is {x['lines']} lines (budget {x['budget']})",
            "where": x["file"],
            "what_action": "Split into modules per AMD-027 budget",
        }
        for x in sorted(over_budget, key=lambda x: -x["lines"])[:3]
    ]
    if not has_eslint:
        weak.append(
            {
                "what": "No ESLint configured — no lint discipline on commit",
                "where": "package.json devDependencies",
                "what_action": "npm i -D eslint @eslint/js && add lint script + pre-commit hook to enforce",
            }
        )
    if not has_dead_code_tool:
        weak.append(
            {
                "what": "No dead-code detection (knip/ts-prune missing)",
                "where": "package.json devDependencies",
                "what_action": "npm i -D knip && add `knip` script to surface unused exports",
            }
        )
    if not has_dup_tool:
        weak.append(
            {
                "what": "No code-duplication scan (jscpd missing)",
                "where": "package.json devDependencies",
                "what_action": "npm i -D jscpd && add `jscpd src/` script",
            }
        )
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"{core_over} core + {page_over} page files over budget; missing eslint={not has_eslint}, knip={not has_dead_code_tool}, jscpd={not has_dup_tool}",
        "source": "src/core/, src/pages/, package.json",
        "weak_points": weak,
        "details": {"over_budget_count": total_violations, "files": over_budget[:10]},
    }


# ---- A6 Architecture review ------------------------------------------------


def a6_architecture() -> dict:
    """Brutally honest: aggregator-clean is necessary but not sufficient.

    Industry rubric: 'architecture' includes module boundaries, dependency
    direction (no upward imports), domain-driven layering, ADR records,
    extensibility tests. PARBAUGHS has NONE of these formally — just
    file-size compliance.
    """
    src = AGG / "architecture-review.json"
    d = load_json(src)
    findings = (d.get("findings") if d else []) or []

    # Hard deductions
    score = 100.0
    weak = []

    # Aggregator findings
    score -= len(findings) * 3
    for f in findings[:5]:
        weak.append(
            {
                "what": (f.get("note") or f.get("title") or "architecture finding")[:120],
                "where": f.get("path") or f.get("source") or "—",
                "what_action": f.get("action") or "Review + refactor",
            }
        )

    # NO ADR (Architectural Decision Record) directory
    adr_dir = ROOT / "docs" / "adr"
    if not adr_dir.exists():
        score -= 8
        weak.append(
            {
                "what": "No ADR (Architectural Decision Record) directory — architecture choices undocumented",
                "where": "docs/adr/ (missing)",
                "what_action": "Create docs/adr/ + author 5-10 ADRs for key choices (vanilla JS over framework, Firebase backend, Capacitor mobile wrapper, per-page bundle, etc.)",
            }
        )

    # functions/index.js holds 8 functions in 860 lines — monolithic
    fn_file = ROOT / "functions" / "index.js"
    if fn_file.exists():
        try:
            fn_lines = sum(1 for _ in fn_file.open(encoding="utf-8", errors="replace"))
            if fn_lines > 500:
                score -= 8
                weak.append(
                    {
                        "what": f"functions/index.js is {fn_lines} lines holding 8 Cloud Functions monolithically",
                        "where": "functions/index.js",
                        "what_action": "Split into functions/auth.js + functions/notifications.js + functions/league.js + functions/courses.js. Or move to firebase-functions-multi-file structure.",
                    }
                )
        except OSError:
            pass

    # No formal module-boundary lint (e.g., eslint-plugin-boundaries)
    pkg = ROOT / "package.json"
    has_boundaries = False
    if pkg.exists():
        try:
            text = pkg.read_text(encoding="utf-8")
            has_boundaries = "eslint-plugin-boundaries" in text or "depcheck" in text
        except OSError:
            pass
    if not has_boundaries:
        score -= 6
        weak.append(
            {
                "what": "No module-boundary enforcement (no eslint-plugin-boundaries / depcheck)",
                "where": "package.json — devDependencies missing",
                "what_action": "Add eslint-plugin-boundaries; declare src/pages → src/core direction; fail commit on upward imports",
            }
        )

    # router.js at 97% of AMD-027 budget — pre-emptive deduction
    router_file = ROOT / "src" / "core" / "router.js"
    if router_file.exists():
        try:
            router_lines = sum(1 for _ in router_file.open(encoding="utf-8", errors="replace"))
            if router_lines > 2700:
                score -= 5
                weak.append(
                    {
                        "what": f"src/core/router.js at {router_lines} / 3000 lines (97%+ of AMD-027 budget) — next non-trivial feature will overflow",
                        "where": "src/core/router.js",
                        "what_action": "Pre-emptively extract: share-card builder (lines 1109-1190) → src/core/share-card.js; flow-rail logic → src/core/flow-rail.js",
                    }
                )
        except OSError:
            pass

    score = max(35.0, min(100.0, score))
    return {
        "score": round(score),
        "status": status_color(score),
        "label": (d.get("summary") if d else None) or f"{len(findings)} aggregator findings + {len(weak)} structural gaps",
        "source": ".claude/state/aggregates/architecture-review.json + src/ walk",
        "weak_points": weak[:5],
    }


# ---- A7 Data integrity -----------------------------------------------------


def a7_data_integrity() -> dict:
    """Brutally honest: 'files exist' is the floor, not the ceiling.

    Industry-grade data integrity:
    - Per-collection × per-operation rules coverage matrix
    - Schema validation on Cloud Function writes (zod/joi)
    - Migration scripts with up/down + dry-run + audit log
    - Backup + restore verified
    - No anonymous reads on PII collections
    """
    rules_path = ROOT / "firestore.rules"
    indexes_path = ROOT / "firestore.indexes.json"
    rules_lines = 0
    if rules_path.exists():
        rules_lines = sum(1 for _ in rules_path.open(encoding="utf-8", errors="replace"))
    indexes_count = 0
    if indexes_path.exists():
        try:
            idx = json.loads(indexes_path.read_text(encoding="utf-8"))
            indexes_count = len(idx.get("indexes") or [])
        except Exception:
            pass

    score = 100.0
    weak = []
    if not rules_path.exists():
        score -= 30
        weak.append(
            {
                "what": "firestore.rules missing — no auth enforcement",
                "where": "repo root",
                "what_action": "Restore firestore.rules",
            }
        )
    if not indexes_path.exists():
        score -= 20

    # Per-collection coverage matrix (the big one). Check docs/ + state/security/.
    coverage_doc_paths = [
        ROOT / "docs" / "firestore-rules-coverage-matrix.md",
        ROOT / ".claude" / "state" / "security" / "firestore-rules-coverage-matrix.md",
    ]
    coverage_doc = next((p for p in coverage_doc_paths if p.exists()), None)
    if not coverage_doc:
        score -= 15
        weak.append(
            {
                "what": "No Firestore rules coverage matrix — can't verify every collection × operation is gated",
                "where": "docs/firestore-rules-coverage-matrix.md (missing)",
                "what_action": "Build matrix: list every collection × {create, read, update, delete} × {member, commissioner, founder, anonymous}. Fill in rule clause that allows/denies each cell.",
            }
        )

    # Schema validation library on Cloud Function writes
    fn_file = ROOT / "functions" / "index.js"
    has_schema_validation = False
    if fn_file.exists():
        try:
            text = fn_file.read_text(encoding="utf-8", errors="replace")
            has_schema_validation = any(lib in text for lib in ("zod", "joi", "ajv", "yup"))
        except OSError:
            pass
    if not has_schema_validation:
        score -= 12
        weak.append(
            {
                "what": "No schema validation on Cloud Function writes",
                "where": "functions/index.js — no zod/joi/ajv/yup",
                "what_action": "npm i zod (in functions/). Wrap every Cloud Function payload in zod.parse() before writing to Firestore.",
            }
        )

    # Migration script discipline
    migration_dir = ROOT / "scripts" / "migrations"
    if not migration_dir.exists() or not list(migration_dir.glob("*")):
        score -= 8
        weak.append(
            {
                "what": "No migration scripts directory — schema changes have no audit trail",
                "where": "scripts/migrations/ (missing)",
                "what_action": "Create scripts/migrations/. Author up/down pair for every schema change with --dry-run flag + log to .claude/state/migrations-applied/.",
            }
        )

    # Backup + restore evidence
    backup_evidence = (
        list((ROOT / ".claude" / "state").glob("backup-*"))
        + list((ROOT / "backups").glob("*") if (ROOT / "backups").exists() else [])
    )
    if not backup_evidence:
        score -= 8
        weak.append(
            {
                "what": "No backup/restore evidence — recovery not verified",
                "where": ".claude/state/backup-*/ (none)",
                "what_action": "Schedule weekly Firestore export to GCS bucket + quarterly verified restore drill. Document in backups/last-restore.md.",
            }
        )

    score = max(35.0, min(100.0, score))
    label = f"{rules_lines} lines rules · {indexes_count} indexes; missing coverage matrix={coverage_doc is None}, schema validation={not has_schema_validation}"
    return {
        "score": round(score),
        "status": status_color(score),
        "label": label,
        "source": "firestore.rules + firestore.indexes.json + docs/ + functions/index.js + scripts/migrations/",
        "weak_points": weak[:5],
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
    """Brutally honest: CSS rules grep is not mobile testing.

    Industry-grade mobile-first:
    - Playwright mobile-viewport specs (iPhone 14 + Android Pixel 7)
    - Lighthouse mobile audit (separate from desktop)
    - Real device testing via BrowserStack / Sauce Labs
    - Capacitor wrapper integration test
    - PWA manifest + service worker validated
    """
    css_files = (
        list((ROOT / "src" / "styles").glob("*.css"))
        if (ROOT / "src" / "styles").exists()
        else []
    )
    touch_target_hits = 0
    for f in css_files:
        try:
            text = f.read_text(encoding="utf-8", errors="replace")
            touch_target_hits += len(re.findall(r"min-height:\s*44\w*", text))
        except OSError:
            continue

    # Brutal: CSS rule presence is necessary but FAR from sufficient
    score = 100.0
    weak = []

    if touch_target_hits == 0:
        score -= 25
        weak.append(
            {
                "what": "No 44pt-touch-target CSS rules found — mobile tap targets unsafe",
                "where": "src/styles/*.css",
                "what_action": "Add `min-height: 44pt` to every interactive element (buttons, links, form fields)",
            }
        )

    # Mobile-viewport e2e specs?
    e2e_dir = ROOT / "tests" / "e2e" / "flows"
    has_mobile_spec = False
    if e2e_dir.exists():
        for f in e2e_dir.glob("*.spec.js"):
            try:
                text = f.read_text(encoding="utf-8", errors="replace")
                if "iPhone" in text or "375" in text or "390" in text or "Pixel" in text:
                    has_mobile_spec = True
                    break
            except OSError:
                continue
    if not has_mobile_spec:
        score -= 20
        weak.append(
            {
                "what": "No mobile-viewport Playwright specs (iPhone/Pixel)",
                "where": "tests/e2e/flows/ — no specs configured for mobile viewport",
                "what_action": "Add `projects: [{ name: 'iphone-14', use: devices['iPhone 14'] }, { name: 'pixel-7', use: devices['Pixel 7'] }]` to playwright.config.ts. Run 5 critical-path tests on each.",
            }
        )

    # Lighthouse mobile config?
    lhci_config = ROOT / "lighthouserc.js"
    has_lhci = lhci_config.exists() or (ROOT / ".lighthouserc.json").exists()
    if not has_lhci:
        score -= 12
        weak.append(
            {
                "what": "No Lighthouse mobile config — mobile perf score unmeasured",
                "where": "lighthouserc.js / .lighthouserc.json (missing)",
                "what_action": "Add @lhci/cli; configure mobile preset + 6 page URLs; run in CI",
            }
        )

    # PWA manifest?
    manifest_path = ROOT / "public" / "manifest.json"
    if not manifest_path.exists():
        score -= 8
        weak.append(
            {
                "what": "No PWA manifest — install-to-home-screen broken on mobile",
                "where": "public/manifest.json (missing)",
                "what_action": "Author manifest.json with icons (192/512), theme-color, display=standalone, start_url",
            }
        )

    # Capacitor integration test?
    capacitor_config = ROOT / "capacitor.config.json"
    has_capacitor_test = False
    if capacitor_config.exists():
        # Check if there's any integration test
        cap_test_dir = ROOT / "tests" / "capacitor"
        has_capacitor_test = cap_test_dir.exists()
    if capacitor_config.exists() and not has_capacitor_test:
        score -= 10
        weak.append(
            {
                "what": "Capacitor wrapper present but no integration test — iOS/Android bundle untested",
                "where": "capacitor.config.json + tests/ (no capacitor/)",
                "what_action": "Author tests/capacitor/smoke.spec.js — verifies bundle builds + key surfaces render in Capacitor webview",
            }
        )

    score = max(25.0, min(100.0, score))
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"{touch_target_hits} touch-target rules · mobile-spec={has_mobile_spec} · lhci={has_lhci} · manifest={manifest_path.exists()}",
        "source": "src/styles/, tests/e2e/, public/manifest.json",
        "weak_points": weak[:5],
    }


# ---- A11 Testing coverage --------------------------------------------------


def a11_testing() -> dict:
    """Brutally honest: 6 specs + 54 failures + no unit framework = D.

    Industry-grade testing:
    - Unit tests with 80%+ line coverage on src/core/ business logic
    - Integration tests against emulator with FRESH FIXTURES
    - E2E tests covering critical paths at multiple viewports
    - Visual regression tests (Playwright + comparison)
    - Smoke MUST pass before any commit
    """
    spec_dir = ROOT / "tests" / "e2e" / "flows"
    pkg = ROOT / "package.json"

    score = 100.0
    weak = []

    if not spec_dir.exists():
        score = 15.0
        weak.append(
            {
                "what": "tests/e2e/flows/ missing — no e2e suite at all",
                "where": "tests/e2e/flows/",
                "what_action": "Bootstrap Playwright + create 5 critical-path specs",
            }
        )
        return {
            "score": round(score),
            "status": status_color(score),
            "label": "no e2e suite",
            "source": "tests/e2e/flows/",
            "weak_points": weak,
        }

    specs = list(spec_dir.glob("*.spec.js"))
    total_lines = 0
    for s in specs:
        try:
            total_lines += sum(1 for _ in s.open(encoding="utf-8", errors="replace"))
        except OSError:
            continue

    # Unit tests (tests/unit/*.test.js) — fast, focused, industry-grade signal.
    unit_dir = ROOT / "tests" / "unit"
    unit_specs = list(unit_dir.glob("**/*.test.js")) if unit_dir.exists() else []
    unit_lines = 0
    for u in unit_specs:
        try:
            unit_lines += sum(1 for _ in u.open(encoding="utf-8", errors="replace"))
        except OSError:
            continue

    # Heuristic baseline. E2E lines + unit lines both count toward coverage signal.
    app_loc = 32000
    coverage_ratio = (total_lines + unit_lines * 2) / app_loc if app_loc > 0 else 0  # unit tests double-weighted
    score = min(80.0, max(20.0, coverage_ratio * 4000))

    # Unit test presence bonus (industry-grade requires unit tests, not just e2e)
    if unit_specs:
        score += min(20, len(unit_specs) * 4)  # +4 per unit spec, capped at +20

    # Smoke failure penalty (we know there are 54 failures from Goal 1 D5)
    # If we have evidence of recent smoke failures, deduct heavily.
    smoke_log = ROOT / ".claude" / "state" / "audit-2026-05-19" / "smoke-test.txt"
    if smoke_log.exists():
        try:
            text = smoke_log.read_text(encoding="utf-8", errors="replace")
            fail_m = re.search(r"(\d+)\s+failed", text)
            if fail_m:
                fail_count = int(fail_m.group(1))
                if fail_count > 0:
                    # Heavy penalty: each failure -1 capped at -40
                    deduct = min(40, fail_count)
                    score -= deduct
                    weak.append(
                        {
                            "what": f"{fail_count} smoke failures (FirebaseError: auth/network-request-failed) — every test is FAILING",
                            "where": "tests/e2e/flows/01-all-users-baseline.spec.js + 06-notifications-*.spec.js",
                            "what_action": "Diagnose emulator-Auth port wiring: (1) `firebase init emulators` and confirm auth port; (2) ensure tests/e2e/_fixtures/ calls connectAuthEmulator(); (3) verify Node 22 vs 24 mismatch warning resolved",
                        }
                    )
        except OSError:
            pass

    # No unit framework
    has_unit = False
    if pkg.exists():
        try:
            text = pkg.read_text(encoding="utf-8")
            has_unit = any(t in text for t in ("vitest", "jest", "mocha", "ava"))
        except OSError:
            pass
    if not has_unit:
        score -= 15
        weak.append(
            {
                "what": "No unit test framework wired — src/core/ logic only tested via slow e2e",
                "where": "package.json devDependencies",
                "what_action": "npm i -D vitest. Start with handicap.js + parcoins.js + sync.js (pure functions, fast wins). Target 80%+ coverage on src/core/.",
            }
        )

    # No coverage tool
    has_coverage = False
    if pkg.exists():
        try:
            text = pkg.read_text(encoding="utf-8")
            has_coverage = "c8" in text or "nyc" in text or "@vitest/coverage" in text
        except OSError:
            pass
    if not has_coverage:
        score -= 8
        weak.append(
            {
                "what": "No coverage reporter — true coverage % unknown",
                "where": "package.json devDependencies",
                "what_action": "npm i -D @vitest/coverage-v8. Add `npm test -- --coverage` to CI. Fail commit on <70%.",
            }
        )

    # No visual regression
    visual_regression_dir = ROOT / "tests" / "visual"
    if not visual_regression_dir.exists():
        score -= 6
        weak.append(
            {
                "what": "No visual regression suite",
                "where": "tests/visual/ (missing)",
                "what_action": "Add Playwright screenshot+compare for 6 key pages. Fail on >2% pixel diff.",
            }
        )

    score = max(15.0, min(100.0, score))
    label = f"{len(specs)} specs · {total_lines} LOC · unit-test={has_unit} · coverage-tool={has_coverage}"
    return {
        "score": round(score),
        "status": status_color(score),
        "label": label,
        "source": "tests/e2e/flows/, package.json, smoke-test.txt",
        "weak_points": weak[:5],
    }


# ---- A12 Operational health -----------------------------------------------


def a12_operational() -> dict:
    """Brutally honest: GREEN now ≠ enterprise-grade operational maturity.

    Industry-grade operational health:
    - Uptime SLA defined + monitored
    - Error tracking (Sentry / Datadog APM) wired
    - Alerting routes (PagerDuty / Opsgenie) configured
    - Incident response playbook
    - Postmortem culture (last 5 incidents documented)
    - Deploy automation with rollback verified
    """
    pipeline = load_json(AGG / "approvals-pipeline.json")
    watcher = load_json(STATE / "heartbeats" / "watcher-last-run.json")
    status = (pipeline.get("status") or "").lower()
    summary = pipeline.get("summary") or ""

    score = 100.0
    weak = []

    # Pipeline status
    if status == "green":
        pass
    elif status == "yellow":
        score -= 15
    elif status == "red":
        score -= 30

    # Count recent skip-dirty in watcher history (operational reliability signal)
    skip_count = 0
    if SECURITY_DIR.parent.exists():
        logs_dir = ROOT / "scripts" / "cron" / "logs"
        if logs_dir.exists():
            recent = sorted(logs_dir.glob("*-downloads-watcher.log"), reverse=True)[:10]
            for f in recent:
                try:
                    text = f.read_text(encoding="utf-8", errors="replace")
                    if "SKIP working tree dirty" in text or "SKIP working tree still dirty" in text:
                        skip_count += 1
                except OSError:
                    continue
    if skip_count >= 3:
        score -= 10
        weak.append(
            {
                "what": f"{skip_count} of last 10 cron watcher runs hit skip-dirty",
                "where": "scripts/cron/logs/*-downloads-watcher.log",
                "what_action": "Check that .husky/post-commit doesn't dirty the tree mid-run; verify routinePatterns allowlist covers all auto-generated outputs",
            }
        )

    # No error tracking (Sentry/Datadog)
    pkg = ROOT / "package.json"
    has_error_tracking = False
    if pkg.exists():
        try:
            text = pkg.read_text(encoding="utf-8")
            has_error_tracking = any(t in text for t in ("sentry", "@sentry", "datadog", "rollbar"))
        except OSError:
            pass
    if not has_error_tracking:
        score -= 15
        weak.append(
            {
                "what": "No error-tracking service wired (Sentry/Datadog/Rollbar) — production exceptions invisible",
                "where": "package.json — no @sentry/*",
                "what_action": "npm i @sentry/browser @sentry/node. Init in src/core/firebase.js (browser) + functions/index.js (node). Free tier covers PARBAUGHS scale.",
            }
        )

    # No incident-response doc
    incident_doc = ROOT / "docs" / "incident-response.md"
    if not incident_doc.exists():
        score -= 8
        weak.append(
            {
                "what": "No incident response playbook",
                "where": "docs/incident-response.md (missing)",
                "what_action": "Author docs/incident-response.md: who-pages-who, severity ladder (SEV-1/2/3), comms templates, postmortem template",
            }
        )

    # No alerting wiring
    alerting_doc = (ROOT / "docs" / "alerting.md").exists() or (
        ROOT / ".claude" / "state" / "alerting-config.json"
    ).exists()
    if not alerting_doc:
        score -= 8
        weak.append(
            {
                "what": "No alerting configuration — Founder won't know about prod issues",
                "where": "docs/alerting.md OR .claude/state/alerting-config.json (missing)",
                "what_action": "Configure Firebase Crashlytics alerts to Founder email/SMS. Add Cloud Function 5xx rate alert. Document in docs/alerting.md.",
            }
        )

    # No deploy automation with rollback
    deploy_script = ROOT / "scripts" / "deploy.sh"
    if not deploy_script.exists() and not (ROOT / ".github" / "workflows" / "deploy.yml").exists():
        score -= 7
        weak.append(
            {
                "what": "No deploy automation — manual firebase deploy invites mistakes",
                "where": "scripts/deploy.sh + .github/workflows/deploy.yml (missing)",
                "what_action": "Add scripts/deploy.sh with --dry-run, version stamp, rollback-pointer write. Future: GitHub Action with environment gates.",
            }
        )

    score = max(30.0, min(100.0, score))
    return {
        "score": round(score),
        "status": status_color(score),
        "label": f"pipeline={status} · {skip_count} recent skip-dirty · error-tracking={has_error_tracking} · incident-doc={incident_doc.exists()}",
        "source": ".claude/state/aggregates/approvals-pipeline.json + scripts/cron/logs/ + package.json + docs/",
        "weak_points": weak[:5],
        "details": {
            "watcher_last_status": watcher.get("status"),
            "watcher_exit_reason": watcher.get("exit_reason") or "",
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
