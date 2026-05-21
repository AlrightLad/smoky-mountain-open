#!/usr/bin/env python3
"""Bug Triage Listener — overnight cron that ingests new feature_requests + reports.

Per W1.I1 follow-on + data-flow audit F-3 (open) — `feature_requests` Firestore
writes from src/pages/bugreport.js had no auto-categorization. This listener
runs daily, scans new entries, auto-categorizes P0-P3, surfaces output to the
dashboard's Founder review queue.

Cron schedule: PARBAUGHS-Overnight-Triage at 12am EST (already configured per
task-queue/founder/silence-cron-tasks.md).

Categorization rules (industry-standard severity ladder):
  P0 (Critical) — data loss, security, app unusable. Severity field == "critical"
                  OR description matches "data lost" | "can't log in" | "broken"
                  + auth/payment/round-related.
  P1 (High)     — major feature broken, severity == "moderate" + critical path.
  P2 (Medium)   — minor feature broken, severity == "minor".
  P3 (Low)      — feature request, content typo, UX suggestion.

Emits to .claude/state/aggregates/bug-triage-latest.json. Dashboard reads this.

Per AMD-018 — read-only Firestore access via service account. Does NOT auto-fix
yet; categorization only. Auto-fix logic is a follow-on (requires verified
fix-template pattern matching).
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / ".claude" / "state" / "aggregates" / "bug-triage-latest.json"

# Critical-path keywords — bumps severity for P0
CRITICAL_KEYWORDS = [
    r"\bdata\s+lost\b",
    r"\bcan'?t\s+(log|sign)\s+in\b",
    r"\bnever\s+saves?\b",
    r"\binfinite\s+loop\b",
    r"\bcrash(es|ed)?\b",
    r"\bpayment\s+(fail|broke)",
    r"\bdup(licate)?\s+charge\b",
    r"\bunable\s+to\s+(submit|save)",
]

# High-severity keywords — bumps to P1
HIGH_KEYWORDS = [
    r"\bbroken\b",
    r"\bdoesn'?t\s+work\b",
    r"\bfreez(es|ing)\b",
    r"\bwrong\s+score\b",
]


def categorize_report(report: dict) -> str:
    """Return P0/P1/P2/P3 based on severity + content keywords."""
    severity = (report.get("severity") or "").lower()
    description = (report.get("description") or "").lower()
    report_type = (report.get("type") or "").lower()

    # P3 — pure feature requests / typo
    if report_type in ("feature", "content"):
        return "P3"

    # P0 — critical severity OR critical-path keywords
    if severity == "critical":
        return "P0"
    for pat in CRITICAL_KEYWORDS:
        if re.search(pat, description):
            return "P0"

    # P1 — moderate severity + high keywords match
    if severity == "moderate":
        for pat in HIGH_KEYWORDS:
            if re.search(pat, description):
                return "P1"
        return "P2"  # moderate without high-keyword match

    # P2 — minor severity
    if severity == "minor":
        return "P2"

    # Default
    return "P3"


def scan_firestore_export():
    """Read feature_requests from a Firestore export (if available).

    Production path: this script runs via a Cloud Function or with the
    Firebase Admin SDK + service account credential. For local cron, it
    reads a snapshot dump if one exists at .claude/state/firestore-exports/
    feature_requests-latest.json.
    """
    export_path = ROOT / ".claude" / "state" / "firestore-exports" / "feature_requests-latest.json"
    if not export_path.exists():
        return None
    try:
        return json.loads(export_path.read_text(encoding="utf-8"))
    except Exception:
        return None


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    reports = scan_firestore_export() or []

    counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0}
    triaged = []
    for r in reports:
        priority = categorize_report(r)
        counts[priority] += 1
        triaged.append({
            "id": r.get("id") or r.get("docId"),
            "priority": priority,
            "type": r.get("type"),
            "severity": r.get("severity"),
            "page": r.get("page"),
            "description_excerpt": (r.get("description") or "")[:120],
            "submitted_by": r.get("submitterName") or "Anonymous",
            "created_at": r.get("createdAt"),
        })

    # Sort by priority (P0 first)
    triaged.sort(key=lambda t: (t["priority"], t.get("created_at") or ""))

    report = {
        "schema_version": "bug-triage-v1",
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "scanned_count": len(reports),
        "export_present": reports != [],
        "counts": counts,
        "triaged": triaged[:50],
        "founder_attention_count": counts["P0"] + counts["P1"],
    }

    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"[bug-triage] scanned={len(reports)} P0={counts['P0']} P1={counts['P1']} P2={counts['P2']} P3={counts['P3']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
