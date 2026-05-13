#!/usr/bin/env python3
"""
Scan git log for commits implementing approved proposals; move each
matching proposal from `.claude/state/proposals/approved/` to `.../shipped/`
and append `shipped_at` + `shipped_in_commit` fields to its frontmatter.

Per PROPOSAL_LIFECYCLE_v8.2 (draft): a commit message containing
`Implements PROP-NNN` or `Closes PROP-NNN` (case-insensitive) ships the
referenced proposal. Multiple PROPs per commit are supported.

Idempotent: re-runs are safe — already-shipped proposals are skipped.

Telemetry: emits proposal.shipped per move + proposal.shipped_scan.complete
to `.claude/state/telemetry/events/<date>.ndjson`.

Audit trail: append-only `.claude/state/proposals/shipped-log.md`.
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
PROPOSALS = STATE / "proposals"
APPROVED = PROPOSALS / "approved"
SHIPPED = PROPOSALS / "shipped"
LOG = PROPOSALS / "shipped-log.md"
EVENTS_DIR = STATE / "telemetry" / "events"

# Per PROPOSAL_LIFECYCLE_v8.2 § 3 — accept "Implements PROP-NNN" or "Closes PROP-NNN"
# Case-insensitive. Comma or space separates multiple PROPs.
PROP_REF_RE = re.compile(r"\b(?:implements|closes)\s+(PROP-\d+(?:[-\w]*)?(?:\s*,\s*PROP-\d+(?:[-\w]*)?)*)", re.IGNORECASE)
PROP_ID_RE = re.compile(r"PROP-(\d+)", re.IGNORECASE)


def git(*args, cwd=ROOT):
    """Run git; return stdout (string). On failure, return None."""
    try:
        r = subprocess.run(["git", *args], cwd=str(cwd), capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            return None
        return r.stdout
    except Exception:
        return None


def commits_referencing_props(days_back: int = 90):
    """Return list of dicts: {sha, author_date_iso, subject, body, props:set}."""
    # Use --pretty with stable separator; %H sha, %aI author ISO, %s subject, %b body
    raw = git("log", f"--since={days_back}.days", "--pretty=format:%H%x1f%aI%x1f%s%x1f%b%x1e")
    if not raw:
        return []
    out = []
    for entry in raw.split("\x1e"):
        entry = entry.strip("\n").strip()
        if not entry:
            continue
        parts = entry.split("\x1f")
        if len(parts) < 4:
            continue
        sha, date, subject, body = parts[0], parts[1], parts[2], parts[3]
        full = subject + "\n" + body
        props = set()
        for m in PROP_REF_RE.finditer(full):
            blob = m.group(1)
            for idm in PROP_ID_RE.finditer(blob):
                props.add("PROP-" + idm.group(1).zfill(3) if len(idm.group(1)) < 3 else "PROP-" + idm.group(1))
        if props:
            out.append({"sha": sha, "short_sha": sha[:7], "date": date, "subject": subject, "props": props})
    # Sort by date ascending so the earliest matching commit wins (per § 3 rule 3)
    out.sort(key=lambda c: c["date"])
    return out


def read_frontmatter(path: Path):
    body = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)", body, re.DOTALL)
    if not m:
        return None, body
    try:
        return json.loads(m.group(1)), m.group(2)
    except json.JSONDecodeError:
        return None, body


def write_frontmatter(path: Path, fm: dict, rest: str):
    body = "---\n" + json.dumps(fm, indent=2) + "\n---\n" + rest
    path.write_text(body, encoding="utf-8")


def approved_props_by_id():
    out = {}
    if not APPROVED.exists():
        return out
    for f in sorted(APPROVED.glob("*.md")):
        fm, _ = read_frontmatter(f)
        if fm is None:
            continue
        pid = fm.get("id")
        if pid:
            out[pid.upper()] = (f, fm)
    return out


def emit_event(event_type: str, data: dict):
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    f = EVENTS_DIR / f"{date_str}.ndjson"
    line = json.dumps({
        "event_type": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }) + "\n"
    with f.open("a", encoding="utf-8") as fh:
        fh.write(line)


def append_log(prop_id: str, approved_at: str, shipped_at: str, commit_sha: str, subject: str):
    LOG.parent.mkdir(parents=True, exist_ok=True)
    if not LOG.exists():
        header = (
            "# Shipped Proposals — Append-Only Audit Log\n\n"
            "Per PROPOSAL_LIFECYCLE_v8.2 § 5. Every transition from approved/ to shipped/ "
            "appends a row. Rows are immutable — no edits to historical entries.\n\n"
            "| PROP id  | approved_at          | shipped_at           | commit_sha | commit_subject (first 80 chars) |\n"
            "|----------|----------------------|----------------------|------------|----------------------------------|\n"
        )
        LOG.write_text(header, encoding="utf-8")
    subj_clean = (subject or "").replace("|", "\\|").replace("\n", " ").strip()[:80]
    with LOG.open("a", encoding="utf-8") as fh:
        fh.write(f"| {prop_id:<8} | {approved_at:<20} | {shipped_at:<20} | {commit_sha:<10} | {subj_clean} |\n")


def main():
    if not APPROVED.exists():
        print(f"[scan-shipped] no approved/ folder; nothing to scan")
        return 0
    SHIPPED.mkdir(parents=True, exist_ok=True)

    approved = approved_props_by_id()
    if not approved:
        print(f"[scan-shipped] approved/ is empty; nothing to scan")
        emit_event("proposal.shipped_scan.complete", {"moved": 0, "skipped_already_shipped": 0, "warnings": []})
        return 0

    commits = commits_referencing_props(days_back=90)
    print(f"[scan-shipped] approved={len(approved)} candidate-commits-90d={len(commits)}")

    # Map prop_id → earliest matching commit
    earliest = {}
    warnings = []
    for c in commits:
        for pid in c["props"]:
            if pid in earliest:
                continue  # commits sorted ascending → first hit is earliest
            earliest[pid] = c
            if pid not in approved:
                warnings.append(f"commit {c['short_sha']} references {pid} but it's not in approved/ (may be already-shipped, rejected, or typo)")

    moved = 0
    skipped = 0
    for prop_id, (path, fm) in approved.items():
        if prop_id not in earliest:
            continue
        c = earliest[prop_id]
        if "shipped_at" in fm:
            skipped += 1
            continue
        # Append fields + move
        fm["shipped_at"] = c["date"]
        fm["shipped_in_commit"] = c["short_sha"]
        # Read rest of body
        _fm_check, rest = read_frontmatter(path)
        # Write updated frontmatter to original path first (so rest is preserved)
        write_frontmatter(path, fm, rest)
        # Move file to shipped/
        new_path = SHIPPED / path.name
        if new_path.exists():
            warnings.append(f"target {new_path.name} already exists in shipped/; not overwriting")
            continue
        path.rename(new_path)
        approved_at = fm.get("approved_at") or fm.get("created_at") or "—"
        append_log(prop_id, approved_at, c["date"], c["short_sha"], c["subject"])
        emit_event("proposal.shipped", {
            "prop_id": prop_id,
            "approved_at": approved_at,
            "shipped_at": c["date"],
            "shipped_in_commit": c["short_sha"],
            "commit_subject": c["subject"][:120],
        })
        print(f"[scan-shipped] SHIPPED {prop_id} via {c['short_sha']}: {c['subject'][:60]}")
        moved += 1

    for w in warnings:
        print(f"[scan-shipped] WARN {w}")
    print(f"[scan-shipped] done: moved={moved} skipped_already_shipped={skipped} warnings={len(warnings)}")
    emit_event("proposal.shipped_scan.complete", {"moved": moved, "skipped_already_shipped": skipped, "warnings": warnings})
    return 0


if __name__ == "__main__":
    sys.exit(main())
