# External AI design critique — Gemini 2.5 Flash (free multimodal), 2026-06-13

Founder directive: "use online tools to grade and rate existing pages + see what
they'd alter." Tool: `scripts/_gemini-critique.mjs <png>` (brand-aware prompt —
knows the Fraunces/brass identity is intentional). Drives the 9.5 convergence pass.

## Sweep results — 7 pages captured fresh on staging (v8.25.95→.98) + critiqued
| Page | Gemini /10 | Genuine wins shipped | Misreads / brand-conflicts declined |
|---|---|---|---|
| Home | 8.0–8.5 | hero-sub legibility, Verify-btn green pop, greeting hierarchy (muted lead-in/bold name), First-Week + pulse breathing room | claret badge ("red"), AA-safe footer, "flatten editorial band to card", long-test-username line break |
| Round history | 8.2 | singular "Round" at count==1 | heat-map copy, legend +8px (marginal) |
| Feed | 7.8 | — | hole-score dots (the **Visual-Reference exception**, intentional), avatars already ringed, "serif body text" (breaks UI-sans system) |
| Standings | 8.0 | — | bolder numbers/header (marginal), "1 rd"→"1st in Rounds" (less accurate; eyebrow already says MOST ROUNDS) |
| Rich list | 8.0 | — | rank-1 chip is **already** `--cb-ink` on brass 5.87:1 AA (misread as white), bottom-nav "overlap" = full-page-screenshot artifact of position:fixed |
| Wagers | 7.5 | — | dashed border is the **canonical `.pf-empty`** recipe (app-wide), "custom icon set" out of scope (#42 done) |
| Chat | 7.5 | — | caught a loading-skeleton state (capture artifact), calendar/CTA→brass (taste) |

## KEY FINDING (evidence-based, 7 diverse pages)
The member pages are uniformly **7.5–8.7** with a **sound, consistent brand system**.
A single LLM critic is **prompted to emit 3 changes per page regardless of polish**
and anchors mobile screenshots around 8 — so on already-polished pages roughly:
- **~⅓ are misreads** of already-correct, AA-verified, intentional brand elements
  (claret badge read as "red", brass nav as "green", AA footer, the ranked-chip
  contrast, the hole-dot Visual-Reference colors).
- **~⅓ are taste-pushes against intentional brand** (serif body text, flatten the
  editorial stat-band to a card, recolor the canonical empty-state border).
- **~⅓ are genuine small wins** — all harvested from HOME + round-history this pass.

**Conclusion:** the Gemini-nit sweep hit firm diminishing returns after the HOME
wins. Acting on the misread/taste items = the over-correction regression risk
[[feedback_contrast_verify_each_change]] warns about. The remaining leap to **≥9.5**
needs (a) **Founder visual sign-off per AMD-028** (agent self-rating caps at 9.4),
and (b) the **premium raster shop/merch art** — Founder-gated on image-gen billing
(see `task-queue/founder/shop-art-imagegen-unblock.md`; 4 free gen paths evidenced
dead from this datacenter IP).

## How to use (kept for future passes)
Per page: `node scripts/verify-as-member.mjs <uid> <route> <label>` → capture →
`node scripts/_gemini-critique.mjs .claude/state/verify-<label>/*.png` → harvest
ONLY genuine wins (skip misreads of brand elements + taste-pushes) → ship → Founder
signs off ≥9.5 per AMD-028. Do NOT chase the score past ~8.5 on one page; spread
across pages and trust the harvest filter.
