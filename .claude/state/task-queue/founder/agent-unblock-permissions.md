---
status: open
severity: red
priority: HIGH
authored_at: 2026-05-22T20:15:00Z
walkthrough_doc: docs/walkthroughs/agent-unblock-permissions.md
verify_command: "node scripts/verify-agent-unblock.mjs"
verify_expected: "PASS"
---

# Founder action — Unblock agent: deploy + seed permissions (~2 min, ONE edit)

**Surfaced:** 2026-05-22 — Founder directive "I want nothing to block
you from working." Three classifier-denials this session blocked
real-work paths:

1. `firebase deploy --only hosting --project staging` — denied
   (blocked staging deploy of my polish iter1/2/3)
2. `node scripts/seed-staging-from-fixtures.mjs` — denied (blocked
   populating staging Firestore so staging URL renders real data)
3. `npx firebase deploy ...` — denied (same classifier rule)

All three are STAGING-ONLY operations. Service account is in place,
GitHub Actions secret is in place. The classifier just needs explicit
allow rules.

## The fix (~2 min, ONE edit)

Open `.claude/settings.local.json` in any text editor + add the
following to the `"permissions" -> "allow"` array (alphabetical order
recommended, but any position works):

```json
"Bash(firebase deploy --only hosting --project staging*)",
"Bash(npx firebase deploy --only hosting --project staging*)",
"Bash(node scripts/seed-staging-from-fixtures.mjs)",
"Bash(node scripts/seed-*.mjs)"
```

Then save the file. No restart needed — Claude Code picks up the
new rules on next bash invocation.

## What this unblocks

After this edit, the agent can:
- **Deploy staging directly** — `firebase deploy --only hosting
  --project staging`. Polish iterations land at parbaughs-staging.web.app
  within ~60 seconds of commit. No more "waiting for workflow."
- **Seed staging Firestore** — populate with the E2E fixture data so
  staging URL renders 24 members + 1 league + 55 rounds + 8
  notifications when you sign in.
- **Future seed scripts** — `scripts/seed-*.mjs` patterns covered by
  the same rule, so I don't have to surface every new seed script
  individually.

## What this does NOT unblock (still gated)

- `firebase deploy --only functions` — AMD-018 #1 gate (Cloud Function
  deploys; staging would be safe but the rule is conservative)
- `firebase deploy --only firestore:rules` — AMD-018 #2 gate
- `firebase deploy --project parbaughs` (production) — never agent-
  authority; you push to main + GitHub Pages deploys
- Bulk Firestore writes outside the seed pattern — still surfaces
  if I author a non-seed script that does bulk writes

## Verify

After saving `.claude/settings.local.json`, tell the agent "permissions
updated; verify and continue." The agent runs:

```
node scripts/verify-agent-unblock.mjs
```

Which attempts a dry-run of each gated command. Expected: `PASS` on
all four.

## Why this is the right level of grant

The original session's friction came from **classifier conservatism**
blocking explicit staging-only operations even after the Founder
granted the underlying credentials. The rules above scope the unblock
to:

1. **Staging-only** (`--project staging` is literal in the pattern)
2. **Hosting-only** (`--only hosting` is literal; functions/rules
   still gated)
3. **Repo-scoped seed scripts** (`scripts/seed-*.mjs` only — generic
   bulk writes still surface)

Production deploys, Cloud Function pushes, and Firestore rules
remain Founder-pre-auth per AMD-018 11-gate. This grant doesn't
change that. It just removes the staging-iteration friction.

## After approval

Send: "permissions added; scan + go." The agent will:
1. Re-verify access via the verify command
2. Deploy current main to staging (publishes iter1+2+3 + any pending)
3. Seed staging Firestore with fixtures
4. Continue polish work — every commit lands at staging URL within
   ~60s, no further Founder action required
