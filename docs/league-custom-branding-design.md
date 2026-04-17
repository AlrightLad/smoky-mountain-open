# League Custom Branding — Design Stub

**Status:** Parked. Awaiting Stage 1 design work.
**Created:** 2026-04-17
**Blocks:** Phase 4 monetization, paid league tier features.

## Context

Today every league in Parbaughs shares the platform's visual identity — eight built-in themes, the gold wordmark, the Playfair display font. At scale this creates pressure: active leagues develop their own identities off-platform (group chat names, custom scorecards, crew logos) and want to bring that identity into the app. v8.0 governance resolved this is out of v8 scope (decision 8.2.a) and, when built, will be a paid commissioner feature. The paywall serves two purposes: validates commitment before the platform invests in design/storage/moderation overhead, and creates a natural upgrade trigger for power-user leagues.

This doc captures scope for when the feature is picked up, likely during Phase 4.

## High-level direction (from v8.0 governance review)

- League-level visual identity: logos, theme colors, league-specific banners.
- Only available to commissioners of paid-tier leagues (Pro or League+).
- Serves as a commitment validator — free-tier leagues don't get custom branding.
- Integrates with the eight built-in themes rather than replacing them — custom branding is additive cosmetics, not a full theme override.

## Open design questions

- **Upload moderation.** Who reviews logos/banners for inappropriate content? Options: (a) Founder-only manual approval, (b) admin queue with delegated reviewers, (c) automated image moderation API (Cloud Vision, Sightengine). (a) scales badly; (c) has false positives that frustrate legitimate uploads. What's the intake cadence we can support at launch?
- **Theme interaction with user cosmetics.** Does league theme override user theme while they're in that league? Or do user cosmetics (rings, name effects) always win for personal treatment and only backgrounds/accents shift to league brand? If league brand overrides user brand, users who paid for premium rings feel cheated. Recommended starting posture: user cosmetics always preserved on their name; league brand applies to league-scoped UI chrome (headers, backgrounds, accents).
- **Share card behavior.** Do shared scorecards carry the league's logo, or the Parbaughs wordmark, or both? What if the round was played at a non-league course — does league branding still apply? Share cards are a primary growth vector; they need explicit design thinking, not a default.
- **Storage economics.** Image uploads per league × active leagues × replacement frequency = Firestore/Storage line item. At what league count does storage cost become material? Budget for it (paid tier covers it) or cap per-league asset count?
- **Pricing tier placement.** Is custom branding a Pro feature, a League+ feature, or a separate add-on? If it's Pro (3 leagues), then commissioners of 2+ leagues suddenly have 2+ separate branding slots to maintain. If it's League+, it's available only to users running their commissioner life seriously, which is the right gate.
- **Moderation flow for inappropriate uploads.** After-the-fact takedown: who can report, who reviews, how fast is the platform's SLA? What happens to a league mid-uploaded-bad-logo when the commissioner is offline?
- **Brand vs founding league precedent.** The founding league (The Parbaughs) has the "founding" badge and narrative distinction baked in. If it also gets custom branding via the paid tier, does that undermine the "platform is neutral ground" posture? Or is it fine because Zach as Founder inherently has more visual presence already?
- **Reversal and changes.** How often can a commissioner change their league's branding? Free unlimited changes invite churn; one-change-per-season invites complaint. What's right?

## Not in scope for this doc

- Specific pricing for Pro / League+ tiers — belongs in a Phase 4 monetization design doc.
- The Pro / League+ product structure itself (what else is in each tier) — same.
- Implementation details — Storage bucket layout, image processing pipeline, Firestore schema extensions, rules. All Stage 2.
- User-level custom branding (custom profile backgrounds beyond the existing shop banners). Different feature, different doc.
