---
severity: MEDIUM
class: dependency-vulnerability
detected_at: 2026-05-14T22:46:49Z
head_sha: fac33105a9aefc824dd9f48a6881bcd05e6125db
status: open
owner: main agent
---

# Functions/ npm audit — 2 HIGH + 2 MODERATE

## Summary

`npm --prefix functions audit` reports 13 vulnerabilities. None CRITICAL, but 2 HIGH severity warrant tracking and eventual remediation.

## HIGH severity

### fast-xml-builder (<=1.1.6)
- **GHSA-5wm8-gmm8-39j9** — allows attribute values with unwanted quotes to bypass malicious or unwanted attributes (CVSS 6.1, CWE-91/CWE-611)
- **GHSA-45c6-75p6-83cc** — comment value regex can be bypassed (CVSS 6.1, CWE-91)
- Effects: none direct; transitive dependency
- Fix available: yes (no breaking change marker)

### protobufjs
- GHSA referenced via @protobufjs/utf8 entry
- Effects: transitive via firebase-admin → google-gax
- Fix available: yes via firebase-admin@10.3.0 (semver-major)

## MODERATE severity

- **@protobufjs/utf8** (<=1.1.0) — overlong UTF-8 decoding (GHSA-q6x5-8v7m-xcrf, CVSS 5.3)
- **uuid** — vulnerability details in the full audit JSON

## LOW severity

9 LOW findings, all in firebase-admin → google-gax/firestore/storage tree. Fix path: firebase-admin@10.3.0 (semver-major).

## Exploit accessibility

- `fast-xml-builder` is XML output construction. Exploit requires attacker-controlled XML attribute values being serialized by Cloud Functions. Searching the repo, the only fan-out is via firebase-admin tooling — no direct fast-xml-builder usage in `functions/index.js`. Exploit accessibility: LOW.
- `protobufjs` overlong UTF-8 — exploit requires attacker-controlled protobuf message bytes. Firebase Functions consume protobufs from Firestore SDK calls (trusted source). Exploit accessibility: LOW.
- Aggregate severity rating: MEDIUM (HIGH per audit, but real-world exploit path narrow in this repo's usage).

## Recommended action

Owner: main agent (Founder authorization required since firebase-admin major bump touches Cloud Functions deploys).

1. Test firebase-admin@10.3.0 + firebase-functions latest in a branch — verify all 8 Cloud Functions still deploy and pass smoke.
2. Watch for breaking changes in `getFirestore()` API surface and Functions runtime context.
3. If breaking changes are minor, ship as `v8.x.y` semver-minor.
4. If breaking changes are blocking, document workaround in findings note and re-evaluate every cycle.

## Why this is not CRITICAL

- No CRITICAL severity in audit
- Exploit paths require attacker control over input that is currently sourced from trusted Firestore / Firebase APIs
- No active exposure to public attacker traffic for these specific vulnerabilities
- Fix exists and is well-scoped (single dep bump)

## Re-scan trigger

Next cycle if HEAD changes, or daily if HEAD static. Will auto-clear when functions/package.json reflects fixed versions.
