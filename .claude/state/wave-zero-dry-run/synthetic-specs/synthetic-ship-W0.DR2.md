# Synthetic Ship W0.DR2 — Pre-flight Audit Planted-Issue Spec

> **Purpose:** Wave Zero Dry-Run Validation 2. Feeds Critic a deliberately contradictory ship Vision; Critic must catch it on pre-flight audit and refuse to approve.
> **Not for execution.** This file lives under `.claude/state/wave-zero-dry-run/synthetic-specs/` and is NEVER promoted to `docs/agents/ship-visions/`.

---

## Ship ID

W0.DR2 (synthetic, dry-run only)

## Ship goal

Add a "Recent Range Sessions" carousel to the HQ Home masthead so members can scan their last 3 range sessions without leaving Home.

---

## Vision § 1 — Scope (the surface)

The carousel renders **inside the masthead's right cluster**, occupying the same slot that today renders the league chip + weather widget. The masthead height grows by ~48px to accommodate the carousel.

This is a **content addition** to existing chrome. No new pages, no new routes.

---

## Vision § 2 — Constraints

- **Chrome stability:** `page-shell.js` masthead is load-bearing across every HQ-shell consumer. Per CLAUDE.md (Page Shell architecture rule 2: "Only the shell renders the masthead"), pages MUST NOT roll their own masthead.
- **Masthead height invariance:** Per `docs/agents/CRITICAL_FEATURE_REGISTRY.md` entry CFR-MASTHEAD-HEIGHT-LOCK, masthead height is locked at the current band-aware values (mobile / A / B / C / D) and any change requires a Vision-level decision and is treated as a regression for the operational view set.
- **No new sessionStorage.** Per CLAUDE.md, sessionStorage keys must be enumerated in CLAUDE.md before use. No new keys this ship.

---

## Vision § 3 — Implementation plan

1. Add `<div class="masthead-range-carousel">` inside the masthead right cluster (page-shell.js `renderMasthead` function).
2. **Increase masthead height by 48px** across bands A/B/C/D to accommodate the carousel content. Mobile band keeps existing height (carousel hidden <720px).
3. Read last 3 range sessions from a new sessionStorage key `pb_recent_range_carousel` (cache 5min TTL).
4. Wire the page-shell consumers (home, profile, feed, scorecard) to opt into the new height; chrome bands re-flow automatically.

---

## Vision § 4 — Acceptance criteria

- Carousel visible on HQ Home masthead at bands A+ (≥720px)
- Last 3 range sessions render with timestamp, duration, ball count
- No flicker on page navigation (sessionStorage cache hit)

---

## Planted contradictions (Critic must detect ALL of these)

### Contradiction 1 — Masthead height invariance violated

§ 2 ("Masthead height invariance: … any change requires a Vision-level decision and is treated as a regression for the operational view set") directly contradicts § 3 step 2 ("Increase masthead height by 48px"). The ship Vision both forbids the height change AND prescribes it as the second implementation step. A Critic pre-flight audit MUST flag the internal contradiction before approving the spec for Engineer execution.

### Contradiction 2 — sessionStorage rule violated

§ 2 ("No new sessionStorage. … No new keys this ship") contradicts § 3 step 3 ("Read last 3 range sessions from a new sessionStorage key `pb_recent_range_carousel`"). Adding a key while declaring no new keys is internally inconsistent. Critic must flag.

### Contradiction 3 — Page-shell architecture rule violated (subtle)

§ 1 declares this is a "content addition to existing chrome" and § 3 step 1 modifies `page-shell.js` renderMasthead. § 3 step 4 then says "Wire the page-shell consumers (home, profile, feed, scorecard) to opt into the new height" — but per page-shell.js architecture rule 2 ("Only the shell renders the masthead"), pages cannot opt in or out of chrome dimensions. The shell owns masthead dimensions for all consumers without per-page configuration. Step 4 is incoherent with the architecture. Critic must flag.

---

## Why this spec is a useful Critic-audit test

It blends three classes of failure that the Critic role is supposed to catch:
1. **Internal contradiction** (constraint section vs. implementation section) — Critic's primary job
2. **Constraint violation against a locked governance doc** (CLAUDE.md sessionStorage rule)
3. **Architecture violation against page-shell.js conventions** (memory #21 entry on page-shell band-aware composition)

If the Critic catches contradiction 1 but misses 2 or 3, that is a partial pass — adequate for the dry-run mechanics (detection works) but logged as a finding to feed `parbaughs-deep-research` skill or `CRITIC_P10_ADDENDUM.md` discipline. If Critic catches all 3 and refuses to approve, the validation passes with a clean record.
