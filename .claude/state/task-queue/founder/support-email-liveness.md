---
status: open
severity: yellow
priority: MEDIUM
founder_action_required: true
cost: "varies — $0 (repoint to an existing inbox) or ~$12-20/yr (parbaughs.golf domain + email hosting)"
gate: AMD-018 gate-10 (domain/DNS) only if you stand up parbaughs.golf
execute_by: founder
verify_command: Test-Path .claude/state/legal/support-email-confirmed.txt
verify_expected: "True"
---

# Founder decision — Make the support email a live, monitored inbox

**Who can do this:** Founder only. Standing up a real inbox (or choosing
which existing address to expose) needs your accounts and, if you pick the
domain route, a purchase. I (the agent) cannot create mailboxes or buy a
domain for you.

**This does NOT block the staging product.** It is needed before App Store /
Play Store submission — both stores reject apps whose listed support contact
bounces, and our privacy policy promises a working channel for data-rights
requests. Surfacing now so it is not a surprise at submission time.

## Why this matters

The compliance docs already promise members a way to reach us, and that
promise is legally load-bearing (GDPR/CCPA data-rights requests, account
deletion, the stores' required support URL). Right now the address they name
is **not yet a live inbox.** The references:

- `public/privacy.html` — `support@parbaughs.golf` is the deletion-request
  and data-rights contact ("we will process it within 30 days").
- `public/terms.html` — `support@parbaughs.golf` is the general contact.
- `public/support.html` — `support@parbaughs.golf`, plus
  `bugs@parbaughs.golf` and `features@parbaughs.golf`.

All three of these point at **`parbaughs.golf`**, which per CLAUDE.md is a
**pending domain** (AMD-018 gate-10, domain/DNS). Until the domain exists and
the mailbox is monitored, a member who emails the address gets a bounce, and a
store reviewer who tests the support link sees a dead contact.

## The standard trade-off (not legal advice)

| | Repoint to an existing inbox | Stand up parbaughs.golf |
|---|---|---|
| Cost | $0 | ~$12-20/yr domain + email hosting (or free tier) |
| Brand fit | weaker (personal/other address shown publicly) | on-brand (`support@parbaughs.golf`) |
| Setup time | minutes (just tell me which address) | ~1 hour + DNS propagation |
| Good when | you want to ship now and brand later | you're ready to lock the brand domain |

The address is shown publicly to members and to store reviewers, so it should
be one you actually watch.

## Steps to resolve

1. **Decide:** reply in chat with one of:
   - **"repoint to `<your-email>`"** — I will queue a staging edit changing
     the contact in `privacy.html` / `terms.html` / `support.html` to the
     address you name, for your review.
   - **"stand up parbaughs.golf"** — the domain purchase + DNS + mailbox is a
     you-step (it costs money and needs your registrar/host login; AMD-018
     gate-10). Once it's live and you've sent yourself a test email that
     arrives, tell me and I'll record the confirmation.
   - **"defer"** — leave the docs as-is for now; this item stays open as a
     known pre-submission gap.
2. Once the inbox is confirmed live (or you've named the repoint target), I
   will record it to `.claude/state/legal/support-email-confirmed.txt`
   (this is what the verify below checks) and reconcile the docs.

## Mark complete

Resolves automatically once the confirmation file is recorded. To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 support-email-liveness
```
