#!/usr/bin/env bash
# Stop hook — CONDITIONAL autonomous continuation (PARBAUGHS anti-stop revamp,
# 2026-06-12, replacing the unconditional CronCreate re-kick). Blocks the
# turn-end ONLY in explicit unattended marathon mode while actionable backlog
# remains, so the agent keeps working without the Founder having to re-poke it.
#
# DESIGN (all four gates must hold to block; any miss → allow, i.e. fail-open):
#   1. FAIL-OPEN — any error/uncertainty exits 0 (allow). A bug can never trap.
#   2. STOP override — .claude/state/loops/STOP present → allow (Founder/agent
#      hard stop). Always wins.
#   3. Marathon gate — .claude/state/loops/CONTINUE present? If absent the hook
#      is INERT (interactive sessions stop normally; no surprise trapping). The
#      agent creates CONTINUE only when entering an unattended autonomous run.
#   4. Backlog gate — .claude/state/loops/BACKLOG.md has >=1 open "- [ ]" item?
#      If empty/absent → allow ("no backlog, no need to prompt" — Founder, 6/12).
#   5. Circuit breaker — if HEAD hasn't moved (no new commit) for >CB_LIMIT
#      consecutive blocks, allow + log (prevents a stuck no-progress loop).
#
# Block emits {"decision":"block","reason":"..."} on stdout, exit 0.
# Toggle off: create .claude/state/loops/STOP, or remove CONTINUE, or
# (Founder voice) is honored by the agent removing CONTINUE.
set +e

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
LOOPS="$ROOT/.claude/state/loops"
STOP="$LOOPS/STOP"
CONTINUE="$LOOPS/CONTINUE"
BACKLOG="$LOOPS/BACKLOG.md"
CBSTATE="$LOOPS/.cb-state"
CB_LIMIT=30

# Drain stdin (Stop hook payload — not required for this logic).
cat >/dev/null 2>&1

# Gate 2 — hard stop override.
[ -f "$STOP" ] && exit 0
# Gate 3 — inert unless explicit marathon mode.
[ -f "$CONTINUE" ] || exit 0
# Gate 4 — only block while the backlog has open items.
[ -f "$BACKLOG" ] || exit 0
OPEN=$(grep -cE '^[[:space:]]*-[[:space:]]*\[ \]' "$BACKLOG" 2>/dev/null)
[ -n "$OPEN" ] || OPEN=0
[ "$OPEN" -gt 0 ] 2>/dev/null || exit 0

# Gate 5 — progress-based circuit breaker. Reset the no-progress counter when
# HEAD advances (a commit = real progress); trip when stalled CB_LIMIT turns.
HEAD="$(git rev-parse --short HEAD 2>/dev/null || echo none)"
PREV_HEAD=""; COUNT=0
if [ -f "$CBSTATE" ]; then
  PREV_HEAD="$(sed -n '1p' "$CBSTATE" 2>/dev/null)"
  COUNT="$(sed -n '2p' "$CBSTATE" 2>/dev/null)"
  [ -n "$COUNT" ] || COUNT=0
fi
if [ "$HEAD" != "$PREV_HEAD" ]; then COUNT=0; else COUNT=$((COUNT + 1)); fi
printf '%s\n%s\n' "$HEAD" "$COUNT" > "$CBSTATE" 2>/dev/null
if [ "$COUNT" -ge "$CB_LIMIT" ] 2>/dev/null; then
  echo "[stop-continue] circuit breaker: no new commit in $COUNT turns — allowing stop" >> "$LOOPS/cb.log" 2>/dev/null
  exit 0
fi

# Block — keep working. List up to 5 open items as the actionable reason.
ITEMS=$(grep -E '^[[:space:]]*-[[:space:]]*\[ \]' "$BACKLOG" 2>/dev/null | head -5 | sed 's/^[[:space:]]*-[[:space:]]*\[ \][[:space:]]*//' | sed "s/\"/'/g" | tr '\n' '|')
printf '{"decision":"block","reason":"Marathon mode: %s open backlog item(s) in .claude/state/loops/BACKLOG.md remain — pick the top one and execute it END-TO-END (edit -> node --check -> build -> version-trio bump -> commit -> push main -> push-staging -> staging hosting deploy -> regen), then immediately start the next. A status report, or a PROMISE to continue, is NOT a turn end. Open: %s. When the backlog is truly clear, mark items [x]; remove CONTINUE or drop a STOP file to stop."}' "$OPEN" "$ITEMS"
exit 0
