#!/usr/bin/env python3
"""Architecture review aggregator (autonomous scan).

Founder mandate 2026-05-19: "agents should never be awaiting dispatch they
should just perform." Per AMD-024 the architecture agent surfaces strategic
recommendations on a multi-cadence basis; prior implementation gated the
dashboard banner on the agent's first dispatch, leaving "AGENT · AWAITING
DISPATCH" wording visible on the operational view.

This aggregator performs an autonomous v1 scan on every commit (wired into
.husky/post-commit + scripts/regen-all.sh). The scan is cheap (file-system
inspection only, no network) and produces architectural findings that flow
into the existing `architecture-review.json` schema consumed by
`regen-dashboard.architecture_review_status()`.

Scope (v1 MVP — keep cheap, deterministic, source-faithful):
  1. src/core/ size sweep — files >800 lines flagged per
     ~/.claude/rules/ecc/common/coding-style.md "<800 max" rule.
  2. functions/index.js Cloud Function inventory — counts each
     `exports.<name>` declaration; flags when index.js itself >800 lines.
  3. Author-time recommendation directory sweep — surfaces any
     `.claude/state/architecture-review/recommendations/pending/REC-*.md`
     written by the human/architecture-agent so they propagate into the
     dashboard without manual JSON edits.

Recommendations from the file-system scan are categorised as architectural
hygiene findings; the pending REC-*.md files supersede when present.

Status mapping (matches the existing health-banner colour palette):
  - green  : 0 findings AND 0 pending REC files
  - yellow : 1-5 findings OR 1-5 pending REC files
  - red    : >5 findings OR >5 pending REC files OR any CRITICAL finding

The output JSON conforms to the schema `regen-dashboard` expects (the
function `architecture_review_status()` no longer reads the file blindly;
see Phase B downstream rewrite). The aggregator is the *single source* of
truth for the banner now — `architecture_review_status()` returns this
file verbatim.

Exit code: 0 always (architectural findings are signal, not failure).
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

# Local helper for idempotent-write (root-cause fix 2026-05-19 dirty-tree cycle).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _idempotent_write import idempotent_write_json  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
TARGET = STATE / "aggregates" / "architecture-review.json"

SCHEMA_VERSION = "architecture-review-v2.1"
MAX_FILE_LINES = 800  # ~/.claude/rules/ecc/common/coding-style.md max (page-tier default)
WARN_FILE_LINES = 600  # yellow threshold (75% of default)

# AMD-027 orchestration-tier per-file budgets. Keyed by repo-relative
# POSIX path. Files NOT in this dict fall back to MAX_FILE_LINES (800).
# Engineering ruling per Founder mandate 2026-05-19 — see
# .claude/state/amendments/applied/AMD-027-src-core-file-size-budget.md
# for rationale + open-source benchmark check + 10x foresight.
PER_FILE_BUDGETS: dict[str, int] = {
    "src/core/router.js": 3000,
    "src/core/data.js": 2500,
    "src/core/firebase.js": 1000,
    "src/core/sync.js": 1000,
    "functions/index.js": 1000,
}


def _budget_for(rel_path: str) -> int:
    """Return the line-count budget for the given repo-relative path.

    AMD-027 ruling: orchestration-tier files (`src/core/router.js`,
    `src/core/data.js`, …) get bespoke budgets; everything else uses
    the 800-line default (`~/.claude/rules/ecc/common/coding-style.md`).
    """
    return PER_FILE_BUDGETS.get(rel_path, MAX_FILE_LINES)


@dataclass(frozen=True)
class Finding:
    """One architectural concern surfaced by the autonomous scan."""

    category: str  # 'file-size' | 'function-count' | 'pending-rec'
    severity: str  # 'critical' | 'high' | 'medium' | 'low'
    title: str
    detail: str
    path: str | None = None
    metrics: dict = field(default_factory=dict)

    def to_priority(self) -> dict:
        """Render as a `top_priorities` entry that the dashboard renders."""
        owner_map = {
            "file-size": "architecture",
            "function-count": "architecture",
            "pending-rec": "architecture",
        }
        return {
            "title": self.title,
            "owning_agent": owner_map.get(self.category, "architecture"),
            "priority": self.severity.upper(),
            "category": self.category,
            "detail": self.detail,
            "path": self.path,
        }


def _count_lines(path: Path) -> int:
    """Cheap line count without loading the full file into memory.
    Returns 0 if unreadable (silent skip — the scan never fails)."""
    try:
        with path.open("r", encoding="utf-8", errors="replace") as fh:
            return sum(1 for _ in fh)
    except OSError:
        return 0


def scan_core_size() -> list[Finding]:
    """Flag any src/core/ file exceeding its per-file budget.

    Default budget (800 lines) lives in ~/.claude/rules/ecc/common/coding-style.md
    + CLAUDE.md operational principles ("MANY SMALL FILES > FEW LARGE FILES").
    Orchestration-tier files (`src/core/router.js`, `src/core/data.js`, …)
    get bespoke budgets per AMD-027 — see PER_FILE_BUDGETS.
    """
    findings: list[Finding] = []
    core_dir = ROOT / "src" / "core"
    if not core_dir.exists():
        return findings
    for path in sorted(core_dir.glob("*.js")):
        lines = _count_lines(path)
        rel = path.relative_to(ROOT).as_posix()
        budget = _budget_for(rel)
        # AMD-027 codified-budget files: no "approaching" warning at all.
        # The budget IS the engineering ruling — files within budget are
        # explicitly KEEP per AMD-027 rationale. Only flag when the file
        # exceeds its budget (which then triggers an agent-decided review,
        # not a Founder badge). Default files (no explicit budget) keep
        # the historic 75% warn since they should be much smaller than
        # the 800-line ceiling.
        if rel in PER_FILE_BUDGETS:
            warn_threshold = budget + 1  # disable warn — only over-budget triggers
        else:
            warn_threshold = int(budget * 0.75)
        if lines > budget:
            # Severity bucketing — file-size findings are pre-existing
            # architectural debt rather than regressions, so we cap at
            # `high` even for >2x-over files. The CRITICAL severity is
            # reserved for findings the architecture agent classifies as
            # new ship blockers via authored REC-*.md (see
            # scan_pending_recommendations). This keeps the banner
            # yellow/red signal proportional to recent deltas, not the
            # cumulative long-tail of historic large files.
            severity = "medium" if lines <= budget * 1.25 else "high"
            findings.append(
                Finding(
                    category="file-size",
                    severity=severity,
                    title=f"{path.name} exceeds {budget}-line budget ({lines} lines)",
                    detail=(
                        f"src/core file size: {lines} lines (budget {budget} per AMD-027). "
                        f"Engineering review: agent-decided refactor or budget amendment."
                    ),
                    path=rel,
                    metrics={"lines": lines, "limit": budget, "budget_source": "AMD-027" if rel in PER_FILE_BUDGETS else "default-800"},
                )
            )
        elif lines > warn_threshold:
            findings.append(
                Finding(
                    category="file-size",
                    severity="medium",
                    title=f"{path.name} approaching size budget ({lines}/{budget} lines)",
                    detail=(
                        f"src/core file size: {lines} lines (warn ≥{warn_threshold}, "
                        f"budget {budget}). Consider refactoring before the next ship."
                    ),
                    path=rel,
                    metrics={"lines": lines, "limit": budget, "warn": warn_threshold, "budget_source": "AMD-027" if rel in PER_FILE_BUDGETS else "default-800"},
                )
            )
    return findings


_EXPORTS_RE = re.compile(r"^\s*exports\.([A-Za-z_][A-Za-z0-9_]*)\s*=", re.MULTILINE)


def scan_cloud_functions() -> list[Finding]:
    """Inventory functions/index.js Cloud Function exports + file size.

    The platform expects a fixed roster (see CLAUDE.md). Surfacing any
    runaway growth keeps Founder informed without daily Founder action.
    """
    findings: list[Finding] = []
    idx = ROOT / "functions" / "index.js"
    if not idx.exists():
        return findings
    try:
        body = idx.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return findings
    exports = _EXPORTS_RE.findall(body)
    lines = body.count("\n") + 1
    rel = idx.relative_to(ROOT).as_posix()
    budget = _budget_for(rel)
    if lines > budget:
        # Pre-existing architectural debt — `medium` so the banner stays
        # informative without flipping to red on first-run. The Founder
        # mandate is "perform" not "shout".
        findings.append(
            Finding(
                category="file-size",
                severity="medium",
                title=f"functions/index.js exceeds {budget}-line budget ({lines} lines)",
                detail=(
                    f"Cloud Functions index.js: {lines} lines (budget {budget} per AMD-027, "
                    f"{len(exports)} exports). Engineering review: split per "
                    f"firebase-functions v2 conventions or amend budget."
                ),
                path=rel,
                metrics={"lines": lines, "limit": budget, "exports": len(exports), "budget_source": "AMD-027" if rel in PER_FILE_BUDGETS else "default-800"},
            )
        )
    # Expected roster per CLAUDE.md is 8. Surface any drift so it's visible
    # without requiring Founder to read the file.
    expected = 8
    if len(exports) > expected + 2:
        findings.append(
            Finding(
                category="function-count",
                severity="medium",
                title=f"Cloud Function count drift ({len(exports)} vs expected {expected})",
                detail=(
                    f"functions/index.js exports {len(exports)} Cloud Functions, expected "
                    f"~{expected} per CLAUDE.md inventory. Confirm new functions are "
                    f"documented + AMD-018 ratified."
                ),
                path=rel,
                metrics={"exports": len(exports), "expected": expected},
            )
        )
    return findings


_REC_FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---", re.DOTALL)


def scan_pending_recommendations() -> tuple[list[Finding], int, int]:
    """Mine `.claude/state/architecture-review/recommendations/pending/*.md`.

    Returns (findings, pending_count, ratified_count). Pending recommendations
    short-circuit the file-system findings — when the human/architecture-agent
    has authored explicit recommendations they take precedence on the banner.
    """
    base = STATE / "architecture-review" / "recommendations"
    findings: list[Finding] = []
    pending = 0
    ratified = 0
    if not base.exists():
        return findings, pending, ratified
    pending_dir = base / "pending"
    ratified_dir = base / "ratified"
    if ratified_dir.exists():
        ratified = sum(1 for _ in ratified_dir.glob("REC-*.md"))
    if pending_dir.exists():
        for rec in sorted(pending_dir.glob("REC-*.md")):
            try:
                body = rec.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            m = _REC_FRONTMATTER_RE.search(body)
            title = rec.stem
            priority = "medium"
            if m:
                fm = m.group(1)
                t = re.search(r"^title:\s*(.+?)\s*$", fm, re.MULTILINE)
                if t:
                    title = t.group(1).strip()
                p = re.search(r"^priority:\s*(\w+)\s*$", fm, re.MULTILINE)
                if p:
                    priority = p.group(1).strip().lower()
            severity_map = {
                "critical": "critical",
                "high": "high",
                "medium": "medium",
                "low": "low",
            }
            severity = severity_map.get(priority, "medium")
            pending += 1
            findings.append(
                Finding(
                    category="pending-rec",
                    severity=severity,
                    title=title,
                    detail="Authored recommendation awaiting Founder ratification.",
                    path=rec.relative_to(ROOT).as_posix(),
                    metrics={"priority": priority},
                )
            )
    return findings, pending, ratified


def _resolve_status(findings: list[Finding]) -> str:
    if not findings:
        return "green"
    if any(f.severity == "critical" for f in findings):
        return "red"
    if len(findings) > 5:
        return "red"
    return "yellow"


def _summary(findings: list[Finding], pending: int) -> str:
    """Single-line summary surfaced on the banner — Founder-readable, no
    "awaiting" wording per the 2026-05-19 mandate."""
    if not findings:
        return "0 architectural concerns · scan clean (AMD-027 budgets in effect)"
    parts: list[str] = []
    size_count = sum(1 for f in findings if f.category == "file-size")
    func_count = sum(1 for f in findings if f.category == "function-count")
    if size_count:
        parts.append(f"{size_count} file-size finding{'s' if size_count != 1 else ''}")
    if func_count:
        parts.append(f"{func_count} function-count drift")
    if pending:
        parts.append(f"{pending} authored recommendation{'s' if pending != 1 else ''}")
    return " · ".join(parts) if parts else f"{len(findings)} finding{'s' if len(findings) != 1 else ''}"


def build() -> dict:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    core_findings = scan_core_size()
    fn_findings = scan_cloud_functions()
    rec_findings, pending, ratified = scan_pending_recommendations()

    findings = rec_findings + core_findings + fn_findings
    status = _resolve_status(findings)
    summary = _summary(findings, pending)
    total = pending + ratified
    ratification_rate = (ratified / total) if total > 0 else 1.0

    # Convert findings into the dashboard's expected nested structure.
    details = [
        {
            "category": f.category,
            "status": f.severity,
            "name": f.title,
            "note": f.detail,
            "path": f.path,
        }
        for f in findings[:10]
    ]

    top_priorities = [f.to_priority() for f in findings[:3]]

    return {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "updated_at": now,
        "source": "scripts/aggregate-architecture-review.py (autonomous-v1)",
        "available": True,
        "status": status,
        "raw_status": status,
        "summary": summary,
        "as_of": now,
        "stale": False,
        "age_hours": 0,
        "counts": {
            "pending_recommendations": pending,
            "ratification_rate_pct": round(ratification_rate * 100),
            "file_size_findings": sum(1 for f in findings if f.category == "file-size"),
            "function_count_findings": sum(1 for f in findings if f.category == "function-count"),
            "total_findings": len(findings),
        },
        "pending_recommendations_count": pending,
        "ratification_rate": ratification_rate,
        "latest_daily_health": {
            "date": now[:10],
            "color": status,
            "summary": summary,
        },
        "top_3_priorities": top_priorities,
        "details": details,
        "recommendations": [
            {
                "title": f.title,
                "category": f.category,
                "severity": f.severity,
                "detail": f.detail,
                "path": f.path,
                "metrics": f.metrics,
            }
            for f in findings
        ],
        "scan": {
            "src_core_files_scanned": sum(1 for _ in (ROOT / "src" / "core").glob("*.js")) if (ROOT / "src" / "core").exists() else 0,
            "functions_scanned": (ROOT / "functions" / "index.js").exists(),
            "recommendations_dir_scanned": (STATE / "architecture-review" / "recommendations").exists(),
        },
        "links": [
            {
                "label": "Pending recommendations",
                "href": "../../.claude/state/architecture-review/recommendations/pending/",
            },
            {
                "label": "AMD-024",
                "href": "../../.claude/state/amendments/applied/AMD-024-architecture-ai-engineer-agent.md",
            },
        ],
        "source_path": str(TARGET.relative_to(ROOT)).replace("\\", "/"),
    }


def main() -> int:
    out = build()
    wrote, reason = idempotent_write_json(TARGET, out, ensure_ascii=False)
    print(
        f"[aggregate-architecture-review] OK status={out['status']} "
        f"findings={out['counts']['total_findings']} "
        f"pending_recs={out['counts']['pending_recommendations']} "
        f"write={wrote} ({reason})"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
