#!/usr/bin/env python3
"""
FIQ entry grader — applies the FIQ_QUALITY_RUBRIC to a single FIQ entry file
or scans the entire `.claude/state/founder-input-queue/` directory.

Per F3 remediation deliverable. The grader assumes the entry's frontmatter
already contains a `rubric_grade` block authored by the writer (each agent
self-grades at write time). This script:

1. Validates the rubric_grade block (all 5 dims present, totals add up, letter
   matches total per the rubric table).
2. If grade is C or below, surfaces the entry as DEMOTE candidate.
3. Optionally moves DEMOTE candidates to `proactive-backlog.md` (with --apply).
4. Prints a summary report of the queue (count by letter, demote candidates).

Usage:
    # Grade one entry (validate the rubric_grade block in frontmatter)
    python scripts/grade-fiq-entry.py .claude/state/founder-input-queue/FIQ-001.md

    # Scan the whole queue (validation report only — no moves)
    python scripts/grade-fiq-entry.py --scan

    # Apply demotions (move C-F entries to proactive-backlog.md)
    python scripts/grade-fiq-entry.py --scan --apply

Lightweight by design: this is the validator + report tool. The grading
itself (filling in the 5 dimension scores) is done by the agent who writes
the FIQ entry, per rubric § 5 step 2. The grader is a discipline gate, not
an AI judge.
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
QUEUE_DIR = ROOT / ".claude" / "state" / "founder-input-queue"
BACKLOG = ROOT / ".claude" / "state" / "proactive-backlog.md"

# Letter grade table (per rubric § 3)
def grade_letter(total: int) -> str:
    if total >= 23: return "A"
    if total >= 20: return "B"
    if total >= 16: return "C"
    if total >= 11: return "D"
    return "F"


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    # Frontmatter for FIQ entries uses YAML (per rubric § 4); body follows.
    # For simplicity in this validator we accept JSON-in-fences too (transitional).
    m = re.match(r"^---\n(.*?)\n---\n(.*)", body, re.DOTALL)
    if not m:
        return None, body
    fm_text = m.group(1)
    rest = m.group(2)

    # Try JSON first (frontmatter style used by other state files)
    try:
        return json.loads(fm_text), rest
    except json.JSONDecodeError:
        pass

    # Fallback: lightweight YAML parse for FIQ-shaped frontmatter (key: value or key: nested)
    # Implementation note: avoid PyYAML dep — only support the shapes the rubric defines
    return parse_yaml_lite(fm_text), rest


def parse_yaml_lite(text: str):
    # Minimal YAML for the FIQ schema. Top-level scalars + 1 level of nesting.
    # Sufficient for validation; agents writing entries can use either JSON or this YAML shape.
    out = {}
    cur_key = None
    cur_sub = None
    for line in text.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if not line.startswith(" "):
            if ":" in line:
                k, _, v = line.partition(":")
                k = k.strip()
                v = v.strip()
                if v == "" or v.startswith("|") or v.startswith(">"):
                    out[k] = {} if v == "" else v
                    cur_key = k
                    cur_sub = None
                else:
                    out[k] = parse_scalar(v)
                    cur_key = None
                    cur_sub = None
        else:
            # Indented — belongs to cur_key
            if cur_key is None:
                continue
            stripped = line.strip()
            if stripped.startswith("- "):
                # list item under cur_key
                if not isinstance(out.get(cur_key), list):
                    out[cur_key] = []
                if isinstance(out[cur_key], list):
                    out[cur_key].append(parse_scalar(stripped[2:].strip()))
            elif ":" in stripped:
                k, _, v = stripped.partition(":")
                k = k.strip()
                v = v.strip()
                if not isinstance(out.get(cur_key), dict):
                    out[cur_key] = {}
                if isinstance(out[cur_key], dict):
                    out[cur_key][k] = parse_scalar(v) if v else {}
    return out


def parse_scalar(v):
    if v.lower() in ("true", "yes"):
        return True
    if v.lower() in ("false", "no"):
        return False
    if v.lower() in ("null", "~", ""):
        return None
    try:
        if "." in v:
            return float(v)
        return int(v)
    except ValueError:
        pass
    # Strip surrounding quotes if present
    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
        return v[1:-1]
    return v


def validate_entry(path: Path):
    """Returns (ok, letter, total, issues:list[str])."""
    fm, _body = read_frontmatter(path)
    if fm is None:
        return False, None, None, [f"no frontmatter parsed at {path}"]
    issues = []
    rg = fm.get("rubric_grade")
    if not isinstance(rg, dict):
        return False, None, None, ["missing or non-dict `rubric_grade` block"]
    dims = ("specificity", "decision_readiness", "blast_radius", "reversibility", "alternatives")
    scores = []
    for d in dims:
        v = rg.get(d)
        if not isinstance(v, int):
            issues.append(f"`rubric_grade.{d}` missing or not an integer")
            scores.append(0)
            continue
        if v < 0 or v > 5:
            issues.append(f"`rubric_grade.{d}` = {v} out of allowed [0..5]")
            scores.append(max(0, min(5, v)))
        else:
            scores.append(v)
    total_declared = rg.get("total")
    total_computed = sum(scores)
    if total_declared != total_computed:
        issues.append(f"`rubric_grade.total` declared={total_declared} != computed={total_computed}")
    letter_declared = rg.get("letter")
    letter_computed = grade_letter(total_computed)
    if letter_declared != letter_computed:
        issues.append(f"`rubric_grade.letter` declared={letter_declared} != computed={letter_computed}")
    # Required FIQ schema fields (per rubric § 4)
    for required in ("id", "priority", "question", "blocking", "raised_by", "raised_at"):
        if required not in fm:
            issues.append(f"missing required FIQ field: `{required}`")
    return len(issues) == 0, letter_computed, total_computed, issues


def demote_entry(path: Path, letter: str, total: int, issues: list):
    """Append the entry to proactive-backlog.md and remove from queue."""
    body = path.read_text(encoding="utf-8")
    snippet = (
        f"\n\n---\n\n"
        f"### Demoted FIQ — {path.name} (letter {letter}, total {total}/25)\n\n"
        f"Demoted by `scripts/grade-fiq-entry.py` on {datetime.now(timezone.utc).isoformat()}.\n\n"
        f"Issues raised: {'; '.join(issues) if issues else 'rubric grade below B'}\n\n"
        f"```\n{body}\n```\n"
    )
    BACKLOG.parent.mkdir(parents=True, exist_ok=True)
    if not BACKLOG.exists():
        BACKLOG.write_text(
            "# Proactive Backlog\n\n"
            "Auto-managed by `scripts/grade-fiq-entry.py` per `FIQ_QUALITY_RUBRIC.md`.\n"
            "Entries here graded C or below at last grade pass. Revise + re-promote when ready.\n",
            encoding="utf-8",
        )
    with BACKLOG.open("a", encoding="utf-8") as f:
        f.write(snippet)
    path.unlink()


def scan(apply_demotions: bool = False):
    if not QUEUE_DIR.exists():
        print(f"[grade-fiq] queue dir missing: {QUEUE_DIR} (no entries to grade)")
        return 0
    entries = sorted(QUEUE_DIR.glob("*.md"))
    if not entries:
        print(f"[grade-fiq] no FIQ entries in {QUEUE_DIR}")
        return 0
    counts = {l: 0 for l in "ABCDF"}
    demote_candidates = []
    invalid = []
    for p in entries:
        ok, letter, total, issues = validate_entry(p)
        tag = letter or "?"
        print(f"[grade-fiq] {p.name:40s} -> {tag} ({total}/25){'   OK' if ok else '   ISSUES'}")
        for i in issues:
            print(f"             - {i}")
        if not ok:
            invalid.append(p.name)
        if letter:
            counts[letter] = counts.get(letter, 0) + 1
            if letter in "CDF":
                demote_candidates.append((p, letter, total, issues))
    print("\nSummary:")
    for l in "ABCDF":
        print(f"  {l}: {counts.get(l, 0)}")
    print(f"  Invalid frontmatter: {len(invalid)}")
    print(f"  Demote candidates (C-F): {len(demote_candidates)}")
    if apply_demotions and demote_candidates:
        print("\nApplying demotions...")
        for p, l, t, iss in demote_candidates:
            demote_entry(p, l, t, iss)
            print(f"  demoted {p.name} -> proactive-backlog.md")
    elif demote_candidates and not apply_demotions:
        print("\n(run with --apply to actually move demote candidates to proactive-backlog.md)")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", help="single FIQ entry to validate")
    ap.add_argument("--scan", action="store_true", help="scan the whole queue")
    ap.add_argument("--apply", action="store_true", help="apply demotions to proactive-backlog.md")
    args = ap.parse_args()
    if args.scan:
        return scan(apply_demotions=args.apply)
    if not args.path:
        ap.error("provide a path or use --scan")
    p = Path(args.path)
    ok, letter, total, issues = validate_entry(p)
    print(f"{p}: {letter} ({total}/25){'  OK' if ok else '  ISSUES'}")
    for i in issues:
        print(f"  - {i}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
