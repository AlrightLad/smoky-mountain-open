#!/usr/bin/env bash
# Hook 7 — Secrets scanner (thin shim).
#
# Pattern-matches credentials / API keys / PEM blocks in any file write.
# Blocks on detection (exit 2) unless the file is a doc (.md / .txt), where
# it warns only.
#
# The actual detection logic lives in lib/scanner.py. The refactor moved it
# out of bash to defeat AgentShield 1.5.0 structural false positives:
#
#   1. var-interpolation rule (bash-only) flagged tool-input variable
#      concatenation even when piped to `grep -qE` (no exec sink).
#   2. PEM-detection regex literal tripped secrets-private-key-material
#      because the rule has no awareness that the literal is a detector
#      predicate, not an embedded credential.
#
# See .claude/state/dashboard-audit-2026-05-18/D31-REFACTOR-LOG.md for the
# full investigation. This shim contains no tool-input variable
# interpolation and no credential literals — it just forwards stdin to the
# Python entrypoint and propagates the exit code.

set -euo pipefail

exec python "$(dirname "$0")/lib/scanner.py" --mode=secrets
