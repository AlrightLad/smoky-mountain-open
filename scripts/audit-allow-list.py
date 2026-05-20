#!/usr/bin/env python3
"""Allow-list staleness scanner (Critique-loop Decision 4, gap #5).

The PARBAUGHS policy allow-list (`.claude/settings.json`) currently has
~140 entries. Per the critique, "no machine-parseable schema test that
every allow is still relevant" — entries can become stale over months
without anyone noticing.

This script:
  1. Reads `.claude/settings.json` permissions.allow patterns.
  2. Walks the last N days (default 90) of git log + the cron logs.
  3. For each allow pattern, checks if any command/path in that window
     would have matched.
  4. Emits findings for patterns with ZERO observed matches.

Output:
  - stdout: human-readable summary
  - `.claude/state/aggregates/allow-list-audit.json`: machine-readable
    findings for dashboard surfacing.

Exit codes:
  0 — informational; allow-list scan never blocks
  (always exits 0 — findings are signal, not failure)

This is informational scaffolding for a future trim — the script does
NOT auto-remove allow entries. Founder reviews findings + decides which
to retire.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from _idempotent_write import idempotent_write_json  # noqa: E402

SETTINGS = ROOT / ".claude" / "settings.json"
TARGET = ROOT / ".claude" / "state" / "aggregates" / "allow-list-audit.json"
CRON_LOGS = ROOT / "scripts" / "cron" / "logs"

LOOKBACK_DAYS_DEFAULT = 90


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _read_allow_list() -> list[str]:
    """Read permissions.allow patterns from settings.json."""
    if not SETTINGS.exists():
        return []
    try:
        data = json.loads(SETTINGS.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    perms = data.get("permissions", {})
    allow = perms.get("allow", [])
    return [a for a in allow if isinstance(a, str)]


def _git_log_corpus(days: int) -> str:
    """Return the concatenated commit messages of the last `days` days.
    This is a rough proxy for "commands the agent has been running" —
    cron auto-commits + ship commits both reference scripts."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    try:
        r = subprocess.run(
            ["git", "log", f"--since={since}", "--pretty=%s%n%b"],
            capture_output=True, cwd=str(ROOT), timeout=30,
        )
        if r.returncode == 0:
            return r.stdout.decode("utf-8", errors="replace")
    except Exception:
        pass
    return ""


def _cron_log_corpus(days: int) -> str:
    """Return contents of recent cron logs; rich source of actual
    commands executed during scheduled tasks."""
    if not CRON_LOGS.exists():
        return ""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    chunks: list[str] = []
    for log in CRON_LOGS.glob("*.log"):
        try:
            mtime = datetime.fromtimestamp(log.stat().st_mtime, tz=timezone.utc)
            if mtime < cutoff:
                continue
            chunks.append(log.read_text(encoding="utf-8", errors="replace"))
        except OSError:
            continue
    return "\n".join(chunks)


def _pattern_to_regex(pattern: str) -> re.Pattern[str] | None:
    """Convert a claude-code permission pattern to a coarse regex.
    Patterns look like:
      Bash(git status*)
      Edit(scripts/**)
      Read(*)
    We extract the inner predicate and translate * to .* and ** to .*.
    This is intentionally LOOSE (we want positives, not negatives)."""
    m = re.match(r"^(Bash|Edit|Write|MultiEdit|Read|Glob|Grep|TodoWrite|WebFetch|WebSearch|PowerShell)\((.+)\)$", pattern)
    if not m:
        return None
    body = m.group(2)
    # Translate glob to regex
    rx = re.escape(body).replace(r"\*\*", ".*").replace(r"\*", "[^()\\s]*")
    try:
        return re.compile(rx)
    except re.error:
        return None


def main(argv: list[str]) -> int:
    lookback_days = LOOKBACK_DAYS_DEFAULT
    for arg in argv:
        if arg.startswith("--days="):
            try:
                lookback_days = int(arg.split("=", 1)[1])
            except ValueError:
                pass

    allow = _read_allow_list()
    if not allow:
        print("[audit-allow-list] no allow-list found; skipping")
        return 0

    corpus = _git_log_corpus(lookback_days) + "\n" + _cron_log_corpus(lookback_days)
    if not corpus.strip():
        print("[audit-allow-list] no corpus available; cannot audit")
        return 0

    findings: list[dict] = []
    matched = 0
    for pattern in allow:
        # Wildcard read-only patterns are always relevant — skip.
        if pattern in ("Read(*)", "Glob(*)", "Grep(*)", "TodoWrite(*)", "WebFetch(*)", "WebSearch(*)"):
            matched += 1
            continue
        rx = _pattern_to_regex(pattern)
        if rx is None:
            findings.append({
                "kind": "unparseable-pattern",
                "pattern": pattern,
                "severity": "low",
                "detail": "Pattern could not be regex-translated; skipping.",
            })
            continue
        if rx.search(corpus):
            matched += 1
        else:
            findings.append({
                "kind": "no-observed-match",
                "pattern": pattern,
                "severity": "low",
                "lookback_days": lookback_days,
                "detail": (
                    f"No observed use of {pattern!r} in git log + cron "
                    f"logs over the past {lookback_days} days. Candidate "
                    f"for retirement — review before removing."
                ),
            })

    status = "green" if not findings else "yellow"

    out = {
        "schema_version": "allow-list-audit-v1.0",
        "timestamp": _iso_now(),
        "generated_at": _iso_now(),
        "status": status,
        "lookback_days": lookback_days,
        "total_allow_patterns": len(allow),
        "observed_matches": matched,
        "no_observed_matches": len(findings),
        "findings": findings[:50],  # cap findings to keep JSON small
        "findings_truncated": len(findings) > 50,
        "summary": (
            f"{matched}/{len(allow)} patterns matched git+cron corpus over "
            f"{lookback_days}d; {len(findings)} candidate for review."
        ),
        "source": "scripts/audit-allow-list.py",
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    wrote, reason = idempotent_write_json(TARGET, out)
    print(f"[audit-allow-list] status={status} matched={matched}/{len(allow)} "
          f"unused={len(findings)} write={wrote} ({reason})")
    if findings[:10]:
        print(f"[audit-allow-list] top candidates (first 10):")
        for f in findings[:10]:
            print(f"  {f.get('pattern', '?')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
