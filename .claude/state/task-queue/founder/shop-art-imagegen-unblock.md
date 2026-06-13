---
status: open
title: Unblock top-tier shop/merch art — flip ONE switch (Gemini billing) OR drop a Hugging Face token
est_minutes: 4
unblocks: The shop + merch "comical, redo them top-tier" ask. The whole generation pipeline is built and tested; it just needs one credential the environment can't self-provision. Once unblocked I generate, vet, and wire premium product renders into the Pro Shop with zero further input from you.
---

# Shop/merch art is one credential away from done

## Why this is yours (and only takes a tap)
You asked me to redo the shop items "top tier" and to "find a tool that is
free." I built the full pipeline (`scripts/_gen-gemini-art.mjs`) around the
Gemini key you dropped, and I ALSO went looking for a truly free path — but the
desktop this CLI runs on has a datacenter IP + no browser session, which trips
bot-protection / rate-limits on every free image generator. I tested four, with
evidence:

| Free path | Result from this machine |
|---|---|
| Gemini `gemini-2.5-flash-image` (your key) | HTTP 429 — `free_tier_requests: 0` (image models are **billing-only**; text/critique is free and I'm already using it) |
| Pollinations.ai (`image.pollinations.ai`) | HTTP 402 — "queue full for IP… pay to bypass" (datacenter IP hard-limited) |
| Craiyon API (`api.craiyon.com/v3`) | HTTP 403 — Cloudflare bot block |
| Craiyon via headless browser | Cloudflare + DALL-E-mini quality (would NOT be "top tier" anyway) |

So: high-quality generation needs a credential I can't create headless. Good news —
it's a 4-minute tap, and the cost is pocket change (~$0.03–0.04 per image; the
~7 assets I have queued = well under $1 total).

## Option A — enable billing on the Gemini key (recommended, best quality)
On your phone, signed into the same Google account the key belongs to:
1. Go to **https://aistudio.google.com/app/apikey**
2. Find the key (the one you sent me) → tap its project name → **"Set up billing"**
   (or open https://console.cloud.google.com/billing and link a card to that project).
3. That's it. Reply "billing's on" — I detect it and run the pipeline immediately.

(Image generation is the ONLY thing that needs billing. Nothing else in the app
touches it; the free text tier keeps doing the design critiques.)

## Option B — drop me a free Hugging Face token (no card at all)
If you'd rather not enable billing:
1. Make a free account at **https://huggingface.co/join** (no card).
2. **https://huggingface.co/settings/tokens** → "New token" → Read access → copy it.
3. Paste it to me in chat. I'll wire Hugging Face's free Flux/SDXL inference into
   the pipeline (comparable quality to Gemini, genuinely free).

## What I do the second either lands (zero further input from you)
- Run the generator over the queued catalog (brass pins, struck medallions,
  calfskin tags, sterling markers, the merch flat-lay — all on-brand cream/felt/brass).
- Vision-vet each render myself (the same capture→critique loop), regenerate the
  weak ones, drop only the winners into `public/img/gen/`.
- Wire them into `shop.js` / `merch.js`, V1-verify on staging, ship to prod.

## Meanwhile (so this never idles)
I'm NOT waiting on you to keep improving the shop — I'm continuing the per-page
9.5 critique sweep across the rest of the app, and the Pro Shop already scores
highest of all pages (8.7) on the external critique with the current vector art.
The generated raster is the *premium leap*; the shop is in good shape until then.
