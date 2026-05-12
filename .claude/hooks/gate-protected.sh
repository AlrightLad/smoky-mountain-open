#!/usr/bin/env bash
# Hook 4 — Protected file writes (extended Phase 1 — Critical Path Blocker).
# Blocks writes to credentials, rules files, payments/, auth/, and
# scripts/create-smoke-account.js. Phase 1 extension per PHASE_1_FOUNDER_REVIEW.md Q4.
#
# Pre-Phase-1 coverage:
#   .env*, scripts/.service-account.json, firestore.rules
# Phase 1 additions (per ENGINEER.md protected-paths list):
#   payments/, auth/, scripts/create-smoke-account.js

set -euo pipefail

source "$(dirname "$0")/lib/parse-payload.sh"

file="$(parse_payload '.tool_input.file_path')"
[[ -z "$file" ]] && exit 0

normalized="${file//\\//}"
base="${normalized##*/}"

protected=0
case "$base" in
  .env|.env.*) protected=1 ;;
  create-smoke-account.js)
    case "$normalized" in
      */scripts/create-smoke-account.js|scripts/create-smoke-account.js) protected=1 ;;
    esac
    ;;
esac
case "$normalized" in
  */scripts/.service-account.json|scripts/.service-account.json) protected=1 ;;
  */firestore.rules|firestore.rules) protected=1 ;;
  */payments/*|payments/*) protected=1 ;;
  */auth/*|auth/*) protected=1 ;;
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
