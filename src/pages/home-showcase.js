/* ═══════════════════════════════════════════════════════════════════════════
   PAGE: HOME-SHOWCASE — the desktop immersive brand showcase (HQ desktop P1)

   Founder 2026-06-15 (direction LOCKED): on desktop the app DIVERGES into an
   awwwards-level, brand-immersion experience — rubber-hose country club, NOT the
   muted editorial app feel — full-width, six bands: hero → art → merch → live
   changelog → community → join CTA. Build spec + phased plan (P1-P5):
   .claude/state/loops/HQ-DESKTOP-SHOWCASE-BUILD-SPEC.md

   THIS IS P1 — the scaffold. Standalone `showcase` route (additive, zero risk to
   the member home route); wires into the desktop home branch after Founder review.
   Bands use on-brand tokens + REAL committed assets (caddie portraits, crest) with
   a CSS placeholder hero; the premium rubber-hose hero/art imagery drops in at P5
   (art-gated). Full-bleed via the 100vw breakout helper so bands go edge-to-edge
   regardless of the app's content container.
   ═══════════════════════════════════════════════════════════════════════════ */

Router.register("showcase", function () {
  function asset(p) { try { return new URL(p, document.baseURI).href; } catch (e) { return p; } }

  // Full-bleed band: breaks out of any max-width container to span the viewport.
  function band(inner, style) {
    return '<section class="sc-band" style="width:100vw;margin-left:calc(50% - 50vw);' + (style || '') + '">' +
      '<div class="sc-band__inner" style="max-width:1200px;margin:0 auto;padding:0 32px">' + inner + '</div></section>';
  }

  var memberCount = (typeof PB !== "undefined" && PB.getPlayers) ? PB.getPlayers().length : 20;
  var ver = (typeof APP_VERSION !== "undefined") ? APP_VERSION : "";

  var h = '<div class="sc-wrap" style="overflow-x:hidden">';

  // ── BAND 1 — full-bleed HERO (P5: real rubber-hose country-club art via Recraft) ──
  h += '<section class="sc-hero" style="position:relative;width:100vw;margin-left:calc(50% - 50vw);min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;' +
    'background:url(' + asset('img/showcase/hero.jpg') + ') center/cover no-repeat, var(--cb-felt)">' +
    // Felt-tinted scrim so the white headline + CTAs stay legible over the warm art
    // (darker toward the center where the text block sits), brand mood preserved.
    '<div aria-hidden="true" style="position:absolute;inset:0;background:radial-gradient(75% 60% at 50% 52%, rgba(14,30,24,.62), rgba(14,30,24,.30) 80%, rgba(14,30,24,.12));pointer-events:none"></div>' +
    '<div class="sc-hero__content" style="position:relative;max-width:760px;padding:0 28px">' +
    '<div style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--cb-brass-3)">The Parbaughs · Est. 2026 · York, PA</div>' +
    '<h1 style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:clamp(44px,6vw,84px);line-height:.98;letter-spacing:-2px;color:var(--cb-chalk);margin:14px 0 0">Where the round never really ends.</h1>' +
    '<p style="font-family:var(--font-ui);font-size:clamp(15px,1.4vw,19px);color:rgba(244,239,228,.86);line-height:1.5;max-width:560px;margin:18px auto 0">A members-only golf clubhouse for a tight friend group — scores, seasons, wagers, trash talk, and a pro shop, all in one place.</p>' +
    '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:30px">' +
    '<button class="btn" style="background:var(--cb-brass);color:#231a07;border:none;font-weight:700;font-size:15px;padding:15px 28px;border-radius:var(--r-3, 10px);cursor:pointer" onclick="Router.go(\'home\')">Enter the clubhouse</button>' +
    '<button class="btn" style="background:transparent;color:var(--cb-chalk);border:1px solid rgba(244,239,228,.45);font-weight:600;font-size:15px;padding:15px 28px;border-radius:var(--r-3, 10px);cursor:pointer" onclick="Router.go(\'invite\')">Get an invite</button>' +
    '</div>' +
    '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:rgba(244,239,228,.5);text-transform:uppercase;margin-top:28px">▾ Welcome to the clubhouse</div>' +
    '</div></section>';

  // ── BAND 2 — ART SHOWCASE (the brand world; real caddie portraits) ────────────
  var caddies = [
    { img: "img/avatars/caddy-caddy.jpg", name: "Murphy", role: "Your steady guide" },
    { img: "img/avatars/caddy-oldtom.jpg", name: "Old Tom", role: "The gruff veteran" },
    { img: "img/avatars/caddy-birdie.jpg", name: "Birdie", role: "All hype, all the time" },
    { img: "img/avatars/caddy-bagroom.jpg", name: "Bag Room Guy", role: "A little heckle" }
  ];
  var artInner = '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--cb-brass);text-align:center">A world of its own</div>' +
    '<h2 style="font-family:var(--font-display);font-weight:700;font-size:clamp(30px,3.4vw,46px);color:var(--cb-ink);text-align:center;margin:8px 0 6px">Meet the caddies.</h2>' +
    '<p style="font-family:var(--font-ui);font-size:15px;color:var(--cb-charcoal);text-align:center;max-width:560px;margin:0 auto 30px">Four hand-drawn characters in the bag — each with their own voice. Pick yours and they walk every round with you.</p>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">';
  caddies.forEach(function (c) {
    artInner += '<figure style="margin:0;text-align:center">' +
      '<div style="aspect-ratio:1/1;border-radius:16px;overflow:hidden;border:1px solid var(--cb-chalk-3);box-shadow:var(--shadow-md);background:var(--cb-chalk-2)"><img src="' + asset(c.img) + '" alt="' + escHtml(c.name) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>' +
      '<figcaption style="font-family:var(--font-display);font-weight:700;font-size:17px;color:var(--cb-ink);margin-top:12px">' + escHtml(c.name) + '</figcaption>' +
      '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute)">' + escHtml(c.role) + '</div>' +
      '</figure>';
  });
  artInner += '</div>';
  h += band(artInner, 'background:var(--cb-paper);padding:72px 0;border-top:1px solid var(--cb-chalk-3)');

  // ── BAND 3 — MERCH storefront (Tour Collection teaser) ────────────────────────
  var tour = [
    { img: "polo.jpg",       name: "The Tour Pro Shirt", note: "Tournament-white performance piqué" },
    { img: "quarterzip.jpg", name: "The Fairway Quarter-Zip", note: "Tour-navy brushed knit · brass pull" },
    { img: "hoodie.jpg",     name: "The Clubhouse Hoodie", note: "Heavyweight black brushed fleece" },
    { img: "headcovers.jpg", name: "The Leather Headcovers", note: "Tooled leather · by club type" }
  ];
  var merchInner = '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--cb-brass-3);text-align:center">The Pro Shop</div>' +
    '<h2 style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:clamp(30px,3.4vw,46px);color:var(--cb-chalk);text-align:center;margin:8px 0 6px">The Tour Collection.</h2>' +
    '<p style="font-family:var(--font-ui);font-size:15px;color:rgba(244,239,228,.78);text-align:center;max-width:560px;margin:0 auto 30px">Tournament-grade pieces in the colors the pros compete in. <span style="color:var(--cb-brass-3);font-weight:600">Coming soon.</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px">';
  tour.forEach(function (t) {
    merchInner += '<div style="background:var(--cb-paper);border:1px solid rgba(var(--cb-brass-rgb),.25);border-radius:14px;overflow:hidden">' +
      '<div style="aspect-ratio:1/1;background:var(--cb-chalk-2);overflow:hidden"><img src="' + asset('img/merch/' + t.img) + '" alt="' + escHtml(t.name) + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></div>' +
      '<div style="padding:14px 14px 16px"><div style="font-family:var(--font-display);font-weight:700;font-size:15px;color:var(--cb-ink)">' + escHtml(t.name) + '</div>' +
      '<div style="font-family:var(--font-ui);font-size:12px;color:var(--cb-mute);margin-top:3px">' + escHtml(t.note) + '</div></div></div>';
  });
  merchInner += '</div>';
  h += band(merchInner, 'background:var(--cb-felt);padding:72px 0');

  // ── BAND 4 — LIVE CHANGELOG (proof of momentum) ───────────────────────────────
  var ships = [
    "9-over-9 shareable scorecard + a cleaner round breakdown",
    "A unified, premium bottom-nav icon set",
    "What's New, rebuilt as a versioned changelog you can browse",
    "Distance-to-green GPS, crowdsourced by the league"
  ];
  var clogInner = '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--cb-brass);text-align:center">Always shipping</div>' +
    '<h2 style="font-family:var(--font-display);font-weight:700;font-size:clamp(30px,3.4vw,46px);color:var(--cb-ink);text-align:center;margin:8px 0 6px">Better, every week.</h2>' +
    '<p style="font-family:var(--font-ui);font-size:14px;color:var(--cb-mute);text-align:center;margin:0 0 26px">Now on <strong style="color:var(--cb-brass-deep)">v' + escHtml(ver) + '</strong></p>' +
    '<div style="max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:12px">';
  ships.forEach(function (s) {
    clogInner += '<div style="display:flex;gap:12px;align-items:flex-start;background:var(--cb-paper);border:1px solid var(--cb-chalk-3);border-radius:12px;padding:14px 16px">' +
      '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="var(--cb-brass)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M3 8l3.5 3.5L13 4"/></svg>' +
      '<span style="font-family:var(--font-ui);font-size:14px;color:var(--cb-charcoal);line-height:1.4">' + escHtml(s) + '</span></div>';
  });
  clogInner += '</div>';
  h += band(clogInner, 'background:var(--cb-chalk-2);padding:72px 0;border-top:1px solid var(--cb-chalk-3)');

  // ── BAND 5 — COMMUNITY (the league is real) ───────────────────────────────────
  var commInner = '<div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--cb-brass);text-align:center">The clubhouse</div>' +
    '<h2 style="font-family:var(--font-display);font-weight:700;font-size:clamp(30px,3.4vw,46px);color:var(--cb-ink);text-align:center;margin:8px 0 26px">A real league, really playing.</h2>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:760px;margin:0 auto;text-align:center">' +
    '<div><div style="font-family:var(--font-display);font-weight:700;font-size:46px;color:var(--cb-brass-deep)">' + memberCount + '</div><div style="font-family:var(--font-mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--cb-mute)">Members</div></div>' +
    '<div><div style="font-family:var(--font-display);font-weight:700;font-size:46px;color:var(--cb-brass-deep)">3</div><div style="font-family:var(--font-mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--cb-mute)">Seasons a year</div></div>' +
    '<div><div style="font-family:var(--font-display);font-weight:700;font-size:46px;color:var(--cb-brass-deep)">∞</div><div style="font-family:var(--font-mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--cb-mute)">Trash talk</div></div>' +
    '</div>';
  h += band(commInner, 'background:var(--cb-paper);padding:72px 0');

  // ── BAND 6 — JOIN CTA ─────────────────────────────────────────────────────────
  var joinInner = '<div style="text-align:center;max-width:560px;margin:0 auto">' +
    '<h2 style="font-family:var(--font-display);font-style:italic;font-weight:700;font-size:clamp(32px,3.8vw,52px);color:var(--cb-chalk);margin:0">Pull up a chair.</h2>' +
    '<p style="font-family:var(--font-ui);font-size:15px;color:rgba(244,239,228,.8);margin:14px 0 26px">Invite-only — bring your foursome and start a season.</p>' +
    '<button class="btn" style="background:var(--cb-brass);color:#231a07;border:none;font-weight:700;font-size:15px;padding:15px 30px;border-radius:var(--r-3, 10px);cursor:pointer" onclick="Router.go(\'invite\')">Request an invite</button>' +
    '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:3px;color:rgba(244,239,228,.45);text-transform:uppercase;margin-top:34px">Parbaughs Golf Co · York PA</div>' +
    '</div>';
  h += band(joinInner, 'background:linear-gradient(160deg,var(--cb-felt),#0e2a20);padding:84px 0');

  h += '</div>';
  document.querySelector('[data-page="showcase"]').innerHTML = h;
  if (window.staggeredReveal) window.staggeredReveal(document.querySelectorAll('[data-page="showcase"] .sc-band, [data-page="showcase"] .sc-hero'), { gap: 80, duration: 420 });
});
