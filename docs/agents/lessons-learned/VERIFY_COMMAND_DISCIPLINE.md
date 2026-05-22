# VERIFY COMMAND DISCIPLINE

> Authored 2026-05-22 per PROP-011. Codifies the convention: every
> verifier must validate the FORMAT of the value, not just its
> presence by KEY.

## The rule

Every verify command — surfaced in a Founder walkthrough, in a
`task-queue/founder/*.md` frontmatter `verify_command`, or in a
`scripts/verify-*.*` script — MUST validate the SHAPE of the value
against a known regex, not just check that the key is present.

## Why the convention exists

Two production incidents in 2026-05 had the same root cause: a verifier
checked key-presence, passed, and the value at that key was malformed
in a way the consumer rejected at runtime.

### Incident 1 (2026-05-21) — `.env.staging` placeholder

The earlier verify command for `staging-firebase-project` checked that
`.env.staging` existed and contained the string `parbaughs-staging`.
It passed when the file had literal `<paste-value-here>` placeholders.
The next session's Firebase command failed with cryptic auth errors.

### Incident 2 (2026-05-22) — Sentry DSN loader-URL

The verify command for `sentry-signup` was:

```powershell
Select-String -Path .env.staging -Pattern 'SENTRY_DSN'
```

Founder pasted Sentry's Loader Script URL (`https://js.sentry-cdn.com/...min.js`)
instead of the SDK DSN. The verifier passed (key present, value
non-empty). `@sentry/browser` runtime silently no-op'd in production
because the loader URL doesn't match the SDK DSN shape.

Same failure class twice, one month apart. PROP-011 codified the
convention. This document operationalizes it.

## What "FORMAT-validating" means

For every secret type, define a regex that captures the SHAPE the
runtime requires:

| Value type | Expected shape (regex) |
|---|---|
| Sentry SDK DSN | `^https://[a-f0-9]+@o[0-9]+\.ingest\.(us\|de\|eu)\.sentry\.io/[0-9]+$` |
| Sentry auth token | `^sntr[a-z]{1,2}_[A-Za-z0-9+/=._-]{40,}$` |
| Firebase Web API key | `^AIza[A-Za-z0-9_-]{35}$` |
| GitHub PAT (classic) | `^ghp_[A-Za-z0-9]{36}$` |
| GitHub PAT (fine-grained) | `^github_pat_[A-Za-z0-9_]{82,}$` |
| GitHub OAuth token | `^gho_[A-Za-z0-9]{36}$` |
| Slack webhook | `^https://hooks\.slack\.com/services/[A-Z0-9]+/[A-Z0-9]+/[A-Za-z0-9]+$` |
| Bearer-shape (broad fallback) | `^[A-Za-z0-9_\-\.+/=]{32,}$` |
| HTTPS URL with TLS | `^https://[a-zA-Z0-9.\-]+(/.*)?$` |
| UUID v4 | `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` |

If the expected shape is genuinely unknowable (free-form text), the
verifier MAY fall back to a non-empty check, but MUST log "format
unverifiable, falling back to non-empty" so a future reader knows the
verifier is permissive on purpose.

## Two-tier verifier pattern

The PARBAUGHS Founder Checklist has two tiers of verifier:

### Tier 1: walkthrough document (Founder reads + runs manually)

In `docs/walkthroughs/*.md`, the "Verify" step is a PowerShell snippet
the Founder sees and runs to gain confidence the paste worked. It
should:

1. Read the env value via `Select-String -Path .env -Pattern '^KEY=(.+)$' | Select-Object -First 1`
2. Match the captured group against the expected regex
3. Print PASS in green or FAIL with the actual value in red
4. Tell the Founder what the expected shape is so they can fix paste errors

Example (Sentry DSN):

```powershell
$line = Select-String -Path .env -Pattern '^SENTRY_DSN=(.+)$' | Select-Object -First 1
if (-not $line) { Write-Host "FAIL: SENTRY_DSN not in .env" -ForegroundColor Red }
else {
    $value = $line.Matches[0].Groups[1].Value
    if ($value -match '^https://[a-f0-9]+@o[0-9]+\.ingest\.(us|de|eu)\.sentry\.io/[0-9]+$') {
        Write-Host "PASS: DSN format matches @sentry/browser SDK shape" -ForegroundColor Green
    } else {
        Write-Host "FAIL: DSN format mismatch. Got: $value" -ForegroundColor Red
        Write-Host "Expected: https://<32-hex>@o<digits>.ingest.us.sentry.io/<digits>" -ForegroundColor Yellow
    }
}
```

### Tier 2: machine verifier (Founder-mark-complete runs)

In `.claude/state/task-queue/founder/<slug>.md` frontmatter:

```yaml
verify_command: "node scripts/verify-<key>.mjs"
verify_expected: "PASS"
```

The `verify_command` MUST start with an allowlisted prefix per
`scripts/founder-mark-complete.ps1`:
`if`, `Test-Path`, `Select-String`, `Get-Content`, `Get-ChildItem`,
`firebase`, `git`, `npm`, `node`, `python`, `gh`.

PowerShell one-liners that start with `$variable = ...` are REFUSED by
the allowlist. Use `node scripts/verify-<key>.mjs` and put the logic
in the script. The script prints exactly `PASS` or `FAIL` (no other
output) — the mark-complete script matches against `verify_expected`.

Canonical examples:
- `scripts/verify-sentry-auth-token.mjs`
- `scripts/verify-sentry-dsn.mjs`

Both ship one-job pattern: read .env, regex against expected shape,
print PASS or FAIL.

## Apply-time scan

For every existing walkthrough authored before 2026-05-22, scan for
`Select-String.*Pattern '<KEY>'` or `grep '^<KEY>='` without a
companion FORMAT assertion in the next 10 lines. Each match is a
PROP-011 violation. Amend the walkthrough + add a `scripts/verify-<key>.mjs`
+ point the `verify_command` at it.

The round-trip test (Tier 3 sentinel) can include a `[verify-discipline]`
block that warns when a walkthrough has key-only assertion. Soft
warning (not block) because some verifiers legitimately can't
FORMAT-check (free-form text, dynamic values).

## What this convention is NOT

- **Not a substitute for the actual end-to-end test.** A FORMAT-valid
  value can still fail at runtime (wrong project, expired key, network
  unreachable). The verifier proves the SHAPE is right. The runtime
  probe proves the SERVICE accepts it. Both are required for evidence-
  supported "it works" claim.

- **Not for substrate-internal state.** Pre-existing aggregator output,
  schema versions, etc. don't need FORMAT-validation because they're
  not user-paste targets. The convention applies to **values pasted by
  Founder** and **values consumed by external services**.

## Cross-references

- PROP-011: `.claude/state/proposals/shipped/PROP-011-verify-command-format-validation.md`
- Canonical verifiers: `scripts/verify-sentry-auth-token.mjs`, `scripts/verify-sentry-dsn.mjs`
- Founder-mark-complete: `scripts/founder-mark-complete.ps1`
- Allowlist: defined in mark-complete.ps1; update both this doc + the
  script in lockstep
- Memory rules:
  - `feedback-no-guessing` — evidence-supported on both ends
  - `feedback-verify-after-change` — verify the surface that consumes
  - PROP-011 itself: codified the rule
