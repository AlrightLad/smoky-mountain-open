---
name: parbaughs-legal-compliance
description: Use before every ship-close to verify PARBAUGHS stays legally compliant and legally protected. The operative form of the Legal & Compliance reviewer — gates ship-close symmetric to P8 security (legal RED blocks; legal YELLOW needs Founder approval). Extra scrutiny on the ParCoin economy, data/privacy, UGC, account lifecycle, App Store readiness, accessibility, and IP surfaces.
---

# parbaughs-legal-compliance

> **Skill purpose:** Ensure every ship keeps PARBAUGHS legally compliant
> and legally protected. This is the operative form of the **Legal &
> Compliance reviewer** in the orchestration team.
>
> **Owner:** Legal & Compliance reviewer (specialist tier, launch-gating).
>
> **Authority:** Ship-gating. A legal **RED** blocks ship-close exactly
> like a P8 security RED. A legal **YELLOW** needs Founder approval via
> `task-queue/founder/` before ship. GREEN ships.
>
> **Related:** P8 (security ship-blocking, the analogue), P9/P10 (LEGAL
> block format), AMD-018 (payments/App-Store/domain gates), AMD-015
> (propose-first escalation), `public/privacy.html`, `public/terms.html`,
> `deleteMyAccount`, UGC block/report moderation.

## Why this reviewer exists

Two failure modes this reviewer prevents:

1. **App Store / Play Store rejection.** A single missed guideline
   (UGC moderation, account deletion, privacy labels, payment rules)
   blocks launch. App-Store readiness is the FINAL gate before the
   founding 20 can install the production build — a rejection there
   costs a full review cycle.
2. **Legal exposure.** PARBAUGHS handles real human data (location,
   identity, social graph) for a real group of people, and runs a coin
   economy with wagers. The single largest exposure is the **ParCoin
   economy being construed as gambling**. A reviewer that catches this
   before ship protects the Founder, the league, and the platform.

The reviewer is the substantive legal layer over AMD-018's procedural
gates. AMD-018 says "don't deploy payment-economy code without Founder
pre-auth"; this reviewer says "here is *why* a given economy change is
or isn't legally safe, with evidence."

## When to invoke

**Always** before declaring a ship complete (the LEGAL block joins the
SECURITY block in the retrospective).

**Extra scrutiny** when the ship touches any of these surfaces:

| Surface | Why it carries legal weight |
|---|---|
| ParCoin economy (earn/spend/wager/transfer) | Gambling-law exposure — the #1 risk |
| Data & privacy (collection, location, profile) | GDPR/CCPA/COPPA, privacy labels |
| UGC (chat, DMs, photos, discussion) | App Store 1.2, defamation, DMCA |
| Account lifecycle (signup, deletion, suspension) | App Store 5.1.1(v), data-subject rights |
| App Store / Play Store metadata + build | Store guideline compliance |
| Accessibility (new UI, flows) | ADA / WCAG 2.1 AA |
| IP & identity (marks, course names/photos) | Trademark, right of publicity, DMCA |

## The compliance checklist

Run each item. Grade **GREEN** (verified compliant, with evidence),
**YELLOW** (unverified or needs Founder judgment), or **RED** (a legal
requirement is broken). **Default any unverified item to YELLOW** — never
assume GREEN without evidence (P9 discipline applied to legal facts).

### 1. ParCoin economy is NOT gambling (highest exposure)

Gambling generally requires three legs: **consideration** (you pay to
play), **chance** (outcome is luck-predominant), and **prize** (you win
something of real-world value). Break any leg and it is not gambling.
PARBAUGHS must break at least two, durably:

- **No consideration:** no real-money buy-in to earn or wager ParCoin.
  ParCoin is granted by the platform, never purchased.
- **No real-world-value prize:** ParCoin cannot be cashed out, redeemed
  for money, or transferred for real value off-platform. Virtual-only.
- **Skill-predominant + friends-only:** wagers are between known league
  members on golf performance (skill), not house-banked games of chance.
- **No house rake:** the platform takes no cut of wagers.

→ **RED if any of "no real-money in" / "no cash-out" / "no real value" breaks.**
Also a hard AMD-018 gate: economy *rules* code never deploys without
Founder pre-auth. The reviewer's job is to confirm a given economy change
keeps all three protective legs intact and to surface to the Founder if
a change pressures any leg.

### 2. App Store / Play Store readiness

- **UGC moderation (Apple 1.2):** filter/report mechanism, block users,
  ability to remove content + ejecting abusive users, a published point
  of contact. (Substrate: #208 block/report.)
- **Account deletion (Apple 5.1.1(v)):** in-app account deletion that
  actually deletes server-side data. (Substrate: `deleteMyAccount`
  #199/#200.)
- **Privacy nutrition labels / Data Safety form:** accurate to what is
  actually collected (cross-check `privacy.html`).
- **Payments (3.x):** virtual ParCoin must not look like it buys
  real-world goods; no external-purchase circumvention.
- **Age rating:** questionnaire answers match real content (UGC, social).

### 3. Privacy law (US state laws + GDPR/CCPA posture)

- `privacy.html` current and accurate (data collected, purposes, third
  parties — Firebase, GolfCourseAPI, Sentry).
- Data-subject rights honored: access, deletion (have it), correction.
- Consent for sensitive collection: **location is opt-in, city-level**
  (already the design) — keep it opt-in and minimized.
- Data minimization + retention: collect only what the feature needs.
- COPPA age posture: state the minimum age; PARBAUGHS is an adult
  friend group — make the floor explicit in terms.

### 4. Terms of service / liability

`terms.html` should cover: minimum age, acceptable-use (ties to UGC
moderation), **ParCoin is virtual-only with no cash value**, limitation
of liability, governing law (PA — York-based league), dispute
resolution, and the right to suspend/terminate for abuse.

### 5. Accessibility (ADA / WCAG 2.1 AA)

- 44pt minimum touch targets (already a project rule).
- Contrast ratios meet AA (4.5:1 text / 3:1 large + UI).
- `:focus-visible` affordance on interactive elements.
- Screen-reader labels on icon-only controls (UGC report, nav, etc.).

Accessibility is both a legal duty (ADA web-accessibility exposure) and
a P7 quality dimension — they reinforce each other.

### 6. IP & identity

- No third-party marks/logos used in a way implying endorsement.
- Course names/data via GolfCourseAPI per license; no scraped photos.
- User-uploaded photos: DMCA-style takedown path (rides on #208 UGC
  reporting); users warrant they own what they upload (terms).
- "Parbaughs" name/handles: no conflict surfaced (Founder owns brand).

### 7. Security as a legal duty

Defer the substance to P8 / the Security Auditor, but record the legal
framing: a breach of the data in §3 triggers **state breach-notification
laws**. Security RED is therefore also a legal RED. The two reviewers
reinforce; they do not duplicate.

## Output: the LEGAL block in the retrospective

Every ship-close writes a **LEGAL** block beside the SECURITY block,
following P10 (WHAT / WHERE / WHAT-ACTION for any non-GREEN):

```
LEGAL (parbaughs-legal-compliance)
  Verdict: GREEN | YELLOW | RED
  Surfaces touched this ship: <economy | privacy | UGC | account | store | a11y | IP | none>
  Checklist:
    1. ParCoin-not-gambling ... GREEN  (evidence: <what proves it>)
    2. App Store readiness ..... GREEN  (evidence: ...)
    3. Privacy law ............. GREEN  (evidence: ...)
    4. Terms / liability ....... GREEN  (evidence: ...)
    5. Accessibility ........... YELLOW (WHAT: <gap> / WHERE: <surface> / ACTION: <fix>)
    6. IP & identity ........... GREEN  (evidence: ...)
    7. Security-as-legal-duty .. GREEN  (defers to SECURITY block: <verdict>)
  Non-GREEN items: <count + one-line each with WHAT/WHERE/WHAT-ACTION>
```

A ship with a legal RED does not close. A ship with a legal YELLOW
surfaces to the Founder per AMD-015 before close.

## Escalation (propose-first, AMD-015)

When an item is YELLOW or RED and resolving it needs a Founder
taste/scope/values/legal-risk call, surface via `task-queue/founder/`
with a **proposed answer + rationale** — never a blank "is this ok?".

Example escalation framing:
> "Ship X adds gift-coin transfers between members. Legal §1 leg
> 'no real-world value' holds *only if* gifted coins remain
> non-cashable. **Proposed:** keep transfers virtual-only, no
> redemption path, cap daily transfer volume to deter coin-brokering.
> **Rationale:** preserves the not-gambling posture while enabling the
> social feature. Founder approve/redirect?"

## Worked example — ParCoin gift coins

**Task as stated:** "Let members gift ParCoin to each other."

**Doing-mode (anti-pattern):** add a transfer button, ship.

**Legal-reviewer pass:**
1. Surface touched: **economy** → §1 extra scrutiny + AMD-018 gate.
2. §1 legs: "no real-money in" still holds (gifts come from existing
   granted balances). "No cash-out" still holds *unless* the feature
   creates a secondary market. "Skill/friends-only" unaffected.
3. Risk: if gifted coins ever become cashable or brokered for real
   money, the "no real value" leg breaks → **RED (gambling exposure)**.
4. Verdict: **YELLOW** — ships only with virtual-only guarantee +
   anti-brokering cap, and only after Founder approval (AMD-018
   economy gate). Escalate per AMD-015 with the proposed answer above.

If instead the task were "let members buy ParCoin with real money,"
that **mints real-money-in → RED, hard stop**, because it creates
consideration and pushes the whole economy toward regulated gambling /
money-transmission territory.

## Cross-references

- `CLAUDE.md` — Three-Agent Workflow + orchestration team (Legal &
  Compliance reviewer role).
- `docs/reports/harness-flow.html` — the agent network roster (Legal &
  Compliance specialist card).
- `docs/reports/dashboard.html` — governance-gate surfacing.
- **P8** SECURITY_SHIP_BLOCKING — the security analogue this mirrors.
- **AMD-018** 11-gate — payments/economy, App-Store, domain gates.
- **AMD-015** propose-first escalation.
- `public/privacy.html`, `public/terms.html` — the documents kept current.
- `deleteMyAccount` (#199/#200), UGC block/report (#208) — existing
  compliance substrate.
