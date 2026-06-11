# Make member feedback email you — setup walkthrough

**Status:** code shipped in v8.24.92 (committed). Three steps below are yours
(a credential, a DNS verification, and one deploy command the harness blocks me
from running). ~15 minutes total.

**What you decided:** Resend API → a Parbaughs address. This walkthrough is
built around exactly that.

**What already works without you:** every bug report + feature request members
file shows up in the app at **More → Admin → Feedback** — full detail, filter by
Bugs/Features, one-tap Accept/Reject. The email below is the *notification* layer
on top of that so you don't have to open the app to know one came in.

---

## The one thing to understand first

**Resend *sends* email; it does not *receive* it.** So two halves:
- **Sending:** the Cloud Function calls Resend to send a message *from* a
  verified Parbaughs address. (Steps 1–2.)
- **Receiving:** that message has to land in a real inbox you can open. You need
  a mailbox at the destination address. (Step 0.)

---

## Step 0 — Pick the destination inbox (where the email lands)

`feedback@parbaughs.com` is the target, but parbaughs.com email isn't set up
yet, so until it is, **point the destination at an inbox you already have** so
this works today:

- **Works right now:** use `zachary.boogher@dtctoday.com` as the destination.
- **Branded end-state:** once you have parbaughs.com email (Google Workspace,
  or a forward/alias at your domain host), create `feedback@parbaughs.com` (or
  forward it to your main inbox). Then it's a one-line change in Step 3 + redeploy.

You don't have to wait for the domain to start getting emails — start with your
dtctoday inbox, switch later.

## Step 1 — Resend account + API key

1. Sign up free at **resend.com** (3,000 emails/month free — far more than 20
   members will ever generate).
2. **API Keys → Create** → copy the key (starts with `re_...`). You'll paste it
   in Step 3.

## Step 2 — Verify a sender (so the email isn't spam)

Two paths — pick one:

- **Instant (to test today):** set the *from* address to Resend's shared sender
  `onboarding@resend.dev`. No DNS needed. Deliverability is fine for testing;
  the From-name just won't be branded.
- **Branded (the real end-state, AMD-018 gate 10 = DNS, your hand):** in Resend,
  **Domains → Add Domain → parbaughs.com**. Resend shows a few DNS records
  (SPF/DKIM TXT + a return-path). Add them at wherever parbaughs.com DNS lives.
  Once it flips to "Verified," you can send from `feedback@parbaughs.com`.

Start with the instant path to confirm the whole pipe works, then do the branded
path when you have a few minutes for DNS.

## Step 3 — Secrets into functions/.env + deploy

1. Open **`functions/.env`** (gitignored — never committed; Hook 4 blocks me from
   editing it, which is why this is your hand). Add three lines:

   ```
   RESEND_API_KEY=re_your_key_here
   FEEDBACK_TO=zachary.boogher@dtctoday.com
   FEEDBACK_FROM=Parbaughs Feedback <onboarding@resend.dev>
   ```

   (Once parbaughs.com is verified, change the last two to
   `FEEDBACK_TO=feedback@parbaughs.com` and
   `FEEDBACK_FROM=Parbaughs Feedback <feedback@parbaughs.com>` and redeploy.)

2. Deploy the function (run from the repo root — the harness walls me from
   `firebase deploy` in-session, AMD-018 gate 1, so this command is yours):

   ```
   firebase deploy --only functions:onFeedbackEmail
   ```

## Step 4 — Verify (takes 1 minute)

1. In the app: **More → Report a Bug** → send a test ("test from Zach").
2. Within ~30s an email lands in the Step-0 inbox.
3. The same report appears at **More → Admin → Feedback** (works regardless of
   email).

If no email arrives, **Firebase Console → Functions → onFeedbackEmail → Logs**
tells you exactly why:
- `email not configured (stored only)` → a `.env` var is missing/misspelled.
- `Resend 4xx: ...` → key invalid, or the From-address isn't verified yet.
- `sent feedback ... to ...` → it sent; check spam, confirm the destination
  inbox is real.

---

## Safety / design notes (so you know it's solid)

- **Secrets** live only in `functions/.env` (gitignored, never in the bundle,
  never committed). The key is only readable by the deployed function.
- **Anti-spam:** each submitter is capped at 12 emails/hour. Over-cap reports are
  still **stored + shown on the board** — only the email is suppressed. So a
  member can't bomb your inbox.
- **Fails soft:** if a var is missing or Resend errors, the function logs it and
  the report is still stored. There is never any member-facing impact.

## After you deploy + verify — what I do next (no further input needed)

1. Wire **Accept/Reject buttons into the email itself** so you can triage from
   your inbox without opening the app (v2).
2. Start the **triage scan loop:** each marathon cycle I read the feedback
   collection, auto-fix clear bugs (your standing grant), and attach my
   recommendation (Build / Let's discuss / Decline + reason) to each feature so
   it's waiting for your one tap on the board.

Just tell me "email's live" and I'll pick those up.
