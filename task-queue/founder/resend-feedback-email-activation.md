# Activate feedback emails (Resend) — 2 steps, ~3 minutes

**What this does:** the moment a member files a Bug Report or a Feature Request
in the app, you get an email with the full details (type, severity, the page
they were on, app version, device) — so you can triage from your inbox without
opening the app. Every report is *also* saved in the app (More → Admin →
Feedback) regardless of email, so nothing is ever lost.

**Why it's waiting on you (not me):** the code is **done and live** — the form
writes the report, and a Cloud Function (`onFeedbackEmail`) is ready to send it
through Resend. But it needs (1) your secret Resend API key, which I don't have
and can't store (the secrets file is gate-protected for your protection), and
(2) a Cloud Function deploy, which is walled to you per our production-safety
gates. It's built to **sit silently and do nothing** until you do these two
steps — so there's zero risk leaving it as-is.

---

## Step 1 — Add 3 lines to `functions/.env`

Open `functions/.env` (it already has your `GOLFCOURSE_API_KEY`). Add these
three lines, filling in your real values:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FEEDBACK_TO=you@yourdomain.com
FEEDBACK_FROM=Parbaughs Feedback <feedback@parbaughs.com>
```

- **`RESEND_API_KEY`** — from resend.com → API Keys → "Create API Key" (sending
  permission is enough). Starts with `re_`.
- **`FEEDBACK_TO`** — the inbox where you want the alerts (your normal email is
  fine).
- **`FEEDBACK_FROM`** — must use the domain you verified in Resend (the one you
  set up the DNS for on Cloudflare). Format is `Name <address@verified-domain>`.
  If `parbaughs.com` is the verified domain, `feedback@parbaughs.com` works.

Save the file. (Don't commit it — it's gitignored on purpose; secrets never go
in the repo.)

## Step 2 — Deploy just this one function

In PowerShell from the repo root, run this in the prompt with the `!` prefix so
the output lands in our chat:

```
! firebase deploy --only functions:onFeedbackEmail --project parbaughs
```

Scoping it to `functions:onFeedbackEmail` deploys **only** the feedback emailer
and leaves your other 12 functions untouched. Takes ~1–2 minutes. If it asks you
to log in first, run `! firebase login` once.

---

## Test it (30 seconds)

1. Open the app → **More → Report a Bug** (or any feature-request form).
2. File a quick test: type "Bug", description "test — ignore", Send.
3. Within a few seconds you should get an email titled
   `[Parbaughs Bug] test — ignore`. The report also shows in
   **More → Admin → Feedback**.

If the email doesn't arrive: the report will still be saved in-app (so you lose
nothing), and the function logs the reason — tell me and I'll read the logs.

## Good to know

- **Spam-proof:** each member is capped at 12 feedback emails per hour. Over the
  cap, the report is still saved in-app; only the extra emails are held back.
- **Safe to ignore:** if you skip this, nothing breaks — reports just stay
  in-app only, exactly as today.

---

### Agent-side status (for the record)
- ✅ `functions/lib/feedback-email.js` — built, syntax-clean, deploy-ready.
- ✅ Wired into `functions/index.js` (`exports.onFeedbackEmail`, line 1293).
- ✅ Both writers confirmed targeting `feature_requests`: `bugreport.js:116`
  (full shape) + `faq.js:82` (feature-request shape). `buildEmail` normalizes
  both.
- ✅ Graceful no-op when `RESEND_API_KEY` / `FEEDBACK_TO` / `FEEDBACK_FROM` are
  unset (verified: `functions/.env` currently only has `GOLFCOURSE_API_KEY`, so
  it's inert today — no errors, no email).
- ⛔ Blocked on Founder: AMD-018 gate 6 (secrets) + gate 1 (CF deploy). Nothing
  further is agent-actionable until the two steps above are done.
