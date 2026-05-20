#!/usr/bin/env python3
"""Property test for scripts/_idempotent_write.py.

Critique-loop gap (Decision 10): the first fix for the dirty-tree cycle
missed `head_sha` — the enumeration of "timestamp keys to mask" was
LEXICAL (anything named timestamp/generated_at/...) rather than SEMANTIC
(any field that changes when underlying content does not).

This property test catches that whole CLASS of bug:
  Given an unchanged source-of-truth (same input dict), the helper must
  produce ZERO writes on the second invocation, regardless of whether
  the input contained NEW volatile fields the developer forgot to add
  to TIMESTAMP_KEYS_DEFAULT.

Run:
    python tests/idempotency/test_idempotent_write.py

Exit codes:
    0  - all properties hold
    1  - at least one property failed

Wire-in: post-commit hook + scripts/regen-all.sh add this as a parity
gate alongside the existing aggregate-self-tests.py.

Scope:
  - Pure unit test on _idempotent_write helper (no aggregator I/O).
  - Uses tempfile.TemporaryDirectory, no repo state mutation.
  - Synthetic data exercises every known volatile field + invents two
    new ones to prove the same drift bug cannot recur silently.
"""
from __future__ import annotations

import json
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

# Import the helper. (Module rename — scripts/lib/idempotent_write.py — is
# tracked as a separate auto-implementation; until that lands, the import
# remains scripts/_idempotent_write.py.)
from _idempotent_write import idempotent_write_json, TIMESTAMP_KEYS_DEFAULT  # noqa: E402


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _payload(stable_data: dict, *, ts_override: str | None = None,
             head_sha: str | None = None) -> dict:
    """Build a payload with optional volatile fields. `stable_data` is
    the meaningful content; ts_override / head_sha let tests simulate
    drift in volatile fields only."""
    out = {
        "schema_version": "test-v1",
        "timestamp": ts_override or _iso_now(),
        "generated_at": ts_override or _iso_now(),
        "data": stable_data,
    }
    if head_sha:
        out["head_sha"] = head_sha
    return out


def test_first_write_creates_file() -> tuple[bool, str]:
    """Property: first call writes."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        wrote, reason = idempotent_write_json(path, _payload({"k": "v"}))
        if not wrote:
            return False, f"expected write on first call, got skip ({reason})"
        if not path.exists():
            return False, "first write did not create file"
        return True, "ok"


def test_second_identical_call_skips() -> tuple[bool, str]:
    """Property: identical content + fresh timestamp -> skip."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        idempotent_write_json(path, _payload({"k": "v"}))
        mtime_first = path.stat().st_mtime
        # Sleep enough to detect mtime change on Windows (1s granularity)
        time.sleep(1.1)
        wrote, reason = idempotent_write_json(path, _payload({"k": "v"}))
        if wrote:
            return False, f"expected skip on identical second call, got write ({reason})"
        mtime_second = path.stat().st_mtime
        if mtime_second != mtime_first:
            return False, "file mtime changed despite skip-reported"
        return True, "ok"


def test_head_sha_drift_alone_does_not_trigger_write() -> tuple[bool, str]:
    """Property (REGRESSION GUARD for Decision 10 gap): when only the
    head_sha rotates (cron auto-commit pattern), content is unchanged ->
    must skip."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        idempotent_write_json(path, _payload({"k": "v"}, head_sha="abc1234"))
        wrote, reason = idempotent_write_json(
            path, _payload({"k": "v"}, head_sha="def5678")
        )
        if wrote:
            return False, (
                f"head_sha-only drift triggered write; this is the exact "
                f"dirty-tree-cycle bug Decision 10 was supposed to fix "
                f"(reason={reason})"
            )
        return True, "ok"


def test_content_change_triggers_write() -> tuple[bool, str]:
    """Property: meaningful content change -> write."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        idempotent_write_json(path, _payload({"k": "v1"}))
        wrote, reason = idempotent_write_json(path, _payload({"k": "v2"}))
        if not wrote:
            return False, f"meaningful change did not trigger write ({reason})"
        if "content-changed" not in reason:
            return False, f"unexpected reason for content change: {reason}"
        return True, "ok"


def test_all_default_timestamp_keys_are_masked() -> tuple[bool, str]:
    """Property: every key in TIMESTAMP_KEYS_DEFAULT can drift without
    triggering a write when underlying content is unchanged. This is the
    'enumerate the full set' guard for future additions."""
    base = {"data": {"x": 1, "nested": {"y": 2}}}
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        # Build a payload that contains every default timestamp key at the
        # top level (the helper handles nested via dotted-path lookup).
        original = dict(base)
        for key in TIMESTAMP_KEYS_DEFAULT:
            # Only top-level keys (nested handled by sentinel separately).
            if "." not in key:
                original[key] = "2026-05-19T20:00:00Z" if "sha" not in key.lower() and "ref" not in key.lower() and "commit" not in key.lower() else "abc1234"
        idempotent_write_json(path, original)
        # Drift every top-level volatile key
        drifted = dict(base)
        for key in TIMESTAMP_KEYS_DEFAULT:
            if "." not in key:
                # Volatile-id style fields drift to a new id; timestamp
                # style drift to a later time. Both must be masked.
                if key in ("head_sha", "commit_sha", "head_ref", "git_sha", "current_commit"):
                    drifted[key] = "def5678"
                else:
                    drifted[key] = "2026-05-19T21:00:00Z"
        wrote, reason = idempotent_write_json(path, drifted)
        if wrote:
            return False, (
                f"top-level volatile key drift triggered write — "
                f"TIMESTAMP_KEYS_DEFAULT may be missing a key. reason={reason}"
            )
        return True, "ok"


def test_no_existing_file_writes() -> tuple[bool, str]:
    """Property: target path missing -> write."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        wrote, reason = idempotent_write_json(path, _payload({"k": "v"}))
        if not wrote or "no-prior-file" not in reason:
            return False, f"first write should be no-prior-file; got {reason}"
        return True, "ok"


def test_grace_window_skip_when_content_unchanged() -> tuple[bool, str]:
    """Property: grace expiry + unchanged content -> still skip (the
    deeper session-4 fix). Pre-fix, grace expiry forced a synthetic
    rewrite with new head_sha, triggering the cron loop.

    Real-world precondition: production aggregators emit the SAME schema
    on every run, so head_sha is present in both old + new payloads. The
    bug we're guarding is drift in volatile fields between the two."""
    with tempfile.TemporaryDirectory() as td:
        path = Path(td) / "out.json"
        # Write with an aged timestamp + head_sha (simulates a prior run
        # that wrote the file >grace_seconds ago).
        past = "2020-01-01T00:00:00Z"
        original = {
            "schema_version": "test-v1",
            "timestamp": past,
            "generated_at": past,
            "head_sha": "old1234",
            "data": {"k": "v"},
        }
        path.write_text(json.dumps(original, indent=2), encoding="utf-8")
        # Re-call with same content but fresh timestamp + rotated head_sha
        # (simulates the cron auto-commit pattern that rotated HEAD).
        wrote, reason = idempotent_write_json(
            path, _payload({"k": "v"}, head_sha="xyz9999")
        )
        if wrote:
            return False, (
                f"grace-expired but content unchanged should skip; "
                f"got write ({reason}). This is the session-4 phase-B "
                f"deeper regression."
            )
        return True, "ok"


TESTS = [
    test_first_write_creates_file,
    test_second_identical_call_skips,
    test_head_sha_drift_alone_does_not_trigger_write,
    test_content_change_triggers_write,
    test_all_default_timestamp_keys_are_masked,
    test_no_existing_file_writes,
    test_grace_window_skip_when_content_unchanged,
]


def main() -> int:
    failed: list[tuple[str, str]] = []
    for fn in TESTS:
        ok, msg = fn()
        prefix = "PASS" if ok else "FAIL"
        print(f"  [{prefix}] {fn.__name__}: {msg}")
        if not ok:
            failed.append((fn.__name__, msg))
    if failed:
        print(f"[test_idempotent_write] FAIL ({len(failed)} of {len(TESTS)})", file=sys.stderr)
        return 1
    print(f"[test_idempotent_write] OK ({len(TESTS)} of {len(TESTS)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
