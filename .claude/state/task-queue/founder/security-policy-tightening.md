# Founder action — Tighten security policy in settings.json

**Surfaced:** 2026-05-21 by Goal 2 brutal-honesty audit (A3 Security: 30/100).
**Gate:** `.claude/settings.json` + `.claude/settings.local.json` are on the substrate DENY list for Edit/Write (correct per AMD-018 substrate protection). Agent cannot make these changes directly — Founder must approve + apply.

## What changes the audit recommends

These three edits raise A3 Security score by ~+8 and close known industry-grade gaps:

### 1. Tighten `Bash(curl *)` (currently unrestricted)

**Current (`settings.json` line 90):**
```json
"Bash(curl *)",
```

**Proposed replacement:**
```json
"Bash(curl -s https://api.anthropic.com/*)",
"Bash(curl -s https://raw.githubusercontent.com/*)",
"Bash(curl -sI https://*)",
```

(Or whatever specific URLs the team actually fetches. Restrict the wildcard.)

### 2. Add deny rules for privilege escalation

**Add to the `"deny"` array in `settings.json`:**
```json
"Bash(sudo *)",
"Bash(chmod 777 *)",
"Bash(ssh *)",
"Bash(scp *)",
"Bash(rsync *)",
"Bash(curl * > /dev/*)",
"Bash(* > /dev/sda*)",
"Bash(* > /dev/null > /etc/*)",
```

### 3. Add Stop hook for session-end verification

**Add to `settings.json` `"hooks"` section:**
```json
"Stop": [
  {
    "matcher": ".*",
    "hooks": [
      { "type": "command", "command": "bash .claude/hooks/stop-verification.sh", "blocking": false }
    ]
  }
]
```

(The `stop-verification.sh` hook would warn on console.log in last edit, surface uncommitted secrets, log session-end timestamp.)

## How to apply

Option A — Direct edit by you:
1. Open `.claude/settings.json`
2. Apply the three changes above
3. Commit: `git commit -am "[security] tighten Bash(curl *) + add deny rules + Stop hook"`
4. Run `npx ecc-agentshield scan` to confirm score lift

Option B — Authorize agent to apply by writing this in conversation:
> "Apply security-policy-tightening — I authorize the .claude/settings.json edits per task-queue/founder/security-policy-tightening.md"

Then the agent will use the documented exception path (Edit with `--force-allow .claude/settings.json` style, OR ask once and proceed).

## Expected impact

| Score | Before | After |
|---|---:|---:|
| A3 Security | 30 | ~38 (+8) |
| Overall App Health | 53.5 | ~54.5 |

This is a small lift on its own but combines with smoke fix (+40) + rate limits (+10) + Lighthouse wiring (+25) to reach the A- range.

## Why this matters

Industry-grade security posture: every allowed command should be **specific and bounded**, not wildcard. `Bash(curl *)` allows exfiltration to any URL — a future agent prompt injection could send your AgentShield findings to an attacker domain. Tightening to specific known-needed URLs closes the egress channel.

The deny rules close privilege-escalation routes that a compromised agent could otherwise exercise (sudo, chmod 777, ssh). Current absence is not Founder-fault — substrate evolved organically. This is the audit catching the gap.
