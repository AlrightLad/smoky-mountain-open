#!/usr/bin/env bash
# gate-bash-edit.sh — PreToolUse Bash matcher that closes the sed -i / awk -i
# inplace / node -e fs-write bypass of gate-protected.sh.
#
# Background (Critique-loop Decision 4, gap #1):
#   The policy allow-list grants `Bash(sed -i *)` so the agent can do
#   text edits in bulk. But sed -i bypasses the gate-protected.sh hook,
#   which only fires on Edit/Write/MultiEdit. An agent could therefore
#   mutate `.env*` / `firestore.rules` / `scripts/.service-account.json`
#   via `sed -i 's/.../.../' .env` and the protected-files hook never
#   gets a say.
#
# This hook closes that hole by pattern-matching the BASH COMMAND STRING
# against:
#   1. `sed -i` / `sed --in-place` targeting a protected path
#   2. `awk -i inplace` targeting a protected path
#   3. `python -c` / `node -e` containing fs.write / open(..,'w') against
#      a protected path
#   4. Redirection (`>`) to a protected path
#   5. tee writing to a protected path
#
# Protected paths (mirrors gate-protected.sh):
#   - .env*
#   - scripts/.service-account.json
#   - firestore.rules
#   - tests/e2e/helpers/assertions.js
#
# Exit code:
#   0 — allowed, continue
#   1 — blocked; reason printed to stderr, Founder must acknowledge to proceed
#
# Bypass: Founder may force via a HANDSHAKE-style workflow (mirrors
# gate-protected.sh). For now, block + print remediation guidance.
#
# Wire-in: registered as a PreToolUse matcher for Bash in .claude/settings.json
# (alongside push-protection.sh, pre-commit-version-sync.sh, pre-commit-lint.sh).

set -e

# Read the tool-use payload (Claude Code sends JSON on stdin per the hooks
# protocol). Fail open on parse error — we don't want a malformed payload
# to silently block legitimate work; emit a warning to stderr instead.
PAYLOAD="$(cat -)"
if [ -z "$PAYLOAD" ]; then
    # No payload — likely synthetic invocation. Exit 0.
    exit 0
fi

# Extract the Bash command. Use Python for robust JSON parsing instead of
# brittle grep/sed (the command may contain newlines, quotes, special chars).
PY=""
for c in \
    "$LOCALAPPDATA/Programs/Python/Python312/python.exe" \
    "$LOCALAPPDATA/Programs/Python/Python311/python.exe" \
    "/usr/bin/python3" \
    "/usr/local/bin/python3"; do
    if [ -x "$c" ] >/dev/null 2>&1 || command -v "$c" >/dev/null 2>&1; then
        PY="$c"; break
    fi
done
if [ -z "$PY" ]; then
    PY=$(command -v python3 2>/dev/null || command -v python 2>/dev/null || echo "python")
fi

CMD="$("$PY" -c "
import json, sys
try:
    p = json.loads(sys.stdin.read())
    print(p.get('tool_input', {}).get('command', ''), end='')
except Exception:
    print('', end='')
" 2>/dev/null <<EOF
$PAYLOAD
EOF
)"

if [ -z "$CMD" ]; then
    # No command in payload (matcher mismatch, partial payload). Allow.
    exit 0
fi

# Protected path patterns. Match against the command string regardless of
# quoting style. Order from most-specific to most-generic.
PROTECTED_PATTERNS=(
    "\\.env"
    "\\.env\\.local"
    "\\.env\\.production"
    "scripts/\\.service-account\\.json"
    "firestore\\.rules"
    "tests/e2e/helpers/assertions\\.js"
    "\\.claude/settings\\.json"
    "\\.claude/settings\\.local\\.json"
)

# Dangerous bash-edit patterns. When ANY of these appear AND the command
# also references a protected path, block.
DANGEROUS_VERBS=(
    "sed -i"
    "sed --in-place"
    "awk -i inplace"
    "python -c"
    "python3 -c"
    "node -e"
    "tee "
    " > "       # output redirection (space-prefixed to avoid false-match in URLs)
    ">> "       # append redirection
)

# Quick exit: only inspect the command if a dangerous verb is present.
HAS_VERB=0
for v in "${DANGEROUS_VERBS[@]}"; do
    if printf '%s' "$CMD" | grep -qF "$v"; then
        HAS_VERB=1
        break
    fi
done

if [ "$HAS_VERB" -eq 0 ]; then
    exit 0
fi

# Inspect for protected-path references.
HIT_PATH=""
for p in "${PROTECTED_PATTERNS[@]}"; do
    if printf '%s' "$CMD" | grep -qE "$p"; then
        HIT_PATH="$p"
        break
    fi
done

if [ -z "$HIT_PATH" ]; then
    # Dangerous verb but no protected-path reference. Allow.
    exit 0
fi

# Block.
cat >&2 <<EOF

[gate-bash-edit] BLOCKED — bash-level edit targeting a protected path

Detected pattern: dangerous bash-edit verb (sed -i / awk -i / node -e / redirection)
                  against protected path matching: $HIT_PATH

Command (truncated): $(printf '%s' "$CMD" | head -c 200)

This hook closes the sed-i bypass of gate-protected.sh per Critique-loop
Decision 4, gap #1. Protected paths:
  - .env / .env.local / .env.production
  - scripts/.service-account.json
  - firestore.rules
  - tests/e2e/helpers/assertions.js
  - .claude/settings.json / .claude/settings.local.json

To proceed, EITHER:
  1. Use the Edit/Write tool — gate-protected.sh will run the Founder
     handshake (preferred path; auditable in tool history).
  2. If a bash-level edit is required for legitimate reasons (one-shot
     migration, etc.), ask Founder to enter HANDSHAKE-{path} into
     task-queue/founder/ and then re-invoke.

EOF
exit 1
