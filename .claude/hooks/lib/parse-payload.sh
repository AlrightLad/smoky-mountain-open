#!/usr/bin/env bash
# parse-payload.sh — Claude Code hook input helper.
#
# Sourcing this file reads the hook's stdin JSON payload into $PAYLOAD
# and exposes parse_payload <jq-style-path> for field extraction.
# Uses Node for JSON parsing because jq isn't available on all dev boxes.
#
# Usage:
#   source "$(dirname "$0")/lib/parse-payload.sh"
#   file_path="$(parse_payload '.tool_input.file_path')"
#   cmd="$(parse_payload '.tool_input.command')"

PAYLOAD="$(cat)"

parse_payload() {
  local path="$1"
  printf '%s' "$PAYLOAD" | node -e "$(cat <<'NODE'
let d = '';
process.stdin.on('data', c => d += c);
process.stdin.on('end', () => {
  try {
    const obj = JSON.parse(d);
    const parts = process.argv[1].replace(/^\./, '').split('.');
    let v = obj;
    for (const k of parts) v = v && v[k];
    if (v !== undefined && v !== null) process.stdout.write(String(v));
  } catch (e) {
    // Silent on malformed payload — the hook script will see an empty
    // string and can decide whether that's actionable.
  }
});
NODE
)" "$path"
}
