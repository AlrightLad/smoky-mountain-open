#!/usr/bin/env bash
# Hook 5 — Version sync on git commit.
# Ensures APP_VERSION in src/core/utils.js matches version in package.json.
# Listed first in settings.json so it runs before the lint gate (cheaper).

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

cmd="$(parse_payload '.tool_input.command')"
# Matches `git commit` anywhere in a chained command (e.g., `git add &&
# git commit`). The naïve `git commit*` pattern fails on chains.
if ! echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

cd "$(git rev-parse --show-toplevel)"

app_version="$(grep -E 'var APP_VERSION = "[^"]+";' src/core/utils.js | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
pkg_version="$(node -e "console.log(require('./package.json').version)")"
# package-lock.json root version MUST match too — otherwise `npm ci` (the first
# real step of the Heartbeat Cycle GitHub Action) hard-fails on a sync error.
# This drifted silently from 8.23.1 -> 8.24.77 across ~54 ship bumps because
# this hook only checked package.json. Now it's enforced. (v8.24.78)
lock_version="$(node -e "console.log(require('./package-lock.json').version)" 2>/dev/null || echo "MISSING")"

if [[ "$app_version" == "$pkg_version" && "$lock_version" == "$pkg_version" ]]; then
  exit 0
fi

{
  echo ""
  echo "──────────────────────────────────────────────────────────"
  echo "VERSION MISMATCH — commit blocked."
  echo "──────────────────────────────────────────────────────────"
  echo ""
  echo "  src/core/utils.js   APP_VERSION = \"$app_version\""
  echo "  package.json        version     = \"$pkg_version\""
  echo "  package-lock.json   version     = \"$lock_version\""
  echo ""
  echo "All three must match. Fix the lockfile in-place with:"
  echo "  sed -i 's/\"version\": \"$lock_version\"/\"version\": \"$pkg_version\"/g' package-lock.json"
  echo "(the root + packages[\"\"] self-version only), then re-attempt the commit."
} >&2
exit 2
