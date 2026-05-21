#!/usr/bin/env python3
"""Pass-2 security tightening — remove remaining wildcards from .claude/settings.json
+ aggressively clean .claude/settings.local.json.

Per Founder directive 2026-05-21: A+ security posture.

Changes:
  - Remove `Bash(python -m*)` (interpreter wildcard)
  - Remove `Bash(node -e*)` (interpreter wildcard)
  - Replace `Bash(curl -sI https://*)` with specific hosts
  - Clean settings.local.json — remove stale historical wildcards
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SETTINGS = ROOT / ".claude" / "settings.json"
LOCAL = ROOT / ".claude" / "settings.local.json"

INTERPRETER_WILDCARDS = {
    "Bash(python -m*)",
    "Bash(node -e*)",
}

# Replace overly-broad curl with specific URLs the codebase uses.
CURL_WILDCARDS_TO_REPLACE = {
    "Bash(curl -sI https://*)": None,           # remove
    "Bash(curl -s -o /dev/null https://*)": None,  # remove
}

# Local-only broad rules to remove (accumulated dev-history dust)
LOCAL_BROAD_TO_REMOVE = {
    "Bash(npm run *)",
    "Bash(npm install *)",
    "Bash(node *)",
    "Bash(git add *)",
    "Bash(git commit *)",
    "Bash(git push *)",
    "Bash(npm uninstall *)",
    "Bash(npm list *)",
    "Bash(git rm *)",
    "Bash(grep *)",
    "Bash(awk *)",
    "Bash(npx vite *)",
    "Bash(gh api *)",
    "Bash(gcloud auth *)",
    "Bash(rm -f .claude/state/proposals/decisions-log.ndjson)",
    "Bash(rm -f .claude/state/proposals/inbox/*)",
    "Bash(curl *)",
}


def main() -> int:
    # ─── settings.json ───
    config = json.loads(SETTINGS.read_text(encoding="utf-8"))
    allow = config.setdefault("permissions", {}).setdefault("allow", [])

    new_allow = []
    removed = 0
    for r in allow:
        if r in INTERPRETER_WILDCARDS or r in CURL_WILDCARDS_TO_REPLACE:
            removed += 1
            continue
        new_allow.append(r)
    config["permissions"]["allow"] = new_allow
    SETTINGS.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    print(f"[pass2] settings.json: removed {removed} wildcards, {len(new_allow)} rules remain")

    # ─── settings.local.json ───
    if LOCAL.exists():
        local_config = json.loads(LOCAL.read_text(encoding="utf-8"))
        local_allow = local_config.setdefault("permissions", {}).setdefault("allow", [])
        new_local_allow = []
        local_removed = 0
        for r in local_allow:
            if r in LOCAL_BROAD_TO_REMOVE:
                local_removed += 1
                continue
            new_local_allow.append(r)
        local_config["permissions"]["allow"] = new_local_allow
        LOCAL.write_text(json.dumps(local_config, indent=2) + "\n", encoding="utf-8")
        print(f"[pass2] settings.local.json: removed {local_removed} broad rules, {len(new_local_allow)} rules remain")
    else:
        print("[pass2] settings.local.json: not present, skipping")

    print("[pass2] Verify: npx ecc-agentshield scan")
    return 0


if __name__ == "__main__":
    sys.exit(main())
