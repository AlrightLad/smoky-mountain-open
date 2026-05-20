#!/usr/bin/env python3
"""Proposal-state invariant checker (Critique-loop Decision 6 gap #5).

Surfaces three classes of proposal-pipeline issues that today are silent:

  1. OBSOLETED-BY drift — an archived proposal cites a shipped substrate
     file ('shipped-substrate: .claude/skills/foo/SKILL.md'). If that file
     no longer exists, the archive's premise is broken.
  2. Stale approved proposals — proposals in approved/ for > N days
     (default 14) without execution evidence. Per Critique-loop Decision 6,
     'approved' should be a transient state; PROP-006 + PROP-010 sat in
     approved/ as 'filed but not executed' which masks delivery gap.
  3. Stale pending proposals — proposals in pending/ for > N days
     (default 14) without disposition. Per Founder mandate 2026-05-19,
     these are candidates for auto-archive (engineering-only decisions
     should not block on Founder pickup).

Exit codes:
  0  — all invariants hold
  1  — at least one drift or stale-bucket finding (informational; the
       script is wired into the post-commit hook as a SOFT gate, prints
       to stderr but does not block the commit).

Wire-in: post-commit hook (.husky/post-commit) reads the JSON output
into the architecture-review aggregator as a 'proposal-pipeline'
finding so the dashboard surfaces drift without manual file inspection.

Outputs:
  - stdout: human-readable summary
  - .claude/state/aggregates/proposal-pipeline.json: machine-readable
    findings for the dashboard aggregator.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Helper for idempotent JSON write.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from _idempotent_write import idempotent_write_json  # noqa: E402

STATE = ROOT / ".claude" / "state"
PROPOSALS = STATE / "proposals"
TARGET = STATE / "aggregates" / "proposal-pipeline.json"

# Days before a proposal is considered "stale" in its bucket.
STALE_DAYS_DEFAULT = 14

# Buckets to scan. Each tuple is (subdir, mandatory_status_for_freshness).
BUCKETS = [
    ("pending", "pending"),
    ("approved", "approved"),
    ("archived", None),  # archived has no freshness expectation
    ("rejected", None),
    ("deferred", None),
    ("ship-readiness-deferred", None),
    ("shipped", None),
]


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load_proposal_json(md_path: Path) -> dict | None:
    """Read the YAML/JSON frontmatter from a proposal .md file. The
    proposals here use a non-standard fenced-frontmatter style — JSON
    blob inside `---...---` fences. Best-effort parse; returns None on
    malformed input."""
    try:
        text = md_path.read_text(encoding="utf-8")
    except OSError:
        return None
    if not text.startswith("---"):
        return None
    # Find the closing fence.
    end = text.find("\n---", 3)
    if end < 0:
        return None
    body = text[3:end].strip()
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def _parse_dt(s: str) -> datetime | None:
    """Parse an ISO-8601 string into a tz-aware datetime; returns None on
    failure or empty string."""
    if not s:
        return None
    try:
        raw = s.replace("Z", "+00:00") if s.endswith("Z") else s
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _proposal_age_days(prop: dict, mtime_fallback: float) -> float:
    """Return the age in days based on the proposal's `created_at` field,
    falling back to the file mtime if absent."""
    created = _parse_dt(prop.get("created_at", ""))
    if created is None:
        created = datetime.fromtimestamp(mtime_fallback, tz=timezone.utc)
    age = datetime.now(timezone.utc) - created
    return age.total_seconds() / 86400.0


def scan_bucket(bucket: str, expected_status: str | None,
                stale_days: int) -> list[dict]:
    """Return a list of findings for one bucket. Each finding is a dict
    suitable for inclusion in the aggregator JSON output."""
    bucket_dir = PROPOSALS / bucket
    if not bucket_dir.exists():
        return []
    findings: list[dict] = []
    # Iterate proposal .md files; ignore companion .json files.
    for md in sorted(bucket_dir.glob("PROP-*.md")):
        prop = _load_proposal_json(md)
        if prop is None:
            findings.append({
                "kind": "parse-fail",
                "bucket": bucket,
                "file": str(md.relative_to(ROOT)),
                "severity": "low",
                "detail": "Frontmatter JSON did not parse; manual review needed.",
            })
            continue
        prop_id = prop.get("id") or md.stem
        age_days = _proposal_age_days(prop, md.stat().st_mtime)
        # Stale-bucket check
        if expected_status and age_days > stale_days:
            findings.append({
                "kind": "stale-bucket",
                "bucket": bucket,
                "id": prop_id,
                "file": str(md.relative_to(ROOT)),
                "age_days": round(age_days, 1),
                "stale_threshold_days": stale_days,
                "severity": "medium" if bucket == "pending" else "low",
                "detail": (
                    f"{prop_id} has sat in {bucket}/ for "
                    f"{age_days:.1f} days (threshold {stale_days}). "
                    f"Engineering-only proposals beyond this threshold are "
                    f"candidates for auto-disposition per Founder mandate "
                    f"2026-05-19."
                ),
            })
        # Status field cross-check
        status = prop.get("status")
        if expected_status and status and status != expected_status:
            findings.append({
                "kind": "status-mismatch",
                "bucket": bucket,
                "id": prop_id,
                "file": str(md.relative_to(ROOT)),
                "expected_status": expected_status,
                "actual_status": status,
                "severity": "low",
                "detail": (
                    f"{prop_id} sits in {bucket}/ but frontmatter "
                    f"status={status!r} (expected {expected_status!r})."
                ),
            })
        # OBSOLETED-BY drift check (archived proposals)
        if bucket == "archived":
            shipped = prop.get("shipped_substrate") or prop.get("substrate")
            if isinstance(shipped, str):
                candidate = ROOT / shipped
                if not candidate.exists():
                    findings.append({
                        "kind": "obsoleted-by-drift",
                        "bucket": bucket,
                        "id": prop_id,
                        "file": str(md.relative_to(ROOT)),
                        "missing_substrate": shipped,
                        "severity": "high",
                        "detail": (
                            f"{prop_id} cites shipped substrate "
                            f"{shipped!r} which no longer exists at the "
                            f"cited path. Either restore or re-disposition."
                        ),
                    })
    return findings


def main(argv: list[str]) -> int:
    stale_days = STALE_DAYS_DEFAULT
    for arg in argv:
        if arg.startswith("--stale-days="):
            try:
                stale_days = int(arg.split("=", 1)[1])
            except ValueError:
                pass

    all_findings: list[dict] = []
    counts_by_bucket: dict[str, int] = {}
    for bucket, expected in BUCKETS:
        findings = scan_bucket(bucket, expected, stale_days)
        all_findings.extend(findings)
        counts_by_bucket[bucket] = sum(
            1 for f in (PROPOSALS / bucket).glob("PROP-*.md")
            if (PROPOSALS / bucket).exists()
        ) if (PROPOSALS / bucket).exists() else 0

    severity_rank = {"high": 0, "medium": 1, "low": 2}
    all_findings.sort(key=lambda f: severity_rank.get(f.get("severity", "low"), 3))

    status = "green"
    if any(f.get("severity") == "high" for f in all_findings):
        status = "red"
    elif any(f.get("severity") == "medium" for f in all_findings):
        status = "yellow"
    elif all_findings:
        status = "yellow"  # any low-severity finding still warrants yellow

    out = {
        "schema_version": "proposal-pipeline-v1.0",
        "timestamp": _iso_now(),
        "generated_at": _iso_now(),
        "status": status,
        "summary": (
            f"{len(all_findings)} findings across "
            f"{len([b for b, c in counts_by_bucket.items() if c])} buckets"
            if all_findings else "no findings — pipeline clean"
        ),
        "counts_by_bucket": counts_by_bucket,
        "findings": all_findings,
        "stale_threshold_days": stale_days,
        "source": "scripts/audit-proposals.py (autonomous-v1)",
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    wrote, reason = idempotent_write_json(TARGET, out)

    # Human-readable stdout
    print(f"[audit-proposals] status={status} findings={len(all_findings)} "
          f"write={wrote} ({reason})")
    for f in all_findings:
        sev = f.get("severity", "?")
        kind = f.get("kind", "?")
        pid = f.get("id") or f.get("file", "?")
        detail = f.get("detail", "")
        print(f"  [{sev.upper():6s}] {kind}: {pid} — {detail[:120]}",
              file=sys.stderr if sev in ("high", "medium") else sys.stdout)

    # Exit 1 if any high-severity finding exists (so post-commit hook
    # surfaces it to stderr). Stale/medium = exit 0 (informational only).
    if any(f.get("severity") == "high" for f in all_findings):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
