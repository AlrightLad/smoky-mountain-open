---
status: open
title: Premium swing animation — the free pool is exhausted (you pick/fund the asset; I integrate)
est_minutes: 5
unblocks: A flicker-FREE, professional tee-shot swing. You chose "premium/commissioned" 2026-06-13 after I proved the free options can't get there.
---

# UPDATE 2026-06-13: free Lottie pool exhausted — premium is the path (your call)
I render-vetted the situation frame-by-frame:
- The CURRENT swing (MJ-Mograph, free) renders CLEAN in every static frame, but has
  an inherent **torso/leg coplanar seam** that jitters in MOTION — that's the
  "knee flicker" you keep seeing. It persists across BOTH renderers (SVG jitters the
  seam → that's why a prior session moved to canvas → canvas still flickers for you).
  No patch (z-order, fills, strokes, renderer) fully kills a seam baked into the asset.
- The ONLY other free LottieFiles golfer figure is a guy **riding in a golf cart** —
  not a swing. The free figure pool is just these two.
So a flicker-free, "award-winning" swing needs a PREMIUM asset. You picked this path.

## What to do (pick ONE)
1. **Commission** a short (2-3s) golf tee-shot Lottie from a motion designer
   (Fiverr/LottieFiles marketplace ~$30-120). Ask for: clean limb separation (NO
   coplanar torso/leg seam), loopable or one-shot, exportable as Lottie JSON.
2. **Buy** a premium golfer-swing Lottie from lottiefiles.com/marketplace or
   iconscout (a few $). Confirm: it's a SWING (not idle/cart), Lottie JSON export,
   commercial license.
3. Send me 2-3 candidate links/files and I'll vet them frame-by-frame (same harness)
   + pick the cleanest.
Drop the Lottie JSON at **`C:\Users\Zach\smoky-mountain-open\public\lottie\tee-swing.json`**
and tell me — I recolor to brass/cream/felt, composite on the dawn scene, wire the
tap-to-enter, and verify frame-by-frame before prod.

(Original free-pick note kept below for reference — superseded by the above.)

---
status: superseded
title: Pick a golf-swing Lottie you love (free — superseded; free pool exhausted)
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
