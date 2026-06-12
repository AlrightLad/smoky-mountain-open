---
status: open
title: Pick a golf-swing Lottie you love (unblocks the senior-grade tee-shot animation)
est_minutes: 3
unblocks: The post-sign-in tee-shot animation becomes genuine motion-designer quality (you pick the asset; I composite it with the clubhouse brand + wire the tap-to-enter + verify).
---

# Pick the tee-shot animation (your taste — I integrate it pro-grade)

## Why this is yours to pick
You've (rightly) rejected my hand-coded SVG golfer 3×. A genuine "senior FX/UX
/game-designer" swing realistically needs a professional motion asset — that's
what real designers ship (After Effects → Lottie). I can't pull a specific one
via tooling (LottieFiles blocks automated download), and the *aesthetic* is a
taste call that should be yours, not my guess. So: you pick the one you love, I
make it cinematic + on-brand.

## What to do (~3 min)
1. Browse golf-swing animations (free-for-commercial):
   - https://lottiefiles.com/free-animations/golf
   - https://lottiefiles.com/free-animations/golf-app-loader
   - (or IconScout: https://iconscout.com/lottie-animations/golf-swing)
2. Pick one that feels premium + fits the clubhouse vibe (a confident swing /
   tee-off; classy over cartoonish). Confirm the license is free for commercial
   use (most LottieFiles "free" ones are).
3. Download it as **Lottie JSON** (not GIF/MP4). Save it to exactly:
   **`C:\Users\Zach\smoky-mountain-open\public\lottie\tee-swing.json`**
   (create the `public\lottie\` folder; the file is small + commits fine).
4. Tell the agent "tee-swing lottie is in place" (or it'll detect it).

Prefer to just describe the vibe instead? Paste 2-3 LottieFiles links you like
and I'll pick + integrate the best fit.

## What the agent does once it's there
- Lazy-loads lottie-web (from the already-CSP-allowed cdnjs), plays your asset on
  a branded sunset stage with the Parbaughs wordmark + "tap to enter," wired into
  the existing tap-to-enter + onboarding hand-off.
- Falls back to the current animation if the file is absent (no breakage).
- Verifies it frame-by-frame via capture (the intro renders pre-auth, so this one
  I CAN verify without the prod SA) before shipping to prod.

## Note
This + the prod-SA verification key (see prod-sa-verification.md) are the two
quick actions that unblock the two things you flagged: a senior-grade swing, and
real-league testing of the feed/profile/pulse.
