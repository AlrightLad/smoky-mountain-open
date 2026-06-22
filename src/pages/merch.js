/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: MERCH — "the pro shop" The Tour Collection (coming soon)

   v8.25.18x (Founder 2026-06-14): brand-split rebuild. The P+rose mark is the
   TOUR / golf-aesthetic brand (rubber-hose is the separate leisure/casual line),
   so merch is sold the way real golf-apparel brands sell it: a realistic model
   wearing the line on a dramatic links course (Bandon-Dunes feel) leading the
   page, then a Holderness-&-Bourne tour CAPSULE — premium fabric, minimal
   branding, tour colorway (tournament white / tour navy / black / heather grey),
   NOT beige+green. All imagery generated via the parbaughs-image-gen skill
   (Vertex Imagen 4 → local finishing pass): ghost-mannequin packshots with the
   real P+rose crest composited in post + on-course campaign photography.
   Committed web assets in public/img/merch/ (NEVER img/gen/ — that's gitignored).
   ═══════════════════════════════════════════════════════════════════════════ */

Router.register("merch", function () {
  function imgUrl(name) {
    try { return new URL("img/merch/" + name, document.baseURI).href; }
    catch (e) { return "img/merch/" + name; }
  }

  // THE TOUR CAPSULE — P+rose, premium fabric, minimal branding, tour colorway.
  // v8.25.236 (Founder 2026-06-22): tour line = quarter-zip, hoodie (H&B Jackson
  // style), polo, vest (H&B Boyd style), cap (Titleist style). NO tee in tour —
  // the tee belongs to the leisure line. Imagen-4 ULTRA packshots + composited crest.
  var TOUR = [
    { img: "quarterzip.jpg", name: "The Fairway Quarter-Zip", note: "Tour-navy brushed knit · brass pull" },
    { img: "hoodie.jpg",     name: "The Clubhouse Hoodie",    note: "Charcoal merino-blend · quarter-zip hood" },
    { img: "polo.jpg",       name: "The Tour Pro Shirt",      note: "Tournament-white performance piqué" },
    { img: "vest.jpg",       name: "The Fairway Vest",        note: "Forest-green knit · brass zip" },
    { img: "hat.jpg",        name: "The Tour Cap",            note: "Structured twill · tour-navy brim" }
  ];

  // THE PRO SHOP — accessories carry the brand accents (forest green / brass).
  var ACCESSORIES = [
    { img: "headcovers.jpg",  name: "The Leather Headcovers", note: "Tooled leather · driver, woods, mallet & blade" },
    { img: "yardagebook.jpg", name: "The Yardage Book",       note: "Pocket course guide · hand-drawn hole maps" },
    { img: "balls.png",       name: "Parbaughs Golf Balls",   note: "Tour white · sleeve of three" },
    { img: "ballmarker.jpg",  name: "The Ball Marker",        note: "Struck antique brass" },
    { img: "tees.png",        name: "The Tees",               note: "Hardwood · club-colour bands" }
  ];

  // ── Editorial masthead ────────────────────────────────────────────────────
  var h = '<div class="roster-masthead" style="padding-bottom:6px"><button class="back" onclick="Router.back(\'more\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">Parbaughs · Pro Shop</div>';
  h += '<h1 class="roster-headline">The Tour Collection.</h1>';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.5;margin-top:12px;max-width:460px">Tournament-grade pieces in the colors the pros compete in — premium fabric, the quiet P+rose mark, nothing loud. <span style="color:var(--cb-brass-deep);font-weight:600">Coming soon.</span></div>';
  h += '</div>';

  // ── Cinematic on-course HERO (the golf appeal) — full-bleed links campaign ──
  h += '<div style="padding:8px 16px 4px"><div style="position:relative;border-radius:var(--r-4);overflow:hidden;box-shadow:var(--shadow-md);border:1px solid rgba(var(--cb-brass-rgb),.22);aspect-ratio:16/9;background:var(--cb-chalk-2)">';
  h += '<img src="' + imgUrl("lifestyle-fairway.jpg") + '" alt="A Parbaughs golfer on a coastal links fairway at golden hour" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">';
  h += '<div style="position:absolute;left:0;right:0;bottom:0;padding:30px 18px 14px;background:linear-gradient(to top,rgba(20,19,15,.74),rgba(20,19,15,.18),transparent)">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass-3)">Tour · Links · Parbaughs</div>';
  h += '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:23px;color:var(--cb-chalk);line-height:1.08;margin-top:4px">Made for the walk.</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:rgba(244,239,228,.86);margin-top:4px;max-width:420px">The tour line, on the kind of course it was built for.</div>';
  h += '</div></div></div>';

  // ── The Tour Capsule (2-up packshots) ──────────────────────────────────────
  h += '<div style="padding:20px 16px 0"><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:4px">The Tour Capsule</div>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-bottom:12px">Holderness &amp; Bourne restraint — let the fabric talk.</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  TOUR.forEach(function (it) {
    h += '<div style="background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm)">';
    h += '<div style="position:relative;background:var(--cb-chalk-2);aspect-ratio:1/1"><img src="' + imgUrl(it.img) + '" alt="' + escHtml(it.name) + '" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover"></div>';
    h += '<div style="padding:11px 12px 13px">';
    h += '<div style="font-family:var(--font-display);font-weight:600;font-size:14px;color:var(--cb-ink);line-height:1.2">' + escHtml(it.name) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:3px;line-height:1.35">' + escHtml(it.note) + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--cb-brass-deep);margin-top:8px">Coming Soon</div>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // ── Editorial lifestyle band (teebox + clubhouse) ──────────────────────────
  h += '<div style="padding:20px 16px 0"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  [["lifestyle-teebox.jpg", "On the tee"], ["lifestyle-clubhouse.jpg", "First light, first tee"]].forEach(function (pair) {
    h += '<div style="position:relative;border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm);border:1px solid var(--cb-chalk-3);aspect-ratio:3/4;background:var(--cb-chalk-2)">';
    h += '<img src="' + imgUrl(pair[0]) + '" alt="' + escHtml(pair[1]) + '" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover">';
    h += '<div style="position:absolute;left:0;right:0;bottom:0;padding:18px 12px 9px;background:linear-gradient(to top,rgba(20,19,15,.62),transparent)"><div style="font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--cb-chalk)">' + escHtml(pair[1]) + '</div></div>';
    h += '</div>';
  });
  h += '</div></div>';

  // ── The Pro Shop accessories (2-up) ────────────────────────────────────────
  h += '<div style="padding:20px 16px 0"><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:12px">The Pro Shop</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  ACCESSORIES.forEach(function (it) {
    h += '<div style="background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm)">';
    h += '<div style="position:relative;background:var(--cb-chalk-2);aspect-ratio:1/1"><img src="' + imgUrl(it.img) + '" alt="' + escHtml(it.name) + '" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover"></div>';
    h += '<div style="padding:11px 12px 13px">';
    h += '<div style="font-family:var(--font-display);font-weight:600;font-size:14px;color:var(--cb-ink);line-height:1.2">' + escHtml(it.name) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:3px;line-height:1.35">' + escHtml(it.note) + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--cb-brass-deep);margin-top:8px">Coming Soon</div>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // ── THE LEISURE LINE (v8.25.237 — loud rubber-hose graphic line per Founder spec:
  //    graphic tees + hoodies w/ front-chest P+rose & big back design, ankle socks).
  //    Rubber-hose art via Recraft (vector SVG); socks raster. ──
  var LEISURE_GRAPHIC = [
    { img: "leisure-tee1.svg",  name: "Swinger Tee",        note: "The follow-through, loud" },
    { img: "leisure-tee2.svg",  name: "Caddy Tee",          note: "Your caddy, on a tee" },
    { img: "leisure-tee3.svg",  name: "The P+Rose Tee",     note: "The mark, crossed clubs" },
    { img: "leisure-hoodie-front.svg", name: "P+Rose Hoodie · Front", note: "Chest mark · rubber-hose" },
    { img: "leisure-hoodie-back.svg",  name: "Parbaughs Hoodie · Back", note: "Big swing + the name up top" }
  ];
  var LEISURE_SOCK = [
    { img: "leisure-sock-men.jpg",   name: "Rubber-Hose Socks · Men's",   note: "Ankle · the fella" },
    { img: "leisure-sock-women.jpg", name: "Rubber-Hose Socks · Women's", note: "Ankle · the lady" }
  ];
  h += '<div style="padding:24px 16px 0"><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-claret)">Parbaughs · Leisure</div>';
  h += '<h2 style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:22px;color:var(--cb-ink);margin:2px 0 4px">Off the leash.</h2>';
  h += '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-bottom:12px">Loud rubber-hose graphics — tees, hoodies, and socks. <span style="color:var(--cb-brass-deep);font-weight:600">Coming soon.</span></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  LEISURE_GRAPHIC.forEach(function (it) {
    h += '<div style="background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm)">';
    h += '<div style="position:relative;background:var(--cb-chalk-2);aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;padding:10px"><img src="' + imgUrl(it.img) + '" alt="' + escHtml(it.name) + '" loading="lazy" style="display:block;width:100%;height:100%;object-fit:contain"></div>';
    h += '<div style="padding:10px 12px 12px"><div style="font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--cb-ink);line-height:1.2">' + escHtml(it.name) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px;line-height:1.3">' + escHtml(it.note) + '</div></div></div>';
  });
  LEISURE_SOCK.forEach(function (it) {
    h += '<div style="background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm)">';
    h += '<div style="position:relative;background:var(--cb-chalk-2);aspect-ratio:1/1"><img src="' + imgUrl(it.img) + '" alt="' + escHtml(it.name) + '" loading="lazy" style="display:block;width:100%;height:100%;object-fit:cover"></div>';
    h += '<div style="padding:10px 12px 12px"><div style="font-family:var(--font-display);font-weight:600;font-size:13px;color:var(--cb-ink);line-height:1.2">' + escHtml(it.name) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:2px;line-height:1.3">' + escHtml(it.note) + '</div></div></div>';
  });
  h += '</div></div>';

  // ── Note + maker's ribbon footer ───────────────────────────────────────────
  h += '<div style="padding:20px 16px 6px"><div style="background:var(--cb-chalk-2);border:1px solid rgba(var(--cb-brass-rgb),.22);border-radius:var(--r-2);padding:14px 16px;font-family:var(--font-ui);font-size:13px;color:var(--cb-charcoal);line-height:1.5">Not for sale yet — Mr Parbaugh will sound the horn when the shop opens. The line drops in seasonal releases, priced in real currency (no ParCoins — those are for the Pro Shop cosmetics). A separate rubber-hose leisure line follows. Member sizing to come.</div></div>';
  h += '<div style="text-align:center;padding:14px 16px 4px"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:3px;color:var(--cb-mute);text-transform:uppercase">Est · York PA · Parbaughs Golf Co.</span></div>';

  h += renderPageFooter();
  document.querySelector('[data-page="merch"]').innerHTML = h;
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="merch"] > *'), { gap: 44, duration: 300 });
});
