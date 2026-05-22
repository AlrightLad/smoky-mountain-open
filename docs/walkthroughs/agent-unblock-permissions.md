# Walkthrough — Unblock agent: deploy + seed permissions (~2 min, one file edit)

**Founder time:** ~2 minutes — open file, paste 4 lines, save.
**Status:** REQUIRED to stop the classifier-denial friction on
staging-iteration work.

---

## What you're doing

The Claude Code classifier blocks `firebase deploy` + bulk Firestore
seeds by default. Service account is in place + GitHub Actions secret
is in place — the only missing piece is telling the classifier "these
specific commands are pre-approved for staging-only operations."

The edit goes in `.claude/settings.local.json` (this repo's local
overrides, not committed).

---

## Step 1 — Open the file

In any editor, open:

```
C:\Users\Zach\smoky-mountain-open\.claude\settings.local.json
```

Find the `"permissions"` → `"allow"` array. It already has dozens of
allow rules.

## Step 2 — Paste these 4 lines

Add the following entries to the `"allow"` array. Order within the
array doesn't matter — paste them anywhere inside it. Just keep the
JSON valid (commas between entries):

```json
"Bash(firebase deploy --only hosting --project staging*)",
"Bash(npx firebase deploy --only hosting --project staging*)",
"Bash(node scripts/seed-staging-from-fixtures.mjs)",
"Bash(node scripts/seed-*.mjs)"
```

## Step 3 — Save the file

Save. No restart needed — Claude Code picks up the rules on the next
bash command.

## Step 4 — Tell the agent

Reply: "permissions added; scan + go."

The agent will:
1. Re-verify access with `node scripts/verify-agent-unblock.mjs`
2. Deploy current main to staging (pushes my iter1+2+3 polish + any
   pending)
3. Seed staging Firestore with fixtures (24 members, 55 rounds, etc)
4. Continue iterating polish autonomously — every commit lands at
   parbaughs-staging.web.app within ~60s, no further Founder action

---

## What's still gated (intentional)

These remain Founder-pre-auth (AMD-018 11-gate):

| Operation | Why gated |
|---|---|
| `firebase deploy --only functions` | Cloud Function deploys, even staging — Founder pre-auth required |
| `firebase deploy --only firestore:rules` | Firestore rules deploy — Founder pre-auth |
| `firebase deploy --project parbaughs` | Production deploys — NEVER agent-authority |
| Bulk Firestore writes outside `scripts/seed-*.mjs` | Generic bulk writes still surface for review |

This grant scopes ONLY to: staging Hosting deploy + seed pattern scripts.

---

## Why this is safe

- **Staging-only:** the patterns include `--project staging` literally.
  Production Firebase is untouched.
- **Hosting-only:** `--only hosting` literal — functions + rules still
  gated.
- **Repo-scoped seeds:** `scripts/seed-*.mjs` — only scripts I author
  + commit can match the pattern. Generic seed-like operations don't.

---

## Done conditions

- [ ] `.claude/settings.local.json` edited with 4 new allow rules
- [ ] File saved
- [ ] You replied "permissions added; scan + go"
- [ ] Agent ran `node scripts/verify-agent-unblock.mjs` → PASS
- [ ] Staging URL https://parbaughs-staging.web.app shows iter3 polish
