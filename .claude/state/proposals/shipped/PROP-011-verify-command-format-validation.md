---
{
  "id": "PROP-011",
  "title": "Verify-command convention — validate FORMAT, not just KEY PRESENCE",
  "lane": 1,
  "lane_label": "Substrate Discipline",
  "ship_target": "Substrate",
  "created_at": "2026-05-22T16:30:00Z",
  "rationale": "Phase 1b Sentry DSN verification (Founder Checklist 2026-05-21) passed the agent's verify-command (Select-String -Pattern 'SENTRY_DSN' found a matching line in .env + .env.staging) but the actual value was a Sentry Loader Script URL (https://js.sentry-cdn.com/...) instead of the SDK DSN required by @sentry/browser. The runtime would have silently no-op'd at production. Same failure class as the prior .env.staging placeholder bug — a verifier that checks 'is the key present?' instead of 'is the value shaped like a real value?' produces false-greens. Convention amendment required: every walkthrough verify-command + every script that confirms an environment value MUST validate FORMAT via regex match against an expected pattern, not just KEY PRESENCE.",
  "scope": "Three deliverables: (1) Amend docs/walkthroughs/*.md verify-command pattern: replace 'check the key exists' with 'check the value matches an expected regex' across all walkthroughs that surface a Founder-paste step. (2) Update scripts/verify-*.* + any verifier script that reads .env values to assert FORMAT via regex; print BOTH the matched-key result AND the regex-match result; fail if either fails. (3) Codify the convention in docs/agents/lessons-learned/VERIFY_COMMAND_DISCIPLINE.md (or peer governance-exempt doc) — verifier MUST express the expected shape, not just the expected name.",
  "estimate": {
    "cost_tokens": 4500,
    "duration_minutes": 15,
    "risk": "low"
  },
  "cost_tokens": {
    "low": 3500,
    "high": 6000,
    "methodology": "Empirical: ~3 walkthroughs need verify-command updates (~500 tokens each); 2 verifier scripts amended (~750 tokens each); lessons-learned doc authored fresh (~1500 tokens). Range covers walkthrough-discovery delta if additional verify-commands surface during apply."
  },
  "files_affected": [
    "docs/walkthroughs/sentry-signup.md — verify-command at line ~80 + ~108 (Select-String pattern → regex match on full DSN shape)",
    "docs/walkthroughs/*.md — any other walkthrough with a Founder-paste step (scan at apply-time)",
    "scripts/verify-*.* — wherever a .env / .env.staging value is checked",
    "docs/agents/lessons-learned/VERIFY_COMMAND_DISCIPLINE.md (new, governance-exempt sister doc)",
    ".claude/state/lessons-learned/engineering-mindset.md — verify-discipline addendum",
    ".claude/state/proposals/pending/PROP-011-verify-command-format-validation.md (this file)"
  ],
  "fallback_plan": "Plan A: ship convention doc + amend all surfaced walkthroughs + amend all verify-* scripts in one bundle. Plan B: ship convention doc only; apply walkthrough + script amendments incrementally as touched. Plan C: hand-roll a single re-usable PowerShell verify-env-value helper that takes (path, key, regex) and use it everywhere. Abandon: only viable if a stronger contract (e.g., secret-manager API with typed accessors) lands first — premature.",
  "rollback_strategy": "git revert. Convention amendment is additive — without it, verifiers continue producing false-greens on shape-wrong values. With it, the next .env paste with a placeholder or wrong-format secret is caught at verify time instead of at runtime.",
  "round_trip_coverage": "Optional [verify-discipline] round-trip block at apply-time: scan docs/walkthroughs/*.md for any 'Pattern' / 'grep' / 'Select-String' that asserts KEY PRESENCE without an accompanying FORMAT assertion in the next 10 lines. Surfaces as soft warning (not block) — author chose key-only deliberately is allowed but should be rare.",
  "depends_on": [],
  "authored_by": "claude-code",
  "bubble_of_record": null,
  "estimate_tokens_to_apply": 1800,
  "status": "shipped",
  "operating_status": "Convention operative immediately for any new walkthrough or verifier authored this session. Past walkthroughs amended at apply-time.",
  "shipped_at": "2026-05-22T17:41:12Z",
  "shipped_in_commit": "32864a35",
  "shipped_note": "Shipped 2026-05-22 (commit 32864a35) — codified verify-FORMAT discipline via docs/agents/lessons-learned/VERIFY_COMMAND_DISCIPLINE.md + canonical verifiers scripts/verify-sentry-{auth-token,dsn}.mjs. shipped_at/shipped_in_commit fields added 2026-05-22 to satisfy round-trip immutability contract § 3 rule 5 (PROPOSAL_LIFECYCLE_v8.2) — same backfill pattern as PROP-006 + PROP-010."
}
---

# PROP-011 — Verify-command convention: validate FORMAT, not just KEY PRESENCE

Authored 2026-05-22 per Founder directive after Phase 1b Sentry DSN
verification produced a false-green.

## Why this proposal

The .env.staging placeholder bug + the Sentry-DSN loader-URL bug are the
same failure class twice. In both cases the verify command checked
"is the key present?" instead of "is the value shaped like a real
value?" — and both times the agent reported PASS while the value was
unusable at runtime.

Founder named it explicitly:

> "Verification scripts must validate FORMAT not just KEY PRESENCE
> (regex match on expected pattern). Same class as .env.staging
> placeholder bug."

The Sentry case is canonical:

- **Walkthrough verify-command** (docs/walkthroughs/sentry-signup.md
  line 108):
  ```powershell
  Select-String -Path .env.staging -Pattern 'SENTRY_DSN'
  ```
- **What the Founder pasted** (correct from Sentry UI's "Loader
  Script" tab, wrong for SDK usage):
  ```
  SENTRY_DSN=https://js.sentry-cdn.com/4511434123116544.min.js
  ```
- **Verifier result:** PASS (key present, value non-empty)
- **Runtime result:** Sentry.init silently no-op'd; no events
  reached the dashboard until the agent later regex-checked the
  shape and surfaced the format mismatch as task-queue/founder/
  sentry-dsn-fix.md.

The verifier did its literal job (check the key exists). The
verifier did NOT do its outcome (confirm Sentry will work at
runtime). Same outcome-vs-task gap that PROP-006 codified for
authoring decisions — applied to verification.

## The convention (formalized)

Every verify command surfaced to the Founder or run by the agent on
behalf of the Founder MUST express the expected SHAPE of the value,
not just its NAME.

### Bad (current pattern — false-green prone)

```powershell
# Walkthrough verify-command
Select-String -Path .env -Pattern 'SENTRY_DSN'
# Expected output: line containing 'SENTRY_DSN='  → verification passes
```

```bash
# Script verifier
grep -q '^SENTRY_DSN=' .env && echo PASS || echo FAIL
```

Both pass on `SENTRY_DSN=`, `SENTRY_DSN=<paste-here>`,
`SENTRY_DSN=https://js.sentry-cdn.com/...` (loader URL), and the
real DSN. Three of four are wrong; verifier can't tell.

### Good (target pattern — format-validated)

```powershell
# Walkthrough verify-command (regex match on expected SDK DSN shape)
$line = Select-String -Path .env -Pattern '^SENTRY_DSN=(.+)$' |
  Select-Object -First 1
$value = $line.Matches[0].Groups[1].Value
$ok = $value -match '^https://[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io/[0-9]+$'
if ($ok) { Write-Host "PASS: DSN format matches @sentry/browser SDK shape" }
else { Write-Host "FAIL: DSN format mismatch. Got: $value" -ForegroundColor Red }
```

```bash
# Script verifier
VAL=$(grep -E '^SENTRY_DSN=' .env | head -1 | cut -d= -f2-)
if echo "$VAL" | grep -qE '^https://[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io/[0-9]+$'; then
  echo "PASS: DSN format matches SDK shape"
else
  echo "FAIL: DSN format mismatch. Got: $VAL"
  exit 1
fi
```

The format-validating version catches all three error cases above
(empty, placeholder, loader URL) at verify time. No surprise at
runtime.

## When the convention applies

Every value-paste step in a Founder walkthrough or every verifier
script that confirms an environment value MUST include a FORMAT
assertion when the expected shape is knowable. The shape may be:

| Value type | Expected shape (example regex) |
|---|---|
| Sentry SDK DSN | `^https://[a-f0-9]+@o[0-9]+\.ingest\.(us\|de\|eu)\.sentry\.io/[0-9]+$` |
| Firebase API key | `^AIza[A-Za-z0-9_-]{35}$` |
| GitHub PAT | `^ghp_[A-Za-z0-9]{36}$` (classic) or `^github_pat_[A-Za-z0-9_]{82,}$` (fine-grained) |
| GolfCourseAPI key | (UUID-ish — verify against the actual format vendor publishes) |
| Bearer-style token | `^[A-Za-z0-9_\-]{32,}$` (broad shape) |
| URL with TLS | `^https://[a-zA-Z0-9.\-]+(/.*)?$` |

If the expected shape is genuinely unknowable (e.g., a free-form
description), the verifier MAY fall back to a non-empty check, but
MUST log "format unverifiable, falling back to non-empty" so a
future reader knows the verifier is permissive on purpose.

## Why a substrate-discipline proposal (not a one-off fix)

The Sentry case is the second occurrence of the pattern this month.
Fixing only the Sentry walkthrough doesn't prevent the next one
(GolfCourseAPI rotation, GitHub PAT for sourcemap upload, etc.).
The proposal converts a one-off lesson into a permanent operating
rule:

- **Operating now:** any verify-command authored this session
  includes format validation by default.
- **Apply phase:** retro-amend all docs/walkthroughs/*.md verify
  steps + scripts/verify-*.* + sentry-auth-token.md walkthrough
  (when authored) to match the convention.

## Convention's relationship to other substrate

| Layer | What it owns | What this convention adds |
|---|---|---|
| AMD-018 #6 (secrets gate) | Blocks unauthorized edits to .env* | Doesn't validate format of pasted values |
| Hook 4 gate-protected.sh | Blocks file-level edits to .env* | Doesn't read or validate values |
| AgentShield secret scan | Catches LEAKED secrets in tracked files | Doesn't catch SHAPE-wrong secrets in env files |
| AMD-026 P10 actionable surfacing | Errors must show what/where/what-action | This convention is the verifier's contribution to P10 — a shape-wrong value gets surfaced with WHAT (format mismatch), WHERE (file path + key), WHAT-ACTION (paste the value matching pattern X) |
| PROP-006 outcome-vs-task skill | Authoring discipline (>=3 approaches, check disk first) | This convention is the verification analogue: "did I verify the OUTCOME or just the literal task?" |

The convention is verify-time analogue of authoring-time discipline:
both prevent doing-mode (literal-task-check) from masking
engineering-mode (outcome-check).

## Apply-time order

1. Author `docs/agents/lessons-learned/VERIFY_COMMAND_DISCIPLINE.md`
   codifying the convention with worked examples + regex table.
2. Amend `docs/walkthroughs/sentry-signup.md` lines 80 + 108 (the
   verify-command + the "When you click Mark complete" verify
   surface) to use format-validation pattern.
3. Scan `docs/walkthroughs/*.md` for other `Pattern '<key>'` /
   `grep '^<key>='` verify-commands; amend each in place.
4. Amend `scripts/verify-*.*` to add format assertion alongside
   existing key-presence check; print both results explicitly.
5. Add `[verify-discipline]` block to `tests/round-trip-test.py` as
   soft warning when a walkthrough surfaces a key-only Select-String
   pattern without an accompanying format assertion in the next 10
   lines.

## Estimated impact

- Catches the SAME class of false-green that produced 1 hour of
  Phase 1b debugging this session.
- Cost: ~15 minutes apply-time + ~1800 tokens (per
  estimate_tokens_to_apply above).
- Risk: low. Convention is additive — any verifier that ALSO
  checks format is strictly more rigorous than one that only
  checks presence. No false-fails expected because regex is
  authored against the published format of each secret type.

## Founder-attestation requirement

Per the recursion-breaker, the agent does NOT self-mark this
convention as applied. PROP-011 closes when:

1. The lessons-learned doc lands and is committed.
2. The sentry-signup walkthrough is amended (the canonical case).
3. The next Founder-paste verify cycle (e.g., Sentry auth token,
   PROP-011-apply-phase) uses the format-validated pattern AND the
   Founder verifies that pattern in the walkthrough before
   pasting.

Without the third condition, the team would be self-marking — same
class of failure this very proposal exists to prevent.
