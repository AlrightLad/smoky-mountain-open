---
incident_id: INC-2026-05-21-001
severity: SEV-3
category: credential-leak
status: contained
authored: 2026-05-21T19:20:00Z
authored_by: agent-post-session-audit
founder_flagged: true
---

# INC-2026-05-21-001 — Firebase staging Web SDK config committed inline

## What happened

Commit `8092d5f9` introduced literal Firebase Web SDK config (apiKey, appId,
messagingSenderId, projectNumber) for the newly-created `parbaughs-staging`
project inside `docs/walkthroughs/staging-firebase-project.md`. The walkthrough
embedded the config in a heredoc the Founder was instructed to paste into
`.env.staging`. The apiKey value `AIzaSyCO0WYQntITwU7ndI3B0ZXlvcxDZdvtF3M`
landed in the git history and was pushed to the public GitHub repo
`AlrightLad/smoky-mountain-open`.

Fixed in commit `8807fff0` (per F1-pass1 critique finding) by replacing the
literal values with `<copy-from-firebase-console>` placeholders and moving the
explanation into a collapsible `<details>` block. The walkthrough no longer
contains literal keys, but they REMAIN in git history at commit 8092d5f9.

## Severity assessment — why SEV-3, not SEV-1

Firebase Web API keys are public-by-design (see
https://firebase.google.com/docs/projects/api-keys). They identify the project,
they do NOT authenticate the caller. The actual security boundary is:

1. **Firestore Security Rules** (firestore.rules) — enforce who can read/write
2. **Cloud Function authentication** (context.auth checks)
3. **App Check** (optional — verifies legitimate app origin)

Anyone with the apiKey can ATTEMPT requests, but without satisfying #1/#2
they cannot read/write production data. Free-tier abuse cap on the Firebase
project sets a financial ceiling. For the staging project specifically:

- Staging has NO production member data
- Firestore rules deploy still pending (Step 4 of walkthrough)
- Auth provider enable still pending (Step 2)

So the blast radius of the leaked staging key is: an attacker can ATTEMPT
to call the staging project, but rules + auth gate any meaningful action.

**However, the LEAK PATTERN is the failure mode** — this committed-credential
shape would have been catastrophic if it had been a production service-account
JSON or a Sentry write-tokenkey. The fact that "it's just a Web API key" is
fortunate, not a reflection of agent process quality.

## Why the agent did it

The agent was authoring a Founder walkthrough with concrete steps. To make
the steps copy-pasteable, the agent inlined the actual values it had just
retrieved via `firebase apps:sdkconfig`. This was a P9 (data truthfulness)
optimization that overrode P8 (security ship-blocking) reflex. The critique
loop caught it (F1-HIGH) and fixed it.

## Action items

| # | Item | Owner | Status |
|---|---|---|---|
| 1 | Rotate the staging Firebase Web API key via Firebase console (Settings → General → Web apps → kebab menu → Add Fingerprint / Rotate Key) | Founder | OPEN |
| 2 | After rotation, update Founder's `.env.staging` with the new key (gitignored) | Founder | OPEN |
| 3 | Add secretlint to .husky/pre-commit (block any commit with detected secrets) | Agent | OPEN |
| 4 | Add an explicit "NEVER inline real credentials in walkthroughs" rule to docs/agents/ENGINEER.md | Agent | OPEN |
| 5 | Audit all `docs/walkthroughs/*.md` + `docs/agents/*.md` for any literal credentials | Agent | OPEN |
| 6 | Verify no production keys leaked (only staging project was affected per audit) | Agent | DONE — confirmed no production apiKey/serviceAccount in repo |

## Detection improvements

- secretlint installed 2026-05-21 (npm i -D secretlint @secretlint/secretlint-rule-preset-recommend)
- npm run scan:secrets wired
- BUT not yet enforced in pre-commit — that's action item #3 above
- gate-protected.sh hook ALREADY blocks Edit/Write to .env*, scripts/.service-account.json, firestore.rules
- gate-protected.sh did NOT cover docs/walkthroughs/* because they're docs, not env files
- New: add a docs-credential-scan to pre-commit that greps for `AIzaSy[A-Za-z0-9_-]{30,}` and similar shapes

## Prevention rules (codified)

1. **Never inline real credentials in any committed file.** Even "public-by-design"
   keys count. The exception list is empty — there is no class of credential
   the agent inlines in committed files.

2. **Walkthroughs use placeholder syntax**: `<copy-from-firebase-console>`,
   `<paste-your-DSN-here>`, etc. The Founder copies from the actual source,
   never from a doc that has the real value.

3. **Secret scan gates** run pre-commit. Any commit with detected credential
   shape is BLOCKED. Founder override requires explicit `FOUNDER_AUTH_TS`.

## Cross-references

- Commit 8092d5f9 (introduced) → 8807fff0 (fixed via F1-HIGH critique)
- .claude/state/critique/8092d5f9-2026-05-21.md (critique record)
- docs/incident-response.md (severity ladder)
- AMD-018 gate #6 (Secrets handling — .env*, service-account.json)
