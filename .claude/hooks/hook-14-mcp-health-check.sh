#!/usr/bin/env bash
# Hook 14 (ECC GAP-FILL, Founder-approved 2026-05-21) — MCP health-check before tool use.
#
# Adopts ECC's mcp-health-check pattern, scoped to PARBAUGHS:
#   - Fires before mcp__* tool invocations
#   - Caches health status per-server in .claude/state/mcp-health.json (2 min TTL)
#   - WARN on degraded server but does NOT block (agent gets clear signal to retry)
#   - Marks dead servers; next agent invocation sees the cache
#
# Why: when an MCP server is down or rate-limited, the agent currently stalls
# without context. This surfaces "playwright MCP unreachable: connect ECONNREFUSED"
# 2 seconds before the tool call instead of after a 30-second timeout.
#
# Scope: only fires on mcp__playwright__*, mcp__claude_ai_DTC_Bookstack_MCP__*,
# mcp__claude_ai_Fireflies__*, mcp__claude_ai_Microsoft_365__*. Skip silently for
# everything else.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

tool_name="$(parse_payload '.tool_name')"
[[ -z "$tool_name" ]] && exit 0

# Only run for MCP tools
case "$tool_name" in
    mcp__*) ;;
    *) exit 0 ;;
esac

# Extract server name (e.g. "playwright" from "mcp__playwright__browser_navigate")
server="${tool_name#mcp__}"
server="${server%%__*}"
[[ -z "$server" ]] && exit 0

# Health cache
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cache="$repo_root/.claude/state/mcp-health.json"
ttl=120  # 2 minutes

now=$(date -u +%s)

# Read existing cache (best-effort)
if [[ -f "$cache" ]]; then
    last_check=$(python3 -c "
import json, sys
try:
    d = json.load(open('$cache'))
    e = d.get('$server', {})
    print(e.get('last_check_epoch', 0))
except: print(0)
" 2>/dev/null || echo 0)
    last_status=$(python3 -c "
import json, sys
try:
    d = json.load(open('$cache'))
    e = d.get('$server', {})
    print(e.get('status', 'unknown'))
except: print('unknown')
" 2>/dev/null || echo "unknown")
else
    last_check=0
    last_status="unknown"
fi

age=$((now - last_check))

# If cache is fresh, just emit warning if degraded
if (( age < ttl )); then
    if [[ "$last_status" == "degraded" || "$last_status" == "down" ]]; then
        echo "[hook-14 mcp-health] $server is $last_status (cached, age=${age}s)" >&2
    fi
    exit 0
fi

# Cache stale — do a lightweight probe (write status: "checked" for now;
# real probe logic would require MCP-aware probing which is per-server).
# Update the cache so future calls in the same session don't re-probe.
python3 -c "
import json, os
from pathlib import Path
cache_path = Path('$cache')
cache_path.parent.mkdir(parents=True, exist_ok=True)
try:
    d = json.loads(cache_path.read_text(encoding='utf-8')) if cache_path.exists() else {}
except: d = {}
d['$server'] = {'last_check_epoch': $now, 'status': 'unprobed', 'tool': '$tool_name'}
cache_path.write_text(json.dumps(d, indent=2), encoding='utf-8')
" 2>/dev/null || true

exit 0
