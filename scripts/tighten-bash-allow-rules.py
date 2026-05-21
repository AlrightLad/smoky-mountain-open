#!/usr/bin/env python3
"""Replace wildcarded Bash(python scripts/*) etc allow rules with concrete
script lists. Per Founder directive 2026-05-21: A+ security posture goal.

What this does:
  - Reads .claude/settings.json
  - For each wildcarded allow rule (Bash(python scripts/*), Bash(node scripts/*), etc.)
    expands to concrete Bash(python scripts/specific-script.py) entries
  - Same for tests/
  - Tightens Bash(curl *) to specific hostnames the codebase actually uses
  - Removes overly permissive Bash(rm -f ...) wildcards

Run via: python scripts/tighten-bash-allow-rules.py
Then verify: npx ecc-agentshield scan
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SETTINGS = ROOT / ".claude" / "settings.json"

# Patterns to remove (wildcards) and what to expand them to.
EXPANSIONS = {
    "Bash(python scripts/*)": ("python", "scripts", [".py"], False),
    "Bash(python3 scripts/*)": ("python3", "scripts", [".py"], False),
    "Bash(python tests/*)": ("python", "tests", [".py"], True),
    "Bash(python .claude/scripts/*)": ("python", ".claude/scripts", [".py"], True),
    "Bash(node scripts/*)": ("node", "scripts", [".js", ".mjs"], False),
    "Bash(node tests/*)": ("node", "tests", [".js"], True),
}

# These broad allows are kept (no good way to tighten without breaking tool use):
KEEP_BROAD = {
    "Bash(python -m*)",      # -m needs module name; locking too restrictive
    "Bash(node -e*)",        # -e takes inline code; locked use cases
    "Bash(npx playwright*)", # playwright subcommands vary
    "Bash(npx ecc-agentshield*)",  # scan subcommands
    "Bash(npm run lint*)",
    "Bash(npm run test*)",
    "Bash(npm run build*)",
    "Bash(npm run smoke*)",
    "Bash(npm run verify*)",
    "Bash(npm run dev*)",
    "Bash(npm run preview*)",
    "Bash(npm run emulator*)",
    "Bash(npm test*)",
    "Bash(npm install*)",
    "Bash(npm uninstall*)",
    "Bash(npm list*)",
    "Bash(npm outdated*)",
    "Bash(npm audit*)",
}

# Tighten curl to specific known-needed hosts.
CURL_TIGHTENED = [
    "Bash(curl -sI https://*)",                              # head requests for any HTTPS
    "Bash(curl -s -o /dev/null https://*)",                  # status-code probes
    "Bash(curl -s https://api.golfcourseapi.com/*)",
    "Bash(curl -s https://*.firebaseio.com/*)",
    "Bash(curl -s https://*.cloudfunctions.net/*)",
    "Bash(curl -s https://*.googleapis.com/*)",
    "Bash(curl -s https://raw.githubusercontent.com/*)",
    "Bash(curl -s https://api.anthropic.com/*)",
    "Bash(curl -s https://sentry.io/*)",
]

# Remove broad rm allows; agents that need to delete proposal files should use
# Edit/Write tooling or a specific named script.
RM_TO_REMOVE = [
    "Bash(rm -f .claude/state/proposals/*)",
    "Bash(rm -f .claude/state/proposals/inbox/*)",
]


def expand_dir(cmd: str, base_dir: str, exts: list[str], recursive: bool) -> list[str]:
    """Walk base_dir + emit Bash(cmd path/to/specific-file) entries."""
    dir_path = ROOT / base_dir
    if not dir_path.exists():
        return []
    out = []
    iterator = dir_path.rglob("*") if recursive else dir_path.glob("*")
    for f in sorted(iterator):
        if not f.is_file():
            continue
        if f.suffix not in exts:
            continue
        rel = f.relative_to(ROOT).as_posix()
        out.append(f"Bash({cmd} {rel})")
    return out


def main() -> int:
    config = json.loads(SETTINGS.read_text(encoding="utf-8"))
    allow = config.setdefault("permissions", {}).setdefault("allow", [])
    deny = config["permissions"].setdefault("deny", [])

    new_allow: list[str] = []
    seen = set()

    for rule in allow:
        if rule in EXPANSIONS:
            cmd, base_dir, exts, recursive = EXPANSIONS[rule]
            expansions = expand_dir(cmd, base_dir, exts, recursive)
            for exp in expansions:
                if exp not in seen:
                    new_allow.append(exp)
                    seen.add(exp)
            continue
        if rule == "Bash(curl *)":
            for tightened in CURL_TIGHTENED:
                if tightened not in seen:
                    new_allow.append(tightened)
                    seen.add(tightened)
            continue
        if rule in RM_TO_REMOVE:
            continue  # drop
        if rule not in seen:
            new_allow.append(rule)
            seen.add(rule)

    config["permissions"]["allow"] = new_allow
    SETTINGS.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print(f"[tighten] Before: {len(allow)} allow rules. After: {len(new_allow)}.")
    print(f"[tighten] Wildcards expanded + curl tightened + broad rm removed.")
    print(f"[tighten] Verify: npx ecc-agentshield scan")
    return 0


if __name__ == "__main__":
    sys.exit(main())
