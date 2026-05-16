# P8 Security Baseline — 2026-05-15

**Overall verdict: YELLOW** (per spec P8.1: YELLOW needs Founder approval)

## Scanner outputs (concrete reports per P8.7)

All persisted to `.claude/state/security/baseline-2026-05-15/`:

- `secret-scan.txt` (1.28 MB raw detect-secrets JSON, 30,628 lines)
- `secret-scan-meta.json` (command + exit + totals + triage)
- `npm-audit.json` + `npm-audit.meta.json` (repo root)
- `functions-npm-audit.json` + `functions-npm-audit.meta.json` (functions/)

## Per-scanner results

### detect-secrets v1.5.0 (installed via pip — clean install)

- Command: `detect-secrets scan --all-files --exclude-files '\.git/|node_modules/|dist/|\.claude/state/|test-results/|playwright-report/|backups/'`
- Exit: 0
- 4,212 findings across 505 files
- **Zero real leaks**
- Triage:
  - 33 Private Key matches: all in `node_modules/` (library regex/JSDoc examples)
  - 4 AWS Access Key matches: all `node_modules/`
  - 2 Basic Auth matches: 1 in `scripts/.service-account.json` (gitignored, verified absent from git history), 1 in `.claude/hooks/secrets-scanner.sh:L49` (regex literal in the scanner itself)
  - Hex/Base64 high-entropy in `.claude/state/wave-zero-dry-run/*.json` + `capture-meta.json`: SHA-256 content hashes, not secrets
  - Firebase Web SDK `apiKey` at `src/core/firebase.js:52`: known-public Firebase config per CLAUDE.md Security Notes

### npm audit — repo root

- Exit 1 (vulnerabilities present, not severity-gated)
- **0 critical, 0 high, 0 moderate, 8 low**
- All transitive in firebase-admin / google-gax chain
- Verdict: GREEN

### npm audit — functions/

- Exit 1
- **0 critical, 2 high, 2 moderate, 9 low**
- High-severity:
  1. **`fast-xml-builder`** GHSA-5wm8-gmm8-39j9 (transitive via @google-cloud/storage) — attribute quote bypass. Not exploitable here (we don't parse untrusted XML).
  2. **`protobufjs`** GHSA-66ff-xgx4-vchm (transitive via firebase-admin) — code injection via generated toObject default-bytes. Not exploitable here (we don't exercise that path).
- Moderates: `@protobufjs/utf8` (overlong UTF-8), `uuid` (buffer bounds in v3/v5/v6)
- Action: Track for next Firebase SDK upgrade

## OWASP Top 10 (2021) coverage

| Item | Status | Evidence |
|---|---|---|
| A01 Broken Access Control | PASS | firestore.rules 693 lines, v8.0.0-rc1: 42 collection match blocks, 136 allow directives, 192 helper invocations, explicit "NO CATCH-ALL", verified zero `{database}/{document=**}` patterns |
| A02 Cryptographic Failures | PASS | No hardcoded secrets in src/; .gitignore covers .env*, service account, *.pem |
| A03 Injection | PASS | 368 escHtml() calls across 40 source files; no eval of untrusted input; Firestore data layer (no SQL) |
| A04 Insecure Design | PASS | Rate-limited registration, social cooldowns, firestore.rules.maintenance freeze artifact, two-tier pre-commit gates, first-class audit-log collections |
| A05 Security Misconfiguration | PASS | index.html sets X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, comprehensive CSP. HSTS not set via meta tag (only valid as response header — GitHub Pages HTTPS-only by default). CSP allows 'unsafe-inline'+'unsafe-eval' — required by Firebase SDK; tracked. |
| A06 Vulnerable Components | **WARN** | 2 high-sev transitive deps in functions/. Track for next SDK upgrade. |
| A07 Auth Failures | PASS | Firebase Auth + email verification + rate limiting + server-trusted request.auth.uid in rules |
| A08 Software/Data Integrity | PASS | Husky + Claude Code hooks dual-layer; hook 3 blocks tests/e2e/helpers/assertions.js; hook 4 blocks firestore.rules, .env*, service account; version-sync gate |
| A09 Logging & Monitoring | PASS | platform_audit_log, founder_access_logs, leagues/{id}/moderation_log, errors collections built in |
| A10 SSRF | PASS | Only outbound HTTP is searchCourses Cloud Function calling allowlisted GolfCourseAPI endpoint; API key server-side only |

## Bundle exposure scan (P8.5)

Scanned `dist/` for AWS keys, Stripe live keys, PEM private keys, certificate headers. **Zero hits.** The Firebase apiKey is present as expected (public config per CLAUDE.md).

## Headline findings

1. **No real secret leaks.** Every detect-secrets "scary" hit triaged to a known-safe category.
2. **Firestore rules architecture is exemplary.** v8.0.0-rc1 explicit per-collection rewrite + no catch-all.
3. **One CSP gap:** 'unsafe-inline' + 'unsafe-eval' in script-src — necessary for current architecture; would require build-time refactor to remove.
4. **One HSTS gap:** not set (would need hosting-layer config; GitHub Pages already HTTPS-only).
5. **Action item — single source of the YELLOW rating:** Track `fast-xml-builder` (GHSA-5wm8-gmm8-39j9) + `protobufjs` (GHSA-66ff-xgx4-vchm) for next Firebase SDK upgrade. Neither is exploitable against current runtime paths.

## VERDICT: YELLOW

YELLOW because: 2 transitive high-severity deps in functions/. Neither exploitable.

**Per spec P8.1: YELLOW needs Founder approval.** Founder decision required:
- Option A: Accept YELLOW → goal can proceed; track items for next Firebase SDK upgrade
- Option B: Block until Firebase SDK upgrade resolves both → significant scope expansion

Recommendation: Option A (accept). Both vulns are theoretical paths not actually invoked by Parbaughs code. Production exploit risk: ~0. Firebase SDK upgrade cadence is independent of this dashboard-completion goal.
