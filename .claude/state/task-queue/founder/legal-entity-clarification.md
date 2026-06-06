---
status: open
severity: yellow
priority: MEDIUM
founder_action_required: true
cost: "varies — $0 (individual) or ~$125+ (PA LLC filing fee)"
gate: none (business decision, Founder-only)
execute_by: founder
verify_command: Test-Path .claude/state/legal/entity-decision.md
verify_expected: "True"
---

# Founder decision — Is Parbaughs an individual or a business entity?

**Who can do this:** Founder only. This is a business/legal decision that
cannot be read from code and that I (the agent) must not guess.

**This does NOT block the staging product.** It is needed before App Store /
Play Store submission, which you have scoped as the final step. Surfacing it
now so it is not a surprise at submission time.

## Why this matters

The live Terms of Service operate under the name **"Parbaughs."** App Store
and Play Store **seller accounts require a named legal entity** — either you
as a named individual (sole proprietor) or a registered company (e.g. a PA
LLC). The choice affects three things:

1. **Liability framing in the Terms** (`public/terms.html`) — an LLC limits
   personal liability; an individual does not. The current "as is" /
   limitation-of-liability clause is written generically and works for either,
   but the *entity name* it operates under should match reality.
2. **The store seller account** — Apple/Google show the seller name publicly;
   it must be the real legal entity.
3. **Tax handling** — an LLC files separately; an individual reports on a
   personal return.

## The standard trade-off (not legal advice)

| | Individual (sole proprietor) | LLC |
|---|---|---|
| Cost | $0 | ~$125 PA filing + optional registered-agent fee |
| Personal liability | Exposed | Shielded (if maintained properly) |
| Setup time | none | ~1 hour + state processing |
| Good when | hobby/friends-only, low risk | real money ever flows, or you want the shield |

Parbaughs today has **no real-money flows** (ParCoins are virtual-only — see
the Legal dashboard item 1), so liability exposure is low *today*. If a
cash-purchase ParCoin model is ever built (it's in the deferred roadmap), an
LLC becomes materially more attractive.

## Steps to resolve

1. **Decide:** reply in chat — "individual" or "LLC" (or "defer, ship under my
   name for now").
2. I will then, automatically:
   - Record your decision to `.claude/state/legal/entity-decision.md`
     (this is what the verify below checks).
   - Confirm the Terms' entity name + liability framing matches the choice,
     and queue any Terms edit as a normal staging change for your review.
3. If you choose **LLC**, the actual filing is a you-step (PA Dept. of State,
   <https://www.pa.gov/agencies/dos.html>) because it costs money and needs
   your identity — I cannot file it for you.

## Mark complete

Resolves automatically once your decision is recorded. To check:

```
powershell -ExecutionPolicy Bypass -File scripts/founder-mark-complete.ps1 legal-entity-clarification
```
