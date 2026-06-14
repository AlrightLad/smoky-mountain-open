/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: MERCH — "the pro shop" premium product preview (coming soon)

   v8.25.108 (Founder 2026-06-13/14): real product GALLERY built from Vertex
   Imagen 4 studio photography of BLANK premium pieces, then the Founder-approved
   P+rose brandmark composited onto each garment's embroidery position (cream/
   felt logo on cream surfaces, cream/brass knockout on the green quarter-zip) —
   "put the parbaugh logo on the items not the clubs logo." Holderness & Bourne
   editorial restraint; every piece labelled COMING SOON. Web-optimized JPGs in
   public/img/merch/ (~34-70kb each). Masthead + flat-lay hero + five-piece line.
   ═══════════════════════════════════════════════════════════════════════════ */

Router.register("merch", function () {
  function imgUrl(name) {
    try { return new URL("img/merch/" + name, document.baseURI).href; }
    catch (e) { return "img/merch/" + name; }
  }

  // v8.25.117 — Founder's full lineup (real-cash, seasonal). Realistic studio
  // photography (Vertex Imagen 4, vetted prompts) of BLANK premium pieces with
  // the P+rose mark composited at each embroidery spot; the leisure tee carries
  // a Cuphead-style cartoon print. Brand palette, deliberate colourway variation.
  var LINE = [
    { img: "hoodie.jpg",      name: "The Clubhouse Hoodie",  note: "Heavyweight black brushed fleece" },
    { img: "quarterzip.jpg",  name: "The Fairway Quarter-Zip", note: "Athletic four-way stretch · brass pull" },
    { img: "polo.jpg",        name: "The Tour Pro Shirt",    note: "Breathable tour piqué · felt-green collar" },
    { img: "tee.jpg",         name: "The Leisure Tee",       note: "Soft cotton · vintage cartoon print" },
    { img: "headcovers.jpg",  name: "The Leather Headcovers", note: "Tooled leather · driver, woods, mallet & blade" },
    { img: "yardagebook.jpg", name: "The Yardage Book",      note: "Forest-green leather · brass ribbon" },
    { img: "balls.jpg",       name: "Parbaughs Golf Balls",  note: "Tour white · sleeve of three" },
    { img: "ballmarker.jpg",  name: "The Ball Marker",       note: "Struck antique brass" },
    { img: "tees.jpg",        name: "The Tees",              note: "Hardwood · club-colour bands" }
  ];

  // Editorial masthead (shared roster recipe → brass rule + Fraunces headline)
  var h = '<div class="roster-masthead" style="padding-bottom:6px"><button class="back" onclick="Router.back(\'more\')" style="margin-bottom:12px">← Back</button>';
  h += '<div class="roster-eyebrow">Parbaughs · Pro Shop</div>';
  h += '<h1 class="roster-headline">The line.</h1>';
  h += '<div style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.5;margin-top:12px;max-width:440px">A first look at the Parbaughs collection — country-club staples in our colors. <span style="color:var(--cb-brass-deep);font-weight:600">Coming soon.</span></div>';
  h += '</div>';

  // Flat-lay hero
  h += '<div style="padding:8px 16px 4px">';
  h += '<div style="position:relative;border-radius:var(--r-4);overflow:hidden;box-shadow:var(--shadow-md);border:1px solid rgba(var(--cb-brass-rgb),.22)">';
  h += '<img src="' + imgUrl("flatlay.jpg") + '" alt="The Parbaughs collection — polo, cap, towel and headcover" loading="lazy" style="display:block;width:100%;height:auto">';
  h += '<div style="position:absolute;left:0;bottom:0;right:0;padding:26px 16px 12px;background:linear-gradient(to top,rgba(20,19,15,.62),transparent)">';
  h += '<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass-3)">The Collection</div>';
  h += '<div style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:22px;color:var(--cb-chalk);line-height:1.1;margin-top:3px">Pro-shop staples, Parbaughs colors.</div>';
  h += '</div></div></div>';

  // Line preview grid (2-up)
  h += '<div style="padding:18px 16px 0"><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-brass);margin-bottom:12px">Preview the line</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  LINE.forEach(function (it) {
    h += '<div style="background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:var(--r-3);overflow:hidden;box-shadow:var(--shadow-sm)">';
    h += '<div style="position:relative;background:var(--cb-chalk-2)"><img src="' + imgUrl(it.img) + '" alt="' + escHtml(it.name) + '" loading="lazy" style="display:block;width:100%;height:auto"></div>';
    h += '<div style="padding:11px 12px 13px">';
    h += '<div style="font-family:var(--font-display);font-weight:600;font-size:14px;color:var(--cb-ink);line-height:1.2">' + escHtml(it.name) + '</div>';
    h += '<div style="font-family:var(--font-ui);font-size:11px;color:var(--cb-mute);margin-top:3px;line-height:1.35">' + escHtml(it.note) + '</div>';
    h += '<div style="font-family:var(--font-mono);font-size:8.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--cb-brass-deep);margin-top:8px">Coming Soon</div>';
    h += '</div></div>';
  });
  h += '</div></div>';

  // Note + maker's ribbon footer
  h += '<div style="padding:18px 16px 6px"><div style="background:var(--cb-chalk-2);border:1px solid rgba(var(--cb-brass-rgb),.22);border-radius:var(--r-2);padding:14px 16px;font-family:var(--font-ui);font-size:13px;color:var(--cb-charcoal);line-height:1.5">Not for sale yet — the Commissioner will sound the horn when the shop opens. The line drops in seasonal releases, priced in real currency (no ParCoins — those are for the Pro Shop cosmetics). Member sizing to follow.</div></div>';
  h += '<div style="text-align:center;padding:14px 16px 4px"><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:3px;color:var(--cb-mute);text-transform:uppercase">Est · York PA · Parbaughs Golf Co.</span></div>';

  h += renderPageFooter();
  document.querySelector('[data-page="merch"]').innerHTML = h;
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="merch"] > *'), { gap: 44, duration: 300 });
});
