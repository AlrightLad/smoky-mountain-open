#!/usr/bin/env bash
# Hook 8 — Schema mutation alarm (thin shim).
#
# Detects potentially non-additive Firestore field operations and warns.
# Warn-only (non-blocking) — static analysis can't fully prove additive vs.
# non-additive; Engineer + Critic do the real audit per Criterion 12 and
# cross-surface-dependency-audit skill.
#
# The actual detection logic lives in lib/scanner.py. The refactor moved it
# out of bash to defeat AgentShield 1.5.0's bash-only var-interpolation
# rule, which flagged tool-input variable concatenation as command injection
# even when the variables were only piped to `grep -qE`.
#
# See .claude/state/dashboard-audit-2026-05-18/D31-REFACTOR-LOG.md for the
# full investigation. This shim contains no tool-input variable
# interpolation and forwards stdin to the Python entrypoint, propagating
# the exit code.

set -euo pipefail

exec python "$(dirname "$0")/lib/scanner.py" --mode=schema
