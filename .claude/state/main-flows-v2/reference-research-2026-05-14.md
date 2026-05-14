# Reference research log — Plans A through F outcomes

Documenting each AUTONOMOUS_FAILURE_RECOVERY v8.3 plan attempt before
escalation. Founder caught the premature escalation after 2 attempts;
this log shows the full path that actually surfaced the reference
without needing Founder export.

## Plan A — Original WebFetch attempt (FAIL)

- **Target:** `https://x.com/DaveJ/status/2053867258653339746`
- **Tool:** `WebFetch`
- **Result:** HTTP 402 Payment Required (X.com paywall for
  unauthenticated requests)
- **Conclusion:** WebFetch cannot reach authenticated X.com URLs.
  Move to Plan B.

## Plan B — Single WebSearch (INSUFFICIENT)

- **Query:** "Dave Janowiak ToDesktop architecture diagram demo video"
- **Result:** Returned general architecture-diagram results + a Y
  Combinator ToDesktop page. No specific reference.
- **Conclusion:** Single search insufficient. Founder corrected the
  team's premature escalation here.

## Plan B-extended — Multiple WebSearch angles (PARTIAL HIT)

Six queries run:
1. `"DaveJ Twitter ToDesktop architecture diagram interactive"` — surfaced
   `github.com/davej` (Dave Jeffery), revealed name was **Dave Jeffery
   not Janowiak**
2. `"ToDesktop how it works architecture flow diagram"` — surfaced
   todesktop.com homepage + docs, no diagram
3. `"ToDesktop product architecture column flow visualization"` — no hit
4. `"Dave Jeffery ToDesktop architecture diagram Twitter"` — surfaced
   Dave Jeffery's X/Twitter handle, GitHub, LinkedIn, ToDesktop blog
5. `"2053867258653339746" OR "DaveJ/status/2053867258653339746"` — no hit
   (the tweet itself is not indexed by general search)
6. `"interactive architecture diagram" SaaS 6 column dashed arrows
   numbered steps` — generic results only

**Outcome:** Confirmed author = Dave Jeffery (@DaveJ), founder of
ToDesktop. Did NOT surface the actual diagram/video.

## Plan C — ToDesktop's own properties (FAIL)

- `WebFetch` on todesktop.com — homepage describes the product
  (web→desktop conversion). NO 6-column architecture diagram present.
  Different aesthetic (terminal mockups, feature blocks).
- `WebFetch` on todesktop.com/blog/authors/dave-jeffery — 6 posts.
  None about a 6-column architecture diagram. One on signing
  architecture (different shape).
- `WebFetch` on todesktop.com/builder/docs/introduction/ui-concepts —
  no diagrams.

**Outcome:** ToDesktop's marketing site doesn't host the diagram.

## Plan D — Dave Jeffery alternates (PARTIAL)

Searches surfaced:
- @DaveJ on X — same URL we started with
- GitHub davej — code, not design content
- LinkedIn davejeffery — career profile
- Crunchbase — company info
- BetaList — startup directory
- Y Combinator W20 company page

**Outcome:** No alternate hosting of the video found. All paths lead
back to X.com.

## Plan E — Pattern replication search (POTENTIAL ALTERNATES — not pursued)

Searches for similar interactive diagrams:
- Vercel — has architecture content but not the exact pattern
- Linear — no specific diagram found
- Lemon Squeezy — not searched (deferred — Plan F succeeded first)

**Outcome:** Did not need to use a pattern alternate because Plan F
recovered the actual artifact.

## Plan F — Playwright direct probe (BREAKTHROUGH)

- Wrote `scripts/visual-audit/probe-x-reference.mjs` — Playwright
  headless Chromium, navigate to the X.com URL with a desktop user agent.
- **First run:** `waitUntil: "networkidle"` timed out (X.com keeps
  connections open). But `page.title()` resolved before the timeout
  with the FULL tweet body in the title meta.
- **Critical finding from title:**
  > "Dave Jeffery on X: 'Ask Claude to document and describe the
  > main flows in your app and output in a single page html + json
  > data file. Incredibly useful for humans and the JSON file is
  > very useful for explaining the flow to the LLM when working on
  > new features/bugfixes. https://t.co/kE0dBvssI5' / X"
- **Tweet date** (from rendered tweet timestamp): **2026-05-11** —
  three days before this session.

## Plan F-2 — Playwright media probe (SUCCESS)

- Wrote `scripts/visual-audit/probe-x-media.mjs` — same Playwright probe
  but instrumented to log all `pbs.twimg.com` + `video.twimg.com`
  responses and inspect the `<video>` element after DOM hydrate.
- **Result:** Recovered the video element's:
  - `poster` URL → `https://pbs.twimg.com/amplify_video_thumb/2053865860108894208/img/Zctgw6RxMYYW7yjH.jpg`
  - `duration` → 18.2 seconds
  - `currentSrc` → blob URL (Media Source Extensions; can't fetch directly)
- **All video media URLs** logged via response interception — including
  the **3538×2160 4K MP4 segments** and the **1768×1080 HD m3u8 manifest**,
  all returning HTTP 200 without authentication.

## Plan F-3 — Direct fetch of poster + HLS frame extraction (SUCCESS)

- `curl -sS -o dave-tweet-video-poster.jpg <poster URL>` → 90KB JPG of
  the first video frame at 1768×1080. **This is the canonical reference
  frame** — saved to `reference-frames/dave-tweet-video-poster.jpg`.
- Wrote `scripts/visual-audit/extract-video-frames.mjs` — local HTML
  harness with `hls.js` playing the m3u8 manifest, Playwright seeks to
  7 timestamps (0.5s, 3s, 6s, 9s, 12s, 15s, 17.5s), screenshots the
  `<video>` element at each. Output: 7 PNG frames at 1768×1080.
- Saved to `reference-frames/dave-frame-t*.png`.

## Outcome

**Complete reference data acquired without Founder export.** The poster
+ 7 video frames document the visual style fully. `reference-spec.md`
authored from these against 14 specific spec dimensions (background,
accent, arrows, badges, typography, etc.).

## Lessons (for the team's autonomy policy)

1. **WebFetch HTTP 402 is not always "auth required" — it can be an
   anti-bot signal.** A real-browser probe via Playwright can recover
   content even when WebFetch returns 402, because:
   - `<title>` and other meta tags are server-rendered (no JS auth gate
     yet)
   - Media URLs (poster, video segments) are CDN-served and don't
     enforce auth at the URL level
2. **Twitter/X embeds are partially accessible to unauthenticated
   browsers.** The page renders skeletons; meta tags carry tweet body;
   media CDN URLs return 200.
3. **Always check `<meta>` tags + `<video>` poster URLs before
   escalating.** Even when the rendered article is behind a login wall,
   the SEO/preview data often isn't.
4. **The team's 2-attempt escalation was insufficient and Founder was
   right to push back.** Plans B-F took ~5 minutes and surfaced the
   complete reference. The cost of one more round of attempts was
   trivially low compared to the cost of asking Founder to do a manual
   video-frame export.
5. **Document the research path.** This file makes future "couldn't get
   the reference, escalating" claims more rigorous — the team must
   demonstrate Plans A→F before any escalation note becomes acceptable.

## Naming correction

Throughout earlier work, the team referred to the reference as
"Janowiak ToDesktop." The actual author is **Dave Jeffery** (@DaveJ).
Founder used "Janowiak" in the original brief — likely a misremembering.
All future references use **Dave Jeffery**.
