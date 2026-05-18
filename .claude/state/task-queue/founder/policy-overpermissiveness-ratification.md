# Policy overpermissiveness ratification — Founder decision required

**Status:** AWAITING FOUNDER APPROVAL — `Bash(*)` wildcard in `.claude/settings.json` flagged as CRITICAL by AgentShield.

**Created:** 2026-05-18 session 2 (task #3 — 3 of 18 CRITICAL findings).

## The finding

AgentShield baseline flags `.claude/settings.json` permissions section as CRITICAL because it contains wildcard allows like:

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Edit(*)",
      "Write(*)"
    ]
  }
}
```

Wildcards mean any future Bash/Edit/Write call is implicitly approved without per-command Founder consent. This is intentional for active development iteration but represents elevated risk surface that AgentShield's security profile flags.

## What's actually been used (recent commits + ops history)

Sampling the last 100 Bash invocations from this session + recent commits, the actual command surface is:

**Git operations:**
- `git status`, `git log`, `git diff`, `git add`, `git commit`, `git push` (with AMD-018 11-gate)

**Python/Node tooling:**
- `python scripts/*.py`
- `node scripts/visual-audit/*.mjs`
- `npx ecc-agentshield scan`
- `npm run lint`, `npm test`

**File operations:**
- `bash scripts/scaffold-from-templates.sh [--force]`
- `bash scripts/verify-approval-pipeline.sh`
- `ls`, `find`, `wc`, `grep` (read-only)

**Validation:**
- `firebase firestore:indexes`, `firebase --version` (read-only checks)

## Three options for D31 closure (re: this finding)

### Option A — Replace wildcards with specific allow-list
Replace `Bash(*)` with explicit allows like:
```json
{
  "permissions": {
    "allow": [
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(python scripts/*)",
      "Bash(node scripts/*)",
      "Bash(npx ecc-agentshield*)",
      "Bash(npm run lint*)",
      "Bash(npm test*)",
      "Bash(bash scripts/*)",
      "Bash(firebase firestore:indexes*)",
      "Bash(ls*)",
      "Bash(find*)",
      "Bash(wc*)"
    ]
  }
}
```

**Pros:**
- Closes 3 of 18 CRITICAL findings
- Hardens substrate per least-privilege principle
- Forces explicit Founder approval for novel commands (which is what AgentShield's verdict is asking for)

**Cons:**
- Active development will hit new prompts when novel commands surface
- The allow-list needs maintenance as scripts evolve
- May slow autonomous /goal work if novel commands not pre-listed

### Option B — Keep wildcards + document acceptance
Keep `Bash(*)` etc. + add a comment in `.claude/settings.json` (or settings.local.json) documenting the intentional choice. Add this finding to the D31 exception list (Option A of `d31-zero-critical-decision.md`).

**Pros:**
- No workflow disruption
- Honest about choice (PARBAUGHS is single-Founder + agent — multi-user concerns N/A)
- Exception list is a recognized industry pattern (Anthropic's own settings docs allow it)

**Cons:**
- AgentShield count stays at 3 CRITICAL for this finding (closed via exception, not fix)
- Doesn't satisfy a strict-interpretation D31 reader

### Option C — Hybrid (tightened wildcards + exception for remaining)
Tighten the most-permissive wildcards (e.g., narrow `Bash(*)` to `Bash(git*|python scripts/*|node scripts/*|bash scripts/*|npm*|npx*|firebase *|ls*|find*|wc*|grep*|cat*|head*|tail*)`). Keep narrower wildcards for routine ops. Accept residual findings on the exception list.

**Pros:**
- Reduces real risk while preserving workflow
- Captures the 90% case explicitly
- Smaller exception list to maintain

**Cons:**
- Still some CRITICAL findings remaining
- Initial implementation effort to enumerate the right buckets

## Founder recommendation request

**Question:** Which option closes the policy overpermissiveness finding?

- [ ] **A** — Specific allow-list (HARDENS, may slow new work)
- [ ] **B** — Keep wildcards + document on exception list (FASTEST, no workflow change)
- [ ] **C** — Tightened wildcards + smaller exception list (MIDDLE GROUND)
- [ ] **Other** — write your alternative below

### Founder decision

```
FOUNDER-POLICY-DECISION-2026-05-18T??:??:??Z choice=?
notes:
```

## Context on workflow impact

The PARBAUGHS team's autonomous /goal pattern (per Founder operating principle V3 "less friction") relies on agents executing commands without surfacing engineering trade-offs. Option A would surface every new command via permission prompt, breaking the V3 flow until the allow-list is comprehensive.

The Founder approved unlimited budget for the current /goal per P6. Option B is the lowest-friction path that satisfies P8 security disclosure (the choice is documented + intentional, not a hidden risk).

## Related files

- `.claude/settings.json` — primary settings (allow-list lives here)
- `.claude/settings.local.json` — local overrides (also has wildcards in worktree mirrors)
- `.claude/state/task-queue/founder/d31-zero-critical-decision.md` — overall D31 path
- `.claude/state/security/baseline-20260518-190513/agentshield-post-false-positive-suppression.txt` — latest scan
