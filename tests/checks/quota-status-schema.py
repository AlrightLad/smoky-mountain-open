#!/usr/bin/env python3
"""
quota-status-schema.py — validates .claude/state/quota-status.json schema.

Per PROP-003.a token meter sidecar mechanics acceptance criteria #2:
"tests/checks/quota-status-schema.py validates the schema; round-trip
integrates this check."

USAGE
    python tests/checks/quota-status-schema.py
        Validates .claude/state/quota-status.json. Exits 0 if valid,
        non-zero with diagnostic if not.

    python tests/checks/quota-status-schema.py --absent-ok
        File-may-be-absent mode: returns 0 if file doesn't exist (used
        during early sidecar adoption when first cron hasn't fired yet).

VALIDATION GATES
    1. File parses as JSON
    2. Has required top-level keys: schema_version, as_of, data_source,
       weekly_cap, weekly_tokens, org_monthly_cap, org_monthly_tokens
    3. schema_version == 1
    4. data_source in {none, manual-paste, manual-paste-stale,
       headless-cost, console-scrape}
    5. Percent fields (weekly_pct, org_monthly_pct) in [0, 1] when not null
    6. Token fields are non-negative ints when not null
    7. stale_seconds is non-negative int when not null
    8. as_of is parseable ISO-8601

EXIT CODES
    0  Valid
    1  File missing (when --absent-ok not set)
    2  Invalid JSON
    3  Missing required key
    4  Invalid field value
"""
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PATH = ROOT / ".claude" / "state" / "quota-status.json"

REQUIRED_KEYS = {
    "schema_version", "as_of", "data_source",
    "weekly_cap", "weekly_tokens",
    "org_monthly_cap", "org_monthly_tokens",
}
ALLOWED_DATA_SOURCES = {
    "none", "manual-paste", "manual-paste-stale",
    "headless-cost", "console-scrape",
}


def validate(payload):
    """Returns list of failure messages (empty = valid)."""
    fails = []

    missing = REQUIRED_KEYS - set(payload.keys())
    if missing:
        fails.append(f"missing required keys: {sorted(missing)}")
        return fails

    if payload.get("schema_version") != 1:
        fails.append(f"schema_version must be 1, got {payload.get('schema_version')!r}")

    ds = payload.get("data_source")
    if ds not in ALLOWED_DATA_SOURCES:
        fails.append(f"data_source must be one of {sorted(ALLOWED_DATA_SOURCES)}, got {ds!r}")

    # as_of must be parseable ISO-8601
    try:
        as_of_str = payload.get("as_of", "")
        # Allow "Z" suffix; Python <3.11 doesn't parse Z, so normalize.
        normalized = re.sub(r"Z$", "+00:00", as_of_str)
        datetime.fromisoformat(normalized)
    except Exception as e:
        fails.append(f"as_of not parseable ISO-8601 ({as_of_str!r}): {e}")

    # Numeric range checks
    for pct_key in ("weekly_pct", "org_monthly_pct"):
        v = payload.get(pct_key)
        if v is not None:
            if not isinstance(v, (int, float)):
                fails.append(f"{pct_key} must be number or null, got {type(v).__name__}")
            elif not (0 <= v <= 1):
                fails.append(f"{pct_key} must be in [0, 1], got {v}")

    for tok_key in ("weekly_tokens", "org_monthly_tokens"):
        v = payload.get(tok_key)
        if v is None:
            continue
        if not isinstance(v, int) or v < 0:
            fails.append(f"{tok_key} must be non-negative int, got {v!r}")

    for cap_key in ("weekly_cap", "org_monthly_cap"):
        v = payload.get(cap_key)
        if v is None:
            continue
        if not isinstance(v, int) or v <= 0:
            fails.append(f"{cap_key} must be positive int or null, got {v!r}")

    ss = payload.get("stale_seconds")
    if ss is not None:
        if not isinstance(ss, int) or ss < 0:
            fails.append(f"stale_seconds must be non-negative int or null, got {ss!r}")

    # Cross-field sanity: weekly_pct and weekly_tokens should be roughly
    # consistent IF cap is known. Tolerance ±1 due to int rounding.
    wp = payload.get("weekly_pct")
    wc = payload.get("weekly_cap")
    wt = payload.get("weekly_tokens")
    if wp is not None and wc and wt is not None:
        expected = int(wp * wc)
        if abs(wt - expected) > 2:
            fails.append(
                f"weekly_tokens inconsistent with weekly_pct*weekly_cap: "
                f"got {wt}, expected ~{expected} (pct={wp}, cap={wc})"
            )

    return fails


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("--path", default=str(DEFAULT_PATH),
                   help="Path to quota-status.json (default: .claude/state/quota-status.json)")
    p.add_argument("--absent-ok", action="store_true",
                   help="Return 0 if the file does not exist (early-adoption mode)")
    args = p.parse_args()

    target = Path(args.path)
    if not target.exists():
        if args.absent_ok:
            print(f"[quota-status-schema] OK (file absent + --absent-ok): {target}")
            return 0
        print(f"[quota-status-schema] FAIL: file missing: {target}", file=sys.stderr)
        return 1

    try:
        payload = json.loads(target.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"[quota-status-schema] FAIL: invalid JSON: {e}", file=sys.stderr)
        return 2

    fails = validate(payload)
    if fails:
        print(f"[quota-status-schema] FAIL: {len(fails)} schema issue(s):", file=sys.stderr)
        for f in fails:
            print(f"  - {f}", file=sys.stderr)
        # Per usage docstring: exit 3 for missing keys, 4 for invalid values.
        any_missing = any("missing required keys" in f for f in fails)
        return 3 if any_missing else 4

    summary = (f"data_source={payload.get('data_source')} "
               f"weekly_pct={payload.get('weekly_pct')} "
               f"org_monthly_pct={payload.get('org_monthly_pct')} "
               f"stale_seconds={payload.get('stale_seconds')}")
    print(f"[quota-status-schema] OK: {summary}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
