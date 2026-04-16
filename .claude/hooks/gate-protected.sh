#!/usr/bin/env bash
# Hook 4 — Protected file writes.
# Blocks writes to credentials and rules files that require explicit review.

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"
base="${normalized##*/}"

protected=0
case "$base" in
  .env|.env.*) protected=1 ;;
esac
case "$normalized" in
  */scripts/.service-account.json|scripts/.service-account.json) protected=1 ;;
  */firestore.rules|firestore.rules) protected=1 ;;
esac

[[ $protected -eq 0 ]] && exit 0

{
  echo ""
  echo "─────────────────────────────────────────────────────────"
  echo "PROTECTED FILE — write blocked"
  echo "─────────────────────────────────────────────────────────"
  echo ""
  echo "  $file"
  echo ""
  echo "This path holds credentials or deployed security rules."
  echo "Writes require explicit user approval. Ask first, then"
  echo "re-attempt the write."
} >&2
exit 2
