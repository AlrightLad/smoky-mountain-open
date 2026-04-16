#!/usr/bin/env bash
# Hook 5 — Version sync on git commit.
# Ensures APP_VERSION in src/core/utils.js matches version in package.json.
# Listed first in settings.json so it runs before the lint gate (cheaper).

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

cmd="$(parse_payload '.tool_input.command')"
case "$cmd" in
  "git commit"*) ;;
  *) exit 0 ;;
esac

cd "$(git rev-parse --show-toplevel)"

app_version="$(grep -E 'var APP_VERSION = "[^"]+";' src/core/utils.js | head -1 | sed -E 's/.*"([^"]+)".*/\1/')"
pkg_version="$(node -e "console.log(require('./package.json').version)")"

if [[ "$app_version" == "$pkg_version" ]]; then
  exit 0
fi

{
  echo ""
  echo "──────────────────────────────────────────────────────────"
  echo "VERSION MISMATCH — commit blocked."
  echo "──────────────────────────────────────────────────────────"
  echo ""
  echo "  src/core/utils.js  APP_VERSION = \"$app_version\""
  echo "  package.json       version     = \"$pkg_version\""
  echo ""
  echo "Update both to the same value, then re-attempt the commit."
} >&2
exit 2
