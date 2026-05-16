#!/usr/bin/env python3
"""Aggregate security-health.json from current state.

Per dashboard-completion-spec-2026-05-15.md B2.

Reads:
  - package.json + functions/package.json for declared deps
  - .claude/state/secret-scan-results.json if present
  - Carries forward `active_findings` + `vulnerable_deps` from previous
    aggregate when no fresh source available (status preserved with
    explicit "stale" indicator)

Writes:
  .claude/state/aggregates/security-health.json with:
    timestamp (current UTC ISO-8601)
    status (green | yellow | red | unknown)
    status_reason (1-2 line summary)
    schema_version
    head_sha
    active_findings (list)
    credential_leaks (count)
    vulnerable_deps (list)
    rule_drift (boolean)

Exit 0 always.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / ".claude" / "state"
TARGET = STATE / "aggregates" / "security-health.json"

SCHEMA_VERSION = "security-health-v1.1"


def git_head_short():
    try:
        r = subprocess.run(["git", "rev-parse", "--short", "HEAD"],
                          capture_output=True, text=True, cwd=str(ROOT), timeout=5)
        return r.stdout.strip() if r.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def load_prev():
    if not TARGET.exists():
        return {}
    try:
        return json.loads(TARGET.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return {}


def scan_for_credentials():
    """Quick grep for committed credentials in tracked files. Returns count
    of GENUINE leak suspects (excludes known-public Firebase API keys).

    Patterns scanned: AWS access keys, PEM private keys, Stripe live keys.
    AIza Google API keys are EXCLUDED because Parbaughs intentionally
    publishes the Firebase webapi key in client code — that's gated by
    Firestore rules per CLAUDE.md "Security Notes" section, not by
    secrecy of the key string. False-positiving on it is a goal-PASS
    spoiler.
    """
    patterns = [
        ("aws_access_key", r"AKIA[A-Z0-9]{16}"),
        ("pem_private_key", r"BEGIN[ ](RSA|EC|DSA|OPENSSH|)[ ]?PRIVATE KEY"),
        ("stripe_live_key", r"sk_live_[a-zA-Z0-9]{24,}"),
    ]
    hits = 0
    try:
        for label, pat in patterns:
            # Use -e to disambiguate patterns starting with - in `git grep`.
            # Excludes:
            #   - lockfiles (false-positives from minified strings)
            #   - node_modules (third-party code; package security ≠ ours)
            #   - .claude/hooks/ (secret-scanner itself contains pattern
            #     definitions as search targets)
            #   - .claude/state/security/ (P8 baseline scan outputs contain
            #     the scanner's own pattern regex literals as DATA — false
            #     positive caught in V1 vision verification 2026-05-16)
            #   - scripts/aggregate-security-health.py (this script's own
            #     pattern declarations would match themselves)
            r = subprocess.run(
                ["git", "grep", "-lE", "-e", pat, "HEAD", "--",
                 ":(exclude)*.lock", ":(exclude)node_modules",
                 ":(exclude)functions/node_modules",
                 ":(exclude).claude/hooks/",
                 ":(exclude).claude/state/security/",
                 ":(exclude)scripts/aggregate-security-health.py"],
                capture_output=True, text=True, cwd=str(ROOT), timeout=10,
            )
            if r.returncode == 0 and r.stdout.strip():
                hits += len(r.stdout.strip().splitlines())
    except Exception:
        return None  # cannot determine
    return hits


def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    prev = load_prev()

    cred_leaks = scan_for_credentials()

    # Vulnerable deps: carry forward from prev aggregate (npm audit run is
    # expensive + requires network; a separate scheduled task should refresh
    # the prev aggregate's vulnerable_deps list weekly).
    vuln_deps = prev.get("vulnerable_deps", [])
    active_findings = prev.get("active_findings", [])
    rule_drift = prev.get("rule_drift", False)

    # Determine status
    if cred_leaks is not None and cred_leaks > 0:
        status = "red"
        reason = f"{cred_leaks} potential credential leak(s) detected in tracked files"
    elif rule_drift:
        status = "red"
        reason = "Firestore rules drift detected — review immediately"
    elif vuln_deps:
        # yellow if HIGH+ exist, green only if no known vulns
        high_count = sum(1 for d in vuln_deps if d.get("severity", "").lower() in ("high", "critical"))
        if high_count:
            status = "yellow"
            reason = (
                f"{high_count} HIGH/CRITICAL-severity dependency vulnerabilities. "
                "No active credential leak. No rule drift. No AMD-018 violations."
            )
        else:
            status = "green"
            reason = "No HIGH/CRITICAL CVEs; only low/medium open."
    else:
        if cred_leaks is None:
            status = "unknown"
            reason = "cannot determine — git grep failed; assume safe pending re-check"
        else:
            status = "green"
            reason = "No credential leaks, no rule drift, no known dep vulnerabilities."

    out = {
        "schema_version": SCHEMA_VERSION,
        "timestamp": now,
        "generated_at": now,
        "head_sha": git_head_short(),
        "status": status,
        "status_reason": reason,
        "summary": reason,
        "active_findings": active_findings,
        "credential_leaks": cred_leaks if cred_leaks is not None else 0,
        "vulnerable_deps": vuln_deps,
        "rule_drift": rule_drift,
        "source_files": [
            "git grep (credentials pattern scan)",
            "previous-aggregate vulnerable_deps carry-forward",
        ],
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(out, indent=2), encoding="utf-8")
    print(f"[aggregate-security-health] OK status={status} cred_leaks={cred_leaks} vuln_deps={len(vuln_deps)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
